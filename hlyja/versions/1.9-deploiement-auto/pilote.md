---
type: pilote
version: 1.9
points: 2
dernier: ajuster
date: 2026-10-28
---

# Chef d'équipe — version 1.9

> Plan + P1, P2 · dernier verdict : ajuster (appliqué).

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »).

## P1 — après le cadrage · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Cadrage | 85 lignes | proportionné (complexe, 6 modules) |
| Modules | 6 + socle | complexe |
| Challengers | 5 + arbitre | 5 + arbitre |
| Vérifications | 15 (poste + banc systemd) | banc prévu : fait |
| Ajouts `[ajout]` | 1 (`check-site.sh`) | aucun prévu ; petit |
Constats : périmètre conforme au pitch et aux deux décisions ; six règles nées d'écarts vérifiés ; le scénario de concurrence combiné (timer + path + `deploy.sh` à la main, l'un ralenti, l'un tué) n'est vérifié que par morceaux (V6, V14, V15).
Actions : scénario combiné en CA de la spec v1 (CA8, fait) puis scénario de QA sur le banc systemd.

## P2 — après le tour 1 · ajuster
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec v1 | 169 lignes | 170 à 230 |
| CA | 18 | 15 à 20 |
| Score tour 1 | 55 | tour 2 requis |
| Recevables ouverts | 22 majeurs, 25 mineurs | ~20 |
Constats : traitement conforme aux verdicts ; tout intégrer tel quel dépasserait 230 lignes et 20 CA ; banc à deux niveaux, gardes à muter (T7) et durées réglables relèvent des tâches ; `annule`, `interrompu`, alerte de 5 min et historique hôte à marquer `[ajout]`.
Actions appliquées : spec v2 à 191 lignes et 19 CA ; banc en une phrase, gardes à muter et déroulé des scénarios renvoyés au découpage ; un seul tableau des textes ; `[ajout]` marqués (historique hôte gardé : R13 en a besoin pour reconstruire les 30 passages sans relire le volume, S2) ; somme des attentes donnée pour `TimeoutStartSec`.
