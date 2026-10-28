---
type: pilote
version: 1.9
points: 1
dernier: ok
date: 2026-10-28
---

# Chef d'équipe — version 1.9

> Plan + P1 · dernier verdict : ok.

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
