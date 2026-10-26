---
type: tache
version: 1.3
numero: 03
titre: Adaptateur serveur
statut: ok
date: 2026-10-26
---

# Tâche 03 — Adaptateur serveur

> **QA : réussie**
> `assets/adapter-serveur.js` : list/get/put/remove en `fetch` vers `../api/candidats`, version par objet et par identifiant, file par dossier, classement des réponses, identifiants contrôlés, envoi de départ.

## Ce que ça change
`assets/adapter-serveur.js` : list/get/put/remove en `fetch` vers `../api/candidats`, version par objet et par identifiant, file par dossier, classement des réponses, identifiants contrôlés, envoi de départ.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] CA6
- [x] CA13

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- Forme `{name, volatile, list, get, put, remove}` + envoi de départ (`partir(d)`) pour R6g
- Table faible objet → version, version la plus haute par identifiant, identifiants supprimés
- File par identifiant ; `put` prend la version au départ
- Classement des réponses dans l'ordre du tableau ; `error.code` ; 401 → rechargement gardé (R8, via le démarrage)
- Tests en Node (`tools/test-serveur.js`, même chargement que `tools/test-store.js`, `fetch` simulé), mutations

Fichiers : `assets/adapter-serveur.js` (créé), `tools/test-serveur.js` (créé)
Commits : `04c1996`

Existant réutilisé : `git show a86b6f4:assets/adapter-supabase.js` (forme, `fromRow`), `DOSSIER.upgrade`, harnais de `tools/test-store.js`

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA6 (Node) — trois `put` rapprochés, réponses lentes | aucun 409, dernière saisie en base |
| CA13 — identifiants hors motif, 404 sans `code`, non JSON, `upgrade` à la lecture, `put` après `remove` | OK |
| Classement des réponses (502 HTML, 403 non JSON, 200 non JSON, JSON en `text/html`, JSON illisible, réseau, 503, 403 lecture seule, 401) | OK |
| Départ : `keepalive`, version du PUT en cours + 1 | OK |
| `node tools/test-serveur.js` | 75/75 |
| Non-régression : `node tools/test-store.js` | TOUT OK |
Corrections : garde extérieure redondante de `put` retirée (M13).

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/test-serveur.js` | M1 version par objet retirée | échec « objet lu avant un enregistrement plus récent » | échec, message attendu |
| `tools/test-serveur.js` | M2 file par dossier retirée | échec « file : trois put rapprochés » | échec, message attendu |
| `tools/test-serveur.js` | M3 version la plus haute retirée | échec « version la plus haute » | échec, message attendu |
| `tools/test-serveur.js` | M4 contrôle du `Content-Type` retiré | échec « JSON valide servi en text/html » | échec, message attendu (cas ajouté : M4 survivait au premier passage, le JSON illisible la masquait) |
| `tools/test-serveur.js` | M12 départ sans la version du PUT en cours | échec « départ : keepalive, version » | échec, message attendu |
| `tools/test-serveur.js` | M13 identifiant supprimé oublié par `put` | échec « put après remove : aucune requête » | échec, message attendu (garde extérieure redondante retirée du code) |
| formes permises | 404 `introuvable` → `null` ; identifiants au motif ; 204 sans corps | réussite | réussite |
Outil : copie hors du dépôt, une mutation à la fois (échéance de 60 s par passage, 5 s par vérification) ; un arrêt sans conclusion compte comme « plantage » (M14 a d'abord été lue à tort comme survivante : rejet non traité ; le test consigne désormais tout rejet non traité comme un échec et continue).

## Spec couverte
R5 à R8, R10, tableau § API et intégrations ; CA6, CA13
