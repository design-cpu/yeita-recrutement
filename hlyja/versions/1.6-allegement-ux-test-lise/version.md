---
type: version
version: 1.6
slug: allegement-ux-test-lise
titre: Allègement de l'interface de Candidatures après le test avec Lise
branche: feat/allegement-ux-test-lise
base: main
mode: express
statut: terminee
date: 2026-10-27
---

# Version 1.6 — Allègement de l'interface de Candidatures après le test avec Lise

> **Terminée** · express · 5 lots · pages de l'espace Candidatures, guide, page publique des étapes · aucun changement d'authentification, de stockage, de Docker ni de déploiement

## Demande
- Principe : le recruteur ne voit que l'endroit où il est, ce qu'il remplit et l'action suivante. La méthode vit dans le guide de l'étape. Chaque étape peut être faite par quelqu'un qui arrive sans contexte.
- Lot 1 : plus d'aides dépliantes, de rappels de méthode ni d'étiquettes « À remplir / Rempli » ; « Guide de l'étape » sans numéro ; un seul gabarit d'étape ; un seul dépliant (chevron) ; étapes sans badge ; en bas de page, seulement les actions ; Historique, Fiche du candidat et Supprimer dans un menu ⋯ avec fenêtre ; confirmation de passage ; écran de fin après « Arrivée confirmée » ; « Non retenu » partout.
- Lot 2 : carte du tableau cliquable en entier, nom complet, recruteurs par prénom ; menu ⋯ sur les cartes et les lignes ; après l'ajout, « Démarrer l'appel maintenant » ou « Enregistrer et revenir à la liste ».
- Lot 3 : un seul panneau Notes, à droite, à tout moment ; une note libre par étape ; l'EC1 commence par l'échange libre ; reprise des anciennes notes sans perte.
- Lot 4 : titre de la page parcours et objet du mail (3 propositions) ; deux liens dans le mail, lus dans la config ; libellés de l'EC1 ; employabilité visible par défaut avec « Masquer sur la carte » ; carte en pleine largeur avec Imprimer dans les Bilans et l'EC3 ; « Mettre en attente (retour à faire) » ; EC2 : rôle en lecture seule, palier suggéré, plus de point d'appui, attendu par palier dans le guide ; l'appel au candidat passe à la Proposition.
- Lot 5 : mention RGPD sur la carte (écran et PDF) et sur la page des étapes, durée et contact dans la config.
- Hors périmètre : fusion Décision et Proposition, autodiagnostic EC2, vivier collaborateurs, Yeita Match par session, authentification, stockage, déploiement OVH.

## Plan
Express, validé par Léo : branche `feat/allegement-ux-test-lise`, version 1.6 avec ce changelog, palier suggéré d'après la grille Figma, employabilité visible par défaut une fois un état choisi. Fait par groupes (lots 1 et 2, lots 3 et 4, lot 5), puis tests et documentation.

## Résultat
- Nouveaux fichiers : `candidatures/menu-candidat.js` (menu ⋯, fenêtres Fiche, Historique, Supprimer, bloc Infos candidat partagé), `candidatures/notes.js` (panneau Notes).
- Modifiés : `assets/wording.fr.js`, `config.js` (one-pager Notion, `paliersSalaire`, `rgpd`), `store.js` (`palierSuggere`, « Mis en attente »), `dossier.js` (reprise des notes), `data-parcours.js` (`notesLibres` activé), `yeita.js` (icône Printer) ; `candidatures/candidat.html`, `ec1.html`, `ec2.html`, `carte.html` (`?seule=1`, mention RGPD), `index.html`, `parcours-ui.js`, `ui.js`, `style.css` ; `index.html` (repères des fiches EC1 et EC2 rangés dans le guide) ; `one-pager.html` (titre, mention RGPD).
- Corrigé au passage : les fiches EC1 et EC2 travaillaient sur la partie même du dossier lu, ce qui pouvait faire refuser un enregistrement (« modifiée par quelqu'un d'autre ») à la réouverture d'une fiche partielle ; un test de l'API instable (ligne « Mode local » lue trop tôt).
- Tests : `node tools/test-store.js` TOUT OK · `node tools/test-serveur.js` TOUT OK (87) · `cd api && npm test` 52/52 · `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` ALL OK · `e2e-serveur` TOUT OK. Parcours fictifs : parcours complet jusqu'à l'écran de fin, refus au Bilan EC1, mise en attente, palier suggéré (64 k€ → palier 3), notes, menu ⋯ au clavier, PDF avec RGPD, téléphone sans défilement horizontal.
- Non vérifié ici : Docker (`docker compose up -d --build` puis `tools/check-site.sh https://localhost`), à lancer sur le poste de Léo.
- Backlog : 1.6-1 (noms des paliers), 1.6-2 (RGPD à valider), 1.6-3 (one-pager hébergé), 1.6-4 (souhait de rémunération structuré).

## Comment tester
`python3 tools/build.py _site && cd api && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start`, puis http://127.0.0.1:8000/candidatures/ : ajouter un candidat (« Démarrer l'appel maintenant »), noter un souhait de rémunération, mener le parcours jusqu'à « Arrivée confirmée » ; ouvrir le panneau Notes à chaque étape ; essayer le menu ⋯ sur une carte, une ligne et l'en-tête ; refuser un autre candidat au Bilan EC1, en mettre un troisième en attente.

## Changelog
- Ajouté : panneau Notes (une note par étape, à tout moment, non communiquée au candidat) ; menu ⋯ (Fiche du candidat, Historique, Copier le lien, Supprimer) sur les cartes, les lignes et l'en-tête ; écran de fin après « Arrivée confirmée » ; palier suggéré en EC2 depuis le souhait de rémunération ; « Échange libre » en tête de l'EC1 ; carte d'identité en pleine largeur avec Imprimer dans les Bilans et l'EC3 ; mention RGPD sur la carte, son PDF et la page des étapes.
- Modifié : « No go » devient « Non retenu », « En réflexion » devient « Mettre en attente (retour à faire) » ; « Interne » devient « Non communiqué au candidat », « Sur la carte » devient « Visible sur la carte du candidat » ; employabilité visible sur la carte dès qu'un état est choisi, avec « Masquer sur la carte » ; confirmation de passage « EC1 validé → Bilan EC1 » ; carte du tableau cliquable en entier, recruteurs par prénom ; « Démarrer l'appel maintenant » ; « Guide de l'étape » sans numéro ; rôle EC2 en lecture seule, repris du Job ; l'appel au candidat se coche à la Proposition ; titre « Les étapes de ton recrutement chez Yeita » et objet « Yeita : la suite de ton recrutement » ; deux liens dans le mail.
- Retiré des fiches (rangé dans le guide de l'étape) : rappels de méthode, repères de l'EC1, trame de l'EC2, barème détaillé, attendu Yeita palier par palier ; retiré : « À remplir / Rempli », le « point d'appui », les variantes « Afficher / Masquer ».
