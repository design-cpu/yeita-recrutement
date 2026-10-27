---
type: tache
version: 1.4
numero: 01
titre: Bandeau en mode serveur
statut: ok
date: 2026-10-27
---

# Tâche 01 — Bandeau en mode serveur

> **QA : réussie** · 3 fichiers modifiés · aucune correction
> En mode serveur, le bandeau jaune des six pages dit que les candidatures sont sur le serveur de l'équipe, au lieu de « Tout reste dans ce navigateur ».

## Ce que ça change
Sur `recrutement.yeita.fr`, dès que la page sait qu'elle travaille avec la base de l'équipe, le bandeau jaune affiche « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. ». En mode navigateur, en mode bloqué et pendant l'attente du démarrage, le texte reste celui d'avant.

## Comment tester
1. `python3 tools/build.py _site && cd api && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start` (après `node equipe.js add moi@yeita.fr Moi admin`), puis ouvrir `http://127.0.0.1:8000/candidatures/`.
Résultat attendu : bandeau jaune « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita… · Connecté·e : Moi ».
Tests automatiques : `node tools/test-serveur.js` ; `python3 tools/e2e-serveur.py`

## Critères d'acceptation
- [x] CA1 — e2e : texte du serveur sur les 6 pages, « Connecté·e : Alice » gardé sur `index.html`
- [x] CA2 — test-serveur : `commun.serveur` en mode serveur ; `commun.fictif` en mode navigateur et bloqué (deux cas)
- [x] CA7 — mutations ci-dessous

## Ce qui a été fait
- `assets/wording.fr.js` : `commun.serveur`.
- `assets/demarrage.js` : dans `serveur()`, juste avant `mode = "serveur"`, chaque `[data-t="commun.fictif"]` reçoit `data-t="commun.serveur"` et le texte (`texteServeur()`, avec repli interne comme `A.texte`).
- `tools/test-serveur.js` : le faux document de `page()` rend deux faux bandeaux sur `[data-t="…"]` ; 4 vérifications.
- `tools/e2e-serveur.py` : 6 vérifications (`index.html` dans le bloc « prénom sans liste », les 5 autres pages sur un dossier créé pour l'occasion, `?id=`).
Fichiers : `assets/wording.fr.js`, `assets/demarrage.js`, `tools/test-serveur.js`, `tools/e2e-serveur.py`
Commits : `aebd4bc` feat(finitions-mode-serveur): tâche 01 – bandeau jaune juste en mode serveur

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA1 | ok (6 vérifications e2e) |
| CA2 | ok (4 vérifications) |
| `node tools/test-serveur.js` | « TOUT OK (87 vérifications) » |
| `node tools/test-store.js` | « TOUT OK » |
| `python3 tools/e2e-serveur.py` | « TOUT OK » |
| e2e en mode navigateur | lancés avec la tâche 02 (même série, après les deux tâches) : e2e-candidatures « ALL OK », e2e-parcours « ALL OK », e2e-liens « ALL OK », e2e-pdf « ALL OK » |
Corrections : aucune.

## Mutations
Copie hors du dépôt, durée maximale 120 s (test-serveur) et 300 s (e2e, conteneur Playwright).
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| test-serveur | M1 : aucun bandeau changé (`[].forEach`) | échec « bandeau jaune : mode serveur » | détectée, message attendu |
| test-serveur | M2 : bandeau changé aussi en mode navigateur | échec « mode navigateur → inchangé » | détectée, message attendu |
| test-serveur | M3 : bandeau changé avant le contrôle de `/api/equipe` | échec « mode bloqué (/api/equipe en 404…) » | détectée, message attendu |
| test-serveur | M4 : texte changé sans `data-t` | échec « mode serveur → texte et data-t » | détectée, message attendu |
| e2e-serveur | E1 : aucun bandeau changé | échec « bandeau jaune index.html… » et des 5 pages | détectée, messages attendus |

## Spec couverte
R1, R2, R3, CA1, CA2, CA7
