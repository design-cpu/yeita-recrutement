#!/usr/bin/env bash
# Sauvegarde de la base, lancée chaque nuit par recrutement-backup.timer (ou à la main), en tant que deploy :
#   deploy/backup.sh
# Copie contrôlée dans le conteneur api (node api/sauvegarde.js), récupérée dans /var/backups/recrutement, chiffrée
# avec age pour AGE_RECIPIENT (seule la clé publique est sur le serveur), copie en clair supprimée, envoi par rclone vers
# RCLONE_DEST, copies chiffrées gardées 30 jours. Succès ou échec signalé à HEALTHCHECK_SAUVEGARDE_URL.
# Code 0 si tout est fait (envoi et signalement compris), 1 sinon. Rien n'est jamais effacé à distance.
set -euo pipefail

DOSSIER_COPIES=/var/backups/recrutement
VERROU="$DOSSIER_COPIES/.backup.lock"   # aussi pris par ExecStopPost de recrutement-backup.service
VERROU_DEPLOIEMENT="$HOME/.recrutement-deploy.lock"   # celui de deploy/deploy.sh
# Attentes en secondes ; réduites par tools/test-sauvegarde.sh.
ATTENTE_DEPLOIEMENT=${RECRUTEMENT_ATTENTE_DEPLOIEMENT:-600}
ATTENTE_API=${RECRUTEMENT_ATTENTE_API:-120}
MINUTES_LOCALES=$((30 * 24 * 60))
MOTIF_COPIE='^/data/sauvegardes/recrutement-[0-9]{4}-[0-9]{2}-[0-9]{2}\.db$'

arret() { echo "ARRÊT : $*" >&2; exit 1; }
info() { echo "· $*"; }
for attente in "$ATTENTE_DEPLOIEMENT" "$ATTENTE_API"; do
  { [[ "$attente" =~ ^[0-9]+$ ]] && [ "$attente" -ge 2 ]; } || arret "durée d'attente invalide : « $attente » (entier ≥ 2 attendu)."
done

# shellcheck source=deploy/healthchecks.sh
. "$(dirname "$0")/healthchecks.sh"

# Échec d'une étape : la sortie (trap EXIT) nettoie et signale.
echec() { echo "ÉCHEC ($ETAPE) : $1" >&2; exit 1; }

# Toute sortie après la validation des adresses : clair et temporaires d'abord, puis l'échec est signalé.
fin() {
  local code=$1
  trap - EXIT INT TERM HUP
  rm -f "${CLAIR:-}" "${CHIFFRE_TMP:-}"
  [ "$code" -ne 0 ] || exit 0
  ping_hc "$HC_URL/fail" "Échec : $ETAPE (code $code)." || true
  exit "$code"
}

main() {
  [ "$(id -u)" -ne 0 ] || arret "à lancer en tant que deploy, pas en root."
  [ $# -eq 0 ] || { echo "Usage : $0" >&2; exit 2; }
  umask 077
  cd "$(dirname "$0")/.."

  { [ -d "$DOSSIER_COPIES" ] && [ -w "$DOSSIER_COPIES" ]; } || arret "$DOSSIER_COPIES est absent ou non inscriptible (deploy/prepare-serveur.sh)."
  exec 9>"$VERROU"
  flock -n 9 || arret "une sauvegarde est déjà en cours (verrou $VERROU)."

  # --- (1) Adresses de ping : dès qu'elles sont valides, tout échec est signalé ---
  local outil
  for outil in docker curl flock; do
    command -v "$outil" >/dev/null 2>&1 || arret "« $outil » est absent."
  done
  [ -f .env ] || arret "$(pwd -P)/.env est absent."
  lire_reglages || arret "Compose ne peut pas lire les réglages (.env incomplet ?)."
  HC_URL=$(adresse_hc HEALTHCHECK_SAUVEGARDE_URL HEALTHCHECK_DISQUE_URL) || exit 1
  ETAPE="réglages"
  CLAIR="" CHIFFRE_TMP=""
  trap 'fin $?' EXIT
  trap 'ETAPE="$ETAPE (interrompue)"; exit 1' INT TERM HUP

  # --- (2) Outils et autres réglages ---
  for outil in age rclone; do
    command -v "$outil" >/dev/null 2>&1 || echec "« $outil » est absent (apt install age rclone ; deploy/README.md)."
  done
  local destinataire destination
  destinataire=$(reglage_valide AGE_RECIPIENT) || echec "AGE_RECIPIENT refusée."
  destination=$(reglage_valide RCLONE_DEST) || echec "RCLONE_DEST refusée."
  [[ "$destinataire" =~ ^age1[a-z0-9]+$ ]] || echec "AGE_RECIPIENT doit être une seule clé publique age (age1…), pas une clé SSH."
  age -r "$destinataire" -o /dev/null </dev/null 2>/dev/null || echec "AGE_RECIPIENT n'est pas une clé publique age valide."
  # Jamais en tête « - » : rclone la lirait comme une option.
  [[ "$destination" == *:* && "$destination" != -* ]] || echec "RCLONE_DEST doit être de la forme <remote>:<chemin> (deploy/README.md)."

  # --- Dossier des copies (verrou tenu) : jamais de clair laissé par une coupure ---
  [ "$(stat -c %a "$DOSSIER_COPIES")" = 700 ] || echec "$DOSSIER_COPIES n'est pas en 700."
  find "$DOSSIER_COPIES" -maxdepth 1 -type f \( -name 'recrutement-*.db' -o -name 'recrutement-*.db.age.tmp' \) -delete

  # --- Pas pendant un déploiement (deploy.sh recrée les conteneurs et met le dépôt à jour) ---
  ETAPE="attente d'un déploiement en cours"
  exec 8>"$VERROU_DEPLOIEMENT"
  flock -w "$ATTENTE_DEPLOIEMENT" 8 || echec "un déploiement est en cours depuis plus de $ATTENTE_DEPLOIEMENT s."

  # --- (3) Copie contrôlée dans le conteneur, api saine ---
  ETAPE="api non saine"
  local i sante=""
  for i in $(seq 1 $((ATTENTE_API / 2))); do
    sante=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$(docker compose ps -q api 2>/dev/null)" 2>/dev/null || true)
    [ "$sante" = healthy ] && break
    [ "$i" -lt $((ATTENTE_API / 2)) ] || echec "l'api n'est pas saine après $ATTENTE_API s (état : ${sante:-inconnu})."
    sleep 2
  done
  ETAPE="copie dans le conteneur api"
  local sortie chemin nom horodatage
  horodatage=$(date -u +%Y-%m-%dT%H%M%SZ)
  sortie=$(docker compose exec -T api node api/sauvegarde.js --nettoyer) || echec "node api/sauvegarde.js a échoué (docker compose logs api)."
  chemin=$(printf '%s\n' "$sortie" | tail -n 1)
  [[ "$chemin" =~ $MOTIF_COPIE ]] || echec "dernière ligne inattendue de sauvegarde.js."
  printf '%s\n' "$sortie" | sed '$d'
  nom=$(basename "$chemin")

  # --- (4) Récupération ---
  ETAPE="récupération (docker compose cp)"
  CLAIR="$DOSSIER_COPIES/$nom"
  docker compose cp "api:$chemin" "$CLAIR" >/dev/null || echec "docker compose cp a échoué."
  [ -s "$CLAIR" ] || echec "copie récupérée vide."

  # --- (5) Chiffrement : un nom par exécution, rien n'est écrasé ---
  ETAPE="chiffrement (age)"
  local chiffre="$DOSSIER_COPIES/recrutement-$horodatage.db.age"
  CHIFFRE_TMP="$chiffre.tmp"
  if [ -e "$chiffre" ] || [ -e "$CHIFFRE_TMP" ]; then
    CHIFFRE_TMP=""   # pas à nous : à ne pas supprimer en sortant
    echec "$(basename "$chiffre") existe déjà : rien n'est écrasé."
  fi
  age -r "$destinataire" -o "$CHIFFRE_TMP" "$CLAIR" || echec "age n'a pas pu chiffrer la copie (disque plein ?)."
  [ "$(head -n 1 "$CHIFFRE_TMP")" = "age-encryption.org/v1" ] || echec "le fichier produit n'est pas chiffré par age : rien n'est envoyé."
  mv "$CHIFFRE_TMP" "$chiffre"
  CHIFFRE_TMP=""
  # --- (6) Plus de clair sur l'hôte ---
  rm -f "$CLAIR"
  CLAIR=""
  local taille
  taille=$(stat -c %s "$chiffre")
  info "Copie chiffrée : $chiffre ($taille octets) ; copie en clair supprimée."

  # --- (7) Envoi ---
  ETAPE="envoi (rclone)"
  rclone copy "$chiffre" "$destination" || echec "rclone copy a échoué."
  info "Copie envoyée."

  # --- (8) Rétention locale, après un envoi réussi seulement ---
  ETAPE="rétention locale"
  local supprimees
  supprimees=$(find "$DOSSIER_COPIES" -maxdepth 1 -type f -name 'recrutement-*.db.age' -mmin +"$MINUTES_LOCALES" -print -delete | wc -l)
  info "Copies chiffrées de plus de 30 jours supprimées : $supprimees."

  # --- (9) Succès ---
  ETAPE="signalement du succès"
  trap - EXIT INT TERM HUP
  ping_hc "$HC_URL" "Sauvegarde réussie (code 0, $taille octets chiffrés)." || arret "la sauvegarde est faite, mais son succès n'a pas pu être signalé."
  echo "Sauvegarde réussie : $(basename "$chiffre") ($taille octets), envoyée."
}

main "$@"
