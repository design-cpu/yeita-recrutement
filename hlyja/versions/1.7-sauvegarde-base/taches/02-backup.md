---
type: tache
version: 1.7
numero: 02
titre: deploy/backup.sh, deploy/healthchecks.sh et le lanceur à faux outils
statut: faite
date: 2026-10-27
---

# Tâche 02 — `deploy/backup.sh`, `deploy/healthchecks.sh`, `tools/test-sauvegarde.sh`

## Ce que ça change
- `deploy/backup.sh` (nouveau) : corps dans `main` ; refus de root ; `umask 077` ; verrou propre `/var/backups/recrutement/.backup.lock` (non bloquant ; aussi pris par `ExecStopPost`, E14) ; adresses de ping lues et validées d'abord, puis tout échec signalé (`trap` EXIT, puis INT/TERM/HUP → « (interrompue) ») ; `age`/`rclone`, `AGE_RECIPIENT` (une clé `age1…`, essai vers `/dev/null`), `RCLONE_DEST` ; dossier 700 ; nettoyage du clair laissé par une coupure (verrou tenu) ; verrou de `deploy.sh` attendu 10 min ; api saine attendue 120 s ; `sauvegarde.js --nettoyer`, nom pris dans la dernière ligne (motif) ; `docker compose cp` ; `age` vers `recrutement-<horodatage UTC>.db.age.tmp`, en-tête contrôlé, renommage (nom déjà pris → échec, rien écrasé) ; clair supprimé ; `rclone copy` ; rétention locale (`-mmin +43200`) après l'envoi ; ping de succès. Corps de ping fixes (« Échec : <étape> (code n). », « Sauvegarde réussie (n octets chiffrés). »).
- `deploy/healthchecks.sh` (nouveau, chargé par les deux scripts) : `lire_reglages` (`docker compose config --environment`), `reglage_valide` (vide, `#…`, valeur d'exemple), `adresse_hc` (`https://`, sans espace ni guillemet, différente de l'autre adresse), `ping_hc` (adresse par `curl -K` sur un descripteur, V19 ; 3 essais de 10 s ; `OK` exact ; messages « rate limited », « not found »).
- `tools/test-sauvegarde.sh` (nouveau) : lanceur en root dans un banc `ubuntu:26.04` ; faux `docker` (sauf `compose config`, réel), `rclone`, `age` (modes `clair`, `echec`, `lent`), `df` ; vrai `curl` vers un faux healthchecks.io HTTPS (`python3`, certificat de test, `CURL_CA_BUNDLE`). Seuls points d'appui ajoutés aux scripts pour les tests : `RECRUTEMENT_ATTENTE_DEPLOIEMENT` et `RECRUTEMENT_ATTENTE_API` (durées d'attente).

## Tests
Banc `banc-1.7-systemd` (ubuntu:26.04.1, docker.io, age 1.2.1, rclone 1.60.1) : `docker exec banc17s bash /depot/tools/test-sauvegarde.sh /depot` → 111 vérifications, ligne de verdict **`TOUT OK`** (code 0 ; `ÉCHECS : n` et code 1 sinon).
Défauts trouvés en route : banc (faux serveur sans `Content-Length` : curl/OpenSSL 3 voit une fin abrupte ; `wait` sans argument qui attendait le faux serveur ; deux exécutions dans la même seconde, le refus d'écraser jouant comme voulu) ; **produit** : `verif-disque.sh` sortait par `set -e` sans `/fail` quand `df` échouait (corrigé, tâche 03).
`shellcheck` 0.10.0 (`-x`) sur `backup.sh`, `verif-disque.sh`, `healthchecks.sh`, `prepare-serveur.sh` : aucune remarque.

## Mutations
Copie du dépôt dans le banc, une garde cassée à la fois, lanceur complet (durée maximale 400 s). Lanceur : `scratchpad/banc/mutations-scripts.py`.
| # | Garde cassée | Classement | Assertion qui échoue |
|---|---|---|---|
| B1 | suppression du clair à la sortie | détectée | `CA5 FAUX_AGE=echec : aucun clair` |
| B2 | nettoyage au démarrage | détectée | `R8 clair d'une coupure supprimé, sauvegarde réussie` |
| B3 | rétention avant l'envoi | détectée | `CA8 envoi raté : la copie de 30 j + 1 min est gardée` |
| B4 | `OK` exact → `OK*` | détectée | `CA7 réponse notfound : code non nul` |
| B5 | refus de la valeur d'exemple | détectée | `CA6 valeur d'exemple : message « … a encore sa valeur d'exemple »` (une autre garde refuse aussi, sans ce message) |
| B6 | refus `#…` | détectée (après renfort) | `CA6 valeur vide suivie d'un commentaire : message « RCLONE_DEST est vide (seul un commentaire »` — survivante au premier passage : la garde `:` refusait aussi ; le test vérifie désormais le message |
| B7 | `https://` → `https?://` | détectée | `CA6 http:// : message « … doit être une adresse https:// »` |
| B8 | adresses égales | détectée | `CA6 adresses égales : code 1` |
| B10 | refus de root | détectée | `CA7 root refusé` |
| B11 | verrou propre | détectée | `CA7 verrou de sauvegarde pris : code 1` |
| B12 | contrôle de l'en-tête age | détectée | `CA5 FAUX_AGE=clair : code non nul` |
| B13 | adresse en argument de `curl` | détectée | `rien ne fuit` (arguments de curl) dans CA4 et CA5 |
| B14 | clé `age1…` seule | détectée | `CA6 clé SSH : code 1` |
| B16 | verrou de déploiement | détectée | `CA7 déploiement en cours : /fail` |
(B9 et B15 : tâche 03.) Aucune « bloque », aucun « plantage ». Retour à l'état d'origine : `TOUT OK`.
