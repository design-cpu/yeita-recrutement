---
type: tache
version: 1.3
numero: 05
titre: Identité et options de disponibilité en mode serveur
statut: a-faire
date: 2026-10-26
---

# Tâche 05 — Identité et options de disponibilité en mode serveur

> **À faire**
> `QUI` rend le prénom du compte et la liste de `/api/equipe` ; « Qui es-tu ? » devient « Connecté·e : … » ; les options ajoutées passent par l'API.

## Ce que ça change
`QUI` rend le prénom du compte et la liste de `/api/equipe` ; « Qui es-tu ? » devient « Connecté·e : … » ; les options ajoutées passent par l'API.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA10
- [ ] CA11

## Ce qui a été fait
À faire :
- `qui.js` : `QUI.compte(moi, equipe)`, `QUI.local()`, rendu différé de `monter`, `ajouter` en mémoire en mode serveur et en attente
- `store.js` : source des ajouts d'options (`STORE.sourceDispos`) ; règles de `dispos`/`addDispo` inchangées
- Tests dans `tools/test-serveur.js` ; `tools/test-store.js` inchangé et vert

Existant à réutiliser : `QUI.onChange`, `rendu()` de `monter`, `STORE.dispos`, `uniq`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R12 à R14 ; CA10, CA11
