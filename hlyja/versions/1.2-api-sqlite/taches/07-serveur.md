---
type: tache
version: 1.2
numero: 07
titre: Serveur
statut: ok
date: 2026-10-26
---

# Tâche 07 — Serveur

> **QA : réussie** · 1 fichier créé, 1 modifié · 1 correction (processus de test toujours arrêtés)

## Ce que ça change
L'API démarre avec `npm start`, journalise ses valeurs résolues, prévient si elle écoute ailleurs que sur la machine, sert le site construit en mode local, sort en code 1 avec une ligne claire à toute erreur de démarrage et en code 0 à l'arrêt.

## Comment tester
`cd api && node --test test/serveur.test.js`
Résultat attendu : 5 tests réussis.

## Critères d'acceptation
- [x] CA11 — DEV_EMAIL (avertissement, autorisation appliquée), DEV_STATIC (`/` sert le site, `/api/sante` reste l'API, `/api/index.html` jamais servi) ; refus en processus réel.
- [x] CA12 — refus en code 1 avec une ligne ; aucune base créée avant le refus ; port occupé ; ligne de démarrage ; `DB_PATH` relatif lancé depuis un autre dossier → résolu depuis `api/` ; adresse externe de la machine (192.168.1.24) non joignable ; avertissement avec `HOST=0.0.0.0` ; `SIGTERM` → code 0.

## Ce qui a été fait
- `api/server.js` ; `@fastify/static` enregistré seulement avec `DEV_STATIC` (`api/src/app.js`) ; `api/test/serveur.test.js`.
Fichiers : `api/server.js`, `api/src/app.js`, `api/test/serveur.test.js`
Commits : `c8de470` feat(api-sqlite): tâche 07

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/serveur.test.js` | 5/5 |
Corrections : la mutation V1 (écoute sur 0.0.0.0 par défaut) laissait un serveur lancé qui ne s'arrêtait jamais (sur macOS, écouter sur 0.0.0.0 réussit même si 127.0.0.1 est pris) : la série de mutations restait bloquée. Chaque processus lancé par un test est désormais arrêté à la fin du test.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad, `node --test --test-timeout=30000`).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| Écoute par défaut | `0.0.0.0` | échec des tests de démarrage, de port occupé et du mode local | échec, messages attendus |
| Avertissement d'exposition | retiré | échec du test `HOST=0.0.0.0` | échec, message attendu |
| Arrêt sur signal | non géré | échec « code 0 » | échec, message attendu |
| `/api/*` inconnue | route retirée (servie par le site) | échec « /api/index.html » | échec, message attendu |
| Exemption du site | sur le texte de l'adresse | échec du mode local | échec, message attendu |
Formes permises : `HOST=0.0.0.0` accepté (avec avertissement) ; port libre choisi par le système.

## Spec couverte
R4, R8, R9, R30, R31 ; CA11, CA12
