---
type: technique
page: conventions
titre: Conventions et tests
maj: 1.0
commit: 99657f4
sources: README.md, CONTRIBUER.md, tools/build.py, tools/test-store.js, tools/e2e-candidatures.py, tools/e2e-parcours.py, tools/e2e-liens.py, tools/e2e-pdf.py
date: 2026-10-26
---

# Conventions et tests

> Comment le dépôt est organisé, publié et testé. Référentiel initial partiel (v1.0) : seules les conventions utiles au nettoyage Supabase ont été relevées.

## Organisation
| Dossier | Contenu |
|---|---|
| racine | pages HTML (`index.html` est un fragment enveloppé à la publication) ; `fiche-ec1.html`, `fiche-ec2.html`, `carte-identite.html`, `yeita-match-decompte.html`, `candidatures.html` sont des relais vers `candidatures/` |
| `candidatures/` | l'espace Candidatures |
| `assets/` | code et données partagés ; `dossier.js` (modèle, adaptateur), `store.js` (règles du parcours), `wording.fr.js` (textes) |
| `docs/` | `backend/MODELE.md` (modèle v3, fait foi), `modele-de-donnees.md` (v2, ancien), `dossier-candidat.schema.json` |
| `tools/` | construction du site et tests |
| `hlyja/` | trace Hlýja, exclue de la publication (`SKIP` de `tools/build.py`) |

## Publication
`python3 tools/build.py [dossier]` copie la racine sauf `SKIP` (`.git`, `.github`, `.agents`, `docs`, `tools`, `_site`, `dist`, `renders`, `README.md`, `STORAGE.md`, `.gitignore`, `hlyja`) et enveloppe `index.html`. Tout `assets/` est publié. Chaque push sur `main` publie via `.github/workflows/pages.yml`.

## Tests
| Commande | Prérequis | Couvre |
|---|---|---|
| `node tools/test-store.js` | Node | règles du parcours (store, dossier) |
| `python3 tools/e2e-candidatures.py` | site construit servi sur `localhost:8765`, Playwright Python | tableau, appel |
| `python3 tools/e2e-parcours.py` | idem | EC1, EC2, Bilans, EC3, Décision |
| `python3 tools/e2e-liens.py` | idem | « Précédent », liens directs, feuille vierge |
| `python3 tools/e2e-pdf.py` | idem | exports PDF |

Serveur : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`. Chaque test affiche `OK` / `FAIL` par vérification.

## Branches
Une branche par sujet (`feat/…`, `fix/…`, `version/<x.y>-<slug>` pour Hlýja), pull request vers `main`.
