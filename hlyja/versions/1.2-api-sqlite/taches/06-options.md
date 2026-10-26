---
type: tache
version: 1.2
numero: 06
titre: Options de disponibilité
statut: ok
date: 2026-10-26
---

# Tâche 06 — Options de disponibilité

> **QA : réussie** · 1 fichier créé, 2 modifiés · 0 correction

## Ce que ça change
Les options de disponibilité ajoutées par l'équipe sont partagées, dans l'ordre d'ajout. Une option de base (« 1 mois »…) ou un doublon ne crée rien ; le POST rend la liste.

## Comment tester
`cd api && node --test test/api.test.js`

## Critères d'acceptation
- [x] CA13 — ajout (201, liste), doublon et option de base (200 sans ligne), vide, espaces, 61 caractères, nombre, `null` → 400 ; 60 caractères accentués acceptés ; `lecture` → 403.

## Ce qui a été fait
- `api/src/options.js` ; test ajouté à `api/test/api.test.js` ; `api/src/routes.js`.
Fichiers : `api/src/options.js`, `api/src/routes.js`, `api/test/api.test.js`
Commits : `a5a67ee` feat(api-sqlite): tâche 06

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/api.test.js` | 11/11 |
Corrections : aucune.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Option de base | stockée | échec du test des options | échec, message attendu |
| Longueur | bornée à 600 | échec sur 61 caractères | échec, message attendu |
| Espaces | non normalisés | échec sur la liste attendue | échec, message attendu |
Formes permises : 60 caractères accentués (`é` × 60) acceptés.

## Spec couverte
R23 ; CA13
