---
type: spec
version: 1.1
n: 2
statut: brouillon
modules: Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
date: 2026-10-26
---

# Spec v2 — Déploiement de l'espace Candidatures sur le serveur OVH, derrière Google

> Le site statique est servi par oauth2-proxy dans une image Docker ; seules quelques pages sont publiques, le reste exige un compte Google @yeita.fr.
> Changements depuis v1 : `reverse_proxy = false` (faille V15, choix de l'utilisateur), clone possédé par `deploy`, scripts plus prudents (utilisateur existant, ports 80/443, commit de retour), redémarrage automatique, configuration toujours rechargée, protocole de test des scripts, cas A testé (voir challenges/tour-1.md).

## Changements depuis la version précédente
| Retour | Changement |
|---|---|
| S1 | R7 réécrit : `reverse_proxy = false` (V15, arbitrage utilisateur) ; R5 ; CA3 étendu |
| E1 | R16 : clone fait par `deploy`, propriétaire `deploy:deploy`, arrêt si autre propriétaire ; CA8 |
| D1 | R5 : `http_address = "0.0.0.0:4180"` (V19) ; R1 : chemin de montage |
| D3, E4 | R22 : `restart: unless-stopped` ; R15 : vérification de 80/443 en cas B avant `up` ; CA6, CA9 |
| D4 | R15 : `up -d --force-recreate` |
| E2 | R16 : `deploy` existant hors groupe `docker` → arrêt |
| E3 / L4 | R19 : on ne modifie jamais un proxy existant conteneurisé (arbitrage orchestrateur) |
| E7, L9 | R15 : commit de retour validé ; R19 : HEAD détachée expliquée |
| E10 | R15 : `caddy` arrêté quand le profil n'est pas actif (V16) |
| L1 | R23 : protocole de test des scripts |
| L3, L5, L12, L13, S2, S4, S6, E8 | R19 : une phrase chacun |
| L7 | CA13 (cas A en local) |
| L8, S5 | R6 : `.env.example` prêt pour le test local ; R15 refuse les valeurs d'exemple (arbitrage orchestrateur) |
| D6, D9, E9, L6, L10, L11, S3 | R5, R6, R11, R13, R15, R16 : précisions d'une ligne |
| E12 | Hypothèses : stockage d'images |

## Contexte et objectif
L'espace Candidatures est publié aujourd'hui par GitHub Pages, sans authentification, avec des données fictives. Pour l'utiliser avec l'équipe, il doit être servi depuis le serveur OVH de Yeita, réservé aux comptes Google @yeita.fr, tout en laissant publiques les pages destinées aux candidats (guide, one-pager, kit Yeita Match, téléchargements). Le serveur héberge d'autres services inconnus : le déploiement ne doit rien supposer ni rien casser. Les données restent dans le navigateur (décision v1.0, `technique/decisions.md`).

## Utilisateurs et parcours
### Recruteur Yeita
1. Ouvre `https://recrutement.yeita.fr/candidatures/` → redirigé vers Google sans page intermédiaire (V7).
2. Se connecte avec un compte @yeita.fr → revient sur la page demandée. Un autre domaine est refusé (page 403 d'oauth2-proxy).
Cas limites : session expirée → nouvelle redirection ; lien direct vers une grille `assets/data-*.js` → redirection.
### Candidat
Ouvre le guide, `one-pager.html`, `yeita-match-kit.html` ou un fichier de `telechargements/` sans se connecter. Les liens de ces pages vers `candidatures/` mènent à Google (réservé à l'équipe).
### Personne qui déploie (admin du serveur, puis utilisateur `deploy`)
1. Lit `deploy/README.md`, crée l'enregistrement DNS, détermine le cas A ou B.
2. Lance une fois `sudo deploy/prepare-serveur.sh "<clé publique SSH>"`.
3. Crée le client OAuth Google (type « Interne », URI de redirection `https://<DOMAIN>/oauth2/callback`).
4. Crée `/opt/recrutement/.env` depuis `.env.example` et le remplit.
5. Cas A : relève l'état des autres sites, ajoute l'exemple nginx ou Caddy au proxy existant, valide, recharge, relève à nouveau. Cas B : `COMPOSE_PROFILES=caddy`.
6. Lance `deploy/deploy.sh` en tant que `deploy` ; à chaque mise à jour, idem ; en cas de problème, `deploy/deploy.sh <commit>`.
Cas limites : Docker absent, port 4180 pris, sous-réseau pris, `deploy` existant, `.env` absent ou d'exemple, déploiement simultané, commit invalide, ports 80/443 pris en cas B, contrôle en échec, déploiement interrompu.

## Périmètre
### Inclus
Fichiers : `docker/front.Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `deploy/oauth2-proxy.cfg`, `deploy/Caddyfile`, `deploy/prepare-serveur.sh`, `deploy/deploy.sh`, `deploy/README.md`, `tools/check-site.sh` (créés) ; `tools/build.py`, `assets/config.js`, `.gitignore`, `README.md` (modifiés) ; `.github/workflows/pages.yml` (supprimé).
- `[ajout]` second upstream pour `/index.html` (V4, V5) : décision de l'utilisateur.
- `[ajout]` `reverse_proxy = false` au lieu de `true` (V15) : décision de l'utilisateur.
- `[ajout]` `.env` dans `.gitignore` : moyen de tenir « jamais commité ».
- `[ajout]` contrôles de prudence des scripts (sous-réseau, utilisateur existant, ports 80/443 en cas B, commit de retour, valeurs d'exemple) : ils tiennent « ne rien casser ni rien supposer » ; chacun s'arrête sans rien changer.
- `[ajout]` `README.md` (racine) : la section « Publier » décrit GitHub Pages, supprimé ; elle renvoie vers `deploy/README.md`.
### Exclu
Base de données, API, sauvegardes, déploiement automatique, installation de Docker ou du pare-feu, toute exécution sur le serveur, supervision, procédure de retrait du projet, tout changement des pages (dont `assets/yeita.js` `SITE` et la carte « GitHub Pages » de `index.html`), 1.0-1, 1.0-2.

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
| R1 | Image `front` en deux étapes | Construite depuis la racine du dépôt. Étape 1 `python:3.12-slim` : copie du contexte, `python3 tools/build.py /site`. Étape 2 `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5` (V1) : copie de `/site` vers `/srv/site`, étiquette `fr.yeita.projet=recrutement`. Lancée avec `--config=/etc/oauth2-proxy/oauth2-proxy.cfg`, fichier monté en lecture seule depuis `deploy/oauth2-proxy.cfg` |
| R2 | Contenu publié | `/srv/site` ne contient ni `docker/`, `deploy/`, `compose.yaml`, `.dockerignore`, `.env.example` (exclus par `build.py`), ni `.git`, `hlyja`, `_site`, `.env` (exclus du contexte par `.dockerignore`) |
| R3 | Upstreams | `file:///srv/site/#/` et `file:///srv/site/#/index.html` (V4, V5) : `/` et `/index.html` servent le guide en 200 |
| R4 | Chemins publics (liste fermée, regex de chemin ancrées) | `^/$`, `^/index\.html$`, `^/one-pager\.html$`, `^/yeita-match-kit\.html$`, `^/assets/yeita\.css$`, `^/assets/yeita\.js$`, `^/assets/data-yeita-match\.js$`, `^/telechargements/[A-Za-z0-9_-][A-Za-z0-9._-]*$` (V6, V14), plus `/ping` (intégré, V10). Tout autre chemin, y compris `/telechargements/` lui-même, exige une session |
| R5 | Authentification | `http_address = "0.0.0.0:4180"` (V19 ; seule la publication de R8 limite l'exposition), `provider = "google"`, `email_domains = ["yeita.fr"]`, `skip_provider_button = true`, `cookie_secure = true`, `cookie_httponly = true`, `cookie_samesite = "lax"` écrits explicitement (V17) ; durée de session par défaut ; aucune valeur secrète dans le fichier |
| R6 | Secrets | Dans `.env` seulement (racine du dépôt, `chmod 600`, propriétaire `deploy`) : `DOMAIN`, `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET`, `OAUTH2_PROXY_REDIRECT_URL`, `COMPOSE_PROFILES`. Seules les 4 `OAUTH2_PROXY_*` sont passées à `front`, seule `DOMAIN` à `caddy` ; une variable absente fait échouer Compose avec un message. `.env.example` est prêt pour le test local (R21) : `DOMAIN=localhost`, `COMPOSE_PROFILES=caddy`, faux identifiants, cookie secret d'exemple valide (32 caractères) marqué « à régénérer », et la commande `openssl rand -base64 32 \| tr -- '+/' '-_'` |
| R7 | En-têtes de proxy | `reverse_proxy = false` (V15, arbitrage utilisateur) : oauth2-proxy ignore `X-Forwarded-*`, y compris `X-Forwarded-Uri` ; la liste de R4 porte sur le chemin réel. `trusted_proxy_ips = ["172.30.0.0/24"]` reste écrit, sans effet, avec un commentaire qui interdit de repasser `reverse_proxy` à `true` sans réécrire `X-Forwarded-Uri` dans tous les proxys. Le cas A fonctionne quelle que soit l'adresse source (V8 devient sans objet) |
| R8 | Exposition | `front` publie `127.0.0.1:4180:4180`, jamais sur une autre adresse ; réseau `edge` (bridge, sous-réseau 172.30.0.0/24) |
| R9 | Caddyfile (cas B) | Site `{$DOMAIN}`, `reverse_proxy front:4180`, en-têtes `Strict-Transport-Security "max-age=31536000"`, `X-Content-Type-Options nosniff`, `Referrer-Policy same-origin`, `X-Frame-Options DENY`. Les exemples du cas A posent les mêmes en-têtes (nginx : `add_header … always`) |
| R10 | Choix du cas | Profil Compose `caddy` sur le service `caddy` ; actif seulement si `COMPOSE_PROFILES=caddy` dans `.env` (V11). Cas A : `COMPOSE_PROFILES=` vide |
| R11 | Service `caddy` | `caddy:2.11.7` (V2), ports 80, 443 et 443/udp de l'hôte, volumes nommés `caddy_data` et `caddy_config`, Caddyfile monté en lecture seule, certificat automatique |
| R12 | Journaux | Chaque service : pilote `json-file`, `max-size: 10m`, `max-file: "3"`, dans `compose.yaml` ; rien dans la configuration globale de Docker |
| R13 | `tools/check-site.sh BASE_URL` | Contrôles : `/one-pager.html` 200, `/index.html` 200, `/candidatures/` 302 vers `https://accounts.google.com/`, `/assets/data-diamants.js` 302 vers Google, `/ping` 200. Une ligne `OK`/`FAIL` par contrôle ; code 0 si tout passe, 1 sinon, 2 si l'appel est mal formé. `curl --max-time 10` par requête ; connexion impossible = `FAIL`. Certificat non vérifié seulement si l'hôte est `localhost` |
| R14 | Nettoyage | Après `up`, `docker image prune -f --filter label=fr.yeita.projet=recrutement` (V12) ; jamais de `prune` sans ce filtre, ni `system prune`, ni `builder prune` |
| R15 | `deploy/deploy.sh [commit]` | Lancé par `deploy` (refuse root). Lu en entier avant d'agir (il peut être modifié par son propre `git pull`). Verrou `flock` non bloquant sur un fichier hors du dépôt (second lancement refusé, code ≠ 0). Exige `.env` et refuse le cookie secret ou l'identifiant client de `.env.example`. Refuse un arbre de travail modifié. Affiche le commit en place. Sans argument : `git fetch origin`, `git checkout main`, `git pull --ff-only origin main`. Avec un commit : il doit exister, être un ancêtre de `origin/main` et contenir `compose.yaml` et `deploy/deploy.sh`, sinon arrêt avant tout `checkout` ; puis `git checkout --detach`. Profil `caddy` actif : 80 et 443 doivent être libres ou tenus par le `caddy` du projet, sinon arrêt avant `build`. Profil inactif : le `caddy` du projet est arrêté et supprimé s'il existe (V16). Puis `docker compose build --pull`, `docker compose up -d --remove-orphans --force-recreate`, nettoyage (R14), attente de `/ping` sur `127.0.0.1:4180` (60 s max), `tools/check-site.sh https://$DOMAIN` (en cas B, jusqu'à 6 essais espacés de 10 s, le temps du certificat). En cas d'échec : code ≠ 0 et commande exacte de retour au commit précédent. Relancer après une interruption est sûr |
| R16 | `deploy/prepare-serveur.sh "<clé publique>"` | Exige root. Vérifie, sans rien installer : `docker`, `docker compose`, `git`, `flock`, `ss`, `curl` ; arrêt avec message sinon. Port 4180 libre sur toute adresse (`ss`) et parmi les ports publiés par Docker, ou tenu par un conteneur du projet `recrutement`. Sous-réseau 172.30.0.0/24 utilisé par aucun réseau Docker hors projet ni aucune route. Clé validée par `ssh-keygen -l`. Utilisateur `deploy` : créé s'il manque et ajouté au groupe `docker` ; s'il existe hors du groupe `docker`, arrêt sans rien changer ; s'il existe dans le groupe, seule la clé est ajoutée (si absente) à `~deploy/.ssh/authorized_keys`. Dépôt : cloné par `deploy` (`https://github.com/design-cpu/yeita-recrutement.git`) dans `/opt/recrutement` s'il est absent ; s'il existe avec le même `origin` et le propriétaire `deploy`, rien ; sinon arrêt. `/var/backups/recrutement` : mode 700, propriétaire `deploy`. Toutes les vérifications passent avant la première modification. Ne touche ni au pare-feu, ni aux autres services, ni aux ports 80 et 443. Une seconde exécution ne change rien |
| R17 | Publication locale | `tools/build.py` ajoute à `SKIP` : `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `.env.example`. `.dockerignore` : `.git`, `hlyja`, `_site`, `.env` |
| R18 | Fin de GitHub Pages | `.github/workflows/pages.yml` supprimé ; `assets/config.js` : `pagesCandidat.tonParcours = "https://recrutement.yeita.fr/one-pager.html"` |
| R19 | `deploy/README.md` | Dans l'ordre du parcours. **Choix du cas** : `ss -ltnp` sur 80/443 ; nginx ou Caddy sur l'hôte → cas A ; `docker-proxy` ou autre logiciel → ne rien modifier, s'arrêter et faire valider par le responsable du serveur (solution réversible à lui proposer : relier son proxy au réseau du projet, `docker network disconnect` pour revenir) ; rien → cas B. **DNS** avant tout (`dig +short`). **Client OAuth** de type « Interne ». **Cas A** : exemples nginx et Caddy vers `127.0.0.1:4180` avec `Host`, `X-Forwarded-Proto` et les en-têtes de R9 ; certificat par l'outil déjà en place (sinon s'arrêter) ; procédure : relevé des sites et de leur code HTTP, copie du fichier, `nginx -t` ou `caddy validate`, rechargement sans redémarrage, nouveau relevé, retour à la copie au premier écart. **Retour arrière** : `deploy.sh <commit>` laisse le dépôt détaché ; `deploy.sh` sans argument reprend `main`. **Lecture des échecs** : tableau contrôle en échec → cause probable → commande. Rappels : le groupe `docker` vaut root ; HSTS sur `localhost` en test local et comment le purger ; lancer un déploiement long dans `tmux` |
| R20 | Isolation Compose | `name: recrutement` dans `compose.yaml` : conteneurs, réseau et volumes préfixés, `--remove-orphans` limité au projet |
| R21 | Mode test local | `cp .env.example .env` puis `docker compose up -d --build` : cas B, `DOMAIN=localhost` ; `tools/check-site.sh https://localhost` passe. Variante cas A : `COMPOSE_PROFILES=` vide, `tools/check-site.sh http://127.0.0.1:4180` |
| R22 | Redémarrage | Chaque service : `restart: unless-stopped` |
| R23 | Protocole de test des scripts | Conteneur `ubuntu:24.04` privilégié avec `docker.io`, `docker-compose-v2`, `iproute2`, `util-linux`, `openssh-client`, `git`, `curl` (V18) et son propre `dockerd` ; `origin` remplacé par un dépôt nu local dont `main` porte la branche de la version. On y rejoue CA8 et CA9 ; rien n'est lancé sur le serveur |

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
Qui : toute personne pour les chemins de R4 ; comptes Google @yeita.fr d'un client « Interne » pour le reste. Les en-têtes `X-Forwarded-*` ne peuvent pas ouvrir une page (R7). Un compte local du serveur qui appelle `127.0.0.1:4180` subit la même authentification. Aucun secret dans le dépôt (R6) ; déploiement refusé avec les valeurs d'exemple (R15). Données : aucune donnée personnelle côté serveur. Journaux : oauth2-proxy journalise les e-mails connectés ; 30 Mo maximum par service (R12). Conséquence de R7 : les journaux montrent l'adresse du proxy, pas celle du visiteur.

## Déploiement et compatibilité
Mise en place manuelle (R16, R15). Retour arrière : `deploy.sh <commit>`. GitHub Pages cesse d'être mis à jour (R18) ; les liens publics deviennent `https://recrutement.yeita.fr/…`.

## Exploitation
Journaux : `docker compose logs front|caddy`. Santé : `/ping`, `tools/check-site.sh`. Configuration : `deploy/oauth2-proxy.cfg`, `deploy/Caddyfile`, `.env` ; reprise à chaque déploiement (recréation forcée, R15). Redémarrage automatique (R22).

## Critères d'acceptation
- [ ] CA1 — `docker compose build` réussit ; `/srv/site` de l'image ne contient aucun des fichiers exclus par R2.
- [ ] CA2 — En mode test local (R21), `tools/check-site.sh https://localhost` sort avec le code 0.
- [ ] CA3 — Sans session, chaque chemin public de R4 (un fichier de `telechargements/` au moins) répond 200 ; répondent 302 vers Google : `/candidatures/`, `/candidatures/index.html`, `/assets/data-diamants.js`, `/assets/data-employabilite.js`, `/assets/config.js`, `/fiche-ec1.html`, `/telechargements/`, `/telechargements/..%2Fcandidatures%2Findex.html`, `/one-pager.html/`, et `/candidatures/` avec `X-Forwarded-Uri: /one-pager.html`, via Caddy et directement sur 127.0.0.1:4180.
- [ ] CA4 — Via Caddy, les 4 en-têtes de R9 sont présents ; le `Set-Cookie` d'une page protégée porte `Secure; HttpOnly; SameSite=Lax`.
- [ ] CA5 — Le port 4180 n'est publié que sur 127.0.0.1 ; sans profil, `caddy` ne démarre pas.
- [ ] CA6 — `docker inspect` montre la limite de journaux de R12 et `restart: unless-stopped` sur chaque conteneur.
- [ ] CA7 — `check-site.sh` sort avec un code ≠ 0 quand un contrôle échoue (page publique protégée, page protégée publique, service arrêté) et 2 sans argument.
- [ ] CA8 — Selon R23, `prepare-serveur.sh` : s'arrête sans rien changer si Docker manque, si 4180 est pris, si `deploy` existe hors du groupe `docker` ; après préparation, `sudo -u deploy git -C /opt/recrutement status` réussit ; une seconde exécution ne change rien (`id deploy`, `authorized_keys`, `stat` des dossiers identiques).
- [ ] CA9 — Selon R23, `deploy.sh` : déploie et sort avec 0 ; refuse un second lancement simultané, root, un `.env` d'exemple, un commit invalide ou antérieur à la 1.1, un cas B avec 80 pris ; revient à un commit donné ; arrête `caddy` quand le profil est retiré ; une modification de `deploy/oauth2-proxy.cfg` est active après déploiement ; aucune image non étiquetée n'est supprimée.
- [ ] CA10 — `python3 tools/build.py _site` ne publie pas les fichiers de R17 ; `node tools/test-store.js` et les 4 `tools/e2e-*.py` passent.
- [ ] CA11 — `pages.yml` absent ; `assets/config.js` a la nouvelle adresse ; `git ls-files` ne contient pas `.env`.
- [ ] CA12 — Les exemples nginx (avec un certificat auto-signé de test) et Caddy du README passent `nginx -t` et `caddy validate`.
- [ ] CA13 — Variante cas A de R21 : seul `front` démarre et `tools/check-site.sh http://127.0.0.1:4180` sort avec 0.

## Hypothèses et questions ouvertes
- Le serveur est un Linux avec `ss`, `flock`, `useradd` (Debian ou Ubuntu).
- Le client OAuth Google est créé par Yeita (hors dépôt).
- Le dépôt reste public (clone en HTTPS sans identifiant).
- Le nettoyage par étiquette est vérifié avec le stockage classique (V12) ; le README dit de contrôler `docker info` (Storage Driver).

## Améliorations possibles
- Durée de session plus courte (S3) : choix produit, proposé au backlog.
