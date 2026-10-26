---
type: tache
version: 1.3
numero: 07
titre: Fiches : écriture de leur partie, départ de la page, Non enregistré
statut: a-faire
date: 2026-10-26
---

# Tâche 07 — Fiches : écriture de leur partie, départ de la page, Non enregistré

> **À faire**
> `ec1`, `ec2`, `decompte` relisent le dossier et n'écrivent que leur partie, refusent si la même partie a changé ou si le dossier a disparu, envoient aussitôt en quittant la page ; les indicateurs affichent « Non enregistré ».

## Ce que ça change
`ec1`, `ec2`, `decompte` relisent le dossier et n'écrivent que leur partie, refusent si la même partie a changé ou si le dossier a disparu, envoient aussitôt en quittant la page ; les indicateurs affichent « Non enregistré ».

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA5
- [ ] CA7
- [ ] CA8

- [ ] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
À faire :
- Aide commune `DOSSIER.ecrirePartie` dans `assets/dossier.js` : relire, comparer après `upgrade`, poser, écrire, une nouvelle tentative
- `pagehide` : sans relecture, envoi de départ de l'adaptateur
- Indicateur « Non enregistré » (`candidat`, `ec1`, `ec2`)
- Mode navigateur : même chemin, sans effet visible

Existant à réutiliser : `saveCand()` des trois fiches (V37), `schedule`/`saveNow` de `candidat.html`, `renderExits`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R6g, R6h, R6i, R11b (indicateur) ; CA5, CA7, CA8
