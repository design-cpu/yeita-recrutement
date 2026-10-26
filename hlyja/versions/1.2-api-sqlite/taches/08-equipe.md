---
type: tache
version: 1.2
numero: 08
titre: equipe.js
statut: ok
date: 2026-10-26
---

# Tâche 08 — equipe.js

> **QA : réussie** · 2 fichiers créés · 0 correction

## Ce que ça change
L'administrateur ajoute, liste, désactive un membre ou change son rôle, sur la même base que l'API. Chaque commande affiche la base utilisée ; une commande mal tapée ne crée rien ; si l'API écrit, la commande attend jusqu'à 5 s puis abandonne sans rien écrire.

## Comment tester
`cd api && node --test test/equipe.test.js`
Résultat attendu : 5 tests réussis (l'un attend 6 s).

## Critères d'acceptation
- [x] CA10 — commandes, affichages, réactivation, `role` sans réactivation, erreurs en code 1 (dont « admin » pris pour un prénom), « Base : … (créée) », base en 600 et dossier en 700, `disable` pris en compte par l'API à la requête suivante, attente puis succès, délai dépassé puis code 1.
- [x] CA18 (b) — échec par délai dépassé puis relance : le membre existe une seule fois.

## Ce qui a été fait
- `api/equipe.js` ; `api/test/equipe.test.js`.
Règle 2 (échec provoqué puis relance) : verrou gardé au-delà du délai → code 1, aucune ligne ; relance après `COMMIT` → ajouté une fois. Commande mal tapée → aucune base créée.
Fichiers : `api/equipe.js`, `api/test/equipe.test.js`
Commits : `7e94e9f` feat(api-sqlite): tâche 08

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/equipe.test.js` | 5/5 |
| `DB_PATH=… node api/equipe.js add …` depuis la racine | base affichée, membre ajouté |
Corrections : aucune.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Rôle pris pour un prénom | contrôle retiré | échec « add leo@yeita.fr admin » | échec, message attendu |
| Arguments avant la base | base ouverte d'abord | échec « base non créée » | échec, message attendu |
| `role` | réactive | échec « role ne réactive pas » | échec, message attendu |
| Transaction d'écriture | différée | échec du test de base occupée | échec |
| « (créée) » | jamais affiché | échec de la première ligne | échec, message attendu |
Formes permises : `Sacha.Martin@Yeita.fr` accepté (mis en minuscules) ; « Pauline B. » accepté comme prénom.

## Spec couverte
R32 ; CA10, CA18 (b)
