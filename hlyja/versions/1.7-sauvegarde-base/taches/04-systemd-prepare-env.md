---
type: tache
version: 1.7
numero: 04
titre: Unités systemd, prepare-serveur.sh, .env.example
statut: faite
date: 2026-10-27
---

# Tâche 04 — Unités systemd, `prepare-serveur.sh`, `.env.example`

## Ce que ça change
- `deploy/systemd/recrutement-backup.service` : `Type=oneshot`, `User=deploy`, `Group=deploy`, `UMask=0077`, `WorkingDirectory=/opt/recrutement`, `Wants`/`After=docker.service network-online.target`, `TimeoutStartSec=1h`, `TimeoutStopSec=90`, `ExecStopPost=-/usr/bin/flock -n /var/backups/recrutement/.backup.lock /usr/bin/find … -delete` (clair et temporaires, seulement si aucune autre sauvegarde ne tient le verrou).
- `recrutement-backup.timer` : `OnCalendar=*-*-* 03:00:00`, `RandomizedDelaySec=15min`, `Persistent=true`. `recrutement-verif-disque.service` (5 min) et `.timer` (`hourly`, `Persistent=true`).
- `deploy/prepare-serveur.sh` : `age` et `rclone` vérifiés avec les autres outils, avant toute modification ; message « « age » est absent. Installez-le vous-même (apt install age rclone) ; ce script n'installe rien. ».
- `.env.example` : 4 variables commentées, valeurs d'exemple refusées par les scripts ; `deploy.sh` ne les lit pas.

## Tests
Essais sur le banc systemd à la tâche 05 (CA11, CA13, CA14, CA15).
