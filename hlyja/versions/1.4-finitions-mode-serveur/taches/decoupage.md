---
type: decoupage
version: 1.4
taches: 3
date: 2026-10-27
---

# Découpage — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> 3 tâches · le bandeau d'abord (bug de priorité haute), puis les exemples (même page de tests), puis la suppression de l'ancien modèle (indépendante).

## Tâches
| # | Tâche | Objectif | Dépend de | Spec |
|---|---|---|---|---|
| 01 | [Bandeau en mode serveur](01-bandeau-serveur.md) | Le bandeau jaune dit que les candidatures sont sur le serveur de l'équipe | — | R1, R2, R3, CA1, CA2, CA7 |
| 02 | [Exemples hors de la base partagée](02-exemples-mode-serveur.md) | Plus de chargement d'exemples hors du mode navigateur ; retrait seulement s'il y en a | 01 (mêmes fichiers de test) | R3 à R7, CA3, CA4, CA7 |
| 03 | [Ancien modèle supprimé](03-ancien-modele.md) | `docs/modele-de-donnees.md` supprimé, renvoi retiré | — | R8, CA6 |

## Logique d'ordre
01 et 02 étendent les mêmes tests (`tools/test-serveur.js`, `tools/e2e-serveur.py`) : à la suite. 03 ne touche que de la doc. La non-régression complète (CA5) est rejouée à la fin de chaque tâche de code.

## Dépendances
Aucun schéma (3 tâches).
