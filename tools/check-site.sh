#!/usr/bin/env bash
# Contrôle d'un site déployé : pages publiques servies, pages protégées renvoyées vers Google.
# Usage : tools/check-site.sh BASE_URL   (ex. https://recrutement.yeita.fr, https://localhost, http://127.0.0.1:4180)
# Sortie : une ligne OK/FAIL par contrôle ; code 0 si tout passe, 1 si un contrôle échoue, 2 si l'appel est mal formé.
set -u

if [ $# -ne 1 ] || [ -z "$1" ]; then
  echo "Usage : $0 BASE_URL" >&2
  exit 2
fi
case "$1" in
  http://*|https://*) ;;
  *) echo "BASE_URL doit commencer par http:// ou https:// : $1" >&2; exit 2 ;;
esac
BASE="${1%/}"

# Le certificat local de Caddy (DOMAIN=localhost) n'est pas reconnu : on ne le vérifie que pour localhost.
CURL=(curl -s -o /dev/null --max-time 10)
host="${BASE#*://}"; host="${host%%/*}"; host="${host%%:*}"
[ "$host" = "localhost" ] && CURL+=(-k)

GOOGLE="https://accounts.google.com/"
echecs=0

# controle <chemin> <code attendu> [<début de la redirection attendue>]
controle() {
  local chemin="$1" attendu="$2" vers="${3:-}" res code loc
  res=$("${CURL[@]}" -w '%{http_code} %{redirect_url}' "$BASE$chemin")
  code="${res%% *}"; loc="${res#* }"
  if [ "$code" = "$attendu" ] && { [ -z "$vers" ] || [ "${loc#"$vers"}" != "$loc" ]; }; then
    echo "OK    $chemin → $code${vers:+ vers $vers}"
  else
    echo "FAIL  $chemin → reçu ${code:-aucune réponse}${loc:+ vers $loc}, attendu $attendu${vers:+ vers $vers}"
    echecs=$((echecs + 1))
  fi
}

controle /one-pager.html 200
controle /index.html 200
controle /candidatures/ 302 "$GOOGLE"
controle /assets/data-diamants.js 302 "$GOOGLE"
controle /ping 200

if [ "$echecs" -gt 0 ]; then
  echo "$echecs contrôle(s) en échec sur $BASE"
  exit 1
fi
echo "Tout est OK sur $BASE"
