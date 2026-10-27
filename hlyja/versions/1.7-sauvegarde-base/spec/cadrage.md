---
type: cadrage
version: 1.7
mode: complexe
type_version: livrable
sujet: sauvegarde-chiffree-base
modules: Données, Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
challengers: Sécurité et RGPD (S), Exploitation système (E), Restauration (R), Testabilité (T)
date: 2026-10-27
---

# Cadrage — Sauvegarde chiffrée de la base, hors du serveur, avec alertes

> Mode complexe, version livrable. Socle + 5 modules ; 4 challengers + l'arbitre.
> Les choix techniques sont fixés par le pitch ; la spec décide les règles qui les rendent sûrs : rien en clair qui traîne, réglages refusés quand ils sont faux, alerte dans tous les cas d'échec, restauration qui marche du premier coup.
> 2 décisions de l'utilisateur avant la spec : rétention distante par cycle de vie du bucket ; unités préfixées `recrutement-`.

## Nature du sujet
Aujourd'hui la base de l'API (volume `recrutement_data`) est la seule copie des dossiers candidat (`compose.yaml` : « la seule copie »). Une panne du serveur, une erreur de manipulation ou un volume supprimé les perdrait. Il faut une copie chaque nuit, hors du serveur, illisible sans une clé gardée ailleurs, une procédure de restauration qu'on peut répéter, et une alerte quand la copie ne se fait pas ou que le disque se remplit (cause la plus probable d'échec sur un serveur partagé).

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | Recommandé et confirmé : données personnelles hors du serveur, chiffrement, deux outils système, un service tiers, restauration à prouver |
| Type | livrable | Destinée à être mergée puis installée sur le serveur OVH |

## Périmètre
### Ce que le pitch demande
1. `api/sauvegarde.js` (`node api/sauvegarde.js [--nettoyer]`), lancé dans le conteneur `api`.
2. `deploy/backup.sh` : copie, récupération, chiffrement age, suppression du clair, envoi rclone, rétention locale 30 jours, ping healthchecks.io, code de sortie.
3. `deploy/verif-disque.sh` : seuil 80 % sur `/` et le dossier Docker, ping healthchecks.io.
4. Quatre unités systemd (`recrutement-backup`, `recrutement-verif-disque`, service + timer), `User=deploy`, `Persistent=true`, installation dans `deploy/README.md`.
5. `deploy/prepare-serveur.sh` : présence de `age` et `rclone` vérifiée, pas d'installation.
6. `.env.example` : 4 variables avec valeurs d'exemple.
7. `deploy/RESTAURER.md` : restaurer, et ouvrir une copie sur un poste.
8. Fiche 1.2-5 : rétention et méthode de copie documentées dans `api/README.md` (§ « Ce que l'API garde »).

### Hors périmètre
- Sauvegarde des volumes Caddy (`caddy_data`, `caddy_config`).
- Tableaux de bord de supervision ; seuls les contrôles healthchecks.io sont décrits (période, délai de grâce).
- Toute modification de l'API hors de `api/sauvegarde.js` (pas de route, pas de changement de `server.js`, `src/`, `equipe.js`, de l'image ni de `compose.yaml`).
- Effacement des copies distantes par le serveur (décision : cycle de vie du bucket).
- Installation d'age, rclone, ou d'un client S3 sur le serveur (documentée, pas faite par les scripts).
- Création du bucket, des identifiants OVH et des contrôles healthchecks.io (gestes manuels documentés).
- Sauvegarde du dépôt, du `.env` ou de la configuration rclone.

## Existant réutilisé
| Besoin | Décision | Élément | Page |
|---|---|---|---|
| Ouvrir la base, chemin `DB_PATH` | réutiliser | `cheminBase` (`api/src/config.js`), `ErreurConfig`, `estOccupee` (`api/src/base.js`) ; masque 077 comme `ouvrirBase` | `technique/api.md` |
| Commande en ligne dans le conteneur | étendre le modèle | `api/equipe.js` (code 0/1, messages en français, lancé par `docker compose exec api node api/…`) | `technique/api.md` |
| Lecture des réglages `.env` | réutiliser | `docker compose config --environment` + refus `#…` et valeurs d'exemple, comme `deploy/deploy.sh` l. 35-52 | `technique/architecture.md` |
| Style des scripts | réutiliser | `arret`/`info`, `set -euo pipefail`, refus de root, verrou `flock`, messages en français | `technique/architecture.md` § Scripts |
| Dossier des copies | réutiliser | `/var/backups/recrutement` (700, `deploy`) créé par `prepare-serveur.sh` | `technique/architecture.md` |
| Contrôle des outils | étendre | boucle `for outil in …` de `prepare-serveur.sh` l. 26-28 | — |
| Tests de l'API | étendre | `api/test/aide.js` (`dossierTemporaire`, `fichiersContiennent`), `node:test` | `technique/conventions.md` |
| Banc des scripts | réutiliser | conteneur Ubuntu privilégié avec son dockerd, shellcheck 0.10.0 | `technique/conventions.md` |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Données (9) | oui | Rétention des copies, contenu d'une copie, effacement RGPD |
| Architecture technique (11) | oui | Enchaînement conteneur → hôte → chiffrement → stockage distant ; deux outils nouveaux |
| Sécurité et conformité (12) | oui | Données personnelles hors du serveur, clé privée, droits des fichiers |
| Déploiement et compatibilité (13) | oui | Installation sur un serveur partagé en service, unités systemd |
| Exploitation (13b) | oui | Alertes, journaux, disque, restauration |
| UX/UI, Contenu, Accessibilité, Valeur, Mesure, API, Performance | non | Aucune interface ni route ; la base est petite (copie de 32 Ko à quelques Mo, V5) |

## Jury
| Challenger | Initiale | Regard | Grille |
|---|---|---|---|
| Sécurité et RGPD | S | Les copies sont-elles protégées et effacées à temps ? | Clair jamais laissé · Clé et secrets · Droits des fichiers · Rétention et effacement · Données dans les alertes et journaux |
| Exploitation système | E | Ça tourne seul la nuit sur un serveur partagé ? | Robustesse des scripts (échecs, relance, verrou) · systemd · Alertes dans tous les cas · Réglages faux refusés · Pas d'effet sur les autres services |
| Restauration | R | Peut-on retrouver les données, vite et sans erreur ? | Copie utilisable · Procédure exécutable pas à pas · Vérification après restauration · Garde de la clé · Cas réels (perte du serveur, mauvaise copie) |
| Testabilité | T | Peut-on prouver que ça marche avant la mise en service ? | CA vérifiables · Essais d'échec · Faux services · Mutations · Essai manuel sur le serveur |

## Décisions demandées à l'utilisateur
| Question | Réponse (2026-10-27) |
|---|---|
| Rétention distante (rclone copy n'efface rien) | Règle de cycle de vie du bucket OVH à 30 jours, documentée ; le serveur n'a pas le droit d'effacer à distance |
| Noms des unités (serveur partagé) | `recrutement-backup.{service,timer}`, `recrutement-verif-disque.{service,timer}` |
