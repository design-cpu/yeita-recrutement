---
type: plan-de-test
version: 1.7
scenarios: 23
date: 2026-10-27
---

# Plan de test — Sauvegarde chiffrée de la base, hors du serveur, avec alertes

> 23 scénarios couvrant 17 critères actifs (CA1-CA16, CA19) · 6 couches couvertes, 2 écartées · 1 restauration de bout en bout suivie à la lettre (S19) · aucune mutation ajoutée (pilote, P4)

Écrit avant la lecture des fiches `taches/` (QA indépendante). Les vérifications des suites existantes (`npm test`, `tools/test-sauvegarde.sh`…) sont la non-régression : elles **ne comptent pas** comme scénarios. Les scénarios portent sur ce que ces suites ne font pas : le banc réel (`banc17s`, Ubuntu 26.04.1, systemd en PID 1, vrai dockerd, vraie image api, vrai `age`, `rclone` 1.60.1 avec remote local, faux healthchecks.io HTTPS avec certificat du magasin du système).

## Matrice
| Critère | Unitaire | Intégration | Bout en bout | Non-régression | Sécurité | Manuel |
|---|---|---|---|---|---|---|
| CA1 copie pendant écritures | `npm test` | S10 | — | `npm test` | — | — |
| CA2 échecs de `sauvegarde.js` | `npm test` | — | — | `npm test` | — | — |
| CA3 `--nettoyer` | `npm test` | S3 | — | `npm test` | — | — |
| CA4 sauvegarde réussie, deux exécutions | — | lanceur | S1, S2 | lanceur | S4 | — |
| CA5 échec à chaque étape | — | lanceur | S8 | lanceur | S4 | — |
| CA6 réglages refusés | — | lanceur | S7 | lanceur | — | — |
| CA7 ping, verrous, root | — | lanceur | S13, S14 | lanceur | S4 | — |
| CA8 rétention locale | — | lanceur | — | lanceur | — | — |
| CA9 `verif-disque.sh` | — | lanceur | S5 | lanceur | S4 | — |
| CA10 bout en bout réel, repère | — | — | S1 | — | S1 | — |
| CA11 échecs provoqués, relances, arrêts | — | — | S8-S14 | lanceur (R8) | S11, S12 | — |
| CA12 `RESTAURER.md` suivi tel quel | — | — | S19-S22 | — | S19 | — |
| CA13 unités systemd | — | S15 | S6, S16 | — | — | — |
| CA14 `prepare-serveur.sh` sans outil | — | S17 | — | — | — | — |
| CA15 shellcheck, prepare, deploy.sh, suites | — | S17, S18 | — | toutes les suites | — | — |
| CA16 documentation | — | — | — | — | — | S23 (relecture) |
| CA19 guide humain sur le vrai serveur | — | — | — | — | — | hors banc : sur le serveur (rapport) |

## Couches
| Couche | Couverte / écartée | Raison |
|---|---|---|
| Unitaire | couverte | `api/test/equipe.test.js` : `sauvegarde.js` en processus fils (CA1-CA3) ; relancée en non-régression |
| Intégration | couverte | `tools/test-sauvegarde.sh` (faux outils, vrai `compose config`, vrai `age`) et scénarios S3, S10, S15, S17, S18 |
| Bout en bout | couverte | banc systemd réel : sauvegarde, envoi, ping, unités, restauration (S1-S22) |
| Non-régression | couverte | `npm test`, `test-store.js`, `test-serveur.js`, lanceur, shellcheck ; verdicts recopiés |
| Sécurité | couverte | clair jamais laissé (S1, S11, S12), aucun secret dans ping, journal, `ps` (S4), aucun repère hors du volume après restauration (S19), droits 600/700 |
| Manuel | couverte (S23) et reportée (CA19) | relecture des docs ; CA19 (OVH réel, healthchecks.io réel, politiques S3) n'est faisable que sur le serveur |
| E2E Playwright du site | écartée | aucune page, aucun asset ni route de l'API modifiés (diff : `api/sauvegarde.js` seul côté API, hors serveur HTTP) |
| Performance / accessibilité | écartées | base de quelques Ko à Mo, aucun enjeu de durée hors des délais déjà testés ; aucune interface ajoutée |

## Préparation commune
- `export PATH=$HOME/.docker/bin:$PATH` ; `/opt/recrutement` mis sur la tête de `version/1.7-sauvegarde-base` (commande du banc), image api reconstruite si `api/` a changé, `systemctl start banc-hc`.
- `D` = `runuser -u deploy -- bash -c 'cd /opt/recrutement && …'` (remplace `ssh deploy@SERVEUR '…'`).
- Écritures « dans l'interface » : `fetch` vers `http://127.0.0.1:8000/api/…` lancé dans le conteneur api (`docker compose exec -T api node`), en-tête `X-Forwarded-Email: banc@yeita.fr` (le membre admin de la base du banc), comme le ferait oauth2-proxy.
- Repère : un dossier `cand-qa-repere` dont le nom contient `QAREPERE17` créé par l'API.

## Scénarios
| # | Scénario | Critère | Étapes | Attendu |
|---|---|---|---|---|
| S1 | Bout en bout réel avec repère | CA10, R7, R8 | créer `cand-qa-repere` par l'API ; `D deploy/backup.sh` ; déchiffrer le `.db.age` local et l'objet de `/srv/distant` avec `/root/poste/cle.txt` ; `sqlite3 integrity_check` ; `grep -a QAREPERE17` sur le `.db.age`, `/var/backups/recrutement`, `/tmp`, `/home/deploy` | code 0, « Sauvegarde réussie : recrutement-…Z.db.age (… octets), envoyée. » ; `.db.age` 600 commençant par `age-encryption.org/v1` ; déchiffré : `ok`, repère présent ; repère absent hors du volume ; ping succès noté par le faux healthchecks |
| S2 | Deux exécutions le même jour | CA4, R7 | relancer `backup.sh` 2 s après S1 | deux `.db.age` locaux et deux objets distants distincts, aucun écrasé ; `/data/sauvegardes` : une seule copie du jour |
| S3 | `--nettoyer` dans le vrai conteneur | CA3, R4 | dans le volume : copie datée de 49 h, de 47 h, `recrutement-…db.tmp-123` de 49 h, fichier `autre.txt` de 49 h (`touch -d`) ; `backup.sh` | 49 h supprimées (copie et temporaire), 47 h et `autre.txt` gardés, compte affiché |
| S4 | Aucun secret dans les traces | CA5, CA9, R10, R20 | pendant un `backup.sh` réel, relever `ps -eo args` en boucle ; lire les corps dans `requetes.log`, `journalctl -u recrutement-backup` | ni l'UUID de l'adresse, ni `AGE_RECIPIENT` complet, ni le repère dans `ps`, corps de ping et journal |
| S5 | `verif-disque.sh` réel, puis par son unité | CA9, R11 | `D deploy/verif-disque.sh` ; `systemctl start recrutement-verif-disque` | code 0, « Disque racine : n % ; dossier Docker : n % ; seuil : 80 %. » ; ping sur l'adresse disque (pas sauvegarde) ; unité `result=success` |
| S6 | Unité de sauvegarde | CA13, R14, R20 | `systemctl start recrutement-backup` ; `systemctl show -p Result,ExecMainStatus` ; journal | succès, nouvel objet distant, journal sans adresse de ping |
| S7 | `.env` laissé aux valeurs d'exemple (réel) | CA6, R6, R19 | copier les 4 lignes de `.env.example` dans `.env` ; `backup.sh` puis `verif-disque.sh` ; remettre | refus nommant la variable, code 1, aucun ping, aucune copie dans `/data/sauvegardes` |
| S8 | API arrêtée, puis relance | CA11, CA5 | `docker compose stop api` ; `D RECRUTEMENT_ATTENTE_API=6 deploy/backup.sh` ; `start api` ; relance | `ÉCHEC (api non saine)`, `/fail « api non saine »`, aucun clair, anciennes copies gardées ; relance : succès |
| S9 | Disque plein sur `/var/backups/recrutement` | CA11 | monter un tmpfs de 20 Ko (700, deploy) à la place ; `backup.sh` ; démonter ; relance | échec nommant l'étape (`récupération` ou `chiffrement`), `/fail`, aucun clair ni `.tmp` ; relance : succès |
| S10 | Écritures concurrentes dans l'API pendant la copie | CA11, CA1 | 200 PUT en boucle par l'API pendant `backup.sh` | sauvegarde réussie, copie `ok`, aucune erreur 5xx côté API |
| S11 | Dossier des copies en lecture seule, puis 750 | CA11, R8 | `chmod 500` ; `backup.sh` ; `chmod 750` ; `backup.sh` ; `chmod 700` ; relance | message clair et code 1 dans les deux cas, aucun clair ; relance : succès |
| S12 | API redémarrée pendant la sauvegarde | CA11 | `backup.sh` en arrière-plan ; `docker compose restart api` pendant la copie | soit succès, soit `ÉCHEC` avec étape et `/fail` ; aucun clair ; relance : succès |
| S13 | Arrêt forcé (SIGKILL) de l'unité pendant le chiffrement | CA11, R8, R14 | dépôt `Environment=PATH=` (surcharge de test, hors dépôt) avec un `age` ralenti ; `systemctl start --no-block` ; `systemctl kill -s KILL` pendant le chiffrement | après l'arrêt : aucun `recrutement-*.db` ni `.db.age.tmp` (ExecStopPost) |
| S14 | Durée maximale dépassée pendant un envoi lent | CA11, R14 | surcharge `TimeoutStartSec=20s` et `rclone` ralenti ; `systemctl start` | unité en échec (timeout), `/fail` « envoi (rclone) (interrompue) », aucun clair |
| S15 | Sauvegarde manuelle ralentie et unité lancée | CA11, CA7 | `D backup.sh` avec `rclone` ralenti en arrière-plan ; `systemctl start recrutement-backup` | l'unité sort en code 1 « déjà en cours » sans ping ; ExecStopPost ne touche pas aux fichiers de la manuelle ; la manuelle aboutit avec son `.db.age` |
| S16 | `systemd-analyze verify` et commandes d'installation du README | CA13 | `systemd-analyze verify` des 4 unités ; retirer les 4 unités, recopier la commande du README (1re fois) ; relancer (2e fois) ; modifier une ligne d'une unité installée, relancer | aucune remarque ; « copiée » ×4 + timers listés ; « identique » ×4 ; « DIFFÉRENTE », `diff` affiché, code non nul, rien écrasé |
| S17 | `prepare-serveur.sh` sans `age`, sans `rclone`, puis avec | CA14, CA15 | `PATH` réduit à des liens vers tous les outils sauf l'un ; `prepare-serveur.sh` ; empreinte de `/etc/passwd`, `/var/backups`, `/home/deploy` avant/après ; puis avec tous les outils, deux fois | message de R13 exact, code 1, rien modifié ; avec tous : aboutit et se relance |
| S18 | `deploy.sh` pendant une sauvegarde, et sans les 4 variables | R5, CA15, R19 | sauvegarde ralentie en cours → `D deploy/deploy.sh` ; `.env` sans les 4 variables → `docker compose config` et `deploy.sh` jusqu'à ses contrôles de réglages | « un déploiement est déjà en cours » ; sans les 4 variables : `compose config` aboutit, aucun refus de `deploy.sh` portant sur elles |
| S19 | **Restauration de bout en bout** (`RESTAURER.md` à la lettre, « Volume perdu ou copie plus ancienne », étapes « Avant de commencer » puis 1 à 9) | CA12, R16 | état : copie S1 sur le remote ; après la copie, créer `cand-qa-apres` et supprimer `cand-qa-suppr` (présent dans la copie) par l'API ; poste = `/root` du banc (remote `restau` en alias vers `/srv/distant`) ; dérouler chaque commande | étape 3 : `ok`, 1, comptes ; étape 4 : nouvelle sauvegarde nommée ; étape 5 : `cand-qa-suppr` listé ; étape 6 : `Base remplacée.` ; étape 7 : `healthy`, `/data` = base (+`-wal`/`-shm`) + `sauvegardes` ; étape 8 : comptes = étape 3, `À SUPPRIMER …cand-qa-suppr`, suppression par l'API, relance : `rien à faire` ; base `node:node` 600 ; repère absent hors du volume côté serveur ; étape 9 : dossier effacé |
| S20 | Transfert tronqué, puis contrôle faux | CA12 | étape 6 avec la copie coupée à moitié (`head -c`) ; puis avec une empreinte fausse | `REFUS : empreinte …`, base actuelle intacte (comptes inchangés), `/data` sans `restauration.tmp` |
| S21 | Cas « volume intact », api saine (étapes 1 bis puis 4 à 8) | CA12 | copie du jour de `/data/sauvegardes` ; ajouter ensuite un dossier par l'API ; 1 bis, 4, 5, 6 (seconde commande), 7, 8 | la base restaurée a les comptes de la copie choisie (1 bis), pas de l'état actuel ; `/data` propre |
| S22 | Cas « volume neuf » (Serveur perdu, étape 3) | CA12 | `compose down`, `docker volume rm recrutement_data`, `compose up -d api` (base vide) ; étapes 1-3 (copie via le remote du « poste »), 5 (arrêt), 6, 7, 8 sans suppressions | `Base remplacée.`, `healthy`, comptes de la copie, `/data` propre |
| S23 | Relecture des docs contre la spec | CA16 | `deploy/README.md` § 14, `RESTAURER.md`, `api/README.md`, `.env.example` | chaque élément de CA16 présent ; écarts constatés pendant S16-S22 notés |

Échec d'un scénario : bug noté (reproduction, attendu, obtenu, sévérité), aucun code de production modifié.
