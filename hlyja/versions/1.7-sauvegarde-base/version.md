---
type: version
version: 1.7
slug: sauvegarde-base
titre: Sauvegarde chiffrée de la base chaque nuit, sur le serveur, avec page d'état
branche: version/1.7-sauvegarde-base
base: main
mode: complexe
type_version: livrable
statut: en-cours
date: 2026-10-27
---

# Version 1.7 — Sauvegarde chiffrée de la base chaque nuit, sur le serveur, avec page d'état

> **Statut** : en cours (reprise du 2026-10-28) · **Branche** : `version/1.7-sauvegarde-base`
> Objectif : la base SQLite de l'API est copiée chaque nuit, chiffrée et gardée 30 jours sur le serveur ; un admin en voit l'état sur `/admin/sauvegardes.html` ; une restauration se fait pas à pas. (Avant la reprise du 2026-10-28 : envoi sur OVH Object Storage et alertes healthchecks.io, abandonnés.)

## Objectif
Traiter le pitch ci-dessous, qui réalise la fiche du backlog 1.2-5 (sauvegarder la base sans retarder l'effacement).

## Pitch d'origine
« Déjà mets ta jour totalement à jour avec les dernières branch merge. » — fait avant le démarrage : `main` local identique à `origin/main` (`7e6c346`, PR #7 et #8) ; le seul commit de `version/1.5-guide-deploiement-ovh` absent de `main` y est déjà sous un autre sha (`git cherry` : `-`).

« Il faut sauvegarder chaque nuit la base SQLite, chiffrée, hors du serveur, avec une procédure de restauration testable, et prévenir quand une sauvegarde échoue ou quand le disque se remplit. »

Décisions déjà prises (non rediscutables) :
- `node api/sauvegarde.js` : copie cohérente avec la fonction backup de better-sqlite3 vers `/data/sauvegardes/recrutement-AAAA-MM-JJ.db`, vérifiée par `PRAGMA integrity_check` ; option `--nettoyer` pour les copies de plus de 2 jours dans le conteneur.
- `deploy/backup.sh`, lancé sur le serveur par `deploy` : lance la copie dans le conteneur api, la récupère avec `docker compose cp` dans `/var/backups/recrutement`, la chiffre avec age vers `AGE_RECIPIENT` (`.env`), supprime la copie en clair, l'envoie avec `rclone copy` vers `RCLONE_DEST` (`.env`, OVH Object Storage), garde 30 jours de copies chiffrées en local ; code de sortie non nul en cas d'échec. Il signale le succès ou l'échec à `HEALTHCHECK_SAUVEGARDE_URL` (`.env`), un contrôle healthchecks.io.
- `deploy/verif-disque.sh` : si l'occupation du disque racine ou du dossier Docker dépasse 80 %, signale un échec à `HEALTHCHECK_DISQUE_URL` (`.env`), sinon un succès.
- systemd, en tant que `deploy`, avec `Persistent=true` : service et timer de sauvegarde chaque nuit vers 3 h ; service et timer de vérification du disque toutes les heures. Commandes d'installation dans `deploy/README.md`.
- `prepare-serveur.sh` vérifie aussi la présence de age et rclone, sans les installer (message clair s'ils manquent).
- `.env.example` : `AGE_RECIPIENT`, `RCLONE_DEST`, `HEALTHCHECK_SAUVEGARDE_URL`, `HEALTHCHECK_DISQUE_URL`, avec des valeurs d'exemple.
- `deploy/RESTAURER.md` : récupérer une copie, la déchiffrer sur un poste (jamais sur le serveur), arrêter l'api, remplacer la base dans le volume, supprimer les fichiers -wal et -shm, redémarrer, vérifier ; et la procédure pour simplement ouvrir une copie sur un poste.

Hors périmètre : sauvegarde des volumes Caddy, tableaux de bord de supervision, tout changement de l'API hors de la commande de sauvegarde.

Décisions de l'utilisateur (2026-10-27) :
- Niveau complexe (recommandé).
- Rétention distante : règle de cycle de vie du bucket OVH (30 jours), documentée ; le serveur n'efface rien à distance.
- Unités nommées `recrutement-backup.service`/`.timer` et `recrutement-verif-disque.service`/`.timer` (serveur partagé).
- Après le tour 1 : un second utilisateur S3 en lecture seule, rangé au coffre avec la clé privée, sert à restaurer depuis un poste.

Reprise du 2026-10-28 (décisions de l'utilisateur, après relecture du travail livré) :
- OVH Object Storage est payant : abandonné. Les sauvegardes restent **uniquement sur le serveur** (`/var/backups/recrutement`, 30 jours) ; rclone, le bucket, les utilisateurs S3 et le client `aws` sont retirés. Accepté : la perte du serveur emporte aussi les sauvegardes.
- healthchecks.io est **retiré** : plus d'alerte envoyée ; vérification à la main. Une évolution ultérieure enverra des emails.
- Ajout : une page d'état des sauvegardes **`/admin/sauvegardes.html`**, derrière la connexion Google, réservée aux membres au rôle **admin** (refus fait par l'API), sans lien depuis l'espace Candidatures ; `/admin/` accueillera plus tard un tableau de bord d'administration.
- age est **gardé**. Pour l'instant la clé privée est un fichier `.txt` que l'utilisateur partage ; un coffre interne viendra plus tard.
- Ajout : une page de doc pour créer et gérer la clé, et une page « mettre à jour le site en production » (pas encore de déploiement automatique).
- Le guide de test humain doit se lire et se suivre sans réfléchir.
- Le tout est **intégré à la 1.7** (pas de 1.8).

## Niveau
Complexe, recommandé et confirmé : données personnelles des candidats copiées, chiffrement, outil système nouveau (age), restauration à prouver ; la reprise ajoute une route d'API et une page. (Au départ : copie hors du serveur, rclone, healthchecks.io.)

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Étapes : cadrage → vérifications (banc `ubuntu:26.04` jetable avec son dockerd) → P1 → spec → jury de 4 (Sécurité/RGPD, Exploitation système, Restauration/données, Testabilité) + arbitre, 3 tours max → découpage → P3 → réalisation → revue de code et sécurité → P4 → QA en couches → doc → backlog → bilan → étonnements.
- Ordres de grandeur : spec de 150 à 220 lignes, 12 à 18 CA ; 7 à 9 tâches ; 13 à 16 fichiers touchés (dont ~8 nouveaux ; `api/test` reste à 7 fichiers au plus) ; 18 à 25 scénarios de QA, dont une restauration de bout en bout ; 8 pages de doc plus `RESTAURER.md` ; 10 à 15 mutations.
- Pas fait : volumes Caddy, tableaux de bord, API hors commande de sauvegarde ; effacement distant par le serveur ; installation d'age/rclone ; vrai envoi OVH et vrai ping healthchecks.io en QA (faux rclone/curl ; l'essai réel est une étape du guide humain) ; systemd complet seulement si un conteneur systemd est possible, sinon `systemd-analyze verify` et écart noté.
- Garde-fous : clair jamais laissé sur le disque, même en échec ; configuration lue par `docker compose config --environment`, refus du vide, du commentaire pris pour valeur, des valeurs d'exemple ; échec provoqué puis relance (disque plein, lecture seule, avec données, écriture concurrente) ; mutations classées avec durée maximale ; shellcheck 0.10.0 sans remarque ; verdict final recopié pour chaque suite ; repère cherché dans les octets du `.age`.

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
