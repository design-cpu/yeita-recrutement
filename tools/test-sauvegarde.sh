#!/usr/bin/env bash
# Tests de deploy/backup.sh et deploy/verif-disque.sh avec de faux outils (v1.7).
# À lancer en root dans un conteneur jetable ubuntu:26.04 qui a l'utilisateur deploy, /var/backups/recrutement
# (deploy, 700), docker (CLI et plugin compose : « docker compose config » est le vrai), age, python3 — jamais sur
# le serveur. Exemple depuis la racine du dépôt :
#   docker run --rm -v "$PWD:/depot:ro" <image du banc> bash /depot/tools/test-sauvegarde.sh /depot
# Simulés : docker compose exec/cp/ps/run (l'état des sauvegardes est écrit dans un faux volume), docker inspect/info,
# df (verif-disque). Réels : docker compose config, age, flock, find.
# Affiche OK/FAIL par vérification et finit par « TOUT OK » (code 0) ou « ÉCHECS : n » (code 1).
set -uo pipefail

DEPOT_SOURCE="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
COPIES=/var/backups/recrutement
ECHECS=0

ok() { echo "OK   $*"; }
ko() { echo "FAIL $*"; sed 's/^/       | /' "$T/sortie" 2>/dev/null | tail -n 4; ECHECS=$((ECHECS + 1)); }
verifie() { local nom=$1; shift; if "$@"; then ok "$nom"; else ko "$nom"; fi; }

[ "$(id -u)" -eq 0 ] || { echo "À lancer en root dans le banc jetable." >&2; exit 2; }
id deploy >/dev/null 2>&1 && [ -d "$COPIES" ] || { echo "Banc incomplet : utilisateur deploy et $COPIES attendus." >&2; exit 2; }
grep -q 'ID=ubuntu' /etc/os-release || { echo "Banc ubuntu attendu." >&2; exit 2; }

T=$(mktemp -d /tmp/test-sauvegarde.XXXXXX)
chmod 755 "$T"
trap 'rm -rf "$T"' EXIT

# --- Dépôt de travail (ce que les scripts lisent), propriété de deploy ---
DEPOT="$T/depot"
mkdir -p "$DEPOT"
cp -r "$DEPOT_SOURCE/deploy" "$DEPOT_SOURCE/compose.yaml" "$DEPOT_SOURCE/.env.example" "$DEPOT/"
chown -R deploy:deploy "$DEPOT"

# --- Clé age de test, base de test avec un repère ---
age-keygen -o "$T/cle.txt" 2>/dev/null
CLE_PUB=$(age-keygen -y "$T/cle.txt")
REPERE="REPERE-$RANDOM-CANDIDAT"
python3 - "$T/base.db" "$REPERE" <<'EOF'
import sqlite3, sys
c = sqlite3.connect(sys.argv[1]); c.execute("CREATE TABLE candidats (id, data)")
c.execute("INSERT INTO candidats VALUES ('cand-a-1', ?)", ('{"nom": "%s"}' % sys.argv[2],)); c.commit(); c.close()
EOF
# --- Faux outils, en tête du PATH ---
FAUX="$T/faux"; mkdir -p "$FAUX" "$T/volume/sauvegardes" "$T/journal"
chmod -R a+rwX "$T/volume" "$T/journal"
cat > "$FAUX/docker" <<'EOF'
#!/usr/bin/env bash
# Faux docker : « compose config » est le vrai ; le reste est simulé (FAUX_* dans l'environnement).
J=$FAUX_JOURNAL
case "$1 ${2:-}" in
  "compose config") exec /usr/bin/docker "$@" ;;
  "compose ps") echo conteneur-api ;;
  "compose exec")
    echo exec >> "$J/docker.log"
    [ "${FAUX_COPIE:-}" = echec ] && { echo "Base occupée" >&2; exit 1; }
    nom="recrutement-$(date -u +%F).db"
    cp "$FAUX_BASE" "$FAUX_VOLUME/sauvegardes/$nom"
    echo "Copie contrôlée (8192 octets)."; echo "Copies de plus de 2 jours supprimées : 0."
    echo "${FAUX_DERNIERE_LIGNE:-/data/sauvegardes/$nom}" ;;
  "compose cp")
    [ "${FAUX_CP:-}" = echec ] && { echo "Error: no such file" >&2; exit 1; }
    cp "$FAUX_VOLUME/${3#api:/data/}" "$4" ;;
  "compose run")
    # État des sauvegardes : le fichier visé est le dernier mot de la commande (mv … /data/etat/<fichier>).
    [ "${FAUX_RUN:-}" = echec ] && { echo "Cannot connect to the Docker daemon" >&2; exit 1; }
    cible="${!#}"; cible="${cible##*/data/etat/}"
    mkdir -p "$FAUX_VOLUME/etat"; cat > "$FAUX_VOLUME/etat/$cible"; echo "$cible" >> "$J/run.log" ;;
  "inspect -f") echo "${FAUX_SANTE:-healthy}" ;;
  "info -f")
    [ "${FAUX_INFO:-}" = echec ] && exit 1
    echo "${FAUX_DOCKER_DIR:-/var/lib/docker}" ;;
  *) echo "faux docker : appel inattendu : $*" >&2; exit 99 ;;
esac
EOF
cat > "$FAUX/age" <<'EOF'
#!/usr/bin/env bash
# Vrai age, sauf FAUX_AGE=clair (recopie le clair : le contrôle d'en-tête doit le refuser), =echec ou =lent.
case "${FAUX_AGE:-}" in
  clair) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] && exec /usr/bin/age "$@"; cp "${!#}" "$o" ;;
  echec) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] && exec /usr/bin/age "$@"; echo "age: no space left" >&2; exit 1 ;;
  lent) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] || sleep 30; exec /usr/bin/age "$@" ;;
  *) exec /usr/bin/age "$@" ;;
esac
EOF
cat > "$FAUX/df" <<'EOF'
#!/usr/bin/env bash
# FAUX_DF="echec" ou "<racine>,<docker>" (pourcentages) ; sinon le vrai df.
[ -z "${FAUX_DF:-}" ] && exec /usr/bin/df "$@"
[ "$FAUX_DF" = echec ] && { echo "df: erreur" >&2; exit 1; }
echo "Use%"; if [ "${!#}" = / ]; then echo " ${FAUX_DF%,*}%"; else echo " ${FAUX_DF#*,}%"; fi
EOF
chmod 755 "$FAUX"/*

# --- Outils d'un scénario ---
ecrire_env() { # ecrire_env [lignes supplémentaires…] : .env complet et valide, puis les lignes données (qui priment)
  {
    sed -e 's/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=/' "$DEPOT/.env.example" | grep -v -E '^AGE_RECIPIENT='
    echo "AGE_RECIPIENT=$CLE_PUB"
    printf '%s\n' "$@"
  } > "$DEPOT/.env"
  chown deploy "$DEPOT/.env"
}
reinitialiser() {
  find "$COPIES" -mindepth 1 -delete
  rm -rf "$T/volume/sauvegardes/"* "$T/volume/etat" "$T/journal/"*
  ecrire_env
}
# lancer <script> [VAR=val…] : lancé en deploy ; sortie dans $T/sortie, code dans $CODE.
lancer() {
  local script=$1; shift
  runuser -u deploy -- env -i HOME=/home/deploy PATH="$FAUX:/usr/sbin:/usr/bin:/sbin:/bin" \
    FAUX_JOURNAL="$T/journal" FAUX_VOLUME="$T/volume" FAUX_BASE="$T/base.db" RECRUTEMENT_ATTENTE_API=4 "$@" \
    bash "$DEPOT/deploy/$script" > "$T/sortie" 2>&1
  CODE=$?
}
# champ <fichier d'état> <clé> : valeur lue dans le faux volume (vide si le fichier ou la clé manque).
champ() { python3 -c 'import json,sys
try: print(json.load(open(sys.argv[1])).get(sys.argv[2], ""))
except Exception: print("")' "$T/volume/etat/$1" "$2"; }
aucun_clair() { [ -z "$(find "$COPIES" -name 'recrutement-*.db' -o -name '*.tmp')" ]; }
# Rien de secret ni de personnel dans la sortie et l'état.
rien_ne_fuit() { ! grep -rq -e "$REPERE" -e "$CLE_PUB" "$T/sortie" "$T/volume/etat" 2>/dev/null; }
ancienne_copie() { # une copie chiffrée de deux jours, qui doit survivre aux échecs
  echo ancienne > "$COPIES/recrutement-2026-01-01T030000Z.db.age"; chown deploy "$COPIES/recrutement-2026-01-01T030000Z.db.age"
  touch -d '2 days ago' "$COPIES/recrutement-2026-01-01T030000Z.db.age"
}
reussie_avant() { # une réussite déjà enregistrée, qui ne doit pas changer après un échec
  mkdir -p "$T/volume/etat"; echo '{"le": "2026-01-01T03:00:00Z", "resultat": "reussie", "fichier": "ancienne", "taille": 1, "copies": 1}' > "$T/volume/etat/sauvegarde-reussie.json"
  chown -R deploy "$T/volume/etat"
}

export -f champ; export T

echo "== CA4 : sauvegarde réussie, deux exécutions =="
reinitialiser
lancer backup.sh
verifie "CA4 code 0" [ "$CODE" -eq 0 ]
mapfile -t AGES < <(find "$COPIES" -name 'recrutement-*.db.age')
verifie "CA4 un .db.age horodaté" [ "${#AGES[@]}" -eq 1 ]
verifie "CA4 nom horodaté" bash -c '[[ "$(basename "$1")" =~ ^recrutement-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}Z\.db\.age$ ]]' _ "${AGES[0]:-x}"
verifie "CA4 .db.age en 600" [ "$(stat -c %a "${AGES[0]:-/x}" 2>/dev/null)" = 600 ]
verifie "CA4 en-tête age" [ "$(head -n 1 "${AGES[0]:-/x}" 2>/dev/null)" = "age-encryption.org/v1" ]
verifie "CA4 déchiffrable, repère retrouvé" bash -c 'age -d -i "$1" "$2" | grep -aq "$3"' _ "$T/cle.txt" "${AGES[0]:-/x}" "$REPERE"
verifie "CA4 repère absent des octets du .db.age" bash -c '! grep -aq "$1" "$2"' _ "$REPERE" "${AGES[0]:-/x}"
verifie "CA4 aucun clair" aucun_clair
verifie "CA4 état : dernière tentative réussie" [ "$(champ sauvegarde-derniere.json resultat)" = reussie ]
verifie "CA4 état : réussite enregistrée avec le fichier" [ "$(champ sauvegarde-reussie.json fichier)" = "$(basename "${AGES[0]:-x}")" ]
verifie "CA4 état : taille et nombre de copies" bash -c '[ "$(champ sauvegarde-reussie.json taille)" -gt 0 ] && [ "$(champ sauvegarde-reussie.json copies)" = 1 ]'
verifie "CA4 rien ne fuit" rien_ne_fuit
sleep 1
lancer backup.sh
verifie "CA4 seconde exécution : deux .db.age" [ "$(find "$COPIES" -name '*.db.age' | wc -l)" -eq 2 ]
verifie "CA4 seconde exécution : 2 copies dans l'état" [ "$(champ sauvegarde-reussie.json copies)" = 2 ]
verifie "CA23 aucun appel à rclone ni curl" bash -c '! grep -q -E "rclone|curl" "$1"/deploy/backup.sh "$1"/deploy/verif-disque.sh "$1"/deploy/commun.sh' _ "$DEPOT"
echo "== CA5 : échec à chaque étape =="
for cas in "api non saine:FAUX_SANTE=starting" "copie dans le conteneur api:FAUX_COPIE=echec" \
           "copie dans le conteneur api:FAUX_DERNIERE_LIGNE=/data/autre.db" "récupération:FAUX_CP=echec" \
           "chiffrement:FAUX_AGE=echec" "chiffrement:FAUX_AGE=clair"; do
  etape=${cas%%:*}; var=${cas#*:}
  reinitialiser; ancienne_copie; reussie_avant
  lancer backup.sh "$var"
  verifie "CA5 $var : code non nul" [ "$CODE" -ne 0 ]
  verifie "CA5 $var : état « echec », étape « $etape »" bash -c '[ "$(champ sauvegarde-derniere.json resultat)" = echec ] && [[ "$(champ sauvegarde-derniere.json etape)" == "$1"* ]]' _ "$etape"
  verifie "CA5 $var : réussite précédente inchangée" [ "$(champ sauvegarde-reussie.json fichier)" = ancienne ]
  verifie "CA5 $var : aucun clair" aucun_clair
  verifie "CA5 $var : ancienne copie gardée" [ -f "$COPIES/recrutement-2026-01-01T030000Z.db.age" ]
  verifie "CA5 $var : rien ne fuit" rien_ne_fuit
done
verifie "CA5 FAUX_AGE=clair : rien gardé" [ -z "$(find "$COPIES" -name 'recrutement-2026-1*T*.db.age' -newer "$T/base.db")" ]
reinitialiser; chmod 750 "$COPIES"
lancer backup.sh
verifie "CA5 dossier des copies en 750 : échec écrit, aucune copie lancée" bash -c '[ "$1" -ne 0 ] && grep -q "pas en 700" "$2" && [ ! -s "$3" ] && [ "$(champ sauvegarde-derniere.json etape)" = "dossier des copies" ]' _ "$CODE" "$T/sortie" "$T/journal/docker.log"
chmod 700 "$COPIES"
reinitialiser
lancer backup.sh RECRUTEMENT_ATTENTE_API=1
verifie "CA7 durée d'attente invalide : refus" bash -c '[ "$1" -eq 1 ] && grep -q "durée d.attente invalide" "$2"' _ "$CODE" "$T/sortie"
reinitialiser; reussie_avant
lancer backup.sh FAUX_RUN=echec
verifie "R10 Docker ne répond pas pour l'état : code 1, message" bash -c '[ "$1" -eq 1 ] && grep -q "état des sauvegardes n.a pas pu être écrit" "$2"' _ "$CODE" "$T/sortie"
reinitialiser; rm -rf "$COPIES"
lancer backup.sh
verifie "R5 dossier des copies absent : échec écrit" bash -c '[ "$1" -eq 1 ] && [ "$(champ sauvegarde-derniere.json etape)" = "dossier des copies" ]' _ "$CODE"
install -d -m 700 -o deploy -g deploy "$COPIES"

echo "== CA6 : réglages refusés (docker compose config réel) =="
refus() { # refus <nom> <motif attendu dans le message> [VAR=val (env)] -- [lignes .env]
  local nom=$1 attendu=$2; shift 2; local envs=()
  while [ $# -gt 0 ] && [ "$1" != -- ]; do envs+=("$1"); shift; done; shift
  reinitialiser; ecrire_env "$@"
  lancer backup.sh "${envs[@]}"
  verifie "CA6 $nom : code 1" [ "$CODE" -eq 1 ]
  verifie "CA6 $nom : message « $attendu »" grep -q -- "$attendu" "$T/sortie"
  verifie "CA6 $nom : aucune copie lancée" [ ! -s "$T/journal/docker.log" ]
}
refus "AGE_RECIPIENT vide" AGE_RECIPIENT -- "AGE_RECIPIENT="
refus "valeur vide suivie d'un commentaire" "AGE_RECIPIENT est vide (seul un commentaire" -- "AGE_RECIPIENT=   # à remplir"
refus "valeur d'exemple" "AGE_RECIPIENT a encore sa valeur d'exemple" -- "$(grep '^AGE_RECIPIENT=' "$DEPOT/.env.example")"
refus "valeur d'exemple entre guillemets" "AGE_RECIPIENT a encore sa valeur d'exemple" -- "AGE_RECIPIENT=\"$(sed -n 's/^AGE_RECIPIENT=//p' "$DEPOT/.env.example")\""
refus "variable exportée dans le shell (valeur d'exemple)" AGE_RECIPIENT "AGE_RECIPIENT=$(sed -n 's/^AGE_RECIPIENT=//p' "$DEPOT/.env.example")" --
refus "clé SSH" "pas une clé SSH" -- "AGE_RECIPIENT=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl"
refus "age1abc" AGE_RECIPIENT -- "AGE_RECIPIENT=age1abc"
verifie "CA6 refus : état « echec » à l'étape réglages" [ "$(champ sauvegarde-derniere.json etape)" = "réglages" ]
reinitialiser; ecrire_env "AGE_RECIPIENT=$CLE_PUB   # clé du coffre"
lancer backup.sh
verifie "CA6 commentaire en fin de ligne sur une valeur valide : acceptée" [ "$CODE" -eq 0 ]
reinitialiser; ecrire_env "AGE_RECIPIENT=\"$CLE_PUB\""
lancer backup.sh
verifie "CA6 guillemets sur une valeur valide : acceptée" [ "$CODE" -eq 0 ]

echo "== CA7 : verrous, root =="
reinitialiser
runuser -u deploy -- flock "$COPIES/.backup.lock" sleep 5 & TENEUR=$!; sleep 0.5
lancer backup.sh; wait "$TENEUR"
verifie "CA7 verrou de sauvegarde pris : code 1" [ "$CODE" -eq 1 ]
verifie "CA7 verrou de sauvegarde pris : aucun état écrit" [ ! -e "$T/volume/etat" ]
reinitialiser
runuser -u deploy -- flock /home/deploy/.recrutement-deploy.lock sleep 6 & TENEUR=$!; sleep 0.5
lancer backup.sh RECRUTEMENT_ATTENTE_DEPLOIEMENT=2; wait "$TENEUR"
verifie "CA7 déploiement en cours : état « echec »" bash -c '[[ "$(champ sauvegarde-derniere.json etape)" == "attente d"* ]]'
reinitialiser
( cd "$DEPOT" && bash deploy/backup.sh ) > "$T/sortie" 2>&1; CODE=$?
verifie "CA7 root refusé" bash -c '[ "$1" -eq 1 ] && grep -q "pas en root" "$2"' _ "$CODE" "$T/sortie"

echo "== CA8 : rétention locale =="
vieille() { echo x > "$COPIES/$1"; chown deploy "$COPIES/$1"; touch -d "@$(( $(date +%s) - $2 * 60 ))" "$COPIES/$1"; }
reinitialiser
vieille recrutement-2025-01-01T000000Z.db.age $((30 * 1440 + 1))
vieille recrutement-2025-01-02T000000Z.db.age $((30 * 1440 - 1))
lancer backup.sh FAUX_AGE=echec
verifie "CA8 sauvegarde ratée : la copie de 30 j + 1 min est gardée" [ -f "$COPIES/recrutement-2025-01-01T000000Z.db.age" ]
sleep 1   # un nom par seconde : sinon le refus d'écraser (voulu) arrêterait la seconde exécution
lancer backup.sh
verifie "CA8 sauvegarde réussie : 30 j + 1 min supprimée" [ ! -f "$COPIES/recrutement-2025-01-01T000000Z.db.age" ]
verifie "CA8 sauvegarde réussie : 30 j − 1 min gardée" [ -f "$COPIES/recrutement-2025-01-02T000000Z.db.age" ]

echo "== R8 : clair laissé par une coupure, SIGTERM =="
reinitialiser
echo clair > "$COPIES/recrutement-2026-10-01.db"; chown deploy "$COPIES/recrutement-2026-10-01.db"
lancer backup.sh
verifie "R8 clair d'une coupure supprimé, sauvegarde réussie" bash -c '[ "$1" -eq 0 ] && [ ! -e "$2" ]' _ "$CODE" "$COPIES/recrutement-2026-10-01.db"
reinitialiser
( lancer backup.sh FAUX_AGE=lent; echo "$CODE" > "$T/code" ) & SAUVEGARDE=$!
sleep 3
pkill -TERM -u deploy; wait "$SAUVEGARDE"   # comme systemd : tout le groupe de processus reçoit SIGTERM
verifie "R8 SIGTERM pendant le chiffrement : code non nul" [ "$(cat "$T/code")" -ne 0 ]
verifie "R8 SIGTERM : état « chiffrement (age) (interrompue) »" [ "$(champ sauvegarde-derniere.json etape)" = "chiffrement (age) (interrompue)" ]
verifie "R8 SIGTERM : aucun clair" aucun_clair

echo "== CA9 : verif-disque.sh =="
reinitialiser
lancer verif-disque.sh FAUX_DOCKER_DIR=/var   # vrai df ; /var existe aussi dans un banc sans dockerd
verifie "CA9 vrai df : succès, état normal" bash -c '[ "$1" -eq 0 ] && [ "$(champ disque.json resultat)" = normal ] && [ "$(champ disque.json racine)" -ge 0 ]' _ "$CODE"
for c in "80,80:0:normal" "81,10:1:plein" "10,81:1:plein"; do
  IFS=: read -r df code res <<<"$c"
  reinitialiser; lancer verif-disque.sh FAUX_DF="$df" FAUX_DOCKER_DIR=/srv/docker
  verifie "CA9 df $df : code $code, état $res" bash -c '[ "$1" -eq "$2" ] && [ "$(champ disque.json resultat)" = "$3" ] && [ "$(champ disque.json racine),$(champ disque.json docker)" = "$4" ]' _ "$CODE" "$code" "$res" "$df"
done
reinitialiser; lancer verif-disque.sh FAUX_DF=echec
verifie "CA9 df en échec : code 1, état mesure-impossible" bash -c '[ "$1" -eq 1 ] && [ "$(champ disque.json resultat)" = mesure-impossible ]' _ "$CODE"
reinitialiser; lancer verif-disque.sh FAUX_INFO=echec
verifie "CA9 Docker ne répond pas : code 1, rien d'écrit" bash -c '[ "$1" -eq 1 ] && [ ! -e "$2" ]' _ "$CODE" "$T/volume/etat/disque.json"
reinitialiser; lancer verif-disque.sh FAUX_DF=10,10 FAUX_DOCKER_DIR=/srv/docker FAUX_RUN=echec
verifie "CA9 état non écrit : code 1" [ "$CODE" -eq 1 ]
( cd "$DEPOT" && bash deploy/verif-disque.sh ) > "$T/sortie" 2>&1; CODE=$?
verifie "CA9 root refusé" bash -c '[ "$1" -eq 1 ] && grep -q "pas en root" "$2"' _ "$CODE" "$T/sortie"

echo "== CA14 : prepare-serveur.sh sans age (ajout QA) =="
# PATH réduit à des liens vers tous les outils du banc sauf un ; le script s'arrête avant toute modification.
empreinte_systeme() { { cat /etc/passwd /etc/group; stat -c '%n %a %U' /var/backups/recrutement /home/deploy 2>/dev/null; ls -A /opt; } | sha256sum; }
for absent in age; do
  mkdir -p "$T/sans-$absent"
  for f in /usr/bin/* /usr/sbin/* /bin/* /sbin/*; do [ "$(basename "$f")" = "$absent" ] || ln -sf "$f" "$T/sans-$absent/" 2>/dev/null; done
  avant=$(empreinte_systeme)
  PATH="$T/sans-$absent" RECRUTEMENT_REPO=/nulle-part bash "$DEPOT/deploy/prepare-serveur.sh" "ssh-ed25519 AAAAqa qa" > "$T/sortie" 2>&1; CODE=$?
  verifie "CA14 sans $absent : code 1" [ "$CODE" -eq 1 ]
  verifie "CA14 sans $absent : message R13" grep -qF "« $absent » est absent. Installez-le vous-même (apt install age) ; ce script n'installe rien." "$T/sortie"
  verifie "CA14 sans $absent : rien modifié" [ "$avant" = "$(empreinte_systeme)" ]
done

echo
if [ "$ECHECS" -eq 0 ]; then echo "TOUT OK"; exit 0; else echo "ÉCHECS : $ECHECS"; exit 1; fi
