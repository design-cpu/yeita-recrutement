---
type: rapport-qa
version: 1.2
taux: 95.6
ok: 43
echec: 2
manuel: 3
couches: unitaire, intégration, bout en bout, autre
date: 2026-10-26
---

# Rapport QA — API Node.js sur SQLite pour les dossiers candidat

> **Taux de réussite : 95,6 %** (43/45) · 2 échecs · 3 à vérifier à la main
> Régressions : aucune · Bugs : 2 mineurs (`DB_PATH` avec une espace finale ; `NODE_ENV` entre guillemets ou suivi d'un commentaire ne verrouille pas le mode local), aucun bloquant ni majeur.

QA indépendante, sur `2abb25e` (branche `version/1.2-api-sqlite`). Le code de production n'a pas été modifié. Essais dans le scratchpad, hors du dépôt. Docker Desktop 29.9.2, image `node:22-bookworm-slim` (Node 22.23.4, npm 10.9.9) ; poste Node 26.11.1.

## Résultats
| # | Scénario | Résultat | Détail |
|---|---|---|---|
| S1 | `npm ci` sans Python, `.npmrc` seul | ok | `command -v python3` : absent ; `npm ci` : « added 71 packages » |
| S2 | 44 tests sous Node 22 | ok | `# tests 44 # pass 44 # fail 0`, 16,1 s |
| S3 | Audit, dépendances | ok | `found 0 vulnerabilities` ; `@fastify/static@10.1.6`, `better-sqlite3@13.0.3`, `fastify@5.12.7` |
| S4 | 401 | ok | 7 cas en 401 `{"erreur":"Identité absente ou invalide."}` |
| S5 | Casse de l'email | ok | 200 `{"email":"rec@yeita.fr","prenom":"Léo","role":"recruteur"}` |
| S6 | 403 hors équipe | ok | inconnu, inactif (GET et PUT) : 403 `hors-equipe` |
| S7 | Exemption de `/api/sante` | ok | 200, 200, puis 401 sur les 7 autres adresses |
| S8 | Rôle lecture | ok | PUT valide, `{x`, 1,1 Mo, DELETE, POST, PATCH, OPTIONS : 403 `lecture-seule` ; GET, HEAD : 200 |
| S9 | Création, doublon | ok | 201 `version` 1 ; 409 `conflit` |
| S10 | Version périmée | ok | 200 v2 puis 409 ; base = « PREMIER » v2 ; `version` 5 → 409 |
| S11 | Supprimé entre-temps | ok | 204, 409, 404 `introuvable`, 404 |
| S12 | Message de `MODELE.md` | ok | présent mot pour mot (l. 18) |
| S13 | Corps et identifiant | ok | 400 nommant le champ ; 415 × 3 ; 413 ; DELETE et GET JSON sans corps acceptés |
| S14 | Variantes de `Content-Type` | ok | `APPLICATION/JSON`, `charset=utf-8`, `charset=latin1` acceptés ; 5 types en 415 ; `__proto__` 400 « JSON invalide. » |
| S15 | Erreurs JSON, cache | ok | `no-store` aussi sur `/%61pi/candidats` ; `{"erreur":"Route inconnue."}` |
| S16 | Effacement après PUT | ok | « ZORGLUB-ANCIEN » : 0 dans `.sqlite`, `-wal` (0 octet), `-shm` |
| S17 | Effacement après DELETE | ok | « ZORGLUB » : 0 partout ; GET 404 |
| S18 | Dossier de 220 Ko | ok | après PUT et DELETE : 0 partout (serveur réel et test ajouté) |
| S19 | Table journal | ok | une ligne `suppression`, `etape` nulle, par id supprimé ; aucune donnée du dossier |
| S20 | Lecteur concurrent | ok | PUT en 0,14 s, « Point de contrôle incomplet… » ; V1 lisible jusqu'à l'écriture suivante, puis 0 (conforme au README) |
| S21 | Journal du serveur | ok | 128 lignes, 0 repère, 0 email ; seuls méthode, URL, hôte, adresse, port, statut, durée |
| S22 | 500 provoqué | ok | « Erreur interne. » ; journal : `SyntaxError` / `SqliteError`, pile sans 1re ligne, 0 « CORROMPU » ; voir observation O1 |
| S23 | 503 réel | ok | PUT 503 en 5,25 s, DELETE 503 ; « BUSY-REPERE » : 0 ; `journal` inchangé (5 lignes) |
| S24 | Commandes de `equipe.js` | ok | messages de R32, codes 0/1 |
| S25 | Échec puis relance | ok | code 1 en 5,3 s, 0 ligne ; relance code 0 ; doublon refusé ; 1 ligne |
| S26 | Attente puis réussite | ok | code 0 en 1,7 s |
| S27 | Même base que l'API | ok | 200 → 403 `lecture-seule` → 200 → 403 `hors-equipe` → 200 « Nouvelle » admin |
| S28 | Schéma piégé, API | ok | code 1 « Schéma impossible à appliquer (…/s.sqlite) : table journal already exists » ; `user_version` 0, seule `journal` ; relance OK |
| S29 | Schéma piégé, `equipe.js` | ok | idem ; relance « Ajouté : … » |
| S30 | `user_version` 2 | ok | API et `equipe.js` : code 1 « Base d'une version plus récente (user_version 2). » |
| S31 | Valeurs absurdes (unitaire) | ok | test ajouté |
| S32 | HOST | ok | `127.0.0.1 # x`, ` # x` : « HOST refusé » ; `"127.0.0.1"`, `127.0.0.1#x` : code 1 « Impossible d'écouter … : adresse indisponible. » (voir O2) |
| S33 | DB_PATH | ok | 6 cas, dont `export` dans le shell : code 1, une ligne qui nomme `DB_PATH` |
| S34 | DB_PATH avec espace finale | **echec** | bug B1 |
| S35 | Mode local hors poste | ok | 6 combinaisons : code 1, variable nommée |
| S36 | Mode local, valeurs absurdes | ok | 7 cas : code 1 |
| S37 | `NODE_ENV` mal écrit + `DEV_EMAIL` | **echec** | bug B2 |
| S38 | Ligne de démarrage | ok | `hote`, `port`, `base` absolue, `user_version` 1, `node_env`, `dev_email` `moi@yeita.fr`, `dev_static` absolu ; écoute sur `[::1]` et `127.0.0.1` pour `localhost` |
| S39 | Mode local sur le vrai site | ok | `/`, `/candidatures/`, `/assets/dossier.js` 200 (`public, max-age=0`) ; `/api/sante` 200 ; `/api/moi` = `moi@` sans en-tête, `rec@` avec ; `/.env.local`, traversées : 403 ; `/api/index.html` : 404 JSON |
| S40 | Arrêt | ok | SIGINT et SIGTERM : code 0 ; `-wal`, `-shm` retirés ; fichiers 600, dossier 700 |
| S41 | Publication | ok | pas d'`api/` dans le site ; aucune base ni `node_modules` ; `git status` : seul `api/node_modules/` ignoré |
| S42 | Store | ok | « TOUT OK » |
| S43 | Suite complète | ok | 50/50 sur le poste (21,3 s) et dans `node:22-bookworm-slim` (« added 71 packages », 50/50) |
| S44 | Journal après un 503 | ok | test ajouté |
| S45 | Options | ok | 201, 200 (option de base), 400 × 2, 403 |

## Par couche
| Couche | Scénarios | Réussis | Échoués | Outil |
|---|---|---|---|---|
| Unitaire | 1 (S31) + suite | 1 | 0 | `node:test` (`config.test.js`) |
| Intégration | 3 (S18, S29, S44) + suite | 3 | 0 | `node:test`, `inject`, `equipe.js` en processus fils |
| Bout en bout | 35 | 33 | 2 | `node api/server.js` réel, `curl`, `env -i`, `equipe.js`, scripts `tenir.cjs` / `lecteur.cjs` / `lire.cjs` (better-sqlite3) |
| Autre (installation, publication, non-régression) | 6 (S1, S2, S3, S41, S42, S43) | 6 | 0 | Docker `node:22-bookworm-slim`, `npm`, `python3 tools/build.py`, `node tools/test-store.js` |

## Suite de tests complète
Commande : `cd api && npm test` (poste, Node 26.11.1) ; `docker run --rm -v <copie de api/ sans node_modules>:/src:ro node:22-bookworm-slim sh -c 'cp -r /src /app && cd /app && npm ci && npm test'` · Résultat : 50/50 (44 existants + 6 ajoutés par la QA), 21,3 s sur le poste ; 50/50 sous Node 22.23.4 ; `node tools/test-store.js` : TOUT OK ; `npm audit` : 0.

Tests ajoutés (suffixe « (QA) », aucun nouveau fichier, 7 fichiers dans `test/`) :
| Fichier | Test |
|---|---|
| `api/test/config.test.js` | valeurs absurdes : valeur vide suivie d'un commentaire, guillemets (QA) |
| `api/test/candidats.test.js` | effacement sur le disque d'un dossier de plusieurs pages (débordement), sans VACUUM (QA) |
| `api/test/candidats.test.js` | journal du serveur et table journal : rien du dossier après un 503 (QA) |
| `api/test/equipe.test.js` | schéma impossible (table journal à user_version 0) : code 1, base inchangée, relance après correction (QA) |
| `api/test/serveur.test.js` | schéma impossible au démarrage : code 1, base inchangée, relance après correction (QA) |
| `api/test/serveur.test.js` | ligne de démarrage du mode local : DEV_EMAIL en forme, DEV_STATIC en chemin absolu, NODE_ENV (QA) |

Les deux bugs n'ont pas de test ajouté : un test rouge casserait `npm test` ; le test est à écrire avec la correction.

## Bugs trouvés
| Bug | Gravité | Statut | Correction proposée |
|---|---|---|---|
| B1 — `DB_PATH` avec une espace finale : SQLite ouvre le fichier **sans** l'espace (`b.sqlite`), mais l'API et `equipe.js` affichent et contrôlent `b.sqlite ` : « Base : …/b.sqlite  (créée) » à **chaque** appel, et la ligne de démarrage donne un chemin qui n'existe pas (R4, R32). Reproduction : `DB_PATH="/tmp/x/b.sqlite " node api/equipe.js add esp@yeita.fr Esp`, puis `DB_PATH="/tmp/x/b.sqlite " node api/equipe.js list` → « (créée) » les deux fois ; `ls /tmp/x` → `b.sqlite`. Même résultat dans `node:22-bookworm-slim`. Un `DB_PATH=' '` donne « Base impossible à ouvrir (…/api/ ) ». Cas réaliste : espace oubliée en fin de ligne d'un fichier `.env` | mineur | ouvert | dans `cheminBase` (`api/src/config.js`), refuser une valeur qui commence ou finit par une espace (« DB_PATH refusé : « … » commence ou finit par une espace. »), comme `#` et les guillemets ; même règle pour `DEV_STATIC` ; test dans `config.test.js` |
| B2 — `NODE_ENV` entre guillemets ou suivi d'un commentaire n'est pas reconnu comme production : `DEV_EMAIL` (et `DEV_STATIC`) sont acceptés. Reproduction : `env -i PATH="$PATH" NODE_ENV='"production"' DEV_EMAIL=moi@yeita.fr DB_PATH=/tmp/x/c.sqlite PORT=18501 node api/server.js` → démarre, « Mode local : DEV_EMAIL=moi@yeita.fr », `node_env: "\"production\""` ; idem avec `NODE_ENV='production # x'`. Effet : sur un serveur où l'API écoute en local derrière oauth2-proxy, toute requête sans `X-Forwarded-Email` passerait pour `DEV_EMAIL`. Atténué par le verrou `HOST` (le cas Docker `HOST=0.0.0.0` reste refusé) et visible dans la ligne de démarrage. Hors de la lettre de R30 (qui ne contrôle pas `NODE_ENV`), contraire à l'intention de R8 et du README (« jamais en production ») | mineur | ouvert | dans `lireConfig`, refuser `NODE_ENV` contenant `#` ou un guillemet (même `formeDeChemin` sous un autre nom), ou refuser le mode local dès que `NODE_ENV` contient « production » ; test dans `config.test.js` ; ligne `NODE_ENV` du tableau des variables du README |

## Régressions
Aucune. `node tools/test-store.js` : TOUT OK. `python3 tools/build.py` ne publie pas `api/` (`api` dans `SKIP`). Les 44 tests existants passent, inchangés, sous Node 22 et Node 26. Aucune base dans `api/` après les essais (`git status --porcelain --ignored api` : seul `api/node_modules/`).

Observations (sans échec de critère) :
- O1 — Une seule ligne `data` abîmée rend **toute** la liste indisponible (`GET /api/candidats` → 500 : `json_extract` du tri échoue en `SQLITE_ERROR`). L'API ne peut pas écrire une telle ligne (`JSON.stringify`) ; à garder en tête pour une restauration ou une migration (backlog possible).
- O2 — `HOST` entre guillemets ou avec `#` sans espace : refus en code 1 seulement à l'écoute, après création de la base (permis par R30 : « à l'échec de l'écoute »).
- O3 — « Base d'une version plus récente (user_version 2). » ne nomme pas le chemin, contrairement aux autres erreurs de base (texte fixé par R12).
- O4 — Pendant la QA, des fichiers que la QA n'a pas touchés ont changé dans le dépôt : `hlyja/technique/architecture.md`, `conventions.md`, `decisions.md` (modifiés) et `hlyja/technique/api.md` (nouveau), probablement par l'étape de documentation menée en parallèle. À vérifier par l'orchestrateur avant le commit.

Écarts entre `api/README.md` et le comportement réel :
| Point du README | Réel |
|---|---|
| « Chaque commande commence par `Base : <chemin absolu>` » | pas pour une commande mal tapée (usage, email, rôle, prénom) : contrôlée avant d'ouvrir la base, elle n'affiche que l'erreur (voulu : rien n'est créé) |
| Journal du serveur : « jamais le corps ni l'email » | en mode local, la ligne de démarrage (`dev_email`) et l'avertissement « Mode local : DEV_EMAIL=… » contiennent l'email du développeur (voulu par R4 et R8) |
| `NODE_ENV` : « casse et espaces ignorés » | exact, mais guillemets et commentaire ne sont pas reconnus (B2) |
| `HOST` : refus « une valeur avec un espace » | guillemets et `#` sans espace : code 1 à l'écoute (« adresse indisponible »), base déjà créée (O2) |
| Tests : « une vingtaine de secondes : quatre écritures attendent … 5 secondes » | avec le test ajouté par la QA (S44), **cinq** écritures attendent ; 21,3 s mesurées. Phrase à mettre à jour (« cinq ») |
| `DB_PATH` : chemin d'un fichier | une espace finale ouvre un autre fichier que celui affiché (B1) |
Tout le reste (installation, première mise en place, exposition, variables, mode local, `equipe.js`, arrêt, contrat HTTP, codes et messages, correspondance de l'adaptateur, effacement et son exception, droits des fichiers) est conforme à ce qui a été observé.

## À vérifier à la main
- H1 : derrière oauth2-proxy avec le fournisseur Google, `X-Forwarded-Email` porte l'email du compte (version suivante, vrais identifiants).
- H3 : réponse d'oauth2-proxy (302 ou 403, pas du JSON de l'API) à une requête `/api/*` sans session, à traiter par l'adaptateur (version suivante).
- Sur le serveur : `equipe.js` lancé avec le même utilisateur système que l'API (droits 600/700 : un autre utilisateur ne peut pas ouvrir la base) ; non essayé sans le serveur OVH (interdit en P4).
