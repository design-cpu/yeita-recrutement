---
type: technique
page: deploiement-ovh
titre: Déployer sur OVH et tester avec Google, pas à pas
maj: 1.7
commit: 8db372f
sources: deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/oauth2-proxy.cfg, compose.yaml, .env.example, tools/check-site.sh, api/src/app.js, assets/wording.fr.js, deploy/README.md, deploy/backup.sh, deploy/verif-disque.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, deploy/RESTAURER.md, deploy/METTRE-A-JOUR.md, deploy/CLE-SAUVEGARDE.md
date: 2026-10-28
---

# Déployer sur OVH et tester avec Google, pas à pas

> Ordre des opérations de la première mise en ligne sur le VPS OVH de Yeita (`51.75.252.121`, Ubuntu 26.04, nginx sur 80/443 donc cas A, pm2 pour d'autres apps, Docker absent au 2026-10-27), avec les sorties attendues des scripts. La vue humaine est une checklist autonome (commandes recopiées, pas de renvoi) ; la référence complète reste `deploy/README.md`.

## Ordre
| # | Où | Action | Sortie attendue (lue dans le code) |
|---|---|---|---|
| 1 | espace client OVH | entrée **A** `recrutement` → `51.75.252.121` ; supprimer les entrées `recrutement` existantes ; pas d'AAAA | `dig +short recrutement.yeita.fr` = IP |
| 2 | serveur, `ubuntu` | `apt install docker.io docker-compose-v2 certbot python3-certbot-nginx tmux age` (v1.7 : `age`, exigé par `prepare-serveur.sh` à l'étape 3) (paquets Ubuntu, vérifiés par `apt-cache policy` avant) | `docker version`, `docker compose version`, `certbot --version` ; pm2 et nginx toujours actifs |
| 3 | poste + serveur, `ubuntu` | `pbcopy` de la clé ; `read CLE` sur une ligne seule (un `read` dans un collage multiligne lirait la ligne suivante) ; clone dans `mktemp -d` ; `sudo prepare-serveur.sh "$CLE"` | `Serveur prêt.` (prepare-serveur.sh l. 165) ; `ssh deploy@… whoami` → `deploy` |
| 4 | console Google Cloud | client existant : URI `https://recrutement.yeita.fr/oauth2/callback`, audience **Interne** | |
| 5 | serveur, `deploy` | `.env` écrit par heredoc (6 variables de `.env.example`, `COMPOSE_PROFILES=` vide, cookie secret généré), ID et secret remplacés à la main dans `nano` | contrôlé par `deploy.sh` l. 35-52 |
| 6 | serveur, `ubuntu` | copie de `/etc/nginx` ; relevé des autres `server_name` (awk sur `nginx -T`) ; `certbot certonly --nginx` ; site écrit par `tee` (exemple nginx de `deploy/README.md` § 7, identique) ; `nginx -t` ; `reload` ; `diff` du relevé | `Successfully received certificate.`, `test is successful`, relevé identique |
| 7 | serveur, `deploy`, tmux | `deploy.sh` | `· API saine.`, 7 `OK`, `Tout est OK sur …`, `Déploiement réussi : …` ; échec : `ÉCHEC : …` + commande de retour |
| 8 | serveur, `deploy` | bloc de contrôle réseau de l'API (`deploy/README.md` § 9b, recopié tel quel) — obligatoire : moteur Docker d'Ubuntu, pas le 29.9.2 vérifié en v1.3 | 7 `OK`, `VERDICT : tout est bon.` |
| 9 | serveur, `deploy` | `docker compose exec api node api/equipe.js add <email> <Prénom> admin` | membre listé par `list` |
| 10 | navigateur + poste | public sans connexion ; `/candidatures/` → Google → `Connecté·e : <prénom>` ; `/api/moi` → `{email, prenom, role}` ; compte gmail refusé (Interne) ; `tools/check-site.sh https://recrutement.yeita.fr` → 7 `OK` | |
| 11 | Mac, puis serveur (`ubuntu`, `deploy`) | sauvegardes : `deploy/METTRE-A-JOUR.md` § 5 « 1.7 » (age, clé créée sur le Mac et clé publique dans `.env` (`deploy/CLE-SAUVEGARDE.md`), unités systemd, rôle admin, première sauvegarde, page d'état, vérification de la clé) (v1.7) | `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur.` ; `https://recrutement.yeita.fr/admin/sauvegardes.html` verte ; `systemctl list-timers 'recrutement-*'` |

## Points à savoir
| Point | Détail |
|---|---|
| Premier déploiement sur serveur neuf | le clone est déjà sur un `main` qui contient l'API : `deploy.sh` attend lui-même `healthy` (l. 120-132) ; la mise en garde « premier déploiement lancé par une version sans API » de `deploy/README.md` § 9b ne s'applique pas |
| Cas B | non traité par la vue humaine : le serveur réel est en cas A (nginx) |
| Serveur relevé le 2026-10-27 | un seul site nginx (`mamie.yeita.fr` → `localhost:3000`, plus `default`), pm2 `yeita-agents` (`yeita-web-backend/server.js`, port 3000) et `mamie-discord` (`bot-discord.js`) ; certbot déjà installé (timer actif) ; mises à jour automatiques actives (`apt` peut trouver le verrou pris pendant l'étape 2 : attendre et relancer) |
| Redémarrage en attente | le serveur affiche « System restart required » : non fait, pas nécessaire au déploiement (couperait les apps pm2) |
| Secret client Google | affiché une seule fois à la création dans la console actuelle |
| Libellés cités | `Connecté·e : ` et `Tu ne fais pas partie de l'équipe.` (`assets/wording.fr.js` l. 36, 42) ; `/api/moi` (`api/src/app.js` l. 77) |
| Interdit sur le serveur | `docker compose down -v`, `docker volume prune` (volume `recrutement_data`) |
| Sauvegardes (v1.7) | à mettre en place avant de vraies candidatures : jusque-là, le volume est la seule copie ; restaurer : `deploy/RESTAURER.md` |

## Historique
| Version | Changement |
|---|---|
| 1.5 | Création : ordre de la première mise en ligne |
| 1.6 | Relevé du serveur réel |
| 1.7 | `age` à l'étape 2 ; étape 11 : sauvegardes (`deploy/METTRE-A-JOUR.md` § 5) ; mises à jour suivantes : `deploy/METTRE-A-JOUR.md` |
