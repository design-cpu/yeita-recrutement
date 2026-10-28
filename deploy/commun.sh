# Fonctions communes à backup.sh et verif-disque.sh : réglages de .env tels que Compose les lit, et état des
# sauvegardes écrit dans le volume de l'api (lu par GET /api/sauvegardes, page admin/sauvegardes.html).
# Chargé par « . deploy/commun.sh » depuis la racine du dépôt ; ne fait rien seul.
# shellcheck shell=bash

# Réglages résolus par Compose (commentaires, guillemets, variables exportées dans le shell compris).
lire_reglages() { REGLAGES=$(docker compose config --environment); }
reglage() { printf '%s\n' "$REGLAGES" | sed -n "s/^$1=//p" | tail -n 1; }

# Valeur d'un réglage, refusée (message, code 1) si vide, réduite à un commentaire ou égale à sa valeur d'exemple.
reglage_valide() {
  local v; v=$(reglage "$1")
  if [ -z "$v" ]; then echo "ARRÊT : $1 est vide ou absente de .env." >&2; return 1; fi
  case "$v" in "#"*) echo "ARRÊT : $1 est vide (seul un commentaire suit le signe =)." >&2; return 1 ;; esac
  if [ "$v" = "$(sed -n "s/^$1=//p" .env.example | tail -n 1)" ]; then
    echo "ARRÊT : $1 a encore sa valeur d'exemple : remplacez-la (deploy/CLE-SAUVEGARDE.md)." >&2; return 1
  fi
  printf '%s\n' "$v"
}

# Date du moment, en UTC (ISO 8601).
maintenant() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# ecrire_etat <fichier> <json> : écrit /data/etat/<fichier> dans le volume de l'api, par un conteneur jetable (fonctionne
# api arrêtée), en tant que node, sous un nom temporaire puis renommé. Le JSON ne contient que des dates, des nombres et
# des textes fixes : jamais de donnée de candidat. Code non nul si Docker ne répond pas.
ecrire_etat() {
  printf '%s\n' "$2" | docker compose run --rm --no-deps -T api sh -c \
    "umask 077 && mkdir -p /data/etat && cat > /data/etat/.$1.tmp && mv /data/etat/.$1.tmp /data/etat/$1" >/dev/null 2>&1
}
