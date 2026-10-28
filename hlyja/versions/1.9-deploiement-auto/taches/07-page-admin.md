---
type: tache
version: 1.9
numero: 07
titre: Page admin
statut: ok
date: 2026-10-28
---

# Tâche 07 — Page admin

> **QA : réussie** · `admin/deploiement.html` créé ; `tools/e2e-serveur.py`, `tools/check-site.sh` étendus · 29 vérifications nouvelles
> Un admin voit en une phrase si le site est à jour, suit les passages et dépose une demande.

## Ce que ça change
`/admin/deploiement.html` (même gabarit et mêmes messages que `sauvegardes.html`) : verdict vert / neutre / rouge dans l'ordre de la spec, bandeaux « demande en attente » et « passage en cours (k/4) », commit en ligne, automatisme, dernière vérification, « Déployer maintenant », « Reprendre » en pause, passages dépliables (étape KO ouverte), « Déployer ce commit » sur un passage aux tests OK qui n'est pas en ligne, confirmations exactes, relecture toutes les 10 s tant qu'une demande attend ou qu'un passage tourne (dépliages gardés). `check-site.sh` : `/admin/deploiement.html` → 302 vers Google.

## Comment tester
`python3 tools/build.py _site && python3 tools/e2e-serveur.py` (ou dans le conteneur Playwright, `technique/conventions.md`).

## Critères d'acceptation
- [x] CA13 — un état d'exemple par cas du verdict (12), plus demande récente / ancienne / pendant un passage ; boutons selon l'état ; textes exacts des trois confirmations ; annulation sans envoi ; double clic pendant un `POST` ralenti → une seule demande ; 202 ; demande écrite par l'API ; rôle lecture refusé ; texte hostile affiché comme texte.
- [x] CA16 — `check-site.sh` : 8 contrôles, dont `/admin/deploiement.html → 302` (vu au niveau B : « OK /admin/deploiement.html → 302 vers https://accounts.google.com/ »).

## Ce qui a été fait
Commits : `09aac70`, `805b43c` (`adminRequis` partagé, côté API).

## Résultat QA
| Vérification | Résultat |
|---|---|
| `tools/e2e-serveur.py` | 80 `OK`, 1 `FAIL`, ligne finale **`ÉCHECS`** ; après la QA (7 vérifications d'accessibilité) et les corrections B1, B2, B4 (4 vérifications) : **91 `OK`, 1 `FAIL`**, `ÉCHECS` |
Le seul `FAIL` (« départ de la page (candidat.html), PUT précédent lent … 409 ») **existe déjà sur `main`** (rejoué deux fois sur un worktree de `main` : même échec) : hors de cette version, candidat au backlog. Les 29 vérifications de la page passent.
Corrections pendant la tâche : sélecteurs du test (bouton dans un passage replié, `inner_text` d'un repli fermé, résumés imbriqués).

## Mutations
| Contrôle | Mutation | Obtenu |
|---|---|---|
| texte comme texte | `textContent` remplacé par `innerHTML` dans `el()` | détectée (« sortie hostile affichée comme texte ») |
| envoi protégé | garde `envoi` et désactivation des boutons retirées | détectée (« double clic → une seule demande ») |
| focus gardé (après QA, B1) | focus non rendu après la relecture | détectée (« le focus clavier reste sur le même passage », `['BODY', None]`) |
| verdict non réécrit (après QA, B2) | contrôle de signature retiré | détectée (« le verdict inchangé n'est pas réécrit », 3 mutations) |

## Spec couverte
UX/UI, R16, R17 (côté page), CA13, CA16
