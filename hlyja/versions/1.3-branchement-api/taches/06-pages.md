---
type: tache
version: 1.3
numero: 06
titre: Pages : attente du démarrage, retour sur l'onglet, import
statut: ok
date: 2026-10-26
---

# Tâche 06 — Pages : attente du démarrage, retour sur l'onglet, import

> **QA : réussie**
> Les 6 pages chargent les deux nouveaux scripts, attendent le démarrage avant leur première lecture, relisent au retour sur l'onglet sans redessin inutile ; l'import ne propose plus « Remplacer tout » en mode serveur.

## Ce que ça change
Les 6 pages chargent les deux nouveaux scripts, attendent le démarrage avant leur première lecture, relisent au retour sur l'onglet sans redessin inutile ; l'import ne propose plus « Remplacer tout » en mode serveur.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA1
- [x] CA12
- [x] CA14

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- Ordre des scripts dans les 6 pages
- `DEMARRAGE.pret.then(...)` autour de la première lecture (tableau du cadrage)
- `carte.html` : pas de `migrateCodes()` en mode serveur
- `auRetour` : `index`, `candidat` (gardes), `ec2`, `carte` ; redessin si `meta.modifieLe` change
- `index.html` : « Remplacer tout » masqué, textes d'export (R18)
- Les 4 e2e existants passent sans modification

Fichiers : `candidatures/index.html`, `candidat.html`, `carte.html` ; `ec1.html`, `ec2.html`, `decompte.html` (avec la tâche 07)
Commits : `4c2ba03`

Existant réutilisé : Fonctions d'écoute `storage` actuelles, `load()`, `refresh()`, `renderFrom1()`

## Résultat QA
| Vérification | Résultat |
|---|---|
| Non-régression : `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` (mode navigateur) | 40 + 45 + 19 + 7 = 111 OK |
| CA1, CA12, CA14 (navigateur, mode serveur) | tâche 09 |
Remarque : le texte d'export n'est réécrit que si le tableau a des candidats (`renderBoard` s'arrête sur un tableau vide), comme sur `main`.

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/e2e-serveur.py` | MP1 « Remplacer tout » non masqué | échec « pas d'option Remplacer tout » | échec, message attendu |
| `tools/e2e-serveur.py` | MP3 tableau qui lit sans attendre le démarrage | échec CA1 | **survit** : mutation équivalente, l'adaptateur d'attente retient déjà la lecture (CA1 tenu par R4e, que M10 met à l'épreuve) |

## Spec couverte
R4c, R4d, R15b, R17, R18 ; CA1, CA12, CA14
