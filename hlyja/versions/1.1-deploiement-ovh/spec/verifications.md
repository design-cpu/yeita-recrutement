---
type: verifications
version: 1.1
total: 14
ecarts: 1
date: 2026-10-26
---

# Vérifications — Déploiement de l'espace Candidatures sur le serveur OVH

> 14 vérifications, 1 écart avec le pitch : le serveur de fichiers d'oauth2-proxy redirige `/index.html` vers `/` ; corrigé par un second upstream (choix de l'utilisateur).
> Les requêtes d'un reverse proxy de l'hôte arrivent depuis 172.30.0.1, dans 172.30.0.0/24, avec ou sans userland-proxy (V8).
> Essais faits sur le poste (Docker Desktop 29.9.2, Compose 5.6.1) et dans un Docker Linux isolé (docker:29-dind).

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | Dernière 7.15.x d'oauth2-proxy, date | API quay.io (tags `v7.1*`) et GitHub releases | `v7.15.5`, publiée le 2026-10-01 (25 jours) ; pas de 7.16 ni de 8 | Tag figé `v7.15.5` |
| V2 | Tag figé de Caddy 2, date | GitHub releases caddyserver/caddy, Docker Hub | `2.11.7` publiée le 2026-10-03 (23 jours) ; image `caddy:2.11.7` tirée | Tag figé `caddy:2.11.7` |
| V3 | Image de construction | `docker pull python:3.12-slim` | disponible (3.12.15-slim au 2026-10-22) | `python:3.12-slim`, comme le pitch (seule l'étape de construction) |
| V4 | Upstream `file:///srv/site/#/` | oauth2-proxy v7.15.5 lancé avec le site construit, `curl` | `/` 200 (guide, 68 195 octets) ; **`/index.html` 301 → `/`** (serveur de fichiers de Go) | Écart : second upstream (V5) |
| V5 | Second upstream `file:///srv/site/#/index.html` | même essai | `/index.html` 200, même contenu que `/` ; `/index.html/` et `/index.htmlx` hors liste publique → redirection Google | Retenu (R3) |
| V6 | Routes publiques `skip_auth_routes` | regex de chemin ; essais avec requête `?x=1`, `--path-as-is` | `/one-pager.html?x=1` 200 (la regex porte sur le chemin seul) ; `/telechargements/` 302 ; `/telechargements/..%2Fcandidatures%2Findex.html` 302 ; `/telechargements/..` 301 vers `/` (public) | Regex ancrées `^…$` ; `telechargements/` limité à un nom de fichier sans point initial (R4) |
| V7 | Redirection d'une page protégée sans session | `curl` sur `/candidatures/`, `/assets/data-diamants.js`, `/nope.html` | 302, `Location: https://accounts.google.com/o/oauth2/auth?…` (avec `skip_provider_button`, faux identifiants) | Critère de `check-site.sh` : 302 vers `https://accounts.google.com/` |
| V8 | Adresse source vue par `front` quand un proxy de l'hôte appelle `127.0.0.1:4180` | docker:29-dind, réseau `edge` 172.30.0.0/24, conteneur publié `127.0.0.1:4180`, `wget` depuis l'hôte ; userland-proxy activé puis désactivé | `172.30.0.1` (passerelle du réseau) dans les deux cas | `trusted_proxy_ips = ["172.30.0.0/24"]` couvre le cas A (R7) ; un proxy lui-même conteneurisé doit être en `network_mode: host` |
| V9 | Option `trusted_proxy_ips` existe en 7.15.5 | `oauth2-proxy --help` | `--trusted-proxy-ip` : « Defaults to trusting all IPs » | À fixer explicitement |
| V10 | `/ping` | `curl` | 200 `text/plain` sans session | Critère de `check-site.sh` |
| V11 | Profil Compose piloté par `.env` | `docker compose config --services` avec `COMPOSE_PROFILES=` puis `=caddy` | sans profil : service seul ; avec `caddy` : les deux | R10 |
| V12 | Nettoyage limité aux images étiquetées | docker:29-dind, stockage classique overlay2 : 2 images étiquetées `fr.yeita.projet=recrutement` + 2 non étiquetées, reconstruites (images orphelines) ; `docker image prune -f --filter label=fr.yeita.projet=recrutement` | seule l'image orpheline étiquetée est supprimée ; l'image orpheline non étiquetée reste | R14 |
| V13 | Validation d'un Caddyfile | `caddy validate --config … --adapter caddyfile` dans `caddy:2.11.7` | `Valid configuration` | Commande citée dans le README (cas A Caddy et cas B) |
| V14 | Ce que chargent les pages publiques | `grep` des `src`/`href` locaux de `index.html`, `one-pager.html`, `yeita-match-kit.html` | `assets/yeita.css`, `assets/yeita.js`, `assets/data-yeita-match.js` ; liens vers `candidatures/` (protégé) ; aucun `fetch` | Liste publique conforme au pitch (R4) |

## Détail
V4 : `/index.html  301  http://127.0.0.1:14180/` ; journal : `mapping path "/" => file system "/srv/site/"`.
V5 : `mapping path "/index.html" => file system "/srv/site/"` puis `/index.html 200 text/html 68195`. Essai écarté : `file:///srv/site/index.html#/index.html` → 500.
V8 : `172.30.0.1 - - "GET / HTTP/1.1" 200` ; conteneur `ip 172.30.0.2 gw 172.30.0.1`, pour `--userland-proxy=true` et `false`.
V12 : `deleted: sha256:1359952ea78b…` (image `X=1` étiquetée) ; les deux images `autre` restent.
Autres mentions de GitHub Pages (hors pages, à traiter en doc) : `README.md:42` (`pages.yml`), `tools/build.py:1` (commentaire). Dans les pages (hors périmètre) : `assets/yeita.js:171-172`, `index.html:431`.
