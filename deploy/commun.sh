# Fonctions communes à backup.sh et verif-disque.sh : réglages de .env tels que Compose les lit, et ping healthchecks.io.
# Chargé par « . deploy/healthchecks.sh » depuis la racine du dépôt ; ne fait rien seul.
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
    echo "ARRÊT : $1 a encore sa valeur d'exemple : remplacez-la (deploy/README.md)." >&2; return 1
  fi
  printf '%s\n' "$v"
}

# Adresse de ping $1, refusée si invalide ou égale à l'adresse de l'autre contrôle ($2) : les pings de l'un
# garderaient l'autre au vert.
adresse_hc() {
  local v; v=$(reglage_valide "$1") || return 1
  if [[ ! "$v" =~ ^https://[^[:space:]\"\\]+$ ]]; then
    echo "ARRÊT : $1 doit être une adresse https:// de healthchecks.io, sans espace ni guillemet." >&2; return 1
  fi
  if [ "$v" = "$(reglage "$2")" ]; then
    echo "ARRÊT : $1 et $2 sont identiques : il faut deux contrôles healthchecks.io distincts." >&2; return 1
  fi
  printf '%s\n' "$v"
}

# Ping : l'adresse passe par un fichier de configuration de curl (jamais en argument, lisible dans ps par tous les
# comptes du serveur), le corps sur l'entrée standard ; 3 essais de 10 s au plus. Réussi seulement si la réponse vaut
# exactement « OK » : healthchecks.io répond aussi 200 à une adresse inconnue (« OK (not found) »).
ping_hc() { # ping_hc <adresse> <corps>
  local reponse
  if ! reponse=$(printf '%s\n' "$2" | curl -sS --max-time 10 --retry 2 --retry-delay 2 --retry-connrefused \
      -K <(printf 'url = "%s"\n' "$1") --data-binary @- 2>&1); then
    echo "Signalement à healthchecks.io impossible (réseau ?)." >&2; return 1
  fi
  case "$reponse" in
    OK) return 0 ;;
    *"rate limited"*) echo "Signalement ignoré par healthchecks.io : trop de pings, réessayer dans une minute." >&2 ;;
    *"not found"*) echo "Signalement refusé : adresse de contrôle inconnue de healthchecks.io." >&2 ;;
    *) echo "Signalement refusé par healthchecks.io (réponse inattendue)." >&2 ;;
  esac
  return 1
}
