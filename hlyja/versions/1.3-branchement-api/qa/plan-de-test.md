---
type: plan-de-test
version: 1.3
scenarios: 47
date: 2026-10-26
---

# Plan de test — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> 47 scénarios couvrant les 25 critères d'acceptation · 8 couches · 43 automatisés ou rejoués, 4 manuels
> Consigne du chef d'équipe (P4) : les CA déjà couverts par les suites automatiques sont revérifiés par **rejeu** (un scénario par suite, S1 à S8), pas refaits à la main. Les scénarios neufs portent sur ce qui restait : CA17 avec une session sur la pile actuelle, V16, règle 4 sur la pile Docker, durée maximale par test, mutations de Q7, envoi de départ sous une autre identité qu'Alice, CA22, CA25, relecture des textes et du bandeau.

QA indépendante sur `e59d120` (branche `version/1.3-branchement-api`). Code de production non modifié. Trois bancs :
- **Linux** : moteur jetable `dind13` (`docker:29-dind`, moteur 29.9.2, Compose 5.6.1), dépôt nu `/srv/origine.git` où HEAD est poussé (`9ffc7a7`), déploiement par `deploy/deploy.sh` sous l'utilisateur `deploy` (projet `recrutement`, cas B, `DOMAIN=banc.localhost`).
- **Session** : projet Compose `banc13` sur Docker Desktop, fichiers du dépôt recopiés (`compose.yaml`, `deploy/oauth2-proxy.cfg`, `docker/api.Dockerfile`, `.dockerignore`, `assets/`, `candidatures/`), `compose.banc.yaml` (Dex v2.41.1 en OIDC à la place de Google, volume renommé `banc13_qa_data` pour ne pas créer `recrutement_data` sur le poste), Playwright dans le réseau `banc13_edge`.
- **Suites** : poste (Node 26) pour les suites Node ; conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble` avec le Node de `node:22-slim` pour les e2e (commande de `hlyja/technique/conventions.md`).

## Matrice
| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Accessibilité | Sécurité | Autre |
|---|---|---|---|---|---|---|---|
| CA1 | S2 | — | — | S8 | — | — | — |
| CA2 | S2 | — | — | S8, S37 | — | — | — |
| CA3 | S2 | — | — | S8 | — | — | — |
| CA4 | — | — | — | S8, S27 | — | — | — |
| CA5 | — | — | S29 | S8, S37 | S34 | — | manuel S43 |
| CA6 | S2 | — | — | S8 | — | — | — |
| CA7 | S2 | — | — | S8 | — | — | — |
| CA8 | S2 | — | — | S8, S30, S37 | — | — | — |
| CA9 | S2 | — | S28 | S8, S37 | — | — | — |
| CA10 | S2 | — | — | S8, S27, S37 | — | — | — |
| CA11 | S2, S35 | — | — | S8, S37 | — | — | — |
| CA12 | S2 | — | — | S8, S37 | — | — | — |
| CA13 | S2 | — | — | — | — | — | — |
| CA14 | — | — | — | S8, S37 | — | — | — |
| CA15 | S1, S2 | S3 | — | S4 à S7 | — | — | témoin S9 |
| CA16 | — | S13 | — | — | — | S13 | — |
| CA17 | — | S14 à S17 | — | S26 | — | S14 à S17, S26 | — |
| CA18 | — | S18 à S22 | — | — | — | S19 | — |
| CA19 | — | S10, S24 | — | — | — | S24 | — |
| CA20 | — | S10 à S12 | — | — | — | — | — |
| CA21 | — | S32, S33 | — | S8, S32 | — | S32, S33 | — |
| CA22 | — | S31 | — | — | — | S31 | — |
| CA23 | — | S23 | — | — | — | S23 | — |
| CA24 | — | — | — | S6 | — | — | S41 |
| CA25 | — | — | — | — | — | — | S25, S39, S40 |
| Hors CA : durée maximale par test | S36 | — | — | S38 | — | — | — |
| Hors CA : textes de la spec | — | — | — | — | — | — | S42, S43 |
| Hors CA : hypothèses H1, H2, H4, contrôle réseau R32 | — | — | — | — | — | — | manuels S44 à S47 |

## Couches écartées
| Couche | Raison |
|---|---|
| Performance | Aucun enjeu de volume : un dossier pèse 1,4 à 20 Ko (V33) ; les délais qui comptent (démarrage en 10 s, sonde en 4 s, attente de 60 s de `deploy.sh`) sont vérifiés par S2, S11, S18 |

Toutes les autres couches sont couvertes (voir la matrice). L'accessibilité ne porte que sur ce que la version ajoute (bandeau, en-tête « Connecté·e ») : S34.

## Scénarios
| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | Rejeu `node tools/test-store.js` | CA15 | régression | oui (`tools/test-store.js`) |
| S2 | Rejeu `node tools/test-serveur.js` | CA1-CA3, CA6, CA7, CA10, CA11, CA13 | unitaire | oui (`tools/test-serveur.js`) |
| S3 | Rejeu `cd api && npm test` | CA15 | régression | oui (`api/test/`) |
| S4 | Rejeu `tools/e2e-candidatures.py` (mode navigateur) | CA15 | régression | oui |
| S5 | Rejeu `tools/e2e-parcours.py` (mode navigateur) | CA15 | régression | oui |
| S6 | Rejeu `tools/e2e-liens.py` | CA15, CA24 | régression | oui |
| S7 | Rejeu `tools/e2e-pdf.py` | CA15 | régression | oui |
| S8 | Rejeu `tools/e2e-serveur.py` | CA1-CA12, CA14, CA21 | bout-en-bout | oui |
| S9 | Témoin : `e2e-candidatures` et `e2e-parcours` sur `main` | CA15 | régression | oui (scratchpad) |
| S10 | `deploy.sh` de HEAD sur le banc Linux : attente de l'api, 6 contrôles | CA19, CA20 | intégration | oui (banc) |
| S11 | Échec provoqué (sonde malade) puis relance | CA20 | intégration | oui (banc) |
| S12 | Retour vers la 1.2, puis retour à la 1.3 : api retirée, volume et données gardés | CA20 | intégration | oui (banc) |
| S13 | Valeurs résolues (`docker compose config`) et réseau créé | CA16 | sécurité | oui (banc) |
| S14 | Hôte et conteneur en réseau hôte → api, avec témoin | CA17 | sécurité | oui (banc) |
| S15 | caddy, conteneur du seul `edge`, `front` → api ; sortie de `front` et de l'api | CA17 | sécurité | oui (banc) |
| S16 | Sans session : formes d'adresse de V6 et forme absolue | CA17 | sécurité | oui (banc) |
| S17 | `X-Forwarded-Email` forgé sans session : 401 et aucune requête à l'API, avec témoin | CA17 | sécurité | oui (banc) |
| S18 | Image : base, utilisateur, étiquette, variables, droits, sonde, `healthy` | CA18 | intégration | oui (banc) |
| S19 | `DEV_EMAIL`, `DEV_STATIC` → code 1 | CA18 | sécurité | oui (banc) |
| S20 | V16 : volume vide en lecture seule → code 1, puis relance en écriture saine | CA18 | intégration | oui (banc) |
| S21 | V16 : volume **avec base** en lecture seule | CA18 | intégration | oui (banc) |
| S22 | R29 sous Compose : base illisible, relances, correction | CA18 | intégration | oui (banc) |
| S23 | `.dockerignore` : base factice, `node_modules` hôte | CA23 | sécurité | oui (banc) |
| S24 | Mutations du 6e contrôle de `check-site.sh` (Q7) | CA19 | intégration | oui (banc) |
| S25 | `deploy/README.md` § 9b : les commandes et leurs sorties attendues | CA25 | manuel rejoué | oui (banc) |
| S26 | CA17 avec session (Dex) : email de la session, en-têtes forgés écrasés | CA17 | sécurité | oui (scratchpad `banc_session.py`) |
| S27 | Pages derrière oauth2-proxy : mode serveur, « Connecté·e : Alice », création | CA4, CA10 | bout-en-bout | oui (idem) |
| S28 | Léa sur la pile : en-tête et refus sans bouton | CA9 | composant | oui (idem) |
| S29 | Conflit sur la pile : bandeau, captures | CA5 | composant | oui (idem) |
| S30 | Envoi de départ sous l'identité de Bob (`ec1.html`, `candidat.html`) | CA8, R6g | bout-en-bout | oui (idem) |
| S31 | `equipe.js add|list|disable|role` avec une session ouverte | CA22 | intégration | oui (banc) |
| S32 | Règle 4 : suppression, repère cherché dans `/data`, les journaux et les navigateurs | CA21 | sécurité | oui (banc) |
| S33 | Règle 4 : rectification, ancienne valeur cherchée dans `/data` | CA21 | sécurité | oui (banc) |
| S34 | Bandeau : `role="alert"`, focus gardé, clavier, largeur 375 px, collant | CA5, R11 | accessibilité | oui (scratchpad `a11y.py`) |
| S35 | Mutations des options (Q7) | CA11 | unitaire | oui (scratchpad `mut/node_mut.py`) |
| S36 | Durée maximale par test : `test-serveur.js` face à une promesse sans fin | — | unitaire | oui (idem) |
| S37 | Mutations de l'e2e serveur (Q7), 10 CA | CA2, CA5, CA8-CA12, CA14 | bout-en-bout | oui (scratchpad `mut/e2e_mut.py`) |
| S38 | Durée maximale par test : `e2e-serveur.py` face à un `/api/moi` sans réponse | — | bout-en-bout | oui (idem) |
| S39 | `docs/backend/MODELE.md` contre R40 | CA25 | manuel | non |
| S40 | `api/README.md` : commandes du mode local | CA25 | manuel rejoué | oui (scratchpad) |
| S41 | Notes d'impression et lien « Ouvrir sur le site » | CA24 | manuel rejoué | oui (`grep`) |
| S42 | Les 13 textes de la spec, mot pour mot | § Contenu et textes | manuel rejoué | oui (script) |
| S43 | Relecture humaine des captures (bandeau, en-tête) | CA5, CA9, CA10 | manuel | non |
| S44 | H1 : vrai compte Google, `/api/moi` | H1 | manuel | non (guide, parcours 2) |
| S45 | Contrôle réseau du README § 9b sur le serveur | R32 | manuel | non (guide, parcours 1) |
| S46 | H2 : aperçu dans l'artefact Claude | H2 | manuel | non (guide) |
| S47 | H4 : données des navigateurs effacées après la mise en service | H4 | manuel | non (guide) |

## Détail des scénarios
### S1 à S8 — Rejeu des suites
Préconditions : HEAD, site construit (`tools/build.py _site`), serveur statique sur 8765 · Étapes : commandes de `hlyja/technique/conventions.md` · Attendu : chaque suite finit par son verdict de réussite (`TOUT OK`, `ALL OK`, `pass 52`), aucun `FAIL`.

### S9 — Témoin sur `main`
Préconditions : `git archive main` dans le scratchpad · Étapes : mêmes commandes pour `e2e-candidatures` et `e2e-parcours` · Attendu : `ALL OK` (sert à dire si un écart de S4/S5 est une régression).

### S10 à S12 — Déploiement
Préconditions : HEAD poussé sur `main` du dépôt nu du banc · Étapes : `deploy/deploy.sh` ; commit qui pointe la sonde vers `/api/inexistant`, `deploy.sh` ; `deploy.sh 9ffc7a7` ; `deploy.sh 0186993` ; `deploy.sh 9ffc7a7` · Attendu : « API saine. » et 6 OK ; « ÉCHEC : l'api n'est pas saine après 60 s » avec la commande de retour ; relance réussie ; api retirée, `recrutement_data` présent ; équipe retrouvée.

### S13 à S17 — Pile et attaques (moteur Linux)
Étapes : `docker compose config --format json`, `docker network inspect`, `curl` depuis l'hôte, conteneurs `--network host`, `recrutement_edge`, `recrutement_back` (témoin), `--network container:recrutement-front-1`, `wget` depuis caddy, `curl --path-as-is` et `--request-target` · Attendu : R22, R22b, R24.

### S18 à S22 — Image et échecs de démarrage
Étapes : `docker image inspect`, `stat` dans le conteneur ; `docker run -e DEV_EMAIL` / `-e DEV_STATIC` ; volume en lecture seule (vide, puis avec la base de la pile) ; `chmod 000` sur la base, `docker compose restart api`, puis `chmod 600` · Attendu : CA18, R29 (code 1, cause au journal, relance saine).

### S23 — `.dockerignore`
Étapes : `api/data/x.sqlite`, `api/data/x.sqlite-wal`, `api/y.sqlite` avec un repère, `api/node_modules/zz-qa`, construction de l'image · Attendu : ni le repère ni `zz-qa` dans l'image.

### S24 — Mutations du 6e contrôle de `check-site.sh`
Étapes : un `front` mutant (configuration sans `api_routes`) et un témoin (configuration du dépôt) sur le réseau `edge` du banc ; `tools/check-site.sh` contre chacun ; seconde mutation : `"^/api/"` ajouté à `skip_auth_routes`, avec en-tête forgé · Attendu : FAIL `/api/moi → reçu 302 …, attendu 401` et code 1 ; témoin OK.

### S25 — README § 9b
Étapes : les commandes du point 2 telles qu'écrites, sur le banc · Attendu : les sorties « attendu » du README.

### S26 à S30 — Session Dex sur la pile actuelle
Préconditions : équipe Alice, Bob (`recruteur`), Léa (`lecture`) ajoutée par `docker compose exec api node api/equipe.js add` · Étapes : `banc_session.py` (connexion Dex de trois navigateurs, requêtes sans session et avec session, en-têtes `X-Forwarded-Email`, `X-Forwarded-User`, `X-Auth-Request-Email`, `X-Forwarded-Preferred-Username` forgés ; pages réelles ; départ de `ec1.html` et `candidat.html` dans les 80 ms par Bob ; conflit Alice/Bob ; écriture de Léa) · Attendu : CA17 (email de la session), CA4, CA9, CA10, CA5, R6g sous l'identité de Bob (journal d'oauth2-proxy : `bob@yeita.fr`).

### S31 — CA22
Étapes : cookie de session de Bob ; `equipe.js disable`, `list`, `add` (réactivation), `role … lecture` ; `/api/moi` avec le cookie après chaque commande · Attendu : 403 `hors-equipe` dès la requête suivante, puis 200, puis rôle `lecture`.

### S32, S33 — Règle 4 sur la pile Docker
Étapes : dossier au nom « Quetzalqa Dossier », note EC1 « … Quetzalqa » (envoi de départ de Bob) ; rectification de `identite.personne` « QuetzalqaAncien » → « Rectifie » ; deux pages de Bob ouvertes (`candidat.html`, `decompte.html`) ; suppression par Alice dans l'interface ; saisie chez Bob ; copie de `/data` (`docker cp`), `grep -a` sans `VACUUM` ; `docker compose logs api front` ; stockage des navigateurs · Attendu : repère absent partout ; témoins : un dossier « Temoinqa » non supprimé est trouvé dans `/data`, l'identifiant du dossier supprimé est dans les journaux.

### S34 — Accessibilité du bandeau
Étapes : conflit à 375 × 812 pendant une frappe dans `#i-telephone` · Attendu : `role="alert"`, focus resté sur le champ, frappe continue, aucun défilement horizontal, bandeau à `y = 0` après défilement, « Recharger » atteignable au clavier.

### S35 à S38 — Mutations et durée maximale
Outil : copie hors du dépôt, une mutation à la fois, durée maximale 120 s (Node) et 300 s (e2e) par passage ; échéances propres aux suites (5 s par vérification Node, 20 s par action Playwright) · Attendu : chaque mutation échoue avec le message de l'assertion visée ; une promesse sans fin finit en échec avec message, jamais en blocage.

### S39 à S43 — Documentation et textes
Étapes : lecture de `MODELE.md` contre R40 ; commandes du mode local d'`api/README.md` dans une copie ; `grep -i github` ; comparaison programmée du tableau « Contenu et textes » avec `wording.fr.js`, `carte.html`, `decompte.html` ; captures dans `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/d97386d7-da7f-4b43-bc26-6c29f916ac88/scratchpad/qa/captures/` · Attendu : R40, textes mot pour mot, rendu lisible.

### S44 à S47 — Manuels
Voir `guide-test-humain.md`.
