---
type: revue-code
version: 1.2
bloquants: 0
majeurs: 1
mineurs: 11
corriges: 9
dependances: 3
audit: ok
date: 2026-10-26
---

# Revue de code et sécurité — API Node.js sur SQLite pour les dossiers candidat

> Aucun bloquant. 1 majeur (9 dépendances transitives de moins de 14 jours) tranché par l'utilisateur : lockfile gardé, exception notée dans le cadrage. 11 mineurs : 9 corrigés (`5cfc294`), Q6 non traité (facultatif), Q2 couvert par le test ajouté pour S2.
> Contrôle d'accès tenu sur 35 adresses piégées ; aucun secret dans la branche ; `npm audit` : 0 vulnérabilité.

Relecteur indépendant, essais dans une copie (`git archive HEAD`) hors du dépôt.

## Dépendances
| Dépendance | Version | Publiée le | Licence | Audit | Verdict |
|---|---|---|---|---|---|
| fastify | 5.12.7 (exacte) | 2026-10-13 (13 j) | MIT | 0 | ok : écart d'un jour décidé par l'utilisateur (cadrage, V2) ; corrige GHSA-389g-gv7q-r4x8 ; 5 mainteneurs |
| better-sqlite3 | 13.0.3 (exacte) | 2026-08-05 (82 j) | MIT | 0 | ok : un seul mainteneur ; 26 Mo sur 49 Mo de `node_modules` (binaires de 8 plateformes, sources SQLite) ; aucun script d'installation déclaré, `.npmrc` cohérent |
| @fastify/static | 10.1.6 (exacte) | 2026-10-09 (17 j) | MIT | 0 | ok : utile en mode local seulement, importé dans tous les cas (Q6) |
| 9 transitives | fast-json-stringify 7.2.0, @fastify/deepmerge 3.2.4, set-cookie-parser 3.2.1, @fastify/forwarded 3.1.2, @fastify/accept-negotiator 2.1.2, @fastify/send 4.2.0, fast-uri 4.2.3 et 3.1.9, ret 0.5.1 | 2026-10-17 à 2026-10-24 (2 à 9 j) | MIT, BSD-3-Clause | 0 | **majeur** : non couvertes par la décision sur Fastify. Avec `--before=2026-10-13`, `npm audit` signale 4 failles modérées de fast-uri (dont GHSA-w74x-v6f9-j3xg). **Arbitrage de l'utilisateur : lockfile gardé, exception notée** |
| Arbre complet | 71 paquets, tous de registry.npmjs.org avec `integrity` | — | MIT, ISC, BSD-3-Clause, BlueOak-1.0.0 | 0 | licences permissives ; exactement les 3 directes de R2, aucune dépendance de développement |
Commandes : `npm ci`, `npm audit` (0), `npm ls --all`, `npm view <paquet> time|license|engines|maintainers|dist.unpackedSize`, `du -sh node_modules`, `npm install --package-lock-only --before=2026-10-13T09:00:00Z` puis `npm audit`. Docker absent du poste du relecteur : CA1 sous `node:22-bookworm-slim` reste à la QA.

## Sécurité
| # | Sévérité | Fichier | Constat | Correction | Statut |
|---|---|---|---|---|---|
| S1 | mineur | `api/src/app.js` | `no-store` décidé sur `req.url` : `GET /%61pi/candidats` (routé vers `/api/candidats`) rendait tous les dossiers sans `no-store` ; idem en forme absolue | `no-store` sur toute réponse sauf la route statique `/*` ; test `/%61pi/moi` | corrige |
| S2 | mineur | `api/src/candidats.js`, `api/src/base.js` | Le `wal_checkpoint(TRUNCATE)` attendait un lecteur jusqu'à 5 s : PUT validé rendu en 5,2 s, toutes les requêtes gelées | `busy_timeout` à 100 ms le temps du point de contrôle ; test avec un lecteur (PUT < 1 s, avertissement) | corrige |
| S3 | mineur | `api/src/app.js` | @fastify/static avec `dotfiles: 'allow'` : `/.secret` servi en mode local | `dotfiles: "deny"` ; test | corrige |
| S4 | mineur | `api/src/app.js` | Analyseur maison (`JSON.parse`) : `__proto__` et `constructor.prototype` acceptés, enregistrés, renvoyés (pas de pollution côté serveur ; risque pour l'adaptateur) | Analyseur JSON de Fastify (`getDefaultJsonParser("error","error")`), corps vide gardé ; 400 « JSON invalide. » ; test | corrige |
| S5 | mineur | `api/src/app.js` | `:id` de plus de 100 caractères : 404 « Route inconnue. » au lieu de 400 (R15) | `maxParamLength` 200 ; au-delà, documenté dans le contrat HTTP | corrige |
Vérifié sans constat : 35 adresses sans identité en 401 (sauf GET et HEAD sur `/api/sante`) — méthodes `HEAD`, `OPTIONS`, `TRACE`, `PROPFIND`, adresses encodées, doubles barres, majuscules, `;`, `%00`, `..`, forme absolue ; mode local sans fuite ; `OPTIONS` d'un rôle `lecture` en 403 ; variantes d'en-tête (doublon, virgule finale, tabulations, NUL) ; aucun secret dans les 18 commits ; journal sans nom ni email ; `DB_PATH` toujours absolu ; ordre des crochets conforme ; transactions `.immediate()` partout.

## Qualité et réinvention
| # | Sévérité | Fichier | Constat | Existant à réutiliser | Statut |
|---|---|---|---|---|---|
| Q1 | mineur | `api/test/serveur.test.js` | Le test du `DB_PATH` relatif créait `api/base-relative.sqlite` (non couvert par `.gitignore` si le test est tué) | — | corrige : chemin relatif vers un dossier temporaire |
| Q2 | mineur | `api/src/candidats.js` | Avertissement « point de contrôle incomplet » sans test (mutation survivante) | — | corrige : test du lecteur (S2) ; mutation R3 détectée |
| Q3 | mineur | `api/src/candidats.js`, `api/src/options.js` | 503 testé pour PUT seulement | — | corrige : PUT, DELETE, POST |
| Q4 | mineur | `api/src/app.js` | Analyseur JSON réécrit | `app.getDefaultJsonParser` de Fastify | corrige (avec S4) |
| Q5 | mineur | `api/README.md`, `api/src/app.js` | Effacement promis sans réserve ; `HEAD` permis au rôle lecture sans être écrit | — | corrige : README nuancé, `HEAD` documenté |
| Q6 | mineur | `api/src/app.js` | `@fastify/static` importé même en production | import dynamique | non traité (facultatif, sans effet) |
Sections « Mutations » présentes pour les tâches 02 à 08 ; 01 et 09 sans objet.

## Mutations des corrections
| Contrôle | Mutation | Obtenu |
|---|---|---|
| `no-store` sur la route | décidé sur le texte de l'adresse | échec du test `/%61pi/moi` |
| Attente du point de contrôle | `busy_timeout` non abaissé | échec « PUT rendu en 5232 ms » |
| Avertissement | retiré | échec « avertissement absent du journal » |
| Analyseur JSON | `JSON.parse` | échec du test `__proto__` |
| `maxParamLength` | défaut (100) | échec sur l'id de 155 caractères |
| Fichiers cachés | `dotfiles` par défaut | échec « fichier caché servi » |
| 503 | non traduit | échec du test « base occupée » |

## Hors diff (candidats au backlog)
- Docker : exclure `api/node_modules` et `api/data` du contexte (`.dockerignore`) ; ne jamais publier le port de l'API hors du réseau d'oauth2-proxy.
- Sauvegardes : un outil qui garde une lecture ouverte empêche le point de contrôle ; prévoir l'API de sauvegarde de better-sqlite3 ou `VACUUM INTO`.
- Adaptateur navigateur : traiter les réponses non JSON d'oauth2-proxy (H3) et le 404 sans `code` d'un id de plus de 200 caractères.
- Lockfile : surveiller l'âge et l'audit des transitives (R2 ne fige que les directes).

## Revérification
Par le même relecteur, sur une copie de `5cfc294` : sondes 1 et 2 rejouées, sonde 3 sur le JSON, deux mutations.
| # | Statut | Preuve |
|---|---|---|
| Majeur | corrige (exception de l'utilisateur) | 9 paquets et raison dans le cadrage ; `npm audit` : 0 |
| S1 | corrige | `/%61pi/candidats` et forme absolue : `no-store` ; fichiers du site : `public, max-age=0` |
| S2, Q2 | corrige | PUT avec un lecteur : 200 en 125 ms (avant 5 202 ms), avertissement journalisé, `busy_timeout` remis à 5000 ; mutations tuées |
| S3 | corrige | `/.secret` : 403 ; `..%2f`, `%2e%2e%2f` : 403, sans fuite |
| S4, Q4 | corrige | `__proto__`, `constructor.prototype`, `{x` → 400 « JSON invalide. » ; corps vide sur GET et DELETE accepté |
| S5 | corrige | id de 120 et 150 caractères → 400 ; 250 → 404 « Route inconnue. » (documenté) |
| Q1 | corrige | aucun `.sqlite` dans `api/` après `npm test` |
| Q3, Q5 | corrige | test 503 sur trois méthodes ; README nuancé, `HEAD` documenté |
| Q6 | non traité | facultatif |
| Régressions | aucune | 35 adresses dans les deux modes : mêmes statuts ; journal sans nom ni email |
`npm test` : 44/44 en 16,2 s ; `node tools/test-store.js` : TOUT OK.
