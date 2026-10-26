---
type: plan-de-test
version: 1.1
scenarios: 36
date: 2026-10-26
---

# Plan de test — Déploiement de l'espace Candidatures sur le serveur OVH

> 36 scénarios couvrant 13 critères d'acceptation · Unitaire, Intégration, Composant / UI, Bout en bout, Autre · 34 automatisés, 2 manuels

Code testé : commit `0f6b61f` (branche `version/1.1-deploiement-ovh`, `HEAD` = `212f373` ne change que `hlyja/`). Aucun nouveau test n'est ajouté au projet : chaque scénario est une suite de commandes, notée dans le rapport. Contrôle automatique du projet : `tools/check-site.sh`. Banc des scripts : conteneur `banc` (R23).

## Matrice

| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Accessibilité | Autre |
|---|---|---|---|---|---|---|
| CA1 — image construite, `/srv/site` sans fichiers exclus | | S1 | | | | |
| CA2 — `check-site.sh https://localhost` = 0 | | | | S5 | | |
| CA3 — chemins publics 200, protégés 302 (Caddy et direct, `X-Forwarded-Uri`) | | | | S6, S7, S8, S15, S35 | | |
| CA4 — en-têtes R9, cookie `Secure; HttpOnly; SameSite=Lax` | | | | S9, S15 | | |
| CA5 — 4180 sur 127.0.0.1 seulement, pas de `caddy` sans profil | | S10 | | | | |
| CA6 — journaux 10m×3, `unless-stopped` | | S11 | | | | |
| CA7 — `check-site.sh` ≠ 0 en échec, 2 sans argument | | | | | | S12 |
| CA8 — `prepare-serveur.sh` : refus sans rien changer, seconde exécution identique | | S17, S18 | | | | S34 |
| CA9 — `deploy.sh` : déploiement, refus, interruption, retour, simultané | | S20–S33 | | S19, S36 | | S34 |
| CA10 — `build.py`, `test-store.js`, 4 `e2e-*.py` | S2, S3 | | S4 | | | |
| CA11 — `pages.yml` absent, `config.js`, `.env` non suivi | | | | | | S16 |
| CA12 — exemples nginx et Caddy du README valides | | S14 | | S15, S36 | | |
| CA13 — variante cas A en local | | S13 | | | | |

## Couches écartées

| Couche | Raison |
|---|---|
| Accessibilité | Aucune page ni aucun composant d'interface n'est modifié par la 1.1 (pages hors périmètre) ; la non-régression visuelle et fonctionnelle des pages est couverte par les 4 tests Playwright existants (S4). |

## Scénarios

| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | Image `front` construite avec `.env.bak` et `.env.local` présents : `/srv/site` sans fichiers exclus ni contenu de `.env` | CA1 | Intégration | oui |
| S2 | `tools/build.py` avec `.env.bak`/`.env.local` présents : rien de R17 ni aucun `.env*` publié | CA10 | Unitaire | oui |
| S3 | `node tools/test-store.js` | CA10 | Unitaire | oui |
| S4 | 4 tests Playwright `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` | CA10 | Composant / UI | oui |
| S5 | Pile locale cas B (`docker compose up -d --build`) puis `check-site.sh https://localhost` | CA2 | Bout en bout | oui |
| S6 | Matrice des chemins publics / protégés via Caddy (`https://localhost`) | CA3 | Bout en bout | oui |
| S7 | Même matrice en direct sur `http://127.0.0.1:4180` | CA3 | Bout en bout | oui |
| S8 | `X-Forwarded-Uri` (et `X-Forwarded-Host`/`-Proto`) forgés sur une page protégée | CA3 | Bout en bout | oui |
| S9 | En-têtes de sécurité et attributs du cookie via Caddy | CA4 | Bout en bout | oui |
| S10 | Publication de 4180 ; services sans profil | CA5 | Intégration | oui |
| S11 | `docker inspect` : journaux et redémarrage de chaque conteneur | CA6 | Intégration | oui |
| S12 | `check-site.sh` face à : page publique protégée, page protégée publique, service arrêté, appel mal formé | CA7 | Autre | oui |
| S13 | Variante cas A locale : `front` seul, `check-site.sh http://127.0.0.1:4180` | CA13 | Intégration | oui |
| S14 | `nginx -t` (certificat auto-signé) et `caddy validate` sur les exemples extraits du README, plus `deploy/Caddyfile` | CA12 | Intégration | oui |
| S15 | Cas A réel sur le banc : nginx de l'hôte avec l'exemple du README devant `front`, déploiement, matrice et en-têtes | CA12, CA3, CA4 | Bout en bout | oui |
| S16 | `pages.yml` absent, `assets/config.js`, `git ls-files`, `.gitignore` | CA11 | Autre | oui |
| S17 | `prepare-serveur.sh` : 10 cas de refus sur un banc vierge, état comparé avant / après | CA8 | Intégration | oui |
| S18 | Préparation complète, seconde exécution, `git status` en `deploy` | CA8 | Intégration | oui |
| S19 | `deploy.sh` cas B sur le banc : code 0, commit, `DOMAIN` et profil affichés | CA9 | Bout en bout | oui |
| S20 | Refus : root, `.env` absent | CA9 | Intégration | oui |
| S21 | `.env` : commentaires de fin de ligne, guillemets, variables vides ou absentes, valeurs d'exemple, `localhost`, URL de retour incohérente | CA9 | Intégration | oui |
| S22 | Cas A et cas B détectés ; `caddy` retiré quand le profil est vidé ; commande de retour en cas d'échec du contrôle | CA9 | Intégration | oui |
| S23 | Cas B refusé quand 80 est tenu par un proxy de l'hôte ou publié par un autre conteneur | CA9 | Intégration | oui |
| S24 | Commits refusés : inconnu, sans `compose.yaml`, sans `deploy/deploy.sh`, hors `main` ; usage | CA9 | Intégration | oui |
| S25 | Dépôt modifié refusé : `.env.bak`, `.env.local` non suivis, fichier suivi modifié | CA9 | Intégration | oui |
| S26 | Conteneur lancé avec `-p recrutement` depuis un autre dossier | CA9 | Intégration | oui |
| S27 | Modification de `deploy/oauth2-proxy.cfg` sur `main` active après déploiement | CA9 | Intégration | oui |
| S28 | Retour à un commit donné (HEAD détachée) puis reprise de `main` | CA9 | Intégration | oui |
| S29 | Second lancement simultané refusé, le premier aboutit | CA9 | Intégration | oui |
| S30 | Interruption (SIGINT) pendant la construction puis relance, avec et sans commit | CA9 | Intégration | oui |
| S31 | Construction en échec : message, commande de retour exacte, site maintenu, commande de retour exécutée | CA9 | Intégration | oui |
| S32 | Nettoyage : seules les images étiquetées sont supprimées | CA9 | Intégration | oui |
| S33 | Valeur vide suivie d'un commentaire (`CLE=   # …`) dans `.env` | CA9 | Intégration | oui |
| S34 | `shellcheck` 0.10.0 sur les 3 scripts | CA8, CA9 | Autre | oui |
| S35 | Vraie connexion Google : compte @yeita.fr (retour sur la page demandée), compte externe (403), session expirée | CA3 | Bout en bout | non |
| S36 | Sur le serveur OVH : choix du cas, DNS, certificat réel, autres sites inchangés, premier `deploy.sh` | CA9, CA12 | Bout en bout | non |

## Détail des scénarios

Notations : `D` = racine du dépôt local ; `QA` = `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/75d2e0ba-f6dc-4d23-9ef6-c01c80dcb864/scratchpad/qa` ; `export PATH=$HOME/.docker/bin:$PATH`. Sur le banc, `dep.sh [args]` = `cd /opt/recrutement && sudo -u deploy -H ./deploy/deploy.sh [args]` avec le code de sortie ; `etat.sh` = instantané (`id deploy`, groupes, `stat` de `/opt/recrutement`, `/var/backups/recrutement`, `~deploy`, `~deploy/.ssh`, `authorized_keys`, `sha256sum`, HEAD, conteneurs, réseaux, routes).

### S1 — Image sans fichiers exclus, copies de `.env` présentes
Préconditions : `D/.env` = copie de `.env.example` ; `cp .env .env.bak && cp .env .env.local`, avec une ligne marqueur `SECRET_QA=marqueur-qa-envbak` dans `.env.bak`.
Étapes : `docker compose build` ; `docker create recrutement-front` ; `docker export | tar -t` ; extraction et `grep -r "marqueur-qa\|exemple-a-regenerer"` ; `diff -r` avec le site construit en S2.
Attendu : build code 0 ; aucun chemin `srv/site/{.env*,docker,deploy,compose.yaml,.dockerignore,.git,hlyja,_site,tools,docs}` ; aucun marqueur ; étiquette `fr.yeita.projet=recrutement`.

### S2 — `build.py` sans fichiers de R17
Préconditions : celles de S1.
Étapes : `python3 tools/build.py QA/site-local` ; `ls -A` ; `find` des noms exclus ; `grep -r marqueur-qa`.
Attendu : ni `docker/`, `deploy/`, `compose.yaml`, `.dockerignore`, `.env.example`, `.env`, `.env.bak`, `.env.local`.

### S3 — Règles du parcours
Étapes : `node tools/test-store.js`.
Attendu : `TOUT OK`, aucun `FAIL`.

### S4 — Tests Playwright existants
Préconditions : `.env.bak`, `.env.local` encore présents (le site construit dans le conteneur ne doit pas les publier).
Étapes : la commande `docker run … playwright/python:v1.63.0-noble …` de `conventions.md`, avec le compte des `.env*` du `_site` construit.
Attendu : 4 codes 0, aucun `FAIL` ; 0 fichier `.env*` dans `_site`.

### S5 — Mode test local cas B
Étapes : `docker compose up -d --build` ; `tools/check-site.sh https://localhost`.
Attendu : `caddy` et `front` démarrés ; 5 `OK`, code 0.

### S6 — Matrice via Caddy
Étapes : `QA/ca3.sh https://localhost` (curl `-sk --path-as-is`) sur : `/`, `/index.html`, `/one-pager.html`, `/yeita-match-kit.html`, `/assets/yeita.css`, `/assets/yeita.js`, `/assets/data-yeita-match.js`, `/ping`, les 9 fichiers de `telechargements/` (200 attendu) ; `/candidatures/`, `/candidatures/index.html`, `/assets/data-diamants.js`, `/assets/data-employabilite.js`, `/assets/config.js`, `/fiche-ec1.html`, `/telechargements/`, `/telechargements/..%2Fcandidatures%2Findex.html`, `/one-pager.html/`, plus `/CONTRIBUER.md`, `/.gitattributes`, `/index.htmlx`, `/one-pager.html%00`, `/.env`, `/.env.example`, `/.env.bak`, `/compose.yaml`, `/deploy/oauth2-proxy.cfg` (302 vers `https://accounts.google.com/` attendu).
Attendu : 38/38.

### S7 — Matrice en direct
Étapes : `QA/ca3.sh http://127.0.0.1:4180`.
Attendu : 38/38.

### S8 — En-têtes de proxy forgés
Étapes : dans S6 et S7, `/candidatures/` avec `X-Forwarded-Uri: /one-pager.html`, puis avec `X-Forwarded-Host` et `X-Forwarded-Proto` en plus ; `/assets/data-diamants.js` avec `X-Forwarded-Uri: /ping`.
Attendu : 302 vers Google à chaque fois.

### S9 — En-têtes et cookie
Étapes : `curl -skI https://localhost/one-pager.html` ; `curl -sk -D - https://localhost/candidatures/` ; `curl -sI http://localhost/one-pager.html`.
Attendu : `Strict-Transport-Security: max-age=31536000`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY` sur les deux réponses ; `Set-Cookie … HttpOnly; Secure; SameSite=Lax` ; HTTP redirigé vers HTTPS.

### S10 — Exposition
Étapes : `docker inspect recrutement-front-1 --format '{{json .HostConfig.PortBindings}}'`, `docker port`, `lsof -iTCP:4180` ; en S13 : `docker compose config --services` et `docker ps`.
Attendu : seulement `127.0.0.1:4180` ; sans profil, un seul service `front` et aucun conteneur `caddy`.

### S11 — Journaux et redémarrage
Étapes : `docker inspect <c> --format '{{.HostConfig.LogConfig.Type}} {{json .HostConfig.LogConfig.Config}} {{.HostConfig.RestartPolicy.Name}}'` pour les 2 conteneurs.
Attendu : `json-file {"max-file":"3","max-size":"10m"} unless-stopped`.

### S12 — `check-site.sh` en échec
Étapes : sans argument, `""`, `localhost`, `a b` ; oauth2-proxy lancé à part avec une copie de la configuration sans la ligne `one-pager` (port 14181) ; `python -m http.server` sur le site construit (port 14182) ; port fermé (14199) ; `docker compose stop front` derrière Caddy.
Attendu : code 2 pour les 4 appels mal formés ; code 1 avec la ligne `FAIL` du contrôle concerné dans les 4 autres cas.

### S13 — Variante cas A locale
Étapes : `docker compose --profile caddy down` ; `COMPOSE_PROFILES=` dans `.env` ; `docker compose up -d` ; `tools/check-site.sh http://127.0.0.1:4180` ; `QA/ca3.sh http://127.0.0.1:4180` ; puis `.env` restauré et pile arrêtée.
Attendu : seul `front` ; code 0 ; 38/38 ; rien sur 443.

### S14 — Exemples du README
Étapes : extraction des blocs entre `<!-- exemple-nginx -->` et `<!-- exemple-caddy -->` ; `nginx:1.27.5` avec un certificat auto-signé dans `/etc/letsencrypt/live/recrutement.yeita.fr/` puis `nginx -t` ; `caddy:2.11.7 caddy validate --adapter caddyfile` sur l'exemple et sur `deploy/Caddyfile` (`DOMAIN=recrutement.yeita.fr`).
Attendu : « test is successful », « Valid configuration », codes 0.

### S15 — Cas A de bout en bout avec nginx (banc)
Préconditions : banc préparé (S18), `.env` du banc avec `COMPOSE_PROFILES=` ; exemple nginx du README avec `recrutement.localhost` et un certificat auto-signé.
Étapes : `docker run -d --network host nginx:1.27.5` (configuration montée) ; `nginx -t` ; `dep.sh` ; `ca3.sh https://recrutement.localhost` et `ca3.sh http://127.0.0.1:4180` ; en-têtes de `/candidatures/`.
Attendu : déploiement code 0 ; matrice conforme ; 4 en-têtes et cookie conformes.

### S16 — Fin de GitHub Pages
Étapes : `ls .github` ; `git ls-files | grep -E '^\.github|pages\.yml|(^|/)\.env'` ; `grep tonParcours assets/config.js` ; `git check-ignore -v .env`.
Attendu : pas de `.github` ; seul `.env.example` suivi ; `https://recrutement.yeita.fr/one-pager.html` ; `.env` ignoré.

### S17 — Refus de la préparation
Préconditions : pile du banc arrêtée ; `/opt/recrutement`, `/var/backups/recrutement`, `~deploy` mis de côté ; `userdel -r deploy` ; script copié depuis `git show 0f6b61f:deploy/prepare-serveur.sh`.
Étapes, chacune encadrée par `etat.sh` et un `diff` : sans argument ; clé invalide ; non root (`sudo -u nobody`) ; `docker` absent (`PATH` sans `docker`) ; 4180 publié par un conteneur `busybox` ; 4180 tenu par un processus de l'hôte (`busybox httpd -p 127.0.0.1:4180`) ; `deploy` créé hors du groupe `docker` ; conteneur d'un projet Compose `-p recrutement` lancé depuis `/root/qa/autre` ; réseau Docker `172.30.0.0/16` ; après préparation, `RECRUTEMENT_REPO` d'une autre origine.
Attendu : code ≠ 0, message précis, « Rien n'a été modifié », état identique.

### S18 — Préparation et seconde exécution
Étapes : `env RECRUTEMENT_REPO=/srv/depot.git prepare.sh "$(cat /root/cle-test.pub)"` deux fois, `etat.sh` après chacune, `diff` ; `sudo -u deploy git -C /opt/recrutement status`.
Attendu : codes 0 ; utilisateur dans `docker`, dossiers `deploy:deploy` (755 / 700), clé ajoutée une fois ; la seconde exécution ne change rien ; `git status` propre sur `main`.

### S19 — Déploiement cas B
Préconditions : `.env` du banc (`DOMAIN=recrutement.localhost`, cas B) remis.
Étapes : `dep.sh`.
Attendu : « Commit en place », `DOMAIN=… · COMPOSE_PROFILES=caddy`, « Déploiement réussi : 0f6b61f », code 0.

### S20 — Root et `.env` absent
Étapes : `dep.sh` sans `.env` ; `./deploy/deploy.sh` en root.
Attendu : 2 arrêts, code 1, messages précis.

### S21 — Lecture du `.env`
Étapes : 12 variantes posées dans `/opt/recrutement/.env` (propriétaire `deploy`, 600), `dep.sh` après chacune : E1 valeurs valides avec commentaires de fin de ligne et guillemets simples/doubles ; E2 cookie secret d'exemple entre guillemets ; E3 identifiant d'exemple suivi d'un commentaire ; E4 secret client vide ; E5 identifiant vide ; E6 cookie secret absent ; E7 `.env.example` tel quel ; E8 `DOMAIN=localhost # test` cohérent ; E9 URL de retour d'un autre domaine ; E10 `DOMAIN` vide en cas B ; E11 `DOMAIN` vide en cas A ; E12 `DOMAIN=recrutement.localhost#c`.
Attendu : E1 déployé (valeurs sans commentaire ni guillemets dans `docker inspect`) ; E2–E12 refusés avant toute action, code 1.

### S22 — Cas A / cas B
Étapes : `COMPOSE_PROFILES=   # cas A` puis `dep.sh` sans proxy ; puis nginx de l'hôte (S15) et `dep.sh` ; puis `COMPOSE_PROFILES=caddy`, nginx arrêté, `dep.sh`.
Attendu : cas A affiché, « Caddy du projet arrêté et supprimé », contrôle en échec avec « Pour revenir … deploy/deploy.sh <commit> » et code 1 sans proxy ; code 0 avec nginx ; cas B affiché et `caddy` recréé, code 0.

### S23 — Cas B avec 80 pris
Étapes : nginx de l'hôte en marche et `COMPOSE_PROFILES=caddy` → `dep.sh` ; puis `docker run -p 80:80 busybox httpd` → `dep.sh`.
Attendu : « c'est le cas A, laissez COMPOSE_PROFILES vide » puis « publié par un autre conteneur », code 1, avant `build`.

### S24 — Commits refusés
Étapes : `dep.sh a b` ; `dep.sh deadbeef` ; `dep.sh e4a325d` (sans `compose.yaml`) ; `dep.sh 21a6979` (sans `deploy/deploy.sh`) ; commit poussé sur une branche `qa-hors-main` puis `dep.sh <ce commit>`.
Attendu : usage code 2 ; 4 arrêts code 1 ; HEAD inchangée.

### S25 — Dépôt modifié
Étapes : en `deploy`, `cp .env .env.bak` → `dep.sh` ; idem `.env.local` ; `echo x >> README.md` → `dep.sh` ; remise en état.
Attendu : arrêt avec `?? .env.bak`, `?? .env.local`, ` M README.md`.

### S26 — Projet `recrutement` d'un autre dossier
Étapes : `cd /root/qa/autre && docker compose -p recrutement up -d` → `dep.sh`.
Attendu : arrêt « viennent d'un autre dossier », code 1.

### S27 — Configuration modifiée active
Étapes : dans `/tmp/w`, ajout de `"^/candidatures\\.html$"` à `skip_auth_routes`, commit poussé sur `main` ; `dep.sh` ; `curl https://recrutement.localhost/candidatures.html`.
Attendu : code 0 ; 200 (route ajoutée active).

### S28 — Retour à un commit
Étapes : `dep.sh 0f6b61f` ; `git branch --show-current` ; `curl …/candidatures.html` ; plus tard `dep.sh` sans argument.
Attendu : code 0, HEAD détachée sur `0f6b61f`, message « reprend main », 302 ; puis retour sur `main`.

### S29 — Second lancement simultané
Étapes : premier `deploy.sh` en arrière-plan ; dès « Commit en place » dans son journal, second `deploy.sh`.
Attendu : second refusé (« un déploiement est déjà en cours »), code 1, pendant que le premier tourne ; premier code 0 ; un troisième lancement ensuite passe.

### S30 — Interruption puis relance
Étapes : `setsid … deploy.sh 409a245`, SIGINT au groupe 0,4 s après « Dépôt sur » ; état (HEAD, `git status`, conteneurs, site) ; relance `dep.sh 409a245` ; même chose sans argument.
Attendu : site toujours servi pendant l'arrêt ; relance code 0 sur `409a245`, puis sur `main`.

### S31 — Construction en échec
Étapes : commit sur `main` remplaçant `python:3.12-slim` par une image inexistante ; `dep.sh` ; état du site ; exécution de la commande « Pour revenir … » affichée.
Attendu : « ÉCHEC : la construction de l'image a échoué », « Pour revenir à la version précédente : deploy/deploy.sh <commit précédent> », code 1 ; anciens conteneurs toujours servis ; la commande proposée sort avec 0.

### S32 — Images non étiquetées gardées
Préconditions : image `autre` construite deux fois (une image orpheline non étiquetée), images `busybox`, `nginx`, `caddy`, `python`, `oauth2-proxy`.
Étapes : inventaire (`docker images -a` + étiquette `fr.yeita.projet`) avant et après un `deploy.sh` qui reconstruit `front`.
Attendu : seule l'ancienne `recrutement-front` (étiquetée) disparaît.

### S33 — Valeur vide suivie d'un commentaire
Étapes : `.env` du banc avec `OAUTH2_PROXY_CLIENT_ID=   # à remplir avec l identifiant Google` ; `dep.sh` ; `docker inspect` ; `Location` de `/candidatures/`.
Attendu (R15 : un `.env` incomplet est refusé) : arrêt « OAUTH2_PROXY_CLIENT_ID est vide ».

### S34 — Analyse statique
Étapes : `docker run --rm -v "$PWD:/m:ro" -w /m koalaman/shellcheck:v0.10.0 deploy/deploy.sh deploy/prepare-serveur.sh tools/check-site.sh`.
Attendu : aucune remarque, code 0.

### S35 — Connexion Google réelle (manuel)
Préconditions : déploiement réel sur `recrutement.yeita.fr`, client OAuth « Interne ».
Étapes : navigation privée sur `/candidatures/` avec un compte @yeita.fr ; idem avec un compte externe ; lien direct vers `/assets/data-diamants.js` ; attendre l'expiration de la session ou supprimer le cookie `_oauth2_proxy`.
Attendu : redirection directe vers Google, retour sur la page demandée ; compte externe refusé (403 d'oauth2-proxy) ; nouvelle redirection après expiration ; pages candidat accessibles sans connexion.

### S36 — Mise en place sur le serveur OVH (manuel)
Étapes : suivre `deploy/README.md` : `ss -ltnp` sur 80/443 et choix du cas, `dig +short`, relevé des autres sites avant / après, `prepare-serveur.sh`, `.env`, premier `deploy.sh`.
Attendu : certificat valide sans `-k`, `check-site.sh https://recrutement.yeita.fr` = 0, autres sites inchangés.
