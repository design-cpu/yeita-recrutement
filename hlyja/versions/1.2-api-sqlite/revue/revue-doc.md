---
type: revue-doc
version: 1.2
pages: 7
erreurs: 7
corrigees: 0
date: 2026-10-26
---
# Revue de la documentation — API Node.js sur SQLite pour les dossiers candidat

> 7 pages vérifiées contre le code au commit `2497be9` (aucun commit depuis sur leurs `sources` ; `cd api && npm test` : 52 tests, 52 réussis, ~21 s). La doc est exacte sur l'essentiel : routes, messages, variables, tables et réglages correspondent au code. 7 erreurs, aucune bloquante : un code 503 oublié pour l'ajout d'option (deux pages), un déploiement derrière oauth2-proxy présenté comme fait, une décision v1.0 devenue périmée, un point de contrôle décrit trop largement, deux listes incomplètes.

## Pages vérifiées
| Page | Conforme | Dans le cadre | Cohérente | Complète | Remarques |
|---|---|---|---|---|---|
| `hlyja/technique/api.md` | non (1, 6) | non (3) | oui | oui | Fichiers, exports, routes, ordre des contrôles, réglages, variables, sortie d'`equipe.js`, champs journalisés : vérifiés ligne à ligne. `maxParamLength` vérifié par `inject` (`:id` de 165 caractères → 400, de 272 → 404 « Route inconnue. »). Non bloquant : un corps non JSON sur `DELETE` ou `GET` donne aussi 415 (règle générale de l'analyseur, déjà dans le tableau « Autorisation et requête ») ; `HEAD` sur les routes `GET` (exposé par Fastify, rôle `lecture` autorisé) n'est pas listé ; les tableaux autres que « Routes » n'ont pas de colonne « Depuis » (tout date de 1.2, page créée en 1.2). |
| `hlyja/technique/architecture.md` | oui | oui | oui | oui | Pile (versions de `package.json` et du lockfile), commande du poste « API seule » vérifiées. Le schéma d'ensemble ne montre pas l'API : juste, elle n'est pas déployée. |
| `hlyja/technique/conventions.md` | non (5) | oui | oui | oui | `api` dans `SKIP`, `.gitignore` (`api/node_modules/`, `api/data/`), 52 tests, ancre `#tests` (citée par `api.md`) : vérifiés. |
| `hlyja/technique/decisions.md` | non (4) | oui | non (7) | oui | Les cinq décisions de la version sont présentes et tracées (spec finale, vérifications, revue de code : Fastify 5.12.5 / 5.12.7, 9 transitives, fast-uri). |
| `api/README.md` | non (2) | oui | oui | oui | Variables et refus, messages d'erreur, ordre des contrôles, sortie d'`equipe.js`, correspondance avec l'adaptateur, identifiant de plus de 200 caractères : conformes. « Cinq écritures attendent 5 s » : 3 (`candidats.test.js`) + 1 (`base.test.js`) + 1 (`equipe.test.js`), conforme. |
| `README.md` (section « L'API de stockage », ligne de test) | oui | oui | oui | oui | Lien `api/README.md` valide. |
| `docs/backend/MODELE.md` (section « Tables SQLite ») | oui | oui | oui | oui | Les quatre `CREATE TABLE` sont identiques à `SCHEMA` de `api/src/base.js` (seuls les commentaires diffèrent). Lien `../../api/README.md` valide. Lignes 69 et 159 (« aujourd'hui dans le navigateur ») restent vraies : les pages ne sont pas branchées. |

## Erreurs à corriger
| # | Page | Problème | Correction attendue |
|---|---|---|---|
| 1 | `hlyja/technique/api.md` § Routes | `POST /api/options-disponibilite` : 503 manque dans les erreurs. Le code écrit en `transaction(...).immediate()` (`api/src/options.js`) et le test `candidats.test.js` « base occupée : PUT, DELETE et POST en 503 » le vérifie. | Erreurs : `400, 401, 403, 413, 415, 503`. |
| 2 | `api/README.md` § Contrat HTTP | Même oubli dans le tableau des routes pour `POST /api/options-disponibilite`. | Erreurs : `400, 401, 403, 413, 415, 503`. |
| 3 | `hlyja/technique/api.md` (synthèse et « Vue d'ensemble ») | « Placé derrière oauth2-proxy (`X-Forwarded-Email`) » et le schéma `Navigateur → oauth2-proxy → API` présentent comme un fait un déploiement qui n'existe pas : en v1.2, oauth2-proxy ne sert que `file:///srv/site/` (`deploy/oauth2-proxy.cfg`, `architecture.md`) et `api/README.md` dit « sera placé ». | « Conçue pour être placée derrière oauth2-proxy, dont elle croit `X-Forwarded-Email` ; en v1.2, ni dans Docker ni derrière oauth2-proxy, pas branchée aux pages » ; titrer le schéma « Déploiement visé » (ou ajouter une ligne qui le dit). |
| 4 | `hlyja/technique/decisions.md`, décision « Effacement réel » | « `wal_checkpoint(TRUNCATE)` après chaque écriture » : le code ne le fait qu'après les écritures sur `candidats` (PUT, DELETE dans `api/src/candidats.js`), pas après `POST /api/options-disponibilite` ni `equipe.js` (conforme à la spec R21 : « après toute écriture sur `candidats` »). | « après chaque écriture sur `candidats` (PUT, DELETE) ». |
| 5 | `hlyja/technique/conventions.md` § Tests, paragraphe « API (v1.2) » | Liste des outils de `test/aide.js` incomplète : manquent `siteConstruit` et `MEMBRES` (exports de `api/test/aide.js`). | `dossierTemporaire`, `siteConstruit`, `dossier`, `fichiersContiennent`, `MEMBRES`, `creerApp`, `requete`. |
| 6 | `hlyja/technique/api.md` § Base, table `equipe` | Contraintes incomplètes : la contrainte `CHECK (length(trim(prenom)) > 0)` (prénom non vide) n'est pas citée. | Ajouter « prénom non vide » aux contraintes de `equipe`. |
| 7 | `hlyja/technique/decisions.md`, décision « Stockage et authentification » (1.0) | Conséquences : « l'authentification est en place depuis v1.1, le stockage SQLite reste à faire » — périmé et contradictoire avec la décision « API de stockage » (1.2) de la même page. | « … l'authentification est en place depuis v1.1 ; l'API SQLite existe depuis v1.2 (`api/`), pas encore branchée aux pages ». |

Vues humaines écrites d'après le code là où la source est fausse : `api.humain.md` dit que l'ajout d'une option peut aussi répondre « Base occupée » (erreurs 1-2) et que le schéma montre l'installation visée, l'API n'étant pas encore derrière oauth2-proxy (erreur 3) ; `decisions.humain.md` dit « après chaque écriture d'un dossier » (erreur 4) et que l'API SQLite existe depuis la v1.2 sans être branchée (erreur 7).

## Vues humaines écrites
| Page | Fichier |
|---|---|
| API de stockage (nouvelle) | `hlyja/technique/api.humain.md` |
| Architecture et déploiement | `hlyja/technique/architecture.humain.md` |
| Conventions et tests | `hlyja/technique/conventions.humain.md` |
| Décisions techniques | `hlyja/technique/decisions.humain.md` |

Frontmatter repris de chaque source, plus `vue: humaine`. `api/README.md`, `README.md` et `docs/backend/MODELE.md` sont hors `hlyja/` : pas de vue humaine.

## Glossaire
`hlyja/glossaire.md`, `maj: 1.2`, 8 termes ajoutés en ordre alphabétique avec l'existant :
- **API** (Aussi : API de stockage)
- **Conflit d'écriture** (Aussi : conflit, conflits, version optimiste)
- **Effacement réel** (Aussi : effacement)
- **En-tête** (Aussi : en-têtes, X-Forwarded-Email)
- **Journal** (Aussi : journal des actions) — distingué du journal du serveur dans la définition
- **Mode local** (Aussi : DEV_EMAIL, DEV_STATIC)
- **Node.js** (Aussi : Node)
- **SQLite** (Aussi : base SQLite)

## Couverture
| Élément de la version | Présent dans |
|---|---|
| `GET /api/sante` | `api.md` § Routes ; `api/README.md` § Contrat HTTP |
| `GET /api/moi` | `api.md` ; `api/README.md` |
| `GET /api/equipe` | `api.md` ; `api/README.md` |
| `GET /api/candidats` | `api.md` ; `api/README.md` |
| `GET /api/candidats/:id` | `api.md` ; `api/README.md` |
| `PUT /api/candidats/:id` | `api.md` ; `api/README.md` ; `decisions.md` (version optimiste) |
| `DELETE /api/candidats/:id` | `api.md` ; `api/README.md` ; `decisions.md` (effacement réel) |
| `GET /api/options-disponibilite` | `api.md` ; `api/README.md` |
| `POST /api/options-disponibilite` | `api.md` ; `api/README.md` (503 manquant, erreurs 1-2) |
| Autre `/api/*` → 404 « Route inconnue. » | `api.md` ; `api/README.md` |
| Table `equipe` | `api.md` § Base ; `MODELE.md` § Tables SQLite |
| Table `candidats` | `api.md` ; `MODELE.md` ; `decisions.md` |
| Table `journal` | `api.md` ; `MODELE.md` ; `decisions.md` |
| Table `options_disponibilite` | `api.md` ; `MODELE.md` |
| Réglages SQLite (umask, WAL, `busy_timeout`, `secure_delete`, `user_version`, `TRUNCATE`) | `api.md` § Base ; `decisions.md` (effacement réel) |
| Variables `PORT`, `HOST`, `DB_PATH`, `NODE_ENV`, `DEV_EMAIL`, `DEV_STATIC` | `api.md` § Configuration ; `api/README.md` § Variables ; `decisions.md` (`HOST`, mode local) |
| Commande `node api/equipe.js add|list|disable|role` | `api.md` § `equipe.js` ; `api/README.md` § Gérer l'équipe ; `README.md` |
| Commandes `npm start`, `npm test` | `api.md` ; `architecture.md` § Environnements ; `conventions.md` § Tests ; `README.md` |
| Dépendances Node.js ≥ 22, `fastify` 5.12.7, `better-sqlite3` 13.0.3, `@fastify/static` 10.1.6 ; `api/.npmrc` | `architecture.md` § Stack ; `api/README.md` ; `decisions.md` (exception des 14 jours) |
| `api` dans `SKIP` de `tools/build.py` ; `.gitignore` | `conventions.md` § Organisation et Publication |
| Décision « API de stockage » | `decisions.md` |
| Décision « Confiance dans `X-Forwarded-Email` » | `decisions.md` ; `api/README.md` § Exposition |
| Décision « Conflits par version optimiste » | `decisions.md` |
| Décision « Effacement réel » | `decisions.md` (erreur 4) ; `api/README.md` § Ce que l'API garde |
| Décision « Dépendances de moins de 14 jours » | `decisions.md` |
