---
type: plan-de-test
version: 1.2
scenarios: 45
date: 2026-10-26
---

# Plan de test — API Node.js sur SQLite pour les dossiers candidat

> 45 scénarios couvrant 17 critères d'acceptation · 4 couches · 9 automatisés, 36 manuels
> Priorités du chef d'équipe (P4) : CA1 dans `node:22-bookworm-slim` sans Python, bout en bout sur le vrai serveur (401, 403, 409), règles 2 et 3, journaux sans contenu, effacement réel, `equipe.js` et l'API sur la même base, mode local, non-régression.

## Matrice
| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Accessibilité | Autre |
|---|---|---|---|---|---|---|
| CA1 | — | — | — | — | — | S1, S2, S3, S43 (Docker) |
| CA2 | — | suite existante | — | S4, S5, S6, S7 | — | — |
| CA3 | — | suite existante | — | S8 | — | — |
| CA4 | — | suite existante | — | S9 | — | — |
| CA5 | — | suite existante | — | S10, S11, S12 | — | — |
| CA6 | — | suite existante | — | S13, S14 | — | — |
| CA7 | — | S18 (ajouté) | — | S16, S17, S19 | — | S20 (lecteur concurrent) |
| CA8 | — | suite existante (S43) | — | — | — | — |
| CA9 | suite existante | — | — | S30, S40 | — | — |
| CA10 | — | suite existante | — | S23, S24, S26, S27 | — | — |
| CA11 | S31 (ajouté) | — | — | S35, S36, S38, S39 | — | — |
| CA12 | S31 (ajouté) | — | — | S32, S33, S34, S37, S38 | — | — |
| CA13 | — | suite existante | — | S45 | — | — |
| CA14 | — | suite existante | — | S5, S27 | — | — |
| CA15 | — | S44 (ajouté) | — | S15, S21, S22, S23 | — | — |
| CA16 | — | — | — | — | — | S41, S42 |
| CA18 | — | S29 (ajouté) | — | S25, S28 | — | — |

## Couches écartées
| Couche | Raison |
|---|---|
| Composant / UI | aucune page ne change dans cette version (l'adaptateur navigateur vient à la suivante) ; Playwright interdit en P4 |
| Accessibilité | aucune interface : API HTTP et ligne de commande seulement |
| Charge, banc OVH, Docker Compose, oauth2-proxy | interdits en P4 (H1 et H3 renvoyés à la version suivante) |
| CA17 (mutations manuelles) | fait pendant les tâches et rejoué par la revue (`revue-code.md`, « Mutations des corrections ») ; non refait |

## Scénarios
| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | `npm ci` dans `node:22-bookworm-slim` sans Python, avec `api/.npmrc` seul | CA1 | autre (Docker) | non |
| S2 | `npm test` (44 tests) sous Node 22.23.4 dans le conteneur | CA1 | autre (Docker) | oui (suite) |
| S3 | `npm audit` : 0 ; `npm ls` : exactement les 3 dépendances, versions exactes | CA1, R2 | autre (Docker) | non |
| S4 | 401 : sans en-tête, `X-Forwarded-User` seul, doublon, `.evil.com`, `gmail.com`, en-tête vide, PUT JSON invalide sans identité | CA2 | bout en bout | non |
| S5 | `Rec@Yeita.FR` d'un membre actif → 200 `{email, prenom, role}` | CA2, CA14 | bout en bout | non |
| S6 | 403 `hors-equipe` : inconnu, inactif (GET et PUT) | CA2 | bout en bout | non |
| S7 | `/api/sante` : exemption limitée à la route (8 adresses) | CA2 | bout en bout | non |
| S8 | Rôle `lecture` : GET et HEAD 200 ; PUT, DELETE, POST, PATCH, OPTIONS 403 `lecture-seule`, y compris corps invalide et > 1 Mo | CA3 | bout en bout | non |
| S9 | Création 201 `version` 1 ; seconde création (autre membre) 409 `conflit` | CA4 | bout en bout | non |
| S10 | Deux PUT sur la même version lue : 200 puis 409 ; dossier en base = le premier ; `version` 5 sur une ligne en 2 → 409 | CA5 | bout en bout | non |
| S11 | PUT `version: 1` sur un dossier supprimé entre-temps → 409 ; DELETE répété → 404 `introuvable` | CA5 | bout en bout | non |
| S12 | Le message du 409 est mot pour mot celui de `docs/backend/MODELE.md` (l. 18) | CA5, R19 | bout en bout | non |
| S13 | 400 (schema, `data.id`, version 1.5 et 0, `data` absent, JSON invalide, `jean-dupont`), 413, 415 (`text/plain`, sans `Content-Type`, `Content-Type` vide), GET et DELETE avec `Content-Type` JSON sans corps | CA6 | bout en bout | non |
| S14 | Variantes de `Content-Type` : majuscules et `charset` acceptés ; `json-patch+json`, `jsonx`, `text/json`, formulaire, multipart → 415 ; `__proto__`, tableau, `null` → 400 | CA6, R16 | bout en bout | non |
| S15 | Erreurs en `application/json`, `Cache-Control: no-store` (aussi `/%61pi/candidats`), route inconnue sans `code`, id de 201 caractères → 404 « Route inconnue. » | CA15, R29 | bout en bout | non |
| S16 | Effacement après un PUT qui remplace un repère (serveur réel, sans VACUUM) | CA7 | bout en bout | non |
| S17 | Effacement après PUT puis DELETE ; GET → 404 | CA7 | bout en bout | non |
| S18 | Effacement d'un dossier de 220 Ko (pages de débordement) après PUT et DELETE | CA7 | intégration + bout en bout | oui (ajouté) |
| S19 | Table `journal` : une seule ligne `suppression`, `etape` nulle, aucune donnée du dossier | CA7, R22 | bout en bout | non |
| S20 | Point de contrôle gêné par un lecteur : PUT rendu en 0,14 s, avertissement, ancienne version lisible jusqu'à l'écriture suivante (README) | R21 | bout en bout | non |
| S21 | Journal du serveur sans nom ni email après 401, 403, 400, 409, 413, 415 | CA15, R28 | bout en bout | non |
| S22 | 500 provoqué (ligne `data` abîmée) : réponse « Erreur interne. », journal sans message brut | CA15, R27 | bout en bout | non |
| S23 | 503 sur le vrai serveur (verrou tenu par un autre processus) : PUT et DELETE en 503 après 5 s, rien écrit, rien au journal | CA10, R11 | bout en bout | non |
| S24 | `equipe.js` : `add`, doublon, `gmail.com`, « admin » en prénom, rôle inconnu, `role`/`disable` d'un inconnu, `list` | CA10, R32 | bout en bout | non |
| S25 | `equipe.js add` en échec (verrou 8 s) puis relancé : membre présent une fois | CA18 (b) | bout en bout | non |
| S26 | `equipe.js role` pendant un verrou de 2 s : attend puis réussit (1,7 s) | CA10 | bout en bout | non |
| S27 | `equipe.js` et l'API sur la même base : `role lecture` → 403, `role recruteur` → 200, `disable` → 403, réactivation → 200, `/api/equipe` | CA10, CA14 | bout en bout | non |
| S28 | Schéma piégé (table `journal` à `user_version` 0) : `server.js` refuse en code 1, base inchangée, relance réussie | CA18 (a) | bout en bout | oui (ajouté) |
| S29 | Même piège pour `equipe.js` : code 1, base inchangée, relance réussie | CA18 (a) | intégration | oui (ajouté) |
| S30 | Base en `user_version` 2 : API et `equipe.js` refusent en code 1 | CA9 | bout en bout | non |
| S31 | Valeurs absurdes : valeur vide suivie d'un commentaire, guillemets (PORT, HOST, DB_PATH, DEV_STATIC, DEV_EMAIL) | CA11, CA12 | unitaire | oui (ajouté) |
| S32 | `HOST` : commentaire, `" # x"` → refus ; guillemets, `#` sans espace → code 1 à l'écoute | CA12 | bout en bout | non |
| S33 | `DB_PATH` : `:memory:`, commentaire, `" # base"`, guillemets, dossier existant, variable exportée dans le shell → code 1 | CA12 | bout en bout | non |
| S34 | `DB_PATH` avec une espace finale | R4, R30, R32 | bout en bout | non |
| S35 | `DEV_EMAIL` / `DEV_STATIC` refusés avec `NODE_ENV` `production`, `" Production "`, `PRODUCTION`, `HOST` `0.0.0.0` et `192.168.1.10` | CA11 | bout en bout | non |
| S36 | `DEV_EMAIL` / `DEV_STATIC` absurdes : commentaire, guillemets, invalide, `..`, sans `index.html`, contenant la base | CA11 | bout en bout | non |
| S37 | `NODE_ENV` entre guillemets ou suivi d'un commentaire, avec `DEV_EMAIL` | R8 | bout en bout | non |
| S38 | Ligne de démarrage : hôte, port, base (relative → absolue), `user_version`, `NODE_ENV`, `DEV_EMAIL` en forme, `DEV_STATIC` absolu | R4, CA12 | bout en bout | oui (ajouté) |
| S39 | Mode local sur un site construit par `python3 tools/build.py` : pages, `/api/sante`, `DEV_EMAIL`, en-tête prioritaire, fichiers cachés, traversée, `/api/index.html` | CA11 | bout en bout | non |
| S40 | `SIGINT` et `SIGTERM` : code 0, `-wal` et `-shm` retirés ; fichiers en 600, dossier en 700 | R31, CA9 | bout en bout | non |
| S41 | `python3 tools/build.py` ne publie pas `api/` ; `git status` sans base ni `node_modules` | CA16 | autre | non |
| S42 | `node tools/test-store.js` | CA16 | autre (non-régression) | oui |
| S43 | Suite complète (50 tests) sur le poste (Node 26) et dans `node:22-bookworm-slim` | CA1, tous | autre | oui |
| S44 | Après un 503 : ni nom ni email au journal du serveur, aucune ligne de `journal`, rien sur le disque | CA15 | intégration | oui (ajouté) |
| S45 | Options : ajout 201, `" 1 mois "` (option de base) 200, 61 caractères 400, tableau 400, `lecture` 403 | CA13 | bout en bout | non |

## Détail des scénarios
Commun : `QA=…/scratchpad/qa` (hors du dépôt) ; serveur `NODE_ENV=production PORT=18431 DB_PATH=$QA/e2e/data/r.sqlite node api/server.js` ; équipe créée par `equipe.js` : `rec@` (recruteur), `adm@` (admin), `lec@` (lecture), `parti@` (désactivé) ; requêtes par `curl`.

### S1 — Installation sans Python
Préconditions : copie `git archive HEAD api` (sans `node_modules`) · Étapes : `docker run --rm -v $QA/ca1/api:/src:ro node:22-bookworm-slim sh -c 'cp -r /src /app && cd /app && command -v python3; npm ci'` · Attendu : pas de `python3`, `npm ci` réussit.
### S2 — Suite sous Node 22
Préconditions : S1 · Étapes : `npm test` dans le conteneur · Attendu : 44/44.
### S3 — Audit et dépendances
Préconditions : S1 · Étapes : `npm audit ; npm ls --depth=0` · Attendu : 0 vulnérabilité, `@fastify/static@10.1.6`, `better-sqlite3@13.0.3`, `fastify@5.12.7`.
### S4 — 401
Préconditions : serveur lancé · Étapes : `curl $U/api/candidats` sans en-tête, avec `X-Forwarded-User`, deux `X-Forwarded-Email`, `rec@yeita.fr.evil.com`, `rec@gmail.com`, en-tête vide ; PUT `{x` sans identité · Attendu : 401 « Identité absente ou invalide. ».
### S5 — Casse
Étapes : `-H 'X-Forwarded-Email: Rec@Yeita.FR' /api/moi` · Attendu : 200 `{"email":"rec@yeita.fr","prenom":"Léo","role":"recruteur"}`.
### S6 — 403 hors équipe
Étapes : GET avec `inconnu@`, GET et PUT avec `parti@` · Attendu : 403 `hors-equipe`.
### S7 — Exemption de `/api/sante`
Étapes : sans en-tête, `/api/sante`, `?x=1`, `/api/sante/`, `/api/candidats?x=/api/sante`, `--path-as-is /api/sante/../candidats`, `//api/candidats`, `/api//candidats`, `POST /api/sante` · Attendu : 200, 200, puis 401 partout.
### S8 — Rôle lecture
Étapes : `lec@` : PUT valide, PUT `{x`, PUT de 1,1 Mo, DELETE, POST options, PATCH, OPTIONS ; GET candidats, options ; HEAD · Attendu : 403 `lecture-seule` sur toute écriture, 200 sur GET et HEAD.
### S9 — Création
Étapes : PUT `version: null` (`rec@`) puis même id (`adm@`) · Attendu : 201 `version` 1, puis 409 `conflit`.
### S10 — Version périmée
Étapes : `rec@` PUT `version: 1` → 200 v2 ; `adm@` PUT `version: 1` ; GET ; PUT `version: 5` · Attendu : 409 ; GET rend « PREMIER » en v2 ; 409.
### S11 — Supprimé entre-temps
Étapes : créer `cand-qa2-bbbbb`, DELETE (`adm@`), PUT `version: 1` (`rec@`), DELETE, GET · Attendu : 204, 409, 404 `introuvable`, 404.
### S12 — Message exact
Étapes : comparer `erreur` du 409 au texte de `MODELE.md` (Node, `includes`) · Attendu : présent mot pour mot.
### S13 — Corps et identifiant
Étapes : PUT avec chaque champ fautif ; `text/plain` ; sans `Content-Type` ; `Content-Type:` vide ; 1,1 Mo ; DELETE et GET avec `Content-Type: application/json` sans corps · Attendu : 400 qui nomme le champ, 415, 413, 404/200.
### S14 — Variantes de `Content-Type`
Étapes : POST options avec 8 types ; PUT `__proto__`, `[1]`, `null`, vide · Attendu : JSON accepté quelle que soit la casse ou le `charset`, 415 sinon ; 400.
### S15 — Format des erreurs et cache
Étapes : `curl -sI` sur `/api/candidats` et `/%61pi/candidats` ; `/api/inconnue` ; id de 201 caractères · Attendu : `no-store` ; `{"erreur":"Route inconnue."}` sans `code`.
### S16 — Effacement après PUT
Étapes : créer avec « ZORGLUB-ANCIEN », PUT « ZORGLUB-NOUVEAU », `grep -c -a` dans `r.sqlite`, `-wal`, `-shm` (serveur en marche) · Attendu : ancien repère absent des trois fichiers.
### S17 — Effacement après DELETE
Étapes : DELETE, recherche de « ZORGLUB », GET · Attendu : absent partout ; 404.
### S18 — Dossier de plusieurs pages
Étapes : PUT d'un dossier de 220 Ko (« GROSREPERE » × 20 000), PUT d'un remplacement, DELETE ; test `effacement sur le disque d'un dossier de plusieurs pages (débordement), sans VACUUM (QA)` · Attendu : aucun repère après PUT ni après DELETE.
### S19 — Table journal
Étapes : lecture en lecture seule de `journal` · Attendu : `cand-qa2-bbbbb`, `cand-efface-zzzzz`, `cand-gros-aaaaa` : une ligne `suppression`, `etape` nulle ; colonnes `candidat_id, action, etape, par, le` seulement.
### S20 — Lecteur concurrent
Étapes : `lecteur.cjs` garde une lecture 3 s ; PUT V1 → V2 ; recherche ; PUT V3 après le départ du lecteur · Attendu : PUT rapide, avertissement « Point de contrôle incomplet », V1 lisible jusqu'à l'écriture suivante, puis effacé.
### S21 — Journal du serveur
Étapes : `grep -c -e ZORGLUB -e REPERE -e PREMIER -e NOM-EN-400 -e GROSREPERE -e '@yeita.fr' -e Léo serveur.log` · Attendu : 0.
### S22 — 500 provoqué
Étapes : `UPDATE candidats SET data = '{"candidat":{"nom":"CORROMPU-REPERE"'` ; GET de l'id et de la liste · Attendu : 500 « Erreur interne. » ; journal : type, code, pile sans première ligne, pas de « CORROMPU ».
### S23 — 503 réel
Étapes : `tenir.cjs` garde `BEGIN IMMEDIATE` 16 s ; PUT « BUSY-REPERE », DELETE, POST · Attendu : 503 après ~5,25 s ; le POST arrivé après la libération réussit ; « BUSY-REPERE » nulle part ; `journal` inchangé.
### S24 — Commandes de `equipe.js`
Étapes : voir le tableau ci-dessus · Attendu : messages de R32, code 0 ou 1.
### S25 — Échec puis relance (equipe.js)
Étapes : verrou 8 s ; `add nouv@` ; relance ; second `add` · Attendu : code 1 « Base occupée … » en 5,3 s, 0 ligne ; relance code 0 ; second `add` « Déjà membre actif » ; une ligne.
### S26 — Attente puis réussite
Étapes : verrou 2 s ; `role nouv@ lecture` · Attendu : code 0 après l'attente.
### S27 — Même base que l'API
Étapes : `/api/moi` et PUT de `nouv@` après chaque `role`, `disable`, `add` · Attendu : 200 lecture → 403 `lecture-seule` → 200 recruteur → 403 `hors-equipe` → 200 « Nouvelle » admin.
### S28 — Schéma piégé, API
Étapes : `CREATE TABLE journal (x)` ; `server.js` ; lecture de `sqlite_master` ; `DROP TABLE` ; relance · Attendu : code 1 « Schéma impossible à appliquer (…) : table journal already exists », `user_version` 0, seule `journal` ; relance OK, 4 tables, `user_version` 1. Test `schéma impossible au démarrage … (QA)`.
### S29 — Schéma piégé, `equipe.js`
Même chose avec `equipe.js add`. Test `schéma impossible (table journal à user_version 0) … (QA)`.
### S30 — Base plus récente
Étapes : `PRAGMA user_version = 2` ; `server.js` ; `equipe.js list` · Attendu : code 1 « Base d'une version plus récente (user_version 2). ».
### S31 — Valeurs absurdes (unitaire)
Test `valeurs absurdes : valeur vide suivie d'un commentaire, guillemets (QA)` de `config.test.js`.
### S32 — HOST
Étapes : `env -i … HOST=… node api/server.js` · Attendu : code 1 pour chaque valeur.
### S33 — DB_PATH
Étapes : idem, et `export DB_PATH='"data/r.sqlite"'; node api/equipe.js list` · Attendu : code 1 et une ligne qui nomme `DB_PATH`.
### S34 — DB_PATH avec espace finale
Étapes : `DB_PATH="$D/b.sqlite " node api/equipe.js add esp@yeita.fr Esp` puis `list` deux fois ; `ls` ; même chose dans `node:22-bookworm-slim` · Attendu : refus en code 1, ou chemin affiché égal au fichier ouvert et « (créée) » au premier appel seulement.
### S35 — Mode local hors poste
Étapes : 6 combinaisons `NODE_ENV` / `HOST` · Attendu : code 1, message qui nomme la variable.
### S36 — Mode local, valeurs absurdes
Étapes : 7 valeurs · Attendu : code 1.
### S37 — NODE_ENV mal écrit
Étapes : `NODE_ENV='"production"' DEV_EMAIL=moi@yeita.fr` puis `NODE_ENV='production # x' …` · Attendu (intention de R8 : « jamais en production ») : refus en code 1.
### S38 — Ligne de démarrage
Étapes : `PORT=18502 HOST=localhost DB_PATH=<relatif à api/> DEV_EMAIL=' Moi@Yeita.FR ' DEV_STATIC=<relatif> NODE_ENV=development`, lancé depuis un autre dossier · Attendu : `hote`, `port`, `base` absolue, `user_version` 1, `node_env`, `dev_email` en minuscules, `dev_static` absolu.
### S39 — Mode local sur le vrai site
Étapes : `python3 tools/build.py $QA/site` ; `equipe.js add moi@yeita.fr Moi admin` ; `DEV_EMAIL=moi@yeita.fr DEV_STATIC=$QA/site PORT=18520 node api/server.js` ; `/`, `/candidatures/`, `/assets/dossier.js`, `/api/sante`, `/api/moi` (sans et avec en-tête), `/api/index.html`, `/.env.local`, `/../api/package.json`, `/%2e%2e/api/package.json`, PUT · Attendu : site en 200 (`public, max-age=0`), API inchangée, fichiers cachés et traversée en 403.
### S40 — Arrêt
Étapes : `kill -INT` / `kill -TERM` · Attendu : code 0, `-wal` et `-shm` retirés, fichiers en 600, dossier en 700.
### S41 — Publication
Étapes : `python3 tools/build.py $QA/site` ; `find $QA/site -name '*.sqlite*' -o -name node_modules -o -name 'package*.json'` ; `git status --porcelain --ignored` · Attendu : pas de `api/`, rien trouvé ; seul `api/node_modules/` ignoré.
### S42 — Store
Étapes : `node tools/test-store.js` · Attendu : « TOUT OK ».
### S43 — Suite complète
Étapes : `cd api && npm test` ; copie sans `node_modules` dans `node:22-bookworm-slim` : `npm ci && npm test` · Attendu : 50/50.
### S44 — Journal après un 503
Test `journal du serveur et table journal : rien du dossier après un 503 (QA)` de `candidats.test.js`.
### S45 — Options
Étapes : POST `CT-TEST`, `" 1 mois "`, 61 caractères, `[1]` ; POST par `lec@` · Attendu : 201 puis 200 avec la liste ; 400 ; 403.
