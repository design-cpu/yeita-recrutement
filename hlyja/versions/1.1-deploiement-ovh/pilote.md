---
type: pilote
version: 1.1
points: 4
dernier: ok
date: 2026-10-26
---

# Chef d'équipe — version 1.1

> Plan + P1 à P4 · dernier verdict : ok · aucun ajout retiré, 2 questions posées à l'utilisateur (/index.html, reverse_proxy).

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

## P3 — après le découpage · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Tâches | 7 | 7 à 9 |
| Couverture | R1–R23, CA1–CA13 rattachés | tout couvert |
| Fichiers prévus | 15 + `README.md` racine | ~14 |
| Spec finale | 148 lignes | 150 à 220 |
Constats : découpage conforme, aucun ajout hors pitch. Banc d'essai R23 sans place prévue ; `CONTRIBUER.md` cité par le plan.
Actions : le banc R23 reste une suite de commandes notées dans les fiches 04 et 05 (aucun script de test hors du dépôt) ; `CONTRIBUER.md` vérifié à l'étape documentation (aucune mention de GitHub Pages, `grep`) ; mentions de GitHub Pages dans les pages → backlog.

## P4 — avant la QA · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Tâches | 7, QA de tâche réussie | 7 à 9 |
| Fichiers hors `hlyja/` | 15 (10 créés, 4 modifiés, 1 supprimé) ; +759 / −42 | ~14 |
| Commits | 26 (11 de code, 15 hlyja) | — |
| Corrections pendant les tâches | 3 | — |
| Revue de code | 0 bloquant, 3 majeurs corrigés, 12 mineurs (4 corrigés, 8 notés) | — |
| Fichiers hors code de production | 0 (banc R23 en commandes ; Playwright en conteneur jetable) | 1 à 3 |
Constats : écart au plan faible ; ajouts petits et justifiés (`*.localhost`, outils vérifiés en plus, motifs `.dockerignore`) ; un écart de spec documenté (fiche 04 : conteneurs seulement). Les corrections de la revue ont été remises à l'épreuve dans le banc (revue-code.md) mais CA8/CA9 ne sont pas rejoués en entier.
Actions : QA en priorité sur CA9 et CA8 rejoués avec `0f6b61f`, CA1/CA10 avec des copies `.env.*`, CA2/CA3/CA13 de bout en bout, non-régression ; rien de neuf dans le dépôt (pas de test Playwright, bats ni script de banc) ; candidats backlog : 8 mineurs notés, mentions de GitHub Pages dans les pages, surveillance du disque, retrait du projet, durée de session ; `CONTRIBUER.md` vérifié par `grep` à la doc.
