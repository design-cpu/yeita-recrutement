---
type: pilote
version: 1.8
points: 1
dernier: ok
date: 2026-10-28
---

# Chef d'équipe — version 1.8

> Plan + P4 · dernier verdict : ok · aucun ajout non demandé.

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »).

## P4 — avant la QA · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Lignes de la spec finale | 51 | 40 à 70 |
| CA | 5 | 3 ou 4 : CA4 (shellcheck, `npm test`) et CA5 (doc) sont des contrôles de routine ; les scénarios restent CA1 à CA3 |
| Tâches | 1 | 1 ou 2 |
| Fichiers de code touchés | 2 (`deploy.sh` +2, `README.md` +2) | 3 à 5 avec les 2 pages `technique/` |
| Fichiers créés hors code de production | 0 | 0 |
| Retours de revue de spec intégrés | 5 (3 majeurs, 2 mineurs) | — |
| Corrections de revue de code | 0 (4 mineurs notés) | bloquants et majeurs seulement |
| Scénarios de QA prévus | 3 ou 4 | 3 ou 4 |
Constats : diff limité au plan, aucun ajout non demandé ; R5 formalise le scénario « échec puis commande de retour » déjà prévu ; le mineur 1 de la revue de code reste une limite connue, hors QA.
Actions : QA indépendante, CA1 à CA3 avec le lanceur `bash -c 'umask 077; deploy/deploy.sh'`, CA4 dans la même passe ; CA5 à l'étape Documentation ; noter au bilan que le 5e CA est un contrôle de routine.
