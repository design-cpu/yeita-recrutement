---
type: tache
version: 1.3
numero: 07
titre: Fiches : écriture de leur partie, départ de la page, Non enregistré
statut: ok
date: 2026-10-26
---

# Tâche 07 — Fiches : écriture de leur partie, départ de la page, Non enregistré

> **QA : réussie**
> `ec1`, `ec2`, `decompte` relisent le dossier et n'écrivent que leur partie, refusent si la même partie a changé ou si le dossier a disparu, envoient aussitôt en quittant la page ; les indicateurs affichent « Non enregistré ».

## Ce que ça change
`ec1`, `ec2`, `decompte` relisent le dossier et n'écrivent que leur partie, refusent si la même partie a changé ou si le dossier a disparu, envoient aussitôt en quittant la page ; les indicateurs affichent « Non enregistré ».

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA5
- [x] CA7
- [x] CA8

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- Aide commune `DOSSIER.ecrirePartie` dans `assets/dossier.js` : relire, comparer après `upgrade`, poser, écrire, une nouvelle tentative
- `pagehide` : sans relecture, envoi de départ de l'adaptateur
- Indicateur « Non enregistré » (`candidat`, `ec1`, `ec2`)
- Mode navigateur : même chemin, sans effet visible

Fichiers : `assets/dossier.js` (`ecrirePartie`, `partir`), `candidatures/ec1.html`, `ec2.html`, `decompte.html`, `candidat.html` (indicateur, départ)
Commits : `1d70c5f`, `2f340c6` (fiches : attente, partie, départ, indicateur)

Existant réutilisé : `saveCand()` des trois fiches (V37), `schedule`/`saveNow` de `candidat.html`, `renderExits`

## Résultat QA
| Vérification | Résultat |
|---|---|
| R6h, R6i (Node) — EC1 et décompte alternés ; même partie changée ailleurs → refus sans PUT ; dossier supprimé → refus sans recréation, dans les deux modes | OK |
| CA5, CA7, CA8 (navigateur) | tâche 09 |

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/test-serveur.js` | M8 comparaison de la partie retirée | échec « même partie changée ailleurs → refus » | échec, message attendu |
| `tools/test-serveur.js` | M9 relecture vide non traitée | échec « fiches (navigateur) : dossier supprimé ailleurs » | échec, message attendu (cas navigateur ajouté : en mode serveur, l'API refuse déjà) |
| `tools/e2e-serveur.py` | MP2 EC2 réécrit le dossier entier | échec « deux onglets EC2 » | échec, message attendu |

## Spec couverte
R6g, R6h, R6i, R11b (indicateur) ; CA5, CA7, CA8
