---
type: tache
version: 1.3
numero: 10
titre: Documentation du projet
statut: ok
date: 2026-10-26
---

# Tâche 10 — Documentation du projet

> **QA : réussie**
> `docs/backend/MODELE.md`, `deploy/README.md` et `api/README.md` décrivent le branchement, l'exploitation de l'API et les consignes.

## Ce que ça change
`docs/backend/MODELE.md`, `deploy/README.md` et `api/README.md` décrivent le branchement, l'exploitation de l'API et les consignes.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA22
- [x] CA25

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- `MODELE.md` : messages, branchement réel, tableau du navigateur, régression de `QUI.ajouter`, H5, copies
- `deploy/README.md` : équipe par `docker compose exec`, moteur relevé, contrôle réseau avant le premier admin (IPv4, IPv6, `--network host`), premier déploiement, retour arrière, `down -v`, coupure, journaux, H4
- `api/README.md` : phrase « les pages ne l'utilisent pas encore » mise à jour

Fichiers : `docs/backend/MODELE.md`, `deploy/README.md`, `api/README.md`
Commits : `046a0c4`

Existant réutilisé : Sections existantes des trois fichiers

## Résultat QA
| Vérification | Résultat |
|---|---|
| R31 — équipe par `docker compose exec`, `disable`, rôle `lecture` | `deploy/README.md` § 13 |
| R32 — moteur relevé (§ 1), premier déploiement et contrôle réseau avant le premier admin, conduite à tenir (§ 9b), coupure (§ 9), retour arrière (§ 10), `down -v` et `volume prune` (§ 13), journaux (§ 12), données des navigateurs (§ 9b) | présents |
| R40 — `MODELE.md` : branchement, messages, fiches, départ (H5), identité, copies, tableau du navigateur | présents |
| Commandes du § 9b | essayées sur le banc Linux (tâche 01) |

## Mutations
Aucun contrôle automatique ajouté (documentation).

## Spec couverte
R31, R32, R40 ; CA22, CA25
