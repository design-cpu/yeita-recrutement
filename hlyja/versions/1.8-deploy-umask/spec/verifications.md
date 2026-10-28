---
type: verifications
version: 1.8
total: 8
ecarts: 1
date: 2026-10-28
---

# Vérifications — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> 8 vérifications, 1 écart avec la fiche : l'image du site (`front`) est exposée au même titre que l'API.

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | `deploy.sh` ne fixe pas de masque | `grep -c umask deploy/deploy.sh` | 0 | R1 |
| V2 | git écrit les fichiers selon le masque du shell | clone dans le scratchpad, `rm api/server.js && (umask 077 && git checkout -- api/server.js)`, `stat` | `600` ; témoin `umask 022` : `644` | R1 |
| V3 | un fichier 600 est illisible dans l'image api | même clone, `docker build -f docker/api.Dockerfile`, `node -e readFileSync('/app/api/server.js')` | `EACCES` ; témoin 644 : `lisible` | CA1 |
| V4 | l'image du site est exposée aussi | `docker/front.Dockerfile` : `COPY . .`, `tools/build.py` copie par `shutil.copytree` (qui garde les droits), puis `oauth2-proxy` (non root) sert `/srv/site` | constaté, non exécuté | CA1 vérifie aussi `front` |
| V5 | où écrit `deploy.sh` | lecture : verrou `exec 9>"$VERROU"` (l. 30), `git fetch` (l. 88), `git checkout --detach` (l. 95), `git checkout main` + `git pull` (l. 98-99) ; `docker compose build` lit le dépôt | le verrou est le premier fichier créé | R1 : masque fixé avant toute écriture, en tête du script |
| V6 | le script lancé est celui d'avant le `git pull` | commentaire l. 20 (« bash le lit en entier avant d'agir ») ; `deploy/README.md` § 9b | confirmé | Le premier passage à la 1.8 tourne avec l'ancien script : `umask 022 &&` reste dans les pages (R3) |
| V7 | numéros de ligne de `deploy.sh` cités par la doc | `grep -rnE "l\. ?[0-9]+" hlyja/technique deploy/*.md` | `mise-a-jour-production.md` l. 100-111, 132, 137 ; `deploiement-ovh.md` l. 35-52, 120-132 | R4 |
| V8 | shellcheck sur `deploy.sh` actuel | `docker run --rm -e LC_ALL=C.UTF-8 -v "$PWD:/mnt:ro" -w /mnt koalaman/shellcheck:v0.10.0 -x deploy/deploy.sh` | code 0, aucune remarque | CA4 |

## Détail
V3 : `Error: EACCES: permission denied, open '/app/api/server.js'` (2026-10-28, clone jetable du scratchpad, image supprimée).
