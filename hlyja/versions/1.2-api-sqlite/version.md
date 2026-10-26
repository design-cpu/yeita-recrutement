---
type: version
version: 1.2
slug: api-sqlite
titre: API Node.js sur SQLite pour les dossiers candidat
branche: version/1.2-api-sqlite
base: main
mode: complexe
type_version: livrable
statut: terminee
date: 2026-10-26
---

# Version 1.2 — API Node.js sur SQLite pour les dossiers candidat

> **Statut** : terminée · **Branche** : `version/1.2-api-sqlite`
> Objectif : livrer dans `api/` l'API Node.js (Fastify, better-sqlite3) qui remplacera le stockage du navigateur, derrière oauth2-proxy, sans toucher aux pages ni à Docker.

## Objectif
Une API JavaScript qui implémente le contrat de stockage de `docs/backend/MODELE.md` (list, get, put, remove sur des dossiers entiers) sur SQLite, avec autorisation par la table `equipe`, conflits par version optimiste, journal sans contenu, gestion de l'équipe en ligne de commande, et un mode local documenté.

## Pitch d'origine
Créer l'API qui remplacera le stockage dans le navigateur : une API JavaScript (Node.js) sur SQLite, destinée à être placée derrière oauth2-proxy. Le contrat de stockage est dans docs/backend/MODELE.md (list/get/put/remove sur des dossiers candidat entiers). Cette version ne touche ni aux pages ni à Docker.

Décisions déjà prises (ne pas les rediscuter) :
- Node.js 22 LTS dans api/, avec Fastify, SQLite via better-sqlite3, dépendances figées (package-lock.json), tests avec le module node:test. Toute l'application est ainsi en JavaScript.
- Sécurité : oauth2-proxy authentifiera et posera X-Forwarded-Email ; l'API lui fait confiance et vérifie l'autorisation contre une table equipe. Sans en-tête → 401 ; hors équipe ou inactif → 403 ; rôle lecture qui écrit → 403.
- Tables : equipe (email @yeita.fr en clé, prenom, role recruteur|admin|lecture, actif, ajoute_le), candidats (id, data = le dossier JSON entier, version, modifie_le, modifie_par), journal (candidat_id, action, etape, par, le ; jamais le contenu du dossier), options_disponibilite. Pas de colonnes tirées du JSON. Schéma appliqué par l'API à son démarrage. SQLite en WAL.
- Conflits : version optimiste. PUT avec version null = création (409 si l'id existe) ; sinon mise à jour seulement si la version lue est toujours la bonne, sinon 409 avec le message de MODELE.md.
- PUT contrôle data.schema, data.id égal à l'id de l'adresse, 1 Mo maximum.
- Routes : /api/moi, /api/equipe, /api/candidats (liste, lecture, PUT, DELETE), /api/options-disponibilite, /api/sante (sans authentification, pour un futur healthcheck).
- Gestion de l'équipe sans interface : node api/equipe.js add|list|disable|role. Le premier admin est créé ainsi, sur le serveur.
- L'API écoute sur le port 8000 (modifiable par la variable PORT).
- Mode local : DEV_EMAIL (email utilisé sans en-tête) et DEV_STATIC (sert aussi le site construit, pour la version suivante). Jamais présents en production. Commandes documentées dans le README.

Hors périmètre : les pages, Docker, le déploiement, les sauvegardes, toute route non listée.

## Niveau
Complexe, recommandé et confirmé par l'utilisateur : nouvelle API, nouvelles dépendances, nouveau modèle de données, confiance dans un en-tête d'authentification, données personnelles.

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Cadre : tout dans `api/` (Node 22, Fastify, better-sqlite3, node:test, dépendances figées). Retouches nécessaires hors `api/` : `tools/build.py` (`api/` exclu de la publication), `.gitignore` (`node_modules`, base), `docs/backend/MODELE.md` (section des tables alignée, accord de l'utilisateur). `.dockerignore` relève de Docker : backlog.
- Jury de 5 + arbitre : Technique Node/Fastify/SQLite (obligatoire), Développeur intégrateur (celui qui écrira l'adaptateur navigateur), Sécurité, Données personnelles, Exploitation. Puis chef d'équipe P1 à P4, revue de code et sécurité, QA, rédacteur-relecteur, curateur, validateur.
- Ordres de grandeur : spec 250 à 350 lignes ; 8 à 10 tâches ; 14 à 18 fichiers créés, 4 modifiés ; 35 à 45 scénarios de QA ; 8 à 9 pages de doc (architecture, conventions, décisions, nouvelle page API, avec vues humaines ; MODELE.md ; README).
- Pas fait : e2e Playwright (aucune page touchée), Docker et banc OVH, charge, sauvegardes, adaptateur navigateur, `QUI`, migration des données du navigateur, `docker-local.md`.
- Garde-fous : règle 1 (essai d'attaque sur X-Forwarded-Email avec témoin avant la spec v1), règle 2 (échec provoqué puis relance pour `equipe.js` et le schéma au démarrage), règle 3 (valeurs résolues de PORT, HOST, DEV_EMAIL, DEV_STATIC, chemin de la base ; valeurs absurdes refusées) ; aucun contenu de dossier dans `journal` ni dans les journaux du serveur ; mutations sur 401/403 et 409.

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
