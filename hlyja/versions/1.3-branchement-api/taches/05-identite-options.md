---
type: tache
version: 1.3
numero: 05
titre: Identité et options de disponibilité en mode serveur
statut: ok
date: 2026-10-26
---

# Tâche 05 — Identité et options de disponibilité en mode serveur

> **QA : réussie**
> `QUI` rend le prénom du compte et la liste de `/api/equipe` ; « Qui es-tu ? » devient « Connecté·e : … » ; les options ajoutées passent par l'API.

## Ce que ça change
`QUI` rend le prénom du compte et la liste de `/api/equipe` ; « Qui es-tu ? » devient « Connecté·e : … » ; les options ajoutées passent par l'API.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA10
- [x] CA11

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- `qui.js` : `QUI.compte(moi, equipe)`, `QUI.local()`, rendu différé de `monter`, `ajouter` en mémoire en mode serveur et en attente
- `store.js` : source des ajouts d'options (`STORE.sourceDispos`) ; règles de `dispos`/`addDispo` inchangées
- Tests dans `tools/test-serveur.js` ; `tools/test-store.js` inchangé et vert

Fichiers : `assets/qui.js`, `assets/store.js`
Commits : `eb5d634`

Existant réutilisé : `QUI.onChange`, `rendu()` de `monter`, `STORE.dispos`, `uniq`

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA10 (Node) — `QUI.moi()`, `QUI.equipe()`, « Connecté·e : Léa · lecture seule », `choisir` sans effet, `ajouter` en mémoire | OK |
| CA11 (Node) — options : base + ajouts de l'API, `addDispo` → POST, rien en local ; mode navigateur inchangé | OK |
| `tools/test-store.js` (mode navigateur, `QUI` local par défaut) | TOUT OK |

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/test-serveur.js` | M11 rôle lecture non affiché | échec « Connecté·e : Léa · lecture seule » | échec, message attendu |

## Spec couverte
R12 à R14 ; CA10, CA11
