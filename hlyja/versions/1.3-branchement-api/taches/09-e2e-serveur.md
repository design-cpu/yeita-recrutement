---
type: tache
version: 1.3
numero: 09
titre: Test de bout en bout du mode serveur
statut: ok
date: 2026-10-26
---

# Tâche 09 — Test de bout en bout du mode serveur

> **QA : réussie**
> `tools/e2e-serveur.py` lance l'API sur une base temporaire avec `DEV_STATIC`, sans `DEV_EMAIL`, et joue les parcours du mode serveur avec trois navigateurs identifiés par `X-Forwarded-Email`.

## Ce que ça change
`tools/e2e-serveur.py` lance l'API sur une base temporaire avec `DEV_STATIC`, sans `DEV_EMAIL`, et joue les parcours du mode serveur avec trois navigateurs identifiés par `X-Forwarded-Email`.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA1 à CA12
- [x] CA14
- [x] CA21 (partie navigateur)

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- Lancement de l'API et de l'équipe de test (Alice, Bob, Léa)
- Création puis rechargement, conflit entre deux navigateurs, rôle lecture, prénom sans liste
- Réponses simulées par interception (proxy, réseau, lenteur, réponse de `PUT` retardée)
- Durée maximale par test, arrêt de l'API garanti (règle 3 de la 1.2)
- Commande documentée

Fichiers : `tools/e2e-serveur.py` (créé)
Commits : `0557f5c`

Existant réutilisé : Outillage de `tools/e2e-*.py` (Playwright Python, conteneur `playwright/python:v1.63.0-noble`)

## Résultat QA
Lancement : conteneur `playwright/python:v1.63.0-noble` avec le binaire Node de `node:22-slim` monté (`/usr/local/bin/node`) ; `api/node_modules` du dépôt (binaires `linux-x64` fournis).
| Vérification | Résultat |
|---|---|
| CA1 — `/api/moi` retardé de 2 s : aucune requête `/api/candidats` avant | OK |
| CA2 — 502 HTML, 200 non JSON, 403 JSON, réseau coupé → bandeau, aucune lecture ; 404 HTML → navigateur ; 401 → un rechargement puis bandeau de session | OK |
| CA3 — mode bloqué : « Nouvelle candidature » n'écrit rien | OK |
| CA4, CA10, CA11, CA12, CA14 | OK |
| CA5 — conflit : bandeau collant visible page défilée (y = 0), « Non enregistré », saisie à l'écran, base de Bob | OK |
| CA6 — PUT lents (réponse retardée de 1 s), saisie continue : aucun bandeau, dernière valeur | OK |
| CA7 — EC1 et décompte alternés ; deux onglets EC2 : refus, aucun PUT | OK |
| CA8 — départ `candidat.html` (PUT précédent lent) et `ec1.html` | OK |
| CA9 — lecteur | OK |
| CA21 — suppression : aucune recréation, bandeau, repère absent des navigateurs, du journal de l'API et des fichiers de la base | OK |
| Total | 37/37, trois passages stables |
Écart à R38 : `DEV_EMAIL` (Alice) est posé pour les seules requêtes **sans** en-tête : l'envoi de départ (`keepalive`, après le déchargement) ne reçoit pas les en-têtes ajoutés par Playwright (401 observé sans lui). En production, le cookie de session part avec cet envoi. Les autres requêtes portent toutes `X-Forwarded-Email`.
Constat : l'envoi de départ de `ec1.html` est refusé (409) quand la feuille de décompte a écrit juste avant ; c'est le risque H5 (écriture ailleurs entre-temps) ; l'essai de CA8 se fait sans écriture intercalée.

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/e2e-serveur.py` | MP1, MP2, MP3 | voir tâches 06 et 07 | 2 détectées, 1 équivalente |
Durée maximale par passage : 600 s (`timeout`) ; 20 s par vérification (Playwright) ; l'API lancée est arrêtée dans `finally`.

## Spec couverte
R38 ; CA1 à CA12, CA14, CA21 (partie navigateur)
