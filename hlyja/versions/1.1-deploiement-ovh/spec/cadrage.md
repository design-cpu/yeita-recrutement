---
type: cadrage
version: 1.1
mode: complexe
type_version: livrable
sujet: deploiement-technique
modules: Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
challengers: Docker/Compose, Sécurité et authentification, Exploitation serveur partagé, Testabilité et mode d'emploi
date: 2026-10-26
---

# Cadrage — Déploiement de l'espace Candidatures sur le serveur OVH, derrière Google

> Mode complexe, version livrable. La spec couvre 4 modules en plus du socle ; 4 challengers + l'arbitre.
> Toutes les décisions d'architecture viennent du pitch et ne sont pas rediscutées : le jury juge leur mise en œuvre.
> Une vérification a contredit le pitch (`/index.html` redirigé par oauth2-proxy) : tranchée par l'utilisateur (second upstream).

## Nature du sujet
Sujet technique sans interface : empaqueter le site statique existant dans une image Docker où oauth2-proxy sert les fichiers et impose la connexion Google @yeita.fr, sauf pour une liste fermée de pages publiques. Ce qui compte : ne rien casser ni rien supposer sur un serveur partagé dont on ne connaît pas les autres services, et ne laisser fuiter aucune page protégée.

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | Recommandé et confirmé par l'utilisateur : nouvelles dépendances (Docker, oauth2-proxy, Caddy), authentification |
| Type | livrable | Destiné à être mergé puis déployé par l'équipe |

## Périmètre
### Ce que le pitch demande
- `docker/front.Dockerfile` en deux étapes (build Python, puis oauth2-proxy 7.15.x figé qui sert `/site`).
- `compose.yaml` : service `front` (port 4180 sur 127.0.0.1), service `caddy` sous le profil `caddy`, réseau `edge` en 172.30.0.0/24, journaux limités par service.
- `deploy/oauth2-proxy.cfg`, `deploy/Caddyfile` sans secret ; `.env.example` ; `.env` jamais commité.
- Liste fermée des chemins publics ; tout le reste protégé.
- `tools/check-site.sh BASE_URL`.
- `deploy/prepare-serveur.sh`, `deploy/deploy.sh`, `deploy/README.md` (cas A avec exemples nginx et Caddy, cas B, procédure prudente).
- Suppression de `.github/workflows/pages.yml` ; `assets/config.js` → `pagesCandidat.tonParcours` sur recrutement.yeita.fr.
- `tools/build.py` ne publie pas les fichiers de déploiement ; `.dockerignore`.
- Vérifier que les requêtes du reverse proxy de l'hôte arrivent depuis 172.30.0.0/24.
### Hors périmètre
- Base de données, API, sauvegardes (le dossier `/var/backups/recrutement` est seulement créé), déploiement automatique, installation de Docker ou du pare-feu, toute action sur le serveur.
- Changement des pages : en particulier `assets/yeita.js` (`SITE` pointe encore vers un site GitHub Pages) et la carte « Site du recrutement — GitHub Pages » de `index.html` ; `$id` de `docs/dossier-candidat.schema.json`. Candidats au backlog.
- 1.0-1, 1.0-2.
- Test réel de la connexion Google (pas de vrais identifiants) et du cas A sur un vrai nginx.

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Construire le site | `tools/build.py` (liste `SKIP`, enveloppe `index.html`) | étendre (`SKIP`) | [Conventions](../../../technique/conventions.md#publication) |
| Non-régression | `tools/test-store.js`, `tools/e2e-*.py` | réutiliser | [Conventions](../../../technique/conventions.md#tests) |
| Réglages publics | `assets/config.js` | modifier une valeur | — |
| Décisions de stockage et d'authentification | `technique/decisions.md` (oauth2-proxy, SSO Google @yeita.fr) | réutiliser | [Décisions](../../../technique/decisions.md) |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Socle | oui | Toujours présent |
| Architecture technique | oui | Nouveaux composants (image, Compose, proxy), dépendances à figer |
| Sécurité et conformité | oui | Authentification, liste publique / protégée, secrets, en-têtes |
| Déploiement et compatibilité | oui | Serveur partagé, cas A / B, retour arrière, fin de GitHub Pages |
| Exploitation | oui | Journaux, configuration, contrôle du site, scripts |
| Valeur et business, Mesure | non | Pas d'enjeu commercial ni de mesure |
| UX/UI, Design system, Accessibilité, Contenu | non | Aucune page ne change |
| Données, API | non | Données dans le navigateur ; hors périmètre |
| Performance et fiabilité | non | Site statique, faible trafic interne |

## Jury
| Challenger | Initiale | Pourquoi | Grille (3 à 5 critères) |
|---|---|---|---|
| Docker/Compose | D | Profil technique obligatoire | Fidélité au pitch (images, tags, étapes) · Compose (réseau, profils, ports, journaux, nom de projet) · Contenu de l'image (rien de trop, rien de manquant) · Reproductibilité |
| Sécurité et authentification | S | Module Sécurité | Liste publique exacte et sans contournement · Configuration oauth2-proxy (domaine, proxys de confiance, cookies) · Secrets · En-têtes HTTP |
| Exploitation serveur partagé | E | Modules Déploiement et Exploitation | Aucun effet de bord sur les autres services · Idempotence et arrêts propres · Retour arrière · Nettoyage limité au projet |
| Testabilité et mode d'emploi | L | Profil « utilisateur » : la personne qui déploie | Critères vérifiables en local · `check-site.sh` · Clarté du README (cas A, cas B, procédure prudente) |
| Arbitre | — | Toujours présent | Juge la recevabilité des retours |

## Décisions demandées à l'utilisateur
- Niveau : complexe (confirmé).
- Docker Desktop lancé sur le poste pour les essais : oui.
- `/index.html` redirigé (301) par le serveur de fichiers d'oauth2-proxy (V4) : ajouter un second upstream `file:///srv/site/#/index.html` (choix de l'utilisateur, plutôt qu'accepter le 301).
