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
