---
type: verifications
version: 1.2
total: 24
ecarts: 6
date: 2026-10-26
---

# Vérifications — API Node.js sur SQLite pour les dossiers candidat

> 24 vérifications (V18 à V24 après le tour 1), 6 écarts avec ce qu'on supposait :
> - quiconque atteint directement le port de l'API peut forger son identité (V10) : l'utilisateur a choisi une écoute sur 127.0.0.1 par défaut, avec la variable `HOST` ;
> - Fastify 5.12.5 a une faille faible, et le correctif n'a que 13 jours (V2) : l'utilisateur a choisi 5.12.7 ;
> - avec npm 10 (Node 22), `npm ci` tente de compiler better-sqlite3 (V3) : on installe avec `--ignore-scripts` ;
> - `MODELE.md` propose d'autres tables que le pitch (V12) : la section sera alignée (accord de l'utilisateur) ;
> - un `DELETE` laisse le dossier lisible sur le disque (V18) : `secure_delete` et point de contrôle `TRUNCATE` ;
> - Fastify accepte `text/plain` par défaut, et une requête sans `Content-Type` atteint la route (V19).

Essais faits dans le scratchpad, hors du dépôt ; Docker Desktop 29.9.2 pour Node 22 et oauth2-proxy.

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | Node disponible | `node --version` ; images `node:22-bookworm-slim`, `node:22-alpine` | poste : v26.11.1 ; images : v22.23.4 (npm 10.9.9) | Cible Node 22 ; essais sur 22 (Docker) et sur le poste (26) |
| V2 | Versions, dates, licences | `npm view <p> time/license/engines` ; `npm audit` | fastify 5.12.7 (2026-10-13, MIT) ; 5.12.5 (2026-09-16) a GHSA-389g-gv7q-r4x8 (faible), corrigée en 5.12.6 et 5.12.7 ; better-sqlite3 13.0.3 (2026-08-05, MIT, `engines.node >=22`) ; @fastify/static 10.1.6 (2026-10-09, MIT), la 10.1.7 a 5 jours ; audit avec 5.12.7 : 0 vulnérabilité | **Écart** : Fastify 5.12.7 a 13 jours (choix de l'utilisateur) ; @fastify/static 10.1.6 ; versions exactes (R2) |
| V3 | Installation de better-sqlite3 | `npm ci` puis `npm ci --ignore-scripts` dans `node:22-bookworm-slim` (arm64), `node:22-alpine`, `--platform linux/amd64` | `npm ci` : `node-gyp rebuild` implicite (présence de `binding.gyp`, aucun script d'installation déclaré), échec sans Python. `--ignore-scripts` : les binaires fournis (`prebuilds/`, 8 plateformes) se chargent partout ; SQLite 3.53.4. Sur le poste (npm 11.20), les scripts sont bloqués par défaut, le chargement réussit | **Écart** : installation `npm ci --ignore-scripts` (R3), figée par un `api/.npmrc` |
| V4 | WAL | `db.pragma('journal_mode = WAL', {simple: true})` sur un fichier | `wal` | R10 |
| V5 | Limite de corps de Fastify | `bodyLimit: 1048576`, corps JSON de 1 Mo + 10 octets | 413 `FST_ERR_CTP_BODY_TOO_LARGE` ; JSON invalide : 400 `FST_ERR_CTP_INVALID_JSON_BODY` | R16 |
| V6 | Tri sans colonne tirée du JSON | `json_extract(data, '$.meta.modifieLe')` | fonctionne (SQLite 3.53.4) | R12 : tri dans la requête, pas de colonne |
| V7 | Deux écrivains (API et `equipe.js`) | deux connexions, `BEGIN IMMEDIATE` sur la première, `timeout: 200` sur la seconde | écriture concurrente : `SQLITE_BUSY` après le délai ; lecture pendant l'écriture : OK (WAL) ; écriture après `COMMIT` : OK | R11 : délai d'attente, erreur claire si dépassé |
| V8 | En-tête `X-Forwarded-Email` vu par Fastify | `curl` avec doublon, vide, casse, espaces | doublon → `"a@yeita.fr, b@yeita.fr"` ; vide → absent ; `"A@Yeita.FR "` → `"A@Yeita.FR"` (espaces retirés par Node) | R5 : en minuscules ; doublon (virgule) refusé |
| V9 | **Essai d'attaque** au travers d'oauth2-proxy v7.15.5 | upstream d'écho `http://echo:8000/api/`, `skip_auth_routes = ["^/api/sante$"]`, `htpasswd_file` pour une session de test ; `X-Forwarded-Email: pirate@yeita.fr` forgé | route publique : en-tête **retiré** (aussi en minuscules, en double, `X_Forwarded_Email`) ; route protégée sans session : 403, upstream jamais atteint ; avec session (Basic `alice@yeita.fr`) : l'en-tête forgé est **retiré**, l'upstream reçoit `X-Forwarded-User: alice@yeita.fr` et pas de `X-Forwarded-Email` (une session htpasswd n'a pas d'email) | La confiance du pitch tient au travers d'oauth2-proxy. H1 : avec Google, l'en-tête porte l'email du compte (à vérifier à la version suivante) |
| V10 | **Témoin** : accès direct à l'upstream | même requête envoyée à `http://echo:8000/api/candidats` depuis le réseau Docker | l'en-tête forgé **arrive tel quel** | **Écart** : l'API ne doit être joignable que par oauth2-proxy. Décision de l'utilisateur : `HOST` (127.0.0.1 par défaut) (R4) ; `DEV_EMAIL` refusé si `HOST` n'est pas locale (R7) |
| V11 | Message de conflit | `grep -n "Recharge la page" docs/backend/MODELE.md` | ligne 18 : « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. » | R14, mot pour mot |
| V12 | Tables proposées par `MODELE.md` | lecture de la section « Tables SQLite proposées » | colonnes tirées du JSON (`personne`, `job`, `etape`…), tables de provenances et de recruteurs, `equipe (prenom PRIMARY KEY, email)` | **Écart** avec le pitch : section alignée (accord de l'utilisateur) (R25) |
| V13 | `api/` publié par la construction du site | `grep -n SKIP tools/build.py` | `api` absent de `SKIP` : `api/`, `node_modules` et une base dans `api/` seraient copiés dans `_site` | [ajout] `api` dans `SKIP` (R24) |
| V14 | Options de disponibilité | `assets/dossier.js` `DISPOS` ; `assets/store.js` l. 109-115 | 6 options de base dans le code ; seules les options **ajoutées** sont stockées (`yeita-options-disponibilite`), sans doublon avec la base | R19 : la table ne garde que les ajouts |
| V15 | Format de l'identifiant | `assets/dossier.js` `uid()` ; `importCode` | `cand-` + horodatage base 36 + `-` + 5 caractères base 36 ; `importCode` peut reprendre un `id` venu d'un code | R15 : motif borné, pas strictement celui de `uid()` |
| V16 | Ce que Fastify écrit dans ses journaux | `logger: true`, PUT avec un corps nominatif, erreurs 413, 400, 500 | méthode, URL (paramètres compris), hôte, adresse ; jamais le corps ni les en-têtes ; le message d'erreur du JSON invalide ne cite pas le corps | R22 : journaux par défaut acceptables, pas de corps ni d'email |
| V17 | Lanceur de tests | `node --test --help` (Node 26) ; `node:test` présent depuis Node 18 | disponible | R26 : `node --test` |
| V18 | Effacement sur le disque | insertion d'un dossier « ZORGLUB-ANCIEN », PUT « ZORGLUB-NOUVEAU », DELETE, puis recherche du texte dans `.db`, `-wal`, `-shm` (better-sqlite3, WAL) | par défaut : **trouvé** dans `-wal`, puis dans `.db` après fermeture ; `secure_delete = ON` seul : trouvé dans `-wal` tant que la base est ouverte ; `wal_checkpoint(TRUNCATE)` seul : trouvé dans `.db` ; **`secure_delete = ON` + `wal_checkpoint(TRUNCATE)`** : propre partout, aussi après fermeture | **Écart** : effacement réel = les deux (R10, R21) |
| V19 | Analyseurs de corps de Fastify | `inject` : PUT `text/plain`, formulaire, sans `Content-Type`, JSON avec `charset` ; DELETE avec `Content-Type: application/json` sans corps ; avec et sans `removeContentTypeParser('text/plain')` | défaut : `text/plain` → 200 (corps chaîne) ; formulaire → 415 ; sans `Content-Type` → 200 (corps `undefined`) ; `charset` → 200 ; DELETE JSON vide → 400 `FST_ERR_CTP_EMPTY_JSON_BODY`. Sans l'analyseur texte : `text/plain` → 415, le reste identique | **Écart** : analyseur texte retiré, `Content-Type` exigé par la route pour PUT et POST, corps vide accepté pour GET et DELETE (R16) |
| V20 | Autorisation avant l'analyse du corps | crochet `onRequest` qui rend 403 ; PUT de 500 octets (limite 100) et PUT de JSON invalide | 403 dans les deux cas : `onRequest` passe avant l'analyse | R16, ordre des contrôles |
| V21 | `api/.npmrc` seul | `ignore-scripts=true` dans `.npmrc`, `npm ci` sans option, `npm test`, `npm start` dans `node:22-bookworm-slim` | `npm ci` réussit sans Python ; `npm test` : 1 test passé ; `npm start` s'exécute (`ignore-scripts` ne bloque pas les commandes lancées explicitement) | R3 |
| V22 | Schéma et transaction | `user_version = 1` et `CREATE TABLE` dans une transaction annulée ; `journal_mode = WAL` dans une transaction | annulée : `user_version` 0, aucune table ; WAL dans une transaction : « cannot change into wal mode from within a transaction » | R12 : WAL avant la transaction du schéma |
| V23 | Transaction différée et attente | connexion B (`timeout: 1000`) : lecture puis écriture dans une transaction différée pendant qu'A écrit | `SQLITE_BUSY_SNAPSHOT` en 0 ms : le délai ne s'applique pas ; V7 : en `BEGIN IMMEDIATE`, le délai s'applique | R11 : transactions d'écriture en `IMMEDIATE` |
| V24 | Identifiants réellement produits | `assets/dossier.js` (`uid`, `importCode` l. 302) ; `assets/store.js` `importAll` (l. 276-290) ; relais `candidatures.html` (`#c-([A-Za-z0-9._~-]+)`) | toutes les créations passent par `uid()` ; `importCode` et `importAll` reprennent l'`id` d'un code ou d'un export, qui vient lui-même de `uid()` sauf fichier modifié à la main | R15 : motif de `uid()` |

## Détail
V3, `npm ci` sous Node 22 sans `--ignore-scripts` :
```
npm error path /app/node_modules/better-sqlite3
npm error command sh -c node-gyp rebuild
npm error gyp ERR! find Python Python is not set from command line or npm configuration
```
V9, sorties de l'upstream d'écho (en-têtes contenant forwarded, auth, user, email) :
```
public + forgé      {"url":"/api/sante","h":{"X-Forwarded-For":["172.18.0.1"]}}
session + forgé     {"url":"/api/candidats","h":{"Authorization":["Basic …"],"X-Forwarded-For":["172.18.0.1"],"X-Forwarded-User":["alice@yeita.fr"]}}
sans session        403 (journal d'oauth2-proxy : pas d'upstream)
```
V10, témoin :
```
direct              {"url":"/api/candidats","h":{"X-Forwarded-Email":["pirate@yeita.fr"]}}
```
