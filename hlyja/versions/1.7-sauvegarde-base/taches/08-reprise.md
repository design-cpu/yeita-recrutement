---
type: tache
version: 1.7
numero: 08
titre: Reprise — copies sur le serveur, état des sauvegardes, page admin, pages de doc
statut: faite
date: 2026-10-28
---

# Tâche 08 — Reprise du 2026-10-28

## Ce que ça change
- **Retiré** (décision de l'utilisateur) : rclone, OVH Object Storage, client `aws`, healthchecks.io ; `RCLONE_DEST` et `HEALTHCHECK_*` de `.env.example` ; `rclone` de `prepare-serveur.sh`.
- `deploy/healthchecks.sh` → `deploy/commun.sh` : `lire_reglages`, `reglage_valide`, `maintenant`, `ecrire_etat` (conteneur jetable `docker compose run --rm --no-deps -T api`, nom temporaire puis renommage, `umask 077`).
- `deploy/backup.sh` : état `echec` (étape, code) écrit à toute sortie en échec une fois le verrou pris ; dossier des copies absent → état écrit ; verrou pris → rien d'écrit ; succès → `sauvegarde-reussie.json` et `sauvegarde-derniere.json` ; état non écrit → code 1.
- `deploy/verif-disque.sh` : `disque.json` (`normal`, `plein`, `mesure-impossible`) ; Docker muet → rien d'écrit, code 1.
- Unités : `After=docker.service` seulement (plus de réseau nécessaire).
- `api/src/sauvegardes.js` + `routesApi` : `GET /api/sauvegardes`, admin seulement, seuils 26 h / 2 h, fichiers absents ou illisibles. Tests dans `api/test/api.test.js` (`api/test` reste à 7 fichiers).
- `admin/sauvegardes.html` (nouvelle) ; `tools/check-site.sh` : 7e contrôle.
- Docs : `deploy/README.md` § 14 réécrit ; `deploy/RESTAURER.md` (copies sur le serveur, clé en fichier, `etat/`, serveur perdu) ; `deploy/CLE-SAUVEGARDE.md`, `deploy/METTRE-A-JOUR.md` (nouvelles) ; `api/README.md`, `README.md`.

## Tests
- `cd api && npm test` → `ℹ tests 58`, `ℹ fail 0` (+3 pour la route, dont un cas « JSON valide mais pas un objet » ajouté par mutation).
- `tools/test-sauvegarde.sh` (réécrit : plus de faux healthchecks ni de faux rclone ; faux `docker compose run` qui écrit l'état dans un faux volume) → 102 vérifications, **`TOUT OK`** (banc systemd).
- shellcheck 0.10.0 (`LC_ALL=C.UTF-8`) sans remarque sur `backup.sh`, `verif-disque.sh`, `commun.sh`, `prepare-serveur.sh`, `check-site.sh`.
- Page : servie par l'API locale (`DEV_STATIC`, `DEV_EMAIL`) et vue dans le navigateur de l'app : vert, rouge (3 motifs : plus de 26 h, dernière tentative en échec « chiffrement (age) », disque à 84 %), recruteur → « Réservé aux admins de l'équipe. », site sans API → « État indisponible ici : ce site n'a pas l'API. ».
- Banc systemd réel (CA24) : `systemctl start` des deux unités → `/data/etat` `node` 700, fichiers 600 ; route → 200 admin, 403 `admin-requis` recruteur ; `verif-disque.sh` pendant une sauvegarde ralentie → les deux aboutissent, `docker compose ps -q api` ne compte qu'un conteneur malgré un `run` jetable ; api arrêtée → état `echec` « api non saine » écrit.
- Pages : blocs de `RESTAURER.md`, `CLE-SAUVEGARDE.md`, `METTRE-A-JOUR.md` passés à `zsh -n` et `bash -n` ; remplacement de `AGE_RECIPIENT` dans `.env` essayé (une seule ligne) ; `age-keygen` refuse d'écraser une clé existante (vérifié).
- `grep -ri 'rclone|healthchecks|RCLONE_DEST|HEALTHCHECK_|awscli|aws s3api'` sur `deploy`, `.env.example`, `api/README.md`, `tools`, `README.md`, `admin`, `api/src` : seul le test qui vérifie leur absence.

## Mutations
| # | Garde cassée | Classement | Assertion |
|---|---|---|---|
| A1 | contrôle du rôle admin | détectée | `rec@yeita.fr` (403 attendu) |
| A2 | 26 h → 27 h | détectée | `26,1 h : en retard` |
| A3 | 2 h → 3 h | détectée | `2,1 h : en retard` |
| A4 | JSON non objet accepté | détectée (après renfort) | `JSON valide mais pas un objet : [1, 2]` |
| A5 | date invalide comptée à l'heure | détectée | fichiers absents → `en_retard: true` |
| A6 | JSON illisible → `null` | détectée | `{illisible: true}` attendu |
| C1 | état d'échec non écrit à la sortie | détectée | `CA5 … état « echec »` |
| C2 | réussite non enregistrée | détectée | `CA4 état : réussite enregistrée avec le fichier` |
| C3 | disque plein écrit « normal » | détectée | `CA9 df 81,10 : code 1, état plein` |
| C4 | dossier absent sans état | détectée | `R5 dossier des copies absent : échec écrit` |
| C5 | mesure impossible sans état | détectée | `CA9 df en échec : …` |
| C6 | état jamais renommé | détectée | `CA4 état : dernière tentative réussie` |
