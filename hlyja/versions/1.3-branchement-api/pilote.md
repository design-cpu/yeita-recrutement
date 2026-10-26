---
type: pilote
version: 1.3
points: 5
dernier: ajuster
date: 2026-10-26
---

# Chef d'équipe — version 1.3

> Plan écrit au démarrage · jury de 6 · 9 à 11 tâches attendues.

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »).

## P1 — après le cadrage · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Cadrage | 133 lignes | — |
| Spec v1 | 258 lignes | 300 à 400 |
| Règles / critères d'acceptation | 47 / 20 | — |
| Ajouts marqués [ajout] | 2 (YEITA.SITE R36 ; garde 401 R8) | 0 attendu hors pitch |
| Modules | 7 + socle | — |
| Jury | 6 + arbitre | 6 + arbitre (F, A, S, D, E, R) |
| Décisions posées à l'utilisateur | 4 | — |
Constats : plan respecté (jury, niveau, exclusions) ; spec sous le repère (économie). R8 et R36 justifiés et petits. R30 et R4d découlent du pitch (R4d réduit le périmètre). R11 découle du pitch sur le fond, mais sa forme (fixé en haut, trois variantes de bouton, « Fermer ») dépasse le nécessaire et contredit « aucun composant visuel nouveau ». Légère dérive vers la réalisation (API interne de DEMARRAGE, table faible, nom de clé, schéma), tolérable.
Actions : R11 requalifié `[ajout]`, réduit au message et à un seul bouton « Recharger » ; cadrage : le bandeau réutilise `.notice.err` et `role="alert"`. Fait avant le tour 1. Pas d'autre ajout.

## P2 — après le tour 1 · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec v1 | 258 lignes | 300 à 400 |
| Score du tour 1 | 47 (nouveau tour) | 2 tours visés |
| Retours recevables | 38 (6 bloquants, 17 majeurs, 15 mineurs) | ~20 |
| Retours écartés | 9 | — |
| Extensions | D1 acceptée par l'utilisateur, R5 écartée | 0 |
| Arbitrages de l'utilisateur | 3 (D1, D3, F5) | — |
Constats : plan respecté ; recevables presque doubles du repère mais tour utile (6 bloquants réels vérifiés dans le code, aucune dérive). D1 doit être marqué `[ajout]` (décision de l'utilisateur). Traiter 38 retours à la façon des challengers ferait dépasser 400 lignes ; dérive vers la réalisation amorcée (file, sonde, Dockerfile, liste des `page.route`, contrôles JSON de `deploy.sh`). S1 et E6 réglés par vérification. Pour A2, le seuil « au-delà de 60 000 octets » est inutile (V33).
Actions : spec v2 ≤ 380 lignes et ≤ 30 CA, règle ajoutée ≤ 2 lignes ; A5 remplace les lignes contradictoires par un seul tableau ; D8 absorbé par la file d'A1. Dans les tâches : réalisation de la file, champs écrits par page, gardes de `candidat.html`, commande de la sonde, structure du Dockerfile, commande `imagetools`, numéros de ligne, noms de clés. Au plan de QA ou au guide : réponses simulées (`page.route`), formes de S2, essai CSRF de S3, `no-store` de D9, artefact (F5). Dans `deploy/README.md` (tâche de doc, une ligne de renvoi dans la spec) : E2, E5, E8, E9, D10, D7. **S4 → backlog.** **D7 → H4 + une phrase au README.** **R8 → régression notée dans `MODELE.md`, évolution au backlog.** Tour 2 : retours ouverts et règles modifiées seulement ; toute nouvelle `[extension]` écartée sauf indispensable ; 3e tour seulement si le score bouge et qu'il reste un bloquant.

## P2 — après le tour 2 · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec v2 | 295 lignes, 25 CA | ≤ 380 lignes, ≤ 30 CA |
| Score du tour 2 | 88 (47 au tour 1), Intégrateur API 67 | 3e tour si le score bouge et qu'il reste un bloquant |
| Retours recevables | 8 (1 bloquant, 6 majeurs, 1 mineur) | ~20 |
| Retours écartés | 2 (doublons) | — |
| Dérives / conflits / extensions | 0 / 0 / 0 | 0 |
| Vérifications ajoutées | 2 (V38, V39) | — |
Constats : plan respecté ; le 3e tour remplit sa condition (+41 points, un bloquant restant) et c'est le dernier ; recevables divisés par 5. Paquet v3 proportionné (A7 = déplacement d'une ligne ; F9, A2, R10, D11 d'un seul tenant ; S6, S7 en une mention). E10 : l'ordre de mise en service et la conduite à tenir relèvent du README. Risque de dérive vers la réalisation dans R6g et R6h.
Actions : spec v3 ≤ 340 lignes et ≤ 27 CA ; étendre les CA existants plutôt qu'en créer ; E10 en une phrase avec renvoi au README ; mécanique de `pagehide` et numéros de ligne aux tâches ; renvois inexistants (« H5 », « R30b ») corrigés ; aucun nouvel ajout au tour 3 ; si le tour 3 n'est pas validé, les points restants vont à l'utilisateur, pas à un 4e tour. Appliqué : spec v3 de 303 lignes, 25 CA, E10 réduit à une phrase dans R32.

## P3 — après le découpage · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec finale | 311 lignes, 25 CA, 97/100 en 3 tours | ≤ 340 et ≤ 27 CA |
| Tâches | 10 | 9 à 11 |
| Fichiers créés prévus | 5 | 4 à 6 |
| Fichiers modifiés prévus | 19 (avec `assets/dossier.js`) | 15 à 20 |
| Dépendances npm / fichiers de `api/src` | 0 / 0 | 0 |
| Règles / CA sans tâche | R24, R39, CA17 ; R16, R37, CA15 | 0 |
Constats : découpage conforme au plan, aucun ajout, outillage dans le projet, risque d'abord. Deux écarts : le garde-fou de la règle 1 (R24, CA17, R39) n'est rattaché à aucune tâche ; l'emplacement de l'aide d'écriture de partie n'est pas tranché, et la non-régression n'est pas écrite dans les tâches.
Actions : R24, R39, CA17 ajoutés à la tâche 01 (essais d'attaque, valeurs résolues, formes d'adresse) ; non-régression ajoutée à chaque tâche comme critère de sortie ; aide `DOSSIER.ecrirePartie` dans `assets/dossier.js`. Fait.

## P4 — avant la QA · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Tâches | 10, toutes ok | 9 à 11 |
| Diff hors `hlyja/` | 24 fichiers, ~1 300 lignes ajoutées | — |
| Fichiers créés / modifiés | 5 / 19 | 4 à 6 / 15 à 20 |
| Dépendances npm / audit | 0 / 0 vulnérabilité | 0 |
| Tests hors code de production | 81 Node + 37 navigateur (mode serveur) ; 111 e2e navigateur rejoués | non-régression à chaque tâche |
| Revue de code | 0 bloquant, 1 majeur corrigé, 12 mineurs (6 corrigés, 6 notés) | — |
| Mutations | 20 Node (toutes détectées) + 3 e2e (2 détectées, 1 équivalente) | règle 5 |
| Écarts à la spec | 3 : R38, R6g révisé, lien « Ouvrir sur le site » | 0 |
| Référentiel | pas encore mis à jour | étape Documentation |
| Plan QA | à faire | 45 à 60 |
Constats : plan respecté, aucun ajout de fonctionnalité ; R6g et le lien sont des correctifs justifiés ; l'écart à R38 n'était tracé que dans la fiche 09, et le résumé de la spec gardait l'ancienne formule de R6g ; mineurs corrigés justifiés et petits (règles 2 et 4, R6i, CA20), chacun testé. Couverture déjà automatique à ne pas refaire à la main (CA1 à CA14, CA16 à CA22 en partie, CA24). Restent à la QA : CA17 avec session, V16, règle 4 sur la pile Docker, durée maximale par test, mutations de Q7, départ sous une autre identité qu'Alice, CA22, CA25, relecture des textes. Commande de l'e2e serveur non écrite ; nouvelles suites absentes du critère de sortie.
Actions : R38 et résumé de R6g alignés dans la spec finale ; `test-serveur.js` et `e2e-serveur.py` ajoutés au critère de non-régression (découpage) ; plan QA au bas du repère (~45), un scénario « rejeu » par suite ; Q2, Q5, Q6, Q8, Q9 restant au backlog ; commande de l'e2e serveur et pages du référentiel à l'étape Documentation. Appliqué (spec, découpage).
