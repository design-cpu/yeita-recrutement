# Contribuer à l'espace Candidatures

Ce guide s'adresse à toute l'équipe, développeur ou non. Il dit où changer un texte, une liste ou un lien, et ce qu'il ne faut pas toucher.

## Avant tout

- **Données fictives uniquement**, tant que le stockage partagé n'est pas branché : depuis la version 1.1, l'espace est en ligne derrière la connexion Google @yeita.fr, mais les données restent dans le navigateur de chacun. Aucun nom, e-mail, téléphone ou CV de vrai candidat dans l'outil, dans les tests, dans les captures ou dans un commit. Les exemples (`STORE.loadDemo`) sont inventés.
- **Ne pas toucher** à l'authentification ni au déploiement (`deploy/`, `docker/`, `compose.yaml`, mode d'emploi dans `deploy/README.md`) sans l'équipe technique ; le moteur de stockage et l'architecture du Yeita Match en ligne restent la branche de Sacha.
- **Garder stable l'interface de stockage** de `assets/dossier.js` : `list`, `get`, `put`, `remove`, en promesses. Le modèle qui fait foi est `docs/backend/MODELE.md`. Tout nouveau champ s'y documente.

## Changer un texte

Tous les textes de l'interface de l'espace sont dans **`assets/wording.fr.js`**, rangés par écran :

| Section | Écran |
|---|---|
| `commun` | partout : bandeau, retours, enregistrement |
| `qui` | « Qui es-tu ? » |
| `etapes`, `etats` | noms et objectifs des étapes, libellés des États |
| `tableau`, `ajout`, `recruteurs` | le tableau (kanban, liste) et le formulaire d'ajout |
| `infos`, `fiche` | le bloc « Infos candidat », l'en-tête et les étapes d'un candidat |
| `appel`, `onePager` | les 10 questions de l'appel, le mail du one-pager |
| `ec` | les pages EC1 et EC2, la carte, la feuille de décompte |
| `bilan`, `ec3`, `decision`, `onboarding` | les Bilans, l'EC3, la Décision, l'Onboarding |
| `sorties`, `refus` | les boutons du bas de chaque étape, l'appel de refus |

Règles :

1. **Changer seulement la valeur entre guillemets**, jamais le nom à gauche des deux-points.
2. **Garder les variables entre accolades** (`{nom}`, `{job}`, `{quand}`…) : elles sont remplacées à l'affichage.
3. **Une apostrophe dans un texte** s'écrit telle quelle entre guillemets doubles : `"Passer à l'EC1"`.
4. **Voix et style** : phrases courtes, tutoiement entre recruteurs, un verbe pour chaque bouton (« Passer au bilan », « Envoyer en décision »). Les mots du glossaire du hub font foi (Bilan, pas débrief ni passation).

**Ce qui n'est pas dans `wording.fr.js` :**
- le contenu de méthode : les critères d'employabilité (`assets/data-employabilite.js`), les 4 diamants de la scorecard (`assets/data-diamants.js`), les cartes de Yeita Match (`assets/data-yeita-match.js`) ;
- les questions des fiches EC1 et EC2 (`candidatures/ec1.html`, `candidatures/ec2.html`) ;
- le guide du recruteur et le glossaire (`index.html`).

Les repères Junior, Intermédiaire et Senior de la scorecard restent tels quels : les modifier est hors périmètre.

## Changer une liste ou un lien

Dans **`assets/config.js`** :

- `equipe` : les prénoms proposés dans « Qui es-tu ? » et dans Recruteurs. Un nom tapé à la main s'ajoute aussi, dans ce navigateur.
- `pagesCandidat` : les pages publiques envoyées dans le one-pager (« Pour nous découvrir », « Ton parcours chez Yeita »).
- `infosPratiques` : adresse, accès, code d'entrée, ajoutés au mail du one-pager quand ils sont remplis.
- `liens` : guide, employabilité, grille de salaire, référentiel (scorecard).

Les listes du modèle (Job, Disponibilité, Provenance, États, étapes) sont dans `assets/dossier.js` et `assets/store.js` : les changer touche les données, donc `MODELE.md` et les tests.

## Où vit quoi

| Fichier | Rôle |
|---|---|
| `candidatures/index.html` | le tableau : kanban, liste, ajout |
| `candidatures/candidat.html?id=…` | le parcours d'un candidat : appel, bilans, EC3, décision, proposition, onboarding, refus |
| `candidatures/ec1.html?id=…`, `ec2.html?id=…` | les étapes EC1 et EC2, la fiche en pleine page |
| `candidatures/carte.html?id=…` | la carte d'identité d'un candidat (`&imprimer=1` pour le PDF) |
| `candidatures/decompte.html?id=…` | la feuille de décompte Yeita Match d'un candidat (`?vierge=1` à imprimer) |
| `candidatures/ui.js`, `parcours-ui.js`, `style.css` | l'interface commune, l'en-tête d'un candidat, les styles de l'espace |
| `candidatures/menu-candidat.js`, `notes.js` | le menu ⋯ d'un candidat (Fiche, Historique, Copier le lien, Supprimer) et le panneau Notes |
| `assets/qui.js` | « Qui es-tu ? », isolé pour être remplacé par l'identité Google |
| `assets/store.js` | les règles du parcours (passages, refus, décision, État) |
| `assets/dossier.js` | le dossier v3, la migration, l'adaptateur de stockage |

Chaque lien de l'espace porte l'identifiant opaque du candidat (`?id=cand-…`), jamais son nom. Aucune page n'affiche « le dernier candidat ouvert ».

## Tester

```sh
python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
node tools/test-store.js
python3 tools/e2e-candidatures.py
python3 tools/e2e-parcours.py
python3 tools/e2e-liens.py
python3 tools/e2e-pdf.py
```

Après un changement de texte seul, ouvrir la page concernée suffit ; les tests cherchent certains libellés, les relancer si un bouton change de nom.

## Proposer un changement

1. Une branche par sujet, par exemple `feat/…` ou `fix/…`.
2. Un commit par lot cohérent, avec un message qui dit ce qui change pour le recruteur.
3. Une pull request : ce qui change, comment le vérifier, et ce qui touche au modèle (`MODELE.md`).
