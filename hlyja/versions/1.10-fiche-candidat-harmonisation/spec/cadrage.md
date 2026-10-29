---
type: cadrage
version: 1.10
mode: complexe
type_version: livrable
sujet: reprise-fonctionnalite-metier
modules: UX/UI, Accessibilité, Données, API et intégrations, Sécurité et conformité, Déploiement et compatibilité
challengers: Lead dev, Sécurité et données personnelles, Ops et déploiement, Testabilité et concurrence, Utilisateur recruteur
date: 2026-10-28
---

# Cadrage — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> Mode complexe, version livrable. La spec couvre 6 modules en plus du socle ; 5 challengers + l'arbitre.
> Particularité : le code existe (branche de Léo, 2 commits rejoués sur `main`). La spec **décrit ce que la branche doit faire** à partir de sa description, et fixe les corrections nécessaires pour la rendre juste et déployable. Les choix d'interface de Léo ne sont pas rediscutés ; ils ne sont corrigés que s'ils sont cassés.
> Ce qui compte : un CV déposé n'est jamais perdu ni orphelin, il est vraiment effacé avec le candidat, et la mise en production (déploiement automatique 1.9, retour arrière, sauvegardes 1.7, nginx cas A) marche du premier coup.

## Nature du sujet
L'espace Candidatures gagne une fenêtre unique « Fiche du candidat » (création et consultation), le dépôt de CV et de portfolio en fichier (PDF, PNG, JPG, 10 Mo) gardés dans la base SQLite, et une harmonisation des pages d'étapes. Le code a été écrit avant les versions 1.7 (sauvegardes), 1.8 et 1.9 (déploiement automatique) de `main`. Le risque principal est l'écart entre ce code et la production d'aujourd'hui : migration irréversible pour la 1.9, limite de nginx, cohérence entre le dépôt d'un fichier et l'enregistrement du dossier.

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | nouvelle table, nouvelles routes d'API, données personnelles (CV), migration de la base de production, parcours de création changé ; recommandé et confirmé par l'utilisateur (2026-10-28) |
| Type | livrable | l'utilisateur veut la faire passer en production |

## Périmètre
### Ce que le pitch demande
- Rejouer la branche `feat/fiche-candidat-harmonisation` sur `main` dans une nouvelle version (fait : `version/1.10-fiche-candidat-harmonisation`, numéros 1.7 → 1.10).
- Lister ce qui va et ce qui ne va pas (inventaire ci-dessous, puis bilan).
- Faire fonctionner tout ce que décrit la branche (liste du pitch dans `version.md`) et corriger ce qui ne va pas.
- La rendre déployable : déploiement automatique 1.9 et son retour automatique, sauvegardes et restauration 1.7, nginx de production (cas A).
- Écrire les tests manquants et la documentation hlyja.

### Hors périmètre
- Rediscuter les choix d'interface de Léo (sélecteur d'État retiré des étapes, largeur 1120 px, initiales sur le kanban, retrait de « Copier pour Notion » et « Vider la fiche ») : décidés par Léo, corrigés seulement s'ils sont cassés.
- Purge automatique à 22 mois : 1.10-2. Onboarding hors du funnel : 1.10-1. Tests « départ de la page » instables : 1.10-3. Contact RGPD : 1.6-2.
- Stockage des fichiers hors SQLite, antivirus, aperçu des fichiers dans la page, fichiers en mode navigateur (sans API).
- Changer `user_version` de la base (décision de l'utilisateur : la table s'ajoute sans changer la version).
- Toute action sur le serveur réel : le réglage nginx est une étape du guide, appliquée par Sofiane ou Léo.
- Le dossier `Claude outputs/` (publié par `tools/build.py`, existait avant la branche) : candidat au backlog.

## Inventaire : ce qui va, ce qui ne va pas (avant correction)
Constats de l'orchestrateur, prouvés dans `verifications.md`.

### Ce qui va
| Point | Preuve |
|---|---|
| Rejeu sur `main` : 4 conflits, tous dans la doc hlyja, aucun dans le code | V1 |
| Suites existantes au vert sur la branche rejouée : `npm test` 73/73 (Node 22 et 26), `test-store`, `test-serveur` (87) | V2, V3 |
| Routes des fichiers : 10 Mo pile accepté, 10 Mo + 1 → 413 `fichier-trop-gros` ; dossiers toujours à 1 Mo ; type vérifié aux premiers octets ; rôle lecture refusé en écriture, y compris par une forme d'adresse encodée | V5, V6 |
| Effacement réel : repère absent des fichiers bruts (base, WAL) après retrait d'un fichier et après suppression du candidat (`secure_delete`, point de contrôle) | V7 |
| Sauvegardes 1.7 : les fichiers sont dans la base, donc dans chaque copie, sans changer `backup.sh` | V8 |
| oauth2-proxy v7.15.5 laisse passer 10 Mo (aucune limite de corps) et écrase `X-Forwarded-Email` | V10 |
| Aucune dépendance ajoutée | V12 |

### Ce qui ne va pas
| # | Problème | Gravité | Preuve |
|---|---|---|---|
| P1 | Après la migration (`user_version` 2), l'API de la 1.9 refuse la base : le retour automatique de la 1.9 et tout retour arrière échouent | bloquant (déploiement) | V4 |
| P2 | nginx de production (cas A) refuse tout corps de plus de 1 Mo : en production, aucun CV de plus de 1 Mo ne passerait ; l'exemple nginx de `deploy/README.md` n'a pas `client_max_body_size` | bloquant (production) | V9, V11 |
| P3 | Le 413 de nginx est une page HTML : l'adaptateur l'affiche comme un problème de réseau | majeur | V9, V13 |
| P4 | Création : le candidat est créé avant l'envoi des fichiers ; si un envoi échoue, l'erreur s'affiche, le bouton se réactive, et un nouveau clic crée un **second** candidat | majeur | V14 (reproduit) |
| P5 | Dépôt et retrait : le fichier est envoyé (ou l'ancien retiré) **avant** l'enregistrement du dossier ; si l'enregistrement échoue (conflit 409, réseau), le fichier reste en base sans être référencé, ou le dossier référence un fichier retiré | majeur | V14 (orphelin reproduit) |
| P6 | Coller un lien à la place d'un fichier : le fichier est retiré de l'API tout de suite, le dossier n'est enregistré qu'après (enregistrement différé) ; si cet enregistrement échoue, le dossier pointe vers un fichier qui n'existe plus (« Ouvrir » → 404) | majeur | V14 (lecture du code) |
| P7 | Aucun fichier orphelin n'est jamais nettoyé côté serveur (un fichier non référencé reste jusqu'à la suppression du candidat) | majeur (RGPD) | V14 |
| P8 | La description de la branche est en partie périmée : « noms complets partout, seul Léo Fuster renseigné » alors que le 2e commit vide `equipeNoms` (prénoms) ; « tracés dans l'historique » = historique du dossier côté client, pas le journal du serveur | mineur | V15 |
| P9 | `Claude outputs/` est publié avec le site (derrière la connexion Google) | mineur, hors périmètre | V16 |
| P11 | `e2e-serveur` : un contrôle « départ de la page » échoue (1.10-3, instable) | mineur, hors périmètre | V3 |
| P10 | Doc hlyja de la branche écrite pour une 1.7 parallèle : numéros, compteurs de tests (60), `user_version` 2 | mineur | V1 |

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Ouverture et évolution de la base | `ouvrirBase`, `appliquerSchema` (`api/src/base.js`) | étendre (ajout idempotent de la table, sans changer `user_version`) | [API](../../../technique/api.md) |
| Effacement réel | `secure_delete`, `pointDeControle` (`api/src/candidats.js`) | réutiliser | [API](../../../technique/api.md) |
| Erreurs client | `ErreurHttp`, gestionnaire d'erreurs (`api/src/app.js`) | réutiliser | [API](../../../technique/api.md) |
| Appels à l'API depuis les pages | `AdaptateurServeur` (`assets/adapter-serveur.js`), `lire`, `MESSAGE_CODE` | étendre (413 non JSON, codes des fichiers) | [Mode serveur](../../../technique/mode-serveur.md) |
| Enregistrement du dossier | `S.saveCandidate`, `S.createCandidate` (`assets/store.js`) | réutiliser | [Mode serveur](../../../technique/mode-serveur.md) |
| Tests | `node:test` + `api/test/aide.js` ; `tools/test-serveur.js` (fausse API) ; `tools/e2e-*.py` (Playwright) | étendre | [Conventions](../../../technique/conventions.md) |
| Sauvegarde et restauration | `api/sauvegarde.js`, `deploy/backup.sh`, `deploy/RESTAURER.md` | réutiliser ; `RESTAURER.md` à relire | [Architecture](../../../technique/architecture.md) |
| Déploiement | `deploy/auto-deploy.sh`, `deploy/deploy.sh` | réutiliser sans modification | [Déploiement automatique](../../../technique/deploiement-automatique.md) |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Socle | oui | Toujours présent |
| Valeur et business | non | outil interne, pas d'enjeu commercial |
| Mesure du succès | non | rien à mesurer qui change une décision |
| UX / UI | oui | fenêtre de création, champs CV et Portfolio, pages d'étapes |
| Design system | non | pas de nouveaux tokens au-delà de la largeur commune, décidée par Léo |
| Accessibilité | oui | dépôt de fichier au clavier, messages d'erreur annoncés, fenêtre modale |
| Contenu et textes | non | textes fixés par Léo ; seuls les messages d'erreur nouveaux sont dans UX/UI |
| Données | oui | table `fichiers`, ajout sans changer `user_version`, cohérence dossier / fichiers, rétention |
| API et intégrations | oui | 4 routes, codes d'erreur, contrat avec l'adaptateur |
| Architecture technique | non | aucun composant ni dépendance nouveaux ; le choix « fichiers dans SQLite » est fait (décision 1.10) |
| Sécurité et conformité | oui | CV = données personnelles, entrées non fiables, effacement, sauvegardes |
| Performance et fiabilité | non | 10 Mo par fichier, volumes faibles ; la taille des sauvegardes est traitée en Déploiement |
| Déploiement et compatibilité | oui | aller-retour 1.9 ↔ 1.10, nginx, restauration, taille des sauvegardes |
| Exploitation | non | rien de nouveau à surveiller (la vérification du disque de la 1.7 couvre la croissance) |

## Jury
| Challenger | Initiale | Pourquoi | Grille (3 à 5 critères) |
|---|---|---|---|
| Lead dev | T | Profil technique obligatoire | Faisabilité avec l'existant · Données et migration · Contrat de l'API · Testabilité · Maintenabilité |
| Sécurité et données personnelles | S | CV et portfolio, entrées non fiables | Contrôle des entrées (type, taille, nom) · Accès par rôle · Effacement réel et rétention · Exposition (en-têtes, publication) |
| Ops et déploiement | O | Production réelle : 1.9, 1.7, nginx | Aller-retour de versions · Sauvegarde et restauration · Prérequis de mise en production · Guide exécutable |
| Testabilité et concurrence | C | Défauts P4 à P7 côté client | Ordre dépôt / enregistrement · Échecs partiels et relance · Absence d'orphelins et de doublons · Preuves automatisées |
| Utilisateur recruteur | U | Profil utilisateur obligatoire (interface) | Compréhension · Parcours de création et de dépôt · Erreurs et cas réels · Confiance (mon CV est-il bien là ?) |
| Arbitre | — | Toujours présent | Juge la recevabilité des retours |

## Systèmes et shells
Poste des utilisateurs de la doc : macOS, zsh. Serveur : Ubuntu 26.04, bash, nginx (cas A).

## Décisions demandées à l'utilisateur
| Question | Réponse (2026-10-28) |
|---|---|
| Retour arrière après migration | Table `fichiers` ajoutée sans changer `user_version` |
| Réglage nginx de production | Étape du guide de mise en production, appliquée par Sofiane ou Léo |
| Services tiers | Aucun nouveau service tiers (nginx est déjà sur le serveur) |
