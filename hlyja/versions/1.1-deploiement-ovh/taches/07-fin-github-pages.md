---
type: tache
version: 1.1
numero: 07
titre: Fin de GitHub Pages
statut: ok
date: 2026-10-26
---

# Tâche 07 — Fin de GitHub Pages

> **QA : réussie** · 3 fichiers (1 supprimé, 2 modifiés) · 1 correction trouvée en passant (`.env` publié en local)
> GitHub Pages n'est plus alimenté ; le mail candidat pointe vers `recrutement.yeita.fr`, et la suite de tests existante passe en entier.

## Ce que ça change
Un push sur `main` ne publie plus rien sur GitHub Pages. Le lien « Ton parcours chez Yeita » du mail du one-pager mène à `https://recrutement.yeita.fr/one-pager.html`. Le `README.md` renvoie au mode d'emploi du serveur.

## Comment tester
1. `git ls-files .github` → rien ; `grep tonParcours assets/config.js`.
2. `python3 tools/build.py _site` puis `ls -a _site` : ni `.env`, ni fichiers de déploiement.
3. `node tools/test-store.js` ; les 4 `tools/e2e-*.py` sur le site servi (`python3 -m http.server 8765 --directory _site`).
Tests automatiques : ci-dessus.

## Critères d'acceptation
- [x] CA10 — build local sans les fichiers de R17 (ni `.env`) ; `test-store.js` TOUT OK ; e2e : candidatures 40 OK, parcours 45 OK, liens 19 OK, pdf 7 OK, 0 FAIL
- [x] CA11 — `pages.yml` supprimé ; nouvelle adresse dans `assets/config.js` ; `git ls-files` sans `.env`

## Ce qui a été fait
- `.github/workflows/pages.yml` supprimé.
- `assets/config.js` : `pagesCandidat.tonParcours = "https://recrutement.yeita.fr/one-pager.html"`.
- `README.md` : section « Publier » réécrite (serveur OVH, renvoi à `deploy/README.md`, test local Docker) `[ajout]` de la spec.
- `tools/build.py` : `.env` ajouté à `SKIP`. Défaut introduit par la version (le `.env` vit désormais à la racine) : `python3 tools/build.py` le copiait dans `_site`, servi ensuite par `http.server`. Dans l'image, `.dockerignore` l'écartait déjà.
Fichiers : `.github/workflows/pages.yml`, `assets/config.js`, `README.md`, `tools/build.py`
Commits : `4143f25` feat(deploiement-ovh): tâche 07 – fin de GitHub Pages, lien candidat sur recrutement.yeita.fr ; `b62fd67` fix(deploiement-ovh): .env exclu de la publication locale

## Résultat QA
| Vérification | Résultat |
|---|---|
| `git ls-files .github` | ok (vide) |
| `grep -rn "pages.yml\|github.io"` sur `README.md`, `CONTRIBUER.md`, `assets/config.js`, `tools/`, `deploy/`, `compose.yaml` | ok (rien) |
| Build local : `.env`, `docker`, `deploy`, `compose.yaml`, `.dockerignore`, `.env.example` absents de `_site` | ok (après correction) |
| `node tools/test-store.js` | TOUT OK |
| 4 tests de navigateur (conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble`, `playwright==1.63.0`, `poppler-utils`) | 111 OK, 0 FAIL |
Corrections : `.env` exclu de la publication locale (voir ci-dessus).
Remarque : Playwright n'étant pas installé sur le poste, les tests de navigateur ont tourné dans un conteneur jetable ; rien n'est ajouté au projet.

## Spec couverte
R17, R18 ; CA10, CA11
