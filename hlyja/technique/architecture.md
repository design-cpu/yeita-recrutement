---
type: technique
page: architecture
titre: Architecture et déploiement
maj: 1.2
commit: 2497be9
sources: api/server.js, api/package.json, deploy/README.md, assets/config.js, docker/front.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/Caddyfile, deploy/prepare-serveur.sh, deploy/deploy.sh, tools/check-site.sh, tools/build.py, .env.example, .dockerignore
date: 2026-10-26
---

# Architecture et déploiement

> Le site statique est construit par `tools/build.py` et servi par oauth2-proxy dans Docker, sur le serveur OVH partagé de Yeita ; une liste fermée de pages est publique, le reste exige un compte Google @yeita.fr. Les données restent dans le navigateur.
> v1.2 : l'API de stockage (`api/`, Node.js, SQLite) existe et se lance seule ; elle n'est encore ni dans Docker ni branchée aux pages ([API de stockage](api.md)).

## Vue d'ensemble
```mermaid
flowchart LR
  N[Navigateur] -->|HTTPS| P{Proxy de l'hôte, cas A\nou service caddy, cas B}
  P -->|127.0.0.1:4180 ou front:4180| F[front : oauth2-proxy v7.15.5]
  F -->|chemin public ou session @yeita.fr| S[/srv/site, fichiers statiques]
  F -->|sinon : 302| G[accounts.google.com]
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

## Image `front` (`docker/front.Dockerfile`)
| Étape | Base | Contenu |
|---|---|---|
| `build` | `python:3.12-slim` | `COPY . .` (contexte filtré par `.dockerignore` : `.git`, `hlyja`, `_site`, `.env*`, `*.swp`, `*~`), `python3 tools/build.py /site` |
| finale | `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5` | `LABEL fr.yeita.projet=recrutement`, `COPY --from=build /site /srv/site` ; image sans shell (distroless) |
Construite depuis la racine (`build.context: .`), nommée `recrutement-front`.

## Services Compose (`compose.yaml`, `name: recrutement`)
| Service | Image | Ports de l'hôte | Variables (`.env`) | Volumes | Profil |
|---|---|---|---|---|---|
| `front` | `recrutement-front` | `127.0.0.1:4180:4180` seulement | `OAUTH2_PROXY_CLIENT_ID`, `_CLIENT_SECRET`, `_COOKIE_SECRET`, `_REDIRECT_URL` (obligatoires, `${VAR:?}`) | `./deploy/oauth2-proxy.cfg` → `/etc/oauth2-proxy/oauth2-proxy.cfg` (lecture seule) | — |
| `caddy` | `caddy:2.11.7` | `80`, `443`, `443/udp` | `DOMAIN` (obligatoire) | `./deploy/Caddyfile` (lecture seule), `caddy_data`, `caddy_config` | `caddy` |
Communs : réseau `edge` (bridge `recrutement_edge`, 172.30.0.0/24), `restart: unless-stopped`, journaux `json-file` 10 Mo × 3. `COMPOSE_PROFILES=caddy` dans `.env` active le cas B.

## oauth2-proxy (`deploy/oauth2-proxy.cfg`)
| Réglage | Valeur | Raison |
|---|---|---|
| `http_address` | `0.0.0.0:4180` | défaut `127.0.0.1:4180` injoignable hors du conteneur (V19) |
| `upstreams` | `file:///srv/site/#/`, `file:///srv/site/#/index.html` | le second sert `/index.html` en 200 (le serveur de fichiers de Go redirigerait vers `/`) |
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
| `deploy/prepare-serveur.sh "<clé>"` | root, une fois | utilisateur `deploy` (groupe `docker`), clé SSH, clone dans `/opt/recrutement` (par `deploy`), `/var/backups/recrutement` (700) | n'installe rien ; vérifie outils, port 4180, sous-réseau 172.30.0.0/24 (réseaux Docker et routes), conteneurs `recrutement` d'un autre dossier, `deploy` existant hors groupe `docker`, groupe `deploy` orphelin, origine du dépôt — avant toute modification ; idempotent ; reprend un dossier vide laissé par un clone en échec ; `RECRUTEMENT_REPO` pour les essais |
| `deploy/deploy.sh [commit]` | `deploy` | `git` (main ou commit de main), `build --pull`, `up -d --remove-orphans --force-recreate`, `image prune --filter label=fr.yeita.projet=recrutement`, attente de `/ping`, `check-site.sh` | réglages lus par `docker compose config --environment` (comme Compose les utilise) et cas B par `config --services` ; verrou `flock` (`~/.recrutement-deploy.lock`), refuse root, `.env` d'exemple (identifiant, secret client, cookie secret), incohérent ou avec une valeur vide suivie d'un commentaire, dépôt modifié ou avec un fichier non suivi (une copie de `.env` serait publiée), conteneurs d'un autre dossier, 80/443 pris en cas B, commit hors `main` ou antérieur à 1.1 ; retire `caddy` sans profil ; commande de retour si `build`, `up` ou le contrôle échouent ; corps dans `main` (lu en entier) |
| `tools/check-site.sh BASE_URL` | tous | 5 contrôles : `/one-pager.html` 200, `/index.html` 200, `/candidatures/` et `/assets/data-diamants.js` 302 vers `https://accounts.google.com/`, `/ping` 200 | codes 0/1/2, `--max-time 10`, certificat non vérifié pour `localhost` et `*.localhost` |

## Environnements
| Environnement | Commande | Adresse |
|---|---|---|
| Poste, cas B | `cp .env.example .env && docker compose up -d --build` | `https://localhost` |
| Poste, cas A | `COMPOSE_PROFILES=` vide, `docker compose up -d` | `http://127.0.0.1:4180` |
| Poste, sans Docker | `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site` | `http://localhost:8765` (pas d'authentification ; tests de navigateur) |
| Serveur OVH | `deploy/deploy.sh` | `https://recrutement.yeita.fr` |
| Poste, API seule (v1.2) | `cd api && npm ci && DEV_EMAIL=moi@yeita.fr npm start` (après `node equipe.js add moi@yeita.fr Moi admin`) | `http://127.0.0.1:8000/api/…` ; avec `DEV_STATIC=../_site`, le site à `/` |

## Voir aussi
- [API de stockage](api.md)
- [Décisions](decisions.md)
- [Conventions et tests](conventions.md)
- [Lancer le site avec Docker sur un poste](docker-local.md)
- Mode d'emploi du serveur : `deploy/README.md`

## Historique
| Version | Changement |
|---|---|
| 1.1 | Création : image `front`, Compose, cas A et B, scripts de préparation, de déploiement et de contrôle |
| 1.2 | API de stockage `api/` (Node.js, Fastify, SQLite), hors Docker : pile et environnement local |
