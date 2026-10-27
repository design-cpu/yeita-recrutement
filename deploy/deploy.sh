#!/usr/bin/env bash
# Déploiement, lancé par l'utilisateur deploy depuis le dépôt du serveur :
#   deploy/deploy.sh            met à jour sur le dernier commit de main
#   deploy/deploy.sh <commit>   revient à un commit de main (retour arrière)
# Tout est vérifié avant de toucher au dépôt ou aux conteneurs ; seules les images étiquetées
# fr.yeita.projet=recrutement sont nettoyées (le serveur est partagé). Relancer après une interruption est sûr.
set -euo pipefail

PROJET=recrutement
ETIQUETTE=fr.yeita.projet=recrutement
VERROU="$HOME/.recrutement-deploy.lock"   # hors du dépôt

arret() { echo "ARRÊT : $*" >&2; exit 1; }
info() { echo "· $*"; }

# Valeur d'une variable d'un fichier .env (dernière occurrence, guillemets retirés) : sert pour .env.example.
valeur() { sed -n "s/^$1=//p" "$2" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"; }

# Conteneurs (nom, projet, dossier) qui publient un port de l'hôte donné.
publient() { docker ps --format '{{.Names}} {{.Label "com.docker.compose.project"}} {{.Label "com.docker.compose.project.working_dir"}} {{.Ports}}' | grep -E "[]:]$1->" || true; }

# Tout le script est dans main : bash le lit en entier avant d'agir, même si git pull le modifie.
main() {
  [ "$(id -u)" -ne 0 ] || arret "à lancer en tant que deploy, pas en root."
  [ $# -le 1 ] || { echo "Usage : $0 [commit]" >&2; exit 2; }
  local cible="${1:-}"

  cd "$(dirname "$0")/.."
  local dossier; dossier=$(pwd -P)

  exec 9>"$VERROU"
  flock -n 9 || arret "un déploiement est déjà en cours (verrou $VERROU)."

  # --- Réglages (.env) ---
  [ -f .env ] || arret "$dossier/.env est absent : copiez .env.example et remplissez-le (deploy/README.md)."
  # Les valeurs sont celles que Compose utilisera (commentaires, guillemets, variables du shell compris).
  local reglages domaine profils retour
  reglages=$(docker compose config --environment) || arret "Compose ne peut pas lire les réglages (.env incomplet ?)."
  reglage() { printf '%s\n' "$reglages" | sed -n "s/^$1=//p" | tail -n 1; }
  local nom
  # Compose lit « VAR=   # commentaire » comme la valeur « # commentaire » : une variable vide passerait pour remplie.
  for nom in DOMAIN COMPOSE_PROFILES OAUTH2_PROXY_CLIENT_ID OAUTH2_PROXY_CLIENT_SECRET OAUTH2_PROXY_COOKIE_SECRET OAUTH2_PROXY_REDIRECT_URL; do
    case "$(reglage "$nom")" in "#"*) arret "$nom est vide (seul un commentaire suit le signe =) : remplissez-la ou retirez le commentaire." ;; esac
  done
  domaine=$(reglage DOMAIN); profils=$(reglage COMPOSE_PROFILES); retour=$(reglage OAUTH2_PROXY_REDIRECT_URL)
  if [ -z "$domaine" ] || [ "$domaine" = localhost ]; then
    arret "DOMAIN vaut « ${domaine:-vide} » : mettez le domaine du serveur (recrutement.yeita.fr)."
  fi
  [ "$retour" = "https://$domaine/oauth2/callback" ] || arret "OAUTH2_PROXY_REDIRECT_URL vaut « $retour », attendu « https://$domaine/oauth2/callback »."
  for nom in OAUTH2_PROXY_COOKIE_SECRET OAUTH2_PROXY_CLIENT_ID OAUTH2_PROXY_CLIENT_SECRET; do
    [ -n "$(reglage "$nom")" ] || arret "$nom est vide dans .env."
    [ "$(reglage "$nom")" != "$(valeur "$nom" .env.example)" ] || arret "$nom a encore sa valeur d'exemple : remplacez-la (deploy/README.md)."
  done

  local caddy=non
  case " $(docker compose config --services | tr '\n' ' ') " in *" caddy "*) caddy=oui ;; esac

  echo "Commit en place : $(git rev-parse --short HEAD) ($(git log -1 --format=%s))"
  echo "DOMAIN=$domaine · COMPOSE_PROFILES=${profils:-(vide : cas A)}"
  local avant; avant=$(git rev-parse --short HEAD)

  # --- Dépôt propre : un fichier en trop entrerait dans l'image et serait servi aux comptes connectés ---
  [ -z "$(git status --porcelain)" ] || arret "le dépôt contient des modifications ou des fichiers en trop (une copie de .env serait publiée) :
$(git status --short)"

  # --- Le nom de projet « recrutement » n'appartient qu'à ce dossier ---
  local etrangers
  etrangers=$(docker ps -a --filter "label=com.docker.compose.project=$PROJET" \
    --format '{{.Names}} {{.Label "com.docker.compose.project.working_dir"}}' | awk -v d="$dossier" '$2 != d')
  [ -z "$etrangers" ] || arret "des conteneurs du projet Compose « $PROJET » viennent d'un autre dossier que $dossier :
$etrangers"

  # --- Cas B : 80 et 443 libres ou tenus par le caddy du projet ---
  if [ "$caddy" = oui ]; then
    local port pub
    for port in 80 443; do
      pub=$(publient "$port")
      if [ -n "$(printf '%s\n' "$pub" | awk -v p="$PROJET" -v d="$dossier" 'NF && !($2 == p && $3 == d)')" ]; then
        arret "le port $port est publié par un autre conteneur : COMPOSE_PROFILES=caddy ne convient pas (deploy/README.md, choix du cas)."
      fi
      if [ -z "$pub" ] && [ -n "$(ss -Hltn "sport = :$port")" ]; then
        arret "le port $port est déjà utilisé sur ce serveur : c'est le cas A, laissez COMPOSE_PROFILES vide (deploy/README.md)."
      fi
    done
  fi

  # --- Commit visé ---
  git fetch --quiet origin
  if [ -n "$cible" ]; then
    git cat-file -e "$cible^{commit}" 2>/dev/null || arret "commit inconnu : $cible."
    git merge-base --is-ancestor "$cible" origin/main || arret "$cible n'est pas un commit de main."
    if ! git cat-file -e "$cible:compose.yaml" 2>/dev/null || ! git cat-file -e "$cible:deploy/deploy.sh" 2>/dev/null; then
      arret "$cible est antérieur au déploiement Docker (pas de compose.yaml ou de deploy/deploy.sh)."
    fi
    git checkout --quiet --detach "$cible"
    info "Dépôt sur $(git rev-parse --short HEAD) (détaché ; « deploy/deploy.sh » sans argument reprend main)."
  else
    git checkout --quiet main
    git pull --quiet --ff-only origin main
    info "Dépôt sur main : $(git rev-parse --short HEAD)."
  fi

  # --- Conteneurs ---
  if [ "$caddy" = non ] && [ -n "$(docker compose --profile caddy ps -aq caddy 2>/dev/null)" ]; then
    docker compose --profile caddy rm --stop --force caddy
    info "Caddy du projet arrêté et supprimé (cas A)."
  fi
  docker compose build --pull || echec "$avant" "la construction de l'image a échoué."
  docker compose up -d --remove-orphans --force-recreate || echec "$avant" "le démarrage des conteneurs a échoué."
  docker image prune -f --filter "label=$ETIQUETTE" >/dev/null
  info "Conteneurs à jour ; anciennes images du projet supprimées."

  # --- Contrôle ---
  local i
  for i in $(seq 1 30); do
    [ "$(curl -s -o /dev/null --max-time 2 -w '%{http_code}' http://127.0.0.1:4180/ping)" = 200 ] && break
    [ "$i" -lt 30 ] || echec "$avant" "front ne répond pas sur 127.0.0.1:4180/ping après 60 s (docker compose logs front)."
    sleep 2
  done
  # L'api (depuis la 1.3) : attendue seulement si le commit déployé la déclare (lu après le changement de commit :
  # un retour vers un commit sans api ne doit pas l'attendre). Le 401 de check-site.sh vient d'oauth2-proxy, pas d'elle.
  local services
  services=$(docker compose config --services) || echec "$avant" "Compose ne peut pas lire les services."
  if grep -qx api <<<"$services"; then
    local sante=""
    for i in $(seq 1 30); do
      sante=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$(docker compose ps -q api)" 2>/dev/null || true)
      [ "$sante" = healthy ] && break
      [ "$i" -lt 30 ] || echec "$avant" "l'api n'est pas saine après 60 s (état : ${sante:-inconnu} ; docker compose logs api)."
      sleep 2
    done
    info "API saine."
  fi
  local essais=1
  [ "$caddy" = oui ] && essais=6   # le temps que Caddy obtienne le certificat
  for i in $(seq 1 "$essais"); do
    tools/check-site.sh "https://$domaine" && { echo "Déploiement réussi : $(git rev-parse --short HEAD) sur https://$domaine"; return 0; }
    [ "$i" -lt "$essais" ] && { echo "Nouvel essai dans 10 s…"; sleep 10; }
  done
  echec "$avant" "le contrôle du site échoue (deploy/README.md, lire un échec)."
}

echec() {
  echo "ÉCHEC : $2" >&2
  echo "Pour revenir à la version précédente : deploy/deploy.sh $1" >&2
  exit 1
}

main "$@"
exit
