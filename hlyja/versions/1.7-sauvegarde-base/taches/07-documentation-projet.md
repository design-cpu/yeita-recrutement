---
type: tache
version: 1.7
numero: 07
titre: deploy/README.md, api/README.md, README.md
statut: faite
date: 2026-10-27
---

# Tâche 07 — Documentation du projet

- `deploy/README.md` : tableau des fichiers (scripts, unités, `RESTAURER.md`) ; prérequis `age` et `rclone` (`sudo apt install age rclone`) ; § 10 : timers à arrêter avant un retour avant la 1.7 ; § 13 : la base n'est plus la seule copie ; **§ 14 Sauvegardes** : fonctionnement, durée de vie d'un dossier supprimé, mise en service en 7 étapes (clé, OVH avec trois utilisateurs S3 et leurs politiques JSON, cycle de vie par `aws s3api` depuis un poste, remote rclone de `deploy` par `read -s`, deux contrôles healthchecks.io, `.env`, installation des unités avec `cmp` à trois issues — rejouée telle quelle au CA13 —, premiers essais), au quotidien, lire un échec.
- `api/README.md` § « Ce que l'API garde » : méthode de copie (fiche 1.2-5), à ne pas faire, durées maximales, effet d'une restauration sur l'effacement.
- `README.md` : `sauvegarde.js` dans la ligne `npm test` ; ligne `tools/test-sauvegarde.sh`.
