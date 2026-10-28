---
type: cadrage
version: 1.9
mode: complexe
type_version: livrable
sujet: exploitation
modules: UX/UI, API et intégrations, Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
challengers: Sécurité frontière, Exploitation systemd, Déploiement et retour arrière, Testabilité, Utilisateur admin
date: 2026-10-28
---

# Cadrage — Déploiement automatique de main après les tests

> Mode complexe, version livrable. La spec couvre 6 modules en plus du socle ; 5 challengers + l'arbitre.
> Ce qui compte : l'application ne fait que **déposer** une demande, l'hôte décide ; un commit n'est déployé qu'après ses tests ; un déploiement raté revient tout seul au commit d'avant ; le statut reprend le mécanisme des sauvegardes.

## Nature du sujet
Un script de l'hôte (`deploy/auto-deploy.sh`), planifié par systemd, teste puis déploie le dernier commit de `main` ; une page d'administration montre les passages et dépose des demandes. Le risque est double : laisser l'application piloter l'hôte au-delà de « déployer un commit de main testé », et casser la production sans retour (script qui se remplace, verrou, demande perdue, unité qui s'arrête).

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | nouvelle route d'API en écriture, nouveau parcours admin, script système qui agit seul en production ; recommandé et confirmé par l'utilisateur (2026-10-28) |
| Type | livrable | le pitch décrit une fonctionnalité à mettre en production |

## Périmètre
### Ce que le pitch demande
- `deploy/auto-deploy.sh` : fetch de main, rien à faire si déjà déployé, dernier en échec ou en pause (sauf demande) ; tests dans un worktree temporaire (`test-store`, `npm test`, `docker compose build`) ; déploiement par `deploy.sh <hash>` ; hash en échec noté ; verrou ; la demande la plus récente traitée juste après un passage.
- Pause par `deploy/PAUSE` : créée par tout déploiement d'un autre commit que le dernier de main (page ou `deploy.sh <hash>`), retirée par « Reprendre ».
- Lancement à la main = dernier commit de main tout de suite, avec les tests.
- Unités `deploy/systemd/recrutement-deploy.service`, `.timer` (10 min), `.path` (demande déposée) ; journaux par journalctl ; installation dans le README.
- Demandes déposées par l'application dans un emplacement partagé avec l'hôte, validées par l'hôte (format, appartenance à main), refus enregistré.
- Statut des 30 derniers passages (date, déclencheur, commit, branche, résultat, étapes avec statut, durée et 300 dernières lignes de sortie), par le mécanisme de la page des sauvegardes.
- Page `/admin/deploiement.html` (commit en ligne, automatisme actif ou en pause, « Reprendre », « Déployer maintenant », demande en attente ou passage en cours, passages dépliables, « Déployer ce commit » avec confirmation), même style et même protection que `sauvegardes.html`.
- `README.md`, section « Publier ».
- Décisions de l'utilisateur : retour automatique après un déploiement KO (sans pause) ; refus des commits antérieurs à la 1.9.

### Hors périmètre
- GitHub Actions, préproduction, notifications (email, message) : exclus par le pitch (alertes : 1.7-6).
- Tout autre changement de l'application (pages Candidatures, autres routes).
- Tableau de bord d'administration `admin/index.html` : 1.7-7.
- Images indépendantes des droits du dépôt : 1.8-1.
- Gestion de l'équipe depuis la page, installation de logiciels sur le serveur, nouveau mécanisme CSRF (V10 : la protection existante tient).

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Déployer un commit | `deploy/deploy.sh [commit]` (verrou, contrôles, check-site, commande de retour) | étendre (création de `PAUSE`, exclusion locale) | [Architecture](../../../technique/architecture.md#scripts) |
| Écrire l'état lu par une page admin | `deploy/commun.sh` : `ecrire_etat`, `lire_reglages`, `maintenant` ; `/data/etat` | réutiliser | [Architecture](../../../technique/architecture.md#scripts) |
| Servir l'état aux admins | `api/src/sauvegardes.js` (`lire`, contrôle `admin`), `routes.js` | réutiliser le modèle (nouveau module `deploiement.js`) | [API](../../../technique/api.md) |
| Contrôle d'accès, corps JSON obligatoire | `api/src/app.js` (`onRequest`, `preValidation` 415) | réutiliser | [API](../../../technique/api.md) |
| Page admin | `admin/sauvegardes.html` (style, messages d'erreur, texte jamais en HTML) | réutiliser le modèle (nouvelle page) | [Architecture](../../../technique/architecture.md) |
| Unités systemd | `deploy/systemd/recrutement-backup.*` (oneshot, `User=deploy`, `UMask`, timeouts) ; installation `deploy/README.md` § 14 | réutiliser le modèle | [Mise à jour](../../../technique/mise-a-jour-production.md) |
| Banc de test des scripts | `tools/test-sauvegarde.sh` (faux outils, `BANC_JETABLE=oui`) | réutiliser le modèle | [Conventions](../../../technique/conventions.md) |
| Contrôle du site | `tools/check-site.sh` | étendre (`/admin/deploiement.html` → 302) `[ajout]` | [Architecture](../../../technique/architecture.md#scripts) |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Socle | oui | Toujours présent |
| UX / UI | oui | Nouvelle page avec états (vide, attente, en cours, pause, erreur) et dépliages |
| API et intégrations | oui | Deux routes (lecture, dépôt de demande) |
| Architecture technique | oui | Frontière application → hôte, worktree, systemd, format d'état |
| Sécurité et conformité | oui | L'application déclenche une action sur l'hôte ; contrôle d'accès, entrées non fiables |
| Déploiement et compatibilité | oui | Script qui se remplace, premier passage à la 1.9, retours vers d'anciens commits |
| Exploitation | oui | Journaux, installation des unités, pannes (Docker muet, verrou, unité arrêtée) |
| Données | non | Aucune donnée de candidat ; l'état est un fichier technique décrit dans Architecture |
| Valeur et business, Mesure, Contenu, Accessibilité, Design system, Performance | non | Outil interne d'exploitation, mêmes composants que la page des sauvegardes ; volumes faibles (30 passages) |

## Jury
| Challenger | Initiale | Pourquoi | Grille (3 à 5 critères) |
|---|---|---|---|
| Sécurité frontière | S | L'application déclenche un déploiement sur l'hôte | Ce que l'application peut obtenir de l'hôte · Validation des demandes (forme et sens) · Contrôle d'accès et intersite · Entrées non fiables affichées (sorties, messages de commit) |
| Exploitation systemd | X | Unités, verrous, journaux, pannes | Unités et installation · Verrous et attente · Comportement quand Docker ou le réseau manquent · Journaux et diagnostic |
| Déploiement et retour arrière | D | Profil technique obligatoire ; script qui se remplace | Isolement des tests (worktree, images) · Retour automatique · Pause et commits anciens · Tableau « script qui se remplace » |
| Testabilité | T | Règles nombreuses, concurrence | Critères vérifiables · Scénarios de concurrence · Mutations possibles · Banc reproductible |
| Utilisateur admin | U | Interface obligatoire | Compréhension de l'état en un coup d'œil · Boutons et confirmations · Cas réels (attente, échec, refus) · Confiance (ce qui va se passer) |
| Arbitre | — | Toujours présent | Juge la recevabilité des retours |

## Décisions demandées à l'utilisateur
- Niveau : complexe (recommandé) — **complexe**.
- Base : `main` ou empiler sur `version/1.5-guide-deploiement-ovh` — **main**.
- Déploiement KO pendant un passage — **retour automatique** au commit précédent, commit noté en échec, pas de pause.
- Demande visant un commit antérieur à la 1.9 — **refusée** et enregistrée.
- Intersite : aucune question (V10, la protection existante tient).
