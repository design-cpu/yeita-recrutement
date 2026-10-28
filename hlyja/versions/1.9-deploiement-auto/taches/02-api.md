---
type: tache
version: 1.9
numero: 02
titre: Routes de l'API
statut: ok
date: 2026-10-28
---

# Tâche 02 — Routes de l'API

> **QA : réussie** · 1 fichier créé, 3 modifiés · 8 mutations détectées sur 9 (1 non observable)
> L'application sait déposer une demande de déploiement et montrer l'état, sans rien lancer elle-même.

## Ce que ça change
Un admin peut lire l'état du déploiement automatique et déposer une demande (déployer `main`, un commit, ou reprendre l'automatisme). La demande est un petit fichier `clé=valeur` posé dans le volume de l'API ; c'est l'hôte qui la prend et la valide.

## Comment tester
`cd api && npm test` (verdict `ℹ fail 0`), ou `node --test test/api.test.js`.

## Critères d'acceptation
- [x] CA12 — non-admin 403, lecture seule 403, non JSON 415, forme ou commit invalide 400, `par` = membre, demande identique non réécrite, 503 ; `GET` rend état et demande. Écriture par renommage : **non observable** par `inject` (mutation M6 survivante), vérifiée par lecture du code et par l'absence de fichier temporaire après coup.

## Ce qui a été fait
- `api/src/deploiement.js` : `lireDemande` (fichier ordinaire, 1 024 octets, 4 clés exactes, valeurs contrôlées), `GET /api/deploiement`, `POST /api/deploiement/demande` (nom temporaire `wx` puis renommage, mode 600, dossier 700).
- `api/src/sauvegardes.js` : `lire` exportée (réutilisée pour `deploiement.json`).
- `api/src/routes.js` : route enregistrée.
- `api/test/api.test.js` : 7 tests (fichier existant ; `api/test` reste à 7 fichiers).
Fichiers : `api/src/deploiement.js`, `api/src/sauvegardes.js`, `api/src/routes.js`, `api/test/api.test.js`
Commits : `b7ca3f8` feat(deploiement-auto): tâche 02 – routes …

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/api.test.js` | `ℹ pass 21`, `ℹ fail 0` |
| `npm test` (sous `umask 022`) | `ℹ tests 65` · `ℹ pass 65` · `ℹ fail 0` |
Corrections : un cas `"main"` (chaîne) partait en 415 et non 400 (corps non JSON) : remplacé par `[1]`. Le cas « trop grande » ajoutait une ligne de `#` déjà refusée comme clé inconnue : remplacé par des lignes vides, pour que seule la taille le refuse (sinon M5 survivait).

## Mutations
Copie hors du dépôt, `node --test --test-timeout=20000 test/api.test.js`, classement par la conclusion de la suite.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| admin, POST | `adminRequis` retiré du POST | échec « admin seulement » | détectée |
| admin, GET | `adminRequis` retiré du GET | idem | détectée |
| `par` | en-tête brut au lieu de `req.membre.email` | échec « email du membre » | détectée |
| demande identique | réécrite | échec « non réécrite » (inode) | détectée |
| lien | `lstat` → `stat` | échec « lecture stricte » (lien) | détectée |
| taille | contrôle retiré | échec « trop grande » | détectée |
| clé en double | acceptée | échec « clé en double » | détectée |
| commit | expression sans ancres | échec « POST refuse » | détectée |
| renommage | écriture directe | — | **survivante : non observable** (inject est synchrone) |

## Spec couverte
R4, R6 (lecture côté application), R16, R17, R18, CA12
