---
type: tache
version: 1.2
numero: 04
titre: Application et autorisation
statut: ok
date: 2026-10-26
---

# Tâche 04 — Application et autorisation

> **QA : réussie** · 3 fichiers créés, 1 modifié · 0 correction

## Ce que ça change
Chaque requête sous `/api` est identifiée par `X-Forwarded-Email` et autorisée contre la table `equipe` avant toute lecture du corps. Seule la route `GET /api/sante` y échappe, reconnue par sa route. Les erreurs sont toutes en JSON `{erreur, code?}` ; `/api/moi` et `/api/equipe` répondent.

## Comment tester
`cd api && node --test test/api.test.js`
Résultat attendu : 11 tests réussis (dont les options, tâche 06).

## Critères d'acceptation
- [x] CA2 — sans en-tête, `X-Forwarded-User` seul, doublon, domaine piégé, autre domaine, vide → 401 ; casse d'un membre → 200 ; hors équipe, inactif → 403 `hors-equipe` ; `/api/sante` et `?x=1` → 200 ; 6 adresses de contournement → 401.
- [x] CA3 — `lecture` : GET 200 ; POST, PUT (JSON invalide, 2 Mo), DELETE → 403 `lecture-seule`.
- [x] CA14 — `/api/moi`, `/api/equipe` (actifs, prénom et rôle, triés).
- [x] CA15 (partie) — 404 de route inconnue en JSON sans `code` ; `no-store` ; 415 pour `text/plain`, formulaire, sans `Content-Type` ; 400 JSON invalide.
- [x] CA17 (401, 403 équipe, 403 rôle, exemption) — mutations ci-dessous.

## Ce qui a été fait
- `api/src/app.js` : `construireApp`, `ErreurHttp`, `envoyer` ; analyseur JSON seul (corps vide accepté), crochets `onRequest`, `preValidation` (415), `onSend` (`no-store`), gestionnaire d'erreurs (500 sans message brut), `/api/*` inconnue en 404 après autorisation.
- `api/src/routes.js` ; `api/test/api.test.js` ; `api/test/aide.js` étendu (`creerApp`, `requete`, membres de test).
Fichiers : `api/src/app.js`, `api/src/routes.js`, `api/test/api.test.js`, `api/test/aide.js`
Commits : `53a8707` feat(api-sqlite): tâche 04

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/api.test.js` | 10/10 à ce stade |
Corrections : aucune.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| 401 | retiré | échecs « sans en-tête », « /api/sante/ » | échec, messages attendus |
| Membre inactif | accepté | échec « parti@yeita.fr » | échec, message attendu |
| Rôle lecture | peut écrire | échec « POST /api/options-disponibilite » | échec, message attendu |
| Exemption de `/api/sante` | sur le texte de l'adresse (`includes`) | échec « /api/sante/ » | échec, message attendu |
| En-tête | repli sur `X-Forwarded-User` | échec « X-Forwarded-User seul » | échec, message attendu |
| Moment de l'autorisation | `preHandler` au lieu de `onRequest` | échec « PUT /api/candidats/cand-a-b » (lecture + JSON invalide) | échec, message attendu |
| 415 | `text/plain` et absence acceptés | échec « sans Content-Type » | échec, message attendu |
| `no-store` | en-tête retiré | échec sur `cache-control` | échec, message attendu |
Formes permises : `" Rec@Yeita.FR "` accepté (mis en forme) ; `/api/sante?x=1` en 200 ; `Content-Type: application/json; charset=utf-8` accepté.

## Spec couverte
R5, R6, R7, R8 (identité), R16, R24 à R29 ; CA2, CA3, CA14, CA15, CA17
