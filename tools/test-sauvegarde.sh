#!/usr/bin/env bash
# Tests de deploy/backup.sh et deploy/verif-disque.sh avec de faux outils (v1.7).
# À lancer en root dans un conteneur jetable ubuntu:26.04 qui a l'utilisateur deploy, /var/backups/recrutement
# (deploy, 700), docker (CLI et plugin compose : « docker compose config » est le vrai), age, rclone, curl, openssl,
# python3 — jamais sur le serveur. Exemple depuis la racine du dépôt :
#   docker run --rm -v "$PWD:/depot:ro" <image du banc> bash /depot/tools/test-sauvegarde.sh /depot
# Simulés : docker compose exec/cp/ps, docker inspect/info, rclone, df (verif-disque) et un faux healthchecks.io
# en HTTPS local (certificat de test, CURL_CA_BUNDLE). Réels : docker compose config, age, curl, flock, find.
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
SERVEUR_PID=""
trap '[ -n "$SERVEUR_PID" ] && kill "$SERVEUR_PID" 2>/dev/null; rm -rf "$T"' EXIT

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
UUID_S="11111111-aaaa-4bbb-8ccc-$(printf '%012d' $RANDOM)"
UUID_D="22222222-aaaa-4bbb-8ccc-$(printf '%012d' $RANDOM)"

# --- Faux healthchecks.io en HTTPS : réponse par contrôle lue dans $T/hc/<uuid>.mode, requêtes notées ---
mkdir -p "$T/hc"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=localhost -addext subjectAltName=DNS:localhost \
  -keyout "$T/hc/cle.pem" -out "$T/hc/cert.pem" 2>/dev/null
cat > "$T/hc/serveur.py" <<'EOF'
import http.server, ssl, sys, os, json
D = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); corps = self.rfile.read(n).decode()
        parts = self.path.strip("/").split("/"); uuid = parts[0]
        with open(os.path.join(D, "requetes.log"), "a") as f: f.write(json.dumps({"chemin": self.path, "corps": corps}) + "\n")
        mode = open(os.path.join(D, uuid + ".mode")).read().strip() if os.path.exists(os.path.join(D, uuid + ".mode")) else "OK"
        if mode.startswith("echecs:"):
            reste = int(mode.split(":")[1])
            if reste > 0:
                open(os.path.join(D, uuid + ".mode"), "w").write("echecs:%d" % (reste - 1))
                self.send_response(503); self.send_header("Content-Length", "0"); self.end_headers(); return
            mode = "OK"
        texte = {"OK": "OK", "notfound": "OK (not found)", "rate": "OK (rate limited)"}[mode]
        b = texte.encode()
        self.send_response(200); self.send_header("Content-Type", "text/plain"); self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)
s = http.server.ThreadingHTTPServer(("127.0.0.1", 8443), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain(os.path.join(D, "cert.pem"), os.path.join(D, "cle.pem"))
s.socket = ctx.wrap_socket(s.socket, server_side=True); s.serve_forever()
EOF
python3 "$T/hc/serveur.py" "$T/hc" & SERVEUR_PID=$!
sleep 1
chmod -R a+rwX "$T/hc"
HC_S="https://localhost:8443/$UUID_S"
HC_D="https://localhost:8443/$UUID_D"

# --- Faux outils, en tête du PATH ---
FAUX="$T/faux"; mkdir -p "$FAUX" "$T/volume/sauvegardes" "$T/distant" "$T/journal"
chmod -R a+rwX "$T/volume" "$T/distant" "$T/journal"
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
  "inspect -f") echo "${FAUX_SANTE:-healthy}" ;;
  "info -f")
    [ "${FAUX_INFO:-}" = echec ] && exit 1
    echo "${FAUX_DOCKER_DIR:-/var/lib/docker}" ;;
  *) echo "faux docker : appel inattendu : $*" >&2; exit 99 ;;
esac
EOF
cat > "$FAUX/rclone" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$FAUX_JOURNAL/rclone.log"
case "${FAUX_RCLONE:-}" in echec) echo "Failed to copy: 403" >&2; exit 1 ;; lent) sleep 30 ;; esac
cp "$2" "$FAUX_DISTANT/"
EOF
cat > "$FAUX/age" <<'EOF'
#!/usr/bin/env bash
# Vrai age, sauf FAUX_AGE=clair (recopie le clair : le contrôle d'en-tête doit refuser l'envoi) ou =echec.
case "${FAUX_AGE:-}" in
  clair) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] && exec /usr/bin/age "$@"; cp "${!#}" "$o" ;;
  echec) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] && exec /usr/bin/age "$@"; echo "age: no space left" >&2; exit 1 ;;
  lent) for a; do [ "$p" = -o ] && o=$a; p=$a; done; [ "$o" = /dev/null ] || sleep 30; exec /usr/bin/age "$@" ;;
  *) exec /usr/bin/age "$@" ;;
esac
EOF
cat > "$FAUX/curl" <<'EOF'
#!/usr/bin/env bash
# Note les arguments, puis passe au vrai curl.
printf '%s\n' "$*" >> "$FAUX_JOURNAL/curl.argv"
exec /usr/bin/curl "$@"
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
    sed -e 's/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=/' "$DEPOT/.env.example" | grep -v -E '^(AGE_RECIPIENT|RCLONE_DEST|HEALTHCHECK_)'
    echo "AGE_RECIPIENT=$CLE_PUB"; echo "RCLONE_DEST=test:bucket/recrutement"
    echo "HEALTHCHECK_SAUVEGARDE_URL=$HC_S"; echo "HEALTHCHECK_DISQUE_URL=$HC_D"
    printf '%s\n' "$@"
  } > "$DEPOT/.env"
  chown deploy "$DEPOT/.env"
}
reinitialiser() {
  find "$COPIES" -mindepth 1 -delete
  rm -f "$T/volume/sauvegardes/"* "$T/distant/"* "$T/journal/"* "$T/hc/requetes.log" "$T/hc/"*.mode
  ecrire_env
}
# lancer <script> [VAR=val…] : lancé en deploy ; sortie dans $T/sortie, code dans $CODE.
lancer() {
  local script=$1; shift
  runuser -u deploy -- env -i HOME=/home/deploy PATH="$FAUX:/usr/sbin:/usr/bin:/sbin:/bin" \
    CURL_CA_BUNDLE="$T/hc/cert.pem" FAUX_JOURNAL="$T/journal" FAUX_VOLUME="$T/volume" FAUX_BASE="$T/base.db" \
    FAUX_DISTANT="$T/distant" RECRUTEMENT_ATTENTE_API=4 "$@" \
    bash "$DEPOT/deploy/$script" > "$T/sortie" 2>&1
  CODE=$?
}
dernier_ping() { tail -n 1 "$T/hc/requetes.log" 2>/dev/null | python3 -c 'import json,sys; d=json.loads(sys.stdin.read() or "{}"); print(d.get("chemin",""), "|", d.get("corps","").strip())'; }
nb_pings() { [ -f "$T/hc/requetes.log" ] && wc -l < "$T/hc/requetes.log" || echo 0; }
aucun_clair() { [ -z "$(find "$COPIES" -name 'recrutement-*.db' -o -name '*.tmp')" ]; }
# Rien de secret ni de personnel dans les sorties, les corps de ping et les arguments de curl.
rien_ne_fuit() {
  ! grep -q -e "$REPERE" -e "$UUID_S" -e "$UUID_D" -e "$CLE_PUB" "$T/sortie" \
  && ! grep -q -e "$REPERE" -e "$UUID_S" -e "$UUID_D" -e "$CLE_PUB" <(python3 -c 'import json,sys
for l in open(sys.argv[1]): print(json.loads(l)["corps"])' "$T/hc/requetes.log" 2>/dev/null) \
  && ! grep -q -e "$UUID_S" -e "$UUID_D" "$T/journal/curl.argv" 2>/dev/null
}
ancienne_copie() { # une copie chiffrée de deux jours, qui doit survivre aux échecs
  echo ancienne > "$COPIES/recrutement-2026-01-01T030000Z.db.age"; chown deploy "$COPIES/recrutement-2026-01-01T030000Z.db.age"
  touch -d '2 days ago' "$COPIES/recrutement-2026-01-01T030000Z.db.age"
}

export -f dernier_ping nb_pings; export T

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
verifie "CA4 rclone vers RCLONE_DEST" grep -q "copy .* test:bucket/recrutement" "$T/journal/rclone.log"
verifie "CA4 ping de succès" bash -c '[[ "$(dernier_ping)" == "/$1 | Sauvegarde réussie"* ]]' _ "$UUID_S"
verifie "CA4 rien ne fuit" rien_ne_fuit
sleep 1
lancer backup.sh
verifie "CA4 seconde exécution : deux .db.age en local" [ "$(find "$COPIES" -name '*.db.age' | wc -l)" -eq 2 ]
verifie "CA4 seconde exécution : deux objets distants" [ "$(find "$T/distant" -name '*.db.age' | wc -l)" -eq 2 ]
echo "== CA5 : échec à chaque étape =="
for cas in "api non saine:FAUX_SANTE=starting" "copie dans le conteneur api:FAUX_COPIE=echec" \
           "copie dans le conteneur api:FAUX_DERNIERE_LIGNE=/data/autre.db" "récupération:FAUX_CP=echec" \
           "chiffrement:FAUX_AGE=echec" "chiffrement:FAUX_AGE=clair" "envoi:FAUX_RCLONE=echec"; do
  etape=${cas%%:*}; var=${cas#*:}
  reinitialiser; ancienne_copie
  lancer backup.sh "$var"
  verifie "CA5 $var : code non nul" [ "$CODE" -ne 0 ]
  verifie "CA5 $var : /fail « $etape »" bash -c '[[ "$(dernier_ping)" == "/$1/fail | Échec : $2"* ]]' _ "$UUID_S" "$etape"
  verifie "CA5 $var : aucun clair" aucun_clair
  verifie "CA5 $var : ancienne copie gardée" [ -f "$COPIES/recrutement-2026-01-01T030000Z.db.age" ]
  verifie "CA5 $var : rien ne fuit" rien_ne_fuit
done
verifie "CA5 FAUX_AGE=clair : rien envoyé" [ -z "$(ls "$T/distant")" ]
reinitialiser; chmod 750 "$COPIES"
lancer backup.sh
verifie "CA5 dossier des copies en 750 : /fail, aucune copie lancée" bash -c '[ "$1" -ne 0 ] && grep -q "pas en 700" "$2" && [ ! -s "$3" ]' _ "$CODE" "$T/sortie" "$T/journal/docker.log"
chmod 700 "$COPIES"
reinitialiser
lancer backup.sh RECRUTEMENT_ATTENTE_API=1
verifie "CA7 durée d'attente invalide : refus" bash -c '[ "$1" -eq 1 ] && grep -q "durée d.attente invalide" "$2"' _ "$CODE" "$T/sortie"

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
refus "valeur vide suivie d'un commentaire" "RCLONE_DEST est vide (seul un commentaire" -- "RCLONE_DEST=   # à remplir"
refus "adresse vide suivie d'un commentaire" "HEALTHCHECK_SAUVEGARDE_URL est vide (seul un commentaire" -- "HEALTHCHECK_SAUVEGARDE_URL=  # plus tard"
refus "valeur d'exemple" "AGE_RECIPIENT a encore sa valeur d'exemple" -- "$(grep '^AGE_RECIPIENT=' "$DEPOT/.env.example")"
refus "valeur d'exemple entre guillemets" HEALTHCHECK_SAUVEGARDE_URL -- "HEALTHCHECK_SAUVEGARDE_URL=\"$(sed -n 's/^HEALTHCHECK_SAUVEGARDE_URL=//p' "$DEPOT/.env.example")\""
refus "variable exportée dans le shell (valeur d'exemple)" AGE_RECIPIENT "AGE_RECIPIENT=$(sed -n 's/^AGE_RECIPIENT=//p' "$DEPOT/.env.example")" --
refus "http://" "HEALTHCHECK_SAUVEGARDE_URL doit être une adresse https://" -- "HEALTHCHECK_SAUVEGARDE_URL=http://localhost:8443/$UUID_S"
refus "adresses égales" HEALTHCHECK_DISQUE_URL -- "HEALTHCHECK_DISQUE_URL=$HC_S"
refus "RCLONE_DEST sans :" RCLONE_DEST -- "RCLONE_DEST=bucket/recrutement"
refus "RCLONE_DEST en option" "RCLONE_DEST doit être de la forme" -- "RCLONE_DEST=--config=/tmp/x:bucket"
refus "clé SSH" "pas une clé SSH" -- "AGE_RECIPIENT=ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl"
refus "age1abc" AGE_RECIPIENT -- "AGE_RECIPIENT=age1abc"
reinitialiser; ecrire_env "AGE_RECIPIENT=$CLE_PUB   # clé du coffre" "RCLONE_DEST=\"test:bucket/recrutement\""
lancer backup.sh
verifie "CA6 commentaire en fin de ligne et guillemets sur des valeurs valides : acceptés" [ "$CODE" -eq 0 ]

echo "== CA7 : ping, verrous, root =="
for m in notfound rate; do
  reinitialiser; echo "$m" > "$T/hc/$UUID_S.mode"
  lancer backup.sh
  verifie "CA7 réponse $m : code non nul" [ "$CODE" -ne 0 ]
done
verifie "CA7 rate limited : message dédié" grep -q "trop de pings" "$T/sortie"
reinitialiser; echo "echecs:2" > "$T/hc/$UUID_S.mode"
lancer backup.sh
verifie "CA7 deux échecs puis OK : succès" [ "$CODE" -eq 0 ]
reinitialiser; kill "$SERVEUR_PID"; wait "$SERVEUR_PID" 2>/dev/null
debut=$(date +%s); lancer backup.sh; duree=$(( $(date +%s) - debut ))
verifie "CA7 healthchecks injoignable : code non nul" [ "$CODE" -ne 0 ]
verifie "CA7 healthchecks injoignable : moins de 60 s ($duree s)" [ "$duree" -lt 60 ]
python3 "$T/hc/serveur.py" "$T/hc" & SERVEUR_PID=$!; sleep 1
verifie "CA7 adresse jamais en argument de curl" bash -c '! grep -q -e "$1" -e "$2" "$3"' _ "$UUID_S" "$UUID_D" "$T/journal/curl.argv"
reinitialiser
runuser -u deploy -- flock "$COPIES/.backup.lock" sleep 5 & TENEUR=$!; sleep 0.5
lancer backup.sh; wait "$TENEUR"
verifie "CA7 verrou de sauvegarde pris : code 1" [ "$CODE" -eq 1 ]
verifie "CA7 verrou de sauvegarde pris : aucun ping" [ "$(nb_pings)" -eq 0 ]
reinitialiser
runuser -u deploy -- flock /home/deploy/.recrutement-deploy.lock sleep 6 & TENEUR=$!; sleep 0.5
lancer backup.sh RECRUTEMENT_ATTENTE_DEPLOIEMENT=2; wait "$TENEUR"
verifie "CA7 déploiement en cours : /fail" bash -c '[[ "$(dernier_ping)" == "/$1/fail | Échec : attente d"* ]]' _ "$UUID_S"
reinitialiser
( cd "$DEPOT" && bash deploy/backup.sh ) > "$T/sortie" 2>&1; CODE=$?
verifie "CA7 root refusé" bash -c '[ "$1" -eq 1 ] && grep -q "pas en root" "$2"' _ "$CODE" "$T/sortie"

echo "== CA8 : rétention locale =="
vieille() { echo x > "$COPIES/$1"; chown deploy "$COPIES/$1"; touch -d "@$(( $(date +%s) - $2 * 60 ))" "$COPIES/$1"; }
reinitialiser
vieille recrutement-2025-01-01T000000Z.db.age $((30 * 1440 + 1))
vieille recrutement-2025-01-02T000000Z.db.age $((30 * 1440 - 1))
lancer backup.sh FAUX_RCLONE=echec
verifie "CA8 envoi raté : la copie de 30 j + 1 min est gardée" [ -f "$COPIES/recrutement-2025-01-01T000000Z.db.age" ]
sleep 1   # un nom par seconde : sinon le refus d'écraser (voulu) arrêterait la seconde exécution
lancer backup.sh
verifie "CA8 envoi réussi : 30 j + 1 min supprimée" [ ! -f "$COPIES/recrutement-2025-01-01T000000Z.db.age" ]
verifie "CA8 envoi réussi : 30 j − 1 min gardée" [ -f "$COPIES/recrutement-2025-01-02T000000Z.db.age" ]

echo "== R8 : clair laissé par une coupure, SIGTERM =="
reinitialiser
echo clair > "$COPIES/recrutement-2026-10-01.db"; chown deploy "$COPIES/recrutement-2026-10-01.db"
lancer backup.sh
verifie "R8 clair d'une coupure supprimé, sauvegarde réussie" bash -c '[ "$1" -eq 0 ] && [ ! -e "$2" ]' _ "$CODE" "$COPIES/recrutement-2026-10-01.db"
reinitialiser
( lancer backup.sh FAUX_RCLONE=lent; echo "$CODE" > "$T/code" ) & SAUVEGARDE=$!
sleep 3
pkill -TERM -u deploy; wait "$SAUVEGARDE"   # comme systemd : tout le groupe de processus reçoit SIGTERM
verifie "R8 SIGTERM pendant l'envoi : code non nul" [ "$(cat "$T/code")" -ne 0 ]
verifie "R8 SIGTERM : /fail « interrompue »" bash -c '[[ "$(dernier_ping)" == *"/fail | Échec : envoi (rclone) (interrompue)"* ]]'
verifie "R8 SIGTERM : aucun clair" aucun_clair

echo "== CA9 : verif-disque.sh =="
reinitialiser
lancer verif-disque.sh FAUX_DOCKER_DIR=/var   # vrai df ; /var existe aussi dans un banc sans dockerd
verifie "CA9 vrai df : succès" [ "$CODE" -eq 0 ]
verifie "CA9 vrai df : valeurs dans le corps" bash -c '[[ "$(dernier_ping)" =~ ^/$1\ \|\ Disque\ racine\ :\ [0-9]+\ % ]]' _ "$UUID_D"
for c in "80,80:0" "81,10:1" "10,81:1"; do
  reinitialiser; lancer verif-disque.sh FAUX_DF="${c%:*}" FAUX_DOCKER_DIR=/srv/docker
  verifie "CA9 df ${c%:*} : code ${c#*:}" [ "$CODE" -eq "${c#*:}" ]
  [ "${c#*:}" = 1 ] && verifie "CA9 df ${c%:*} : /fail avec les valeurs" bash -c '[[ "$(dernier_ping)" == "/$1/fail | Disque presque plein."* ]]' _ "$UUID_D"
done
reinitialiser; lancer verif-disque.sh FAUX_DF=echec
verifie "CA9 df en échec : /fail" bash -c '[ "$1" -eq 1 ] && [[ "$(dernier_ping)" == "/$2/fail | Mesure impossible"* ]]' _ "$CODE" "$UUID_D"
reinitialiser; lancer verif-disque.sh FAUX_INFO=echec
verifie "CA9 docker info en échec : /fail" bash -c '[ "$1" -eq 1 ] && [[ "$(dernier_ping)" == "/$2/fail | Mesure impossible"* ]]' _ "$CODE" "$UUID_D"
reinitialiser; ecrire_env "HEALTHCHECK_SAUVEGARDE_URL=$HC_D"; lancer verif-disque.sh
verifie "CA9 adresses égales : refus" bash -c '[ "$1" -eq 1 ] && grep -q "identiques" "$2" && [ "$(nb_pings)" -eq 0 ]' _ "$CODE" "$T/sortie"
reinitialiser; echo notfound > "$T/hc/$UUID_D.mode"; lancer verif-disque.sh
verifie "CA9 réponse not found : code non nul" [ "$CODE" -ne 0 ]
reinitialiser; lancer verif-disque.sh
verifie "CA9 rien ne fuit" rien_ne_fuit
( cd "$DEPOT" && bash deploy/verif-disque.sh ) > "$T/sortie" 2>&1; CODE=$?
verifie "CA9 root refusé" bash -c '[ "$1" -eq 1 ] && grep -q "pas en root" "$2"' _ "$CODE" "$T/sortie"

echo "== CA14 : prepare-serveur.sh sans age ou sans rclone (ajout QA) =="
# PATH réduit à des liens vers tous les outils du banc sauf un ; le script s'arrête avant toute modification.
empreinte_systeme() { { cat /etc/passwd /etc/group; stat -c '%n %a %U' /var/backups/recrutement /home/deploy 2>/dev/null; ls -A /opt; } | sha256sum; }
for absent in age rclone; do
  mkdir -p "$T/sans-$absent"
  for f in /usr/bin/* /usr/sbin/* /bin/* /sbin/*; do [ "$(basename "$f")" = "$absent" ] || ln -sf "$f" "$T/sans-$absent/" 2>/dev/null; done
  avant=$(empreinte_systeme)
  PATH="$T/sans-$absent" RECRUTEMENT_REPO=/nulle-part bash "$DEPOT/deploy/prepare-serveur.sh" "ssh-ed25519 AAAAqa qa" > "$T/sortie" 2>&1; CODE=$?
  verifie "CA14 sans $absent : code 1" [ "$CODE" -eq 1 ]
  verifie "CA14 sans $absent : message R13" grep -qF "« $absent » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien." "$T/sortie"
  verifie "CA14 sans $absent : rien modifié" [ "$avant" = "$(empreinte_systeme)" ]
done

echo
if [ "$ECHECS" -eq 0 ]; then echo "TOUT OK"; exit 0; else echo "ÉCHECS : $ECHECS"; exit 1; fi
