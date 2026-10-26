---
type: tache
version: 1.3
numero: 01
titre: Image et service de l'API dans Docker
statut: a-faire
date: 2026-10-26
---

# Tâche 01 — Image et service de l'API dans Docker

> **À faire**
> L'API tourne dans la pile Docker, sur un réseau interne sans adresse côté hôte que seul `front` partage avec elle ; oauth2-proxy la sert sous `/api/`.

## Ce que ça change
L'API tourne dans la pile Docker, sur un réseau interne sans adresse côté hôte que seul `front` partage avec elle ; oauth2-proxy la sert sous `/api/`.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA16
- [ ] CA17
- [ ] CA18
- [ ] CA23

- [ ] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
À faire :
- `docker/api.Dockerfile` : base figée par digest, `LABEL`, `npm ci --omit=dev` dans `/app/api` avec `.npmrc`, `USER node`, `/data` 700, `ENV`, sonde 200 en moins de 4 s, `CMD`
- `compose.yaml` : service `api`, réseau `back` (`internal`, `enable_ipv6: false`, `inhibit_ipv4`), `front` sur `edge` et `back`, volume `name: recrutement_data` étiqueté
- `deploy/oauth2-proxy.cfg` : upstream `http://api:8000/api/`, `api_routes`
- `.dockerignore` : `api/node_modules`, `api/data`, `*.sqlite*`
- Banc sur moteur Linux (règle 1 de la 1.1) : essais d'attaque avec témoins (R24, CA17) ; valeurs résolues par `docker compose config` (R39, règle 2 de la 1.2) ; formes `/%61pi/moi`, `//api/moi`, `/API/moi`, `/api/../api/moi`

Existant à réutiliser : `docker/front.Dockerfile` (étiquette, structure), `compose.yaml` (`x-journaux`, `restart`), banc de V11 à V40

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R22, R22b, R23, R24, R25 à R29, R34, R39 ; CA16, CA17, CA18, CA23
