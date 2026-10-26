---
type: cadrage
version: 1.2
mode: complexe
type_version: livrable
sujet: api-technique
modules: Données, API et intégrations, Architecture technique, Sécurité et conformité, Exploitation
challengers: Technique Node/SQLite, Développeur intégrateur, Sécurité, Données personnelles, Exploitation
date: 2026-10-26
---

# Cadrage — API Node.js sur SQLite pour les dossiers candidat

> Mode complexe, version livrable. La spec couvre 5 modules en plus du socle ; 5 challengers + l'arbitre.
> Toutes les décisions d'architecture viennent du pitch : le jury juge leur mise en œuvre, pas leur choix.
> Trois décisions de l'utilisateur après les vérifications : écoute sur 127.0.0.1 par défaut (variable `HOST`), Fastify 5.12.7, section des tables de `MODELE.md` alignée.

## Nature du sujet
Sujet technique sans interface : une API HTTP en JavaScript, dans `api/`, qui stocke les dossiers candidat entiers dans SQLite et implémente le contrat list/get/put/remove de `docs/backend/MODELE.md`. Ce qui compte : personne ne lit ni n'écrit un dossier sans être dans la table `equipe`, deux recruteurs ne s'écrasent pas, et aucun contenu de dossier ne fuit dans un journal. L'API doit être prête à être branchée par l'adaptateur navigateur et placée derrière oauth2-proxy à la version suivante.

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | Recommandé et confirmé par l'utilisateur : nouvelle API, dépendances, modèle de données, confiance dans un en-tête, données personnelles |
| Type | livrable | Destinée à être mergée puis branchée à la version suivante |

## Périmètre
### Ce que le pitch demande
- `api/` en Node.js 22 : Fastify, better-sqlite3, `package-lock.json`, tests `node:test`.
- Autorisation : identité lue dans `X-Forwarded-Email` ; 401 sans en-tête, 403 hors équipe ou inactif, 403 pour un rôle `lecture` qui écrit.
- Tables `equipe`, `candidats`, `journal`, `options_disponibilite`, sans colonne tirée du JSON ; schéma appliqué au démarrage ; WAL.
- Version optimiste : PUT avec `version: null` crée (409 si l'id existe), sinon met à jour si la version est la bonne, sinon 409 avec le message de `MODELE.md`.
- Contrôles du PUT : `data.schema`, `data.id` égal à l'id de l'adresse, 1 Mo maximum.
- Routes : `/api/moi`, `/api/equipe`, `/api/candidats` (liste, lecture, PUT, DELETE), `/api/options-disponibilite`, `/api/sante` (sans authentification).
- `node api/equipe.js add|list|disable|role`.
- Port 8000, variable `PORT`.
- Mode local : `DEV_EMAIL`, `DEV_STATIC` ; commandes dans le README.
- Décisions de l'utilisateur (vérifications) : `HOST`, 127.0.0.1 par défaut ; Fastify 5.12.7 ; section « Tables SQLite » de `MODELE.md` alignée.
### Hors périmètre
- Les pages, dont `assets/dossier.js`, `assets/qui.js`, `assets/store.js` (adaptateur serveur et identité : version suivante).
- Docker, `compose.yaml`, `.dockerignore`, `deploy/` (l'exclusion de `api/` du contexte Docker sera un candidat au backlog).
- Le déploiement, les sauvegardes, la migration des données du navigateur.
- Toute route non listée (pas d'ajout ou de modification de l'équipe par HTTP, pas d'export, pas de lecture du journal par HTTP).
- 1.0-1, 1.0-2, 1.1-1 à 1.1-9.

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Contrat de stockage, message de conflit | `docs/backend/MODELE.md` | réutiliser ; section des tables alignée | — |
| Format du dossier (`schema`, `id`, `meta.modifieLe`, `parcours.etape`) | `assets/dossier.js` (`SCHEMA`, `uid`, `touch`) | réutiliser (lecture seule) | [Conventions](../../../technique/conventions.md) |
| Options de disponibilité de base | `assets/dossier.js` (`DISPOS`), `assets/store.js` (`DISPO_KEY`) | réutiliser : l'API ne stocke que les options ajoutées | — |
| Publication du site | `tools/build.py` (`SKIP`) | étendre (`api`) | [Conventions](../../../technique/conventions.md#publication) |
| Non-régression | `node tools/test-store.js` | réutiliser | [Conventions](../../../technique/conventions.md#tests) |
| Authentification | oauth2-proxy v7.15.5 (`deploy/oauth2-proxy.cfg`) | réutiliser (aucune modification) | [Architecture](../../../technique/architecture.md) |
| Serveur HTTP, SQLite, fichiers statiques | aucun dans le dépôt | créer : Fastify, better-sqlite3, @fastify/static (décisions du pitch ; @fastify/static pour `DEV_STATIC`) | — |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Socle | oui | Toujours présent |
| Données | oui | Quatre tables, schéma au démarrage, WAL, version optimiste, journal |
| API et intégrations | oui | Routes, formats, codes d'erreur : contrat pour l'adaptateur de la version suivante |
| Architecture technique | oui | Nouveau composant, dépendances figées, organisation de `api/` |
| Sécurité et conformité | oui | Confiance dans un en-tête, rôles, données personnelles, mode local |
| Exploitation | oui | Variables, `equipe.js`, journaux du serveur, README |
| Déploiement et compatibilité | non | Pas de mise en place à cette version (Docker et déploiement hors périmètre) ; la compatibilité avec le contrat est portée par le module API |
| Performance et fiabilité | non | Quelques recruteurs, quelques centaines de dossiers ; la fiabilité des écritures est portée par Données |
| UX/UI, Contenu, Valeur, Mesure | non | Pas d'interface ni d'enjeu commercial |

## Jury
| Challenger | Initiale | Pourquoi | Grille (3 à 5 critères) |
|---|---|---|---|
| Technique Node/SQLite | T | Profil technique obligatoire | Faisabilité avec Fastify et better-sqlite3 · Transactions et version optimiste · Schéma au démarrage et relance · Testabilité (node:test) · Simplicité |
| Développeur intégrateur | I | API exposée ; il écrira l'adaptateur navigateur | Clarté du contrat list/get/put/remove · Codes et corps d'erreur · Forme des réponses (version, dossier) · Cohérence avec `MODELE.md` |
| Sécurité | S | Module Sécurité | Confiance dans `X-Forwarded-Email` et accès direct · Rôles et contrôle d'accès · Entrées non fiables (PUT, id, en-têtes) · Mode local jamais actif en production |
| Données personnelles | D | Dossiers de candidats (RGPD) | Journal sans contenu · Effacement réel · Journaux du serveur · Minimisation |
| Exploitation | E | Module Exploitation | `equipe.js` et premier admin · Variables et valeurs refusées · Démarrage, arrêt, relance · README |
| Arbitre | — | Toujours présent | Juge la recevabilité des retours |

## Décisions demandées à l'utilisateur
- Adresse d'écoute : **127.0.0.1 par défaut, variable `HOST`** (V9, V10) ; `DEV_EMAIL` refusé si `HOST` n'est pas locale.
- Fastify : **5.12.7** (13 jours au lieu de 14 ; corrige GHSA-389g-gv7q-r4x8) (V2).
- `docs/backend/MODELE.md` : **section « Tables SQLite proposées » alignée** sur les tables réelles.
