---
type: tache
version: 1.3
numero: 09
titre: Test de bout en bout du mode serveur
statut: a-faire
date: 2026-10-26
---

# Tâche 09 — Test de bout en bout du mode serveur

> **À faire**
> `tools/e2e-serveur.py` lance l'API sur une base temporaire avec `DEV_STATIC`, sans `DEV_EMAIL`, et joue les parcours du mode serveur avec trois navigateurs identifiés par `X-Forwarded-Email`.

## Ce que ça change
`tools/e2e-serveur.py` lance l'API sur une base temporaire avec `DEV_STATIC`, sans `DEV_EMAIL`, et joue les parcours du mode serveur avec trois navigateurs identifiés par `X-Forwarded-Email`.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA1 à CA12
- [ ] CA14
- [ ] CA21 (partie navigateur)

## Ce qui a été fait
À faire :
- Lancement de l'API et de l'équipe de test (Alice, Bob, Léa)
- Création puis rechargement, conflit entre deux navigateurs, rôle lecture, prénom sans liste
- Réponses simulées par interception (proxy, réseau, lenteur, réponse de `PUT` retardée)
- Durée maximale par test, arrêt de l'API garanti (règle 3 de la 1.2)
- Commande documentée

Existant à réutiliser : Outillage de `tools/e2e-*.py` (Playwright Python, conteneur `playwright/python:v1.63.0-noble`)

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R38 ; CA1 à CA12, CA14, CA21 (partie navigateur)
