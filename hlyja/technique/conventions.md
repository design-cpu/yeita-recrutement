---
type: technique
page: conventions
titre: Conventions et tests
maj: 1.7
commit: c51ed2c
sources: api/package.json, api/test/aide.js, README.md, CONTRIBUER.md, tools/build.py, tools/check-site.sh, compose.yaml, .dockerignore, .gitignore, tools/test-store.js, tools/test-serveur.js, tools/e2e-serveur.py, tools/e2e-candidatures.py, tools/e2e-parcours.py, tools/e2e-liens.py, tools/e2e-pdf.py
date: 2026-10-27
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
| `deploy/` | configuration et scripts du serveur, `README.md` (mode d'emploi) (v1.1) |
| `api/` | l'API de stockage (v1.2) : `server.js`, `equipe.js`, `src/`, `test/`, `README.md` ; `node_modules/` et `data/` jamais commités (`.gitignore`) ; jamais publiée (`SKIP`) |
| `compose.yaml`, `.env.example`, `.dockerignore` | pile Docker ; `.env` (secrets) n'est jamais commité (`.gitignore`) (v1.1) |
| `hlyja/` | trace Hlýja, exclue de la publication (`SKIP` de `tools/build.py`) |

## Mise en page des étapes (1.7)
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
| `python3 tools/e2e-parcours.py` | idem | EC1, EC2, Bilans, EC3, Décision |
| `python3 tools/e2e-liens.py` | idem | « Précédent », liens directs, feuille vierge |
| `python3 tools/e2e-pdf.py` | idem, plus `pdftotext` (poppler) | exports PDF |
| `python3 tools/e2e-serveur.py` | site construit dans `_site`, Node 22 et `npm ci` dans `api/`, Playwright Python ; lance lui-même l'API (port 18765, base temporaire, `DEV_STATIC`) | mode serveur de bout en bout : trois navigateurs (Alice, Bob recruteurs, Léa lecture) par `X-Forwarded-Email` ; réponses d'oauth2-proxy, réseau et lenteur simulées par interception (v1.3) ; bandeau jaune des 6 pages et boutons d'exemples (v1.4) ; 51 vérifications ; 20 s par vérification (Playwright) ; l'API lancée est arrêtée dans `finally` |
| `cd api && npm test` | Node 22 ; `npm ci` dans `api/` | l'API (v1.2) : 52 tests — configuration, base et schéma, autorisation, dossiers, options, serveur et `equipe.js` en processus fils ; ~20 s (délais de 5 s volontaires) |
| `tools/check-site.sh BASE_URL` | `curl` ; site déployé ou pile Docker locale | pages publiques en 200, pages protégées en 302 vers Google, `/ping` (v1.1), `/api/moi` → 401 sans session (v1.3) |

Serveur : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`.

En conteneur, avec le mode serveur (v1.3) : copier le binaire Node de l'image `node:22-slim` (`docker create --name n22 node:22-slim && docker cp n22:/usr/local/bin/node ./node22 && docker rm n22`), puis `docker run --rm --ipc=host -v "$PWD:/depot:ro" -v "$PWD/node22:/usr/local/bin/node:ro" mcr.microsoft.com/playwright/python:v1.63.0-noble bash -c 'pip -q install playwright==1.63.0; cp -r /depot /w && cd /w && python3 tools/build.py _site && (python3 -m http.server 8765 --directory _site &) && sleep 1 && for t in e2e-candidatures e2e-parcours e2e-liens e2e-pdf e2e-serveur; do python3 tools/$t.py; done'` (`api/node_modules` du dépôt fournit les binaires `linux-x64` et `linux-arm64` de better-sqlite3 ; `e2e-pdf` demande aussi `poppler-utils`). L'e2e serveur pose `DEV_EMAIL` (Alice) pour les seules requêtes sans en-tête : l'envoi de départ `keepalive` ne reçoit pas les en-têtes ajoutés par Playwright. Chaque test affiche `OK` / `FAIL` par vérification ; les e2e Python finissent par `ALL OK` / `SOMETHING FAILED` (ou `TOUT OK` / `ÉCHECS`) : **lire cette dernière ligne**, `e2e-candidatures` et `e2e-parcours` sortent avec le code 0 même en échec. Depuis v1.3, ces deux suites écartent de leurs erreurs de console la seule réponse dont l'adresse finit par `/api/moi` (404 attendu sans API, mode navigateur ; écart à R37 de la spec 1.3). Sans Playwright sur le poste : conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble` avec `pip install playwright==1.63.0` et `poppler-utils` (v1.1).

Scripts du serveur (`deploy/*.sh`) : essayés dans un conteneur `ubuntu:24.04` privilégié avec son propre `dockerd` et un dépôt nu local (`RECRUTEMENT_REPO`), jamais sur le serveur ; `shellcheck` 0.10.0 (image `koalaman/shellcheck:v0.10.0`) sans remarque (v1.1).

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
| 1.7 | Mise en page des étapes : largeur commune, panneau Notes, composant unique de la fiche du candidat ; tests de l'API : `fichiers` |
