---
type: technique
page: mise-a-jour-production
titre: Mettre à jour le site en production
maj: 1.10
commit: c684a41
sources: deploy/METTRE-A-JOUR.md, deploy/deploy.sh, tools/check-site.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, deploy/backup.sh, deploy/verif-disque.sh, api/equipe.js, deploy/CLE-SAUVEGARDE.md, deploy/auto-deploy.sh, deploy/systemd/recrutement-deploy.service, deploy/systemd/recrutement-deploy.timer, deploy/systemd/recrutement-deploy.path, deploy/README.md, deploy/RESTAURER.md
date: 2026-10-28
---

# Mettre à jour le site en production

> Depuis la v1.9, `main` est mis en ligne tout seul après les tests ([Déploiement automatique](deploiement-automatique.md)) ; cette page décrit le passage manuel : premier passage à la 1.9, secours sans tests, gestes propres à une version. Référence projet : `deploy/METTRE-A-JOUR.md` ; la vue humaine est une checklist autonome qui recopie les commandes.

## Étapes
| # | Où | Action | Sortie attendue (lue dans le code) |
|---|---|---|---|
| 1 | GitHub | v1.10 : d'abord la partie « avant le merge » du § 5 si la version en a une (le merge met `main` en ligne sous 10 min) ; PR mergée dans `main` ; éviter 3 h–3 h 15 (sauvegarde) ; prévenir l'équipe (coupure ~15 s) | — |
| 2 | serveur, `deploy`, nouveau terminal | `umask 022 && cd /opt/recrutement && deploy/deploy.sh` (`umask 022` : protège une exécution par un `deploy.sh` antérieur à la 1.8, voir « Masque des fichiers ») | `Commit en place : …`, `· Dépôt sur main : <commit>`, `· Conteneurs à jour ; anciennes images du projet supprimées.`, `· API saine.`, 8 `OK`, `Tout est OK sur https://recrutement.yeita.fr`, `Déploiement réussi : <commit> sur https://recrutement.yeita.fr` (`deploy.sh` l. 63, 115, 126, 156 ; `check-site.sh` l. 52) |
| 3 | navigateur | `/candidatures/` (connexion Google, « Connecté·e : <prénom> ») ; `/admin/sauvegardes.html` et, depuis la 1.9, `/admin/deploiement.html` (compte admin) | pages d'état affichées |
| 4 | serveur | échec : lancer la commande affichée `deploy/deploy.sh <commit>`, telle quelle, sauf après l'échec d'un retour vers un commit d'avant la 1.8 (le `deploy.sh` du disque est alors l'ancien) : `umask 022 &&` devant ; `ARRÊT : un déploiement est déjà en cours` : attendre 5 min | `ÉCHEC : …` puis `Pour revenir à la version précédente : deploy/deploy.sh <commit>` (`deploy.sh` fonction `echec`) |
| 5 | serveur et Mac | gestes propres à une version (1.7 : `sudo apt install -y age` ; clé créée sur le Mac et `AGE_RECIPIENT` écrite dans `.env` avec copie dans `~/env-avant-cle` ; installation des 4 unités à trois issues ; `equipe.js role <email> admin` ; `deploy/backup.sh && deploy/verif-disque.sh` ; page verte ; déchiffrement d'essai) | `Rôle changé : … · admin · actif` (`equipe.js` l. 77) ; `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur.` (`backup.sh`) |

## Points à savoir
| Point | Détail |
|---|---|
| Dépôt propre | `deploy.sh` refuse un dépôt avec un fichier en trop : rien ne doit être écrit dans `/opt/recrutement` en dehors de `.env` |
| Sauvegarde en cours | `deploy.sh` et `backup.sh` partagent le verrou `~/.recrutement-deploy.lock` ; `backup.sh` attend jusqu'à 10 min un déploiement |
| Maintenance de Docker | `docker.socket` relance Docker au premier appel `docker` : arrêter les minuteries avant |
| Masque des fichiers | depuis la 1.8, `deploy.sh` fixe `umask 022` (l. 11) avant toute écriture : sous `umask 077`, git réécrirait les fichiers en 600, illisibles par `node` et oauth2-proxy dans les images. Le préfixe `umask 022 &&` de l'étape 2 sert quand le `deploy.sh` du disque est antérieur à la 1.8 (premier passage à la 1.8, ou après un retour vers un commit d'avant) ; les commandes de retour de l'étape 4 n'en ont pas besoin dans les autres cas |
| Pause (v1.9) | `deploy.sh <commit>` à la main, hors dernier de `main`, écrit `deploy/PAUSE` (`· Déploiement automatique en pause …`) ; « Reprendre » sur `/admin/deploiement.html` la retire |
| Déploiement automatique (v1.9) | lancer `deploy.sh` à la main pendant un passage l'annule (`annule`) ; voir l'état sur `/admin/deploiement.html` avant |
| 1.9 | gestes : déployer la 1.9 à la main (encore le `deploy.sh` de la 1.8), installer `recrutement-deploy.{service,timer,path}` (`deploy/README.md` § 15), vérifier la page verte |
| 1.10 — avant le merge | compte `deploy` : `deploy/backup.sh` (« Sauvegarde réussie ») ; compte `ubuntu` : relevé `nginx -T` (`client_max_body_size`, `server_name` → `~/sites-avant-1.10.txt`), copie de `/etc/nginx/sites-available/recrutement.yeita.fr`, `client_max_body_size 10m;` dans le `server` 443, `nginx -t` puis `reload`, preuve : POST de 2 097 152 octets sur `https://recrutement.yeita.fr/api/candidats/cand-x-y/fichiers?champ=cv` → `401` (oauth2-proxy, sans compte ; `413` = réglage absent), relevé des sites et `diff` vide ; banc : 2 Mo et 10 Mo → `401`, 10 Mo + 1 → `413` |
| Retour avant la 1.10 | rien à arrêter : l'API de la 1.9 relit la base (`user_version` 1) ; pages 1.9 : fichiers invisibles (gardés), lignes de dépôt affichées « undefined → undefined », « Annuler le dernier passage » peut être refusé tant qu'une ligne de dépôt est la dernière ; tout revient avec la 1.10 ; ne pas recoller les CV en lien |
| Retour avant la 1.9 | `sudo systemctl disable --now recrutement-deploy.timer recrutement-deploy.path` avant `deploy.sh <commit>` ; au retour : réinstaller (« identique ») puis « Reprendre » |
| Retour avant la 1.7 | `sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer` avant `deploy.sh <commit>` |

## Voir aussi
- [Déployer sur OVH, première mise en ligne](deploiement-ovh.md)
- [Clé des sauvegardes](cle-sauvegarde.md)
- [Architecture et déploiement](architecture.md)
- [Déploiement automatique](deploiement-automatique.md)

## Historique
| Version | Changement |
|---|---|
| 1.7 | Création |
| 1.8 | `deploy.sh` fixe `umask 022` (fiche 1.7-1) ; préfixe de l'étape 2 gardé, avec sa raison ; exception de l'étape 4 ; numéros de ligne recalés |
| 1.9 | Le déploiement devient automatique ; pause, gestes de la 1.9, retour avant la 1.9 |
| 1.10 | Partie « avant le merge » (§ 1 et § 5) : sauvegarde, `client_max_body_size 10m` ; retour avant la 1.10 |
