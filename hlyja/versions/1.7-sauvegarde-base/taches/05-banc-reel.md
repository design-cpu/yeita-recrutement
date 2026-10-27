---
type: tache
version: 1.7
numero: 05
titre: Banc réel — bout en bout, échecs provoqués, arrêts par systemd
statut: faite
date: 2026-10-27
---

# Tâche 05 — Banc réel

## Banc
Conteneur `banc-1.7-systemd` : `ubuntu:26.04` (26.04.1) avec systemd en PID 1, `docker.io` 29.x et containerd sur volumes, `age` 1.2.1, `rclone` 1.60.1 ; dépôt cloné dans `/opt/recrutement` (branche de la version), image `recrutement-api` construite, api lancée ; remote rclone `ovh` de `deploy` = alias local `/srv/distant` (OVH non disponible, H1) ; faux healthchecks.io HTTPS (`python3`, certificat ajouté au magasin du système : aucune option ajoutée aux unités). Scripts du banc hors dépôt : `scratchpad/banc/banc-reel-1.sh`, `banc-reel-2.sh`.

## Résultats
| CA | Essai | Résultat |
|---|---|---|
| CA13 | commandes d'installation de `deploy/README.md` § 14 recopiées : 1re fois | 4 « copiée », timers actifs, prochains passages 03:03 et heure pleine |
| CA13 | 2e fois | 4 « identique » |
| CA13 | unité modifiée | `DIFFÉRENTE : recrutement-verif-disque.timer`, différence affichée, code non nul, rien d'écrasé |
| CA13 | `systemd-analyze verify` des 4 unités installées | aucune remarque |
| CA10 | `systemctl start recrutement-backup` | réussi ; `.db.age` `600 deploy` ; envoyé sur le remote ; déchiffré côté poste : `integrity_check` = `ok`, repère présent ; repère absent du `.db.age`, de `/var/backups`, `/tmp`, `/home/deploy`, `/srv/distant` ; ping `Sauvegarde réussie (32968 octets chiffrés).` ; journal systemd sans adresse ni repère |
| CA10 | `systemctl start recrutement-verif-disque` | réussi, ping `Disque racine : 7 % ; dossier Docker : 7 % ; seuil : 80 %.` |
| CA11 | disque plein (tmpfs 48 Ko sur `/var/backups/recrutement`, avec des copies chiffrées) | `ÉCHEC (récupération (docker compose cp))`, `/fail`, aucun clair ; relance après : réussie |
| CA11 | dossier en lecture seule | `ARRÊT : … absent ou non inscriptible`, code 1 ; relance : réussie (au premier passage la relance a échoué : elle tombait dans la même seconde que la sauvegarde précédente et le refus d'écraser, voulu, a joué avec son message ; rejoué : réussie) |
| CA11 | api arrêtée | `/fail` « Échec : api non saine (code 1). » ; api relancée juste avant → attend `healthy`, réussie, aucun clair |
| CA11 | 475 994 écritures dans la base pendant la copie | sauvegarde réussie, copie déchiffrée `ok` |
| CA11 / R8 | `systemctl kill -s KILL` pendant `age` (ralenti) | témoin : clair présent pendant le chiffrement ; après l'arrêt : aucun clair (`ExecStopPost` code 0) |
| CA11 / R8 | `TimeoutStartSec=8` (surcharge du banc) dépassé pendant `age` | échec ; `/fail` « Échec : chiffrement (age) (interrompue) (code 1). » ; aucun clair |
| CA11 / E14 | sauvegarde manuelle ralentie, `systemctl start recrutement-backup` pendant ce temps | unité en échec, aucun ping ; la sauvegarde manuelle aboutit avec son `.db.age` |
| CA14 | `rclone` puis `age` retirés, `prepare-serveur.sh` | « « rclone » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien. », « Rien n'a été modifié. », code 1 ; idem pour `age` |
| CA15 | `prepare-serveur.sh` avec les deux outils, puis relancé | `Serveur prêt.` les deux fois ; ligne « Outils présents : …, age, rclone. » |
| CA15 | `.env` sans les 4 variables | `docker compose config --environment` (lecture de `deploy.sh`) : code 0 ; `deploy/deploy.sh` inchangé et ne cite aucune des 4 variables. **Écart** : `deploy.sh` n'a pas été lancé de bout en bout (son contrôle final demande un domaine en HTTPS) |
Faux négatifs du banc, rejoués à la main : comparaison des corps JSON échappés (`réussie`) ; fonctions shell non exportées dans `bash -c` (`pings`, `as`) — les pings attendus sont affichés dans la sortie du banc.

Ligne de verdict : pas de lanceur unique (scripts de banc hors dépôt) ; chaque ligne du tableau ci-dessus est un `OK` du banc, faux négatifs rejoués notés.
