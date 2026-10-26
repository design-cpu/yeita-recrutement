---
type: revue-code
version: 1.1
bloquants: 0
majeurs: 3
mineurs: 12
corriges: 7
dependances: 3
audit: ok
date: 2026-10-26
---

# Revue de code et sécurité — Déploiement de l'espace Candidatures sur le serveur OVH

> Aucun bloquant, aucun secret dans le code ni dans l'historique de la branche · 3 majeurs corrigés (lecture de `.env` différente de Compose, clone de préparation dans `/tmp` lancé en root, copies de `.env` publiables) · 4 mineurs corrigés au passage, 8 notés · revérification : ok.

## Dépendances
| Dépendance | Version | Publiée le | Licence | Audit | Verdict |
|---|---|---|---|---|---|
| `quay.io/oauth2-proxy/oauth2-proxy` | `v7.15.5` (tag figé) | 2026-10-01 (V1) | MIT | — | ok ; pas de digest (Q8) |
| `caddy` | `2.11.7` (tag figé, cas B) | 2026-10-03 (V2) | Apache-2.0 | — | ok ; pas de digest (Q8) |
| `python` | `3.12-slim` (flottant, décision du pitch) | suit 3.12 | PSF-2.0 | — | acceptable : image de construction seulement, non livrée |
Commandes : aucun manifeste de paquets dans le projet ; aucune action GitHub ajoutée (workflow Pages supprimé). Licences relevées de mémoire par le relecteur, non vérifiées par commande.

## Sécurité
| # | Sévérité | Fichier | Constat | Correction | Statut |
|---|---|---|---|---|---|
| S1 | majeur | `deploy/deploy.sh` | `.env` lu par `sed`, autrement que Compose : `COMPOSE_PROFILES=caddy  # cas B` ou un profil exporté dans le shell donnaient `caddy=non` → contrôle de 80/443 sauté alors que Compose démarre Caddy | Réglages lus par `docker compose config --environment` ; cas B décidé par `docker compose config --services` | corrige |
| S2 | majeur | `deploy/README.md` | Préparation lancée en root depuis un clone dans `/tmp/recrutement` : un autre compte local peut créer ce dossier avant et y glisser un script | Clone dans `mktemp -d` | corrige |
| S3 | majeur | `.dockerignore`, `tools/build.py`, `deploy/deploy.sh` | Seul `.env` exact était exclu ; une copie (`.env.bak`, `.swp`) non suivie entrait dans l'image et était servie aux comptes connectés | `.dockerignore` : `.env*`, `*.swp`, `*~` ; `build.py` : tout nom commençant par `.env` ; `deploy.sh` refuse aussi les fichiers non suivis | corrige |
| S4 | mineur | `deploy/deploy.sh` | Sous-réseau et port 4180 vérifiés seulement à la préparation ; un réseau supprimé puis recréé ne revérifie pas les routes | — | note (backlog) |
| S5 | mineur | `deploy/deploy.sh` | Le commit de retour accepte toute référence git (`HEAD~3`, branche) ; non exploitable | — | note |
| S6 | mineur | `deploy/prepare-serveur.sh` | Écritures de root dans `~deploy/.ssh` qui suivraient un lien symbolique ; sans impact (`deploy` déjà équivalent root) | — | note |

## Qualité et réinvention
| # | Sévérité | Fichier | Constat | Existant à réutiliser | Statut |
|---|---|---|---|---|---|
| Q1 | mineur | `deploy/deploy.sh` | `build` ou `up` en échec sortaient sans la commande de retour (R15) | — | corrige |
| Q2 | mineur | `deploy/*.sh` | Contrôle des conteneurs étrangers et repérage des ports dupliqués entre les deux scripts | `deploy/commun.sh` envisageable | note (backlog) |
| Q3 | mineur | `deploy/deploy.sh`, `compose.yaml` | `4180` et `172.30.0.0/24` écrits en dur à plusieurs endroits | — | note |
| Q4 | mineur | `deploy/prepare-serveur.sh` | Groupe `deploy` orphelin : `useradd` échouait avec un message brut | — | corrige |
| Q5 | mineur | `deploy/prepare-serveur.sh` | `id -nG \| tr \| grep -q` sous `pipefail` : faux arrêt possible | — | corrige |
| Q6 | mineur | `deploy/*.sh` | Conteneur arrêté d'un autre projet qui publie 4180 | — | abandonne : `docker ps -a` n'affiche pas les ports d'un conteneur arrêté (accord du relecteur) |
| Q7 | mineur | `deploy/README.md` | Prérequis incomplets | — | corrige |
| Q8 | mineur | `docker/front.Dockerfile`, `compose.yaml` | Tags figés sans digest | — | note |
| Q9 | info | `deploy/deploy.sh` | `exit` final superflu | — | note |

## Revérification
Par le relecteur, sur `0f6b61f` : S1, S2, S3, Q1, Q4, Q5, Q7 ok ; aucun défaut bloquant ou majeur introduit. Restes mineurs signalés : `docker compose config --environment` est une option récente de Compose (le banc a 2.40.3) ; un Compose plus ancien arrêterait le script avec un message trompeur (« .env incomplet ? ») — arrêt sûr, message à améliorer (backlog) ; `*.swp` et `*~` ne couvrent que la racine (rattrapé par le refus des fichiers non suivis).
Remise à l'épreuve des contrôles modifiés (banc Ubuntu, `0f6b61f`) :
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| cas B (S1) | `COMPOSE_PROFILES=caddy  # cas B`, port 80 pris | arrêt sur le port 80 | « ARRÊT : le port 80 est publié par un autre conteneur » |
| cas B (S1) | `.env` vide, `COMPOSE_PROFILES=caddy` exporté | arrêt sur le port 80 | idem |
| fichiers en trop (S3) | `.env.bak` non suivi | arrêt | « ARRÊT : … fichiers en trop … ?? .env.bak » |
| exclusion (S3) | `.env.bak` présent au build | absent du site et de l'image | 0 et 0 |
| message de retour (Q1) | image de base inexistante | « ÉCHEC » + commande de retour | « ÉCHEC : la construction de l'image a échoué. Pour revenir … deploy/deploy.sh 0f6b61f » |
| groupe orphelin (Q4) | groupe sans utilisateur | arrêt | « ARRÊT : un groupe « essai » existe déjà sans utilisateur du même nom. » |
| forme permise | réglages corrects | déploiement | code 0, « Déploiement réussi » |
