---
type: tache
version: 1.3
numero: 01
titre: Image et service de l'API dans Docker
statut: ok
date: 2026-10-26
---

# Tâche 01 — Image et service de l'API dans Docker

> **QA : réussie** · 1 fichier créé, 3 modifiés · 0 correction
> L'API tourne dans la pile Docker, sur un réseau interne sans adresse côté hôte que seul `front` partage avec elle ; oauth2-proxy la sert sous `/api/`.

## Ce que ça change
L'API tourne dans la pile Docker, sur un réseau interne sans adresse côté hôte que seul `front` partage avec elle ; oauth2-proxy la sert sous `/api/`.

## Comment tester
1. `cp .env.example .env`, `COMPOSE_PROFILES=` vide, `docker compose up -d --build`.
2. `docker compose ps` : `api` `healthy`, aucun port publié.
3. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4180/api/moi` → 401.
Résultat attendu : l'API n'est joignable que par `front` ; sur un hôte Linux, ni l'hôte ni un conteneur en réseau hôte ne la joignent.
Tests automatiques : aucun (configuration) ; essais du banc ci-dessous, rejoués à la QA.

## Critères d'acceptation
- [x] CA16
- [x] CA17
- [x] CA18
- [x] CA23

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- `docker/api.Dockerfile` : base figée par digest, `LABEL`, `npm ci --omit=dev` dans `/app/api` avec `.npmrc`, `USER node`, `/data` 700, `ENV`, sonde 200 en moins de 4 s, `CMD`
- `compose.yaml` : service `api`, réseau `back` (`internal`, `enable_ipv6: false`, `inhibit_ipv4`), `front` sur `edge` et `back`, volume `name: recrutement_data` étiqueté
- `deploy/oauth2-proxy.cfg` : upstream `http://api:8000/api/`, `api_routes`
- `.dockerignore` : `api/node_modules`, `api/data`, `*.sqlite*`
- Banc sur moteur Linux (règle 1 de la 1.1) : essais d'attaque avec témoins (R24, CA17) ; valeurs résolues par `docker compose config` (R39, règle 2 de la 1.2) ; formes `/%61pi/moi`, `//api/moi`, `/API/moi`, `/api/../api/moi`

Fichiers : `docker/api.Dockerfile` (créé), `compose.yaml`, `deploy/oauth2-proxy.cfg`, `.dockerignore`
Commits : `087544f` feat(branchement-api): tâche 01 – image et service de l'API dans Docker, réseau back sans adresse hôte

Existant réutilisé : `docker/front.Dockerfile` (étiquette, structure), `compose.yaml` (`x-journaux`, `restart`), banc de V11 à V40

## Résultat QA
Banc : moteur Linux jetable `docker:29-dind` (29.9.2, Compose 5.6.1), pile complète construite depuis le dépôt (projet `recrutement`, `.env` d'exemple, sans caddy).
| Vérification | Résultat |
|---|---|
| CA16 — valeurs résolues (`docker compose config --format json`) | `api` : `ports` absent, `environment` absent, réseau `back` seul, volume `data` → `recrutement_data` (étiquette) ; `front` : `edge` et `back` ; `back` : `internal: true`, `enable_ipv6: false`, `inhibit_ipv4` |
| CA16 — réseau créé | `docker network inspect recrutement_back` : `internal=true ipv6=false`, option présente ; pont sans adresse IPv4 côté hôte ; `api` sans adresse IPv6 |
| CA17 — hôte → `127.0.0.1:8000` | refusé |
| CA17 — hôte → adresse de l'api sur `back` | délai dépassé |
| CA17 — conteneur `--network host` → api | échec (`000`) |
| CA17 — conteneur du seul `edge` → api | échec |
| CA17 — **témoin** : conteneur sur `back` → api | `{"ok":true}` 200 |
| CA17 — sans session, via `front` | `/api/moi`, `/api/sante`, `//api/moi`, `/api/../api/moi`, forme absolue → 401 ; `/%61pi/moi`, `/API/moi`, `/api`, `/candidatures/` → 302 Google (premier essai fait avec `wget`, qui suivait la redirection : 200 de Google, refait avec `curl` sans suivre) |
| CA17 — `X-Forwarded-Email` forgé sans session | 401 ; journal de l'api : 0 requête hors `/api/sante` |
| CA18 — image | `USER node`, étiquette `fr.yeita.projet=recrutement`, `/data` 700, base 600, `healthy` en ~6 s |
| CA18 — sonde | serveur factice 200 → code 0 ; 503 → code 1 ; réponse en 6 s → code 1 |
| CA18 — mode local | `DEV_EMAIL` → code 1 « DEV_EMAIL refusé : interdit quand NODE_ENV vaut production. » ; `DEV_STATIC` → code 1 |
| CA18 — scripts d'installation | `better-sqlite3` sans dossier `build/` (binaires de `prebuilds/` seulement) |
| CA22 (partie Docker) | `docker compose exec -T api node api/equipe.js add|list` : écrit dans `/data/recrutement.sqlite` |
| Volume en lecture seule puis relance | V16 (même image) |
Corrections : aucune. CA17 « sortie de `front` par `edge` » : V38 ; CA17 avec session : V7 (banc Dex), rejoué à la QA.

## Mutations
La tâche n'ajoute pas de test automatique au projet ; la sonde de santé est un contrôle automatique de l'image.
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| Sonde (`HEALTHCHECK`) | `r.status === 200` → `r.status < 600`, serveur en 503 | sonde au vert (la mutation est visible) | code 0 : la mutation laisse passer le 503, l'essai 503 → 1 la détecte |
| Sonde | forme permise : 200 | code 0 | code 0 |
| Essai de joignabilité | témoin : même requête depuis un conteneur de `back` | 200 | 200 |

## Spec couverte
R22, R22b, R23, R24, R25 à R29, R34, R39 ; CA16, CA17, CA18, CA23
