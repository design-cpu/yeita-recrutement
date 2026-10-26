---
type: version
version: 1.3
slug: branchement-api
titre: Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy
branche: version/1.3-branchement-api
base: main
mode: complexe
type_version: livrable
statut: en-cours
date: 2026-10-26
---

# Version 1.3 — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> **Statut** : en cours · **Branche** : `version/1.3-branchement-api`
> Objectif : les pages de `candidatures/` lisent et écrivent les dossiers dans l'API de `api/` quand elle répond (mode serveur), et restent dans le navigateur sinon ; l'API tourne dans Docker, joignable seulement par oauth2-proxy.

## Objectif
Brancher le stockage et l'identité des pages sur l'API (adaptateur serveur, démarrage, `QUI` en mode serveur, options de disponibilité, rechargement au retour sur l'onglet), sans changer la logique métier ; ajouter le service `api` à la pile Docker, sur un réseau interne partagé avec `front` seulement.

## Pitch d'origine
Brancher les pages de candidatures/ sur l'API de api/, et ajouter l'API au déploiement Docker,
joignable uniquement par oauth2-proxy. La logique métier des pages ne change pas : seuls le
stockage et l'identité changent.

Décisions déjà prises (ne pas les rediscuter) :
- Commencer par l'inventaire, pour chaque page de candidatures/, des points d'entrée au chargement
  (QUI.monter, boot, load…), des écoutes storage, et des accès au localStorage hors de dossier.js et
  qui.js.
- assets/adapter-serveur.js : list/get/put/remove en fetch vers /api/candidats, qui retient la version
  lue de chaque dossier ; s'inspirer de l'ancien adapter-supabase.js (hash dans le bilan de la
  version 1) ; messages de MODELE.md pour conflit, accès et réseau ; un 401 recharge la page.
- Un démarrage (assets/demarrage.js) appelle /api/moi : sur 200, DOSSIER.use(adaptateur serveur) ;
  sinon le mode navigateur reste actif. Chaque page attend ce démarrage avant sa première lecture.
- En mode serveur : QUI.moi() rend le prénom du compte, la liste « Qui es-tu ? » disparaît,
  QUI.equipe() vient de /api/equipe, les options de disponibilité passent par l'API, les écoutes
  storage deviennent un rechargement au retour sur l'onglet (visibilitychange).
- Docker : docker/api.Dockerfile (image node:22-slim, utilisateur non root, healthcheck sur
  /api/sante) ; service api sur un réseau back interne partagé avec front seulement ; volume
  recrutement_data sur /data ; caddy ne doit pas pouvoir joindre l'api ; jamais DEV_EMAIL ni
  DEV_STATIC en production. oauth2-proxy : upstream http://api:8000/api/ et api_routes = ["^/api/"].
- check-site.sh : /api/moi sans cookie → 401. deploy/README.md : gérer l'équipe en production avec
  docker compose exec api node api/equipe.js.
- Corriger la note de carte.html qui renvoie vers « le site GitHub » pour imprimer.
- Tests : les tests existants passent toujours en mode navigateur ; un test de bout en bout du mode
  serveur (création puis rechargement, conflit entre deux navigateurs, rôle lecture, prénom sans liste).

Hors périmètre : le bandeau « Données fictives », le relais yeita-match-resultat entre la feuille de
décompte et la fiche EC1, les règles de store.js, le temps réel, les sauvegardes, toute évolution de
l'API hors de ce que le branchement exige.

Fiches du backlog rattachées par l'utilisateur : 1.2-1 (sans l'essai avec un vrai compte Google, manuel), 1.2-2, 1.2-3 (sans la migration du localStorage).

## Niveau
Complexe, recommandé et confirmé par l'utilisateur : sécurité (seul oauth2-proxy joint l'API), données personnelles, nouveau service Docker, nouvel adaptateur de stockage.

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Étapes : cadrage (inventaire imposé d'abord), vérifications (essais d'attaque), spec v1, jury et arbitre (2 tours visés, un 3e seulement si le score bouge), découpage, réalisation, revue de code et sécurité, QA, rédacteur-relecteur, curateur, validateur ; chef d'équipe P1 à P4.
- Jury de 6 + arbitre : F Technique front JS, A Intégrateur API, S Sécurité réseau et proxy, D Données personnelles, E Exploitation Docker, R Recruteur utilisateur.
- Ordres de grandeur : spec 300 à 400 lignes ; 9 à 11 tâches ; 4 à 6 fichiers créés, 15 à 20 modifiés ; 45 à 60 scénarios de QA ; 9 à 11 pages de doc.
- Pas fait : migration du localStorage ; hors périmètre du pitch ; essai avec un vrai compte Google (manuel, au bilan) ; déploiement en production et charge (essais Docker locaux seulement).
- Garde-fous : règle 1 — trois essais d'attaque avec témoin avant la spec v1 (port de l'API non publié, `X-Forwarded-Email` forgé écrasé par oauth2-proxy, api injoignable depuis caddy et joignable depuis front) ; règle 2 — compose jetable, échec provoqué (volume en lecture seule, healthcheck en échec) puis relance ; règle 3 — réseau, ports, absence de DEV_EMAIL/DEV_STATIC lus sur `docker compose config`, routes essayées en `/%61pi/moi`, `//api/moi`, `/API/moi`, `/api/../api/moi` ; règle 4 — suppression vérifiée côté serveur et localStorage, aucun contenu de dossier dans les journaux ; règle 5 — mutations sur 401, 409, repli navigateur, durée maximale par test ; règle 6 — `node:22-slim` figée par digest et datée, `npm audit` sur tout le lockfile ; non-régression à chaque tâche.

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
