---
type: tache
version: 1.9
numero: 04
titre: Tests isolés
statut: ok
date: 2026-10-28
---

# Tâche 04 — Tests isolés

> **QA : réussie** · dans `deploy/auto-deploy.sh` · mutations A10, A11 détectées
> Le commit visé est testé à part, sans toucher au dépôt ni aux images en ligne.

## Ce que ça change
Worktree détaché dans `~/.recrutement-deploiement/essai` ; `test-store` et `npm test` dans l'image Node du `FROM` de `docker/api.Dockerfile`, sous l'identité de `deploy`, seul le worktree monté ; `docker compose build` avec `.env.example`, projet et noms d'image `recrutement-essai` ; tout est retiré au début et à la fin (conteneurs par étiquette, images par nom).

## Comment tester
Banc A (partie CA10) ; niveau B : `docker inspect` du conteneur de test pendant un passage.

## Critères d'acceptation
- [x] CA1 (A, B) — 4 étapes OK, durée, sortie, `deploye`.
- [x] CA10 (A, B) — arguments des conteneurs de test, surcharge des noms, suppression par nom sans `-f`, dépôt propre ; niveau B : aucun reste d'essai, images de production intactes (voir fiche 06).

## Ce qui a été fait
`lancer_tests`, `nettoyer_essai`, `etape` dans `deploy/auto-deploy.sh` ; limites de durée par étape (`timeout`, 20 min par défaut).
Commits : `049f351`, `805b43c`.

## Résultat QA
| Vérification | Résultat |
|---|---|
| Banc A, CA10 (6 vérifications) | OK |
| V1–V4 (vérifications) | conteneur Node, `npm ci` en non-root, `.env.example`, surcharge des noms |

## Mutations
| Contrôle | Mutation | Obtenu |
|---|---|---|
| A10 | surcharge des noms d'image retirée | détectée |
| A11 | images supprimées avec `-f` | détectée |

## Spec couverte
R8, R9, CA1, CA10
