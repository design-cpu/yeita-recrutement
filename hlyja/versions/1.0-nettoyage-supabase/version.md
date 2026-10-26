---
type: version
version: 1.0
slug: nettoyage-supabase
titre: Nettoyage de la piste Supabase abandonnée
branche: version/1.0-nettoyage-supabase
base: main
mode: express
statut: terminee
date: 2026-10-26
---

# Version 1.0 — Nettoyage de la piste Supabase abandonnée

> **Terminée** · express · 11 fichiers (9 supprimés, 2 modifiés) · test-store OK · tests de navigateur non lancés (Playwright absent)

## Demande
- Pitch : « Nettoyer le dépôt de la piste Supabase abandonnée le 23 octobre 2026. »
- À faire : supprimer `assets/backend.js`, `assets/adapter-supabase.js`, `docs/backend/schema.sql`, `config.example.js`, `test-schema.mjs`, `README.md`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md` ; retirer de `docs/backend/MODELE.md` les mentions de Supabase et de `tools/test-adapter.js` sans rien changer d'autre au modèle ; mettre à jour `README.md` (tableau des tests, « Comment les fiches se parlent », « Mettre à jour » : le dépôt est la seule source de vérité, on travaille par branche et pull request).
- Hors périmètre : toute page HTML, `assets/dossier.js`, `assets/store.js`, toute autre évolution.
- C'est fini quand : les 9 fichiers sont supprimés ; aucune mention de Supabase ni de `test-adapter` dans `MODELE.md` et `README.md` ; le hash du dernier commit contenant `assets/adapter-supabase.js` est noté ; la suite de tests restante passe ; la branche est poussée.

## Niveau
Express, appliqué sans réponse attendue : suppression de fichiers qu'aucune page ne charge (vérifié par `grep`) et texte de documentation ; aucune logique des pages ne change ; la suite existante suffit.

## Plan d'équipe
Fait par l'orchestrateur : suppressions, `MODELE.md`, `README.md`. Vérifié : `grep` des références restantes, `test-store.js` et les 4 tests de navigateur sur le site construit. Première exécution de Hlýja sur le dépôt : référentiel initial réduit aux pages utiles à ce sujet.

## Résultat
- Fichiers supprimés : `assets/backend.js`, `assets/adapter-supabase.js`, `docs/backend/schema.sql`, `docs/backend/config.example.js`, `docs/backend/test-schema.mjs`, `docs/backend/README.md`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md`.
- Fichiers modifiés : `docs/backend/MODELE.md` (une phrase sur `tools/test-adapter.js`, le paragraphe final sur Supabase ; rien d'autre), `README.md` (tableau des tests, « Comment les fiches se parlent », « Mettre à jour »).
- `[ajout]` : l'introduction de `README.md` disait que le dépôt était le « miroir publié » de l'artefact Claude ; elle contredisait la nouvelle section « Mettre à jour », elle est réécrite.
- **Référence pour la version 4** : le dernier commit de `main` qui contient `assets/adapter-supabase.js` est **`a86b6f4`** (`build: ne pas publier le dossier hlyja`). Le fichier n'a pas changé depuis `f11d015`. Lire : `git show a86b6f4:assets/adapter-supabase.js` (même chose pour les 8 autres fichiers supprimés).
- Tests : `node tools/test-store.js` → TOUT OK. Les 4 tests de navigateur (`e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf`) **n'ont pas été lancés** : Playwright n'est pas installé pour `/usr/bin/python3` sur ce poste.
- Contrôles ciblés : `grep` des 9 noms de fichiers et de « supabase » hors `hlyja/` → restent seulement `docs/modele-de-donnees.md` (5 lignes) et `tools/build.py` (`SKIP`), hors périmètre, au backlog ; site construit : 14 pages, 128 références locales, 0 manquante ; plus aucun fichier Supabase dans `_site/assets`.
- Doc : référentiel initial créé, partiel : `technique/decisions.md`, `technique/conventions.md` (+ vues humaines). Pas de doc produit ni de glossaire : à rédiger lors d'une prochaine version standard.
- Backlog : `1.0-1` (l'ancien modèle de données cite des fichiers supprimés), `1.0-2` (`STORAGE.md` encore dans `SKIP` de `tools/build.py`).

## Comment tester
`git show --stat 99657f4` pour voir le retrait ; `grep -rniE "supabase|test-adapter" README.md docs/backend/MODELE.md` ne renvoie rien. Puis, avec Playwright : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site` et les 4 tests `tools/e2e-*.py`.

## Changelog
- Retiré : la piste Supabase (adaptateur, connexion, schéma, mise en place, tests, `STORAGE.md`), jamais chargée par une page.
- Modifié : le dépôt est la seule source de vérité ; on ne recopie plus depuis l'artefact Claude, on passe par une branche et une pull request.
