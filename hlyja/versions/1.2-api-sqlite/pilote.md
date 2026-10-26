---
type: pilote
version: 1.2
points: 3
dernier: ok
date: 2026-10-26
---

# Chef d'équipe — version 1.2

> Plan + P1 à P3 · dernier verdict : ok.

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »). Jury de 5, spec 250 à 350 lignes, 8 à 10 tâches, 14 à 18 fichiers créés et 4 modifiés, 35 à 45 scénarios de QA.

## P1 — après le cadrage · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Lignes de cadrage.md | 83 | proportionné |
| Vérifications | 17, dont 4 écarts, 3 décisions de l'utilisateur | règle 1 respectée (V9 + témoin V10 avant la spec v1) |
| Modules | socle + 5 | socle + 5 |
| Jury | 5 + arbitre | 5 + arbitre |
| Fichiers hors `api/` prévus | `tools/build.py`, `.gitignore`, `MODELE.md`, `README.md` | 4 modifiés |
| Fichiers livrables créés | 0 | normal à P1 |
Constats : aucun écart au plan ; ajouts justifiés (`@fastify/static` par `DEV_STATIC`, `api/.npmrc` par V3, `api` dans `SKIP` par V13, `HOST` par décision de l'utilisateur, refus de `DEV_EMAIL` hors adresse locale : un seul contrôle au démarrage). Niveau proportionné.
Actions : spec v1 entre 250 et 350 lignes, 8 à 10 tâches ; aucune route ni commande hors pitch ; `@fastify/static` enregistré seulement si `DEV_STATIC` ; `.npmrc` limité à `ignore-scripts=true` ; chaque ajout marqué `[ajout]` avec sa vérification ; backlog : H1 (email Google dans l'en-tête), `.dockerignore` (exclure `api/`).
Suite donnée : `DB_PATH` gardé en `[ajout]` (placement sur un volume à la version suivante, bases de test de `equipe.js`) ; à rejuger en P2 si le jury le conteste.

## P2 — après le tour 1 · question
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Lignes de spec-v1 | 204 | 250 à 350 |
| Règles / CA | 36 / 17 | cible v2 : 46 règles et 21 CA au plus |
| Score du tour 1 | 74 (T 64, I 72, S 90, D 74, E 68) | — |
| Retours | 46, dont 36 recevables (0 bloquant, 10 majeurs) | — |
| Vérifications | 24 (V18 à V24 ajoutées) | règle 2 sans CA (T3) |
| Ajouts hors pitch proposés par le jury | 6 (E2, D7, D2, S2, E4, S6) | à justifier, réduire ou backlog |
Constats : périmètre tenu, aucune route ni commande nouvelle ; les majeurs corrigent la mise en œuvre du pitch ou les règles 2 et 3. D7, S6 justifiés ; E4 et S2 à réduire ; E2 (refus selon le propriétaire) au backlog, le README et la ligne « Base : » suffisent ; D2 est une décision de l'utilisateur ; I9 : page API au plan, renvoi `MODELE.md` à confirmer. T7, T9, E9, D8, I3 relèvent des tâches, de la QA ou de la doc.
Actions : D2 posé à l'utilisateur ; T13/E5 tranché ; spec v2 de 270 à 320 lignes, 46 règles et 21 CA au plus, un seul CA nouveau (règle 2) ; `[ajout]` pour D7, S6, E4, S2, D1 ; backlog : propriétaire dans `equipe.js`, `.git`/`.env` dans `DEV_STATIC`, H1, `.dockerignore`.
Suite donnée : D2 → l'utilisateur a choisi la purge (une ligne `suppression`). I9 → le renvoi vers le contrat HTTP est placé dans la section des tables de `MODELE.md`, couverte par l'accord ; aucune autre phrase de `MODELE.md` ne change. T13/E5 → chemins relatifs résolus par rapport à `api/` (cohérent avec le défaut de R10).

## P3 — après le découpage · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Tâches | 9 | 8 à 10 |
| Couverture | R1 à R36, CA1 à CA18 rattachés | tout couvert |
| Spec finale | 236 lignes, 36 règles, 18 CA, 94 au tour 2 | 250 à 350 lignes ; 46 règles et 21 CA au plus |
| Fichiers prévus | 16 à 18 créés, 4 modifiés | 14 à 18 créés, 4 modifiés |
| Ajouts hors pitch dans le découpage | 0 | — |
| Outillage hors projet | aucun | node:test |
Constats : découpage fidèle, ordre proportionné au risque ; spec un peu sous le repère de longueur, sans risque de périmètre.
Actions : `test/` limité à 7 fichiers ; tâche 09 limitée à `api/README.md`, au renvoi du README racine et à la section des tables de `MODELE.md` (référentiel à l'étape documentation) ; ne pas faire : Docker, `.dockerignore`, Playwright, adaptateur, migration, sauvegardes, charge, propriétaire dans `equipe.js`, `.git`/`.env` sous `DEV_STATIC`, H1, linter, CI ; aucun nouvel `[ajout]` sans P4.
