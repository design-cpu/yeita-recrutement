---
type: tache
version: 1.3
numero: 04
titre: Démarrage, bandeau et retour sur l'onglet
statut: ok
date: 2026-10-26
---

# Tâche 04 — Démarrage, bandeau et retour sur l'onglet

> **QA : réussie**
> `assets/demarrage.js` choisit le mode, pose l'adaptateur d'attente, affiche le bandeau, relaie le retour sur l'onglet ; textes dans `wording.fr.js`.

## Ce que ça change
`assets/demarrage.js` choisit le mode, pose l'adaptateur d'attente, affiche le bandeau, relaie le retour sur l'onglet ; textes dans `wording.fr.js`.

## Comment tester
Tests automatiques : `node tools/test-serveur.js` ; navigateur : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` (en conteneur : `hlyja/technique/conventions.md`).

## Critères d'acceptation
- [x] Contenu et textes

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- `file:` → navigateur ; `/api/moi` classé ; hôte de `YEITA.SITE` ; 10 s ; `/api/equipe` et options
- Adaptateur d'attente dès le chargement
- `DEMARRAGE.pret`, `mode()`, `auRetour(fn)`, `erreur(message, cas)`
- Bandeau collant `.notice.err` `role=alert`, bouton « Recharger » sauf lecture seule, phrase « saisie non enregistrée »
- Garde du 401 (`sessionStorage`, 60 s)
- Clé `serveur` de `wording.fr.js`
- Tests dans `tools/test-serveur.js`, mutations

Fichiers : `assets/demarrage.js` (créé), `assets/wording.fr.js`
Commits : `06830ff`

Existant réutilisé : `.notice`, `.notice.err` (`candidatures/style.css`), `YEITA.SITE`, `YEITA.esc`

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA2 (Node) — 200, 404 HTML, 404 sous l'hôte de production, `file:`, 403 JSON, 502 HTML, 200 non JSON, 200 sans prénom, réseau, délai, `/api/equipe` en 404, 401 puis garde | OK |
| CA3 (Node) — attente puis bloqué : aucune écriture, ni locale ni PUT | OK |
| Bandeau : conflit (message, saisie, Recharger), lecture seule (message seul) | OK |
| Retour sur l'onglet : appelé au retour seulement, rien en mode navigateur | OK |
| CA2, CA3 en navigateur | tâche 09 |

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `tools/test-serveur.js` | M5 404 classé après le corps | échec « 404 text/html (serveur statique) » | échec, message attendu |
| `tools/test-serveur.js` | M6 hôte de production ignoré | échec « 404 sous l'hôte de production » | échec, message attendu |
| `tools/test-serveur.js` | M7 garde du 401 retirée | échec « moins de 60 s après un rechargement » | échec, message attendu |
| `tools/test-serveur.js` | M10 adaptateur d'attente retiré | échec « aucune écriture locale » | échec, message attendu |
| `tools/test-serveur.js` | M14 `/api/equipe` en 404 accepté | échec « jamais d'état mixte » | échec, message attendu |
| `tools/test-serveur.js` | M15 bouton en lecture seule | échec « lecture seule → message seul » | échec, message attendu |

## Spec couverte
R1 à R4e, R8, R11, R11b (bandeau), R15 ; Contenu et textes ; CA2, CA3
