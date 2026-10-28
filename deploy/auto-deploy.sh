#!/usr/bin/env bash
# Déploiement automatique (v1.9), lancé en tant que deploy depuis le dépôt du serveur :
#   deploy/auto-deploy.sh --auto      par recrutement-deploy.service (timer de 10 min, demandes de /admin/deploiement.html)
#   deploy/auto-deploy.sh             à la main : met tout de suite le dernier commit de main en ligne, avec les tests,
#                                     même en pause (ce n'est pas un moyen de diagnostic : voir deploy/README.md)
#   deploy/auto-deploy.sh --nettoyer  retire ce qu'un passage arrêté a laissé (ExecStopPost du service)
# Un passage teste le commit visé dans un worktree à part (jamais dans ce dépôt), le met en ligne par deploy/deploy.sh,
# et revient au commit d'avant si la mise en ligne échoue. Les décisions se prennent sur les fichiers de
# ~/.recrutement-deploiement ; du volume de l'api, seule la demande déposée par la page est lue. L'état affiché par la
# page (/data/etat/deploiement.json) n'en est qu'une copie, écrite par ecrire_etat (deploy/commun.sh).
set -uo pipefail   # pas -e : chaque échec est traité, enregistré et expliqué
umask 022          # le worktree d'essai est extrait comme deploy.sh extrait le dépôt

ETAT="$HOME/.recrutement-deploiement"
ESSAI="$ETAT/essai"
SURCHARGE="$ETAT/essai-images.yaml"
VERROU="$HOME/.recrutement-auto-deploy.lock"
VERROU_DEPLOY="$HOME/.recrutement-deploy.lock"   # celui de deploy/deploy.sh (et de deploy/backup.sh)
PROJET_ESSAI=recrutement-essai
ETIQUETTE_ESSAI=fr.yeita.projet=recrutement-essai
MAX_PASSAGES=30
MAX_LIGNES=300

# Durées (secondes), réglables pour les essais ; les unités ne les fixent pas. Le budget de recrutement-deploy.service
# (TimeoutStartSec=4h) suppose ces valeurs par défaut.
duree() { case "${1:-}" in ''|*[!0-9]*) echo "$2" ;; *) echo "$1" ;; esac; }
ATTENTE_VERROU=$(duree "${AUTO_DEPLOY_ATTENTE_VERROU:-}" 1800)
ATTENTE_DEPLOY=$(duree "${AUTO_DEPLOY_ATTENTE_DEPLOY:-}" 900)
DUREE_ETAPE=$(duree "${AUTO_DEPLOY_DUREE_ETAPE:-}" 1200)
ATTENTE_DOCKER=$(duree "${AUTO_DEPLOY_ATTENTE_DOCKER:-}" 60)

MOTIF_COMMIT='^[0-9a-f]{7,40}$'
MOTIF_LE='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$'
MOTIF_PAR='^[a-z0-9._%+-]+@[a-z0-9.-]+$'

info() { echo "· $*"; }
arret() { echo "ARRÊT : $*" >&2; exit 1; }

# --- JSON écrit par le shell (aucun jq ni python sur le serveur) ---
# Texte quelconque → contenu d'une chaîne JSON : \ et " échappés, tabulations et retours chariot codés, autres
# caractères de contrôle et octets UTF-8 invalides retirés, lignes jointes par \n.
json_texte() {
  iconv -f UTF-8 -t UTF-8 -c 2>/dev/null | LC_ALL=C sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' -e 's/\r/\\r/g' \
    | LC_ALL=C tr -d '\000-\010\013\014\016-\037' \
    | LC_ALL=C awk 'BEGIN { ORS = "" } NR > 1 { print "\\n" } { print }'
}
js() { printf '"%s"' "$(printf '%s' "$1" | json_texte)"; }
# Fichier clé=valeur (demande prise, pause, en-cours, retour-ko) : valeur d'une clé.
cle() { sed -n "s/^$1=//p" "$2" 2>/dev/null | head -n 1; }

# --- Commits ---
court() { git rev-parse --short "$1" 2>/dev/null; }
json_commit() {   # json_commit <hash complet> → {"commit","court","message","auteur"}
  if [ -z "$1" ] || ! git cat-file -e "$1^{commit}" 2>/dev/null; then echo null; return; fi
  printf '{"commit":%s,"court":%s,"message":%s,"auteur":%s}' "$(js "$1")" "$(js "$(court "$1")")" \
    "$(js "$(git log -1 --format=%s "$1")")" "$(js "$(git log -1 --format=%an "$1")")"
}

# --- État de l'hôte (~/.recrutement-deploiement) ---
lire_fichier() { [ -f "$ETAT/$1" ] && head -n 1 "$ETAT/$1"; }
ecrire_fichier() { printf '%s\n' "$2" > "$ETAT/.$1.tmp" && mv "$ETAT/.$1.tmp" "$ETAT/$1"; }
DERNIER_CONTROLE=""; FETCH=ok; CODE=0

# deploiement.json : la vue de la page, reconstruite en entier à partir des fichiers de l'hôte ; un échec d'écriture
# n'arrête rien et ne change aucune décision (journal seulement).
ecrire_vue() {
  DERNIER_CONTROLE=$(maintenant)
  local deploye incertain=false pause=null en_cours=null retour_ko=null echec=null main_json passages f premier=1
  deploye=$(lire_fichier deploye)
  if [ -z "$deploye" ] || [ "$(git rev-parse HEAD)" != "$deploye" ] || [ -e "$ETAT/incertain" ]; then incertain=true; fi
  if [ -f deploy/PAUSE ]; then
    pause=$(printf '{"depuis":%s,"par":%s,"commit":%s}' "$(js "$(cle le deploy/PAUSE)")" "$(js "$(cle par deploy/PAUSE)")" "$(js "$(court "$(cle commit deploy/PAUSE)")")")
  fi
  if [ -f "$ETAT/en-cours" ]; then
    en_cours=$(printf '{"depuis":%s,"etape":%s,"etape_depuis":%s,"commit":%s,"declencheur":{"type":%s,"par":%s}}' \
      "$(js "$(cle debut "$ETAT/en-cours")")" "$(js "$(cle etape "$ETAT/en-cours")")" "$(js "$(cle etape_debut "$ETAT/en-cours")")" \
      "$(json_commit "$(cle commit "$ETAT/en-cours")")" "$(js "$(cle declencheur "$ETAT/en-cours")")" "$(js "$(cle par "$ETAT/en-cours")")")
  fi
  if [ -f "$ETAT/retour-ko" ]; then
    retour_ko=$(printf '{"type":%s,"le":%s,"etape":%s,"commit":%s,"avant":%s}' "$(js "$(cle type "$ETAT/retour-ko")")" \
      "$(js "$(cle le "$ETAT/retour-ko")")" "$(js "$(cle etape "$ETAT/retour-ko")")" \
      "$(json_commit "$(cle commit "$ETAT/retour-ko")")" "$(json_commit "$(cle avant "$ETAT/retour-ko")")")
  fi
  [ -n "$(lire_fichier echec)" ] && echec=$(json_commit "$(lire_fichier echec)")
  main_json=$(json_commit "$(git rev-parse --verify --quiet origin/main)")
  passages=""
  # shellcheck disable=SC2012 # noms écrits par ce script : AAAAMMJJTHHMMSS.NNNNNNNNNZ-pid.json
  for f in $(ls -1 "$ETAT/passages" 2>/dev/null | sort -r | head -n "$MAX_PASSAGES"); do
    [ $premier = 1 ] || passages+=","
    passages+=$(cat "$ETAT/passages/$f"); premier=0
  done
  local vue
  vue=$(printf '{"maj":%s,"dernier_controle":{"le":%s,"fetch":%s},"en_ligne":%s,"incertain":%s,"dernier_main":%s,"pause":%s,"echec":%s,"retour_ko":%s,"en_cours":%s,"passages":[%s]}' \
    "$(js "$DERNIER_CONTROLE")" "$(js "$DERNIER_CONTROLE")" "$(js "$FETCH")" "$(json_commit "${deploye:-$(git rev-parse HEAD)}")" "$incertain" \
    "$main_json" "$pause" "$echec" "$retour_ko" "$en_cours" "$passages")
  ecrire_etat deploiement.json "$vue" || echo "Attention : l'état de la page (deploiement.json) n'a pas pu être écrit." >&2
}

# --- Passage enregistré ---
P_ID=""; P_DEBUT=""; P_DECL=""; P_PAR=""; P_COMMIT=""; P_RESULTAT=""; P_MOTIF=""; P_ETAPES=""
debut_passage() {   # debut_passage <déclencheur> <par> <commit complet ou vide>
  P_ID="$(date -u +%Y%m%dT%H%M%S.%NZ)-$$"; P_DEBUT=$(maintenant)   # se trie dans l'ordre des passages
  P_DECL=$1; P_PAR=$2; P_COMMIT=$3; P_RESULTAT=""; P_MOTIF=""; P_ETAPES=""
}
etape_json() {   # etape_json <nom> <statut> <durée> <fichier de sortie ou vide>
  local sortie=""
  [ -n "$4" ] && [ -f "$4" ] && sortie=$(tail -n "$MAX_LIGNES" "$4" | cut -c1-2000)   # 300 lignes de 2 000 caractères au plus
  [ -z "$P_ETAPES" ] || P_ETAPES+=","
  P_ETAPES+=$(printf '{"nom":%s,"statut":%s,"duree_s":%s,"sortie":%s}' "$(js "$1")" "$(js "$2")" "$3" "$(js "$sortie")")
}
fin_passage() {   # fin_passage <résultat> <motif>
  P_RESULTAT=$1; P_MOTIF=$2
  local f="$ETAT/passages/$P_ID.json"
  printf '{"id":%s,"debut":%s,"fin":%s,"declencheur":{"type":%s,"par":%s},"commit":%s,"branche":"main","resultat":%s,"motif":%s,"etapes":[%s]}' \
    "$(js "$P_ID")" "$(js "$P_DEBUT")" "$(js "$(maintenant)")" "$(js "$P_DECL")" "$(js "$P_PAR")" "$(json_commit "$P_COMMIT")" \
    "$(js "$P_RESULTAT")" "$(js "$P_MOTIF")" "$P_ETAPES" > "$f.tmp" && mv "$f.tmp" "$f"
  # shellcheck disable=SC2012 # idem
  ls -1 "$ETAT/passages" | sort -r | tail -n "+$((MAX_PASSAGES + 1))" | while read -r vieux; do rm -f "$ETAT/passages/$vieux"; done
  rm -f "$ETAT/en-cours"
  info "Passage $P_ID : $P_RESULTAT${P_MOTIF:+ ($P_MOTIF)}"
  case "$P_RESULTAT" in tests-ko|deploiement-ko|interrompu) CODE=1 ;; esac   # annulé, refusé : issues normales
}
en_cours() {   # en_cours <étape> : passage en cours, gardé par l'hôte (lu par R20 au passage suivant)
  { echo "debut=$P_DEBUT"; echo "etape=$1"; echo "etape_debut=$(maintenant)"; echo "commit=$P_COMMIT"; echo "avant=$AVANT"
    echo "declencheur=$P_DECL"; echo "par=$P_PAR"; echo "id=$P_ID"; } > "$ETAT/.en-cours.tmp" && mv "$ETAT/.en-cours.tmp" "$ETAT/en-cours"
  ecrire_vue
}
signaler_incertain() {   # signaler_incertain <type : retour-ko | interrompu | redeploiement-ko> <étape> <commit visé> <commit d'avant>
  touch "$ETAT/incertain"
  { echo "type=$1"; echo "le=$(maintenant)"; echo "etape=$2"; echo "commit=$3"; echo "avant=$4"; } > "$ETAT/retour-ko"
}

# --- Essai à part : worktree, conteneurs et images d'essai ---
nettoyer_essai() {
  local ids
  # shellcheck disable=SC2086 # une liste d'identifiants
  ids=$(docker ps -aq --filter "label=$ETIQUETTE_ESSAI" 2>/dev/null) && [ -n "$ids" ] && docker rm -f $ids >/dev/null 2>&1
  rm -rf "$ESSAI" "$SURCHARGE"
  git worktree prune 2>/dev/null
  # Par nom, jamais par identifiant ni -f : l'essai du commit en place a les mêmes couches que la production.
  local image
  for image in "$PROJET_ESSAI-front" "$PROJET_ESSAI-api"; do
    docker image inspect "$image" >/dev/null 2>&1 && docker image rm "$image" >/dev/null 2>&1
  done
  return 0
}

# etape <nom> <commande…> : lance une étape, enregistre statut, durée et sortie ; code de la commande.
etape() {
  local nom=$1; shift
  local sortie="$ETAT/.sortie-$nom" t0 code
  en_cours "$nom"
  info "Étape $nom…"
  t0=$(date +%s)
  "$@" > "$sortie" 2>&1; code=$?
  etape_json "$nom" "$([ $code = 0 ] && echo ok || echo ko)" "$(( $(date +%s) - t0 ))" "$sortie"
  cat "$sortie"
  return $code
}
etapes_non_lancees() { local n; for n in "$@"; do etape_json "$n" non-lancee 0 ""; done; }

lancer_tests() {   # lancer_tests <commit complet> : 0 si les trois étapes passent
  local image moi
  if ! git worktree add --quiet --detach "$ESSAI" "$1" > "$ETAT/.sortie-test-store" 2>&1; then
    etape_json test-store ko 0 "$ETAT/.sortie-test-store"; etapes_non_lancees npm-test build; return 1
  fi
  image=$(sed -n 's/^FROM \([^ ]*\).*/\1/p' "$ESSAI/docker/api.Dockerfile" 2>/dev/null | head -n 1)
  case "$image" in ''|-*|*[!A-Za-z0-9._/:@-]*) echo "Image Node introuvable dans docker/api.Dockerfile : « $image »." > "$ETAT/.sortie-test-store"
    etape_json test-store ko 0 "$ETAT/.sortie-test-store"; etapes_non_lancees npm-test build; return 1 ;; esac
  moi="$(id -u):$(id -g)"
  # Seul le worktree est monté : ni socket Docker, ni volume, ni .env, ni réseau de l'hôte, ni --privileged.
  local essai_run=(docker run --rm --label "$ETIQUETTE_ESSAI" --user "$moi" -e HOME=/tmp -v "$ESSAI:/w")
  etape test-store timeout "$DUREE_ETAPE" "${essai_run[@]}" --name "$PROJET_ESSAI-test-store" -w /w "$image" node tools/test-store.js \
    || { etapes_non_lancees npm-test build; return 1; }
  # npm ci dans api/ : api/.npmrc (ignore-scripts=true) s'applique.
  etape npm-test timeout "$DUREE_ETAPE" "${essai_run[@]}" --name "$PROJET_ESSAI-npm-test" -w /w/api "$image" \
    sh -c 'npm ci --no-audit --no-fund && npm test' || { etapes_non_lancees build; return 1; }
  # Construction : .env.example du commit (jamais le .env de production), autre projet, noms d'image d'essai
  # (compose.yaml fixe recrutement-front et recrutement-api : sans surcharge, l'essai écraserait les images en ligne).
  printf 'services:\n  front:\n    image: %s-front\n  api:\n    image: %s-api\n' "$PROJET_ESSAI" "$PROJET_ESSAI" > "$SURCHARGE"
  etape build timeout "$DUREE_ETAPE" docker compose -p "$PROJET_ESSAI" --env-file "$ESSAI/.env.example" \
    -f "$ESSAI/compose.yaml" -f "$SURCHARGE" build --progress plain || return 1
}

# --- Demande déposée par la page ---
D_ACTION=""; D_COMMIT=""; D_PAR=""; D_LE=""; DEMANDE=""   # DEMANDE : vide, prise, illisible, non-retiree
ATTENDRE_FIN=0
# Prise par un conteneur jetable (deploy ne lit pas le volume, V5) : renommage d'abord (aucune demande perdue entre
# lecture et retrait), puis lecture d'un fichier ordinaire seulement, 1 025 octets au plus (au-delà : refusée).
prendre_demande() {
  local brut code
  docker compose run --rm --no-deps -T api sh -c '
    d=/data/demandes; f=$d/deploiement.demande; p=$d/.prise
    # Un lien à la place du dossier mènerait l unité path (sur l hôte) ailleurs que ce conteneur : retiré, et refusé.
    if [ -L "$d" ] || { [ -e "$d" ] && [ ! -d "$d" ]; }; then rm -f "$d"; exit 3; fi
    [ -e "$f" ] || [ -L "$f" ] || exit 0
    rm -rf "$p" && mv -f "$f" "$p" || exit 3
    if [ -f "$p" ] && [ ! -L "$p" ] && [ "$(tr -d "\\000" < "$p" | wc -c)" = "$(wc -c < "$p")" ]; then printf "["; head -c 1025 "$p"; printf "]"; else printf "?"; fi
    rm -rf "$p"' > "$ETAT/.demande" 2>/dev/null; code=$?
  brut=$(cat "$ETAT/.demande"; echo x); brut=${brut%x}; rm -f "$ETAT/.demande"
  # Non retirée (dossier abîmé, .env illisible par Compose) : journal seulement, aucun passage enregistré (sinon une
  # demande qu'on ne peut pas retirer remplacerait l'historique de la page en 30 minutes).
  if [ $code != 0 ]; then DEMANDE=non-retiree; info "Demande non retirée : le conteneur n'a pas pu la prendre."; ATTENDRE_FIN=1; return; fi
  [ -z "$brut" ] && return
  DEMANDE=illisible
  case "$brut" in "["*"]") brut=${brut#[}; brut=${brut%]} ;; *) return ;; esac
  [ "$(printf '%s' "$brut" | LC_ALL=C wc -c)" -le 1024 ] || return
  local ligne nom vus=" "
  while IFS= read -r ligne || [ -n "$ligne" ]; do
    [ -z "$ligne" ] && continue
    nom=${ligne%%=*}
    [ "$nom" != "$ligne" ] || return
    case "$nom" in action|commit|par|le) ;; *) return ;; esac
    case "$vus" in *" $nom "*) return ;; esac   # clé en double
    vus+="$nom "
    printf -v "D_${nom^^}" '%s' "${ligne#*=}"
  done <<<"$brut"
  [ "$(wc -w <<<"$vus")" -eq 4 ] || return   # les quatre clés, une fois chacune
  [[ $D_PAR =~ $MOTIF_PAR ]] && [ ${#D_PAR} -le 254 ] && [[ $D_LE =~ $MOTIF_LE ]] || return
  case "$D_ACTION" in
    deployer) [ "$D_COMMIT" = main ] || [[ $D_COMMIT =~ $MOTIF_COMMIT ]] || return ;;
    reprendre) [ -z "$D_COMMIT" ] || return ;;
    *) return ;;
  esac
  DEMANDE=prise
}

# valider_commit <hash demandé> : CIBLE = hash complet, ou MOTIF de refus (spec R3).
CIBLE=""; MOTIF=""
valider_commit() {
  CIBLE=""; MOTIF=""
  [[ $1 =~ $MOTIF_COMMIT ]] || { MOTIF="commit mal formé"; return 1; }
  CIBLE=$(git rev-parse --verify --quiet "$1^{commit}") || { CIBLE=""; MOTIF="commit introuvable ou ambigu"; return 1; }
  # Sans -q : grep lit tout (sinon git rev-list reçoit SIGPIPE et pipefail ferait échouer la vérification).
  git rev-list --first-parent origin/main | grep -x "$CIBLE" >/dev/null || { MOTIF="ce commit n'a jamais été la pointe de main"; return 1; }
  git cat-file -e "$CIBLE:deploy/auto-deploy.sh" 2>/dev/null || { MOTIF="commit antérieur au déploiement automatique : deploy.sh $(court "$CIBLE") en SSH"; return 1; }
}

ecrire_pause() {   # ecrire_pause <par> <commit>
  (umask 077; printf 'le=%s\npar=%s\ncommit=%s\n' "$(maintenant)" "$1" "$2" > deploy/PAUSE)   # porte l'email de l'admin
  info "Déploiement automatique en pause (commit $(court "$2") demandé par $1)."
}

# --- Un passage complet : tests, mise en ligne, retour (spec R8 à R11, R19) ---
AVANT=""
passage() {   # passage <déclencheur> <par> <commit complet> <pause : oui/non>
  local decl=$1 par=$2 cible=$3 pause=$4 head_debut pause_debut=non sortie
  head_debut=$(git rev-parse HEAD); [ -f deploy/PAUSE ] && pause_debut=oui
  AVANT=$(lire_fichier deploye)
  debut_passage "$decl" "$par" "$cible"
  nettoyer_essai
  if ! lancer_tests "$cible"; then
    etapes_non_lancees deploy
    nettoyer_essai; ecrire_fichier echec "$cible"; fin_passage tests-ko ""; return
  fi
  nettoyer_essai

  # Verrou de deploy.sh (une sauvegarde le tient pendant sa copie) : attendu puis libéré, car deploy.sh le reprend.
  en_cours deploy
  if ! (exec 8>"$VERROU_DEPLOY"; flock -w "$ATTENTE_DEPLOY" 8); then
    etapes_non_lancees deploy
    fin_passage annule "verrou de deploy.sh occupé (sauvegarde ou déploiement à la main)"; return
  fi
  # Un déploiement fait à la main pendant les tests l'emporte (R19).
  if [ "$(git rev-parse HEAD)" != "$head_debut" ] || { [ "$decl" = automatique ] && [ $pause_debut = non ] && [ -f deploy/PAUSE ]; }; then
    etapes_non_lancees deploy
    fin_passage annule "déploiement fait à la main pendant le passage"; return
  fi
  [ "$pause" = oui ] && ecrire_pause "$par" "$cible"
  sortie="$ETAT/.sortie-deploy"
  if etape deploy env RECRUTEMENT_PAR_AUTO=1 deploy/deploy.sh "$cible"; then
    rm -f "$ETAT/incertain" "$ETAT/retour-ko"
    [ "$(lire_fichier echec)" = "$cible" ] && rm -f "$ETAT/echec"
    fin_passage deploye ""; return
  fi

  # Arrêt avant changement de commit : deploy.sh n'a pas écrit « · Dépôt sur » (R10).
  if ! grep -q '^· Dépôt sur' "$sortie"; then
    if grep -q 'un déploiement est déjà en cours' "$sortie"; then
      fin_passage annule "verrou de deploy.sh occupé (sauvegarde ou déploiement à la main)"; return
    fi
    ecrire_fichier echec "$cible"
    fin_passage deploiement-ko "$(grep -m 1 '^ARRÊT' "$sortie" || echo "arrêt avant changement de commit")"; return
  fi
  ecrire_fichier echec "$cible"
  if [ -z "$AVANT" ] || [ "$cible" = "$AVANT" ]; then
    # Redéploiement du commit en place (ou commit d'avant inconnu) : pas de retour vers lui-même.
    signaler_incertain redeploiement-ko deploy "$cible" "${AVANT:-$cible}"
    fin_passage deploiement-ko "mise en ligne ratée, pas de commit d'avant vers lequel revenir"; return
  fi
  retour "$cible"
}

# Retour automatique (R11) : le deploy.sh du commit d'avant, extrait sous le verrou de deploy.sh.
retour() {
  local cible=$1 sortie="$ETAT/.sortie-retour" pris
  en_cours retour
  pris=$( (exec 8>"$VERROU_DEPLOY"
    flock -w "$ATTENTE_DEPLOY" 8 || { echo verrou; exit; }
    [ "$(git rev-parse HEAD)" = "$cible" ] || { echo manuel; exit; }
    git checkout --quiet --detach "$AVANT" 2>&1 && echo extrait || echo "checkout" ) )
  case "$pris" in
    *extrait) ;;
    manuel) etapes_non_lancees retour; fin_passage annule "déploiement fait à la main pendant le passage"; return ;;
    *) etapes_non_lancees retour; signaler_incertain retour-ko retour "$cible" "$AVANT"
       fin_passage deploiement-ko "mise en ligne ratée, retour à $(court "$AVANT") impossible (${pris##*$'\n'})"; return ;;
  esac
  local essai=1 ok=non
  while :; do
    if etape retour env RECRUTEMENT_PAR_AUTO=1 deploy/deploy.sh "$AVANT"; then ok=oui; break; fi
    if [ $essai != 1 ] || ! grep -q 'un déploiement est déjà en cours' "$sortie"; then break; fi
    # Le verrou a été repris entre le checkout et ce deploy.sh (une sauvegarde l'attendait) : l'attendre ; si personne
    # n'a changé de commit entre-temps, rejouer le retour une fois.
    essai=2
    (exec 8>"$VERROU_DEPLOY"; flock -w "$ATTENTE_DEPLOY" 8) || break
    if [ "$(git rev-parse HEAD)" != "$AVANT" ]; then fin_passage annule "déploiement fait à la main pendant le passage"; return; fi
  done
  if [ $ok = oui ]; then
    rm -f "$ETAT/incertain" "$ETAT/retour-ko"
    fin_passage deploiement-ko "mise en ligne ratée, retour à $(court "$AVANT") réussi"
  else
    signaler_incertain retour-ko retour "$cible" "$AVANT"
    fin_passage deploiement-ko "mise en ligne ratée, retour à $(court "$AVANT") raté"
  fi
}

refuser() {   # refuser <déclencheur> <par> <motif> : passage « demande refusée », aucune étape lancée
  debut_passage "$1" "$2" ""
  etapes_non_lancees test-store npm-test build deploy
  fin_passage demande-refusee "$3"
}

# R20 : un en-cours laissé par un passage arrêté (verrou libre, donc fini) est enregistré « interrompu ».
reprendre_interrompu() {
  [ -f "$ETAT/en-cours" ] || return 0
  local f="$ETAT/en-cours" etape_c
  etape_c=$(cle etape "$f")
  P_ID=$(cle id "$f"); [ -n "$P_ID" ] || P_ID="$(date -u +%Y%m%dT%H%M%SZ)-interrompu"
  P_DEBUT=$(cle debut "$f"); P_DECL=$(cle declencheur "$f"); P_PAR=$(cle par "$f"); P_COMMIT=$(cle commit "$f"); P_ETAPES=""
  etape_json "$etape_c" ko 0 ""
  case "$etape_c" in deploy|retour) signaler_incertain interrompu "$etape_c" "$P_COMMIT" "$(cle avant "$f")" ;; esac
  fin_passage interrompu "interrompu pendant $etape_c"
}
# shellcheck disable=SC2317 # appelée par trap
sur_arret() {   # SIGTERM (arrêt du service, TimeoutStartSec) : enregistrer, nettoyer, sortir
  trap - TERM INT
  info "Arrêt demandé pendant le passage."
  reprendre_interrompu
  nettoyer_essai
  ecrire_vue
  exit 143
}

main() {
  [ "$(id -u)" -ne 0 ] || arret "à lancer en tant que deploy, pas en root."
  local mode=main
  case "${1:-}" in --auto) mode=auto ;; --nettoyer) mode=nettoyer ;; '') ;; *) echo "Usage : $0 [--auto|--nettoyer]" >&2; exit 2 ;; esac
  [ $# -le 1 ] || { echo "Usage : $0 [--auto|--nettoyer]" >&2; exit 2; }
  cd "$(dirname "$0")/.." || exit 1
  # shellcheck source=deploy/commun.sh
  . deploy/commun.sh
  local d
  for d in "$ETAT" "$ETAT/passages"; do [ -d "$d" ] || mkdir -m 700 "$d" || arret "$d ne peut pas être créé."; done
  if [ $mode = nettoyer ]; then nettoyer_essai; exit 0; fi

  exec 9>"$VERROU"
  if ! flock -n 9; then
    info "Un passage est en cours, attente…"
    flock -w "$ATTENTE_VERROU" 9 || arret "un passage tient le verrou depuis plus de $ATTENTE_VERROU s ($VERROU)."
  fi
  trap sur_arret TERM INT
  mkdir -p .git/info
  grep -qx '/deploy/PAUSE' .git/info/exclude 2>/dev/null || echo '/deploy/PAUSE' >> .git/info/exclude
  reprendre_interrompu
  nettoyer_essai

  # 1. La demande, retirée en premier (R6).
  if ! docker info >/dev/null 2>&1; then
    echo "Docker ne répond pas : nouvel essai au prochain passage." >&2
    sleep "$ATTENTE_DOCKER"; exit 1
  fi
  prendre_demande

  git fetch --quiet origin main 2>/dev/null || FETCH=echec
  local main_c; main_c=$(git rev-parse --verify --quiet origin/main)

  if [ "$DEMANDE" = illisible ]; then
    refuser demande "" "demande illisible"
  elif [ "$DEMANDE" = prise ]; then
    info "Demande de $D_PAR ($D_LE) : $D_ACTION ${D_COMMIT:-}"
    if [ "$D_ACTION" = reprendre ]; then
      rm -f deploy/PAUSE; info "Pause retirée par $D_PAR."
    elif [ $FETCH != ok ]; then
      refuser demande "$D_PAR" "GitHub injoignable"
    elif [ "$D_COMMIT" = main ]; then
      if [ -n "$main_c" ]; then passage demande "$D_PAR" "$main_c" non; else refuser demande "$D_PAR" "dernier commit de main introuvable"; fi
    elif valider_commit "$D_COMMIT"; then
      passage demande "$D_PAR" "$CIBLE" "$([ "$CIBLE" != "$main_c" ] && echo oui || echo non)"
    else
      refuser demande "$D_PAR" "$MOTIF"
    fi
  fi

  # 2. Le lancement à la main : le dernier commit de main, tout de suite, avec les tests.
  if [ $mode = main ]; then
    if [ $FETCH != ok ]; then refuser ligne-de-commande "$(id -un)" "GitHub injoignable"
    else passage ligne-de-commande "$(id -un)" "$main_c" non; fi
  fi

  # 3. L'automatisme, dans cet ordre (R1).
  local deploye; deploye=$(lire_fichier deploye)
  if [ $FETCH != ok ] || [ -z "$main_c" ]; then :
  elif [ -f deploy/PAUSE ]; then :
  elif [ "$main_c" = "$(lire_fichier echec)" ]; then :
  elif [ -z "$deploye" ] || [ "$(git rev-parse HEAD)" != "$deploye" ] || [ -e "$ETAT/incertain" ]; then
    info "Commit en place incertain : le dernier commit de main est testé et mis en ligne."
    passage automatique "" "$main_c" non
  elif [ "$main_c" != "$deploye" ]; then
    passage automatique "" "$main_c" non
  fi

  ecrire_vue
  # Demande que le conteneur n'a pas pu retirer : au plus un passage par minute (l'unité path ne tombe pas, V12).
  [ $ATTENDRE_FIN = 1 ] && sleep "$ATTENTE_DOCKER"
  exit "$CODE"
}

# Tout le script est dans main, lu en entier avant d'agir : deploy.sh peut réécrire ce fichier pendant le passage.
main "$@"
# shellcheck disable=SC2317 # main sort toujours lui-même ; ce exit protège d'une suite ajoutée au fichier
exit
