---
type: pilote
version: 1.3
points: 2
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
