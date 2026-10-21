# Expérience collaborateur Yeita · recrutement

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien et les supports candidat.

La version de travail reste l'artefact **Expérience Collaborateur** sur Claude. Ce dépôt en est le miroir publié : mêmes fichiers, plus une étape de publication qui permet d'imprimer et d'exporter en PDF.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, l'inventaire des supports, le glossaire. Liens directs : `#guide`, `#supports`, une étape (`#ec1`…), ou une page (`#fiche-ec1`, `#fiche-ec2`, `#carte`, `#decompte`, `#feuille-vierge`, `#kit`, `#one-pager`, `#candidatures`) | Interne |
| `candidatures.html` | Le module Candidatures : tableau des candidats (liste ou kanban), puis le parcours guidé de chaque candidature, de l'appel de découverte à l'onboarding, avec l'appel de refus. `#c-<id>` ouvre une candidature | Recruteurs |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeita-match-kit.html` | Kit physique Yeita Match : 54 cartes sur 6 planches recto-verso (dont 4 cartes valeur) et plateau A3, sur le modèle du jeu en ligne | EC1 |
| `yeita-match-decompte.html` | Feuille de décompte : se coche pendant le jeu, compte toute seule à l'écran (2 pages A4) | Recruteur, EC1 |
| `fiche-ec1.html` | Fiche d'entretien candidat #1 · Yeita Match & Valeurs Yeita, en sections dépliantes, jusqu'aux questions à creuser en EC2 | Recruteur et observateur, EC1 |
| `fiche-ec2.html` | Fiche d'entretien candidat #2 · Scorecard 4 diamants | Pair du métier, EC2 |
| `carte-identite.html` | Carte d'identité Yeita, 3 états : arrêt après EC1, arrêt après EC2, embauche (A4 paysage). Lit le dossier du candidat | Candidat, EC3 |

Les pages partagent `assets/` : la charte (`yeita.css`), les utilitaires et les icônes du jeu (`yeita.js`), les données de Yeita Match (`data-yeita-match.js`, reprises du dépôt `yeita-match`) la grille des 4 diamants (`data-diamants.js`), les critères d'employabilité et leurs phrases (`data-employabilite.js`) le dossier candidat (`dossier.js`), les règles du parcours (`store.js`) et ses textes (`data-parcours.js`).

La fiche de passation n'existe plus : son volet EC1 → EC2 est dans la fiche #1, son volet EC2 → EC3 rejoint la fiche #2.

## Comment les fiches se parlent

- Le jeu en ligne exporte un fichier JSON de session, que la fiche #1 sait importer. En physique, la feuille de décompte reporte le résultat dans la fiche #1.
- Les fiches #1 et #2 ont un bouton **Reporter vers la carte d'identité** : il range leur lecture dans le **dossier du candidat** (`assets/dossier.js`). La carte d'identité lit ce dossier et s'affiche aussitôt. La fiche #2 affiche en tête ce que l'EC1 a laissé ouvert (questions à creuser, hypothèses sur les diamants, vigilance), et la carte réunit sous elle, dans une partie interne jamais imprimée, l'EC1 à gauche et l'EC2 à droite, points en suspens pour l'EC3 en tête.
- Le dossier vit dans le navigateur (stockage local). Rien n'est envoyé nulle part. Pour passer d'un ordinateur à l'autre, en attendant l'ATS, chaque fiche donne un code `YEITA-EC1.…` ou `YEITA-EC2.…` à coller dans la page Notion du candidat, puis dans la carte. Ces codes portent aussi les éléments internes : ils ne partent jamais chez le candidat.
- Ouvertes depuis une candidature (`fiche-ec1.html#c-<id>`, `fiche-ec2.html#c-<id>`), les fiches écrivent directement sur elle, à chaque modification ; la carte s'ouvre avec `carte-identite.html#c-<id>`, ou `#p-<id>` pour l'export PDF.
- Une base partagée remplacera le stockage local sans réécrire les pages : voir `STORAGE.md`, `docs/modele-de-donnees.md` et `docs/dossier-candidat.schema.json`. L'option Supabase est préparée dans `docs/backend/`, **non branchée**.

## Tests

| Commande | Ce qui est vérifié |
|---|---|
| `node tools/test-store.js` | Règles du parcours : migration, passages, refus, annulation, export et import, exemples |
| `node tools/test-adapter.js` | L'adaptateur Supabase contre une fausse base, conflits compris |
| `python3 tools/e2e.py` | Le hub, les fiches, la carte, le décompte |
| `python3 tools/e2e-candidatures.py` | Le module de bout en bout : ajout, appel, EC1 à l'onboarding, refus en EC1, export et import |
| `python3 tools/e2e-liens.py` | « Précédent », liens directs, feuille de décompte vierge |
| `python3 tools/e2e-backend.py` | L'écran de connexion, avec un faux client Supabase |

Les tests de navigateur demandent le site construit et servi : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`.

## Publier

1. Dans les réglages du dépôt, **Pages** › Source : **GitHub Actions**.
2. Chaque `push` sur `main` lance `.github/workflows/pages.yml`, qui construit le site avec `tools/build.py` et le publie.

Pour construire en local : `python3 tools/build.py` (le site sort dans `_site/`).

## Mettre à jour

On modifie l'artefact Expérience Collaborateur, puis on recopie ses fichiers ici. `index.html` est un fragment d'artefact (sans `<html>` ni `<head>`) : c'est voulu, l'étape de publication l'enveloppe.
