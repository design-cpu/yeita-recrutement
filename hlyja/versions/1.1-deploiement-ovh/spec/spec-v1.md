---
type: spec
version: 1.1
n: 1
statut: brouillon
modules: Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
date: 2026-10-26
---

# Spec v1 — Déploiement de l'espace Candidatures sur le serveur OVH, derrière Google

> Le site statique est servi par oauth2-proxy dans une image Docker ; seules quelques pages sont publiques, le reste exige un compte Google @yeita.fr.
> Le serveur est partagé : port 4180 sur 127.0.0.1 seulement, un reverse proxy existant (cas A) ou un Caddy du projet (cas B), aucun effet sur les autres services.

## Contexte et objectif
L'espace Candidatures est publié aujourd'hui par GitHub Pages, sans authentification, avec des données fictives. Pour l'utiliser avec l'équipe, il doit être servi depuis le serveur OVH de Yeita, réservé aux comptes Google @yeita.fr, tout en laissant publiques les pages destinées aux candidats (guide, one-pager, kit Yeita Match, téléchargements). Le serveur héberge d'autres services inconnus : le déploiement ne doit rien supposer ni rien casser. Les données restent dans le navigateur (décision v1.0, `technique/decisions.md`).

## Utilisateurs et parcours
### Recruteur Yeita
1. Ouvre `https://recrutement.yeita.fr/candidatures/` → redirigé vers Google (sans page intermédiaire, `skip_provider_button`) (V7).
2. Se connecte avec un compte @yeita.fr → revient sur la page demandée. Un autre domaine est refusé par oauth2-proxy (page d'erreur 403 d'oauth2-proxy).
Cas limites : session expirée → nouvelle redirection ; lien direct vers une grille `assets/data-*.js` → redirection.
### Candidat
Ouvre le guide, `one-pager.html`, `yeita-match-kit.html` ou un fichier de `telechargements/` sans se connecter. Les liens de ces pages vers `candidatures/` mènent à Google (normal : réservé à l'équipe).
### Personne qui déploie (admin du serveur, puis utilisateur `deploy`)
1. Lit `deploy/README.md`, détermine le cas A ou B (`ss -ltnp` sur 80 et 443).
2. Lance une fois `sudo deploy/prepare-serveur.sh "<clé publique SSH>"`.
3. Crée `/opt/recrutement/.env` depuis `.env.example`.
4. Cas A : ajoute l'exemple nginx ou Caddy au proxy existant, avec la procédure prudente. Cas B : `COMPOSE_PROFILES=caddy`.
5. Lance `deploy/deploy.sh` en tant que `deploy` ; à chaque mise à jour, idem ; en cas de problème, `deploy/deploy.sh <commit>`.
Cas limites : Docker absent, port 4180 pris, `.env` absent, déploiement lancé deux fois en même temps, contrôle du site en échec.

## Périmètre
### Inclus
Fichiers : `docker/front.Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `deploy/oauth2-proxy.cfg`, `deploy/Caddyfile`, `deploy/prepare-serveur.sh`, `deploy/deploy.sh`, `deploy/README.md`, `tools/check-site.sh` (créés) ; `tools/build.py`, `assets/config.js`, `.gitignore`, `README.md` (modifiés) ; `.github/workflows/pages.yml` (supprimé).
- `[ajout]` second upstream pour `/index.html` (V4, V5) : décision de l'utilisateur.
- `[ajout]` `.env` dans `.gitignore` : moyen de tenir « jamais commité ».
- `[ajout]` `prepare-serveur.sh` vérifie que le sous-réseau 172.30.0.0/24 n'est pas déjà utilisé : un conflit d'adresses casserait un autre service ou le nôtre ; s'arrête sans rien changer.
- `[ajout]` `README.md` (racine) : la section « Publier » décrit GitHub Pages, supprimé ; elle renvoie vers `deploy/README.md`.
### Exclu
Base de données, API, sauvegardes, déploiement automatique, installation de Docker ou du pare-feu, toute exécution sur le serveur, tout changement des pages (dont `assets/yeita.js` `SITE` et la carte « GitHub Pages » de `index.html`), 1.0-1, 1.0-2.

## Existant réutilisé
| Besoin | Décision | Élément | Référentiel |
|---|---|---|---|
| Construire le site | étendre (`SKIP`) | `tools/build.py` | [Conventions](../../../technique/conventions.md#publication) |
| Servir et protéger | créer (aucun serveur dans le dépôt) | oauth2-proxy `v7.15.5` (V1) | [Décisions](../../../technique/decisions.md) |
| HTTPS cas B | créer | `caddy:2.11.7` (V2) | — |
| Non-régression | réutiliser | `tools/test-store.js`, `tools/e2e-*.py` | [Conventions](../../../technique/conventions.md#tests) |

## Règles et comportements
| # | Règle | Détail / valeurs |
|---|---|---|
| R1 | Image `front` en deux étapes | Étape 1 `python:3.12-slim` : copie du contexte, `python3 tools/build.py /site`. Étape 2 `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5` (V1) : copie de `/site` vers `/srv/site`, étiquette `fr.yeita.projet=recrutement`. Lancée avec `--config` sur `deploy/oauth2-proxy.cfg` monté en lecture seule |
| R2 | Contenu publié | `/srv/site` ne contient ni `docker/`, `deploy/`, `compose.yaml`, `.dockerignore`, `.env.example` (exclus par `build.py`), ni `.git`, `hlyja`, `_site`, `.env` (exclus du contexte par `.dockerignore`) |
| R3 | Upstreams | `file:///srv/site/#/` et `file:///srv/site/#/index.html` (V4, V5) : `/` et `/index.html` servent le guide en 200 |
| R4 | Chemins publics (liste fermée, regex de chemin ancrées) | `^/$`, `^/index\.html$`, `^/one-pager\.html$`, `^/yeita-match-kit\.html$`, `^/assets/yeita\.css$`, `^/assets/yeita\.js$`, `^/assets/data-yeita-match\.js$`, `^/telechargements/[A-Za-z0-9_-][A-Za-z0-9._-]*$` (V6, V14), plus `/ping` (intégré, V10). Tout autre chemin, y compris `/telechargements/` lui-même, exige une session |
| R5 | Authentification | `provider = "google"`, `email_domains = ["yeita.fr"]`, `skip_provider_button = true`, cookie `Secure` et `HttpOnly` (valeurs par défaut, V7), aucune valeur secrète dans le fichier |
| R6 | Secrets | Dans `.env` seulement (racine du dépôt, `chmod 600`, propriétaire `deploy`) : `DOMAIN`, `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET`, `OAUTH2_PROXY_REDIRECT_URL`, `COMPOSE_PROFILES`. `.env.example` : valeurs d'exemple et `openssl rand -base64 32 \| tr -- '+/' '-_'` pour le cookie secret. Seules les 4 variables `OAUTH2_PROXY_*` sont passées à `front`, seule `DOMAIN` à `caddy` |
| R7 | Proxys de confiance | `reverse_proxy = true`, `trusted_proxy_ips = ["172.30.0.0/24"]` (V9). Cas A : un proxy de l'hôte qui appelle `127.0.0.1:4180` arrive depuis 172.30.0.1 (V8). Un proxy lui-même conteneurisé doit être en `network_mode: host` (consigne du README) |
| R8 | Exposition | `front` publie `127.0.0.1:4180:4180`, jamais sur une autre adresse ; réseau `edge` (bridge, sous-réseau 172.30.0.0/24) |
| R9 | Caddyfile (cas B) | Site `{$DOMAIN}`, `reverse_proxy front:4180`, en-têtes `Strict-Transport-Security "max-age=31536000"`, `X-Content-Type-Options nosniff`, `Referrer-Policy same-origin`, `X-Frame-Options DENY`. Les exemples du cas A posent les mêmes en-têtes |
| R10 | Choix du cas | Profil Compose `caddy` sur le service `caddy` ; actif seulement si `COMPOSE_PROFILES=caddy` dans `.env` (V11). Cas A : `COMPOSE_PROFILES=` vide |
| R11 | Service `caddy` | `caddy:2.11.7` (V2), ports 80 et 443 de l'hôte, volumes nommés `caddy_data` et `caddy_config`, Caddyfile monté en lecture seule, certificat automatique |
| R12 | Journaux | Chaque service : pilote `json-file`, `max-size: 10m`, `max-file: "3"`, dans `compose.yaml` ; rien dans la configuration globale de Docker |
| R13 | `tools/check-site.sh BASE_URL` | Contrôles : `/one-pager.html` 200, `/index.html` 200, `/candidatures/` 302 vers `https://accounts.google.com/`, `/assets/data-diamants.js` 302 vers Google, `/ping` 200. Une ligne `OK`/`FAIL` par contrôle ; code de sortie 0 si tout passe, 1 sinon, 2 si l'appel est mal formé. Certificat non vérifié seulement si l'hôte est `localhost` (certificat local de Caddy) |
| R14 | Nettoyage | Après `up`, `docker image prune -f --filter label=fr.yeita.projet=recrutement` (V12) ; jamais de `prune` sans ce filtre, ni `system prune`, ni `builder prune` |
| R15 | `deploy/deploy.sh [commit]` | Lancé par `deploy` (refuse root) ; verrou `flock` non bloquant (second lancement refusé, code ≠ 0) ; exige `.env` ; refuse un arbre de travail modifié. Sans argument : `git fetch` puis `git checkout main` et `git pull --ff-only`. Avec un commit : `git checkout --detach <commit>` (commit vérifié avant). Puis `docker compose build --pull`, `docker compose up -d --remove-orphans`, nettoyage (R14), attente de `/ping` sur `127.0.0.1:4180` (60 s max), `tools/check-site.sh https://$DOMAIN`. Affiche le commit précédent pour revenir en arrière. Code ≠ 0 si une étape échoue. Le script est lu en entier avant d'agir (il peut être modifié par son propre `git pull`) |
| R16 | `deploy/prepare-serveur.sh "<clé publique>"` | Exige root. Vérifie, sans rien installer : `docker`, `docker compose`, `git`, `flock`, `ss` ; s'arrête avec un message sinon. Vérifie que 127.0.0.1:4180 est libre ou tenu par le projet `recrutement` ; que 172.30.0.0/24 n'est utilisé par aucun réseau Docker hors projet ni aucune route `[ajout]`. Crée l'utilisateur `deploy` s'il manque, l'ajoute au groupe `docker`, ajoute la clé à `~deploy/.ssh/authorized_keys` si absente (clé validée par `ssh-keygen -l`). Clone `https://github.com/design-cpu/yeita-recrutement.git` dans `/opt/recrutement` s'il est absent ; s'il existe avec le même `origin`, ne fait rien ; sinon s'arrête. Crée `/var/backups/recrutement` (mode 700, propriétaire `deploy`). Ne touche ni au pare-feu, ni aux autres services, ni aux ports 80 et 443. Une seconde exécution ne change rien |
| R17 | Publication locale | `tools/build.py` ajoute à `SKIP` : `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `.env.example`. `.dockerignore` : `.git`, `hlyja`, `_site`, `.env` |
| R18 | Fin de GitHub Pages | `.github/workflows/pages.yml` supprimé ; `assets/config.js` : `pagesCandidat.tonParcours = "https://recrutement.yeita.fr/one-pager.html"` |
| R19 | `deploy/README.md` | Prérequis, choix du cas A/B, préparation, `.env`, client OAuth Google (URI de redirection `https://<DOMAIN>/oauth2/callback`), déploiement, retour arrière, contrôle, journaux. Cas A : exemple nginx et exemple Caddy vers `127.0.0.1:4180` avec `Host` et `X-Forwarded-Proto` et les en-têtes de R9 ; procédure : copie du fichier existant, `nginx -t` ou `caddy validate`, rechargement (`systemctl reload` / `nginx -s reload`, `caddy reload`), contrôle des autres sites, retour à la copie si l'un ne répond plus. Rappelle que le groupe `docker` donne des droits équivalents à root |
| R20 | Isolation Compose | `name: recrutement` dans `compose.yaml` : conteneurs, réseau et volumes préfixés, `--remove-orphans` limité au projet |
| R21 | Mode test local | Cas B, `DOMAIN=localhost`, `COMPOSE_PROFILES=caddy`, faux identifiants, `OAUTH2_PROXY_REDIRECT_URL=https://localhost/oauth2/callback` ; `tools/check-site.sh https://localhost` passe |

## Architecture technique
```mermaid
flowchart LR
  N[Navigateur] -->|HTTPS| P{Cas A : proxy de l'hôte\nCas B : caddy}
  P -->|127.0.0.1:4180 ou front:4180| F[front : oauth2-proxy]
  F -->|session @yeita.fr ou chemin public| S[/srv/site]
  F -->|sinon| G[Google]
```
Alternatives écartées par le pitch : serveur web séparé derrière oauth2-proxy, GitHub Pages.

## Sécurité et conformité
Qui : toute personne pour les chemins de R4 ; comptes Google @yeita.fr pour le reste. Aucun secret dans le dépôt (R6). Données : aucune donnée personnelle côté serveur (navigateur seulement). Journaux : oauth2-proxy journalise les e-mails connectés ; limités à 30 Mo par service (R12).

## Déploiement et compatibilité
Mise en place manuelle (R16, R15). Retour arrière : `deploy.sh <commit>`. GitHub Pages cesse d'être mis à jour (R18) ; les liens publics deviennent `https://recrutement.yeita.fr/…`.

## Exploitation
Journaux : `docker compose logs front|caddy`. Santé : `/ping`, `tools/check-site.sh`. Configuration : `deploy/*.cfg`, `deploy/Caddyfile`, `.env`.

## Critères d'acceptation
- [ ] CA1 — `docker compose build` réussit ; `/srv/site` de l'image ne contient aucun des fichiers exclus par R2.
- [ ] CA2 — En mode test local (R21), `tools/check-site.sh https://localhost` sort avec le code 0.
- [ ] CA3 — Sans session, chaque chemin public de R4 (un fichier de `telechargements/` au moins) répond 200 ; répondent 302 vers Google : `/candidatures/`, `/candidatures/index.html`, `/assets/data-diamants.js`, `/assets/data-employabilite.js`, `/assets/config.js`, `/fiche-ec1.html`, `/telechargements/`, `/telechargements/..%2Fcandidatures%2Findex.html`, `/one-pager.html/`.
- [ ] CA4 — Via Caddy, les 4 en-têtes de R9 sont présents.
- [ ] CA5 — Le port 4180 n'est publié que sur 127.0.0.1 ; sans profil, `caddy` ne démarre pas.
- [ ] CA6 — `docker inspect` montre la limite de journaux de R12 sur chaque conteneur.
- [ ] CA7 — `check-site.sh` sort avec un code ≠ 0 quand un contrôle échoue (page publique protégée, page protégée publique, service arrêté).
- [ ] CA8 — `prepare-serveur.sh` : s'arrête sans rien changer si Docker manque ou si 4180 est pris ; une seconde exécution ne change rien.
- [ ] CA9 — `deploy.sh` : déploie, refuse un second lancement simultané, revient à un commit donné, ne supprime aucune image non étiquetée.
- [ ] CA10 — `python3 tools/build.py _site` ne publie pas les fichiers de R17 ; `node tools/test-store.js` et les 4 `tools/e2e-*.py` passent.
- [ ] CA11 — `pages.yml` absent ; `assets/config.js` a la nouvelle adresse ; aucun secret suivi par git.
- [ ] CA12 — Les exemples nginx et Caddy du README passent `nginx -t` et `caddy validate`.

## Hypothèses et questions ouvertes
- Le serveur est un Linux avec `ss`, `flock`, `useradd` (Debian ou Ubuntu).
- Le client OAuth Google est créé par Yeita (hors dépôt).
- Le dépôt reste public (clone en HTTPS sans identifiant).
