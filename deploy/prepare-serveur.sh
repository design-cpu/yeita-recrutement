#!/usr/bin/env bash
# Préparation du serveur, une seule fois : sudo deploy/prepare-serveur.sh "<clé publique SSH de deploy>"
# Prudent sur un serveur partagé : n'installe rien, ne touche ni au pare-feu, ni aux autres services,
# ni aux ports 80 et 443. Tout est vérifié avant la première modification ; au moindre doute, il s'arrête
# sans rien changer. Une seconde exécution ne change rien.
# RECRUTEMENT_REPO (facultatif) : URL du dépôt à cloner, pour les essais ; par défaut le dépôt public GitHub.
set -euo pipefail

UTILISATEUR=deploy
DOSSIER=/opt/recrutement
SAUVEGARDES=/var/backups/recrutement
DEPOT="${RECRUTEMENT_REPO:-https://github.com/design-cpu/yeita-recrutement.git}"
PROJET=recrutement
SOUS_RESEAU=172.30.0.0/24
PORT=4180

arret() { echo "ARRÊT : $*" >&2; echo "Rien n'a été modifié." >&2; exit 1; }
info() { echo "· $*"; }

if [ $# -ne 1 ] || [ -z "$1" ]; then
  echo "Usage : sudo $0 \"<clé publique SSH>\"" >&2
  exit 2
fi
CLE="$1"
[ "$(id -u)" -eq 0 ] || arret "lancer avec sudo (droits root nécessaires pour créer l'utilisateur et les dossiers)."

# --- 1. Outils présents (rien n'est installé) ---
for outil in docker git flock ss ip curl ssh-keygen useradd runuser getent stat; do
  command -v "$outil" >/dev/null 2>&1 || arret "« $outil » est absent. Installez-le vous-même ; ce script n'installe rien."
done
# Sauvegardes (deploy/backup.sh) : chiffrement et envoi hors du serveur.
for outil in age rclone; do
  command -v "$outil" >/dev/null 2>&1 || arret "« $outil » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien."
done
docker compose version >/dev/null 2>&1 || arret "le plugin Docker Compose est absent (« docker compose version » échoue)."
docker info >/dev/null 2>&1 || arret "Docker ne répond pas (« docker info » échoue)."
getent group docker >/dev/null || arret "le groupe « docker » n'existe pas."
info "Outils présents : docker, docker compose, git, flock, ss, ip, curl, ssh-keygen, useradd, runuser, age, rclone."

# --- 2. Clé SSH ---
case "$CLE" in *$'\n'*) arret "la clé doit tenir sur une seule ligne." ;; esac
fichier_cle=$(mktemp)
printf '%s\n' "$CLE" > "$fichier_cle"
if ! ssh-keygen -l -f "$fichier_cle" >/dev/null 2>&1; then rm -f "$fichier_cle"; arret "la clé SSH donnée n'est pas une clé publique valide."; fi
rm -f "$fichier_cle"
info "Clé SSH valide."

# --- 3. Conteneurs du projet « recrutement » venus d'un autre dossier ---
# Compose ne pose le dossier que sur les conteneurs : ce sont eux qui disent à qui appartient le nom.
etrangers=$(docker ps -a --filter "label=com.docker.compose.project=$PROJET" \
  --format '{{.Names}} {{.Label "com.docker.compose.project.working_dir"}}' | awk -v d="$DOSSIER" '$2 != d')
[ -z "$etrangers" ] || arret "des conteneurs du projet Compose « $PROJET » viennent d'un autre dossier que $DOSSIER :
$etrangers"

# --- 4. Port 4180 libre, ou tenu par le projet ---
publie=$(docker ps --format '{{.Names}} {{.Label "com.docker.compose.project"}} {{.Label "com.docker.compose.project.working_dir"}} {{.Ports}}' | grep -E ":$PORT->" || true)
a_nous=$(printf '%s\n' "$publie" | awk -v p="$PROJET" -v d="$DOSSIER" 'NF && $2 == p && $3 == d')
autres=$(printf '%s\n' "$publie" | awk -v p="$PROJET" -v d="$DOSSIER" 'NF && !($2 == p && $3 == d)')
[ -z "$autres" ] || arret "le port $PORT est publié par un autre conteneur :
$autres"
if [ -z "$a_nous" ] && [ -n "$(ss -Hltn "sport = :$PORT")" ]; then
  arret "le port $PORT est déjà utilisé sur ce serveur :
$(ss -Hltnp "sport = :$PORT")"
fi
info "Port $PORT libre${a_nous:+ (tenu par le projet)}."

# --- 5. Sous-réseau 172.30.0.0/24 libre ---
# shellcheck disable=SC2086  # découpage voulu sur les points
ip_en_entier() { local IFS=.; set -- $1; echo $(( ($1 << 24) + ($2 << 16) + ($3 << 8) + $4 )); }
chevauche() { # chevauche a.b.c.d/n e.f.g.h/m
  local a="${1%/*}" n="${1#*/}" b="${2%/*}" m="${2#*/}" ia ib fa fb
  [ "$n" = "$1" ] && n=32; [ "$m" = "$2" ] && m=32
  ia=$(ip_en_entier "$a"); ib=$(ip_en_entier "$b")
  fa=$(( ia | ((1 << (32 - n)) - 1) )); ia=$(( ia & ~((1 << (32 - n)) - 1) & 0xFFFFFFFF ))
  fb=$(( ib | ((1 << (32 - m)) - 1) )); ib=$(( ib & ~((1 << (32 - m)) - 1) & 0xFFFFFFFF ))
  [ "$ia" -le "$fb" ] && [ "$ib" -le "$fa" ]
}
notre_reseau="${PROJET}_edge"
notre_pont=""
for id in $(docker network ls -q); do
  nom=$(docker network inspect -f '{{.Name}}' "$id")
  for reseau in $(docker network inspect -f '{{range .IPAM.Config}}{{.Subnet}} {{end}}' "$id"); do
    case "$reseau" in *:*) continue ;; esac   # IPv6
    if chevauche "$reseau" "$SOUS_RESEAU"; then
      if [ "$nom" = "$notre_reseau" ] && [ "$reseau" = "$SOUS_RESEAU" ]; then notre_pont="br-${id:0:12}"
      else arret "le sous-réseau $SOUS_RESEAU chevauche le réseau Docker « $nom » ($reseau)."; fi
    fi
  done
done
while read -r destination reste; do
  case "$destination" in default|*:*|"") continue ;; esac
  chevauche "$destination" "$SOUS_RESEAU" || continue
  case " $reste " in *" dev $notre_pont "*) [ -n "$notre_pont" ] && continue ;; esac
  arret "le sous-réseau $SOUS_RESEAU chevauche une route du serveur : $destination $reste"
done < <(ip -4 route show)
info "Sous-réseau $SOUS_RESEAU libre${notre_pont:+ (tenu par le projet)}."

# --- 6. Utilisateur deploy ---
creer_utilisateur=non
if id "$UTILISATEUR" >/dev/null 2>&1; then
  [[ " $(id -nG "$UTILISATEUR") " == *" docker "* ]] || arret "l'utilisateur « $UTILISATEUR » existe déjà et n'est pas dans le groupe docker : il sert peut-être à un autre service. Lui donner ce groupe équivaut à des droits root ; c'est à vous d'en décider."
  info "Utilisateur $UTILISATEUR présent, dans le groupe docker."
else
  getent group "$UTILISATEUR" >/dev/null && arret "un groupe « $UTILISATEUR » existe déjà sans utilisateur du même nom."
  creer_utilisateur=oui
fi

# --- 7. Dossier du dépôt ---
cloner=non
if [ -d "$DOSSIER" ] && [ -z "$(ls -A "$DOSSIER")" ] && [ "$creer_utilisateur" = non ] && [ "$(stat -c %U "$DOSSIER")" = "$UTILISATEUR" ]; then
  cloner=oui   # dossier vide laissé par une exécution interrompue
elif [ -e "$DOSSIER" ]; then
  [ "$creer_utilisateur" = non ] || arret "$DOSSIER existe déjà alors que l'utilisateur $UTILISATEUR n'existe pas."
  [ -d "$DOSSIER/.git" ] || arret "$DOSSIER existe et n'est pas un dépôt git."
  [ "$(stat -c %U "$DOSSIER")" = "$UTILISATEUR" ] || arret "$DOSSIER n'appartient pas à $UTILISATEUR."
  origine=$(runuser -u "$UTILISATEUR" -- git -C "$DOSSIER" remote get-url origin 2>/dev/null || true)
  [ "$origine" = "$DEPOT" ] || arret "$DOSSIER est un dépôt d'une autre origine : « $origine » (attendu « $DEPOT »)."
  info "Dépôt $DOSSIER présent ($DEPOT)."
else
  cloner=oui
fi

# --- 8. Dossier des sauvegardes ---
creer_sauvegardes=non
if [ -e "$SAUVEGARDES" ]; then
  if [ ! -d "$SAUVEGARDES" ] || [ "$(stat -c %U "$SAUVEGARDES")" != "$UTILISATEUR" ]; then
    arret "$SAUVEGARDES existe et n'est pas un dossier de $UTILISATEUR."
  fi
  [ "$(stat -c %a "$SAUVEGARDES")" = 700 ] || arret "$SAUVEGARDES existe avec le mode $(stat -c %a "$SAUVEGARDES") au lieu de 700."
  info "Dossier $SAUVEGARDES présent (700)."
else
  creer_sauvegardes=oui
fi

# --- Modifications : tout ce qui précède est vérifié ---
if [ "$creer_utilisateur" = oui ]; then
  useradd --create-home --shell /bin/bash --groups docker "$UTILISATEUR"
  info "Utilisateur $UTILISATEUR créé, dans le groupe docker."
fi

maison=$(getent passwd "$UTILISATEUR" | cut -d: -f6)
install -d -m 700 -o "$UTILISATEUR" -g "$UTILISATEUR" "$maison/.ssh"
cles="$maison/.ssh/authorized_keys"
[ -e "$cles" ] || install -m 600 -o "$UTILISATEUR" -g "$UTILISATEUR" /dev/null "$cles"
if grep -qxF -- "$CLE" "$cles"; then
  info "Clé SSH déjà autorisée."
else
  printf '%s\n' "$CLE" >> "$cles"
  info "Clé SSH ajoutée à $cles."
fi

if [ "$cloner" = oui ]; then
  install -d -m 755 -o "$UTILISATEUR" -g "$UTILISATEUR" "$DOSSIER"
  if ! runuser -u "$UTILISATEUR" -- git clone --quiet "$DEPOT" "$DOSSIER"; then
    rmdir "$DOSSIER" 2>/dev/null || true
    echo "ARRÊT : le clone de $DEPOT a échoué ; $DOSSIER est retiré. Relancer le script après correction." >&2
    exit 1
  fi
  info "Dépôt cloné dans $DOSSIER par $UTILISATEUR."
fi

if [ "$creer_sauvegardes" = oui ]; then
  install -d -m 700 -o "$UTILISATEUR" -g "$UTILISATEUR" "$SAUVEGARDES"
  info "Dossier $SAUVEGARDES créé (700)."
fi

echo "Serveur prêt. Suite : créer $DOSSIER/.env (voir deploy/README.md), puis, en tant que $UTILISATEUR : $DOSSIER/deploy/deploy.sh"
