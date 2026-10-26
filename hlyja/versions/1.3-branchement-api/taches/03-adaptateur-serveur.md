---
type: tache
version: 1.3
numero: 03
titre: Adaptateur serveur
statut: a-faire
date: 2026-10-26
---

# Tâche 03 — Adaptateur serveur

> **À faire**
> `assets/adapter-serveur.js` : list/get/put/remove en `fetch` vers `../api/candidats`, version par objet et par identifiant, file par dossier, classement des réponses, identifiants contrôlés, envoi de départ.

## Ce que ça change
`assets/adapter-serveur.js` : list/get/put/remove en `fetch` vers `../api/candidats`, version par objet et par identifiant, file par dossier, classement des réponses, identifiants contrôlés, envoi de départ.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA6
- [ ] CA13

- [ ] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
À faire :
- Forme `{name, volatile, list, get, put, remove}` + envoi de départ (`partir(d)`) pour R6g
- Table faible objet → version, version la plus haute par identifiant, identifiants supprimés
- File par identifiant ; `put` prend la version au départ
- Classement des réponses dans l'ordre du tableau ; `error.code` ; 401 → rechargement gardé (R8, via le démarrage)
- Tests en Node (`tools/test-serveur.js`, même chargement que `tools/test-store.js`, `fetch` simulé), mutations

Existant à réutiliser : `git show a86b6f4:assets/adapter-supabase.js` (forme, `fromRow`), `DOSSIER.upgrade`, harnais de `tools/test-store.js`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R5 à R8, R10, tableau § API et intégrations ; CA6, CA13
