---
type: pilote
version: 1.10
points: 2
dernier: question
date: 2026-10-28
---

# Chef d'équipe — version 1.10

> Plan + P1 · dernier verdict : question (R1b), tranchée par l'utilisateur · 1 ajout retiré, 3 ajustements appliqués.

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »).

## P1 — après le cadrage · question
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Lignes de la spec v1 | 157 | 140 à 200 |
| Règles | 26 (R1 à R18, R1b) | — |
| Critères d'acceptation | 18 | 14 à 18 |
| Vérifications | 17 | — |
Constats : spec dans le plan ; R1b (remise à 1 d'une base v2) est un vrai ajout, hors plan, qui frôle l'exclusion « pas de changement de `user_version` » ; R15 n'est pas un ajout (RESTAURER.md déjà prévu) ; R1 décrit le comment ; CA16 risque de dépasser le volume de QA.
Actions : question à l'utilisateur sur R1b → « une ligne de doc » (R1b réécrite : base v2 refusée, guide de test) ; étiquette `[ajout]` retirée de R15 ; R1 ramenée au comportement ; CA16 limitée aux points non couverts par les e2e de Léo.
