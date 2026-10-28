---
type: revue-spec
version: 1.7
objet: reprise du 2026-10-28
date: 2026-10-28
---

# Revue de la reprise — double regard technique et produit

> Un relecteur, un passage. 7 majeurs, 5 mineurs ; aucune escalade : tous mettent la spec en cohérence avec les décisions de l'utilisateur. Traitement : la spec finale est réécrite d'un seul tenant (l'ancienne est gardée dans `spec-avant-reprise.md`).

| # | Regard | Sévérité | Constat | Traitement |
|---|---|---|---|---|
| 1 | P/T | majeur | Passages restés sur OVH, rclone, healthchecks.io (titre, contexte, parcours, périmètre, données, schéma, sécurité, exploitation, H1, H3) | spec réécrite, titre « sur le serveur, avec page d'état » ; `version.md` mis à jour |
| 2 | T | majeur | R5, R8, R14, R20 parlaient encore de ping | réécrites (état `echec`, `TimeoutStopSec` justifié par le conteneur jetable) |
| 3 | T | majeur | Verrou propre pris : un état `echec` mettrait la page au rouge pendant une sauvegarde valable | R5 : aucun état écrit ; CA7 |
| 4 | P/T | majeur | Verdict vert/rouge non défini | R23 : règle du rouge et motifs en clair ; CA25 |
| 5 | T | majeur | `etat/` absent de la liste « volume propre » de la restauration | R16, CA12 |
| 6 | P | majeur | CA16 exigeait encore OVH, rclone, healthchecks.io | CA16 réécrit, avec un `grep` de preuve |
| 7 | T | majeur | Exclusion « API hors `sauvegarde.js` » contraire à la route ; module et tests non nommés | Périmètre amendé ; `api/src/sauvegardes.js`, `db.name`, contrôle du rôle dans la route, tests dans `api.test.js` |
| 8 | T | mineur | Place de `illisible` non dite | R22 : `{illisible: true}` à la place de l'objet |
| 9 | T | mineur | État non écrit après une sauvegarde faite ; `.env` absent : rien d'écrit | R10, R21 |
| 10 | T | mineur | `verif-disque.sh` pendant `backup.sh` : `ps -q api` compte-t-il le conteneur jetable ? | CA24 (essai sur le banc) |
| 11 | P | mineur | Pas de message pour la session expirée (401) | R23, CA25 |
| 12 | P | mineur | Le testeur doit avoir le rôle admin et l'adresse de la page | R26 et guide |
