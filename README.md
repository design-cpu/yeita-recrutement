# Expérience collaborateur Yeita · recrutement

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien et les supports candidat.

La version de travail reste l'artefact **Expérience Collaborateur** sur Claude. Ce dépôt en est le miroir publié : mêmes fichiers, plus une étape de publication qui permet d'imprimer et d'exporter en PDF.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, l'inventaire des supports, le glossaire | Interne |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeita-match-kit.html` | Kit physique Yeita Match : 62 cartes sur 7 planches recto-verso et plateau A3, à l'identique du jeu en ligne | EC1 |
| `yeita-match-decompte.html` | Feuille de décompte : se coche pendant le jeu, compte toute seule à l'écran (2 pages A4) | Recruteur, EC1 |
| `fiche-ec1.html` | Fiche d'entretien candidat #1 · Yeita Match & Valeurs Yeita, en sections dépliantes, jusqu'aux questions à creuser en EC2 | Recruteur et observateur, EC1 |
| `fiche-ec2.html` | Fiche d'entretien candidat #2 · Scorecard 4 diamants | Pair du métier, EC2 |
| `carte-identite.html` | Carte d'identité Yeita, 3 états : arrêt après EC1, arrêt après EC2, embauche (A4 paysage). Lit le dossier du candidat | Candidat, EC3 |

Les pages partagent `assets/` : la charte (`yeita.css`), les utilitaires et les icônes du jeu (`yeita.js`), les données de Yeita Match (`data-yeita-match.js`, reprises du dépôt `yeita-match`) la grille des 4 diamants (`data-diamants.js`), les critères d'employabilité et leurs phrases (`data-employabilite.js`) et le dossier candidat (`dossier.js`).

La fiche de passation n'existe plus : son volet EC1 → EC2 est dans la fiche #1, son volet EC2 → EC3 rejoint la fiche #2.

## Comment les fiches se parlent

- Le jeu en ligne exporte un fichier JSON de session, que la fiche #1 sait importer. En physique, la feuille de décompte reporte le résultat dans la fiche #1.
- Les fiches #1 et #2 ont un bouton **Reporter vers la carte d'identité** : il range leur lecture dans le **dossier du candidat** (`assets/dossier.js`). La carte d'identité lit ce dossier et s'affiche aussitôt.
- Le dossier vit dans le navigateur (stockage local). Rien n'est envoyé nulle part. Pour passer d'un ordinateur à l'autre, en attendant l'ATS, chaque fiche donne un code `YEITA-EC1.…` ou `YEITA-EC2.…` à coller dans la page Notion du candidat, puis dans la carte. Ces codes portent aussi les éléments internes : ils ne partent jamais chez le candidat.
- L'ATS remplacera le stockage local sans réécrire les pages : voir `docs/modele-de-donnees.md` et `docs/dossier-candidat.schema.json`.

## Publier

1. Dans les réglages du dépôt, **Pages** › Source : **GitHub Actions**.
2. Chaque `push` sur `main` lance `.github/workflows/pages.yml`, qui construit le site avec `tools/build.py` et le publie.

Pour construire en local : `python3 tools/build.py` (le site sort dans `_site/`).

## Mettre à jour

On modifie l'artefact Expérience Collaborateur, puis on recopie ses fichiers ici. `index.html` est un fragment d'artefact (sans `<html>` ni `<head>`) : c'est voulu, l'étape de publication l'enveloppe.
