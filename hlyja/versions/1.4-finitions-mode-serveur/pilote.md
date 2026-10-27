---
type: pilote
version: 1.4
points: 1
dernier: ok
date: 2026-10-27
---

# Chef d'équipe — version 1.4

> Plan + P4 · dernier verdict : ok · seul écart : 9 mutations au lieu de 3 ou 4 (effort, sans effet sur le dépôt).

## Plan · ok
Plan écrit dans `version.md` (section « Plan d'équipe »). Écart de l'orchestrateur, noté : la spec et les tâches T1 et T2 sont écrites par l'orchestrateur (flux standard du skill), pas par des sous-agents rédacteur et réalisateur.

## P4 — avant la QA · ok
| Mesure | Valeur | Repère du plan |
|---|---|---|
| Spec finale | 55 lignes | 40 à 60 |
| Tâches | 3 | 3 |
| Fichiers de code touchés | 6 (dont `docs/modele-de-donnees.md` supprimé) | ~6, la même liste |
| Vérifications ajoutées | 15 (4 test-serveur + 11 e2e-serveur) | 10 à 15 |
| Mutations | 9, toutes détectées | 3 ou 4 |
| Fichiers créés dans le projet hors code de production | 0 | — |
| Revue de spec | 2 majeurs + 3 mineurs intégrés | 1 relecteur |

Constats : le travail suit le plan ; fichiers touchés conformes ; tâches dans R1 à R8 ; aucun test ajouté à `api/` ni aux suites du mode navigateur. Les deux ajouts issus du majeur 1 de la revue de spec (garde du clic hors mode navigateur, « Retirer les exemples » caché avant le premier affichage) restent dans la fiche 1.3-2. Seul écart : 9 mutations au lieu de 3 ou 4, dépassement d'effort sans effet sur le dépôt (scripts dans le scratchpad). Écart déjà noté maintenu : spec et tâches écrites par l'orchestrateur.
Actions : QA de 6 à 8 scénarios, qui couvre les deux ajouts de la revue de spec. Dépassement des mutations noté sans reprise ; retour au repère aux versions suivantes.
