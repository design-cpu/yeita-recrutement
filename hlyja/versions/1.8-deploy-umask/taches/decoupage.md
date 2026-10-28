---
type: decoupage
version: 1.8
taches: 1
date: 2026-10-28
---

# Découpage — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> 1 tâche · la doc Hlýja (`technique/`) suit à l'étape Documentation.

## Tâches
| # | Tâche | Objectif | Dépend de | Spec |
|---|---|---|---|---|
| 01 | [umask dans deploy.sh](01-umask-deploy.md) | `umask 022` en tête de `deploy.sh`, raison du préfixe dans `deploy/README.md` § 9 | — | R1, R2, R3, R5, CA1 à CA4 |

## Logique d'ordre
Une seule tâche ; R4 et les pages `technique/` vont à l'étape Documentation.

## Dépendances
Aucune.
