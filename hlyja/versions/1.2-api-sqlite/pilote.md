---
type: pilote
version: 1.2
points: 1
dernier: ok
date: 2026-10-26
---

# Chef d'équipe — version 1.2

> Plan + P1 · dernier verdict : ok.

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
