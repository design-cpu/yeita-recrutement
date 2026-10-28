---
type: spec
version: 1.7
iteration: 1
statut: en-challenge
date: 2026-10-27
---

# Spec v1 — Sauvegarde chiffrée de la base, hors du serveur, avec alertes

## Contexte et objectif
La base de l'API (`/data/recrutement.sqlite` dans le volume `recrutement_data`) est la seule copie des dossiers candidat. Après cette version : une copie cohérente et vérifiée est faite chaque nuit, chiffrée pour une clé dont seule la partie publique est sur le serveur, envoyée sur OVH Object Storage ; une sauvegarde ratée ou un disque à plus de 80 % déclenchent une alerte healthchecks.io ; une restauration se fait en suivant `deploy/RESTAURER.md`, sans jamais déchiffrer sur le serveur. Les copies ne gardent un dossier supprimé que pendant une durée bornée et écrite.

## Utilisateurs et parcours
Acteurs : l'administrateur du serveur (installe, reçoit les alertes, restaure) ; l'équipe de recrutement (ne voit rien changer).

### P1 — Mise en service (une fois)
1. Sur un poste : `age-keygen -o recrutement-sauvegarde.key` ; la clé privée est rangée hors du serveur (R17) ; la clé publique va dans `AGE_RECIPIENT`.
2. OVH : bucket non versionné, règle de cycle de vie à 30 jours, utilisateur S3 ; sur le serveur, `deploy` crée le remote rclone (R12, R18).
3. healthchecks.io : deux contrôles (R15) ; leurs adresses vont dans `.env`.
4. Administrateur : `apt install age rclone` ; unités copiées et timers activés (R14).
5. Premier essai à la main : `deploy/backup.sh` puis `deploy/verif-disque.sh` ; les deux contrôles passent au vert.

### P2 — Chaque nuit
`recrutement-backup.timer` lance `deploy/backup.sh` vers 3 h ; succès → ping OK ; tout échec → ping `/fail` avec la raison, code non nul. Serveur éteint à 3 h : la sauvegarde part au démarrage suivant (`Persistent=true`). Rien ne part (timer cassé, serveur mort) : healthchecks.io alerte par absence de ping.

### P3 — Chaque heure
`recrutement-verif-disque.timer` lance `deploy/verif-disque.sh` : au-delà de 80 % sur `/` ou le dossier Docker → `/fail`.

### P4 — Restaurer
Copie récupérée sur OVH (ou dans `/var/backups/recrutement`), déchiffrée sur un poste, contrôlée, envoyée par SSH directement dans le volume, api redémarrée, vérifiée (R16).

### P5 — Ouvrir une copie sur un poste
Déchiffrer, ouvrir en lecture seule, effacer le clair après usage (R16).

## Périmètre
### Inclus
`api/sauvegarde.js` ; `deploy/backup.sh` ; `deploy/verif-disque.sh` ; `deploy/systemd/recrutement-backup.service`, `.timer`, `recrutement-verif-disque.service`, `.timer` ; `deploy/prepare-serveur.sh` (outils) ; `.env.example` ; `deploy/RESTAURER.md` ; `deploy/README.md` (installation, OVH, healthchecks.io, clé) ; `api/README.md` (méthode et rétention, fiche 1.2-5) ; tests.
### Exclu
Reprend le cadrage : volumes Caddy ; tableaux de bord ; toute modification de l'API hors `api/sauvegarde.js` ; effacement distant par le serveur ; installation automatique d'outils ; création du bucket, des identifiants et des contrôles (gestes documentés) ; sauvegarde du `.env` et de la configuration rclone.

## Existant réutilisé
| Besoin | Décision | Élément |
|---|---|---|
| Chemin de la base | réutiliser | `cheminBase(process.env)`, `ErreurConfig` (`api/src/config.js`) |
| Base occupée | réutiliser | `estOccupee` (`api/src/base.js`), `ATTENTE_MS` |
| Forme d'une commande | étendre le modèle | `api/equipe.js` : messages en français, code 0/1 |
| Réglages `.env` | réutiliser | `docker compose config --environment` + refus `#…` et valeurs d'exemple (`deploy/deploy.sh` l. 35-52) |
| Style des scripts | réutiliser | `arret`, `info`, `set -euo pipefail`, refus de root, `flock` |
| Dossier des copies | réutiliser | `/var/backups/recrutement` 700 (`prepare-serveur.sh`) |
| Copie | créer | `db.backup()` de better-sqlite3, déjà dépendance (V1) ; aucune dépendance npm ajoutée |
| Chiffrement, envoi | créer | `age` 1.2.1, `rclone` 1.60.1, paquets Ubuntu 26.04 (V9) : imposés par le pitch |

## Règles et comportements
| # | Règle |
|---|---|
| R1 | `node api/sauvegarde.js` ouvre la base de `cheminBase(process.env)` en lecture seule, sans la créer (base absente → message « Base absente : <chemin> », code 1), et la copie avec `db.backup()` (V1, V5) ; jamais `sqlite3 .backup` ni copie des fichiers (fiche 1.2-5). La connexion est fermée dès la copie faite. |
| R2 | Destination : `<dossier de la base>/sauvegardes/recrutement-AAAA-MM-JJ.db`, date UTC du jour (en production `/data/sauvegardes/…`). Dossier créé en 700, copie en 600 (masque 077, V1, V5). La copie est écrite sous un nom temporaire, contrôlée par `PRAGMA integrity_check` (seul `ok` vaut succès, V3), passée en `journal_mode = DELETE` (un seul fichier, V2), puis renommée : le nom final ne désigne jamais une copie non contrôlée. Une copie du même jour est remplacée. |
| R3 | Sortie : messages en français ; sur succès, la dernière ligne de la sortie standard est le chemin absolu de la copie, code 0. Tout échec (base absente, occupée, disque plein, contrôle ≠ `ok`) : message sur la sortie d'erreur, fichier temporaire supprimé, code 1. Arguments inconnus : usage, code 1. |
| R4 | `--nettoyer` : après une copie réussie seulement, supprime dans le dossier des copies les fichiers `recrutement-AAAA-MM-JJ.db` et les temporaires laissés par une exécution interrompue, modifiés il y a plus de 48 h ; jamais la copie du jour ni un autre fichier. Affiche le nombre supprimé. |
| R5 | `deploy/backup.sh` refuse root, se place dans le dépôt, prend un verrou `flock` non bloquant (`~/.recrutement-backup.lock`) ; verrou pris → message, code 1, sans ping (la sauvegarde en cours pingue). |
| R6 | Réglages lus par `docker compose config --environment` (V13). Refusés avec un message qui nomme la variable : vide ; commençant par `#` ; égal à sa valeur dans `.env.example` ; `HEALTHCHECK_SAUVEGARDE_URL` hors `https://` ; `RCLONE_DEST` sans `:` ; `AGE_RECIPIENT` que `age` refuse (essai de chiffrement vers `/dev/null` avant toute copie, V8). |
| R7 | Enchaînement : (1) outils présents (`docker`, `age`, `rclone`, `curl`, `flock`) ; (2) réglages ; (3) `docker compose exec -T api node api/sauvegarde.js --nettoyer`, dernière ligne attendue `/data/sauvegardes/recrutement-AAAA-MM-JJ.db` ; (4) `docker compose cp` vers `/var/backups/recrutement` (V6) ; (5) `age -r` vers `<nom>.db.age`, écrit sous un nom temporaire puis renommé, en 600 (V8) ; (6) copie en clair supprimée ; (7) `rclone copy <nom>.db.age "$RCLONE_DEST"` (V10) ; (8) suppression locale des `recrutement-*.db.age` de plus de 30 jours ; (9) ping de succès. Une étape en échec arrête la suite. |
| R8 | Clair jamais laissé : la copie en clair de l'hôte et les temporaires sont supprimés à toute sortie (succès, échec, interruption par signal) ; au démarrage, tout `recrutement-*.db` en clair laissé dans `/var/backups/recrutement` par une coupure est supprimé. Le dossier ne contient en régime normal que des `.db.age`. |
| R9 | Rétention locale : la suppression des `.db.age` de plus de 30 jours n'a lieu qu'après un envoi réussi (des sauvegardes en échec n'effacent pas les dernières bonnes). |
| R10 | Ping : `curl` avec délai maximal (10 s) et quelques nouvelles tentatives ; succès vers l'adresse, échec vers `<adresse>/fail`, avec en corps un résumé (étape, message, taille du `.age`) sans donnée de candidat. Un ping n'est réussi que si la réponse vaut exactement `OK` (V11 : une adresse inconnue répond 200 « (not found) »). Ping impossible → message, code non nul même si la sauvegarde a réussi. Réglage d'adresse refusé (R6) → aucun ping, code 1 : healthchecks.io alerte par absence. |
| R11 | `deploy/verif-disque.sh` : refuse root ; lit `HEALTHCHECK_DISQUE_URL` comme R6 ; mesure `/` et le dossier Docker (`docker info -f '{{.DockerRootDir}}'`, V14) par `df` ; une occupation strictement supérieure à 80 % sur l'un → ping `/fail` avec les deux valeurs, code 1 ; sinon ping de succès avec les valeurs, code 0. Mesure impossible (Docker ne répond pas, `df` échoue) → `/fail`, code 1. |
| R12 | Rétention distante : bucket non versionné, règle de cycle de vie `Expiration` 30 jours posée à la création (commande et JSON dans `deploy/README.md`, V12) ; le serveur n'efface rien à distance. Durée de vie d'un dossier supprimé dans les copies : 2 jours dans le volume, 30 jours sur le serveur, ~31 jours sur OVH ; écrite dans `api/README.md` et la doc produit. |
| R13 | `prepare-serveur.sh` ajoute `age` et `rclone` à sa liste d'outils, avant toute modification ; absent → « « age » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien. », sans rien modifier. |
| R14 | Unités dans `deploy/systemd/` : services `Type=oneshot`, `User=deploy`, `Group=deploy`, `WorkingDirectory=/opt/recrutement`, `ExecStart` du script ; durée maximale (sauvegarde 1 h, disque 5 min). Timers : `OnCalendar=*-*-* 03:00:00` et `hourly` (V15), `Persistent=true`, léger délai aléatoire pour la sauvegarde. Installation par l'administrateur (`deploy/README.md`) : refus si une unité du même nom existe déjà avec un autre contenu ; copie dans `/etc/systemd/system`, `daemon-reload`, `enable --now` des deux timers ; contrôle par `systemctl list-timers 'recrutement-*'`. |
| R15 | healthchecks.io (`deploy/README.md`) : contrôle « sauvegarde » période 1 jour, grâce 2 h ; « disque » période 1 h, grâce 30 min ; notification par email à l'équipe. Les adresses de ping sont des secrets (`.env`, jamais commitées). |
| R16 | `deploy/RESTAURER.md`, pas à pas, commandes recopiables : (a) récupérer une copie (`rclone copy` depuis OVH sur un poste, ou `scp` depuis `/var/backups/recrutement`) ; (b) déchiffrer sur un poste (`age -d -i`), jamais sur le serveur ; (c) contrôler (`sqlite3 … "PRAGMA integrity_check"` = `ok`) ; (d) sur le serveur, avant de remplacer : lister les suppressions faites depuis la date de la copie dans le journal de la base actuelle si elle est lisible (elles reviendront avec la copie) ; (e) `docker compose stop api` ; (f) envoyer la copie par SSH directement dans le volume, en tant que `node`, en supprimant `-wal` et `-shm` (`ssh deploy@… 'cd /opt/recrutement && docker compose run --rm --no-deps -T api sh -c "…"' < copie.db`, V7) : aucun fichier en clair sur le disque du serveur ; (g) `docker compose start api` ; (h) vérifier : `healthy`, `equipe.js list`, nombre de dossiers, `tools/check-site.sh` ; supprimer à nouveau les dossiers listés en (d) ; (i) effacer le clair du poste. Section « Ouvrir une copie » : déchiffrer, `sqlite3 -readonly`, requêtes utiles, effacer après usage. |
| R17 | Clé privée : créée sur un poste, jamais copiée sur le serveur ; rangée dans le coffre de mots de passe de Yeita et connue d'au moins deux personnes (`deploy/README.md`) ; sa perte rend toutes les copies illisibles. |
| R18 | rclone : remote créé par `deploy` (`~/.config/rclone/rclone.conf`, 600), type S3 OVH (endpoint `.io`), utilisateur S3 dédié au bucket ; commandes dans `deploy/README.md`. |
| R19 | `.env.example` : les 4 variables, commentées, avec des valeurs d'exemple que `backup.sh` et `verif-disque.sh` refusent ; `deploy.sh` ne les exige pas (le site se déploie sans sauvegarde configurée). |
| R20 | Journaux : sortie des scripts dans le journal systemd (`journalctl -u recrutement-backup`) ; aucune donnée de candidat, aucune adresse de ping complète, aucune clé. |

## Données
- Contenu d'une copie : toutes les tables (`candidats`, `journal`, `equipe`, `options_disponibilite`) à l'instant de la copie ; un dossier supprimé avant n'y est plus (V4).
- Volumes : base de quelques Ko à quelques Mo (V5) ; 30 copies locales chiffrées, 30 distantes.
- Rétention : R4, R9, R12. Restaurer une copie fait revenir les dossiers supprimés depuis sa date : R16 (d), (h).

## Architecture technique
```mermaid
flowchart LR
  T[recrutement-backup.timer 3 h] --> B[deploy/backup.sh, deploy]
  B -->|docker compose exec| S[api : node api/sauvegarde.js --nettoyer]
  S -->|db.backup + integrity_check| C[(/data/sauvegardes, 2 j)]
  B -->|docker compose cp| H[/var/backups/recrutement]
  H -->|age -r clé publique| E[.db.age, 30 j]
  E -->|rclone copy| O[(OVH Object Storage, cycle de vie 30 j)]
  B -->|ping OK ou /fail| HC[healthchecks.io]
  TD[recrutement-verif-disque.timer, 1 h] --> D[deploy/verif-disque.sh] --> HC
```
Alternatives écartées par le pitch : `sqlite3 .backup`, `VACUUM INTO`, chiffrement GPG, `rclone sync`.

## Sécurité et conformité
- Clair : volume (déjà en clair, base elle-même) ; hôte seulement le temps du chiffrement (R8) ; poste lors d'une restauration (effacé, R16 i).
- Clé : seule la clé publique est sur le serveur ; secrets (identifiants S3, adresses de ping) dans des fichiers 600 de `deploy`.
- `deploy` est dans le groupe `docker` (déjà, v1.1) : aucun droit nouveau.
- RGPD : durée de vie d'un dossier supprimé dans les copies bornée et écrite (R12) ; restauration qui ré-efface (R16).

## Déploiement et compatibilité
Rien ne change pour le site ni l'API en service. Installation après merge : `deploy/deploy.sh`, puis P1. Retour arrière : `systemctl disable --now` des deux timers ; les scripts n'ont aucun effet hors `/var/backups/recrutement`, `/data/sauvegardes` et le bucket.

## Exploitation
Alertes : R10, R11, R15. Journaux : R20. Lire un échec : `systemctl status recrutement-backup`, `journalctl -u recrutement-backup -n 50`. Essai à la demande : `sudo systemctl start recrutement-backup` ou `deploy/backup.sh` en tant que `deploy`.

## Critères d'acceptation
| # | Critère |
|---|---|
| CA1 | Tests de l'API : copie d'une base en cours d'écriture → code 0, dernière ligne = chemin, fichier unique 600 dans un dossier 700, `integrity_check` = `ok`, `journal_mode` = `delete`, contenu identique (R1-R3). |
| CA2 | Tests de l'API : base absente → code 1, aucune base créée ; contrôle ≠ `ok` (simulé) → code 1, aucun fichier final ni temporaire ; argument inconnu → code 1 (R1-R3). |
| CA3 | Tests de l'API : `--nettoyer` supprime une copie de 3 jours et un temporaire ancien, garde la copie du jour, une copie de 1 jour et un fichier d'un autre nom (R4). |
| CA4 | Tests des scripts avec faux `docker`, `age`, `rclone`, `curl` : sauvegarde réussie → un `.db.age` 600, aucun `.db` en clair, `rclone` appelé avec `RCLONE_DEST`, ping de succès, code 0 (R7, R8, R10). |
| CA5 | Même banc : échec à chaque étape (copie, cp, age, rclone) → ping `/fail` avec l'étape, code non nul, aucun clair restant, anciennes copies chiffrées gardées (R7-R9). |
| CA6 | Même banc : chaque refus de réglage de R6, avec les formes commentaire en fin de ligne, valeur vide suivie d'un commentaire, guillemets, variable exportée dans le shell → message nommant la variable, code 1, aucune copie lancée. |
| CA7 | Même banc : ping qui répond `OK (not found)` ou échoue → code non nul (R10) ; verrou déjà pris → code 1 sans ping (R5) ; root refusé. |
| CA8 | Même banc : rétention locale : `.db.age` de 31 jours supprimé, de 29 jours gardé, après un envoi réussi seulement (R9). |
| CA9 | `verif-disque.sh` avec faux `df` : 80 % → succès ; 81 % sur `/` ou sur le dossier Docker → `/fail` avec les valeurs, code 1 ; `docker info` en échec → `/fail` (R11). |
| CA10 | Banc Ubuntu 26.04 réel (dockerd, image api) : `backup.sh` de bout en bout vers un remote rclone local et un faux healthchecks local ; le `.db.age` déchiffré avec la clé privée redonne une base `ok` dont un repère est présent ; le repère est absent des octets du `.db.age` et de `/var/backups/recrutement` (R7, R8). |
| CA11 | Banc : échecs provoqués (disque plein sur `/var/backups/recrutement`, dossier en lecture seule, api arrêtée, écriture concurrente dans l'API pendant la copie), puis relance : chaque relance aboutit ou s'arrête avec un message clair, sans clair restant (règle 5 de la 1.3). |
| CA12 | Banc : `deploy/RESTAURER.md` suivi tel quel (déchiffrement hors du conteneur serveur, envoi par l'entrée standard) → api `healthy`, données de la copie, fichier `node:node` 600, aucun `-wal`/`-shm` de l'ancienne base (R16). |
| CA13 | `systemd-analyze verify` des 4 unités sans remarque ; calendriers vérifiés ; si un conteneur systemd est possible, timers activés et service lancé une fois (R14). |
| CA14 | `prepare-serveur.sh` sans `age` ou sans `rclone` → message R13, code 1, rien modifié (R13). |
| CA15 | `shellcheck` 0.10.0 sans remarque sur les scripts ajoutés ou modifiés ; suites existantes inchangées (verdicts recopiés). |
| CA16 | Docs : `deploy/README.md` (installation, OVH avec cycle de vie, rclone, healthchecks.io, clé), `deploy/RESTAURER.md`, `api/README.md` (méthode, rétention), `.env.example` (R12, R15-R19). |

## Hypothèses et questions ouvertes
- H1 : l'envoi réel vers OVH (identifiants, endpoint `.io`, droits de l'utilisateur S3) n'est pas vérifiable sans compte : il est décrit et fait partie du guide de test humain sur le serveur.
- H2 : le serveur est à l'heure de Paris ; 3 h locales tombent le même jour UTC, donc le nom de la copie porte la date du jour.
