---
type: spec
version: 1.7
iteration: 3
statut: reprise-en-revue
date: 2026-10-27
---

# Spec finale — Sauvegarde chiffrée de la base, hors du serveur, avec alertes

## Changements depuis la version précédente
Spec v2 validée au tour 2 (score 87). Intégré depuis : nettoyage après arrêt sans effet sur une autre exécution (E14) ; restauration « volume intact » sans écraser la copie choisie, repli si la base actuelle est illisible, volume propre après restauration réussie ou non, preuve du ré-effacement (Rs11, S13, Rs12) ; identifiants S3 administrateur jamais sur le serveur (S14) ; preuves du ping de `verif-disque.sh`, de l'arrêt forcé sur le banc systemd, de la lecture seule de l'utilisateur « restauration », gestes manquants du guide (T19, T20, T21, T7).

## Contexte et objectif
La base de l'API (`/data/recrutement.sqlite` dans le volume `recrutement_data`) est la seule copie des dossiers candidat. Après cette version : une copie cohérente et vérifiée est faite chaque nuit, chiffrée pour une clé dont seule la partie publique est sur le serveur, envoyée sur OVH Object Storage par un utilisateur qui ne peut pas effacer ; une sauvegarde ratée ou un disque à plus de 80 % déclenchent une alerte healthchecks.io ; une restauration se fait en suivant `deploy/RESTAURER.md`, sans jamais déchiffrer sur le serveur, y compris après la perte du serveur. Les copies ne gardent un dossier supprimé que pendant une durée maximale écrite.

## Utilisateurs et parcours
Acteurs : l'administrateur du serveur (installe, reçoit les alertes, restaure) ; l'équipe de recrutement (ne voit rien changer ; refait les suppressions après une restauration).

### P1 — Mise en service (une fois)
1. Sur un poste, jamais sur le serveur : `age-keygen` ; clé privée et clé publique au coffre (R17) ; la clé publique va dans `AGE_RECIPIENT`.
2. OVH, région UE : bucket non versionné créé par un utilisateur S3 « administrateur », règle de cycle de vie à 30 jours ; utilisateur « serveur » (écriture sans effacement) et utilisateur « restauration » (lecture seule, au coffre) (R18) ; sur le serveur, `deploy` crée le remote rclone.
3. healthchecks.io : deux contrôles distincts (R15) ; adresses dans `.env`.
4. Administrateur : `apt install age rclone` ; unités installées et timers activés (R14).
5. Essais : `deploy/backup.sh`, puis une minute après `deploy/verif-disque.sh` : les deux contrôles passent au vert ; puis l'essai de bout en bout de R17 (copie récupérée sur OVH depuis un poste avec les identifiants du coffre, déchiffrée, contrôlée).

### P2 — Chaque nuit
`recrutement-backup.timer` lance `deploy/backup.sh` entre 3 h et 3 h 15 ; succès → ping ; tout échec → `/fail` avec l'étape, code non nul. Serveur éteint à 3 h : la sauvegarde part au démarrage suivant, une fois Docker démarré et l'api saine (`Persistent=true`, R14, R7). Rien ne part (timer cassé, serveur mort) : healthchecks.io alerte par absence de ping.

### P3 — Chaque heure
`recrutement-verif-disque.timer` lance `deploy/verif-disque.sh` : au-delà de 80 % sur `/` ou le dossier Docker → `/fail`.

### P4 — Restaurer
Choix de la procédure selon le cas (tableau de R16) ; copie récupérée, déchiffrée et contrôlée sur un poste ; état actuel sauvegardé ; suppressions listées ; copie envoyée par SSH et contrôlée dans le conteneur avant de remplacer ; api redémarrée et vérifiée ; suppressions refaites dans l'interface.

### P5 — Ouvrir une copie sur un poste
Déchiffrer dans un dossier temporaire protégé, ouvrir en lecture seule, tout effacer après usage (R16).

## Périmètre
### Inclus
`api/sauvegarde.js` ; `deploy/backup.sh` ; `deploy/verif-disque.sh` ; `deploy/systemd/recrutement-backup.service`, `.timer`, `recrutement-verif-disque.service`, `.timer` ; `deploy/prepare-serveur.sh` (outils) ; `.env.example` ; `deploy/RESTAURER.md` ; `deploy/README.md` (installation, OVH, utilisateurs S3, healthchecks.io, clé) ; `api/README.md` (méthode et rétention, fiche 1.2-5) ; tests.
### Exclu
Reprend le cadrage : volumes Caddy ; tableaux de bord ; toute modification de l'API hors `api/sauvegarde.js` (en particulier aucune écriture de données hors de l'API : le ré-effacement après restauration passe par l'interface) ; effacement distant par le serveur ; installation automatique d'outils ; création du bucket, des identifiants et des contrôles (gestes documentés) ; sauvegarde du `.env` et de la configuration rclone (leur reconstruction est décrite, R16 « Serveur perdu ») ; modification de `deploy.sh`.

## Existant réutilisé
| Besoin | Décision | Élément |
|---|---|---|
| Chemin de la base | réutiliser | `cheminBase(process.env)`, `ErreurConfig` (`api/src/config.js`) |
| Base occupée | réutiliser | `estOccupee`, `ATTENTE_MS` (`api/src/base.js`) |
| Forme d'une commande | étendre le modèle | `api/equipe.js` : messages en français, code 0/1 |
| Réglages `.env` | réutiliser | `docker compose config --environment` + refus `#…` et valeurs d'exemple (`deploy/deploy.sh` l. 35-52) |
| Style des scripts | réutiliser | `arret`, `info`, `set -euo pipefail`, refus de root, `flock`, corps dans `main` appelé en dernière ligne (`deploy.sh` l. 22) |
| Exclusion du déploiement | réutiliser | verrou `~/.recrutement-deploy.lock` de `deploy.sh` |
| Attente de l'api saine | réutiliser | boucle `docker inspect … Health.Status` de `deploy.sh` l. 120-131 |
| Dossier des copies | réutiliser | `/var/backups/recrutement` 700 (`prepare-serveur.sh`) |
| Copie | créer | `db.backup()` de better-sqlite3, déjà dépendance (V1) ; aucune dépendance npm ajoutée |
| Chiffrement, envoi | créer | `age` 1.2.1, `rclone` 1.60.1, paquets Ubuntu 26.04 (V9) : imposés par le pitch |
| Tests de l'API | étendre | `api/test/equipe.test.js` (commandes en ligne en processus fils) : `api/test` reste à 7 fichiers |
| Banc des scripts | réutiliser | conteneur `ubuntu:26.04` privilégié avec dockerd, et variante avec systemd (V15) |

## Règles et comportements
| # | Règle |
|---|---|
| R1 | `node api/sauvegarde.js` ouvre la base de `cheminBase(process.env)` en lecture seule, sans la créer (base absente → « Base absente : <chemin>. », code 1), et la copie avec `db.backup()` (V1, V5) ; jamais `sqlite3 .backup` ni copie des fichiers (fiche 1.2-5). La connexion est fermée dès la copie faite. |
| R2 | Destination : `<dossier de la base>/sauvegardes/recrutement-AAAA-MM-JJ.db`, date UTC du lancement (en production `/data/sauvegardes/…`). Dossier créé en 700, copie en 600 (masque 077, V1, V5). La copie est écrite sous `recrutement-AAAA-MM-JJ.db.tmp-<pid>`, contrôlée par `PRAGMA integrity_check` (seul `ok` vaut succès, V3), passée en `journal_mode = DELETE` (un seul fichier, V2), puis renommée : le nom final ne désigne jamais une copie non contrôlée. Une copie du même jour est remplacée. |
| R3 | Sortie : messages en français ; sur succès, la dernière ligne de la sortie standard est le chemin absolu de la copie, code 0. Tout échec (base absente, occupée, dossier non inscriptible, disque plein, contrôle ≠ `ok`) : message sur la sortie d'erreur, temporaire supprimé, code 1. Arguments inconnus : usage, code 1. |
| R4 | `--nettoyer` : après une copie réussie seulement, supprime dans le dossier des copies les fichiers `recrutement-AAAA-MM-JJ.db` et `recrutement-AAAA-MM-JJ.db.tmp-<pid>` dont la date de modification a plus de 48 h ; jamais la copie qui vient d'être faite ni un autre fichier. Affiche le nombre supprimé. |
| R5 | `deploy/backup.sh` : tout le corps dans `main`, appelé en dernière ligne ; refuse root ; `umask 077` ; se place dans le dépôt ; verrou propre non bloquant (pris → message, code 1, sans ping : la sauvegarde en cours pingue) ; puis le verrou existant de `deploy.sh` (`~/.recrutement-deploy.lock`), attendu 10 min au plus (sinon `/fail` « déploiement en cours », code 1) ; `deploy.sh` n'est pas modifié. Pendant une sauvegarde, `deploy.sh` répond « un déploiement est déjà en cours » : écrit dans `deploy/README.md`. |
| R6 | Réglages lus par `docker compose config --environment` (V13). Refusés avec un message qui nomme la variable : vide ; commençant par `#` ; égal à sa valeur dans `.env.example` ; `HEALTHCHECK_SAUVEGARDE_URL` ou `HEALTHCHECK_DISQUE_URL` hors `https://` ; les deux adresses égales (refus dans les deux scripts, qui lisent les deux) ; `RCLONE_DEST` sans `:` ; `AGE_RECIPIENT` qui n'est pas une seule clé `age1…` (une clé SSH serait acceptée par age, V18) ou que `age -r … -o /dev/null` refuse (V18). |
| R7 | Enchaînement de `backup.sh` : (1) `docker`, `curl`, `flock` présents, adresses lues et validées (R6) — dès lors tout échec est signalé ; (2) `age`, `rclone` présents, autres réglages validés ; (3) api saine (`Health.Status` = `healthy`, attendu 120 s au plus), puis `docker compose exec -T api node api/sauvegarde.js --nettoyer` ; aucune date n'est calculée par le script : le nom est pris dans la dernière ligne, qui doit correspondre à `^/data/sauvegardes/recrutement-[0-9]{4}-[0-9]{2}-[0-9]{2}\.db$`, sinon échec « copie » ; (4) `docker compose cp` vers `/var/backups/recrutement/recrutement-AAAA-MM-JJ.db` (V6) ; (5) `age -r` vers `recrutement-<horodatage UTC du lancement, AAAA-MM-JJTHHMMSSZ>.db.age.tmp`, contrôle que la première ligne vaut `age-encryption.org/v1` (V8), renommage en `….db.age`, 600 ; un nom par exécution : une relance n'écrase aucune copie, ni en local ni sur OVH ; (6) copie en clair supprimée ; (7) `rclone copy <fichier>.db.age "$RCLONE_DEST"` (V10) ; (8) rétention locale (R9) ; (9) ping de succès. Une étape en échec arrête la suite. |
| R8 | Clair jamais laissé : à toute sortie de `backup.sh` (succès, échec, SIGTERM, SIGINT, SIGHUP), le clair et les temporaires de l'exécution sont supprimés en premier, puis, sauf succès, `/fail` part avec l'étape. Au démarrage, une fois le verrou propre pris, tout `recrutement-*.db` et `recrutement-*.db.age.tmp` laissé dans `/var/backups/recrutement` par une coupure est supprimé. L'unité supprime aussi ces fichiers après tout arrêt, même forcé (R14), sauf si une autre exécution tient le verrou propre (ce sont alors ses fichiers). Un nom de `.db.age` déjà pris → échec, rien n'est écrasé. En régime normal le dossier ne contient que des `.db.age`. |
| R9 | Rétention locale : suppression des `recrutement-*.db.age` dont la date de modification a plus de 30 × 24 h (comparaison en minutes), seulement après un envoi réussi (des sauvegardes en échec n'effacent pas les dernières bonnes). |
| R10 | Ping : `curl`, l'adresse jamais en argument d'un processus (visible dans `ps`, V19), 3 essais de 10 s au plus ; succès vers l'adresse, échec vers `<adresse>/fail`. Corps : un texte fixe par étape (« Sauvegarde réussie », « Échec : <étape> »), le code de sortie et la taille du `.age` ; rien de recopié de la sortie des outils (le détail reste dans le journal). Réussi seulement si la réponse vaut exactement `OK` (V11) ; « (rate limited) » → message dédié. Ping impossible → message, code non nul même si la sauvegarde a réussi. Adresse refusée (R6) → aucun ping, code 1 : healthchecks.io alerte par absence. |
| R11 | `deploy/verif-disque.sh` : corps dans `main`, refuse root, lit et valide les deux adresses (R6) ; mesure `/` et le dossier Docker (`docker info -f '{{.DockerRootDir}}'`, V14) par `df --output=pcent` ; une occupation strictement supérieure à 80 % sur l'un → `/fail` avec les deux valeurs, code 1 ; sinon succès avec les valeurs, code 0. Mesure impossible (Docker ne répond pas, `df` échoue) → `/fail`, code 1. Même ping que R10. |
| R12 | Rétention distante : bucket non versionné, règle de cycle de vie `Expiration` 30 jours (commande et JSON dans `deploy/README.md`, V12) ; le serveur ne peut rien effacer (R18). Durée maximale de présence d'un dossier supprimé dans les copies, depuis sa suppression : volume ≤ 3 jours ; serveur ≤ 31 jours ; OVH ≤ 32 jours (30 jours + application du cycle de vie sous 24 h + une nuit) ; prolongée tant que l'alerte de sauvegarde est rouge. Écrite dans `api/README.md` et la doc produit, avec la limite de R16 (restauration après perte du serveur). |
| R13 | `prepare-serveur.sh` ajoute `age` et `rclone` à sa liste d'outils, avant toute modification ; absent → « « age » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien. », sans rien modifier. |
| R14 | Unités dans `deploy/systemd/` : services `Type=oneshot`, `User=deploy`, `Group=deploy`, `UMask=0077`, `WorkingDirectory=/opt/recrutement`, `Wants=docker.service network-online.target`, `After=docker.service network-online.target`, `ExecStart` du script ; durée maximale (sauvegarde `TimeoutStartSec=1h`, disque 5 min) ; `TimeoutStopSec=90` (plus que les 3 essais de 10 s du ping) ; sauvegarde : `ExecStopPost` qui supprime les fichiers en clair et temporaires de R8. Timers : `OnCalendar=*-*-* 03:00:00` avec `RandomizedDelaySec=15min`, et `OnCalendar=hourly` (V15), `Persistent=true`. Installation par l'administrateur (`deploy/README.md`), commande recopiable : une unité absente est copiée, une unité identique laissée, une unité différente n'est jamais écrasée (différence affichée, arrêt) ; puis timers activés et listés. Une section dit comment mettre à jour une unité après relecture de la différence. |
| R15 | healthchecks.io (`deploy/README.md`) : contrôle « sauvegarde » période 1 jour, grâce 2 h (≥ 15 min de délai aléatoire + 1 h de durée maximale) ; « disque » période 1 h, grâce 30 min ; notification par email à l'équipe. Deux contrôles distincts. Les adresses sont des secrets (`.env`, jamais commitées). |
| R16 | `deploy/RESTAURER.md` couvre, avec des commandes recopiables : **avant de commencer** (outils du poste, poste au disque chiffré, dossier temporaire hors dossiers synchronisés sous masque 077 effacé à la fin même en échec, clé et identifiants « restauration » sortis du coffre dans ce seul dossier) ; **le choix selon le cas** (un dossier → ouvrir une copie et ressaisir, jamais une restauration complète ; base abîmée, volume intact → copie de `/data/sauvegardes` ; volume ou serveur perdu → procédure complète) ; **la procédure** : récupérer (cas « volume intact » : la copie choisie dans `/data/sauvegardes` est d'abord mise de côté dans le volume sous un autre nom et contrôlée, avant toute sauvegarde de l'état actuel, qui la remplacerait) ; avec les identifiants « restauration » et choisir la copie la plus récente antérieure à l'incident ; déchiffrer sur le poste, jamais sur le serveur ; contrôler (`integrity_check` = `ok`, `user_version` = 1, comptes de `candidats`, `equipe`, `journal`, dernière date du journal cohérente avec le nom, empreinte SHA-256 notée) ; si l'api est saine, sauvegarder l'état actuel (restauration réversible, grâce au nom horodaté) ; si la base actuelle est illisible, ni sauvegarde de l'état actuel ni liste : suppressions refaites d'après les demandes reçues, comme pour « Serveur perdu » ; arrêter l'api ; lister toutes les suppressions du journal de la base actuelle, avec de quoi ouvrir chaque dossier dans l'interface, par une commande `node` ponctuelle écrite dans `RESTAURER.md` (pas de `sqlite3` dans l'image, V17 ; aucun code ajouté à `api/`) ; envoyer la copie par SSH dans le volume en tant que `node`, avec empreinte et `integrity_check` vérifiés dans le conteneur avant de remplacer (sinon base actuelle intacte), base, `-wal` et `-shm` remplacés (V7), aucun clair sur le disque de l'hôte ; après la restauration, réussie ou non, le volume ne contient que la base, ses `-wal`/`-shm` et `sauvegardes/` (aucun fichier transféré ou mis de côté) ; redémarrer ; vérifier (saine, mêmes comptes, `check-site.sh`, un dossier connu ouvert) ; faire refaire dans l'interface les suppressions listées et vérifier qu'aucun id listé ne reste dans `candidats` ; effacer le dossier du poste. **Serveur perdu** : ordre de reconstruction (préparation, `.env` recréé, déploiement, remote et unités), puis la procédure sans la sauvegarde de l'état actuel ni la liste des suppressions ; limite écrite : les suppressions faites depuis la copie (au plus une journée) sont à refaire d'après les demandes reçues. **Ouvrir une copie** : récupérer, déchiffrer, contrôler, lecture seule, effacer. |
| R17 | Clé : créée sur un poste, jamais sur le serveur ; clé privée et clé publique au coffre de mots de passe de Yeita, avec les identifiants S3 « restauration » (clé d'accès, secret, endpoint, région, bucket) ; connues d'au moins deux personnes ; contrôle `age-keygen -y` de la clé privée = `AGE_RECIPIENT` ; essai de bout en bout à la mise en service et après tout changement de clé ou d'`AGE_RECIPIENT` (« Ouvrir une copie » sur la dernière copie OVH) ; perte de la clé = copies illisibles, écrit. |
| R18 | OVH : bucket non versionné, région UE (GRA ou SBG), endpoint `.io` ; créé par un utilisateur S3 distinct (le refus implicite ne vaut pas pour le propriétaire, V20) ; utilisateur « serveur » : politique sans `s3:DeleteObject` ni droit sur la politique ou le cycle de vie, droits nécessaires à `rclone copy` seulement (`--s3-no-check-bucket` si besoin) ; utilisateur « restauration » : lecture seule. Remote rclone du serveur créé par `deploy` (`~/.config/rclone/rclone.conf`, 600). Limite connue écrite : l'utilisateur « serveur » peut écraser un objet du même nom ; les noms horodatés (R7) l'évitent en usage normal. Les identifiants de l'utilisateur « administrateur » ne sont jamais posés sur le serveur : utilisés depuis un poste (création du bucket, politiques, cycle de vie, relectures), rangés au coffre. Commandes et politiques JSON dans `deploy/README.md`. |
| R19 | `.env.example` : les 4 variables, commentées, avec des valeurs d'exemple refusées par les deux scripts ; `deploy.sh` ne les exige pas (le site se déploie sans sauvegarde configurée). |
| R20 | Journaux : sortie des scripts dans le journal systemd ; aucune donnée de candidat, aucune adresse de ping, aucune clé, ni dans le journal ni dans les corps de ping. |

## Données
- Contenu d'une copie : toutes les tables (`candidats`, `journal`, `equipe`, `options_disponibilite`) à l'instant de la copie ; un dossier supprimé avant n'y est plus (V4).
- Volumes : base de quelques Ko à quelques Mo (V5) ; jusqu'à 30 copies chiffrées locales et ~31 distantes (plus en cas de relances le même jour).
- Rétention : R4, R9, R12. Restaurer une copie fait revenir les dossiers supprimés depuis sa date : R16 (e), (h) et limite « Serveur perdu ».

## Architecture technique
```mermaid
flowchart LR
  T[recrutement-backup.timer 3 h-3 h 15] --> B[deploy/backup.sh, deploy]
  B -->|api healthy, docker compose exec| S[api : node api/sauvegarde.js --nettoyer]
  S -->|db.backup + integrity_check| C[(/data/sauvegardes, ≤ 3 j)]
  B -->|docker compose cp| H[/var/backups/recrutement]
  H -->|age -r clé publique| E[.db.age horodaté, 30 j]
  E -->|rclone copy, sans droit d'effacement| O[(OVH, région UE, cycle de vie 30 j)]
  B -->|ping OK ou /fail| HC[healthchecks.io]
  TD[recrutement-verif-disque.timer, 1 h] --> D[deploy/verif-disque.sh] --> HC
```
Alternatives écartées par le pitch : `sqlite3 .backup`, `VACUUM INTO`, chiffrement GPG, `rclone sync`.

## Sécurité et conformité
- Clair : volume (la base elle-même) ; hôte seulement le temps du chiffrement (R8, R14) ; poste lors d'une restauration, dans un dossier temporaire effacé (R16).
- Clé et secrets : seule la clé publique est sur le serveur ; identifiants S3 « serveur » et adresses de ping dans des fichiers 600 de `deploy`, jamais en argument d'un processus (R10) ; identifiants « restauration » au coffre.
- `deploy` est dans le groupe `docker` (déjà, v1.1) : aucun droit nouveau sur le serveur.
- Sous-traitants : OVH (copies chiffrées, région UE) ; healthchecks.io (horodatage et textes fixes, aucune donnée personnelle).
- RGPD : durée maximale d'un dossier supprimé dans les copies écrite (R12) ; restauration qui fait refaire les suppressions (R16).

## Déploiement et compatibilité
Rien ne change pour le site ni l'API en service. Installation après merge : `deploy/deploy.sh`, puis P1. Retour arrière : `sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer` ; obligatoire avant un `deploy.sh <commit>` antérieur à la 1.7 (les scripts n'y existent pas) ; retrait complet : les 4 fichiers de `/etc/systemd/system` supprimés, `daemon-reload`. Les scripts n'ont aucun effet hors `/var/backups/recrutement`, `/data/sauvegardes` et le bucket.

## Exploitation
Alertes : R10, R11, R15. Journaux (administrateur) : `sudo systemctl status recrutement-backup`, `sudo journalctl -u recrutement-backup -n 50` ; `deploy` lit la sortie en relançant `deploy/backup.sh` à la main (une minute entre deux essais, R10). Essai à la demande : `sudo systemctl start recrutement-backup`. Un `deploy.sh` lancé pendant une sauvegarde s'arrête sur « un déploiement est déjà en cours » : le relancer après.

## Critères d'acceptation
Banc des scripts : conteneur `ubuntu:26.04` (V-détail), faux outils en tête du `PATH`, lancés en `deploy` sauf le refus de root. Tests de `sauvegarde.js` avec ceux des commandes en ligne de `api/test/` (qui reste à 7 fichiers).

| # | Critère |
|---|---|
| CA1 | Tests de l'API : copie d'une base pendant qu'une autre connexion écrit → code 0, dernière ligne = chemin, fichier unique 600 dans un dossier 700, `integrity_check` = `ok`, `journal_mode` = `delete` ; la copie contient toutes les lignes validées avant le lancement, et au plus celles écrites pendant (R1-R3). |
| CA2 | Tests de l'API : base absente → code 1, aucune base créée ; base source abîmée (pages écrasées comme V3, aucun crochet de test) → code 1, aucun fichier final ni temporaire ; dossier des copies non inscriptible (test en non-root) → code 1 ; argument inconnu → code 1 (R1-R3). |
| CA3 | Tests de l'API : `--nettoyer` supprime une copie et un temporaire datés (`utimes`) de 49 h, garde la copie du jour, une copie de 47 h et un fichier d'un autre nom (R4). |
| CA4 | Banc, faux `docker` (`exec`, `cp`, `inspect`), faux `rclone`, vrai `age` : sauvegarde réussie → un `.db.age` horodaté 600 commençant par `age-encryption.org/v1`, aucun `.db` en clair, `rclone` appelé avec `RCLONE_DEST`, ping de succès, code 0 ; deux exécutions le même jour → deux `.db.age` distincts en local et sur le remote (R7, R8, R10). |
| CA5 | Même banc : échec à chaque étape (api non saine 120 s, copie, dernière ligne inattendue, `cp`, `age`, faux `age` qui recopie le clair, `rclone`) → `/fail` avec l'étape, code non nul, aucun clair restant, anciennes copies chiffrées gardées ; pour le succès et chaque échec, ni repère, ni identifiant de l'adresse de ping, ni `AGE_RECIPIENT` complet dans les corps de ping, la sortie et la sortie d'erreur (R7-R10, R20). |
| CA6 | Même banc, `docker compose config` réel (seuls `exec`, `cp`, `inspect`, `info` simulés) : chaque refus de R6 (vide, `#…`, exemple, `http://`, adresses égales, `RCLONE_DEST` sans `:`, clé SSH, `age1abc`), avec les formes commentaire en fin de ligne, valeur vide suivie d'un commentaire, guillemets, variable exportée dans le shell → message nommant la variable, code 1, aucune copie lancée. |
| CA7 | Même banc : ping qui répond `OK (not found)`, `OK (rate limited)` ou échoue → code non nul ; faux `curl` qui échoue deux fois puis répond `OK` → succès ; toujours en échec → code non nul en moins de 60 s ; l'adresse n'apparaît jamais dans les arguments du faux `curl` ; verrou de sauvegarde pris → code 1 sans ping ; verrou de déploiement tenu plus de 10 min (durée réduite pour le test) → `/fail` ; root refusé (R5, R10). |
| CA8 | Même banc : rétention locale : `.db.age` daté de 30 j + 1 min supprimé, de 30 j − 1 min gardé, seulement après un envoi réussi (R9). |
| CA9 | `verif-disque.sh` : vrai `df` sur le banc → succès avec les valeurs ; faux `df` à 80 % → succès ; à 81 % sur `/` ou sur un dossier Docker distinct → `/fail` avec les valeurs, code 1 ; `df` ou `docker info` en échec → `/fail` ; adresses égales → refus ; pour le succès, le dépassement et la mesure impossible, mêmes preuves de ping que CA7 (adresse absente des arguments, `OK` exact, « not found » → code non nul) et que CA5 (identifiant de l'adresse absent des corps et des sorties) ; root refusé (R6, R10, R11, R20). |
| CA10 | Banc Ubuntu 26.04 réel (dockerd, image api, remote rclone local, faux healthchecks HTTPS en `python3` avec certificat auto-signé et `CURL_CA_BUNDLE`, aucun `-k`) : `backup.sh` de bout en bout ; le `.db.age` déchiffré avec la clé privée redonne une base `ok` qui contient un repère ; le repère est absent des octets du `.db.age`, de `/var/backups/recrutement` et de `/tmp` (R7, R8). |
| CA11 | Banc : échecs provoqués puis relance — disque plein sur `/var/backups/recrutement`, dossier en lecture seule, api arrêtée, api redémarrée pendant la sauvegarde, écriture concurrente dans l'API pendant la copie — chaque relance aboutit ou s'arrête avec un message clair, sans clair restant (règle 5 de la 1.3) ; SIGTERM pendant un `rclone` lent → aucun clair, `/fail` « interrompue », code non nul ; service tué pendant le chiffrement → aucun clair après l'arrêt ; clair d'une coupure précédente supprimé au lancement ; sur le banc systemd : arrêt forcé (SIGKILL) pendant le chiffrement → aucun clair après l'arrêt ; durée maximale réduite et dépassée pendant un envoi lent → `/fail` « interrompue », aucun clair ; sauvegarde manuelle ralentie et unité lancée pendant ce temps → l'unité sort en code 1 sans ping, la sauvegarde manuelle aboutit avec son `.db.age` (R8, R14). |
| CA12 | Banc : `deploy/RESTAURER.md` suivi tel quel, côté « poste » dans un autre conteneur : remplacement d'une base existante → `healthy`, comptes égaux à (c), fichier `node:node` 600, pas de `-wal`/`-shm` de l'ancienne base ; un dossier supprimé après la copie figure dans la liste (e) ; transfert tronqué → base d'origine intacte ; second cas « volume neuf » (copie récupérée par le remote du « poste ») ; aucun repère hors du volume côté serveur ; cas « volume intact » avec api saine → la base restaurée a les comptes de la copie choisie, pas ceux de l'état actuel ; après chaque cas, réussi ou non (transfert tronqué, contrôle faux), `/data` ne contient que la base, `-wal`, `-shm` et `sauvegardes/` ; le dossier listé, supprimé dans l'interface, n'est plus dans `candidats` (R16). |
| CA13 | Banc systemd (V15) : `systemd-analyze verify` des 4 unités sans remarque ; commandes d'installation de `deploy/README.md` recopiées : première fois → copiées et timers actifs ; seconde fois identique → rien ; unité modifiée → `diff` et arrêt ; `systemctl start recrutement-backup` aboutit (R14). |
| CA14 | `prepare-serveur.sh` sans `age` ou sans `rclone` → message R13, code 1, rien modifié (R13). |
| CA15 | `shellcheck` 0.10.0 sans remarque sur les scripts ajoutés ou modifiés ; `prepare-serveur.sh` avec `age` et `rclone` aboutit puis se relance ; `deploy.sh` avec un `.env` sans les 4 variables aboutit ; suites existantes inchangées (verdicts recopiés) (R13, R19). |
| CA16 | Docs : `deploy/README.md` (installation des unités et mise à jour, OVH avec cycle de vie et politiques, rclone, healthchecks.io, clé, retour arrière), `deploy/RESTAURER.md`, `api/README.md` (méthode, rétention maximale, limite), `.env.example` (R12, R14-R19). |
| CA17 | Fusionné dans CA11. |
| CA18 | Fusionné dans CA5 (et vaut pour CA10). |
| CA19 | Guide de test humain sur le serveur, chaque geste avec sa commande, le résultat attendu et quoi faire sinon : `curl` vers l'adresse affiche exactement `OK` ; `deploy/backup.sh` passe le contrôle au vert ; `deploy/verif-disque.sh` passe le contrôle disque au vert ; `rclone lsl "$RCLONE_DEST"` montre le `.db.age` ; depuis un poste, avec l'utilisateur « administrateur », `get-bucket-lifecycle-configuration` relit la règle de 30 jours ; sur le serveur, `rclone deletefile` sur l'objet est refusé (H3) et aucun fichier d'identifiants S3 autre que `rclone.conf` n'est dans le dossier de `deploy` ; depuis un poste, avec l'utilisateur « restauration », `rclone lsl` liste les copies, `rclone copyto` vers le bucket et `rclone deletefile` sont refusés (H3) ; essai de bout en bout de R17 ; `/fail` passe au rouge (email reçu) puis une sauvegarde remet au vert ; `systemctl list-timers 'recrutement-*'` ; le lendemain, `sudo journalctl -u recrutement-backup` montre la sauvegarde de la nuit sans adresse de ping. |
| CA20 | Fusionné dans CA4. |
| CA21 | Retiré : les mutations des gardes relèvent du plan de QA et des fiches de tâches (règles 1.2-3 et 1.3-4). |

## Hypothèses et questions ouvertes
- H1 : l'envoi réel vers OVH (identifiants, endpoint `.io`) n'est pas vérifiable sans compte : prouvé par CA19.
- H3 : une politique sans `s3:DeleteObject` (utilisateur « serveur ») ou en lecture seule (« restauration ») sur un utilisateur non propriétaire refuse bien ce qu'elle doit refuser et laisse `rclone copy` ou la lecture fonctionner (V20, doc seulement) : prouvé par CA19.

## Reprise du 2026-10-28 (décisions de l'utilisateur)
Les règles ci-dessous **remplacent** celles de même numéro et s'ajoutent aux autres ; R12, R15 et R18 sont **retirées** (OVH Object Storage, healthchecks.io).

### Règles modifiées
| # | Règle |
|---|---|
| R6 | Réglage lu par `docker compose config --environment` : seule `AGE_RECIPIENT` ; refusée si vide, commençant par `#`, égale à `.env.example`, pas une seule clé `age1…`, ou refusée par `age -r … -o /dev/null`. |
| R7 | Enchaînement de `backup.sh` : outils (`docker`, `age`, `flock`) ; réglage ; dossier 700 ; nettoyage du clair d'une coupure ; verrou de `deploy.sh` (10 min) ; api saine (120 s) ; `sauvegarde.js --nettoyer` (nom pris dans la dernière ligne) ; `docker compose cp` ; `age` vers `recrutement-<horodatage UTC>.db.age`, en-tête contrôlé, nom déjà pris → échec ; clair supprimé ; rétention locale 30 jours ; état écrit (R21). Une étape en échec arrête la suite, écrit l'état « échec » avec l'étape (si Docker répond) et sort en code 1. |
| R9 | Rétention locale : `recrutement-*.db.age` de plus de 30 × 24 h supprimés, seulement après une sauvegarde réussie. |
| R10 | Plus de signalement externe : le résultat est le code de sortie, le journal systemd et l'état de R21. |
| R11 | `verif-disque.sh` : mesure `/` et le dossier Docker ; écrit l'état du disque (R21) ; code 1 au-delà de 80 % ou si la mesure échoue. |
| R13 | `prepare-serveur.sh` exige `age` (plus `rclone`) ; message « « age » est absent. Installez-le vous-même (apt install age) ; ce script n'installe rien. ». |
| R16 | `deploy/RESTAURER.md` : récupération depuis `/var/backups/recrutement` (ou `/data/sauvegardes` si le volume est intact) seulement ; la section « Serveur perdu » devient une mise en garde (sauvegardes perdues avec lui) ; le reste inchangé (déchiffrement sur le poste, contrôles, empreinte, suppressions refaites, poste effacé). |
| R17 | Clé : créée sur un poste, jamais sur le serveur ; pour l'instant la clé privée est un fichier `.txt` partagé par l'utilisateur (coffre interne plus tard) ; page dédiée R25. |
| R19 | `.env.example` : la seule `AGE_RECIPIENT`, commentée, valeur d'exemple refusée ; `deploy.sh` ne la lit pas. |
| R12 (rétention) | Remplacée : durée maximale d'un dossier supprimé dans les copies : 3 jours dans le volume, 31 jours sur le serveur, plus tant que les sauvegardes échouent. |

### Règles ajoutées
| # | Règle |
|---|---|
| R21 | État des sauvegardes : `backup.sh` écrit à chaque passage, dans le volume de l'api (`/data/etat/`, 700, fichiers 600, propriétaire `node`), `sauvegarde-derniere.json` (date, résultat `reussie`/`echec`, étape en cas d'échec, nom et taille du fichier chiffré en cas de succès, nombre de copies locales) et, sur succès seulement, `sauvegarde-reussie.json` ; `verif-disque.sh` écrit `disque.json` (date, occupation de `/` et du dossier Docker, seuil, résultat). Écriture par `docker compose run --rm --no-deps -T api` (fonctionne api arrêtée), sous un nom temporaire puis renommé ; aucune donnée de candidat. Si Docker ne répond pas, rien n'est écrit (le site est alors hors service lui aussi). |
| R22 | `GET /api/sauvegardes` : réservé au rôle `admin` (sinon 403 `admin-requis`, « Réservé aux admins de l'équipe. ») ; rend `{maintenant, sauvegarde: {derniere, reussie, en_retard}, disque: {..., en_retard}}` ; `en_retard` vaut vrai si la dernière sauvegarde réussie a plus de 26 h ou n'existe pas, et pour le disque si la dernière mesure a plus de 2 h ou n'existe pas ; un fichier absent → `null`, illisible → `null` et `illisible: true`. Aucune autre route ne change. |
| R23 | Page `admin/sauvegardes.html` (publiée par `tools/build.py`, protégée par oauth2-proxy sans réglage nouveau) : sans lien depuis Candidatures ; affiche en clair la dernière sauvegarde réussie, la dernière tentative (et son étape si échec), le nombre de copies, l'occupation des disques, un verdict vert/rouge ; messages pour : chargement, compte non admin, hors équipe, API absente, erreur réseau. Mise en forme `assets/yeita.css`. |
| R24 | `tools/check-site.sh` : 7e contrôle, `/admin/sauvegardes.html` → 302 vers Google sans session. |
| R25 | Page `deploy/CLE-SAUVEGARDE.md` : créer la clé sur le Mac, ranger et partager le fichier `.txt` (avec qui, comment, précautions), mettre la clé publique dans `.env`, essai de déchiffrement, perte et changement de clé. Commandes recopiables, testées sous zsh. |
| R26 | Page `deploy/METTRE-A-JOUR.md` : mettre à jour le site en production à la main (avant, pendant, contrôle, retour arrière, gestes propres à une version comme la 1.7 : `age`, unités, `.env`), autonome, sans renvoi nécessaire pour les gestes courants. |
| R27 | Guide de test humain réécrit : uniquement des étapes à lire et suivre, cases à cocher, « Tu dois voir » / « Sinon », aucun renvoi. |

### Critères d'acceptation de la reprise
| # | Critère |
|---|---|
| CA22 | Tests de l'API : `GET /api/sauvegardes` → 200 pour un admin avec les états lus ; 403 `admin-requis` pour recruteur et lecture ; 403 `hors-equipe`, 401 sans identité ; fichiers absents → `null` et `en_retard: true` ; JSON illisible → `illisible: true` ; seuils 26 h et 2 h (R22). |
| CA23 | Lanceur des scripts : succès → `sauvegarde-derniere.json` `reussie` et `sauvegarde-reussie.json` ; chaque échec → `echec` avec l'étape, `sauvegarde-reussie.json` inchangé ; `disque.json` écrit dans les trois cas de `verif-disque.sh` ; plus aucun appel à `rclone` ni à `curl` (R7, R11, R21). |
| CA24 | Banc systemd : `backup.sh` et `verif-disque.sh` réels écrivent l'état dans le volume ; la route le rend ; fichiers `node` 600 dans `/data/etat` 700 (R21, R22). |
| CA25 | Page : rendue dans un navigateur de test contre l'API locale (admin, recruteur, API absente) ; textes de R23 (R23). |
| CA26 | `check-site.sh` a 7 contrôles ; `/admin/sauvegardes.html` publié par `tools/build.py` (R23, R24). |
| CA27 | Pages R25, R26 et guide R27 écrits ; commandes destinées au Mac passées à `zsh -n` et les lignes interactives essayées sous zsh (R25-R27). |
| CA4 à CA9, CA10, CA12, CA14, CA19 | Repris sans rclone ni healthchecks.io (envoi distant, pings, remote, comptes S3 retirés des critères). |
