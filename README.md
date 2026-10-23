# Expérience collaborateur Yeita · recrutement

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien et les supports candidat.

La version de travail reste l'artefact **Expérience Collaborateur** sur Claude. Ce dépôt en est le miroir publié : mêmes fichiers, plus une étape de publication qui permet d'imprimer et d'exporter en PDF.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, l'inventaire des supports, le glossaire. Liens directs : `#guide`, `#supports`, une étape (`#ec1`…), ou une page (`#fiche-ec1`, `#fiche-ec2`, `#carte`, `#decompte`, `#feuille-vierge`, `#kit`, `#one-pager`, `#candidatures`) | Interne |
| `candidatures/` | L'espace Candidatures (réservé à l'équipe une fois déployé) : le tableau (`index.html`), le parcours d'un candidat (`candidat.html?id=…`), les étapes EC1 et EC2 en pleine page (`ec1.html?id=…`, `ec2.html?id=…`), la carte d'identité (`carte.html?id=…`) et la feuille de décompte (`decompte.html?id=…`, ou `?vierge=1`). Modèle : `docs/backend/MODELE.md` ; textes : `assets/wording.fr.js` | Recruteurs |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeita-match-kit.html` | Kit physique Yeita Match : 54 cartes sur 6 planches recto-verso (dont 4 cartes valeur) et plateau A3, sur le modèle du jeu en ligne | EC1 |

Les pages partagent `assets/` : la charte (`yeita.css`), les utilitaires et les icônes du jeu (`yeita.js`), les données de Yeita Match (`data-yeita-match.js`, reprises du dépôt `yeita-match`) la grille des 4 diamants (`data-diamants.js`), les critères d'employabilité et leurs phrases (`data-employabilite.js`) le dossier candidat (`dossier.js`), les règles du parcours (`store.js`) et ses textes (`data-parcours.js`).

Les anciennes pages `fiche-ec1.html`, `fiche-ec2.html`, `carte-identite.html`, `yeita-match-decompte.html` et `candidatures.html` sont des relais : elles redirigent vers l'espace Candidatures. La « passation » et le « débrief » s'appellent maintenant **Bilan EC1** et **Bilan EC2**.

## Comment les fiches se parlent

- Chaque page de l'espace porte l'identifiant du candidat (`?id=…`) : la fiche EC1, la fiche EC2, la feuille de décompte et la carte n'affichent que lui.
- Les fiches EC1 et EC2 enregistrent à chaque saisie sur la candidature ; la carte d'identité se compose toute seule à partir d'elles.
- Le résultat de Yeita Match arrive dans la fiche EC1 par la saisie à la main, l'import du fichier JSON du jeu en ligne (visio), ou la feuille de décompte du candidat (présentiel). Point d'entrée unique : `FICHE_EC1.setYeitaMatch`, décrit dans `docs/backend/MODELE.md`.
- Jusqu'au déploiement sécurisé, tout vit dans le navigateur (données fictives uniquement). Le stockage partagé (SQLite) et l'authentification se branchent derrière `assets/dossier.js` sans changer les pages. La piste Supabase de `docs/backend/` est abandonnée.

## Tests

| Commande | Ce qui est vérifié |
|---|---|
| `node tools/test-store.js` | Règles du parcours : migration, passages, refus, annulation, export et import, exemples |
| `node tools/test-adapter.js` | L'adaptateur Supabase contre une fausse base (piste abandonnée, gardée pour mémoire) |
| `python3 tools/e2e-candidatures.py` | Le tableau et l'appel : ajout, Qui es-tu, questions, one-pager, État, liste, export et import |
| `python3 tools/e2e-parcours.py` | EC1 et EC2 en pleine page, Bilans, EC3, Décision ; décompte → EC1, import JSON, refus au bilan, Vivier ; un lien par candidat, anciennes adresses, téléphone |
| `python3 tools/e2e-liens.py` | « Précédent », liens directs, feuille de décompte vierge |
| `python3 tools/e2e-pdf.py` | Exports PDF : carte d'une candidature, feuille vierge |
| `python3 tools/e2e-backend.py` | L'écran de connexion Supabase (piste abandonnée, gardée pour mémoire) |

Les tests de navigateur demandent le site construit et servi : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`.

## Publier

1. Dans les réglages du dépôt, **Pages** › Source : **GitHub Actions**.
2. Chaque `push` sur `main` lance `.github/workflows/pages.yml`, qui construit le site avec `tools/build.py` et le publie.

Pour construire en local : `python3 tools/build.py` (le site sort dans `_site/`).

## Mettre à jour

On modifie l'artefact Expérience Collaborateur, puis on recopie ses fichiers ici. `index.html` est un fragment d'artefact (sans `<html>` ni `<head>`) : c'est voulu, l'étape de publication l'enveloppe.
