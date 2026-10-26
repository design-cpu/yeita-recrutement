---
type: pilote
version: 1.3
points: 1
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
