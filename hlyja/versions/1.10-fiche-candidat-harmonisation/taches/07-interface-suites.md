---
type: tache
version: 1.10
numero: 07
titre: Interface de Léo et suites complètes
statut: ok
date: 2026-10-28
---

# Tâche 07 — Interface de Léo et suites complètes

> **QA : réussie** · 1 fichier (`tools/e2e-parcours.py`) · 2 corrections
> Les choix d'interface de Léo qui n'avaient pas de test en ont un.

## Ce que ça change
`e2e-parcours` vérifie en plus : largeur de 1120 px sur l'appel, l'EC1 et l'EC2 ; Notes à côté dès 1360 px (au moins 900 px de contenu, sans chevauchement), par-dessus à 1280 px ; appel en cours sans « Liens utiles » ; aucun sélecteur d'État dans les étapes ; initiales sur la carte du kanban, sélecteur d'État gardé ; grille de la fiche en 3, 2 puis 1 colonnes ; téléphone sans défilement horizontal (tableau, appel, fenêtre de création ajoutés).

## Comment tester
`python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`, puis `python3 tools/e2e-parcours.py` → `ALL OK`.

## Critères d'acceptation
- [x] CA16 — points de R17 non couverts par les e2e de Léo : ajoutés (7 contrôles) ; les autres étaient déjà couverts (`e2e-candidatures`, `e2e-parcours`, `e2e-serveur`, `test-store` pour la mention RGPD du one-pager).
- [ ] CA17 — suites complètes et `docker compose build` : à la QA de version.

## Ce qui a été fait
Commits : `99efd9f` test(fiche-candidat-harmonisation): tâche 07 – interface de Léo couverte par e2e-parcours.

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA16 | ok (`e2e-parcours` : `errors: []`, `ALL OK`) |
Corrections : (1) le contrôle « appel sans liens » lisait un candidat au Bilan EC1 : un candidat à l'appel est créé pour lui ; (2) la fenêtre de création sur téléphone ne s'ouvrait pas sans prénom choisi : `QUI.choisir` avant.

## Mutations
Contrôles d'affichage ajoutés ; mises à l'épreuve par la QA de version (couche composant).

## Spec couverte
R16, R17, CA16
