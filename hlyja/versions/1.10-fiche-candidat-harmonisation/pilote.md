---
type: pilote
version: 1.10
points: 5
dernier: ajuster
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

## P2 — après le tour 1 · ajuster
| Mesure | Valeur | Repère |
|---|---|---|
| Retours recevables | 27 (1 bloquant, 14 majeurs, 12 mineurs) | ~20 |
| Score | 69 (C à 33) | — |
| Spec v2 visée | 170 lignes au plus, 18 CA au plus | — |
Constats : rendement faible sur la dimension concurrence ; la matrice des pannes (C7) et les deux acteurs (C9) feraient gonfler la version ; la spec nomme des fonctions et des variables.
Actions appliquées : une règle par décision ou défaut (R19 pour C1, R6 réécrite, R3 réécrite) ; chemin « remplacer » retiré (U1) ; matrice des pannes ramenée à CA6 et CA7, le reste en scénarios QA ; un seul CA à deux acteurs (CA5) ; Ops en corrections du guide et de `RESTAURER.md` ; aucun nom de fonction dans la spec ; aucune modification de `auto-deploy.sh` (O9 en ligne de guide). Si la concurrence reste sous 60 au tour 2, tour 3 ciblé sur elle seule.

## P3 — après le découpage · ajuster
Constats : 7 tâches (plan : 6 à 9), ordre justifié, chaque R et CA rattaché ; R14 en double (05 et 07) ; fichiers de test non fixés ; la tâche 06 a déjà été jouée une fois (V20), un outil dans `tools/` serait faux après le merge.
Actions appliquées : tâche 06 sans outil, essai de QA documenté dans sa fiche ; R14 seulement en tâche 05 ; tests de l'API dans les fichiers existants de `api/test/` (`base.test.js`, `fichiers.test.js`), e2e existants complétés (`e2e-serveur.py`, `e2e-candidatures.py`, `e2e-parcours.py`), aucun nouveau fichier de test.

## P4 — avant la QA · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Tâches | 7, toutes `ok` | 6 à 9 |
| Fichiers touchés après le diff de Léo (`69ec434..HEAD`, hors `hlyja/`) | 22 (+788 / −150) | 12 à 20 |
| Outils ajoutés au projet | 0 | 0 |
| Corrections de revue | 1 majeur, 6 mineurs | bloquants et majeurs |
Constats : dépassement léger dû au nettoyage du code mort (revue), proportionné ; le 409 `fichier-cite` tient l'invariant de R6 (pas un ajout) mais manquait au contrat ; 1.10-3 à prouver sur `main`.
Actions appliquées : 409 `fichier-cite` ajouté à la spec finale (R6, tableau des routes) et à reporter dans `technique/api.md` ; V21 (1.10-3 échoue 3 fois sur 3 sur `main`) ; QA ciblée (20 à 26 scénarios) sur ce que les e2e ne couvrent pas : deux recruteurs réels avec DELETE d'un fichier cité, pannes réseau réelles, nginx réel, aller-retour 1.9 → 1.10 → 1.9 avec restauration, repère dans un CV, clavier et lecteur d'écran, 375 px et 1360 px.
