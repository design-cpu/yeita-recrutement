#!/usr/bin/env bash
# Occupation des disques, lancée toutes les heures par recrutement-verif-disque.timer (ou à la main), en tant que deploy :
#   deploy/verif-disque.sh
# Mesure le disque racine et celui du dossier Docker (images, volumes, dont la base) ; écrit le résultat dans l'état
# des sauvegardes (/data/etat/disque.json, page admin/sauvegardes.html). Code 1 au-delà de 80 % ou si la mesure est
# impossible, 0 sinon.
set -euo pipefail

SEUIL=80

arret() { echo "ARRÊT : $*" >&2; exit 1; }

# shellcheck source=deploy/commun.sh
. "$(dirname "$0")/commun.sh"

# Occupation en % (entier) du système de fichiers qui porte le chemin donné ; vide si df échoue.
occupation() { df --output=pcent "$1" 2>/dev/null | tail -n 1 | tr -dc '0-9'; }

# etat_disque <résultat> [<racine> <docker>] : écrit disque.json (nombres, ou null si la mesure a échoué).
etat_disque() {
  ecrire_etat disque.json "{\"le\": \"$(maintenant)\", \"resultat\": \"$1\", \"racine\": ${2:-null}, \"docker\": ${3:-null}, \"seuil\": $SEUIL}" \
    || { echo "État du disque non écrit (docker compose run a échoué, détail ci-dessus)." >&2; return 1; }
}

main() {
  [ "$(id -u)" -ne 0 ] || arret "à lancer en tant que deploy, pas en root."
  [ $# -eq 0 ] || { echo "Usage : $0" >&2; exit 2; }
  umask 077
  cd "$(dirname "$0")/.."
  command -v docker >/dev/null 2>&1 || arret "« docker » est absent."

  local dossier_docker racine docker_pc
  dossier_docker=$(docker info -f '{{.DockerRootDir}}' 2>/dev/null || true)
  # Docker ne répond pas : l'état ne peut pas être écrit (il est dans un volume), et le site est hors service aussi.
  [ -n "$dossier_docker" ] || arret "Docker ne répond pas : occupation du dossier Docker inconnue."
  racine=$(occupation /) || racine=""
  docker_pc=$(occupation "$dossier_docker") || docker_pc=""
  if [ -z "$racine" ] || [ -z "$docker_pc" ]; then
    etat_disque mesure-impossible || true
    arret "df a échoué sur / ou $dossier_docker."
  fi

  local resume="Disque racine : $racine % ; dossier Docker : $docker_pc % ; seuil : $SEUIL %."
  if [ "$racine" -gt "$SEUIL" ] || [ "$docker_pc" -gt "$SEUIL" ]; then
    etat_disque plein "$racine" "$docker_pc" || true
    arret "disque presque plein. $resume"
  fi
  etat_disque normal "$racine" "$docker_pc" || arret "occupation normale, mais l'état du disque n'a pas pu être écrit. $resume"
  echo "$resume"
}

main "$@"
