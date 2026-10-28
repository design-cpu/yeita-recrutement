---
type: technique
page: conventions
titre: Conventions et tests
maj: 1.10
commit: 08ae3e2
sources: api/package.json, api/test/aide.js, README.md, CONTRIBUER.md, tools/build.py, tools/check-site.sh, compose.yaml, .dockerignore, .gitignore, tools/test-store.js, tools/test-serveur.js, tools/e2e-serveur.py, tools/e2e-candidatures.py, tools/e2e-parcours.py, tools/e2e-liens.py, tools/e2e-pdf.py, tools/test-sauvegarde.sh, deploy/backup.sh, deploy/verif-disque.sh, tools/test-auto-deploy.sh
date: 2026-10-28
---

# Conventions et tests

> Comment le dépôt est organisé, publié et testé. Référentiel initial partiel (v1.0) : seules les conventions utiles au nettoyage Supabase ont été relevées.

## Organisation
| Dossier | Contenu |
|---|---|
| racine | pages HTML (`index.html` est un fragment enveloppé à la publication) ; `fiche-ec1.html`, `fiche-ec2.html`, `carte-identite.html`, `yeita-match-decompte.html`, `candidatures.html` sont des relais vers `candidatures/` |
| `candidatures/` | l'espace Candidatures |
| `assets/` | code et données partagés ; `dossier.js` (modèle, adaptateur), `store.js` (règles du parcours), `wording.fr.js` (textes), `demarrage.js` et `adapter-serveur.js` (mode serveur, v1.3) |
| `docs/` | `backend/MODELE.md` (modèle v3, fait foi), `dossier-candidat.schema.json` |
| `tools/` | construction du site, tests, `check-site.sh` (contrôle d'un site déployé) |
| `docker/` | `front.Dockerfile` (v1.1), `api.Dockerfile` (v1.3) |
| `deploy/` | configuration et scripts du serveur, `README.md` (mode d'emploi) (v1.1) ; `systemd/` (unités, v1.7), `RESTAURER.md`, `CLE-SAUVEGARDE.md`, `METTRE-A-JOUR.md` (v1.7) |
| `api/` | l'API de stockage (v1.2) : `server.js`, `equipe.js`, `sauvegarde.js` (v1.7), `src/`, `test/`, `README.md` ; `node_modules/` et `data/` jamais commités (`.gitignore`) ; jamais publiée (`SKIP`) |
| `compose.yaml`, `.env.example`, `.dockerignore` | pile Docker ; `.env` (secrets) n'est jamais commité (`.gitignore`) (v1.1) |
| `admin/` | pages d'administration (v1.7 : `sauvegardes.html` ; v1.9 : `deploiement.html`), protégées par oauth2-proxy, sans lien depuis Candidatures |
| `hlyja/` | trace Hlýja, exclue de la publication (`SKIP` de `tools/build.py`) |

## Mise en page des étapes (1.10)
- **Une seule largeur** pour toutes les étapes d'un candidat (appel, EC1, bilans, EC2, EC3, décision, proposition, onboarding) : `<div class="wrap etape">`, soit 1120 px au plus (`--etape-max`, `candidatures/style.css`). Toute nouvelle page d'étape la reprend.
- **Pourquoi 1120 px :** la scorecard EC2 (sélecteur de palier sur une ligne, 4 tuiles, radar) et la carte d'identité y tiennent sans défilement ; avec le panneau Notes ouvert (420 px), il reste au moins 900 px de contenu dès 1360 px d'écran.
- **Panneau Notes :** à côté du contenu dès 1360 px (`body.np-on` décale la page) ; en dessous, par-dessus.
- **Fiche du candidat :** un seul composant (`MC.infosHTML`, `candidatures/menu-candidat.js`), 4 groupes, grille de 3 colonnes (2 sous 760 px, 1 sous 480 px), dans l'appel comme dans la fenêtre.

## Publication
`python3 tools/build.py [dossier]` copie la racine sauf `SKIP` (`.git`, `.github`, `.agents`, `docs`, `tools`, `_site`, `dist`, `renders`, `README.md`, `STORAGE.md`, `.gitignore`, `hlyja`, `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `api` (v1.2), et tout nom commençant par `.env`) et enveloppe `index.html`. Tout `assets/` est publié. Depuis v1.1, le site est servi par l'image `front` sur le serveur OVH, déployé à la main par `deploy/deploy.sh` ([Architecture](architecture.md)) ; GitHub Pages n'est plus utilisé.

Règles du déploiement (v1.1) : images servies figées par tag (`oauth2-proxy:v7.15.5`, `caddy:2.11.7`) ; l'image de construction `python:3.12-slim` suit les correctifs 3.12 (décision du pitch) ; secrets seulement dans `.env` ; aucune commande Docker globale sur le serveur partagé (nettoyage limité à l'étiquette `fr.yeita.projet=recrutement`, jamais de `system prune`) ; réglages de journaux et de redémarrage dans `compose.yaml`, jamais dans la configuration globale de Docker.

## Tests
| Commande | Prérequis | Couvre |
|---|---|---|
| `node tools/test-store.js` | Node | règles du parcours (store, dossier) |
| `node tools/test-serveur.js` | Node 22 | mode serveur hors navigateur, contre une fausse API : adaptateur, démarrage, bandeau, identité, options, écriture des fiches par partie (v1.3), bandeau jaune (v1.4) ; 87 vérifications (~4 s) ; une vérification qui dépasse 5 s échoue avec son message ; tout rejet non traité est un échec |
| `python3 tools/e2e-candidatures.py` | site construit servi sur `localhost:8765`, Playwright Python | tableau, appel ; bandeau et boutons d'exemples du mode navigateur (v1.4) |
| `python3 tools/e2e-parcours.py` | idem | EC1, EC2, Bilans, EC3, Décision ; v1.10 : largeur de 1120 px, Notes à côté dès 1360 px, appel sans liens utiles, aucun sélecteur d'État dans les étapes, initiales du kanban, grille 3/2/1, en-tête de la carte, téléphone (fenêtre de création comprise) ; 84 `OK` |
| `python3 tools/e2e-liens.py` | idem | « Précédent », liens directs, feuille vierge |
| `python3 tools/e2e-pdf.py` | idem, plus `pdftotext` (poppler) | exports PDF |
| `python3 tools/e2e-serveur.py` | site construit dans `_site`, Node 22 et `npm ci` dans `api/`, Playwright Python ; lance lui-même l'API (port 18765, base temporaire, `DEV_STATIC`) | mode serveur de bout en bout : trois navigateurs (Alice, Bob recruteurs, Léa lecture) par `X-Forwarded-Email` ; réponses d'oauth2-proxy, réseau et lenteur simulées par interception (v1.3) ; bandeau jaune des 6 pages et boutons d'exemples (v1.4) ; page `admin/deploiement.html` (v1.9 : verdict par état, bandeaux, boutons, confirmations, double clic, texte hostile, clavier, focus gardé à la relecture) ; 135 vérifications (41 pour la page des déploiements ; v1.10 : 39 sur les CV et portfolios — création sans doublon, deux recruteurs réels, pannes simulées et réelles (API arrêtée puis relancée), nginx (413 HTML), import, liens hostiles, rôle lecture, clavier) ; 20 s par vérification (Playwright) ; l'API lancée est arrêtée dans `finally` |
| `cd api && npm test` | Node 22 ; `npm ci` dans `api/` | l'API (v1.2) : 85 tests (v1.10 : `base` et `fichiers`) — configuration, base et schéma, autorisation, dossiers, options, serveur, `equipe.js` et `sauvegarde.js` (v1.7, lancée sous `umask 022`) en processus fils, route `GET /api/sauvegardes` (v1.7), routes `/api/deploiement` (v1.9) ; ~20 s (délais de 5 s volontaires) ; verdict `ℹ fail 0` |
| `BANC_JETABLE=oui bash tools/test-sauvegarde.sh <dépôt>` (v1.7) | root dans un conteneur jetable `ubuntu:26.04` (refus sans `BANC_JETABLE=oui` : il vide `/var/backups/recrutement`) avec l'utilisateur `deploy`, `/var/backups/recrutement` (700), docker (CLI et plugin compose), `age`, `python3` | `deploy/backup.sh` et `deploy/verif-disque.sh` : faux `docker` (sauf `compose config`, réel ; `compose run` écrit l'état dans un faux volume), faux `df` ; vrai `age` (avec des modes de panne simulés) ; 102 vérifications ; finit par **`TOUT OK`** (code 0) ou `ÉCHECS : n` (code 1) |
| `AUTO_DEPLOY_JETABLE=oui bash tools/test-auto-deploy.sh <dépôt>` (v1.9) | root dans un conteneur jetable `banc-1.7` (refus sans la variable ou hors conteneur ; crée `deploy` s'il manque) ; docker CLI et plugin compose, git, python3 | niveau A : `deploy/auto-deploy.sh` (faux docker qui joue `compose run … api sh -c` sur un faux volume, tests et construction pilotés par `.essai/<étape>` des commits d'essai, `deploy.sh` factice dans ces commits) et partie D (vrai `deploy.sh`, faux docker, `check-site.sh` factice) ; 95 vérifications ; finit par **`TOUT OK`** (code 0) ou `ÉCHECS : n` (code 1). Option `--reel` : niveau B sur `banc-1.7-systemd` préparé (préparation en tête du fichier), vraie pile et vraies unités, ~25 min |
| `tools/check-site.sh BASE_URL` | `curl` ; site déployé ou pile Docker locale | pages publiques en 200, pages protégées en 302 vers Google, `/ping` (v1.1), `/api/moi` → 401 sans session (v1.3) |

Serveur : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`.

En conteneur, avec le mode serveur (v1.3) : copier le binaire Node de l'image `node:22-slim` (`docker create --name n22 node:22-slim && docker cp n22:/usr/local/bin/node ./node22 && docker rm n22`), puis `docker run --rm --ipc=host -v "$PWD:/depot:ro" -v "$PWD/node22:/usr/local/bin/node:ro" mcr.microsoft.com/playwright/python:v1.63.0-noble bash -c 'pip -q install playwright==1.63.0; cp -r /depot /w && cd /w && python3 tools/build.py _site && (python3 -m http.server 8765 --directory _site &) && sleep 1 && for t in e2e-candidatures e2e-parcours e2e-liens e2e-pdf e2e-serveur; do python3 tools/$t.py; done'` (`api/node_modules` du dépôt fournit les binaires `linux-x64` et `linux-arm64` de better-sqlite3 ; `e2e-pdf` demande aussi `poppler-utils`). L'e2e serveur pose `DEV_EMAIL` (Alice) pour les seules requêtes sans en-tête : l'envoi de départ `keepalive` ne reçoit pas les en-têtes ajoutés par Playwright. Chaque test affiche `OK` / `FAIL` par vérification ; les e2e Python finissent par `ALL OK` / `SOMETHING FAILED` (ou `TOUT OK` / `ÉCHECS`) : **lire cette dernière ligne**, `e2e-candidatures` et `e2e-parcours` sortent avec le code 0 même en échec. Depuis v1.3, ces deux suites écartent de leurs erreurs de console la seule réponse dont l'adresse finit par `/api/moi` (404 attendu sans API, mode navigateur ; écart à R37 de la spec 1.3). Sans Playwright sur le poste : conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble` avec `pip install playwright==1.63.0` et `poppler-utils` (v1.1).

Scripts du serveur (`deploy/*.sh`) : essayés dans un conteneur `ubuntu:24.04` privilégié avec son propre `dockerd` et un dépôt nu local (`RECRUTEMENT_REPO`), jamais sur le serveur ; `shellcheck` 0.10.0 (image `koalaman/shellcheck:v0.10.0`) sans remarque (v1.1). Depuis v1.7 : banc `ubuntu:26.04` (le système du serveur), dossiers `/var/lib/docker` et `/var/lib/containerd` sur des volumes (overlay sur overlay refusé), variante avec systemd en PID 1 (`--privileged --cgroupns=host -v /sys/fs/cgroup:/sys/fs/cgroup:rw --tmpfs /run`, `CMD /sbin/init`) pour essayer les unités ; `/tmp` y est un tmpfs (un `docker cp` vers `/tmp` est masqué). shellcheck : `docker run --rm -v "$PWD:/mnt:ro" -w /mnt koalaman/shellcheck:v0.10.0 -f gcc -x deploy/*.sh tools/test-auto-deploy.sh` (v1.9 : le format `gcc` ne recopie pas les lignes ; avec le format par défaut, shellcheck plante sur une ligne accentuée, « commitBuffer: invalid character », même avec `LC_ALL=C.UTF-8`). Sous `set -o pipefail`, un pipe de décision ne finit jamais par `grep -q` ni `head` derrière un producteur qui écrit beaucoup (SIGPIPE → faux négatif, v1.9 : `git rev-list | grep -qx`) : `grep … >/dev/null`. Sur le banc systemd, un service oneshot en cours est `activating` (pas `active`) : attendre sur `systemctl show -p ActiveState`. Mutations des scripts : copie hors du dépôt, banc complet, classement par sa ligne finale ; un passage nouveau se vérifie par son identifiant (au-delà de 30 passages, leur nombre ne bouge plus).

API (v1.2) : `node:test` seulement, aucune dépendance de développement ; un fichier par domaine dans `api/test/` (7 au plus), outils communs dans `test/aide.js` (`dossierTemporaire`, `siteConstruit`, `dossier`, `fichiersContiennent`, `MEMBRES`, `creerApp`, `requete`) ; chaque test sur une base temporaire ; tout processus lancé par un test est arrêté à sa fin ; chaque contrôle d'accès, de conflit ou de configuration est mis à l'épreuve par mutation dans une copie hors du dépôt (fiches de tâches). Code de l'API : modules ES, noms et messages en français, valeurs reprises des pages recopiées avec leur source (`api/src/valeurs.js`), erreurs client par `ErreurHttp` (`{erreur, code?}`).

## Branches
Une branche par sujet (`feat/…`, `fix/…`, `version/<x.y>-<slug>` pour Hlýja), pull request vers `main`.

## Voir aussi
- [API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Décisions](decisions.md)
- [Lancer le site avec Docker sur un poste](docker-local.md)

## Historique
| Version | Changement |
|---|---|
| 1.0 | Création (partielle) |
| 1.1 | Dossiers `docker/`, `deploy/` ; publication par Docker, fin de GitHub Pages ; `check-site.sh` ; règles du déploiement |
| 1.2 | Dossier `api/`, `api` dans `SKIP`, tests de l'API (`node:test`) |
| 1.3 | `docker/api.Dockerfile`, `assets/demarrage.js`, `assets/adapter-serveur.js` ; tests `tools/test-serveur.js` et `tools/e2e-serveur.py` |
| 1.4 | Ancien modèle v2 de `docs/` supprimé ; `e2e-candidatures` couvre le bandeau et les boutons d'exemples du mode navigateur ; compteurs de `test-serveur` et `e2e-serveur` |
| 1.7 | `admin/`, `deploy/systemd/`, `deploy/RESTAURER.md`, `CLE-SAUVEGARDE.md`, `METTRE-A-JOUR.md` ; `npm test` à 58 tests ; `tools/test-sauvegarde.sh` ; banc `ubuntu:26.04` avec systemd ; shellcheck avec `LC_ALL=C.UTF-8` |
| 1.9 | `tools/test-auto-deploy.sh` (niveaux A et B), `npm test` à 65 tests, `e2e-serveur` vérifie `admin/deploiement.html` ; shellcheck en format `gcc` |
| 1.10 | Mise en page des étapes : largeur commune, panneau Notes, composant unique de la fiche du candidat ; tests de l'API : `fichiers` (85 tests), horloge simulée (`creerApp(t, {maintenant})`) ; `e2e-serveur` : 135 vérifications ; `e2e-parcours` : interface de la 1.10. Le contrôle « départ de la page (candidat.html), PUT précédent lent » échoue à chaque passage dans le conteneur Playwright, sur `main` comme sur la 1.10 : c'est le défaut 1.9-1 (PUT lent puis départ de la page → 409), pas une instabilité ; verdict `ÉCHECS` attendu tant qu'il est ouvert (voir aussi 1.10-3). Lancer les e2e un par un (deux `e2e-serveur` en parallèle se gênent) |
