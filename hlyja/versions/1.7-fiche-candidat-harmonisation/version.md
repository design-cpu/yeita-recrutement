---
type: version
version: 1.7
slug: fiche-candidat-harmonisation
titre: Fiche du candidat, dépôt de fichiers et harmonisation des étapes
branche: feat/fiche-candidat-harmonisation
base: main
mode: express
statut: terminee
date: 2026-10-27
---

# Version 1.7 — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> **Terminée** · express · pages de l'espace Candidatures, API (fichiers), guide inchangé · aucun changement d'authentification, de Docker ni de déploiement

## Demande
- Création d'un candidat = la fenêtre « Fiche du candidat », en création (« Passer à l'appel de découverte », « Enregistrer et revenir à la liste ») ; même composant que le bloc Infos de l'appel (champs, ordre, groupes, grille).
- CV et Portfolio : déposer un fichier ou coller un lien, explicitement ; espace de dépôt par candidat dans le stockage sécurisé ; RGPD (même durée, supprimés avec le candidat, tracés).
- Étapes : liens utiles de l'appel retirés ; EC1 sans « Liens et outils », « Yeita Match », bouton du jeu en ligne en visio ; EC2 : grille en icône, palier sans retour à la ligne, mention de séniorité ; Bilans : partie interne sous la carte.
- Règles communes : plus de sélecteur d'État dans les étapes ; noms complets partout sauf la carte du kanban.
- À discuter (backlog) : sortir l'Onboarding du funnel.
- Largeur et layout identiques sur toutes les étapes, panneau Notes à côté sur grand écran.
- Durée de conservation RGPD : 22 mois.

## Plan
État des lieux validé par Léo : fichiers dans la base SQLite existante (table `fichiers`, schéma v2), 4 routes, sans dépendance nouvelle, 10 Mo ; « Copier pour Notion » et « Vider la fiche » retirés. Fait par groupes : sections 1, 2 et 6 ; 3 et 4 ; 5 et documentation.

## Résultat
- API : `api/src/fichiers.js` (nouveau), `base.js` (`VERSION_SCHEMA` 2, `MIGRATIONS`), `candidats.js` (fichiers effacés avec le dossier), `app.js` (route d'envoi hors JSON, messages 413/415), `valeurs.js` ; tests `api/test/fichiers.test.js` (7), `base.test.js` (migration v1 → v2).
- Pages : `candidatures/menu-candidat.js` (fiche en création et en consultation, champs CV et Portfolio), `index.html` (formulaire d'ajout retiré), `candidat.html`, `ec1.html`, `ec2.html`, `carte.html` (`interne=1`), `parcours-ui.js`, `ui.js` (`nomComplet`, initiales sur le kanban), `style.css` (`.wrap.etape`, grille, documents) ; `assets/adapter-serveur.js` (`deposer`, `fichierUrl`, `retirerFichier`), `dossier.js` (`identite.fichiers`), `store.js` (`estPassage`), `config.js` (`equipeNoms`, RGPD 22 mois), `wording.fr.js`, `yeita.js` (icônes Paperclip, ExternalLink) ; `one-pager.html` (22 mois).
- Largeur commune : **1120 px** (`.wrap.etape`, `--etape-max`) ; panneau Notes à côté dès 1360 px, par-dessus en dessous (documenté dans [Conventions](../../technique/conventions.md)).
- Tests : `cd api && npm test` 60/60 · `node tools/test-store.js` TOUT OK · `node tools/test-serveur.js` TOUT OK (87) · `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` ALL OK · `e2e-serveur` TOUT OK, hors deux contrôles « départ de la page » instables, qui échouent aussi sur `main` (backlog 1.7-3).
- Non vérifié ici : Docker (`docker compose up -d --build`), à lancer par Léo ; derrière un nginx existant (cas A), `client_max_body_size 10m`.
- Backlog : 1.7-1 (Onboarding hors du funnel, à discuter), 1.7-2 (purge RGPD 22 mois, à discuter), 1.7-3 (tests instables), 1.7-4 (feuille de décompte depuis l'EC1), 1.7-5 (noms complets de l'équipe) ; 1.6-2 mis à jour (22 mois).

## Comment tester
`python3 tools/build.py _site && cd api && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start` (ajouter d'abord `moi@yeita.fr` avec `node equipe.js add`), puis http://127.0.0.1:8000/candidatures/ : « Ajouter un candidat », déposer un CV en PDF, coller un lien de portfolio, « Passer à l'appel de découverte » ; un second en « Enregistrer et revenir à la liste » ; supprimer un candidat avec ses fichiers (menu ⋯) ; EC1 en visio ; EC2 sur chaque palier ; Bilans EC1 et EC2 avec la partie interne. La base passe d'elle-même en version 2 au premier démarrage.

## Changelog
- Ajouté : dépôt de fichiers (CV, Portfolio) par candidat, PDF/PNG/JPG, 10 Mo, dans la base sécurisée, effacés avec le candidat, tracés dans l'historique ; bouton « Ouvrir Yeita Match en ligne » en visio ; partie interne de la carte dans les Bilans ; mention de séniorité sous le barème EC2.
- Modifié : « Ajouter un candidat » ouvre la fenêtre Fiche du candidat (« Passer à l'appel de découverte », « Enregistrer et revenir à la liste ») ; un seul composant de fiche (4 groupes, 3 colonnes) ; une seule largeur pour toutes les étapes ; grille de salaire en icône ; sélecteur de palier sur une ligne ; noms complets partout, initiales sur la carte du kanban ; RGPD : 22 mois.
- Retiré : formulaire d'ajout du tableau ; liens utiles de l'appel ; « Liens et outils » de l'EC1 et de l'EC2 (avec « Tout déplier », « Copier pour Notion », « Vider la fiche ») ; sélecteur d'État dans les étapes.
