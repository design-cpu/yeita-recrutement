---
type: tache
version: 1.4
numero: 02
titre: Exemples hors de la base partagée
statut: ok
date: 2026-10-27
---

# Tâche 02 — Exemples hors de la base partagée

> **QA : réussie** · 3 fichiers modifiés · aucune correction
> En mode serveur, le tableau ne propose plus de charger des exemples fictifs ; « Retirer les exemples » n'apparaît que s'il y en a déjà dans la base.

## Ce que ça change
Un recruteur ne peut plus mêler des candidats fictifs aux vraies candidatures de l'équipe. Le tableau vide dit seulement « Ajoute la première personne avec qui tu as un appel de découverte. ». Si des exemples ont été chargés avant la 1.4, « Retirer les exemples » reste proposé dans la section Sauvegarde jusqu'à leur retrait. En mode navigateur, rien ne change.

## Comment tester
1. Même lancement que la tâche 01, base vide : le tableau vide n'a que « Ajouter » ; dans « Sauvegarde et exemples », aucun bouton d'exemples.
2. Créer un exemple dans la console : `var c = DOSSIER.blank("Exemple"); c.meta.demo = true; DOSSIER.save(c)`, recharger : « Retirer les exemples » apparaît ; le cliquer : l'exemple disparaît, le bouton aussi.
Tests automatiques : `python3 tools/e2e-serveur.py` ; en mode navigateur `python3 tools/e2e-candidatures.py`, `python3 tools/e2e-pdf.py`

## Critères d'acceptation
- [x] CA3 — base vide : ni `#demo-load` ni `#empty-demo`, texte de R5, `#demo-clear` caché ; clic pendant l'attente du démarrage (`/api/equipe` ralenti de 2 s) : rien dans la base
- [x] CA4 — un exemple dans la base : bouton visible ; clic : exemple retiré de l'API, dossier ordinaire gardé, bouton caché
- [x] CA5 — non-régression complète (ci-dessous)
- [x] CA7 — mutations ci-dessous

## Ce qui a été fait
- `assets/wording.fr.js` : `tableau.vide.texteServeur`.
- `candidatures/index.html` : `#demo-clear` caché au départ (`hidden`) et réévalué dans `renderBoard` (serveur : s'il existe un `meta.demo` ; navigateur : visible ; sinon caché) ; le clic sur `#demo-load` / `#empty-demo` ne fait rien hors du mode navigateur ; au `pret`, en mode serveur, les deux boutons sont retirés et le texte du tableau vide change (`data-t` compris).
- `tools/e2e-serveur.py` : 5 vérifications.
Fichiers : `assets/wording.fr.js`, `candidatures/index.html`, `tools/e2e-serveur.py`
Commits : `180b3aa` feat(finitions-mode-serveur): tâche 02 – pas d'exemples fictifs dans la base partagée

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA3, CA4 | ok (5 vérifications e2e) |
| `node tools/test-store.js` | « TOUT OK » |
| `node tools/test-serveur.js` | « TOUT OK (87 vérifications) » |
| `cd api && npm test` | « ℹ tests 52 / ℹ pass 52 / ℹ fail 0 » (relancé après la revue de code, constat 3) |
| `python3 tools/e2e-candidatures.py` | « ALL OK » |
| `python3 tools/e2e-parcours.py` | « ALL OK » |
| `python3 tools/e2e-liens.py` | « ALL OK » |
| `python3 tools/e2e-pdf.py` | « ALL OK » |
| `python3 tools/e2e-serveur.py` | « TOUT OK » (49 vérifications) |
Corrections : aucune.

## Mutations
Conteneur Playwright, copie hors du dépôt, durée maximale 300 s par lancement.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| e2e-serveur | E2 : boutons de chargement laissés en mode serveur | échec « exemples, base vide » | détectée, message attendu |
| e2e-serveur | E3 : garde du clic retirée | échec « clic … pendant l'attente → rien dans la base » | détectée (12 exemples écrits dans la base), message attendu |
| e2e-serveur | E4 : « Retirer les exemples » toujours visible en mode serveur | échec « base vide » et « dossier ordinaire seul » | détectée, messages attendus |
| e2e-serveur | E5 : « Retirer les exemples » jamais visible | échec « un exemple dans la base → visible » | détectée, message attendu |

## Spec couverte
R3, R4, R5, R6, R7, CA3, CA4, CA5, CA7
