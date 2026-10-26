---
type: tache
version: 1.3
numero: 06
titre: Pages : attente du démarrage, retour sur l'onglet, import
statut: a-faire
date: 2026-10-26
---

# Tâche 06 — Pages : attente du démarrage, retour sur l'onglet, import

> **À faire**
> Les 6 pages chargent les deux nouveaux scripts, attendent le démarrage avant leur première lecture, relisent au retour sur l'onglet sans redessin inutile ; l'import ne propose plus « Remplacer tout » en mode serveur.

## Ce que ça change
Les 6 pages chargent les deux nouveaux scripts, attendent le démarrage avant leur première lecture, relisent au retour sur l'onglet sans redessin inutile ; l'import ne propose plus « Remplacer tout » en mode serveur.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA1
- [ ] CA12
- [ ] CA14

- [ ] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
À faire :
- Ordre des scripts dans les 6 pages
- `DEMARRAGE.pret.then(...)` autour de la première lecture (tableau du cadrage)
- `carte.html` : pas de `migrateCodes()` en mode serveur
- `auRetour` : `index`, `candidat` (gardes), `ec2`, `carte` ; redessin si `meta.modifieLe` change
- `index.html` : « Remplacer tout » masqué, textes d'export (R18)
- Les 4 e2e existants passent sans modification

Existant à réutiliser : Fonctions d'écoute `storage` actuelles, `load()`, `refresh()`, `renderFrom1()`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R4c, R4d, R15b, R17, R18 ; CA1, CA12, CA14
