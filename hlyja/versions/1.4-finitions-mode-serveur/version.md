---
type: version
version: 1.4
slug: finitions-mode-serveur
titre: Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré
branche: version/1.4-finitions-mode-serveur
base: main
mode: standard
type_version: livrable
statut: en-cours
date: 2026-10-27
---

# Version 1.4 — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> **Statut** : en cours · **Branche** : `version/1.4-finitions-mode-serveur`
> Objectif : en mode serveur, le bandeau jaune dit où sont vraiment les candidatures et le tableau ne propose plus de charger des exemples fictifs dans la base partagée ; l'ancien modèle de données v2 est supprimé.

## Objectif
Traiter les fiches du backlog 1.3-1, 1.3-2 et 1.0-1. Les fiches 1.2-1, 1.2-2 et 1.2-4, aussi demandées, sont déjà `fait` en 1.3 : elles sont revérifiées contre le code (spec/verifications.md), sans être rouvertes.

## Pitch d'origine
`/hlyja 1.3-1, 1.2-1, 1.3-2, 1.2-4, 1.2-2, 1.0-1` — pitch construit depuis les fiches :

- **1.3-1** (bug, haute) — En mode serveur, le bandeau « Données fictives » dit encore que tout reste dans le navigateur. Les six pages de Candidatures affichent « Données fictives uniquement, jusqu'au déploiement sécurisé. Tout reste dans ce navigateur. » ; en mode serveur, c'est faux. Attendu : en mode serveur, un texte juste ; en mode navigateur, le texte actuel peut rester. Piste : un second texte (`commun.serveur`) choisi par `assets/demarrage.js` à l'entrée en mode serveur.
- **1.3-2** (évolution, moyenne) — Ne plus proposer « Charger des exemples » quand les candidatures sont dans la base partagée. En mode serveur, masquer `#demo-load`, `#demo-clear` et `#empty-demo` de `candidatures/index.html`, adapter le texte du tableau vide ; garder « Retirer les exemples » si des dossiers `meta.demo` existent déjà dans la base ; mettre à jour la règle « Cas particuliers » de la doc produit.
- **1.0-1** (dette, moyenne) — `docs/modele-de-donnees.md` décrit encore le dossier v2 et renvoie vers des fichiers supprimés en v1.0. Piste : retirer les renvois, marquer remplacé, ou supprimer.
- **1.2-1**, **1.2-2**, **1.2-4** — déjà traitées en 1.3 (statut `fait`).

Décisions de l'utilisateur (2026-10-27) :
- Niveau standard (recommandé).
- Texte du bandeau en mode serveur : « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. »
- `docs/modele-de-donnees.md` : supprimé.

## Niveau
Standard, recommandé et confirmé : 1.3-1 et 1.3-2 changent un comportement selon le mode (logique dans les pages, test de bout en bout du mode serveur), sans modèle, dépendance, API ni parcours nouveaux ; ce n'est donc pas de l'express.

## Plan d'équipe

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
