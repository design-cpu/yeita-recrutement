---
type: tache
version: 1.10
numero: 02
titre: API : références et nettoyage
statut: ok
date: 2026-10-28
---

# Tâche 02 — API : références et nettoyage

> **QA : réussie** · 6 fichiers (`api/src/candidats.js`, `app.js`, `fichiers.js`, `valeurs.js`, `api/test/fichiers.test.js`, `aide.js`) · 0 correction
> L'API garantit qu'un dossier enregistré ne pointe jamais vers un CV absent, et efface d'elle-même les fichiers qu'aucun dossier ne référence plus après une heure.

## Ce que ça change
Un enregistrement de dossier qui cite un fichier absent (effacé par un autre recruteur, d'un autre candidat, d'un autre champ, ou venu d'un vieil export) est refusé avec le code `fichier-introuvable` et rien n'est écrit. À chaque enregistrement réussi, les fichiers de ce candidat que le dossier ne référence pas et qui ont plus d'une heure sont effacés, réellement (base, WAL).

## Comment tester
`cd api && node --test test/fichiers.test.js` → `ℹ pass 11 · ℹ fail 0`.
Tests automatiques : `cd api && npm test` → `ℹ tests 81 · ℹ pass 81 · ℹ fail 0`.

## Critères d'acceptation
- [x] CA6 (c, partie API) — référence absente, d'un autre candidat ou d'un autre champ → 409 `fichier-introuvable`, version inchangée ; deux recruteurs, départ sur version prédite après le retrait par l'autre → 409.
- [x] CA6 (b, partie API) — non référencé gardé à 59 min, effacé à 61 min (horloge simulée) ; référencé jamais effacé ; voisin d'un autre candidat intact.
- [x] CA9 — 10 485 760 octets acceptés ; lecture : HEAD 200, POST par `%66ichiers` 403 (et tests de Léo : + 1 octet → 413, type faux → 415).
- [x] CA10 — repère absent des fichiers bruts après nettoyage (et tests de Léo : après retrait, après suppression).
- [x] CA12 — tests de Léo (type, `nosniff`, `no-store`, 404 sous un autre candidat).

## Ce qui a été fait
- `candidats.js` : `references(data)` (forme de `identite.fichiers` contrôlée : `null` ou `{id}` au motif `fic-…`, sinon 400) ; dans la transaction du PUT, après l'écriture : `fichiersDuDossier` (vérification puis `DELETE … depose_le < limite AND id NOT IN json_each(refs)`), le point de contrôle existant suit.
- `valeurs.js` : `DELAI_NON_REFERENCE_MS` (1 h).
- `app.js` : option `maintenant` de `construireApp`, décorée sur `app` ; `fichiers.js` date les dépôts avec elle.
- `aide.js` : `creerApp(t, {maintenant})`.
Fichiers : `api/src/candidats.js`, `api/src/app.js`, `api/src/fichiers.js`, `api/src/valeurs.js`, `api/test/fichiers.test.js`, `api/test/aide.js`
Commits : `5245586` feat(fiche-candidat-harmonisation): tâche 02 – références des fichiers garanties et nettoyage

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA6 (b, c API), CA9, CA10, CA12 | ok (`fichiers.test.js`, 11 tests) |
| Non-régression | `cd api && npm test` : `ℹ tests 81 · ℹ pass 81 · ℹ fail 0` |

## Mutations
Copie hors du dépôt, `node --test --test-timeout=30000 test/fichiers.test.js`.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Référence vérifiée | boucle de vérification retirée | échec | détectée (deux tests R6) |
| Même champ | condition `champ = ?` neutralisée | échec | détectée |
| Même candidat | condition `candidat_id = ?` neutralisée (vérification) | échec | détectée |
| Nettoyage limité au candidat | `candidat_id = ?` neutralisée (nettoyage) | échec | détectée (voisin effacé) |
| Délai d'une heure | limite = maintenant + 1 ms | échec | détectée |
| Référencés épargnés | `NOT IN json_each` neutralisé | échec | détectée |
| Nettoyage | supprimé | échec | détectée |
| Horloge des dépôts | `new Date()` au lieu de `app.maintenant()` | échec | détectée |
| Forme des références | contrôle du motif retiré | échec | détectée |

## Spec couverte
R6, R8, R9, R10, R12, CA6 (b, c côté API), CA9, CA10, CA12

## Addendum — corrections de la revue de code (`56eefd7`)
`cd api && npm test` → `ℹ tests 82 · ℹ pass 82 · ℹ fail 0`.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| R12 `inline` | `attachment` | échec | détectée (« envoi d'un PDF … ») |
| R12 `nosniff` | en-tête retiré | échec | détectée |
| Lecture sous son candidat | `candidat_id = ?` neutralisée (lecture) | échec | détectée (« accès … ») |
| Rôle lecture (CA9) | refus d'écriture du rôle lecture retiré | échec | détectée (« accès … », « limites et accès … ») |
| R6 côté DELETE | garde `fichier-cite` retirée | échec | détectée |
| R6 côté DELETE | citation lue sur tous les candidats | échec | détectée |
| R6 côté DELETE | portfolio non vérifié | échec | survivante, puis détectée après ajout du cas portfolio au test |
