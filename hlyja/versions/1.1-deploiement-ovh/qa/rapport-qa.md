---
type: rapport-qa
version: 1.1
taux: 100
ok: 34
echec: 0
manuel: 2
couches: Unitaire, Intégration, Composant / UI, Bout en bout, Autre
date: 2026-10-26
---

# Rapport QA — Déploiement de l'espace Candidatures sur le serveur OVH

> **Taux de réussite : 100 %** (34/34) après correction de B1 (97 % au premier passage) · 0 échec · 2 à vérifier à la main
> Régressions : aucune (store 48 OK, Playwright 111 OK, shellcheck propre) · Bugs : 1, faible, corrigé (`78dcc37`) : une valeur vide suivie d'un commentaire dans `.env` passait les contrôles de `deploy.sh` (S33)

Code testé : `0f6b61f` (`deploy.sh`, `prepare-serveur.sh`, `check-site.sh`, `compose.yaml`, image `front`). Poste : Docker Desktop, Compose 5.6.1. Banc R23 : Ubuntu 24.04, Docker 29.1.3, Compose 2.40.3, stockage containerd. Les 13 critères sont couverts ; CA8 et CA9 ont été rejoués en entier, CA8 depuis un banc **vierge** (utilisateur `deploy` supprimé, dossiers mis de côté).

## Résultats

| # | Scénario | Résultat | Détail avec la sortie utile |
|---|---|---|---|
| S1 | Image sans fichiers exclus, `.env.bak`/`.env.local` présents | ok | `docker compose build` code 0 ; `docker export` : 44 entrées sous `srv/site/`, aucune de `.env*`, `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `.git`, `hlyja`, `_site`, `tools`, `docs` ; `grep "marqueur-qa\|exemple-a-regenerer"` : rien ; `diff -r` image / `build.py` : identiques ; étiquette `fr.yeita.projet=recrutement` |
| S2 | `build.py` avec copies de `.env` | ok | `ls -A` : `.gitattributes .nojekyll CONTRIBUER.md assets candidatures … yeita-match-kit.html` ; 0 fichier exclu, 0 marqueur |
| S3 | `node tools/test-store.js` | ok | 48 `OK`, 0 `FAIL`, `TOUT OK` |
| S4 | 4 tests Playwright | ok | `e2e-candidatures` 40 OK, `e2e-parcours` 45 OK, `e2e-liens` 19 OK, `e2e-pdf` 7 OK, 4 × `code=0` ; 0 `.env*` dans le `_site` construit alors que `.env.bak`/`.env.local` étaient dans le dépôt |
| S5 | Cas B local, `check-site.sh https://localhost` | ok | 5 `OK`, « Tout est OK sur https://localhost », `code=0` |
| S6 | Matrice via Caddy | ok | `TOTAL ok=38 echec=0` : 17 chemins publics (dont les 9 fichiers de `telechargements/`) en 200, 21 chemins protégés en 302 vers `https://accounts.google.com/o/oauth2/auth?…` (dont `/telechargements/`, `..%2F…`, `/one-pager.html/`, `/.env`, `/.env.bak`, `/.env.example`) |
| S7 | Matrice en direct sur 127.0.0.1:4180 | ok | `TOTAL ok=38 echec=0` (pile cas B, puis encore 38/38 en cas A, S13) |
| S8 | `X-Forwarded-*` forgés | ok | `/candidatures/ -H X-Forwarded-Uri: /one-pager.html -> 302` (Caddy et direct), idem avec `X-Forwarded-Host`/`-Proto`, `/assets/data-diamants.js -H X-Forwarded-Uri: /ping -> 302` |
| S9 | En-têtes et cookie via Caddy | ok | `strict-transport-security: max-age=31536000`, `x-content-type-options: nosniff`, `referrer-policy: same-origin`, `x-frame-options: DENY` sur 200 et 302 ; `set-cookie: _oauth2_proxy_csrf=…; Path=/; Max-Age=900; HttpOnly; Secure; SameSite=Lax` ; `http://localhost/…` → 308 vers HTTPS |
| S10 | Exposition de 4180, profil | ok | `{"4180/tcp":[{"HostIp":"127.0.0.1","HostPort":"4180"}]}`, `lsof` : `127.0.0.1:4180 (LISTEN)` ; sans profil `config --services` = `front`, seul `recrutement-front-1` démarre |
| S11 | Journaux et redémarrage | ok | `/recrutement-front-1 json-file {"max-file":"3","max-size":"10m"} restart=unless-stopped`, idem `/recrutement-caddy-1` |
| S12 | `check-site.sh` en échec | ok | sans argument, `""`, `a b` → `Usage`, code 2 ; `localhost` → « doit commencer par http:// », code 2 ; config sans `one-pager` → `FAIL /one-pager.html → reçu 302`, code 1 ; serveur sans authentification → 3 `FAIL` (`/candidatures/ → reçu 200`), code 1 ; port fermé → 5 `FAIL` (`reçu 000`), code 1 ; `front` arrêté derrière Caddy → 5 `FAIL` (`reçu 502`), code 1 |
| S13 | Variante cas A locale | ok | `COMPOSE_PROFILES=` → services `front` ; seul `recrutement-front-1 127.0.0.1:4180->4180/tcp` ; `check-site.sh http://127.0.0.1:4180` code 0 ; rien sur 443 (`000`) |
| S14 | Exemples du README | ok | nginx 1.27.5, certificat auto-signé : « syntax is ok … test is successful », code 0 ; `caddy validate` exemple : « Valid configuration », code 0 ; `deploy/Caddyfile` avec `DOMAIN=recrutement.yeita.fr` : « Valid configuration » |
| S15 | Cas A réel avec nginx (banc) | ok | nginx de l'hôte (exemple du README, `recrutement.localhost`) : `nginx -t` OK ; `deploy.sh` « Déploiement réussi », code 0 ; matrice via nginx 37/38 : seul `/one-pager.html%00` (cas ajouté, hors CA3) répond **400** de nginx au lieu de 302 — refus, pas d'ouverture ; direct 38/38 ; via nginx les 4 en-têtes et `Set-Cookie … HttpOnly; Secure; SameSite=Lax` |
| S16 | Fin de GitHub Pages | ok | `ls .github` : absent ; `git ls-files` : seul `.env.example` ; `tonParcours: "https://recrutement.yeita.fr/one-pager.html"` ; `.gitignore:5:.env` |
| S17 | Refus de `prepare-serveur.sh` (banc vierge) | ok | 10 cas, tous « état inchangé » (`diff` de `etat.sh`) : sans argument → code 2 ; clé invalide, non root, `docker` absent, 4180 publié par `qa-4180`, 4180 tenu par `busybox` (`ss` cité), `deploy` hors groupe `docker`, `recrutement-x-1 /root/qa/autre`, réseau `qa-reseau (172.30.0.0/16)`, autre origine → code 1 avec « Rien n'a été modifié » |
| S18 | Préparation, seconde exécution | ok | 1re : « Utilisateur deploy créé … Clé SSH ajoutée … Dépôt cloné … /var/backups/recrutement créé (700) », code 0 ; 2e : « présent … Clé SSH déjà autorisée », code 0, « rien n'a changé » (`id`, groupes, `stat`, `sha256sum authorized_keys` identiques) ; `sudo -u deploy git -C /opt/recrutement status` : `main`, propre, code 0 |
| S19 | Déploiement cas B | ok | `Commit en place : 0f6b61f (…)`, `DOMAIN=recrutement.localhost · COMPOSE_PROFILES=caddy`, « Déploiement réussi : 0f6b61f sur https://recrutement.localhost », code 0 (aussi après une préparation neuve et après suppression des conteneurs) |
| S20 | Root, `.env` absent | ok | « à lancer en tant que deploy, pas en root. » ; « /opt/recrutement/.env est absent : copiez .env.example … » ; codes 1 |
| S21 | Lecture du `.env` (12 variantes) | ok | E1 (commentaires, guillemets) déployé, code 0, `docker inspect` : `OAUTH2_PROXY_CLIENT_ID=banc.apps.googleusercontent.com`, `DOMAIN=recrutement.localhost` (sans commentaire ni guillemets) ; E2 cookie d'exemple entre guillemets et E3 identifiant d'exemple + commentaire → « a encore sa valeur d'exemple » ; E4, E5, E6, E10, E11 → `required variable … is missing a value` puis « Compose ne peut pas lire les réglages » ; E7, E8 → « DOMAIN vaut « localhost » » ; E9 et E12 → « OAUTH2_PROXY_REDIRECT_URL vaut … attendu … » ; tous code 1 |
| S22 | Cas A / cas B | ok | `COMPOSE_PROFILES=   # cas A` sans proxy : « Caddy du projet arrêté et supprimé (cas A) », 5 `FAIL`, « ÉCHEC : le contrôle du site échoue », « Pour revenir à la version précédente : deploy/deploy.sh 0f6b61f », code 1 ; avec nginx : code 0 ; retour en cas B : `COMPOSE_PROFILES=caddy`, `caddy` recréé, code 0. Affichage du cas A : `COMPOSE_PROFILES=# cas A` au lieu de « (vide : cas A) » (même cause que S33). Après `78dcc37`, cette écriture est refusée : le cas A s'écrit `COMPOSE_PROFILES=` (vide), déjà essayé en tâche 05 |
| S23 | Cas B avec 80 pris | ok | nginx de l'hôte → « le port 80 est déjà utilisé sur ce serveur : c'est le cas A … » ; `qa-80 -p 80:80` → « le port 80 est publié par un autre conteneur … » ; codes 1, avant `build` |
| S24 | Commits refusés | ok | `a b` → `Usage`, code 2 ; « commit inconnu : deadbeef. » ; « e4a325d est antérieur au déploiement Docker » ; « 21a6979 est antérieur … » ; « 67d6070 n'est pas un commit de main. » ; HEAD reste `0f6b61f` |
| S25 | Dépôt modifié | ok | « le dépôt contient des modifications ou des fichiers en trop (une copie de .env serait publiée) : ?? .env.bak » ; idem `?? .env.local`, ` M README.md` ; codes 1 |
| S26 | `-p recrutement` d'un autre dossier | ok | « des conteneurs du projet Compose « recrutement » viennent d'un autre dossier que /opt/recrutement : recrutement-x-1 /root/qa/autre », code 1 |
| S27 | Configuration modifiée active | ok | commit `82c6cda` (route `^/candidatures\.html$`) : « Déploiement réussi : 82c6cda », `/candidatures.html → 200` |
| S28 | Retour à un commit | ok | `deploy.sh 0f6b61f` : « Dépôt sur 0f6b61f (détaché ; « deploy/deploy.sh » sans argument reprend main) », code 0, `/candidatures.html → 302` ; sans argument ensuite : `main` |
| S29 | Second lancement simultané | ok | « ARRÊT : un déploiement est déjà en cours (verrou /home/deploy/.recrutement-deploy.lock) », code 1, premier encore en cours ; premier code 0 ; troisième lancement code 0. (1er essai avec `sleep 2` : le premier avait déjà fini, d'où une synchronisation sur le journal) |
| S30 | Interruption puis relance | ok | SIGINT pendant la construction de `409a245` : « ÉCHEC : la construction de l'image a échoué » + commande de retour, code 1, arbre propre, site 200 ; relance `deploy.sh 409a245` : code 0, HEAD `409a245` ; SIGINT sans argument (code 130) puis relance : code 0, `main` |
| S31 | Construction en échec | ok | `python:3.12-slim-qa-inexistant: not found` → « ÉCHEC : la construction de l'image a échoué. » + « Pour revenir à la version précédente : deploy/deploy.sh 82c6cda », code 1 ; conteneurs inchangés, site servi (200) ; commande proposée exécutée : code 0, HEAD `82c6cda` |
| S32 | Images non étiquetées gardées | ok | inventaire avant / après : seule `0b9e7732d8df recrutement-front:latest` (étiquetée) supprimée ; `autre`, ses images orphelines non étiquetées, `busybox`, `nginx`, `caddy`, `python`, `oauth2-proxy` gardées |
| S33 | Valeur vide suivie d'un commentaire | ok (après correction) | **Premier passage : echec.** `.env` : `OAUTH2_PROXY_CLIENT_ID=   # à remplir avec l identifiant Google` → « Déploiement réussi : 0f6b61f », code 0 ; `docker inspect` : `OAUTH2_PROXY_CLIENT_ID=# à remplir avec l identifiant Google` ; `Location` : `client_id=%23+%C3%A0+remplir…`. Compose (2.40.3 et 5.6.1) lit `CLE=   # c` comme `# c` ; `deploy.sh` ne le voit pas vide. Voir bug B1. **Rejoué après `78dcc37`** (orchestrateur, banc) : `OAUTH2_PROXY_CLIENT_ID=   # à remplir` → « ARRÊT : OAUTH2_PROXY_CLIENT_ID est vide (seul un commentaire suit le signe =)… », code 1 ; `COMPOSE_PROFILES=   # cas A` → même arrêt, code 1 ; `.env` normal → « Déploiement réussi : 78dcc37 », code 0 |
| S34 | `shellcheck` 0.10.0 | ok | 3 scripts, aucune remarque, code 0 |
| S35 | Connexion Google réelle | manuel | impossible sans client OAuth réel et sans serveur ; voir « À vérifier à la main » |
| S36 | Mise en place sur le serveur OVH | manuel | hors banc par règle (rien sur le serveur) |

## Par couche

| Couche | Scénarios | Réussis | Échoués | Outil |
|---|---|---|---|---|
| Unitaire | S2, S3 | 2 | 0 | `python3 tools/build.py`, `node tools/test-store.js` |
| Intégration | S1, S10, S11, S13, S14, S17, S18, S20–S33 | 21 | 0 (1 au premier passage, S33) | Docker Compose (poste), banc R23 (`prepare-serveur.sh`, `deploy.sh`), `nginx -t`, `caddy validate` |
| Composant / UI | S4 | 1 | 0 | Playwright 1.63.0 (conteneur) |
| Bout en bout | S5–S9, S15, S19 (+ S35, S36 manuels) | 7 | 0 | `tools/check-site.sh`, `curl` (matrice `ca3.sh`), Caddy et nginx devant `front` |
| Autre | S12, S16, S34 | 3 | 0 | `check-site.sh` contre services factices, `git`, `shellcheck` |

## Suite de tests complète

| Commande | Résultat |
|---|---|
| `node tools/test-store.js` | 48 OK, `TOUT OK` |
| `docker run --rm --ipc=host -v "$PWD:/depot:ro" mcr.microsoft.com/playwright/python:v1.63.0-noble bash -c '… for t in e2e-candidatures e2e-parcours e2e-liens e2e-pdf; do python3 tools/$t.py; done'` | 40 + 45 + 19 + 7 = 111 OK, 0 FAIL, 4 codes 0 |
| `python3 tools/build.py <dossier>` (avec `.env.bak`, `.env.local`) | aucun fichier de R17 ni `.env*` |
| `docker compose build` puis `docker export` de l'image | `/srv/site` identique au site construit, aucun fichier exclu |
| `docker compose up -d --build` ; `tools/check-site.sh https://localhost` | code 0 |
| `COMPOSE_PROFILES=` ; `docker compose up -d` ; `tools/check-site.sh http://127.0.0.1:4180` | code 0, `front` seul |
| `ca3.sh https://localhost` / `ca3.sh http://127.0.0.1:4180` | 38/38 et 38/38 |
| `tools/check-site.sh` (4 appels mal formés, 4 sites en défaut) | 4 × code 2, 4 × code 1 |
| `nginx -t` / `caddy validate` (exemples du README, `deploy/Caddyfile`) | succès |
| `docker run --rm -v "$PWD:/m:ro" -w /m koalaman/shellcheck:v0.10.0 deploy/deploy.sh deploy/prepare-serveur.sh tools/check-site.sh` | code 0, aucune remarque |
| Banc : `env RECRUTEMENT_REPO=/srv/depot.git prepare.sh "<clé>"` (10 refus + 2 exécutions) | 10 refus sans modification, 2 × code 0, seconde identique |
| Banc : `sudo -u deploy -H ./deploy/deploy.sh [commit]` (≈ 40 lancements) | tous conformes (S33 après correction) |
| `docker compose --profile caddy down` (poste) ; `.env` local | pile arrêtée, `.env` identique à `.env.example` comme trouvé ; `.env.bak`/`.env.local` retirés ; `git status` propre |
| Banc, remise en état | `main` du dépôt nu = `0f6b61f`, branche `qa-hors-main` supprimée, `/opt/recrutement` sur `main` propre, `.env` du banc d'origine, pile cas B : « Déploiement réussi : 0f6b61f », 2 conteneurs `Up` |

## Bugs trouvés

| Bug | Gravité | Statut | Correction attendue |
|---|---|---|---|
| B1 — Une variable laissée vide avec un commentaire sur la même ligne (`OAUTH2_PROXY_CLIENT_ID=   # à remplir`) est lue par Compose comme la valeur `# à remplir` (comportement de Compose 2.40.3 et 5.6.1, vérifié sur un projet minimal). `deploy.sh` la juge non vide et déploie avec succès (code 0, contrôle OK) un identifiant Google faux ; la panne n'apparaîtrait qu'à la première connexion. Même cause : `COMPOSE_PROFILES=   # cas A` s'affiche `COMPOSE_PROFILES=# cas A` (le cas A est bien appliqué). Reproduction : S33 sur le banc | faible | corrige (`78dcc37`, revérifié par S33) | Dans `deploy.sh`, refuser (« … est vide ou ne contient qu'un commentaire ») toute valeur lue par `docker compose config --environment` qui commence par `#` pour `DOMAIN`, les 4 `OAUTH2_PROXY_*` et `COMPOSE_PROFILES` ; ou au minimum le signaler dans `.env.example` et `deploy/README.md` (« pas de commentaire après une valeur vide ») |

Remarques (pas des bugs, aucun critère en défaut) :
- `check-site.sh` affiche `reçu 000` quand la connexion est impossible : `${code:-aucune réponse}` ne sert jamais, `curl` écrivant `000`. Cosmétique.
- Après une construction en échec (S31), le dépôt reste sur le commit fautif alors que les conteneurs tournent sur l'ancien ; `deploy/oauth2-proxy.cfg` étant monté depuis le dépôt, un redémarrage de `front` (redémarrage du serveur) chargerait la configuration du commit fautif. La commande de retour affichée corrige la situation ; à mentionner dans « Lecture des échecs » du README.
- Un `docker compose -p recrutement down` lancé depuis un autre dossier (fait par le banc pour retirer le conteneur étranger de S26) a supprimé les conteneurs du projet de `/opt/recrutement` : cela confirme l'utilité du refus de R15 ; le déploiement suivant a tout recréé (code 0).
- `CONTRIBUER.md` et `.gitattributes` sont dans `/srv/site` (protégés, 302) ; hors liste de R2, sans conséquence.
- Nettoyage du banc : les images de test (`autre`) et les images orphelines du banc ont été supprimées après les essais (`docker image prune` sans filtre, sur le banc seulement).

## Régressions

Aucune. `test-store.js` (48 OK) et les 4 tests Playwright (111 OK) passent sur la branche, y compris avec des copies de `.env` dans le dépôt ; `shellcheck` sans remarque ; pages non modifiées (seul `assets/config.js` change, conforme à R18).

## À vérifier à la main

- **Connexion Google réelle, sur le serveur** (`https://recrutement.yeita.fr`, client OAuth « Interne ») : avec un compte **@yeita.fr**, `/candidatures/` redirige vers Google sans page intermédiaire puis revient sur la page demandée ; avec un **compte externe** (gmail.com ou autre domaine), refus (page 403 d'oauth2-proxy) ; lien direct vers `/assets/data-diamants.js` → Google ; session expirée (cookie `_oauth2_proxy` supprimé) → nouvelle redirection ; le cookie de session porte `Secure; HttpOnly; SameSite=Lax`.
- **Mise en place sur le serveur OVH** : `ss -ltnp` sur 80/443 et choix du cas, `dig +short recrutement.yeita.fr`, relevé des autres sites avant / après (cas A), certificat réel valide sans `-k`, premier `deploy.sh` puis `tools/check-site.sh https://recrutement.yeita.fr` = 0.
- Pages candidat depuis un navigateur sans session : guide, one-pager, kit, un fichier de `telechargements/` ; leurs liens vers `candidatures/` mènent à Google.
