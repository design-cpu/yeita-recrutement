---
type: spec
version: 1.7
iteration: 4
statut: validee
date: 2026-10-28
---

# Spec finale — Sauvegarde chiffrée de la base chaque nuit, sur le serveur, avec page d'état

## Changements depuis la version précédente
Reprise du 2026-10-28, décidée par l'utilisateur (`version.md`) : OVH Object Storage (payant), rclone, le client `aws` et healthchecks.io sont **retirés** ; les copies restent **sur le serveur** ; ajout d'une **page d'état réservée aux admins** (`/admin/sauvegardes.html`), d'une page sur la **clé de sauvegarde** et d'une page **mettre à jour le site en production** ; guide de test réécrit pour être suivi sans réfléchir. La spec validée au tour 2 (score 87) est gardée dans `spec-avant-reprise.md` ; cette version la remplace entièrement et intègre la relecture de la reprise (`challenges/revue-reprise.md`). Les identifiants de règles et de critères sont gardés ; R10, R12, R15, R18 changent de sens ou sont retirées.

## Contexte et objectif
La base de l'API (`/data/recrutement.sqlite`, volume `recrutement_data`) est la seule copie des dossiers candidat. Après cette version : une copie cohérente et vérifiée est faite chaque nuit, chiffrée pour une clé dont seule la partie publique est sur le serveur, et gardée 30 jours sur le serveur ; un admin voit d'un coup d'œil, sur une page protégée, si la dernière sauvegarde a réussi et si les disques se remplissent ; une restauration se fait en suivant `deploy/RESTAURER.md`, sans jamais déchiffrer sur le serveur. Accepté par l'utilisateur : **la perte du serveur emporte aussi les sauvegardes** ; **aucune alerte n'est envoyée** (vérification à la main, emails dans une évolution ultérieure).

## Utilisateurs et parcours
Acteurs : l'administrateur du serveur (installe, vérifie, restaure) ; les membres au rôle `admin` de l'équipe (consultent la page d'état) ; l'équipe de recrutement (ne voit rien changer ; refait les suppressions après une restauration).

### P1 — Mise en service (une fois)
1. Sur un Mac : créer la clé (`deploy/CLE-SAUVEGARDE.md`) ; la clé privée est un fichier `.txt` gardé et partagé par l'utilisateur, jamais sur le serveur ; la clé publique va dans `AGE_RECIPIENT`.
2. Mettre à jour le site (`deploy/METTRE-A-JOUR.md`), installer `age`, installer les unités, faire une sauvegarde à la main, ouvrir la page d'état.
### P2 — Chaque nuit
`recrutement-backup.timer` lance `deploy/backup.sh` entre 3 h et 3 h 15 ; le résultat (réussite, ou échec et son étape) est écrit dans l'état des sauvegardes. Serveur éteint à 3 h : la sauvegarde part au démarrage suivant (`Persistent=true`).
### P3 — Chaque heure
`recrutement-verif-disque.timer` lance `deploy/verif-disque.sh` : l'occupation de `/` et du dossier Docker est écrite dans l'état.
### P4 — Consulter l'état
Un admin connecté ouvre `https://recrutement.yeita.fr/admin/sauvegardes.html` : un verdict vert ou rouge, la dernière sauvegarde réussie, la dernière tentative, le nombre de copies, l'occupation des disques, et chaque motif de rouge en clair.
### P5 — Restaurer, ou ouvrir une copie
Selon le cas (tableau de `RESTAURER.md`) : copie récupérée du serveur, déchiffrée et contrôlée sur un Mac, renvoyée par SSH et contrôlée dans le conteneur avant de remplacer la base ; suppressions refaites dans l'interface.

## Périmètre
### Inclus
`api/sauvegarde.js` ; route en lecture `GET /api/sauvegardes` (`api/src/sauvegardes.js`) ; `admin/sauvegardes.html` ; `deploy/backup.sh` ; `deploy/verif-disque.sh` ; `deploy/commun.sh` ; les 4 unités de `deploy/systemd/` ; `deploy/prepare-serveur.sh` (outil `age`) ; `.env.example` ; `tools/check-site.sh` (7e contrôle) ; `deploy/RESTAURER.md`, `deploy/CLE-SAUVEGARDE.md`, `deploy/METTRE-A-JOUR.md` ; `deploy/README.md`, `api/README.md` ; tests.
### Exclu
Volumes Caddy ; tableau de bord d'administration (seule la page des sauvegardes est faite sous `/admin/`) ; envoi d'alertes (email : évolution ultérieure) ; copie hors du serveur ; toute modification de l'API hors `api/sauvegarde.js` et de la route en lecture `GET /api/sauvegardes` ; installation automatique d'outils ; modification de `deploy/deploy.sh` ; coffre de mots de passe (plus tard).

## Existant réutilisé
| Besoin | Décision | Élément |
|---|---|---|
| Chemin de la base | réutiliser | `cheminBase` (`api/src/config.js`) ; la route lit le dossier par `path.dirname(db.name)` (elle reçoit `(app, db)`, sans la configuration) |
| Autorisation | réutiliser | crochet `onRequest` de `api/src/app.js` (identité, équipe, rôle `lecture` limité à `GET`) ; contrôle du rôle `admin` dans la route |
| Forme des routes et des erreurs | réutiliser | `routesApi`, `ErreurHttp(statut, message, code)` |
| Réglages `.env` | réutiliser | `docker compose config --environment` + refus `#…` et valeur d'exemple |
| Style des scripts | réutiliser | `arret`, `info`, `set -euo pipefail`, refus de root, `flock`, corps dans `main` |
| Mise en forme de la page | réutiliser | `assets/yeita.css` (`wrap`, `topbar`, `btn`) |
| Copie | créer | `db.backup()` de better-sqlite3 (V1), aucune dépendance npm ajoutée |
| Chiffrement | créer | `age` 1.2.1, paquet Ubuntu 26.04 (V9) : imposé par le pitch, gardé par l'utilisateur |
| Tests | étendre | `api/test/equipe.test.js` (commandes), `api/test/api.test.js` (route) : `api/test` reste à 7 fichiers ; `tools/test-sauvegarde.sh` |

## Règles et comportements
| # | Règle |
|---|---|
| R1 | `node api/sauvegarde.js` ouvre la base de `cheminBase(process.env)` en lecture seule, sans la créer (base absente → « Base absente : <chemin>. », code 1), et la copie avec `db.backup()` ; jamais `sqlite3 .backup` ni copie des fichiers (fiche 1.2-5). |
| R2 | Destination `<dossier de la base>/sauvegardes/recrutement-AAAA-MM-JJ.db` (date UTC), dossier 700, copie 600 ; écrite sous `….tmp-<pid>`, contrôlée par `integrity_check` (seul `ok`), passée en `journal_mode = DELETE`, puis renommée. |
| R3 | Succès : dernière ligne de sortie = chemin absolu de la copie, code 0 ; échec : message, temporaire supprimé, code 1 ; argument inconnu : usage, code 1. |
| R4 | `--nettoyer` : après une copie réussie, supprime les copies et temporaires de plus de 48 h (date de modification), jamais la copie faite ni un autre fichier. |
| R5 | `backup.sh` : corps dans `main` ; refuse root ; `umask 077` ; dossier des copies absent ou non inscriptible → état `echec` « dossier des copies » écrit, code 1 ; verrou propre non bloquant (`/var/backups/recrutement/.backup.lock`) **pris → message, code 1, aucun état écrit** (l'autre sauvegarde l'écrira) ; puis verrou de `deploy.sh` attendu 10 min. |
| R6 | Réglage lu par `docker compose config --environment` : seule `AGE_RECIPIENT` ; refusée si vide, commençant par `#`, égale à `.env.example`, pas une seule clé `age1…`, ou refusée par `age -r … -o /dev/null`. |
| R7 | Enchaînement : outils (`docker`, `age`) ; réglage ; dossier 700 ; nettoyage du clair d'une coupure ; verrou de `deploy.sh` ; api saine (120 s) ; `sauvegarde.js --nettoyer`, nom pris dans la dernière ligne (motif) ; `docker compose cp` ; `age` vers `recrutement-<horodatage UTC>.db.age`, en-tête contrôlé, nom déjà pris → échec sans rien écraser ; clair supprimé ; rétention (R9) ; état écrit (R21). Une étape en échec arrête la suite. |
| R8 | Clair jamais laissé : à toute sortie (succès, échec, SIGTERM, SIGINT, SIGHUP), le clair et les temporaires sont supprimés en premier ; puis, sauf succès, l'état `echec` est écrit avec l'étape et le code (R21). Au démarrage, verrou tenu, tout clair ou temporaire laissé par une coupure est supprimé ; après tout arrêt de l'unité, même forcé, `ExecStopPost` le supprime aussi, sauf si une autre exécution tient le verrou. |
| R9 | Rétention : `recrutement-*.db.age` de plus de 30 × 24 h supprimés, seulement après une sauvegarde réussie. |
| R10 | Aucun signalement externe : le résultat est le code de sortie, le journal systemd et l'état (R21). Sauvegarde faite mais état non écrit → « la sauvegarde est faite (…), mais l'état des sauvegardes n'a pas pu être écrit. », code 1. |
| R11 | `verif-disque.sh` : refuse root ; mesure `/` et `docker info -f '{{.DockerRootDir}}'` par `df --output=pcent` ; écrit `disque.json` (`normal`, `plein` au-delà de 80 %, ou `mesure-impossible`) ; code 1 si plein ou mesure impossible ; Docker ne répond pas → message, code 1, rien n'est écrit. |
| R12 | Rétention et effacement : un dossier supprimé reste au plus 3 jours dans le volume (`/data/sauvegardes`) et 31 jours dans les copies chiffrées du serveur, plus tant que les sauvegardes échouent ; écrit dans `api/README.md` et la doc produit. |
| R13 | `prepare-serveur.sh` exige `age` avant toute modification : « « age » est absent. Installez-le vous-même (apt install age) ; ce script n'installe rien. ». |
| R14 | Unités : `Type=oneshot`, `User=deploy`, `Group=deploy`, `UMask=0077`, `WorkingDirectory=/opt/recrutement`, `After=docker.service` (sans jamais démarrer Docker) ; `TimeoutStartSec` 1 h (sauvegarde) et 5 min (disque) ; `TimeoutStopSec=90` (le temps d'écrire l'état par un conteneur jetable) ; sauvegarde : `ExecStopPost` sous `flock -n` ; timers `*-*-* 03:00:00` + `RandomizedDelaySec=15min` et `hourly`, `Persistent=true`. Installation par l'administrateur : unité absente copiée, identique laissée, différente jamais écrasée. |
| R16 | `deploy/RESTAURER.md` : tableau des cas ; poste protégé (dossier temporaire hors synchronisation, `umask 077`, effacé à la fin) ; récupération par `scp` depuis `/var/backups/recrutement` (ou copie de `/data/sauvegardes` si le volume est intact) ; déchiffrement sur le Mac seulement ; contrôles (`integrity_check`, `user_version` = 1, comptes, empreinte) ; état actuel sauvegardé avant ; suppressions listées ; remplacement après empreinte et contrôle dans le conteneur ; vérifications ; suppressions refaites ; poste effacé. Après la restauration, le volume ne contient que la base, ses `-wal`/`-shm`, `sauvegardes/` et `etat/` (la restauration ne touche pas à `etat/`). Mise en garde : serveur perdu = sauvegardes perdues. Commandes testées sous zsh. |
| R17 | Clé : créée sur un Mac, jamais sur le serveur ; pour l'instant un fichier `.txt` gardé et partagé par l'utilisateur (coffre interne plus tard) ; perte = copies illisibles ; page R25. |
| R19 | `.env.example` : seule `AGE_RECIPIENT`, commentée, valeur d'exemple refusée ; `deploy.sh` ne la lit pas. |
| R20 | Journaux et état : aucune donnée de candidat, aucune clé. |
| R21 | État des sauvegardes dans le volume de l'api, `/data/etat/` (700, fichiers 600, `node`) : `sauvegarde-derniere.json` à chaque passage (`le`, `resultat` `reussie` ou `echec`, `etape` et `code` en échec, `fichier`, `taille`, `copies` en succès) ; `sauvegarde-reussie.json` sur succès seulement ; `disque.json` (`le`, `resultat`, `racine`, `docker`, `seuil`). Écriture par `docker compose run --rm --no-deps -T api` (fonctionne api arrêtée), nom temporaire puis renommage ; textes fixes, dates et nombres seulement. Rien n'est écrit si Docker ne répond pas ou si Compose ne peut pas lire `.env` : la page passera alors « en retard ». |
| R22 | `GET /api/sauvegardes` (`api/src/sauvegardes.js`, ajouté à `routesApi`) : rôle `admin` seulement, sinon 403 `admin-requis` « Réservé aux admins de l'équipe. » (après les refus existants : 401, 403 `hors-equipe`). Réponse : `{maintenant, sauvegarde: {derniere, reussie, en_retard}, disque: {mesure, en_retard}}` ; `derniere`, `reussie`, `mesure` valent l'objet lu, `null` si le fichier est absent, `{illisible: true}` s'il n'est pas un objet JSON ; `sauvegarde.en_retard` vrai si `reussie.le` manque, est invalide ou a plus de 26 h ; `disque.en_retard` de même avec 2 h. Aucune autre route ne change. |
| R23 | Page `admin/sauvegardes.html`, publiée par `tools/build.py`, protégée par oauth2-proxy sans réglage nouveau, sans lien depuis Candidatures. **Verdict rouge** si l'un : sauvegarde en retard, dernière tentative `echec`, un fichier illisible, disque en retard, résultat du disque autre que `normal` ; **vert** sinon. Chaque motif de rouge est une phrase en clair. Affiche aussi : dernière réussite (date en heure de Paris, fichier, taille), dernière tentative (date, résultat, étape), nombre de copies, occupation des deux disques, et les commandes du serveur pour en savoir plus. Messages : chargement ; 401 « Session expirée : recharge la page pour te reconnecter. » ; 403 `admin-requis` « Réservé aux admins de l'équipe. » ; 403 `hors-equipe` « Tu ne fais pas partie de l'équipe. » ; 404 ou réponse non JSON « État indisponible ici : ce site n'a pas l'API. » ; réseau « Le serveur ne répond pas. Réessaie dans un instant. ». Contenu inséré comme texte (jamais en HTML). |
| R24 | `tools/check-site.sh` : 7e contrôle `/admin/sauvegardes.html` → 302 vers Google sans session. |
| R25 | `deploy/CLE-SAUVEGARDE.md` : créer la clé sur le Mac, garder et partager le `.txt` (avec qui, comment, ce qu'il ne faut pas faire), mettre la clé publique dans `.env`, contrôler la clé, essai de déchiffrement, perte, changement de clé ; commandes testées sous zsh. |
| R26 | `deploy/METTRE-A-JOUR.md` : mettre à jour le site en production à la main — avant (ce qui est mergé, prévenir l'équipe), pendant (`deploy.sh` dans un nouveau terminal, ce qu'il affiche), contrôle (site, API, page d'état), retour arrière, et une section par version qui demande des gestes en plus (1.7 : `age`, `AGE_RECIPIENT`, unités, rôle admin, adresse de la page) ; autonome. |
| R27 | Guide de test humain réécrit : étapes à lire et suivre, cases à cocher, « Tu dois voir » / « Sinon », aucun renvoi. |
R15 et R18 sont retirées (healthchecks.io, OVH Object Storage).

## Données
- Copie : toutes les tables à l'instant de la copie ; un dossier supprimé avant n'y est plus (V4).
- État : trois petits fichiers JSON sans donnée de candidat (R21).
- Volumes : base de quelques Ko à quelques Mo ; jusqu'à 30 copies chiffrées (plus en cas de relances).
- Rétention : R4, R9, R12.

## Architecture technique
```mermaid
flowchart LR
  T[recrutement-backup.timer 3 h-3 h 15] --> B[deploy/backup.sh, deploy]
  B -->|api saine, exec| S[api : node api/sauvegarde.js --nettoyer]
  S --> C[(/data/sauvegardes, ≤ 3 j)]
  B -->|docker compose cp| H[/var/backups/recrutement]
  H -->|age -r clé publique| E[.db.age horodaté, 30 j]
  B -->|docker compose run| ET[(/data/etat)]
  TD[recrutement-verif-disque.timer, 1 h] --> D[deploy/verif-disque.sh] --> ET
  ET --> R[GET /api/sauvegardes, admin] --> P[/admin/sauvegardes.html]
```

## Sécurité et conformité
- Clair : volume (la base elle-même) ; hôte le temps du chiffrement (R8) ; Mac lors d'une restauration, dans un dossier temporaire effacé.
- Clé : seule la clé publique sur le serveur ; la clé privée en fichier `.txt`, à garder hors des dossiers synchronisés et à partager par un moyen privé (R25).
- Page d'état : protégée par oauth2-proxy, données servies seulement au rôle `admin` ; aucune donnée de candidat.
- Aucun sous-traitant nouveau.

## Déploiement et compatibilité
Mise à jour par `deploy/METTRE-A-JOUR.md`. Retour arrière : arrêter les timers avant un retour à un commit antérieur à la 1.7 ; la route et la page disparaissent avec lui.

## Exploitation
Vérifier : la page d'état ; en `ubuntu` `sudo journalctl -u recrutement-backup -n 50` et `systemctl list-timers 'recrutement-*'` ; en `deploy` `ls -l /var/backups/recrutement`. Maintenance de Docker : arrêter les timers avant.

## Critères d'acceptation
| # | Critère |
|---|---|
| CA1 à CA3 | Tests de l'API pour `sauvegarde.js` (inchangés). |
| CA4 | Lanceur à faux outils : sauvegarde réussie → un `.db.age` horodaté 600 chiffré, aucun clair, état `reussie` (`sauvegarde-derniere.json` et `sauvegarde-reussie.json`), code 0 ; deux exécutions → deux `.db.age`. |
| CA5 | Échec à chaque étape (api non saine, copie, dernière ligne, `cp`, `age`, faux `age` qui recopie le clair, dossier en 750) → état `echec` avec l'étape, `sauvegarde-reussie.json` inchangé, code 1, aucun clair, anciennes copies gardées ; rien de secret ni de personnel dans la sortie et l'état. |
| CA6 | Refus de `AGE_RECIPIENT` avec le vrai `docker compose config` (vide, `#…`, exemple, guillemets, variable exportée, clé SSH, `age1abc`) → message, code 1, aucune copie. |
| CA7 | Verrou propre pris → code 1, **aucun état écrit** ; verrou de déploiement tenu → état `echec` ; root refusé ; durées d'attente invalides refusées. |
| CA8 | Rétention : 30 j + 1 min supprimée, 30 j − 1 min gardée, seulement après une sauvegarde réussie. |
| CA9 | `verif-disque.sh` : `normal` à 80 %, `plein` à 81 % sur `/` ou le dossier Docker (code 1), `mesure-impossible` si `df` échoue (code 1), rien d'écrit si Docker ne répond pas (code 1), root refusé. |
| CA10 | Banc systemd réel : sauvegarde de bout en bout ; copie déchiffrée `ok` avec un repère ; repère absent du `.db.age` et du disque hors volume. |
| CA11 | Banc : disque plein, lecture seule, api arrêtée, écritures concurrentes, SIGKILL pendant le chiffrement, durée dépassée, sauvegarde manuelle pendant l'unité ; aucun clair, relance qui aboutit. |
| CA12 | `RESTAURER.md` suivi tel quel sur le banc : base existante, volume intact, volume neuf ; transfert tronqué refusé ; volume propre (base, `-wal`, `-shm`, `sauvegardes/`, `etat/`) ; suppressions refaites. |
| CA13 | Unités : `systemd-analyze verify` sans remarque ; installation à trois issues. |
| CA14 | `prepare-serveur.sh` sans `age` → message R13, rien modifié. |
| CA15 | shellcheck sans remarque ; suites existantes inchangées (verdicts recopiés). |
| CA16 | `deploy/README.md` (installation, mise à jour des unités, `age`, page d'état, retour arrière, maintenance de Docker), `RESTAURER.md`, `CLE-SAUVEGARDE.md`, `METTRE-A-JOUR.md`, `api/README.md`, `.env.example` à jour ; `grep -ri 'rclone\|healthchecks\|RCLONE_DEST\|HEALTHCHECK_\|awscli\|aws s3api' deploy .env.example api/README.md tools README.md` ne trouve rien. |
| CA19 | Guide de test humain (R27), parties poste et serveur. |
| CA22 | Tests de l'API : route réservée aux admins (recruteur, lecture → 403 `admin-requis` ; hors équipe → `hors-equipe` ; sans identité → 401) ; fichiers absents → `null`, en retard ; seuils 26 h et 2 h ; date invalide ; fichier illisible → `{illisible: true}`. |
| CA23 | Lanceur : l'état écrit dans les cas de CA4, CA5, CA7, CA9 ; plus aucun appel à `rclone` ni `curl`. |
| CA24 | Banc systemd : `backup.sh` et `verif-disque.sh` réels écrivent l'état (`node` 600 dans `/data/etat` 700), la route le rend ; `verif-disque.sh` lancé pendant une sauvegarde ne la gêne pas. |
| CA25 | Page rendue dans un navigateur de test contre l'API locale : admin vert, admin rouge (chaque motif), recruteur, session expirée, API absente. |
| CA26 | `check-site.sh` a 7 contrôles ; `admin/sauvegardes.html` publié par `tools/build.py`. |
| CA27 | Pages R25, R26 et guide R27 : blocs du Mac passés à `zsh -n`, lignes interactives essayées sous zsh. |

## Hypothèses et questions ouvertes
- Aucune.
