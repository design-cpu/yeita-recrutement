---
type: tache
version: 1.4
numero: 03
titre: Ancien modèle supprimé
statut: ok
date: 2026-10-27
---

# Tâche 03 — Ancien modèle supprimé

> **QA : réussie** · 1 fichier supprimé, 1 page de doc modifiée · 1 correction
> `docs/modele-de-donnees.md` (modèle v2, liens morts vers Supabase) n'existe plus ; `docs/backend/MODELE.md` reste la seule référence.

## Ce que ça change
Un lecteur ne tombe plus sur un document qui décrit l'ancien modèle et renvoie vers des fichiers supprimés. Git garde l'historique du fichier.

## Comment tester
`test ! -e docs/modele-de-donnees.md && git grep -n modele-de-donnees -- ':!hlyja/versions' ':!hlyja/backlog'`
Résultat attendu : aucune ligne, code de sortie 1 pour `git grep`.

## Critères d'acceptation
- [x] CA6

## Ce qui a été fait
- `git rm docs/modele-de-donnees.md`.
- `hlyja/technique/conventions.md` : ligne `docs/` sans l'ancien fichier.
Commits : `aeb24b1`, `30e0977` feat(finitions-mode-serveur): tâche 03 – …

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA6 | ok : fichier absent ; `git grep` sans résultat (code 1) |
Corrections : la première version de la ligne de `conventions.md` citait encore le nom du fichier, ce qui faisait échouer CA6 ; retiré (`30e0977`).

## Spec couverte
R8, CA6
