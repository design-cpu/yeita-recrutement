#!/usr/bin/env bash
# Occupation des disques, lancée toutes les heures par recrutement-verif-disque.timer (ou à la main), en tant que deploy :
#   deploy/verif-disque.sh
# Au-delà de 80 % sur le disque racine ou sur celui du dossier Docker (images, volumes, dont la base), ou si la mesure
# est impossible : échec signalé à HEALTHCHECK_DISQUE_URL, code 1. Sinon : succès signalé, code 0.
set -euo pipefail

SEUIL=80

arret() { echo "ARRÊT : $*" >&2; exit 1; }

# shellcheck source=deploy/healthchecks.sh
. "$(dirname "$0")/healthchecks.sh"

# Occupation en % (entier) du système de fichiers qui porte le chemin donné ; vide si df échoue.
occupation() { df --output=pcent "$1" 2>/dev/null | tail -n 1 | tr -dc '0-9'; }

main() {
  [ "$(id -u)" -ne 0 ] || arret "à lancer en tant que deploy, pas en root."
  [ $# -eq 0 ] || { echo "Usage : $0" >&2; exit 2; }
  umask 077
  cd "$(dirname "$0")/.."

  local outil
  for outil in docker curl; do
    command -v "$outil" >/dev/null 2>&1 || arret "« $outil » est absent."
  done
  [ -f .env ] || arret "$(pwd -P)/.env est absent."
  lire_reglages || arret "Compose ne peut pas lire les réglages (.env incomplet ?)."
  local hc
  hc=$(adresse_hc HEALTHCHECK_DISQUE_URL HEALTHCHECK_SAUVEGARDE_URL) || exit 1

  local dossier_docker racine docker_pc
  dossier_docker=$(docker info -f '{{.DockerRootDir}}' 2>/dev/null || true)
  if [ -z "$dossier_docker" ]; then
    ping_hc "$hc/fail" "Mesure impossible : Docker ne répond pas." || true
    arret "Docker ne répond pas : occupation du dossier Docker inconnue."
  fi
  racine=$(occupation /) || racine=""
  docker_pc=$(occupation "$dossier_docker") || docker_pc=""
  if [ -z "$racine" ] || [ -z "$docker_pc" ]; then
    ping_hc "$hc/fail" "Mesure impossible : df a échoué." || true
    arret "df a échoué sur / ou $dossier_docker."
  fi

  local resume="Disque racine : $racine % ; dossier Docker : $docker_pc % ; seuil : $SEUIL %."
  if [ "$racine" -gt "$SEUIL" ] || [ "$docker_pc" -gt "$SEUIL" ]; then
    ping_hc "$hc/fail" "Disque presque plein. $resume" || true
    arret "disque presque plein. $resume"
  fi
  ping_hc "$hc" "$resume" || arret "occupation normale, mais le succès n'a pas pu être signalé. $resume"
  echo "$resume"
}

main "$@"
