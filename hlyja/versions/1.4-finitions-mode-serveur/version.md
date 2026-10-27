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
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Étapes et sous-agents : vérifications (orchestrateur ; 1.2-1, 1.2-2, 1.2-4 revérifiées sans être rouvertes) ; spec courte et un relecteur technique et produit ; 3 tâches (T1 bandeau, T2 exemples, T3 suppression de l'ancien modèle) ; revue de code légère ; QA indépendante ; rédacteur-relecteur, curateur, validateur.
- Ordres de grandeur : spec de 40 à 60 lignes (8 à 10 règles et CA) ; 3 tâches ; ~6 fichiers (`assets/wording.fr.js`, `assets/demarrage.js`, `candidatures/index.html`, `tools/test-serveur.js`, `tools/e2e-serveur.py`, `docs/modele-de-donnees.md` supprimé) ; 10 à 15 vérifications ajoutées ; 6 à 8 scénarios de QA ; 3 pages de doc (`doc/produit/stockage-partage.md`, `technique/mode-serveur.md`, `technique/conventions.md`).
- Pas fait : aucun test ajouté à `api/` (rien n'y change), ni à `test-store.js` ni aux e2e en mode navigateur (relancés en non-régression seulement) ; pas d'essai réseau, d'effacement, d'âge du lockfile (aucun réglage de sécurité, script système ni dépendance touchés) ; pas de scénario de concurrence sur « Retirer les exemples » (comportement 1.3 gardé).
- Garde-fous : verdict final recopié mot pour mot pour chaque suite (règle 3 de la 1.3) ; décisions prises sur `DEMARRAGE.mode()`, jamais sur l'hôte (règle 2 de la 1.2) ; 3 ou 4 mutations classées détectée / survivante / bloque / plantage, avec durée maximale (règle 4 de la 1.3) ; tout écart hors des trois fiches va au backlog.

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
