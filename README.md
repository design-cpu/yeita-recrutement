# Recrutement Yeita · le site

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien, les supports candidat et le kit Yeita Match. Ce dossier est prêt à être publié tel quel sur GitHub Pages, sans aucune étape de construction.

La version de travail reste l'artefact **Expérience Collaborateur** sur Claude. Ce site en est la copie publiée, celle qui permet d'imprimer et d'exporter en PDF.

## Mettre en ligne

1. Sur GitHub, dans l'organisation **Yeichati** : **New repository**, nom `yeita-recrutement`. Garder ce nom : le hub y renvoie déjà.
2. Dans le dépôt vide : **uploading an existing file**. Glisser **le contenu** de ce dossier (pas le dossier lui-même), avec les dossiers `assets` et `telechargements`. Puis **Commit changes**.
3. **Settings › Pages** › Source : **Deploy from a branch**, branche `main`, dossier `/ (root)` › **Save**.
4. Une à deux minutes plus tard, le site est en ligne : https://yeichati.github.io/yeita-recrutement/

Si le dépôt est public, tout le monde peut lire le site, fiches internes comprises (critères des diamants, employabilité). Les données saisies, elles, ne quittent jamais le navigateur de la personne qui remplit.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, les supports, le glossaire | Interne |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeita-match-kit.html` | Kit Yeita Match : 62 cartes sur 7 planches recto-verso et plateau A3, à l'identique du jeu en ligne | EC1 |
| `yeita-match-decompte.html` | Feuille de décompte : se coche pendant la partie, compte toute seule à l'écran (2 pages A4) | Recruteur, EC1 |
| `fiche-ec1.html` | Fiche d'entretien candidat #1 · Yeita Match & Valeurs Yeita | Recruteur, EC1 |
| `fiche-ec2.html` | Fiche d'entretien candidat #2 · Scorecard 4 diamants | Pair du métier, EC2 |
| `fiche-passation.html` | Fiche de passation candidat, EC1 → EC2 puis EC2 → EC3 | Interne |
| `carte-identite.html` | Carte d'identité Yeita, 3 états : arrêt après EC1, arrêt après EC2, embauche (A4 paysage) | Candidat, EC3 |

## À télécharger

Le dossier `telechargements` contient les versions prêtes à imprimer :

- `kit-yeita-match-impression.pdf` : les 62 cartes recto-verso (bord long) et le plateau A3, 15 pages
- `feuille-de-decompte.pdf` : la feuille vierge, 2 pages A4
- `one-pager-parcours.pdf` : le parcours candidat, 1 page A4
- `carte-identite-3-etats.pdf` : un exemple de carte dans ses trois états, A4 paysage
- les visuels en PNG haute définition : la carte d'identité dans ses trois états, l'aperçu des cartes du jeu et le plateau

Une fois le site en ligne, chacun s'ouvre à l'adresse `https://yeichati.github.io/yeita-recrutement/telechargements/` suivie du nom du fichier.

## Comment les fiches se parlent

- Le jeu en ligne exporte un fichier de partie, que la fiche #1 sait importer. En présentiel, la feuille de décompte reporte le résultat dans la fiche #1.
- La fiche #1 produit un code `YEITA-EC1.…`, la fiche #2 un code `YEITA-EC2.…`. On les colle dans la page Notion du candidat, puis dans la carte d'identité, qui se remplit toute seule.
- Les codes ne transportent que ce qui figure sur la carte : ni passation, ni exemples cités, ni employabilité.

## Mettre à jour

On modifie l'artefact Expérience Collaborateur, on régénère ce dossier, et on remplace les fichiers dans le dépôt (même glisser-déposer, GitHub écrase les anciens).
