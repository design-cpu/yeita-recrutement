---
type: pilote
version: 1.7
points: 0
dernier: ok
date: 2026-10-27
---

# Chef d'équipe — version 1.7

> Plan · dernier verdict : ok.

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »).

## P1 — après le cadrage · ajuster
Aucun écart au plan ; le point 8 (fiche 1.2-5) découle de l'objectif ; hors périmètre explicite sans ajout. Règles nées des écarts vérifiés (journal `DELETE`, restauration par `compose run … cat >`, ping valide sur `OK` seul, bucket non versionné) acceptables comme conséquences des vérifications, soumises au jury. Dérive légère vers la réalisation : la colonne « Conséquence » numérotait déjà des règles.
Actions : numéros de règles de `verifications.md` alignés sur la spec v1 (fait) ; `cadrage.md` commité avant la spec (fait).

## P2 — après le tour 1 · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec v1 | 196 lignes | 150 à 220 |
| Retours recevables | 50 (21 majeurs, 29 mineurs) | ~20 |
| CA prévus au traitement | 21 | 12 à 18 |
Constats : risque de dépasser lignes et CA si tout est intégré tel quel ; dérive vers la réalisation (noms de temporaires, options de `curl`, valeurs systemd, emplacement des tests, mutations en CA) ; R16 recopiait `RESTAURER.md` ; ajouts à confirmer (second utilisateur S3, liste des suppressions « par node »).
Actions appliquées : CA17, CA18, CA20 fusionnés, CA21 retiré vers le plan de QA (17 CA actifs) ; mécanismes retirés de R5, R10, R14 (exigence gardée, détail aux tâches) ; R16 réduit à la liste de ce que `RESTAURER.md` couvre ; liste des suppressions = commande ponctuelle écrite dans `RESTAURER.md`, aucun code dans `api/`. Second utilisateur S3 en lecture seule : **confirmé par l'utilisateur** (2026-10-27). Correction d'un constat : `deploy.sh` n'est pas modifié (`backup.sh` prend son verrou existant). Spec v2 : 146 lignes.

## P3 — après le découpage · ajuster
7 tâches (7 à 9) ; 16 fichiers touchés (13 à 16) ; hors code de production : `api/test/equipe.test.js`, `tools/test-sauvegarde.sh` (1 à 3) ; `api/test` reste à 7 fichiers.
Actions appliquées : `README.md` racine ajouté à la tâche 07 (documenter `tools/test-sauvegarde.sh`) ; `deploy/healthchecks.sh` et `tools/test-sauvegarde.sh` tracés dans `decoupage.md` comme écarts assumés.
