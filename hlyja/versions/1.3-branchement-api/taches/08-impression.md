---
type: tache
version: 1.3
numero: 08
titre: Notes d'impression et lien du site
statut: ok
date: 2026-10-26
---

# Tâche 08 — Notes d'impression et lien du site

> **QA : réussie**
> Les notes de `carte.html` et `decompte.html` ne parlent plus du site GitHub ; « Ouvrir sur le site » mène à `recrutement.yeita.fr`.

## Ce que ça change
Les notes de `carte.html` et `decompte.html` ne parlent plus du site GitHub ; « Ouvrir sur le site » mène à `recrutement.yeita.fr`.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA24

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- Textes des deux notes (§ Contenu et textes)
- `assets/yeita.js` : `SITE` et commentaires
- `tools/e2e-liens.py` relancé

Fichiers : `assets/yeita.js`, `candidatures/carte.html`, `candidatures/decompte.html`
Commits : `83cd318`

Existant réutilisé : `YEITA.wirePrint`, `data-print-note`

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA24 — `grep -n -i github candidatures/carte.html candidatures/decompte.html assets/yeita.js` | aucune occurrence |
| Lien « Ouvrir sur le site » | `https://recrutement.yeita.fr/` + page ; pour une page de `candidatures/`, le dossier est gardé (`candidatures/carte.html`) : sans cela le lien menait à une adresse inexistante (défaut trouvé en passant, corrigé dans la même ligne) |
| `tools/e2e-liens.py` | 19 OK |

## Mutations
Aucun contrôle automatique ajouté (textes) ; contrôle par `grep` noté ci-dessus.

## Spec couverte
R35, R36 ; CA24
