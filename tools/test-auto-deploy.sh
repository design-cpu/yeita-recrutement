#!/usr/bin/env bash
# Tests de deploy/auto-deploy.sh et de la pause de deploy/deploy.sh (v1.9), niveau A : vrais git, flock, dépôt nu ;
# faux docker, faux curl, deploy.sh factice dans les commits d'essai (le vrai deploy.sh est essayé à part, partie D).
# À lancer en root dans un conteneur jetable ubuntu:26.04 avec docker (CLI et plugin compose), git, python3 — jamais
# sur le serveur. Depuis la racine du dépôt :
#   docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot
# Le niveau B (vraie pile, vraies unités systemd) se déroule sur banc-1.7-systemd : voir la fiche de la tâche 06.
# Affiche OK/FAIL par vérification et finit par « TOUT OK » (code 0) ou « ÉCHECS : n » (code 1).
set -uo pipefail

DEPOT_SOURCE="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
ECHECS=0
ok() { echo "OK   $*"; }
ko() {
  echo "FAIL $*"; sed 's/^/       | /' "$T/sortie" 2>/dev/null | tail -n 6
  python3 -c "import json; d=json.load(open('$VOLUME/etat/deploiement.json')); print('       | vue : incertain=%s retour_ko=%s pause=%s dernier=%s' % (d['incertain'], (d['retour_ko'] or {}).get('type'), bool(d['pause']), d['passages'][0]['resultat'] if d['passages'] else None))" 2>/dev/null
  ECHECS=$((ECHECS + 1))
}
verifie() { local nom=$1; shift; if "$@"; then ok "$nom"; else ko "$nom"; fi; }

[ "$(id -u)" -eq 0 ] || { echo "À lancer en root dans le banc jetable." >&2; exit 2; }
# Le lanceur crée l'utilisateur deploy, écrit dans son dossier et efface des dépôts : jamais hors d'un conteneur jetable.
[ "${AUTO_DEPLOY_JETABLE:-}" = oui ] || { echo "Refusé : ce lanceur crée un utilisateur et efface des dossiers. Le lancer seulement dans un conteneur jetable, avec -e AUTO_DEPLOY_JETABLE=oui." >&2; exit 2; }
[ -f /.dockerenv ] || { echo "Refusé : pas dans un conteneur." >&2; exit 2; }
grep -q 'ID=ubuntu' /etc/os-release || { echo "Banc ubuntu attendu." >&2; exit 2; }
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy

T=$(mktemp -d /tmp/test-auto-deploy.XXXXXX); chmod 755 "$T"; chown deploy:deploy "$T"
trap 'rm -rf "$T"' EXIT
HOMED="$T/home"; ORIGINE="$T/origine.git"; TRAVAIL="$T/travail"; PROD="$T/prod"
VOLUME="$T/volume"; FAUX="$T/faux"; J="$T/journal"; ETATH="$HOMED/.recrutement-deploiement"
mkdir -p "$HOMED" "$VOLUME" "$FAUX" "$J"
chown deploy:deploy "$HOMED" "$J" "$VOLUME"
git config --system --add safe.directory '*'
D() { runuser -u deploy -- "$@"; }

# --- Faux docker : « compose run … api sh -c » joué sur un faux volume ; tests et construction pilotés par .essai/ ---
cat > "$FAUX/docker" <<'EOF'
#!/usr/bin/env bash
J=$FAUX_JOURNAL
echo "$*" >> "$J/docker.log"
marqueur() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | head -n 1; }
jouer() {   # jouer <fichier marqueur> <sortie par défaut>
  local s; s=$(marqueur "$1" sleep); [ -n "$s" ] && sleep "$s"
  if [ -f "${1%/*}/${1##*/}.sortie" ]; then cat "${1%/*}/${1##*/}.sortie"; else echo "$2"; fi
  local c; c=$(marqueur "$1" code); exit "${c:-0}"
}
case "$1" in
  info) [ "${FAUX_DOCKER:-}" = muet ] && { echo "Cannot connect to the Docker daemon" >&2; exit 1; }; echo ok ;;
  compose)
    shift; args=("$@"); sous=""
    for a in "$@"; do case "$a" in run|build|config) sous=$a; break ;; esac; done
    case "$sous" in
      config) exec /usr/bin/docker compose "${args[@]}" ;;
      run)
        [ "${FAUX_DOCKER:-}" = run-ko ] && { echo "service api : erreur de configuration" >&2; exit 1; }
        script="${!#}"; script=${script//\/data/$FAUX_VOLUME}
        sh -c "$script"; code=$?
        if [ -n "${FAUX_DEPOT_PENDANT:-}" ] && grep -q 'deploiement.demande' <<<"$script" && [ ! -e "$J/depot-fait" ]; then
          touch "$J/depot-fait"; cat "$FAUX_DEPOT_PENDANT" > "$FAUX_VOLUME/demandes/deploiement.demande"
        fi
        exit $code ;;
      build)
        f=""; prev=""; for a in "$@"; do [ "$prev" = -f ] && f="$f $a"; prev=$a; done
        for x in $f; do cp "$x" "$J/build-$(basename "$x")" 2>/dev/null; done
        wt=$(dirname "$(echo $f | cut -d' ' -f1)")
        jouer "$wt/.essai/build" "Image recrutement-essai-api Built" ;;
    esac ;;
  run)
    wt=""; for a in "$@"; do case "$a" in *:/w) wt=${a%:/w} ;; esac; done
    case "$*" in *tools/test-store.js*) jouer "$wt/.essai/test-store" "TOUT OK" ;; *) jouer "$wt/.essai/npm-test" "ℹ fail 0" ;; esac ;;
  ps) cat "$J/conteneurs" 2>/dev/null; exit 0 ;;
  rm) exit 0 ;;
  image) case "$2" in inspect) grep -qx "$3" "$J/images" 2>/dev/null ;; rm) sed -i "/^$3\$/d" "$J/images" 2>/dev/null; exit 0 ;; *) exit 0 ;; esac ;;
  *) echo "faux docker : appel inattendu : $*" >&2; exit 99 ;;
esac
EOF
chmod 755 "$FAUX/docker"

# --- Dépôt nu : un ancien commit sans auto-deploy.sh, puis la base (copie de l'arbre de travail), deploy.sh factice ---
D git init -q -b main --bare "$ORIGINE"
D git clone -q "$ORIGINE" "$TRAVAIL" 2>/dev/null
D git -C "$TRAVAIL" config user.email banc@yeita.fr; D git -C "$TRAVAIL" config user.name Banc
tar -C "$DEPOT_SOURCE" --exclude=.git --exclude=node_modules --exclude=_site --exclude=hlyja -cf - . | D tar -x -C "$TRAVAIL"
D mv "$TRAVAIL/deploy/auto-deploy.sh" "$T/auto-deploy.sh.vrai"
cp "$TRAVAIL/deploy/deploy.sh" "$T/deploy.sh.vrai"
D git -C "$TRAVAIL" add -A; D git -C "$TRAVAIL" commit -qm "ancien : avant le déploiement automatique"
D cp "$T/auto-deploy.sh.vrai" "$TRAVAIL/deploy/auto-deploy.sh"
cat > "$TRAVAIL/deploy/deploy.sh" <<'EOF'
#!/usr/bin/env bash
# deploy.sh factice du banc : verrou, changement de commit, « · Dépôt sur », deploye ; mode lu dans .essai/deploy du commit visé.
set -u
cd "$(dirname "$0")/.."
exec 9>"$HOME/.recrutement-deploy.lock"
flock -n 9 || { echo "ARRÊT : un déploiement est déjà en cours (verrou)." >&2; exit 1; }
echo "$(git rev-parse --short HEAD) -> $(git rev-parse --short "$1") PAR_AUTO=${RECRUTEMENT_PAR_AUTO:-}" >> "$FAUX_JOURNAL/deploy.log"
n=$(( $(cat "$FAUX_JOURNAL/appels" 2>/dev/null || echo 0) + 1 )); echo $n > "$FAUX_JOURNAL/appels"
grep -qx "$n" "$FAUX_JOURNAL/occupe" 2>/dev/null && { echo "ARRÊT : un déploiement est déjà en cours (verrou)." >&2; exit 1; }
mode=$(git show "$1:.essai/deploy" 2>/dev/null || echo ok)
[ -e "$FAUX_JOURNAL/deploy-ko" ] && mode=apres
[ "$mode" = avant ] && { echo "ARRÊT : réglage refusé (factice)." >&2; exit 1; }
git checkout --quiet --detach "$1"; echo "· Dépôt sur $(git rev-parse --short HEAD)"
[ "$mode" = lent ] && sleep "${FAUX_LENT:-3}"
[ "$mode" = apres ] && { echo "ÉCHEC : l'api n'est pas saine (factice)." >&2; exit 1; }
mkdir -p "$HOME/.recrutement-deploiement"; git rev-parse HEAD > "$HOME/.recrutement-deploiement/deploye"
echo "Déploiement réussi : $(git rev-parse --short HEAD)"
EOF
chmod 755 "$TRAVAIL/deploy/deploy.sh"
D git -C "$TRAVAIL" add -A; D git -C "$TRAVAIL" commit -qm "base 1.9"
D git -C "$TRAVAIL" push -q origin main
ANCIEN=$(D git -C "$TRAVAIL" rev-parse HEAD~1); BASE=$(D git -C "$TRAVAIL" rev-parse HEAD)

# commit_main <message> [fichier contenu]… : commit sur main, poussé ; affiche son hash.
commit_main() {
  local msg=$1; shift
  while [ $# -ge 2 ]; do mkdir -p "$(dirname "$TRAVAIL/$1")"; printf '%s\n' "$2" > "$TRAVAIL/$1"; chown -R deploy:deploy "$TRAVAIL"; shift 2; done
  date +%s%N > "$TRAVAIL/.essai-horodatage"; chown deploy:deploy "$TRAVAIL/.essai-horodatage"
  D git -C "$TRAVAIL" add -A >/dev/null; D git -C "$TRAVAIL" commit -qm "$msg"; D git -C "$TRAVAIL" push -q origin main
  D git -C "$TRAVAIL" rev-parse HEAD
}
# Nettoie les marqueurs .essai du commit suivant.
sans_marqueurs() { rm -rf "$TRAVAIL/.essai"; }

# --- Dépôt de production : clone, mis au commit de base comme après « deploy.sh » ---
D git clone -q "$ORIGINE" "$PROD"
D mkdir -m 700 "$ETATH"; echo "$BASE" | D tee "$ETATH/deploye" >/dev/null
D git -C "$PROD" checkout -q --detach "$BASE"
if [ -z "$BASE" ] || [ ! -d "$PROD/.git" ]; then echo "Mise en place du banc impossible (voir ci-dessus)." >&2; exit 2; fi

ENV_FAUX=(HOME="$HOMED" PATH="$FAUX:/usr/sbin:/usr/bin:/sbin:/bin" FAUX_JOURNAL="$J" FAUX_VOLUME="$VOLUME"
  AUTO_DEPLOY_ATTENTE_DOCKER=1 AUTO_DEPLOY_ATTENTE_VERROU=20 AUTO_DEPLOY_ATTENTE_DEPLOY=2 AUTO_DEPLOY_DUREE_ETAPE=20 LANG=C.UTF-8)
# lancer [options auto-deploy] : en tant que deploy, depuis un état neutre (env -i, umask 022), échéance de 60 s.
# shellcheck disable=SC2086 # EXTRA : affectations VAR=valeur, séparées exprès
lancer() { (cd "$PROD" && runuser -u deploy -- env -i "${ENV_FAUX[@]}" ${EXTRA:-} bash -c 'umask 022; exec timeout 60 deploy/auto-deploy.sh "$@"' _ "$@") > "$T/sortie" 2>&1; echo $? > "$T/code"; }
code() { cat "$T/code"; }
vue() { python3 -c "import json,sys; d=json.load(open('$VOLUME/etat/deploiement.json')); print(eval(sys.argv[1]))" "$1" 2>/dev/null; }
nb_passages() { find "$ETATH/passages" -name '*.json' 2>/dev/null | wc -l; }
dernier() { python3 -c "import json,sys; d=json.load(open('$VOLUME/etat/deploiement.json')); p=d['passages'][0]; print(eval(sys.argv[1]))" "$1" 2>/dev/null; }
derniere_demande() { python3 -c "import json,sys; d=json.load(open('$VOLUME/etat/deploiement.json')); p=next(x for x in d['passages'] if x['declencheur']['type']=='demande'); print(eval(sys.argv[1]))" "$1" 2>/dev/null; }
demande() { mkdir -p "$VOLUME/demandes"; printf '%s' "${1%x}" > "$VOLUME/demandes/deploiement.demande"; chown -R deploy:deploy "$VOLUME"; }
demande_ok() { demande "action=$1"$'\n'"commit=$2"$'\n'"par=adm@yeita.fr"$'\n'"le=2026-10-28T13:00:02.000Z"$'\n'; }
deploys() { wc -l < "$J/deploy.log" 2>/dev/null || echo 0; }
en_place() { D git -C "$PROD" rev-parse HEAD; }

echo "--- Refus du lanceur ---"
r=$(env -i PATH=/usr/bin:/bin bash "$0" "$DEPOT_SOURCE" 2>&1); c=$?
verifie "sans AUTO_DEPLOY_JETABLE=oui : refus, code 2" test "$c" = 2 -a -n "$(grep 'Refusé' <<<"$r")"

echo "--- CA1 : nouveau commit testé puis mis en ligne ---"
C1=$(commit_main "feat: premier commit automatique")
lancer --auto
verifie "code 0" test "$(code)" = 0
verifie "commit en place = nouveau commit" test "$(en_place)" = "$C1"
verifie "deploye écrit" test "$(cat "$ETATH/deploye")" = "$C1"
verifie "deploy.sh appelé avec RECRUTEMENT_PAR_AUTO=1" grep -q "PAR_AUTO=1" "$J/deploy.log"
verifie "passage « deploye », 4 étapes ok" test "$(dernier "p['resultat'],[e['statut'] for e in p['etapes']]")" = "('deploye', ['ok', 'ok', 'ok', 'ok'])"
verifie "étapes nommées et sorties enregistrées" test "$(dernier "[e['nom'] for e in p['etapes']], p['etapes'][0]['sortie']")" = "(['test-store', 'npm-test', 'build', 'deploy'], 'TOUT OK')"
verifie "commit (court, message, auteur), déclencheur automatique, branche main" test "$(dernier "p['commit']['court'] != '' and p['commit']['message'], p['commit']['auteur'], p['declencheur']['type'], p['branche']")" = "('feat: premier commit automatique', 'Banc', 'automatique', 'main')"
verifie "vue : en ligne = C1, non incertain, pas de pause" test "$(vue "d['en_ligne']['commit'], d['incertain'], d['pause'], d['en_cours']")" = "('$C1', False, None, None)"
verifie "aucun conteneur ni dossier d'essai restant" test ! -e "$ETATH/essai"
verifie "dépôt de production propre" test -z "$(D git -C "$PROD" status --porcelain)"
n=$(nb_passages); lancer --auto
verifie "passage suivant sans nouveau commit : rien d'enregistré, rien de déployé" test "$(nb_passages)" = "$n" -a "$(deploys)" = 1

echo "--- CA10 (A) : isolement des tests ---"
verifie "build : projet recrutement-essai, .env.example, surcharge des noms d'image" grep -q -- "-p recrutement-essai --env-file $ETATH/essai/.env.example -f $ETATH/essai/compose.yaml -f $ETATH/essai-images.yaml build" "$J/docker.log"
verifie "surcharge : recrutement-essai-front et -api" grep -q "image: recrutement-essai-front" "$J/build-essai-images.yaml"
lignes_run=$(grep '^run ' "$J/docker.log")
verifie "conteneurs de test : seul le worktree monté, ni socket, ni --privileged, ni réseau hôte" test "$(grep -c -- ' -v ' <<<"$lignes_run")" = "$(wc -l <<<"$lignes_run")" -a -z "$(grep -E 'docker.sock|privileged|network|recrutement_data|\.env ' <<<"$lignes_run")"
verifie "conteneurs étiquetés recrutement-essai, utilisateur deploy" test "$(grep -c "label fr.yeita.projet=recrutement-essai --user $(id -u deploy):$(id -g deploy)" <<<"$lignes_run")" = "$(wc -l <<<"$lignes_run")"
verifie "npm ci lancé dans api/" grep -q -- "-w /w/api .* sh -c npm ci --no-audit --no-fund && npm test" <<<"$lignes_run"
echo "recrutement-essai-front" > "$J/images"; echo "recrutement-essai-api" >> "$J/images"
lancer --nettoyer
verifie "--nettoyer : images d'essai supprimées par nom, jamais -f ni par identifiant" test ! -s "$J/images" -a -z "$(grep -E '^image rm (-f|sha256)' "$J/docker.log")"

echo "--- CA2 : étape de test KO ---"
for etape_ko in test-store npm-test build; do
  sans_marqueurs
  C=$(commit_main "test: $etape_ko en échec" ".essai/$etape_ko" "code=1")
  avant=$(deploys); lancer --auto
  attendu=$(python3 -c "e=['test-store','npm-test','build']; i=e.index('$etape_ko'); print(['ok']*i+['ko']+['non-lancee']*(2-i)+['non-lancee'])")
  verifie "$etape_ko KO : résultat tests-ko, étapes $attendu" test "$(dernier "p['resultat'], [e['statut'] for e in p['etapes']]")" = "('tests-ko', $attendu)"
  verifie "$etape_ko KO : pas de deploy.sh, commit noté en échec, code 1" test "$(deploys)" = "$avant" -a "$(cat "$ETATH/echec")" = "$C" -a "$(code)" = 1
done
n=$(nb_passages); le1=$(vue "d['dernier_controle']['le']"); sleep 1; lancer --auto
verifie "passage suivant : rien d'enregistré, dernier_controle mis à jour" test "$(nb_passages)" = "$n" -a "$(vue "d['dernier_controle']['le']")" != "$le1"
verifie "vue : échec = dernier commit" test "$(vue "d['echec']['commit']")" = "$C"

echo "--- CA11 : sorties et messages hostiles, 300 lignes, JSON valide ---"
sans_marqueurs
{ for i in $(seq 1 400); do echo "ligne $i"; done; printf 'fin "guillemets" \\ barre\t\001\033[31m</script><b>x</b> é 😀 \xff\n'; } > "$T/hostile"
mkdir -p "$TRAVAIL/.essai"; cp "$T/hostile" "$TRAVAIL/.essai/test-store.sortie"
C=$(commit_main 'feat: message "hostile" \ <script>alert(1)</script>')
lancer --auto
verifie "JSON valide" python3 -c "import json; json.load(open('$VOLUME/etat/deploiement.json'))"
verifie "sortie : 300 lignes au plus, fin conservée" test "$(dernier "len(p['etapes'][0]['sortie'].split(chr(10))), p['etapes'][0]['sortie'].split(chr(10))[0]")" = "(300, 'ligne 102')"
verifie "message de commit hostile gardé tel quel (texte)" test "$(dernier "p['commit']['message']")" = 'feat: message "hostile" \ <script>alert(1)</script>'

echo "--- CA3 : déploiement KO ---"
sans_marqueurs
CA=$(commit_main "deploy: arrêt avant changement" ".essai/deploy" "avant")
place=$(en_place); lancer --auto
verifie "(a) arrêt avant changement : deploiement-ko, motif ARRÊT, pas de retour" test "$(dernier "p['resultat'], p['motif'], [e['nom'] for e in p['etapes']]")" = "('deploiement-ko', 'ARRÊT : réglage refusé (factice).', ['test-store', 'npm-test', 'build', 'deploy'])"
verifie "(a) commit en place inchangé, commit noté en échec" test "$(en_place)" = "$place" -a "$(cat "$ETATH/echec")" = "$CA"
sans_marqueurs
AVANT_B=$(cat "$ETATH/deploye")
mkdir -p "$TRAVAIL/.essai"; echo apres > "$TRAVAIL/.essai/deploy"
cp "$TRAVAIL/deploy/deploy.sh" "$T/deploy.sh.factice"; echo 'if then fi' > "$TRAVAIL/deploy/deploy.sh"
commit_main "deploy: échec après changement, deploy.sh du commit cassé" >/dev/null
cp "$T/deploy.sh.factice" "$TRAVAIL/deploy/deploy.sh"; chown deploy:deploy "$TRAVAIL/deploy/deploy.sh"
lancer --auto
verifie "(b) échec après changement : retour par le deploy.sh du commit d'avant, réussi" test "$(dernier "p['resultat'], p['motif'][-6:], [e['nom']+':'+e['statut'] for e in p['etapes']][-2:]")" = "('deploiement-ko', 'réussi', ['deploy:ko', 'retour:ok'])"
verifie "(b) commit en place = commit d'avant, deploye = commit d'avant" test "$(en_place)" = "$AVANT_B" -a "$(cat "$ETATH/deploye")" = "$AVANT_B"
verifie "(b) pause inchangée (aucune), pas d'incertain" test ! -e "$PROD/deploy/PAUSE" -a ! -e "$ETATH/incertain"
n=$(deploys); lancer --auto
verifie "(e) passage suivant sans nouveau commit : aucun deploy.sh" test "$(deploys)" = "$n"
sans_marqueurs
commit_main "deploy: échec et retour raté" >/dev/null
touch "$J/deploy-ko"; lancer --auto; rm -f "$J/deploy-ko"
verifie "(c) retour raté : retour_ko, incertain, motif" test "$(vue "d['retour_ko']['type'], d['incertain']")" = "('retour-ko', True)" -a -e "$ETATH/incertain"
verifie "(c) résultat deploiement-ko « raté »" test "$(dernier "p['resultat'], p['motif'][-4:]")" = "('deploiement-ko', 'raté')"
n=$(deploys); lancer --auto
verifie "(e) commit en échec et état incertain : aucun deploy.sh" test "$(deploys)" = "$n"
# Remise en état : demande explicite du dernier de main (traitée même en échec), réussie.
demande_ok deployer main; lancer --auto
verifie "demande « main » malgré l'échec : déployé, incertain et retour_ko effacés" test "$(dernier "p['resultat']")" = deploye -a ! -e "$ETATH/incertain" -a ! -e "$ETATH/retour-ko"
place=$(en_place); touch "$J/deploy-ko"; demande_ok deployer "$(D git -C "$PROD" rev-parse --short HEAD)"; lancer --auto; rm -f "$J/deploy-ko"
verifie "(d) redéploiement du commit en place raté : pas de retour, incertain" test "$(dernier "p['resultat'], [e['nom'] for e in p['etapes']][-1]")" = "('deploiement-ko', 'deploy')" -a -e "$ETATH/incertain" -a "$(vue "d['retour_ko']['type']")" = redeploiement-ko
demande_ok deployer main; lancer --auto
verifie "remise en état" test "$(dernier "p['resultat']")" = deploye

echo "--- SC8 (A), Q4 : verrou de deploy.sh repris pendant le retour ; refus « déjà en cours » ---"
sans_marqueurs; mkdir -p "$TRAVAIL/.essai"; echo apres > "$TRAVAIL/.essai/deploy"
AV=$(cat "$ETATH/deploye"); commit_main "deploy: échec, verrou repris au premier retour" >/dev/null
rm -f "$J/appels"; echo 2 > "$J/occupe"; chown deploy:deploy "$J/occupe"
lancer --auto; rm -f "$J/occupe"
verifie "SC8 : retour refusé « déjà en cours », verrou attendu, retour rejoué une fois et réussi" test "$(dernier "p['motif'][-6:], [e['nom']+':'+e['statut'] for e in p['etapes']][-3:]")" = "('réussi', ['deploy:ko', 'retour:ko', 'retour:ok'])" -a "$(en_place)" = "$AV"
sans_marqueurs; C9=$(commit_main "feat: deploy.sh refuse déjà en cours")
rm -f "$J/appels"; echo 1 > "$J/occupe"; chown deploy:deploy "$J/occupe"
lancer --auto; rm -f "$J/occupe" "$J/appels"
verifie "Q4 : deploy.sh refuse « déjà en cours » avant de changer : annulé, motif neutre, non noté en échec, code 0" test "$(dernier "p['resultat'] + '|' + p['motif']")" = "annule|verrou de deploy.sh occupé (sauvegarde ou déploiement à la main)" -a "$(cat "$ETATH/echec")" != "$C9" -a "$(code)" = 0
lancer --auto
verifie "passage suivant : le commit est mis en ligne" test "$(en_place)" = "$C9"

echo "--- CA4 / CA5 : pause ---"
sans_marqueurs
POINTE=$(en_place)
echo "le=2026-10-28T13:00:00Z"$'\n'"par=deploy.sh (deploy)"$'\n'"commit=$POINTE" | D tee "$PROD/deploy/PAUSE" >/dev/null
CP=$(commit_main "feat: commit pendant la pause")
n=$(deploys); lancer --auto
verifie "pause : nouveau commit non déployé, rien d'enregistré" test "$(deploys)" = "$n" -a "$(en_place)" = "$POINTE"
verifie "pause : dépôt « propre » malgré deploy/PAUSE (exclusion locale)" test -z "$(D git -C "$PROD" status --porcelain)" -a "$(grep -cx '/deploy/PAUSE' "$PROD/.git/info/exclude")" = 1
verifie "vue : pause (par, commit)" test "$(vue "d['pause']['par']")" = "deploy.sh (deploy)"
demande_ok deployer main; lancer --auto
verifie "demande « main » en pause : déployée, la pause reste" test "$(en_place)" = "$CP" -a -e "$PROD/deploy/PAUSE"
demande_ok reprendre ""; lancer --auto
verifie "reprendre : pause retirée" test ! -e "$PROD/deploy/PAUSE"
CQ=$(commit_main "feat: après la reprise")
demande_ok reprendre ""; echo "le=x"$'\n'"par=x"$'\n'"commit=$CP" | D tee "$PROD/deploy/PAUSE" >/dev/null; lancer --auto
verifie "reprendre puis automatisme dans le même passage : le dernier de main est mis en ligne" test "$(en_place)" = "$CQ" -a ! -e "$PROD/deploy/PAUSE"
VIEUX=$(D git -C "$TRAVAIL" rev-parse HEAD~2)
demande_ok deployer "${VIEUX:0:9}"; lancer --auto
verifie "demande d'un ancien commit de la ligne principale : déployé, pause créée par la demande" test "$(en_place)" = "$VIEUX" -a "$(sed -n 's/^par=//p' "$PROD/deploy/PAUSE")" = adm@yeita.fr
verifie "deploy.sh appelé sous RECRUTEMENT_PAR_AUTO=1 (il ne décide pas de la pause)" test "$(tail -n 1 "$J/deploy.log" | grep -c 'PAR_AUTO=1')" = 1
demande_ok reprendre ""; lancer --auto
verifie "reprendre : retour au dernier de main" test "$(en_place)" = "$CQ"
mkdir -p "$TRAVAIL/.essai"; printf 'sleep=3\n' > "$TRAVAIL/.essai/test-store"
CL=$(commit_main "feat: tests lents")
( sleep 1; sans_marqueurs; commit_main "feat: arrive pendant les tests" >/dev/null ) &
lancer --auto; wait
verifie "main avance pendant les tests : le commit testé est déployé, pas de pause" test "$(en_place)" = "$CL" -a ! -e "$PROD/deploy/PAUSE"
lancer --auto
CM=$(D git -C "$TRAVAIL" rev-parse HEAD)
verifie "passage suivant : le nouveau commit est déployé" test "$(en_place)" = "$CM"
demande_ok deployer main
n=$(nb_passages); lancer
verifie "lancement à la main avec une demande en attente : la demande puis le dernier de main, deux passages" test "$(( $(nb_passages) - n ))" = 2 -a "$(dernier "p['declencheur']['type']")" = ligne-de-commande

echo "--- CA6 : refus ---"
D git -C "$TRAVAIL" checkout -q -b branche-x; sans_marqueurs
echo 1 > "$TRAVAIL/x.txt"; chown deploy:deploy "$TRAVAIL/x.txt"; D git -C "$TRAVAIL" add -A; D git -C "$TRAVAIL" commit -qm "branche : étape 1"
INTER=$(D git -C "$TRAVAIL" rev-parse HEAD)
echo 2 > "$TRAVAIL/x.txt"; D git -C "$TRAVAIL" commit -qam "branche : étape 2"
D git -C "$TRAVAIL" checkout -q main; D git -C "$TRAVAIL" merge -q --no-ff -m "Merge branche-x" branche-x; D git -C "$TRAVAIL" push -q origin main
refus() {   # refus <nom> <contenu de la demande> <motif attendu>
  local n; n=$(deploys); demande "$2"; lancer --auto
  verifie "$1 : demande refusée « $3 », rien de lancé, demande retirée" test "$(derniere_demande "p['resultat'] + '|' + p['motif']")" = "demande-refusee|$3" -a "$(deploys)" -le "$((n + 1))" -a ! -e "$VOLUME/demandes/deploiement.demande"
}
L=$'\n'
refus "commit de branche fusionnée" "action=deployer${L}commit=${INTER:0:12}${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "ce commit n'a jamais été la pointe de main"
refus "commit antérieur à la 1.9" "action=deployer${L}commit=$ANCIEN${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "commit antérieur au déploiement automatique : deploy.sh $(D git -C "$PROD" rev-parse --short "$ANCIEN") en SSH"
refus "commit introuvable" "action=deployer${L}commit=deadbeef00${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "commit introuvable ou ambigu"
refus "commit mal formé" "action=deployer${L}commit=HEAD${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "demande illisible"
refus "clé en double" "action=deployer${L}commit=main${L}commit=main${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "demande illisible"
refus "action inconnue" "action=detruire${L}commit=main${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}" "demande illisible"
refus "clé en double et clé manquante (4 lignes)" "action=reprendre${L}par=adm@yeita.fr${L}le=2026-10-28T13:00:02Z${L}le=2026-10-28T13:00:03Z${L}" "demande illisible"
printf 'action=deployer\ncommit=main\npar=adm@yeita.fr\0\nle=2026-10-28T13:00:02Z\n' > "$T/nul"
mkdir -p "$VOLUME/demandes"; cp "$T/nul" "$VOLUME/demandes/deploiement.demande"; chown -R deploy:deploy "$VOLUME"; lancer --auto
verifie "octet NUL dans la demande : refusée" test "$(derniere_demande "p['resultat'] + '|' + p['motif']")" = "demande-refusee|demande illisible"
refus "clé manquante" "action=deployer${L}commit=main${L}par=adm@yeita.fr${L}" "demande illisible"
refus "par invalide" "action=deployer${L}commit=main${L}par=\$(id)${L}le=2026-10-28T13:00:02Z${L}" "demande illisible"
python3 -c "open('$T/grande','w').write('action=deployer\ncommit=main\npar=adm@yeita.fr\nle=2026-10-28T13:00:02Z\n' + '\n' * 1100)"
refus "plus de 1 024 octets (lignes vides : seule la taille la refuse)" "$(cat "$T/grande"; echo x)" "demande illisible"
mkdir -p "$VOLUME/demandes"; printf 'action=deployer\ncommit=main\npar=adm@yeita.fr\nle=2026-10-28T13:00:02Z\n' > "$T/cible-lien"; ln -sf "$T/cible-lien" "$VOLUME/demandes/deploiement.demande"; chown -hR deploy:deploy "$VOLUME"
lancer --auto
verifie "lien symbolique : refusé, lien retiré, cible intacte" test "$(dernier "p['motif']")" = "demande illisible" -a ! -L "$VOLUME/demandes/deploiement.demande" -a -f "$T/cible-lien"
mkdir -p "$VOLUME/demandes/deploiement.demande"; chown -R deploy:deploy "$VOLUME"; lancer --auto
verifie "dossier à la place de la demande : refusé, retiré" test "$(dernier "p['motif']")" = "demande illisible" -a ! -e "$VOLUME/demandes/deploiement.demande"
rm -rf "$VOLUME/demandes"; mkdir -p "$T/ailleurs"; printf 'action=deployer\ncommit=main\npar=adm@yeita.fr\nle=2026-10-28T13:00:02Z\n' > "$T/ailleurs/deploiement.demande"
ln -s "$T/ailleurs" "$VOLUME/demandes"; chown -hR deploy:deploy "$VOLUME" "$T/ailleurs"
n=$(nb_passages); t0=$(date +%s); lancer --auto
verifie "dossier des demandes remplacé par un lien : lien retiré, rien d'enregistré, attente avant de sortir, cible intacte" test ! -L "$VOLUME/demandes" -a "$(nb_passages)" = "$n" -a "$(( $(date +%s) - t0 ))" -ge 1 -a -f "$T/ailleurs/deploiement.demande"
mkdir -p "$VOLUME/demandes"; chown deploy:deploy "$VOLUME/demandes"
echo "Préfixe ambigu de 7 caractères : non observable sur ce banc (il faudrait ~16 000 commits) ; vérifié par lecture (git rev-parse --verify, V13)."

echo "--- CA7 : demande déposée pendant la prise ; deux demandes ---"
demande_ok deployer main
printf 'action=reprendre\ncommit=\npar=adm2@yeita.fr\nle=2026-10-28T13:05:00Z\n' > "$J/depot-pendant"; chown deploy:deploy "$J/depot-pendant"
EXTRA="FAUX_DEPOT_PENDANT=$J/depot-pendant" lancer --auto
verifie "demande déposée entre retrait et lecture : gardée pour le passage suivant" test -f "$VOLUME/demandes/deploiement.demande"
lancer --auto
verifie "elle est traitée une fois, au passage suivant" test ! -e "$VOLUME/demandes/deploiement.demande"
rm -f "$J/depot-fait"
demande_ok deployer "${VIEUX:0:9}"; demande_ok deployer main
n=$(deploys); lancer --auto
verifie "deux demandes : seule la plus récente (main) est traitée" test "$(deploys)" = "$((n + 1))" -a ! -e "$PROD/deploy/PAUSE"

echo "--- R6 : Docker muet, demande impossible à retirer ---"
demande_ok deployer main
t0=$(date +%s); EXTRA="FAUX_DOCKER=muet" lancer --auto
verifie "Docker muet : attente puis code 1, demande laissée" test "$(code)" = 1 -a "$(( $(date +%s) - t0 ))" -ge 1 -a -f "$VOLUME/demandes/deploiement.demande"
sans_marqueurs; CR=$(commit_main "feat: pendant que la demande est illisible")
t0=$(date +%s); EXTRA="FAUX_DOCKER=run-ko" lancer --auto
verifie "retrait impossible (Docker répond) : journal seulement, l'automatisme continue, attente avant de sortir" test "$(en_place)" = "$CR" -a "$(( $(date +%s) - t0 ))" -ge 1 -a -n "$(grep 'Demande non retirée' "$T/sortie")" -a "$(dernier "p['resultat']")" != demande-refusee
n=$(nb_passages); EXTRA="FAUX_DOCKER=run-ko" lancer --auto
verifie "demande non retirée : aucun passage enregistré (l'historique n'est pas remplacé)" test "$(nb_passages)" = "$n"
rm -f "$VOLUME/demandes/deploiement.demande"

echo "--- CA11 / R13 / R20 : vue falsifiée, passage interrompu ---"
python3 - "$VOLUME/etat/deploiement.json" <<'EOF'
import json, sys
d = json.load(open(sys.argv[1])); d["en_cours"] = {"etape": "deploy", "commit": {"commit": "0"*40}}; d["retour_ko"] = {"type": "interrompu"}; d["echec"] = None
json.dump(d, open(sys.argv[1], "w"))
EOF
n=$(nb_passages); lancer --auto
verifie "en_cours et retour_ko forgés dans le volume : ni interrompu ni alerte, vue réécrite" test "$(nb_passages)" = "$n" -a "$(vue "d['en_cours'], d['retour_ko']")" = "(None, None)"
rm -f "$VOLUME/etat/deploiement.json"; lancer --auto
verifie "vue supprimée : réécrite au passage suivant" test -f "$VOLUME/etat/deploiement.json"
ID_INT="$(date -u +%Y%m%dT%H%M%S.%NZ)-1"
{ echo "debut=2026-10-28T12:00:00Z"; echo "etape=deploy"; echo "etape_debut=2026-10-28T12:05:00Z"; echo "commit=$CR"; echo "avant=$CQ"; echo "declencheur=automatique"; echo "par="; echo "id=$ID_INT"; } | D tee "$ETATH/en-cours" >/dev/null
echo "le=x"$'\n'"par=banc"$'\n'"commit=$CR" | D tee "$PROD/deploy/PAUSE" >/dev/null
lancer --auto
verifie "en-cours de l'hôte laissé pendant deploy : passage interrompu enregistré (à sa date de début), alerte « interrompu », incertain" test "$(vue "[p['motif'] for p in d['passages'] if p['id'] == '$ID_INT']")" = "['interrompu pendant deploy']" -a "$(vue "d['retour_ko']['type'], d['incertain']")" = "('interrompu', True)" -a ! -e "$ETATH/en-cours"
demande_ok reprendre ""; lancer --auto
verifie "reprise : commit incertain → le dernier de main est remis en ligne, alerte effacée" test "$(vue "d['incertain'], d['retour_ko']")" = "(False, None)"
lancer --auto
verifie "un seul interrompu" test "$(python3 -c "import json; print(sum(p['resultat']=='interrompu' for p in json.load(open('$VOLUME/etat/deploiement.json'))['passages']))")" = 1

echo "--- R7, R10, R19 : verrous et déploiement à la main pendant les tests ---"
mkdir -p "$TRAVAIL/.essai"; printf 'sleep=4\n' > "$TRAVAIL/.essai/test-store"
CS=$(commit_main "feat: tests lents (SC3)")
( sleep 1; cd "$PROD" && runuser -u deploy -- env -i "${ENV_FAUX[@]}" bash -c "deploy/deploy.sh $CQ >/dev/null 2>&1; printf 'le=x\npar=deploy.sh (deploy)\ncommit=$CQ\n' > deploy/PAUSE" ) &
lancer --auto; wait
verifie "SC3 (A) : deploy.sh à la main pendant les tests → annulé, l'ancien reste en ligne, pause présente" test "$(dernier "p['resultat'], p['motif']")" = "('annule', 'déploiement fait à la main pendant le passage')" -a "$(en_place)" = "$CQ" -a -e "$PROD/deploy/PAUSE"
verifie "SC3 (A) : commit non noté en échec" test "$(cat "$ETATH/echec" 2>/dev/null)" != "$CS"
demande_ok reprendre ""; sans_marqueurs; lancer --auto
# shellcheck disable=SC2016 # développé dans le shell de deploy
( cd "$PROD" && runuser -u deploy -- env -i "${ENV_FAUX[@]}" bash -c 'exec 8>"$HOME/.recrutement-deploy.lock"; flock 8; sleep 5' ) & sleep 0.5
CV=$(commit_main "feat: verrou de deploy.sh occupé")
lancer --auto; wait
verifie "R10 : verrou de deploy.sh occupé au-delà de l'attente → annulé, non noté en échec" test "$(dernier "p['resultat'], p['motif']")" = "('annule', 'verrou de deploy.sh occupé (sauvegarde ou déploiement à la main)')" -a "$(cat "$ETATH/echec" 2>/dev/null)" != "$CV"
mkdir -p "$TRAVAIL/.essai"; printf 'sleep=4\n' > "$TRAVAIL/.essai/test-store"; CW=$(commit_main "feat: deux passages")
( lancer --auto ) & sleep 1
cp "$T/sortie" "$T/sortie.1" 2>/dev/null
(cd "$PROD" && runuser -u deploy -- env -i "${ENV_FAUX[@]}" bash -c 'umask 022; exec timeout 60 deploy/auto-deploy.sh --auto') > "$T/sortie2" 2>&1; wait
verifie "SC1 (A) : le second passage attend le premier puis ne refait rien" test -n "$(grep 'Un passage est en cours, attente' "$T/sortie2")" -a "$(grep -c "$(D git -C "$PROD" rev-parse --short "$CW")" "$J/deploy.log")" = 1
# shellcheck disable=SC2016 # idem
( cd "$PROD" && runuser -u deploy -- env -i "${ENV_FAUX[@]}" bash -c 'exec 9>"$HOME/.recrutement-auto-deploy.lock"; flock 9; sleep 4' ) & sleep 0.5
EXTRA="AUTO_DEPLOY_ATTENTE_VERROU=1" lancer --auto; wait
verifie "R7 : attente du verrou de passage expirée → code 1, message" test "$(code)" = 1 -a -n "$(grep 'tient le verrou' "$T/sortie")"

echo "--- CA11 : 30 passages au plus ---"
for i in $(seq 1 31); do demande "x"; lancer --auto; done
verifie "30 passages gardés, le plus récent d'abord" test "$(nb_passages)" = 30 -a "$(vue "len(d['passages']), d['passages'][0]['id'] > d['passages'][-1]['id']")" = "(30, True)"

echo "--- Partie D : le vrai deploy.sh (pause, exclusion, deploye) ---"
DD="$T/prod-vrai"; D git clone -q "$ORIGINE" "$T/travail-vrai"
D git -C "$T/travail-vrai" config user.email banc@yeita.fr; D git -C "$T/travail-vrai" config user.name Banc
cp "$T/deploy.sh.vrai" "$T/travail-vrai/deploy/deploy.sh"; printf '#!/bin/sh\nexit 0\n' > "$T/travail-vrai/tools/check-site.sh"
chown -R deploy:deploy "$T/travail-vrai"
D git -C "$T/travail-vrai" commit -qam "vrai deploy.sh, check-site factice"
echo v2 > "$T/travail-vrai/v2.txt"; chown deploy:deploy "$T/travail-vrai/v2.txt"; D git -C "$T/travail-vrai" add -A; D git -C "$T/travail-vrai" commit -qm "v2"
D git -C "$T/travail-vrai" push -q origin main
D git clone -q "$ORIGINE" "$DD"
sed -e 's/^DOMAIN=.*/DOMAIN=recrutement.banc.test/' -e 's#^OAUTH2_PROXY_REDIRECT_URL=.*#OAUTH2_PROXY_REDIRECT_URL=https://recrutement.banc.test/oauth2/callback#' \
  -e 's/^OAUTH2_PROXY_CLIENT_ID=.*/OAUTH2_PROXY_CLIENT_ID=banc.apps.googleusercontent.com/' -e 's/^OAUTH2_PROXY_CLIENT_SECRET=.*/OAUTH2_PROXY_CLIENT_SECRET=banc-secret/' \
  -e 's/^OAUTH2_PROXY_COOKIE_SECRET=.*/OAUTH2_PROXY_COOKIE_SECRET=banc-banc-banc-banc-banc-banc-12/' -e 's/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=/' "$DD/.env.example" | D tee "$DD/.env" >/dev/null
printf '#!/bin/sh\necho 200\n' > "$FAUX/curl"; chmod 755 "$FAUX/curl"
cat > "$FAUX/docker-vrai-deploy" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$FAUX_JOURNAL/docker-deploy.log"
case "$1 ${2:-}" in
  "compose config") exec /usr/bin/docker "$@" ;;
  "compose build") [ "${FAUX_BUILD:-}" = echec ] && exit 1; exit 0 ;;
  "compose ps") echo api-banc ;;
  "inspect -f") echo healthy ;;
  *) exit 0 ;;
esac
EOF
chmod 755 "$FAUX/docker-vrai-deploy"; mkdir -p "$T/faux-d"; cp "$FAUX/docker-vrai-deploy" "$T/faux-d/docker"; cp "$FAUX/curl" "$T/faux-d/curl"
# shellcheck disable=SC2086 # idem
vrai() { (cd "$DD" && runuser -u deploy -- env -i HOME="$T/home-d" PATH="$T/faux-d:/usr/bin:/bin" FAUX_JOURNAL="$J" ${EXTRA:-} bash -c 'umask 022; exec timeout 60 deploy/deploy.sh "$@"' _ "$@") > "$T/sortie" 2>&1; echo $? > "$T/code"; }
mkdir -p "$T/home-d"; chown deploy:deploy "$T/home-d"
MAIN_D=$(D git -C "$DD" rev-parse HEAD); ANC_D=$(D git -C "$DD" rev-parse HEAD~1)
vrai
verifie "deploy.sh sans argument : réussi, aucune pause, deploye écrit" test "$(code)" = 0 -a ! -e "$DD/deploy/PAUSE" -a "$(cat "$T/home-d/.recrutement-deploiement/deploye")" = "$MAIN_D"
verifie "exclusion /deploy/PAUSE ajoutée une fois" test "$(grep -cx '/deploy/PAUSE' "$DD/.git/info/exclude")" = 1
vrai "$ANC_D"
verifie "deploy.sh <ancien commit> à la main : pause créée (par deploy.sh), deploye = ce commit" test "$(code)" = 0 -a "$(sed -n 's/^par=//p' "$DD/deploy/PAUSE")" = "deploy.sh (deploy)" -a "$(cat "$T/home-d/.recrutement-deploiement/deploye")" = "$ANC_D"
vrai
verifie "pause présente : deploy.sh repart (dépôt propre), exclusion non dupliquée" test "$(code)" = 0 -a "$(grep -cx '/deploy/PAUSE' "$DD/.git/info/exclude")" = 1
rm -f "$DD/deploy/PAUSE"
EXTRA="RECRUTEMENT_PAR_AUTO=1" vrai "$ANC_D"
verifie "RECRUTEMENT_PAR_AUTO=1 : pas de pause" test "$(code)" = 0 -a ! -e "$DD/deploy/PAUSE"
vrai "$MAIN_D"
verifie "deploy.sh <dernier de main> : pas de pause" test "$(code)" = 0 -a ! -e "$DD/deploy/PAUSE"
vrai deadbeef00
verifie "deploy.sh <commit inconnu> : refusé, pas de pause" test "$(code)" = 1 -a ! -e "$DD/deploy/PAUSE"
EXTRA="FAUX_BUILD=echec" vrai "$ANC_D"
verifie "deploy.sh <ancien> dont la construction échoue : pause créée et gardée, deploye inchangé, « · Dépôt sur » écrit" test "$(code)" = 1 -a -e "$DD/deploy/PAUSE" -a "$(cat "$T/home-d/.recrutement-deploiement/deploye")" = "$MAIN_D" -a -n "$(grep '^· Dépôt sur' "$T/sortie")"

echo
if [ "$ECHECS" = 0 ]; then echo "TOUT OK"; exit 0; else echo "ÉCHECS : $ECHECS"; exit 1; fi
