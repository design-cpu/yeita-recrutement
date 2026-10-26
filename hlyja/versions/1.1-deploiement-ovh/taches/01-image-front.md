---
type: tache
version: 1.1
numero: 01
titre: Image front
statut: ok
date: 2026-10-26
---

# Tâche 01 — Image front

> **QA : réussie** · 4 fichiers (3 créés, 1 modifié) · 0 correction
> L'image Docker construit le site puis le sert derrière oauth2-proxy : 9 adresses publiques répondent, tout le reste renvoie vers Google.

## Ce que ça change
Le site se construit et tourne dans une seule image. oauth2-proxy sert les fichiers lui-même et applique la liste fermée des pages publiques. Les fichiers de déploiement et les secrets n'entrent jamais dans l'image.

## Comment tester
1. `docker build -f docker/front.Dockerfile -t t01-front .`
2. `docker run -d --name t01 -p 127.0.0.1:14180:4180 -v "$PWD/deploy/oauth2-proxy.cfg:/etc/oauth2-proxy/oauth2-proxy.cfg:ro" -e OAUTH2_PROXY_CLIENT_ID=test.apps.googleusercontent.com -e OAUTH2_PROXY_CLIENT_SECRET=test -e OAUTH2_PROXY_COOKIE_SECRET=0123456789abcdef0123456789abcdef -e OAUTH2_PROXY_REDIRECT_URL=https://localhost/oauth2/callback t01-front --config=/etc/oauth2-proxy/oauth2-proxy.cfg`
3. `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:14180/<chemin>`
Résultat attendu : 200 pour les chemins publics, 302 vers `https://accounts.google.com/` pour les autres.

## Critères d'acceptation
- [x] CA1 — image construite ; `/srv/site` sans `docker/`, `deploy/`, `compose.yaml`, `.dockerignore`, `.env.example`, `.git`, `hlyja`, `_site`, `.env` (un `.env` factice présent dans le dépôt pendant le build n'entre pas dans l'image)
- [x] CA3 (en direct sur le conteneur ; repris via Caddy en tâche 03)

## Ce qui a été fait
- `docker/front.Dockerfile` : étape `python:3.12-slim` (`tools/build.py /site`), étape `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5`, étiquette `fr.yeita.projet=recrutement`.
- `.dockerignore` : `.git`, `hlyja`, `_site`, `.env`.
- `deploy/oauth2-proxy.cfg` : `http_address`, deux upstreams, Google, `yeita.fr`, `skip_provider_button`, `reverse_proxy = false` (commentaire d'avertissement), `trusted_proxy_ips`, attributs du cookie, 8 routes publiques.
- `tools/build.py` : `SKIP` + `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `.env.example` ; commentaire d'en-tête sans GitHub Pages.
Fichiers : `docker/front.Dockerfile`, `.dockerignore`, `deploy/oauth2-proxy.cfg`, `tools/build.py`
Commits : `64dfc08` feat(deploiement-ovh): tâche 01 – image front (oauth2-proxy sert le site)

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA1 : fichiers exclus absents de `/srv/site` (`docker export` + `tar -t`) | ok (aucun) |
| CA1 : `.env` factice pendant le build | ok (0 occurrence) |
| Publics : `/`, `/index.html`, `/one-pager.html`, `/yeita-match-kit.html`, 3 `assets/`, `/telechargements/one-pager-parcours.pdf`, `/ping` | ok (200) |
| Protégés : `/candidatures/`, `/candidatures/index.html`, `data-diamants.js`, `data-employabilite.js`, `config.js`, `/fiche-ec1.html`, `/telechargements/`, `..%2F`, `/one-pager.html/`, `/CONTRIBUER.md` | ok (302 Google) |
| `/candidatures/` avec `X-Forwarded-Uri: /one-pager.html` | ok (302) |
Corrections : aucune.
Remarque : `/srv/site` contient encore `.gitattributes`, `.nojekyll`, `CONTRIBUER.md`, protégés (D7 écarté par l'arbitre).

## Spec couverte
R1, R2, R3, R4, R5, R7, R17 ; CA1, CA3 (partiel)
