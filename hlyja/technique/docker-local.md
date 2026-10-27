---
type: technique
page: docker-local
titre: Lancer le site avec Docker sur un poste
maj: 1.3
commit: 3b314a9
sources: compose.yaml, docker/api.Dockerfile, .env.example, deploy/Caddyfile, deploy/oauth2-proxy.cfg, tools/check-site.sh, deploy/README.md
date: 2026-10-26
---

# Lancer le site avec Docker sur un poste

> Démarrer, contrôler et arrêter la pile Docker en local (cas B sur `https://localhost`, cas A sur `http://127.0.0.1:4180`), et brancher un vrai client Google OAuth pour tester la connexion. Rien ici ne concerne le serveur : voir `deploy/README.md`.

## Prérequis
| Élément | Détail |
|---|---|
| Docker Desktop | lancé (Docker 29, Compose 5.6 essayés) ; sur macOS, `docker` est dans `~/.docker/bin` |
| Ports libres | 80, 443 et 4180 sur le poste (cas B) ; 4180 seul (cas A) |
| Dépôt | branche contenant `compose.yaml` (depuis v1.1) |

## Démarrer (cas B, avec Caddy)
| Étape | Commande | Résultat |
|---|---|---|
| Réglages | `cp .env.example .env` | `.env` prêt pour le local : `DOMAIN=localhost`, `COMPOSE_PROFILES=caddy`, faux identifiants Google, cookie secret d'exemple valide (32 caractères) |
| Construire et lancer | `docker compose up -d --build` | conteneurs `recrutement-front-1` (127.0.0.1:4180), `recrutement-api-1` (aucun port, réseau `back`, `healthy` en quelques secondes) et `recrutement-caddy-1` (80, 443, 443/udp) |
| Contrôler | `tools/check-site.sh https://localhost` | 6 `OK` (dont `/api/moi` → 401), code 0 |
| Équipe (v1.3) | `docker compose exec api node api/equipe.js add moi@yeita.fr Moi admin` | membre dans la base du volume `recrutement_data` ; une vraie connexion Google (ci-dessous) montre alors « Connecté·e : Moi » |
| Ouvrir | `https://localhost/` | guide public ; `/candidatures/` redirige vers Google |
`.env` est ignoré par git (`.gitignore`), par `.dockerignore` et par `tools/build.py`.

## Cas A (sans Caddy)
| Étape | Commande |
|---|---|
| Arrêter Caddy | `docker compose --profile caddy down` (un `down` sans profil laisse `caddy` en marche, V16) |
| Réglage | `COMPOSE_PROFILES=` (vide) dans `.env` |
| Lancer | `docker compose up -d` (`front` et `api` démarrent, pas `caddy`) |
| Contrôler | `tools/check-site.sh http://127.0.0.1:4180` |
En HTTP simple, le cookie de session (`cookie_secure = true`) n'est pas renvoyé par le navigateur : une vraie connexion Google n'aboutit qu'en cas B.

## Commandes courantes
| Besoin | Commande |
|---|---|
| État | `docker compose ps` |
| Journaux | `docker compose logs --tail 100 front` ; `docker compose logs --tail 100 api` ; `docker compose --profile caddy logs --tail 100 caddy` |
| Prendre en compte un `.env` ou un `deploy/*.cfg` modifié | `docker compose up -d --force-recreate` |
| Reconstruire après un changement des pages | `docker compose up -d --build` |

## Tout arrêter
| Niveau | Commande | Effet |
|---|---|---|
| Site | `docker compose --profile caddy down` | conteneurs `front`, `api` et `caddy` arrêtés et supprimés, réseaux `recrutement_edge` et `recrutement_back` supprimés ; volumes gardés (dont `recrutement_data`) |
| Contrôle | `docker compose ps -a` | liste vide |
| Volumes | `docker compose --profile caddy down --volumes` | supprime aussi `recrutement_caddy_data` (autorité locale et certificats), `recrutement_caddy_config` et **`recrutement_data` (la base des candidatures)** : en local seulement, jamais sur le serveur |
| Images | `docker image rm recrutement-front recrutement-api` | images construites supprimées (refaites par `up --build`) |
| Réglages | `rm .env` | |
| Docker | menu de Docker Desktop › « Quit Docker Desktop », ou `osascript -e 'quit app "Docker"'` | |
Sans `--profile caddy`, `down` laisse `caddy` en marche, ports 80 et 443 compris (V16). Après `--volumes`, l'autorité locale est recréée au prochain démarrage : retirer l'ancienne racine du trousseau si elle y avait été ajoutée.

## Avertissements attendus en local
| Message | Cause | Que faire |
|---|---|---|
| « Non sécurisé » / erreur de certificat sur `https://localhost` | certificat signé par l'autorité locale de Caddy, inconnue du système | rien, ou faire confiance à cette autorité (ci-dessous) ; sur le serveur, certificat Let's Encrypt |
| « Not secure » sur `http://127.0.0.1:4180` | cas A, HTTP simple | normal : en production le proxy de l'hôte fait le HTTPS |
| Google : « The OAuth client was not found », `Erreur 401 : invalid_client` | `.env` garde l'identifiant d'exemple `exemple.apps.googleusercontent.com` | normal (la redirection vers Google prouve la protection) ; pour une vraie connexion, voir « Client Google OAuth » |
| `http://localhost` refusé par d'autres projets | HSTS envoyé par Caddy pour `localhost` (1 an) | Chrome : `chrome://net-internals/#hsts`, « Delete domain security policies » pour `localhost` |

### Faire confiance au certificat local de Caddy (macOS, facultatif)
| Étape | Commande |
|---|---|
| Copier la racine | `docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt` |
| L'ajouter au trousseau système | `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./caddy-root.crt` |
| La retirer plus tard | Trousseau d'accès › Système › « Caddy Local Authority - <année> ECC Root » › supprimer |
La racine vit dans le volume `recrutement_caddy_data` : elle change si ce volume est supprimé. Supprimer `caddy-root.crt` du dépôt après usage (fichier non suivi : `deploy.sh` refuse un dépôt avec des fichiers en trop).

## Client Google OAuth pour tester la connexion en local
| Étape | Où | Valeur |
|---|---|---|
| Écran de consentement | console Google Cloud de Yeita, « Écran de consentement OAuth » | type **Interne** (seuls les comptes de l'organisation yeita.fr) |
| Client | « Identifiants » › « ID client OAuth » | type « Application Web » ; URI de redirection autorisée `https://localhost/oauth2/callback` ; un client d'essai distinct du client de production est plus propre |
| `.env` local | `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET` | les valeurs du client ; garder `DOMAIN=localhost`, `OAUTH2_PROXY_REDIRECT_URL=https://localhost/oauth2/callback`, `COMPOSE_PROFILES=caddy` |
| Appliquer | `docker compose up -d --force-recreate` | |
| Vérifier | `https://localhost/candidatures/` | compte @yeita.fr → retour sur l'espace Candidatures ; compte extérieur → page 403 d'oauth2-proxy |
Erreur Google `redirect_uri_mismatch` : l'URI du client ne correspond pas exactement à `OAUTH2_PROXY_REDIRECT_URL`. Les vrais identifiants restent dans `.env` (ignoré par git), jamais ailleurs dans le dépôt. Pour le serveur, URI `https://recrutement.yeita.fr/oauth2/callback` (`deploy/README.md` § 5).

## Voir aussi
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)
- Mode d'emploi du serveur : `deploy/README.md`

## Historique
| Version | Changement |
|---|---|
| 1.1 | Création : démarrage local, cas A et B, avertissements attendus, client Google OAuth d'essai |
| 1.3 | Service `api` (aucun port), équipe par `docker compose exec`, 6e contrôle, volume `recrutement_data` (base) dans `down --volumes` |
