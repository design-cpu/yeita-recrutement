---
type: revue-doc
version: 1.7
bloquants: 0
majeurs: 3
mineurs: 11
statut: a-corriger
date: 2026-10-27
---

# Revue de la documentation — version 1.7

> Rédacteur-relecteur indépendant, sur les 7 pages sources touchées (`git diff main...HEAD -- hlyja/technique hlyja/doc hlyja/glossaire.md`), contre le code au commit `26c1d9f` (aucun commit de code depuis : `git log 26c1d9f..HEAD` ne touche que `hlyja/`). **Verdict : accepté avec réserves.** Deux majeurs à corriger dans les sources (ordre d'installation d'age et rclone dans `deploiement-ovh.md`, compte de tests périmé dans `api.md`), un majeur dans `deploy/RESTAURER.md` (commandes `read -p` qui échouent sous zsh, le shell par défaut de macOS) ; le reste est mineur. Les vues humaines des 6 pages sont écrites à partir du code quand la source s'en écarte (voir « Vues humaines »).

## Méthode
- Valeurs relevées par commande : `api/sauvegarde.js` (motifs, 48 h, masque, journal `DELETE`, dernière ligne), `deploy/backup.sh` (attentes 600 s / 120 s, 30 jours = 43 200 min, verrous, en-tête `age-encryption.org/v1`, motif de la dernière ligne), `deploy/healthchecks.sh`, `deploy/verif-disque.sh` (seuil 80), unités `deploy/systemd/*` (`OnCalendar`, `RandomizedDelaySec=15min`, `Persistent`, `TimeoutStartSec` 1h / 5min, `TimeoutStopSec=90`, `ExecStopPost`), `deploy/prepare-serveur.sh` (boucle `age rclone`, ligne « Serveur prêt » l. 167), `.env.example` (4 variables), `deploy/README.md` § 1 et § 14, `deploy/RESTAURER.md`, `api/README.md`.
- Tests de l'API : `grep -cE "^\s*(test|it)\(" api/test/*.test.js` → 5 + 11 + 13 + 10 + 7 + 9 = **55**.
- `tools/test-sauvegarde.sh` : en-tête, port 8443, `CURL_CA_BUNDLE`, verdicts `TOUT OK` / `ÉCHECS : n`. Le compte de 119 vérifications n'est pas relevable sans le banc : repris des fiches 02, 03 et de `revue-code.md` (cohérents entre eux).
- Liens relatifs des 7 pages : tous valides. `sources` et `commit` présents sur les 7 pages (le glossaire n'en a pas, par construction).

## Constats
| # | Page | Problème | Correction attendue | Sévérité |
|---|---|---|---|---|
| 1 | `technique/deploiement-ovh.md` | L'étape 2 installe `docker.io docker-compose-v2 certbot python3-certbot-nginx tmux`, et `apt install age rclone` n'arrive qu'en « prérequis » de l'étape 11. Or `deploy/prepare-serveur.sh` (l. 32-34) **s'arrête à l'étape 3** si `age` ou `rclone` manquent (« « age » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien. »). Sur le serveur neuf, la checklist bloque à l'étape 3. | Ajouter `age rclone` à l'installation de l'étape 2 (et à son `apt-cache policy`) ; à l'étape 11, retirer le prérequis ou le marquer « déjà fait à l'étape 2 ». La vue humaine est déjà écrite ainsi. | majeur |
| 2 | `technique/api.md` § Tests | « 52 tests » : il y en a 55 depuis `sauvegarde.js` (relevé ci-dessus ; `conventions.md` dit bien 55). La liste des fichiers testés ne cite pas `sauvegarde.js` (dans `equipe.test.js`). | « 55 tests », et « `equipe.js` et `sauvegarde.js` (v1.7) en processus fils ». | majeur |
| 3 | `technique/deploiement-ovh.md` | La ligne `\| 1.7 \| Étape 11 : sauvegardes … \|` est dans le tableau « Points à savoir » : la page n'a pas de section « Historique ». | Créer `## Historique` (1.5 création, 1.6, 1.7 étape 11) et y déplacer la ligne ; ajouter « Voir aussi ». | mineur |
| 4 | `technique/deploiement-ovh.md` | « `Serveur prêt.` (prepare-serveur.sh l. 163) » : la ligne est maintenant la 167 (4 lignes ajoutées en v1.7). | « l. 167 ». | mineur |
| 5 | `technique/deploiement-ovh.md` | `sources` ne cite ni `deploy/systemd/*`, ni `deploy/RESTAURER.md`, alors que l'étape 11 en dépend (installation des unités, essai d'ouverture d'une copie). | Ajouter `deploy/systemd/recrutement-backup.service`, `.timer`, `recrutement-verif-disque.service`, `.timer`, `deploy/RESTAURER.md`, `deploy/healthchecks.sh`. | mineur |
| 6 | `technique/api.md` | Le schéma « Vue d'ensemble » montre `equipe.js` → base, pas `sauvegarde.js`, qui ouvre aussi la base (en lecture seule) et écrit dans `sauvegardes/` à côté. | Ajouter un nœud `node api/sauvegarde.js` → base (lecture) → `/data/sauvegardes`, et la phrase « `sauvegarde.js` ouvre sa propre connexion, en lecture seule ». | mineur |
| 7 | `technique/conventions.md` § Organisation | La ligne `api/` liste `server.js`, `equipe.js`, `src/`, `test/`, `README.md`, sans `sauvegarde.js` (v1.7). | Ajouter `sauvegarde.js` (v1.7). | mineur |
| 8 | `technique/conventions.md` § Tests | « faux `docker` (sauf `compose config`, réel), `rclone`, `age`, `df` » : d'après l'en-tête de `tools/test-sauvegarde.sh` (l. 7-8, 116), `age` est le **vrai** age, enveloppé seulement pour simuler un échec (`FAUX_AGE=echec`) ou un fichier non chiffré (`FAUX_AGE=clair`). | « faux `docker` (sauf `compose config`), `rclone`, `df` ; vrai `age` (enveloppé pour simuler un échec ou un fichier non chiffré), vrai `curl` vers un faux healthchecks.io ». | mineur |
| 9 | `technique/decisions.md` « Méthode de copie » | « la copie a l'en-tête WAL de la base sans le changement de journal (vérifié, v1.7) » se lit comme un défaut de la copie, alors que `sauvegarde.js` passe justement la copie en `journal_mode = DELETE`. | « sans `journal_mode = DELETE`, la copie garderait l'en-tête WAL de la base (vérifié, v1.7) : d'où le changement de journal ». | mineur |
| 10 | `technique/decisions.md` | `sources` ne cite pas `deploy/healthchecks.sh` ni `deploy/verif-disque.sh`, sur lesquels repose la décision « Alertes » (adresse jamais en argument, `OK` exact, deux contrôles distincts). | Les ajouter. | mineur |
| 11 | `doc/produit/stockage-partage.md` « Effacement et copies » | « 3 jours dans le serveur, 31 jours dans ses copies » : « dans le serveur » est ambigu (le dossier supprimé n'est plus dans la base). Ailleurs (`deploy/README.md` § 14, `api/README.md`, `decisions.md`) : « dans le volume », « sur le serveur ». | « 3 jours dans la copie de travail à côté de la base, 31 jours dans les copies chiffrées du serveur, 32 jours chez OVH ». | mineur |
| 12 | `doc/produit/stockage-partage.md` « Sauvegarde » et `glossaire.md` « healthchecks.io » | « l'administrateur est prévenu par email » ; `deploy/README.md` § 14 étape 4 dit « notification par email à l'équipe ». | Harmoniser (même destinataire partout), de préférence comme dans `deploy/README.md`. | mineur |
| 13 | `glossaire.md` | (a) « Volume » dit encore « c'est la seule copie, à ne jamais supprimer » : faux une fois les sauvegardes en service (`deploiement-ovh.md` a retiré « seule copie »). (b) Les 4 nouveaux termes sont ajoutés en fin de fichier, hors de l'ordre alphabétique du glossaire. | (a) « … contient la base des candidatures, à ne jamais supprimer ; les seules autres copies sont les sauvegardes chiffrées. » (b) Ranger « Clé de sauvegarde », « healthchecks.io », « Restauration », « Sauvegarde » à leur place alphabétique. | mineur |

Hors des pages Hlýja (fichiers du code cités en `sources`, l'orchestrateur décide) :

| # | Fichier | Problème | Correction attendue | Sévérité |
|---|---|---|---|---|
| 14 | `deploy/RESTAURER.md` « Avant de commencer (poste) » | `read -r -p "…" RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID; read -r -s -p …` est écrit pour bash, mais se lance sur un Mac, dont le shell par défaut est zsh : sous zsh, `-p` lit depuis un coprocessus. Essayé : `zsh -c 'read -r -p "x" X'` → `zsh:read:1: -p: no coprocess`, code 1, variable vide. La restauration bloque dès la saisie des identifiants. | Forme valable sous bash et zsh : `printf "Clé d'accès S3 (restauration) : "; read -r RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID; printf "Secret S3 : "; read -r -s RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY; echo` (essayé sous zsh : les deux variables sont lues). La vue humaine de `deploiement-ovh` l'utilise déjà. | majeur |

Pour information : `deploy/README.md` § 14 étape 2 utilise le client `aws` « avec l'utilisateur administrateur » sans dire comment lui donner ces identifiants ni la région (`gra`). La vue humaine de `deploiement-ovh` le fait par `read -s` et `AWS_DEFAULT_REGION=gra`, sur le modèle de `RESTAURER.md`.

## Conformité vérifiée (sans écart)
| Page | Points vérifiés contre le code |
|---|---|
| `architecture.md` | Stack (`age`, `rclone`, healthchecks.io), lignes `backup.sh`, `verif-disque.sh`, `healthchecks.sh`, unités : verrous, attentes (600 s, 120 s), nom à la seconde, en-tête `age-encryption.org/v1`, `trap` et `/fail`, `curl -K`, `OK` exact, seuil 80 %, `TimeoutStartSec`/`TimeoutStopSec`, `ExecStopPost` sous `flock -n` ; `prepare-serveur.sh` exige `age` et `rclone` |
| `api.md` | Ligne `sauvegarde.js` : lecture seule `fileMustExist`, `.tmp-<pid>`, date UTC, `integrity_check`, `journal_mode = DELETE`, renommage, masque 077, dernière ligne, `--nettoyer` 48 h sans toucher la copie faite, codes 0/1 |
| `conventions.md` | 55 tests, `umask 022` du test, `test-sauvegarde.sh` (prérequis, port 8443, verdicts), commande shellcheck avec `LC_ALL=C.UTF-8`, banc `ubuntu:26.04` avec systemd |
| `decisions.md` | 5 décisions 1.7 conformes à `backup.sh`, `healthchecks.sh`, `deploy/README.md` § 14 (politique S3, cycle de vie, grâces 2 h / 30 min) et `RESTAURER.md` (`docker compose run` par l'entrée standard, empreinte, `integrity_check`, `user_version`) |
| `deploiement-ovh.md` | Sorties attendues de l'étape 11 recopiées des scripts (`Sauvegarde réussie : … envoyée.`, `Disque racine : … ; seuil : 80 %.`) |
| `stockage-partage.md` | Durées 3 / 31 / 32 jours cohérentes avec `--nettoyer` (48 h, au passage suivant), la rétention locale (30 j après envoi, au passage suivant) et le cycle de vie OVH (30 j) ; règle de restauration conforme à `RESTAURER.md` |
| `glossaire.md` | « Sauvegarde », « Restauration », « Clé de sauvegarde », « healthchecks.io » conformes au code |

## Termes proposés pour le glossaire
| Terme | Définition proposée | Aussi |
|---|---|---|
| age | Le petit programme qui chiffre les sauvegardes. Il chiffre pour une clé publique, posée sur le serveur ; seule la clé privée, rangée au coffre, peut les rouvrir. | clé publique age, `AGE_RECIPIENT` |
| rclone | Le programme qui envoie les sauvegardes chiffrées du serveur vers OVH Object Storage. Sur le serveur, il ne peut que déposer : il ne peut rien effacer. | remote rclone |
| OVH Object Storage | L'espace de stockage d'OVH, en Europe, où partent les sauvegardes chiffrées. Les fichiers y sont rangés dans un « bucket », qui les efface lui-même au bout de 30 jours. | bucket, cycle de vie |
| Timer systemd | Le réveil du système du serveur qui lance une tâche à heure fixe : la sauvegarde chaque nuit vers 3 h, le contrôle du disque toutes les heures. S'il était éteint à l'heure prévue, la tâche part au redémarrage. | timer, timers |

Et compléter « Clé de sauvegarde » par `Aussi : clé privée, clé age.`

## Vues humaines
Écrites (réécrites en entier) à partir des sources actuelles, en suivant le code là où une source s'en écarte :
- `technique/architecture.humain.md`, `technique/api.humain.md` (55 tests, constat 2), `technique/conventions.humain.md`, `technique/decisions.humain.md`, `doc/produit/stockage-partage.humain.md`.
- `technique/deploiement-ovh.humain.md` : checklist autonome ; `age` et `rclone` installés dès l'étape 2 (constat 1) ; nouvelle étape 11 « Sauvegardes » avec les commandes de `deploy/README.md` § 14 recopiées (clé age, bucket et utilisateurs S3, cycle de vie, remote rclone, healthchecks.io, `.env`, unités systemd, premiers essais) et l'ouverture d'une copie sur le Mac reprise de `deploy/RESTAURER.md`. Les saisies d'identifiants sur le Mac utilisent `printf` puis `read -r` / `read -r -s` (valables sous zsh, constat 14). Les écrans d'OVH et de healthchecks.io n'ont pas pu être vus : leurs libellés sont ceux de `deploy/README.md`, avec un « Sinon » qui renvoie à l'équipe technique.

À revérifier après correction : constats 1, 2 et 14 (les vues humaines suivent déjà le code). Les blocs de commandes de l'étape 11 ont été passés à `bash -n` et `zsh -n` ; les blocs qui créent les politiques S3 et complètent `.env` ont été joués dans un dossier jetable (JSON valide, ajout fait une seule fois).

## Traitement (orchestrateur)
| Constat | Traitement |
|---|---|
| Majeur 1 — `age`/`rclone` installés trop tard dans `deploiement-ovh.md` | corrigé : ajoutés à l'étape 2 |
| Majeur 2 — `api.md` annonce 52 tests | corrigé : 55, tests de `sauvegarde.js` cités |
| Majeur 3 — `read -r -p` échoue sous zsh dans `deploy/RESTAURER.md` | corrigé : `printf` puis `read -r` / `read -r -s` ; essayé sous zsh ; blocs de `RESTAURER.md` passés à `zsh -n` |
| `deploiement-ovh.md` sans Historique | corrigé : section ajoutée |
| `conventions.md` : `sauvegarde.js` absent, « faux age » | corrigés |
| `stockage-partage.md` : « 3 jours dans le serveur », destinataire des alertes | corrigés |
| Glossaire : « Volume » (seule copie), ordre alphabétique, termes proposés | corrigés : `age`, `Bucket` (aussi : OVH Object Storage), `rclone`, `Timer systemd` ajoutés ; « Aussi : clé privée age » ; ordre rétabli |
| Autres mineurs (schéma de `api.md`, phrase du journal dans `decisions.md`, `sources`, numéro de ligne) | laissés : sans effet sur l'exactitude, notés ici |

## Relecture de la reprise (2026-10-28)

> Rédacteur-relecteur indépendant, sur les 7 pages sources touchées par la reprise (`architecture`, `api`, `conventions`, `decisions`, `deploiement-ovh`, `doc/produit/stockage-partage`, `glossaire`) et la spec finale, contre le code au commit `8db372f` (`git diff main...HEAD -- . ':!hlyja'`). **Verdict : accepté avec réserves — 0 bloquant, 6 majeurs, 10 mineurs.** Plus aucune mention de rclone, d'OVH Object Storage, de healthchecks.io ni du client `aws` dans les sources, hors historique et décisions écartées ; mais deux pages (glossaire « Volume », `deploy/README.md` § 13) disent encore que la base est copiée « hors du serveur », et la doc produit décrit une restauration après la perte du serveur, que `RESTAURER.md` exclut. Les vues humaines suivent le code là où une source s'en écarte.

### Méthode
- Valeurs relevées par commande : `api/src/sauvegardes.js` (`RETARD_SAUVEGARDE_MS` 26 h, `RETARD_DISQUE_MS` 2 h, `enRetard` : absente, invalide, **future** ou trop vieille ; `null` / `{illisible: true}` ; 403 `admin-requis`) ; `admin/sauvegardes.html` (motifs rouges, dont « date dans le futur », messages 401 / 403 / 404 / réseau, `textContent`) ; `deploy/backup.sh` (attentes 600 s / 120 s, 30 × 24 × 60 min, verrous, `age -r … -o /dev/null`, en-tête `age-encryption.org/v1`, message final « Sauvegarde réussie : … ; N copies sur le serveur. ») ; `deploy/commun.sh` (`ecrire_etat` par `docker compose run --rm --no-deps -T api`, nom de fichier contrôlé) ; `deploy/verif-disque.sh` (seuil 80, message « Disque racine : … ») ; unités `deploy/systemd/*` (`After=docker.service` seul, `Group=deploy`, `TimeoutStartSec` 1h / 5min, `TimeoutStopSec=90`, `ExecStopPost` sous `flock -n`, `OnCalendar` 03:00 + 15 min, `hourly`, `Persistent=true`) ; `deploy/prepare-serveur.sh` (exige `age`, « Serveur prêt » l. 165) ; `.env.example` (7 variables, `AGE_RECIPIENT=age1exemplearemplacer`) ; `tools/check-site.sh` (7 contrôles) ; `tools/test-sauvegarde.sh` (`BANC_JETABLE=oui` exigé l. 22).
- Tests de l'API : `grep -cE "^\s*(test|it)\(" api/test/*.test.js` → 14 + 5 + 13 + 10 + 9 + 7 = **58** (conforme à `api.md` et `conventions.md`). Lanceur : 102 vérifications (`rapport-qa.md`, fiche 08 ; non relevable sans le banc).
- CA16 : `grep -ri 'rclone\|healthchecks\|RCLONE_DEST\|HEALTHCHECK_\|awscli\|aws s3api' deploy .env.example api/README.md tools README.md` → une seule ligne, le contrôle CA23 de `tools/test-sauvegarde.sh` qui vérifie justement l'absence de `rclone` (attendu).
- `grep -rniE 'rclone|object storage|healthcheck|aws|bucket|hors du serveur'` sur les 7 sources et la doc du projet : voir constats 1 et 15 ; le reste est historique ou alternative écartée.

### Constats (pages Hlýja)
| # | Page | Problème | Correction attendue | Sévérité |
|---|---|---|---|---|
| 1 | `glossaire.md` « Volume » | « depuis la 1.7, elle est aussi sauvegardée chaque nuit **hors du serveur** » : faux depuis la reprise (copies dans `/var/backups/recrutement`, sur le serveur). | « … à ne jamais supprimer ; depuis la 1.7, elle est aussi copiée chaque nuit, chiffrée, sur le serveur lui-même (`/var/backups/recrutement`) : la perte du serveur emporterait les deux. » | majeur |
| 2 | `doc/produit/stockage-partage.md` « Cas particuliers » | « Après la perte du serveur, les suppressions de la dernière journée ne sont pas connues et sont refaites d'après les demandes reçues » : reste de la spec d'avant la reprise. `deploy/RESTAURER.md` (« Quel cas ? », « Serveur perdu ») : serveur perdu = rien à restaurer, base vide. | « Si la base actuelle est illisible au moment de restaurer, les suppressions faites depuis la date de la copie sont refaites d'après les demandes reçues. Si le serveur est perdu, les sauvegardes le sont aussi : il n'y a rien à restaurer. » | majeur |
| 3 | `technique/architecture.md` § Scripts, ligne « Unités » | « `After=docker.service network-online.target` (sans `Wants=docker.service` : un Docker arrêté pour maintenance n'est pas relancé) » : `8db372f` a retiré `network-online.target` ; et les commentaires des unités, `deploy/README.md` § 14 et `METTRE-A-JOUR.md` § 1 disent l'inverse : `docker.socket` relance Docker au premier appel d'une commande `docker`, d'où l'arrêt des timers avant une maintenance. | « `After=docker.service` (sans `Wants=`) ; `docker.socket` relance Docker au premier appel : arrêter les timers avant une maintenance de Docker (`deploy/README.md` § 14) » ; ajouter `Group=deploy`. | majeur |
| 4 | `technique/deploiement-ovh.md` étapes 7 et 10 | « 6 `OK` » : `tools/check-site.sh` a 7 contrôles depuis la 1.7, et `deploy.sh` (l. 137) l'appelle. La checklist ferait croire à un échec. | « 7 `OK` » aux deux étapes. | majeur |
| 5 | `technique/conventions.md` § Tests, ligne `test-sauvegarde.sh` | Prérequis sans `BANC_JETABLE=oui` : sans lui, le lanceur refuse (« Refusé : ce lanceur efface /var/backups/recrutement… », code 2, l. 22, ajouté par `8db372f`). `README.md` le dit déjà. | Ajouter « `-e BANC_JETABLE=oui` » aux prérequis, avec la commande d'exemple de l'en-tête (`docker run --rm -e BANC_JETABLE=oui -v "$PWD:/depot:ro" <image du banc> bash /depot/tools/test-sauvegarde.sh /depot`). | majeur |
| 6 | `technique/conventions.md` § Tests, ligne `check-site.sh` | « Couvre » ne cite pas `/admin/sauvegardes.html` → 302 Google (7e contrôle, v1.7). | Ajouter « `/admin/sauvegardes.html` → 302 (v1.7) ». | mineur |
| 7 | `technique/api.md` § Routes, ligne `GET /api/sauvegardes` | « `en_retard` : réussite de plus de 26 h, mesure de plus de 2 h, ou absente » : aussi vrai pour une date invalide **ou dans le futur** (`enRetard` : `!(t <= maintenant)`, test « date dans le futur » de `api.test.js`, `64f1bd6`). | « … absente, invalide, dans le futur ou de plus de 26 h (2 h pour le disque) ». | mineur |
| 8 | `technique/api.md` § Vue d'ensemble et § Consommateurs | Le schéma ne montre pas la route qui lit `etat/` ; le tableau des consommateurs (v1.3) n'a pas `admin/sauvegardes.html` → `GET /api/sauvegardes`. | Ajouter le nœud `etat/` lu par la route, et la ligne « Page d'état des sauvegardes — `GET /api/sauvegardes` — `admin/sauvegardes.html` » (1.7). | mineur |
| 9 | `technique/architecture.md` § Vue d'ensemble, ligne `backup.sh` | Le schéma n'a pas le chemin des sauvegardes (timers → scripts → `/var/backups/recrutement` et `/data/etat` → route → page). Les garde-fous de `backup.sh` ne citent pas le contrôle `age -r … -o /dev/null` (clé refusée par age). | Ajouter un second schéma « Sauvegardes » (celui de la spec finale convient) ; ajouter « clé acceptée par `age -r … -o /dev/null` ». | mineur |
| 10 | `technique/deploiement-ovh.md` | (a) « `Serveur prêt.` (prepare-serveur.sh l. 167) » : l. 165. (b) Étape 5 « 6 variables de `.env.example` » : `.env.example` en a 7 ; `AGE_RECIPIENT` est ajoutée à l'étape 11. (c) Pas de « Voir aussi » (déjà demandé au constat 3 de la première relecture). | (a) « l. 165 ». (b) « 6 des 7 variables (`AGE_RECIPIENT` : étape 11) ». (c) Ajouter « Voir aussi » (architecture, `deploy/README.md`, `METTRE-A-JOUR.md`, `CLE-SAUVEGARDE.md`, `RESTAURER.md`). | mineur |
| 11 | `technique/decisions.md` | Le résumé d'en-tête (`>`) s'arrête à v1.3 ; rien pour v1.7. | Ajouter « > v1.7 : copie par `db.backup()`, chiffrement age pour une clé publique, copies gardées sur le serveur seulement, page d'état au lieu d'alertes, restauration sans clair sur le serveur. » | mineur |
| 12 | les 7 sources (frontmatter) | `commit: fed40fe`, alors que `64f1bd6` et `8db372f` changent le code et la doc cités en `sources` (unités, `commun.sh`, `admin/sauvegardes.html`, `CLE-SAUVEGARDE.md`, `RESTAURER.md`, `test-sauvegarde.sh`). | `commit: 8db372f` une fois les constats corrigés. | mineur |
| 13 | `glossaire.md` | « État des sauvegardes » est employé partout (spec, `api/README.md`, `decisions.md`, page d'état) sans entrée. | Ajouter : « ## État des sauvegardes — Trois petits fichiers écrits par les scripts de sauvegarde et de contrôle du disque, dans le volume de l'API : résultat de la dernière tentative, dernière réussite, occupation des disques. Ni candidat, ni clé : des dates et des nombres. La page d'état des sauvegardes les affiche. » | mineur |
| 14 | `spec/spec-finale.md` R22, R23 (pour information) | La date future (en retard, motif « La date de la dernière sauvegarde réussie est dans le futur : l'horloge du serveur est peut-être fausse. ») ajoutée par `64f1bd6` n'est pas dans la spec. | Compléter R22 (« manque, est invalide, est dans le futur ou a plus de 26 h ») et R23 (motif). | mineur |

### Constats hors des pages Hlýja (l'orchestrateur décide)
| # | Fichier | Problème | Correction attendue | Sévérité |
|---|---|---|---|---|
| 15 | `deploy/README.md` § 13 (l. 327) | « elle est copiée chaque nuit, chiffrée, **hors du serveur** (section 14) » : contredit la § 14 (« Les copies restent sur ce serveur »). | « … copiée chaque nuit, chiffrée, et gardée 30 jours sur ce serveur (section 14) : la perte du serveur emporterait aussi les copies. » | majeur |
| 16 | `deploy/METTRE-A-JOUR.md` § 5, étape 4 | Sortie attendue « `Rôle changé : prenom.nom@yeita.fr · <Prénom> · admin · actif` » : `api/equipe.js` (l. 32, 77) affiche aussi `· ajouté le <date>`, après une ligne `Base : /data/recrutement.sqlite`. | « `Base : /data/recrutement.sqlite`, puis `Rôle changé : … · admin · actif · ajouté le …` ». | mineur |

### Conformité vérifiée (sans écart)
| Page | Points vérifiés contre le code |
|---|---|
| `architecture.md` | Stack (`age` 1.2.1, plus de rclone ni healthchecks.io), lignes `backup.sh` (verrous, 10 min, 120 s, nom horodaté, état `reussie`/`echec`, « les copies restent sur le serveur »), `verif-disque.sh`, `commun.sh`, 7 contrôles de `check-site.sh`, historique |
| `api.md` | `routesSauvegardes(app, db)`, `path.dirname(db.name)`, 26 h / 2 h, 403 `admin-requis` après 401 et `hors-equipe`, `routesApi` à trois éléments, 58 tests |
| `conventions.md` | Dossier `admin/`, `deploy/systemd/`, trois pages `deploy/*.md`, 58 tests, faux outils du lanceur (plus de faux rclone ni healthchecks), 102 vérifications |
| `decisions.md` | Cinq décisions 1.7 conformes à `backup.sh`, `CLE-SAUVEGARDE.md`, `RESTAURER.md`, `sauvegardes.js` ; rclone, OVH Object Storage, client `aws`, healthchecks.io seulement comme alternatives écartées |
| `deploiement-ovh.md` | `age` à l'étape 2 ; étape 11 renvoie à `METTRE-A-JOUR.md` § 5 ; sortie « Sauvegarde réussie : … ; 1 copies sur le serveur. » |
| `stockage-partage.md` | Règles « Sauvegarde » (sur le serveur, aucune alerte, page réservée aux admins, « Réservé aux admins de l'équipe. »), « Effacement et copies » (3 j / 31 j), « Restauration » |
| `glossaire.md` | « age », « Clé de sauvegarde » (fichier `.txt`, 1 ou 2 personnes, main propre), « Page d'état des sauvegardes », « Restauration », « Sauvegarde » (30 jours sur le serveur), « Timer systemd » ; termes « rclone », « Bucket », « healthchecks.io » retirés |

### Vues humaines
Réécrites en entier : `technique/architecture.humain.md`, `technique/api.humain.md`, `technique/conventions.humain.md`, `technique/decisions.humain.md`, `technique/deploiement-ovh.humain.md`, `doc/produit/stockage-partage.humain.md`, et nouvelle `spec/spec-finale.humain.md`. Elles suivent le code pour les constats 1 à 5, 7 et 15 (copies sur le serveur, pas de restauration après la perte du serveur, `docker.socket`, 7 `OK`, `BANC_JETABLE=oui`, date future).
`deploiement-ovh.humain.md` : checklist autonome ; étapes 1 à 10 reprises (rclone retiré de l'étape 2, 7 `OK` aux étapes 7 et 10) ; étape 11 recopie `deploy/METTRE-A-JOUR.md` § 5 : vérification d'age, clé créée sur le Mac (`deploy/CLE-SAUVEGARDE.md` § 1), écriture sûre de `AGE_RECIPIENT` avec copie de `.env` dans `~/env-avant-cle`, unités, rôle admin, première sauvegarde et mesure du disque, page d'état, vérification de la clé par déchiffrement sur le Mac. Blocs de commandes passés à `bash -n` et `zsh -n`.

À revérifier après correction : constats 1 à 5 et 15.

### Traitement de la relecture de la reprise (orchestrateur)
| Constat | Traitement |
|---|---|
| Glossaire « Volume » et `deploy/README.md` § 13 : « hors du serveur » | corrigés : « sur le même serveur » ; § 13 rappelle qu'une perte du serveur emporte les copies |
| `stockage-partage.md` : restauration après la perte du serveur | corrigé : « il n'y a rien à restaurer » |
| `architecture.md` : unités et `docker.socket` | corrigé |
| `deploiement-ovh.md` : 6 `OK` au lieu de 7 ; numéro de ligne | corrigés |
| `conventions.md` : `BANC_JETABLE=oui` absent | corrigé |
| `api.md` : date dans le futur, consommateur de la route | corrigés |
| `commit` périmé | mis à jour |
| Autres mineurs (schémas, « Voir aussi », résumé de `decisions.md`, terme « État des sauvegardes », sortie de `equipe.js role`) | laissés : sans effet sur l'exactitude |
Hors relecture : `umask 022 &&` ajouté aux deux commandes `deploy.sh` de `deploy/README.md` (§ 9 et § 10), comme dans `METTRE-A-JOUR.md` (contournement de la fiche 1.7-1).
