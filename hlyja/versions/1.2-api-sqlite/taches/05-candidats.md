---
type: tache
version: 1.2
numero: 05
titre: Dossiers candidat
statut: ok
date: 2026-10-26
---

# Tâche 05 — Dossiers candidat

> **QA : réussie** · 2 fichiers créés, 1 modifié · 1 correction (test renforcé après mutation)

## Ce que ça change
Les dossiers se listent, se lisent et s'enregistrent par version optimiste : une version périmée, un id déjà créé ou un dossier supprimé entre-temps donnent 409 avec le message de `MODELE.md`. La suppression purge le journal du dossier. Après chaque écriture, le WAL est vidé : ni la version remplacée ni le dossier supprimé ne restent lisibles.

## Comment tester
`cd api && node --test test/candidats.test.js`
Résultat attendu : 10 tests réussis (l'un attend 5 s).

## Critères d'acceptation
- [x] CA4, CA5 — création 201, doublon 409 ; deux PUT sur la même version ; `version: 3` sur une ligne en 1 → 409 ; dossier supprimé → 409.
- [x] CA6 — 400 (champs, identifiants dont `jean-dupont`), 413, 415 ; GET et DELETE avec `Content-Type` JSON sans corps acceptés.
- [x] CA7 — repère remplacé absent des 3 fichiers juste après le PUT ; repère du dossier supprimé absent ; journal réduit à `suppression`.
- [x] CA8 — tri et enveloppe exacte.
- [x] CA10 (503) — PUT pendant un `BEGIN IMMEDIATE` d'une autre connexion → 503 après 5 s, rien d'écrit.
- [x] CA15 — journal du serveur sans nom ni email sur 201, 409, 400, 413, 500.
- [x] CA17 (409) — mutation C1.

## Ce qui a été fait
- `api/src/candidats.js` : routes, `corpsPut`, transactions immédiates, journal, purge, `wal_checkpoint(TRUNCATE)`.
- `api/test/candidats.test.js`.
Fichiers : `api/src/candidats.js`, `api/src/routes.js`, `api/test/candidats.test.js`
Commits : `9dc4886` feat(api-sqlite): tâche 05

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/candidats.test.js` | 10/10 |
| Suite complète | 32/32 à ce stade |
Corrections : la mutation C6 (pile avec message brut) survivait : la ligne abîmée du test donnait un message sans citation. Ligne remplacée par un texte qui n'est pas du JSON (« Unexpected token 'R', "REPERE-NOM…" is not valid JSON ») ; C6 détectée.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Conflit de version | condition `version = ?` neutralisée | échec du test de conflit | échec, message attendu |
| Point de contrôle | retiré | échec « version remplacée encore lisible » | échec (assertion de l'effacement) |
| Point de contrôle | `PASSIVE` au lieu de `TRUNCATE` | échec de l'effacement | échec (assertion de l'effacement) |
| `secure_delete` | retiré | échec « dossier supprimé encore lisible » | échec, message attendu |
| Purge du journal | retirée | échec du test du journal | échec, message attendu |
| Message brut au journal | pile complète | échec « un nom de candidat est dans le journal » | 1er essai : **survit** ; après correction du test : échec attendu |
| `code: introuvable` | retiré | échec du test de lecture | échec, message attendu |
| Création | écrase l'existant | échec « seconde création 409 » | échec, message attendu |
| Motif d'identifiant | motif libre | échec « jean-dupont » | échec, message attendu |
| `data.id` | non contrôlé | échec « id différent » | échec, message attendu |
Formes permises : `cand-zz-yy` (motif court) accepté ; étape inconnue gardée à `null` sans refus de l'écriture.

## Spec couverte
R11, R13 à R15, R17 à R22 ; CA4 à CA8, CA10 (503), CA15, CA17 (409)
