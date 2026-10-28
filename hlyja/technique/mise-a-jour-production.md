---
type: technique
page: mise-a-jour-production
titre: Mettre à jour le site en production
maj: 1.7
commit: e005282
sources: deploy/METTRE-A-JOUR.md, deploy/deploy.sh, tools/check-site.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, deploy/backup.sh, deploy/verif-disque.sh, api/equipe.js, deploy/CLE-SAUVEGARDE.md
date: 2026-10-28
---

# Mettre à jour le site en production

> Mise à jour manuelle du serveur OVH après chaque pull request mergée dans `main` (pas encore de déploiement automatique). Référence projet : `deploy/METTRE-A-JOUR.md` ; la vue humaine est une checklist autonome qui recopie les commandes.

## Étapes
| # | Où | Action | Sortie attendue (lue dans le code) |
|---|---|---|---|
| 1 | GitHub | PR mergée dans `main` ; éviter 3 h–3 h 15 (sauvegarde) ; prévenir l'équipe (coupure ~15 s) | — |
| 2 | serveur, `deploy`, nouveau terminal | `umask 022 && cd /opt/recrutement && deploy/deploy.sh` (`umask 022` : contournement de la fiche 1.7-1) | `Commit en place : …`, `· Dépôt sur main : <commit>`, `· Conteneurs à jour ; anciennes images du projet supprimées.`, `· API saine.`, 7 `OK`, `Tout est OK sur https://recrutement.yeita.fr`, `Déploiement réussi : <commit> sur https://recrutement.yeita.fr` (`deploy.sh` l. 100-111, 132, 137 ; `check-site.sh` l. 51) |
| 3 | navigateur | `/candidatures/` (connexion Google, « Connecté·e : <prénom> ») ; `/admin/sauvegardes.html` (compte admin) | page d'état affichée |
| 4 | serveur | échec : lancer la commande affichée `deploy/deploy.sh <commit>` ; `ARRÊT : un déploiement est déjà en cours` : attendre 5 min | `ÉCHEC : …` puis `Pour revenir à la version précédente : deploy/deploy.sh <commit>` (`deploy.sh` fonction `echec`) |
| 5 | serveur et Mac | gestes propres à une version (1.7 : `sudo apt install -y age` ; clé créée sur le Mac et `AGE_RECIPIENT` écrite dans `.env` avec copie dans `~/env-avant-cle` ; installation des 4 unités à trois issues ; `equipe.js role <email> admin` ; `deploy/backup.sh && deploy/verif-disque.sh` ; page verte ; déchiffrement d'essai) | `Rôle changé : … · admin · actif` (`equipe.js` l. 77) ; `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur.` (`backup.sh`) |

## Points à savoir
| Point | Détail |
|---|---|
| Dépôt propre | `deploy.sh` refuse un dépôt avec un fichier en trop : rien ne doit être écrit dans `/opt/recrutement` en dehors de `.env` |
| Sauvegarde en cours | `deploy.sh` et `backup.sh` partagent le verrou `~/.recrutement-deploy.lock` ; `backup.sh` attend jusqu'à 10 min un déploiement |
| Maintenance de Docker | `docker.socket` relance Docker au premier appel `docker` : arrêter les minuteries avant |
| Retour avant la 1.7 | `sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer` avant `deploy.sh <commit>` |

## Voir aussi
- [Déployer sur OVH, première mise en ligne](deploiement-ovh.md)
- [Clé des sauvegardes](cle-sauvegarde.md)
- [Architecture et déploiement](architecture.md)

## Historique
| Version | Changement |
|---|---|
| 1.7 | Création |
