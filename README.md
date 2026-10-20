# Expérience collaborateur Yeita · recrutement

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien et les supports candidat.

La version de travail reste l'artefact **Expérience Collaborateur** sur Claude. Ce dépôt en est le miroir publié : mêmes fichiers, plus une étape de publication qui permet d'imprimer et d'exporter en PDF.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, l'inventaire des supports, le glossaire | Interne |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeitigai-kit.html` | Kit physique Yeitigai : 62 cartes sur 7 planches recto-verso et plateau A3, à l'identique du jeu en ligne | EC1 |
| `yeitigai-decompte.html` | Feuille de décompte : se coche pendant le jeu, compte toute seule à l'écran (2 pages A4) | Recruteur, EC1 |
| `fiche-ec1.html` | Fiche d'entretien candidat #1 · Yeitigai & Valeurs Yeita | Recruteur, EC1 |
| `fiche-ec2.html` | Fiche d'entretien candidat #2 · Scorecard 4 diamants | Pair du métier, EC2 |
| `fiche-passation.html` | Fiche de passation candidat, champs libres, EC1 → EC2 puis EC2 → EC3 | Interne |
| `carte-identite.html` | Carte d'identité Yeita, 3 états : arrêt après EC1, arrêt après EC2, embauche (A4 paysage) | Candidat, EC3 |

Les pages partagent `assets/` : la charte (`yeita.css`), les utilitaires et les icônes du jeu (`yeita.js`), les données du Yeitigai (`data-yeitigai.js`, reprises du dépôt `yeita-match`) et la grille des 4 diamants (`data-diamants.js`).

## Comment les fiches se parlent

- Le jeu en ligne exporte un fichier JSON de session, que la fiche #1 sait importer. En physique, la feuille de décompte reporte le résultat dans la fiche #1.
- La fiche #1 produit un code `YEITA-EC1.…`, la fiche #2 un code `YEITA-EC2.…`. Collés dans la carte d'identité, ils la remplissent.
- Les codes ne transportent que ce qui figure sur la carte : ni passation, ni exemples cités, ni employabilité.
- Ce qu'on saisit reste dans le navigateur (stockage local). Rien n'est envoyé nulle part.

## Publier

1. Dans les réglages du dépôt, **Pages** › Source : **GitHub Actions**.
2. Chaque `push` sur `main` lance `.github/workflows/pages.yml`, qui construit le site avec `tools/build.py` et le publie.

Pour construire en local : `python3 tools/build.py` (le site sort dans `_site/`).

## Mettre à jour

On modifie l'artefact Expérience Collaborateur, puis on recopie ses fichiers ici. `index.html` est un fragment d'artefact (sans `<html>` ni `<head>`) : c'est voulu, l'étape de publication l'enveloppe.
