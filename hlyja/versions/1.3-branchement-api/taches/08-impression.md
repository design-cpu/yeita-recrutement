---
type: tache
version: 1.3
numero: 08
titre: Notes d'impression et lien du site
statut: a-faire
date: 2026-10-26
---

# Tâche 08 — Notes d'impression et lien du site

> **À faire**
> Les notes de `carte.html` et `decompte.html` ne parlent plus du site GitHub ; « Ouvrir sur le site » mène à `recrutement.yeita.fr`.

## Ce que ça change
Les notes de `carte.html` et `decompte.html` ne parlent plus du site GitHub ; « Ouvrir sur le site » mène à `recrutement.yeita.fr`.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA24

- [ ] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
À faire :
- Textes des deux notes (§ Contenu et textes)
- `assets/yeita.js` : `SITE` et commentaires
- `tools/e2e-liens.py` relancé

Existant à réutiliser : `YEITA.wirePrint`, `data-print-note`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R35, R36 ; CA24
