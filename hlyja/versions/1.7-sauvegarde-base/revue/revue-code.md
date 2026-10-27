---
type: revue-code
version: 1.7
bloquants: 0
majeurs: 1
mineurs: 9
statut: corrigee
date: 2026-10-27
---

# Revue de code et sécurité — version 1.7

> Sous-agent indépendant, sur `git diff main...HEAD` (16 fichiers hors `hlyja/`). Verdict : accepté avec réserves. Aucun bloquant ; 1 majeur (documentation) corrigé ; 6 mineurs corrigés, 3 au backlog.

## A. Dépendances
Aucune dépendance npm ajoutée (`git diff main...HEAD -- api/package.json api/package-lock.json` vide). Outils système : age 1.2.1 (correctif de la 1.2.0) ; rclone 1.60.1 (2022, dépôt *universe*, correctifs de sécurité non garantis ; CVE-2024-52522 ne touche pas `rclone copy` d'un seul fichier) — à noter au référentiel.

## B. Sécurité
Aucun secret dans le code ni l'historique de la branche. Entrées validées : dernière ligne de `sauvegarde.js` (motif ancré), `AGE_RECIPIENT` (`^age1[a-z0-9]+$`), adresses de ping (sans espace, guillemet ni `\` : pas d'injection dans `url = "…"`). Clair supprimé à trois niveaux (`fin()`, nettoyage au démarrage sous verrou, `ExecStopPost` sous `flock -n`). Corps de ping fixes ; adresses jamais dans `ps`. Politique S3 du serveur en refus explicite d'effacement.

## C. Qualité
`npm test` 55/55 ; shellcheck 0.10.0 sans remarque (avec `LC_ALL=C.UTF-8` : sans lui, shellcheck plante sur les accents — commande à corriger dans `conventions.md`). Réutilisation de `cheminBase`, `estOccupee`, `ATTENTE_MS` ; `healthchecks.sh` commun aux deux scripts.

## Constats et traitement
| # | Sév. | Fichier | Constat | Traitement |
|---|---|---|---|---|
| 1 | majeur | `deploy/README.md` § 14 étape 3 | `umask 077` restait dans le shell de `deploy` : un `deploy.sh` lancé ensuite recréait le dépôt en 600, illisible par les images | **corrigé** : bloc entre parenthèses ; hors diff : `deploy.sh` sans `umask` → backlog |
| 2 | mineur | `deploy/RESTAURER.md` | clé privée laissée dans le presse-papiers (`pbpaste`) | **corrigé** : `pbcopy </dev/null` après la copie et à l'étape 9 |
| 3 | mineur | unités `.service` | `Wants=docker.service` relance un Docker arrêté volontairement | **backlog** (R14 l'impose ; à arbitrer) |
| 4 | mineur | `deploy/RESTAURER.md` étape 8 | `IDS` lus dans une base suspecte insérés dans une commande distante | **corrigé** : filtrés sur le poste par le motif des identifiants |
| 5 | mineur | `deploy/backup.sh` | `RECRUTEMENT_ATTENTE_*` non contrôlées (`$((…))`, boucle vide si < 2) | **corrigé** : entier ≥ 2 exigé ; test CA7 ; mutation B19 détectée |
| 6 | mineur | `deploy/backup.sh` | `RCLONE_DEST` commençant par `-` lue comme option de rclone | **corrigé** : refusée ; test CA6 ; mutation B17 détectée |
| 7 | mineur | fiches 03 à 06 | fiche 04 sans mutations ; lignes de verdict implicites | **corrigé** : mutations B20 (`ExecStopPost` sans `flock`) et B21 (outils de `prepare-serveur.sh`) détectées ; lignes de verdict ajoutées |
| 8 | mineur | `tools/test-sauvegarde.sh` | pas de test « nom déjà pris » ni « dossier pas en 700 » | **en partie** : « dossier en 750 » ajouté (mutation B18 détectée) ; « nom déjà pris » → backlog (demande une horloge figée) |
| 9 | mineur | `deploy/README.md` § 14 étape 3 | `cat >` écrasait un `rclone.conf` existant | **corrigé** : refus si le fichier existe |
| 10 | mineur | `deploy/healthchecks.sh` | `reglage()` double celui de `deploy.sh` | **backlog** (faire charger `healthchecks.sh` par `deploy.sh`) |

## Revérification
`tools/test-sauvegarde.sh` → 119 vérifications, **`TOUT OK`** ; shellcheck sans remarque ; mutations B17 à B21 détectées par l'assertion visée.
