---
type: technique
page: architecture
titre: Architecture et déploiement
maj: 1.9
commit: 5e41a2d
sources: api/server.js, api/package.json, deploy/README.md, assets/config.js, docker/front.Dockerfile, docker/api.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/Caddyfile, deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/backup.sh, deploy/verif-disque.sh, deploy/commun.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, tools/check-site.sh, tools/build.py, .env.example, .dockerignore, admin/sauvegardes.html, api/src/sauvegardes.js, deploy/auto-deploy.sh, deploy/systemd/recrutement-deploy.service, deploy/systemd/recrutement-deploy.timer, deploy/systemd/recrutement-deploy.path, admin/deploiement.html, api/src/deploiement.js
date: 2026-10-28
---

# Architecture et déploiement

> Le site statique est construit par `tools/build.py` et servi par oauth2-proxy dans Docker, sur le serveur OVH partagé de Yeita ; une liste fermée de pages est publique, le reste exige un compte Google @yeita.fr.
> v1.9 : `deploy/auto-deploy.sh`, planifié par systemd (10 min) et réveillé par les demandes de `/admin/deploiement.html`, teste puis met en ligne le dernier commit de `main` ([Déploiement automatique](deploiement-automatique.md)).
> v1.3 : l'API de stockage (`api/`, Node.js, SQLite) tourne dans Docker (service `api`), jointe par oauth2-proxy seul sous `/api/`, sur un réseau interne sans adresse côté hôte ; les pages l'utilisent quand elle répond ([Mode serveur](mode-serveur.md), [API de stockage](api.md)).

## Vue d'ensemble
```mermaid
flowchart LR
  N[Navigateur] -->|HTTPS| P{Proxy de l'hôte, cas A\nou service caddy, cas B}
  P -->|127.0.0.1:4180 ou front:4180| F[front : oauth2-proxy v7.15.5]
  F -->|chemin public ou session @yeita.fr| S[/srv/site, fichiers statiques]
  F -->|/api/ avec session : X-Forwarded-Email| A[api : Node 22, réseau back]
  A --> V[(volume recrutement_data)]
  F -->|sinon : 302, /api/ sans session : 401| G[accounts.google.com]
```

## Stack
| Élément | Version | Rôle | Depuis |
|---|---|---|---|
| `python:3.12-slim` | flottant (décision du pitch) | étape de construction de l'image : `python3 tools/build.py /site` | 1.1 |
| `quay.io/oauth2-proxy/oauth2-proxy` | `v7.15.5` | sert `/srv/site` (upstream `file://`) et impose la connexion Google | 1.1 |
| `caddy` | `2.11.7` | HTTPS automatique du cas B, en-têtes de sécurité | 1.1 |
| Docker Compose | plugin `docker compose` | projet `recrutement` | 1.1 |
| Node.js | `>=22` (`api/package.json`, `engines`) | API de stockage `api/` | 1.2 |
| `fastify` | `5.12.7` | serveur HTTP de l'API | 1.2 |
| `better-sqlite3` | `13.0.3` | base SQLite de l'API (binaires fournis, `api/.npmrc` `ignore-scripts=true`) | 1.2 |
| `@fastify/static` | `10.1.6` | site construit servi par l'API en mode local (`DEV_STATIC`) | 1.2 |
| `age` | 1.2.1 (paquet Ubuntu 26.04, installé par l'administrateur) | chiffrement des copies de la base pour une clé publique (`AGE_RECIPIENT`) ; la clé privée n'est jamais sur le serveur | 1.7 |
| `node:22.23.4-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d` | figée par le digest de l'index multi-architecture (exception à l'âge de 14 jours, décision de l'utilisateur) | image `api` | 1.3 |

## Image `front` (`docker/front.Dockerfile`)
| Étape | Base | Contenu |
|---|---|---|
| `build` | `python:3.12-slim` | `COPY . .` (contexte filtré par `.dockerignore` : `.git`, `hlyja`, `_site`, `.env*`, `*.swp`, `*~` ; v1.3 : `api/node_modules`, `api/data`, `**/*.sqlite`, `**/*.sqlite-wal`, `**/*.sqlite-shm`), `python3 tools/build.py /site` |
| finale | `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5` | `LABEL fr.yeita.projet=recrutement`, `COPY --from=build /site /srv/site` ; image sans shell (distroless) |
Construite depuis la racine (`build.context: .`), nommée `recrutement-front`.

## Image `api` (`docker/api.Dockerfile`, v1.3)
| Élément | Valeur |
|---|---|
| Base | `node:22.23.4-slim@sha256:de170b…`, `LABEL fr.yeita.projet=recrutement` |
| Installation | `WORKDIR /app/api`, copie de `package.json`, `package-lock.json`, `.npmrc` (`ignore-scripts=true`), `npm ci --omit=dev`, puis copie de `api/` |
| Données | `/data` propriétaire `node`, mode 700 ; base en 600 |
| Exécution | `USER node`, `WORKDIR /app`, `ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000 DB_PATH=/data/recrutement.sqlite`, `CMD ["node", "api/server.js"]` |
| Santé | `HEALTHCHECK` 30 s / 5 s / 10 s de démarrage / 3 essais, en Node : `/data` inscriptible (`fs.accessSync('/data', W_OK)` ; un volume en lecture seule laisserait lire et rendrait 500 à chaque écriture, QA v1.3 B2) puis `fetch('http://127.0.0.1:8000/api/sante', {signal: AbortSignal.timeout(4000)})`, sain seulement sur 200 |
Gestion de l'équipe : `docker compose exec api node api/equipe.js …` (même `DB_PATH`). Poids : ~418 Mo.

## Services Compose (`compose.yaml`, `name: recrutement`)
| Service | Image | Ports de l'hôte | Variables (`.env`) | Volumes | Profil |
|---|---|---|---|---|---|
| `front` | `recrutement-front` | `127.0.0.1:4180:4180` seulement | `OAUTH2_PROXY_CLIENT_ID`, `_CLIENT_SECRET`, `_COOKIE_SECRET`, `_REDIRECT_URL` (obligatoires, `${VAR:?}`) | `./deploy/oauth2-proxy.cfg` → `/etc/oauth2-proxy/oauth2-proxy.cfg` (lecture seule) | — |
| `api` (v1.3) | `recrutement-api` | **aucun** | aucune (`environment` absent ; `DEV_EMAIL` et `DEV_STATIC` jamais) | `data` → `/data` (volume nommé `recrutement_data`, étiquette `fr.yeita.projet=recrutement`) | — |
| `caddy` | `caddy:2.11.7` | `80`, `443`, `443/udp` | `DOMAIN` (obligatoire) | `./deploy/Caddyfile` (lecture seule), `caddy_data`, `caddy_config` | `caddy` |
Réseaux : `front` sur `edge` et `back`, `api` sur `back` seul, `caddy` sur `edge` seul. `edge` : bridge `recrutement_edge`, 172.30.0.0/24. `back` (v1.3) : `internal: true` (aucune sortie), `enable_ipv6: false`, `driver_opts` `com.docker.network.bridge.inhibit_ipv4: "true"` (pont sans adresse côté hôte : sans cela, sur Linux, l'hôte et tout conteneur en réseau hôte joignent l'api par son adresse ; vérifié v1.3, V30, V31, V39, V40). La route par défaut de `front` passe par `edge` (V38). Communs : `restart: unless-stopped`, journaux `json-file` 10 Mo × 3. `COMPOSE_PROFILES=caddy` dans `.env` active le cas B.

## oauth2-proxy (`deploy/oauth2-proxy.cfg`)
| Réglage | Valeur | Raison |
|---|---|---|
| `http_address` | `0.0.0.0:4180` | défaut `127.0.0.1:4180` injoignable hors du conteneur (V19) |
| `upstreams` | `file:///srv/site/#/`, `file:///srv/site/#/index.html`, `http://api:8000/api/` (v1.3) | le second sert `/index.html` en 200 (le serveur de fichiers de Go redirigerait vers `/`) ; le troisième envoie `/api/` à l'api avec `X-Forwarded-Email` tiré de la session (un en-tête forgé est écrasé, V7) |
| `api_routes` (v1.3) | `["^/api/"]` | sans session : 401 JSON `{}` au lieu d'une redirection (V5, V9) ; formes non reconnues (`/%61pi/moi`, `/API/moi`) : 302 vers Google |
| `provider`, `email_domains` | `google`, `["yeita.fr"]` | |
| `skip_provider_button` | `true` | redirection directe vers Google |
| `reverse_proxy` | **`false`** | avec `true`, un `X-Forwarded-Uri` forgé depuis une adresse de confiance ouvre une page protégée (vérifié, v1.1) ; conséquence : les journaux ne montrent pas l'adresse du visiteur |
| `trusted_proxy_ips` | `["172.30.0.0/24"]` | sans effet tant que `reverse_proxy = false` |
| `cookie_secure`, `cookie_httponly`, `cookie_samesite` | `true`, `true`, `"lax"` | durée par défaut (168 h) |
| `skip_auth_routes` | `^/$`, `^/index\.html$`, `^/one-pager\.html$`, `^/yeita-match-kit\.html$`, `^/assets/yeita\.css$`, `^/assets/yeita\.js$`, `^/assets/data-yeita-match\.js$`, `^/telechargements/[A-Za-z0-9_-][A-Za-z0-9._-]*$` | liste publique fermée, sur le chemin réel ; `/ping` est public par construction ; `/one-pager.html` doit le rester : `assets/config.js` (`pagesCandidat.tonParcours`) l'envoie aux candidats |

## Caddy (`deploy/Caddyfile`, cas B)
Site `{$DOMAIN}`, `reverse_proxy front:4180`, en-têtes `Strict-Transport-Security "max-age=31536000"`, `X-Content-Type-Options "nosniff"`, `Referrer-Policy "same-origin"`, `X-Frame-Options "DENY"`. Avec `DOMAIN=localhost` ou `*.localhost`, certificat de l'autorité locale de Caddy.

## Cas A et cas B
| Cas | Quand | Qui fait le HTTPS | `COMPOSE_PROFILES` |
|---|---|---|---|
| A | nginx ou Caddy de l'hôte sur 80/443 | le proxy de l'hôte → `127.0.0.1:4180` (exemples dans `deploy/README.md`) | vide |
| B | rien sur 80/443 | service `caddy` | `caddy` |
Proxy de l'hôte conteneurisé ou inconnu : rien n'est modifié, décision du responsable du serveur (`deploy/README.md` § 2).

## Scripts
| Script | Lancé par | Rôle | Garde-fous |
|---|---|---|---|
| `deploy/prepare-serveur.sh "<clé>"` | root, une fois | (v1.7 : exige aussi `age`) utilisateur `deploy` (groupe `docker`), clé SSH, clone dans `/opt/recrutement` (par `deploy`), `/var/backups/recrutement` (700) | n'installe rien ; vérifie outils, port 4180, sous-réseau 172.30.0.0/24 (réseaux Docker et routes), conteneurs `recrutement` d'un autre dossier, `deploy` existant hors groupe `docker`, groupe `deploy` orphelin, origine du dépôt — avant toute modification ; idempotent ; reprend un dossier vide laissé par un clone en échec ; `RECRUTEMENT_REPO` pour les essais |
| `deploy/deploy.sh [commit]` | `deploy` (v1.9 : aussi par `auto-deploy.sh`, `RECRUTEMENT_PAR_AUTO=1`) | `git` (main ou commit de main), `build --pull`, `up -d --remove-orphans --force-recreate`, `image prune --filter label=fr.yeita.projet=recrutement`, attente de `/ping`, puis (v1.3) attente de `api` `healthy` (60 s) si `docker compose config --services`, lu après le changement de commit, contient `api`, `check-site.sh` | `umask 022` avant toute écriture (v1.8) ; v1.9 : `/deploy/PAUSE` dans `.git/info/exclude`, `deploy/PAUSE` écrite après le changement de commit quand le commit n'est pas `origin/main` (sauf `RECRUTEMENT_PAR_AUTO=1`), `~/.recrutement-deploiement/deploye` écrit à « Déploiement réussi » ; réglages lus par `docker compose config --environment` (comme Compose les utilise) et cas B par `config --services` ; verrou `flock` (`~/.recrutement-deploy.lock`), refuse root, `.env` d'exemple (identifiant, secret client, cookie secret), incohérent ou avec une valeur vide suivie d'un commentaire, dépôt modifié ou avec un fichier non suivi (une copie de `.env` serait publiée), conteneurs d'un autre dossier, 80/443 pris en cas B, commit hors `main` ou antérieur à 1.1 ; retire `caddy` sans profil ; commande de retour si `build`, `up` ou le contrôle échouent ; corps dans `main` (lu en entier) |
| `deploy/auto-deploy.sh [--auto\|--nettoyer]` (v1.9) | `deploy`, par `recrutement-deploy.service` (timer `*:0/10`, path sur la demande) ou à la main | Prend la demande déposée par la page (conteneur jetable `api`), valide le commit (`git rev-list --first-parent origin/main`, ≥ 1.9), teste dans un worktree (`~/.recrutement-deploiement/essai`) : `test-store` et `npm test` dans l'image du `FROM` de `docker/api.Dockerfile`, `docker compose build` sous `recrutement-essai-*` ; puis `RECRUTEMENT_PAR_AUTO=1 deploy/deploy.sh <hash>` ; retour automatique par le `deploy.sh` du commit d'avant ; décisions dans `~/.recrutement-deploiement/`, vue de la page par `ecrire_etat deploiement.json` | refuse root ; verrou `~/.recrutement-auto-deploy.lock` attendu 30 min ; demande retirée en premier, lue strictement (fichier ordinaire, 1 024 octets, 4 clés, sans NUL), dossier des demandes remplacé par un lien refusé ; ne lit dans le volume que la demande ; attente du verrou de `deploy.sh` (15 min) ; un `deploy.sh` à la main pendant les tests l'emporte (`annule`) ; `trap` TERM ; corps dans `main` (lu en entier) |
| `deploy/backup.sh` (v1.7) | `deploy`, par `recrutement-backup.timer` (3 h–3 h 15, `Persistent=true`) ou à la main | `docker compose exec -T api node api/sauvegarde.js --nettoyer`, `docker compose cp` vers `/var/backups/recrutement`, `age -r` → `recrutement-<AAAA-MM-JJTHHMMSSZ>.db.age` (600), clair supprimé, rétention locale 30 j après une sauvegarde réussie, état écrit (`sauvegarde-derniere.json`, `sauvegarde-reussie.json`) ; **les copies restent sur le serveur** | refuse root ; `umask 077` ; dossier absent → état `echec` ; verrou `/var/backups/recrutement/.backup.lock` (pris → code 1, aucun état) puis verrou de `deploy.sh` attendu 10 min ; `AGE_RECIPIENT` lue par `docker compose config --environment` (vide, `#…`, exemple, clé `age1…` seule) ; dossier 700 ; api `healthy` attendue 120 s ; dernière ligne de `sauvegarde.js` contrôlée ; en-tête `age-encryption.org/v1` ; nom déjà pris → échec ; à toute sortie en échec : clair supprimé puis état `echec` (étape, code) ; état non écrit → code 1 |
| `deploy/verif-disque.sh` (v1.7) | `deploy`, par `recrutement-verif-disque.timer` (`hourly`, `Persistent=true`) | `df --output=pcent` sur `/` et `docker info -f '{{.DockerRootDir}}'` ; écrit `disque.json` (`normal`, `plein` au-delà de 80 %, `mesure-impossible`) ; code 1 si plein ou mesure impossible | Docker muet → rien d'écrit, code 1 |
| `deploy/commun.sh` (v1.7) | chargé par les deux scripts | `lire_reglages`, `reglage_valide`, `maintenant`, `ecrire_etat` (conteneur jetable `docker compose run --rm --no-deps -T api`, dans `/data/etat`, `node`, 700/600, nom temporaire puis renommage) | — |
| Unités `recrutement-deploy.{service,timer,path}` (v1.9) | administrateur (`deploy/README.md` § 15 : vérifie le point de montage du volume, copie si absente, rien si identique, arrêt si différente, initialise `deploye`) | service oneshot `User=deploy`, `UMask=0077`, `TimeoutStartSec=4h`, `TimeoutStopSec=90`, `ExecStopPost` sous `flock -n` (`$HOME` de `deploy`, pas `%h`) ; timer `OnCalendar=*:0/10` ; path `PathExists=/var/lib/docker/volumes/recrutement_data/_data/demandes/deploiement.demande` | `systemd-analyze verify` sans remarque ; essayées sur banc systemd réel (`tools/test-auto-deploy.sh --reel`) |
| Unités `deploy/systemd/` (v1.7) | administrateur (`deploy/README.md` § 14 : copie si absente, rien si identique, arrêt si différente) | `Type=oneshot`, `User=deploy`, `UMask=0077`, `After=docker.service` (aucune demande de démarrage ; mais `docker.socket` relance Docker au premier appel `docker` : arrêter les timers avant une maintenance de Docker), `TimeoutStartSec` 1 h / 5 min, `TimeoutStopSec=90` ; sauvegarde : `ExecStopPost` sous `flock -n` qui retire le clair après un arrêt forcé | `systemd-analyze verify` sans remarque (banc Ubuntu 26.04 avec systemd) |
| `tools/check-site.sh BASE_URL` | tous | 8 contrôles (v1.7 : `/admin/sauvegardes.html`, v1.9 : `/admin/deploiement.html` → 302 Google) : `/one-pager.html` 200, `/index.html` 200, `/candidatures/` et `/assets/data-diamants.js` 302 vers `https://accounts.google.com/`, `/ping` 200, `/api/moi` 401 (v1.3 ; vient d'oauth2-proxy, ne prouve pas que l'api est saine) | codes 0/1/2, `--max-time 10`, certificat non vérifié pour `localhost` et `*.localhost` |

## Environnements
| Environnement | Commande | Adresse |
|---|---|---|
| Poste, cas B | `cp .env.example .env && docker compose up -d --build` | `https://localhost` |
| Poste, cas A | `COMPOSE_PROFILES=` vide, `docker compose up -d` | `http://127.0.0.1:4180` |
| Poste, sans Docker | `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site` | `http://localhost:8765` (pas d'authentification ; tests de navigateur) |
| Serveur OVH | v1.9 : `recrutement-deploy.timer` → `deploy/auto-deploy.sh --auto` (et les demandes de `/admin/deploiement.html`) ; `deploy/deploy.sh` en secours sans tests | `https://recrutement.yeita.fr` |
| Poste, pile Docker avec l'API (v1.3) | `docker compose up -d --build` (`.env` d'exemple) | l'api n'a aucun port : la joindre par `front` (`/api/…`, 401 sans session) ([Lancer le site avec Docker](docker-local.md)) |
| Poste, API et site en mode serveur (v1.3) | `python3 tools/build.py _site && cd api && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start` | `http://127.0.0.1:8000/candidatures/` (pages en mode serveur, identité `DEV_EMAIL`) |
| Poste, API seule (v1.2) | `cd api && npm ci && DEV_EMAIL=moi@yeita.fr npm start` (après `node equipe.js add moi@yeita.fr Moi admin`) | `http://127.0.0.1:8000/api/…` ; avec `DEV_STATIC=../_site`, le site à `/` |

## Voir aussi
- [Mode serveur des pages](mode-serveur.md)
- [API de stockage](api.md)
- [Décisions](decisions.md)
- [Conventions et tests](conventions.md)
- [Lancer le site avec Docker sur un poste](docker-local.md)
- [Mettre à jour le site en production](mise-a-jour-production.md)
- [La clé des sauvegardes](cle-sauvegarde.md)
- [Déploiement automatique](deploiement-automatique.md)
- Mode d'emploi du serveur : `deploy/README.md`

## Historique
| Version | Changement |
|---|---|
| 1.1 | Création : image `front`, Compose, cas A et B, scripts de préparation, de déploiement et de contrôle |
| 1.2 | API de stockage `api/` (Node.js, Fastify, SQLite), hors Docker : pile et environnement local |
| 1.3 | Image et service `api`, réseau `back` interne sans adresse hôte, volume `recrutement_data`, upstream et `api_routes` d'oauth2-proxy, attente de l'api dans `deploy.sh`, 6e contrôle de `check-site.sh` |
| 1.7 | Sauvegardes sur le serveur : `age` ; `deploy/backup.sh`, `deploy/verif-disque.sh`, `deploy/commun.sh`, unités systemd, état des sauvegardes (`/data/etat`), route `GET /api/sauvegardes`, page `admin/sauvegardes.html`, 7e contrôle de `check-site.sh` ; `prepare-serveur.sh` exige `age` (reprise du 2026-10-28 : rclone, OVH Object Storage et healthchecks.io retirés) |
| 1.8 | `deploy.sh` fixe `umask 022` avant toute écriture (fiche 1.7-1) |
| 1.9 | Déploiement automatique : `deploy/auto-deploy.sh`, unités `recrutement-deploy`, routes `/api/deploiement`, page `admin/deploiement.html`, pause dans `deploy.sh`, 8e contrôle de `check-site.sh` |
