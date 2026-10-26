---
type: pilote
version: 1.1
points: 2
dernier: ajuster
date: 2026-10-26
---

# Chef d'équipe — version 1.1

> Plan + P1, P2 · dernier verdict : ajuster (spec v2 resserrée).

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »). Jury de 4, spec 150 à 220 lignes, 7 à 9 tâches, ~14 fichiers, 8 à 10 scénarios de QA.

## P1 — après le cadrage · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| cadrage.md | 77 lignes | — |
| verifications.md | 14 vérifications, 1 écart remonté à l'utilisateur | garde-fou respecté |
| Jury | 4 + arbitre | 4 + arbitre |
| Modules | socle + 4 | cohérent |
| Fichiers livrables créés | 0 | aucune réalisation avant la spec |
Constats : aucun écart au plan, aucun ajout non demandé (second upstream tranché par l'utilisateur ; regex resserrent la liste publique ; tags figés demandés). La contrainte `network_mode: host` (V8) reste une consigne du README. Les vérifications citent déjà R3, R4, R7, R10, R14.
Actions : garder ces numéros dans la spec, viser 150 à 220 lignes ; `network_mode: host` dans le README seulement ; mentions de GitHub Pages restées dans les pages → backlog.

## P2 — après le tour 1 · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| spec-v1.md | 112 lignes, 21 règles, 12 CA | 150 à 220 lignes |
| Tour 1 | score 52 ; 41 retours, 31 recevables (2 bloquants, 14 majeurs, 15 mineurs) | — |
| Fichiers prévus | 15 | ~14 |
Constats : pas de dérive vers la réalisation ; risque de grossissement si les 31 retours entrent tels quels. Ajouts hors pitch proposés par le jury : `cookie_expire 12h` (S3), surveillance du disque (E12), HSTS conditionnel (S6), `tmux` (E8), `SKIP` élargi (D7).
Actions (appliquées en v2) : bloquants et majeurs en règles et CA ; points du README en une phrase chacun dans R19 ; D6, E9, L10, L11, L6, S4, E10, E8 en une ligne ou renvoyés aux tâches ; S3 limité aux attributs explicites (durée par défaut gardée) ; E12 : hypothèse de stockage seulement ; S6 : documenté seulement ; candidats backlog : retrait du projet (E11), mentions de GitHub Pages dans les pages, surveillance du disque, durée de session. Viser 160 à 200 lignes.
