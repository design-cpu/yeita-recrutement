---
type: tache
version: 1.2
numero: 03
titre: Base et schéma
statut: ok
date: 2026-10-26
---

# Tâche 03 — Base et schéma

> **QA : réussie** · 2 fichiers créés · 1 correction (test borné dans le temps)

## Ce que ça change
La base s'ouvre avec ses réglages (masque `0o077`, WAL, attente de 5 s, `secure_delete`) et s'installe d'un seul bloc. Deux programmes qui l'ouvrent en même temps ne se gênent plus : le second attend, relit `user_version` et ne recrée rien.

## Comment tester
`cd api && node --test test/base.test.js`
Résultat attendu : 5 tests réussis.

## Critères d'acceptation
- [x] CA9 — schéma, `user_version` 1, `wal`, `secure_delete` 1, dossier 700, fichiers 600 ; base de `user_version` 2 refusée.
- [x] CA18 (a) — table `journal` créée à la main : refus, `user_version` reste 0, aucune autre table ; relance saine.
- [x] CA18 (c) — deux ouvertures concurrentes d'une base neuve : la seconde attend puis réussit.

## Ce qui a été fait
- `api/src/base.js` : `ouvrirBase`, `SCHEMA` (exporté pour les tests), `ErreurBase`, `estOccupee`.
- `api/test/base.test.js`.
Fichiers : `api/src/base.js`, `api/test/base.test.js`
Commits : `7ed7fad` feat(api-sqlite): tâche 03

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/base.test.js` | 5/5 |
| Suite complète | 12/12 à ce stade |
Corrections : la mutation B2 (transaction différée) bloquait le test concurrent au lieu de le faire échouer ; durée maximale de 20 s ajoutée au test, la mutation est alors détectée (test annulé). Cause exacte du blocage non analysée : le code livré n'utilise jamais de transaction différée. Après la version (retour de l'utilisateur) : le test concurrent échouait dans un terminal qui force les couleurs, `console.log("ok", 1)` du processus fils colorant le nombre (`ok \x1B[33m1\x1B[39m`) ; le fils écrit désormais une chaîne (`"ok " + userVersion`). Témoin : l'ancien test échoue avec `FORCE_COLOR=1`, le nouveau passe.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Relecture de `user_version` dans la transaction | retirée | échec du test concurrent | échec (« table … already exists » côté fils) |
| Transaction immédiate du schéma | différée | échec du test concurrent | **bloque** : test annulé à 20 s, cause non analysée (ni détectée ni survivante, étonnement 3 de la 1.2) |
| Refus d'une version plus récente | retiré | échec « Missing expected exception » | échec, message attendu |
| Masque `0o077` | retiré | échec « mode de la base » | échec, message attendu |
| `secure_delete` | retiré | échec sur la valeur du réglage | échec, message attendu |
| Création sans `IF NOT EXISTS` | `IF NOT EXISTS` sur `journal` | échec du test d'échec provoqué | échec, message attendu |
| Schéma en une transaction | schéma hors transaction | échec des tests concurrent et d'échec provoqué | échec, messages attendus |
Formes permises : réouverture d'une base à jour sans erreur ni recréation.

## Spec couverte
R10, R11, R12 ; CA9, CA18 (a, c)
