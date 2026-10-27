---
type: technique
vue: humaine
page: architecture
titre: Architecture et déploiement
maj: 1.7
commit: 26c1d9f
sources: api/server.js, api/package.json, deploy/README.md, assets/config.js, docker/front.Dockerfile, docker/api.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/Caddyfile, deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/backup.sh, deploy/verif-disque.sh, deploy/healthchecks.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, tools/check-site.sh, tools/build.py, .env.example, .dockerignore
date: 2026-10-27
---

# Architecture et déploiement

> Le site tourne dans Docker sur le serveur OVH de Yeita, derrière une connexion Google @yeita.fr. L'API de stockage tourne à côté, dans son propre conteneur, et seul oauth2-proxy peut lui parler. Depuis la v1.7, la base est sauvegardée chaque nuit, chiffrée, hors du serveur.

## En un coup d'œil

```mermaid
flowchart LR
  N[Navigateur] -->|HTTPS| P[Proxy du serveur ou Caddy du projet]
  P --> F[oauth2-proxy]
  F -->|page publique ou compte @yeita.fr| S[Fichiers du site]
  F -->|/api/ avec session| A[API]
  A --> V[(Volume : la base)]
  F -->|sinon| G[Connexion Google]
```

Le visiteur arrive en HTTPS sur `recrutement.yeita.fr`. oauth2-proxy joue le gardien : il sert les pages, ou envoie se connecter chez Google. Pour une adresse en `/api/`, il transmet la demande à l'API avec l'email du compte. Sans session, il répond un refus au lieu d'une redirection.

## Les éléments principaux

### Deux images
| Image | Ce qu'elle contient | Depuis |
|---|---|---|
| Site (`front`) | le site construit par Python, servi par oauth2-proxy lui-même | v1.1 |
| API (`api`) | l'API en Node.js 22, sur une image figée à une version précise | v1.3 |

L'image de l'API ne tourne pas en administrateur. Elle se dit saine seulement si la base répond et si son dossier de données accepte l'écriture. Sinon, Docker la signale malade et le déploiement s'arrête.

### Trois conteneurs, deux réseaux
| Conteneur | Réseaux | Ports sur le serveur |
|---|---|---|
| oauth2-proxy | public et interne | 4180, sur la machine elle-même |
| API | interne seul | aucun |
| Caddy (cas B) | public seul | 80 et 443 |

Le réseau interne n'a ni sortie vers Internet, ni adresse sur le serveur lui-même. Même un programme du serveur ne peut pas joindre l'API directement. C'est essentiel : l'API croit l'email que lui transmet oauth2-proxy.

### La base dans un volume
La base SQLite vit dans le volume `recrutement_data`. Il survit aux arrêts, aux mises à jour et aux retours en arrière. Les seules autres copies sont les sauvegardes chiffrées.

> Jamais `docker compose down -v` ni `docker volume prune` sur le serveur : la base partirait avec.

### La sauvegarde de chaque nuit (v1.7)

```mermaid
flowchart LR
  T[Vers 3 h] --> C[Copie vérifiée dans le conteneur]
  C --> R[Récupérée sur le serveur]
  R --> K[Chiffrée avec age]
  K --> O[Envoyée chez OVH]
  O --> H[Contrôle healthchecks.io au vert]
  C & R & K & O -. échec .-> E[Alerte par email]
```

Un timer systemd lance la sauvegarde chaque nuit, entre 3 h et 3 h 15, sous le compte `deploy`. La copie en clair ne reste jamais sur le serveur : elle est supprimée dès qu'elle est chiffrée, et aussi en cas d'échec ou d'arrêt forcé. Le serveur ne connaît que la clé publique : il peut chiffrer, pas relire.

| Où | Ce qui est gardé | Combien de temps |
|---|---|---|
| Dans le volume, à côté de la base | la copie de travail, en clair | 2 jours (3 au plus) |
| Sur le serveur (`/var/backups/recrutement`) | les copies chiffrées | 30 jours, effacées seulement après un envoi réussi |
| Chez OVH Object Storage (Europe) | les copies chiffrées | 30 jours, effacées par OVH lui-même |

Un second timer mesure le disque toutes les heures. Au-delà de 80 % sur le disque du système ou sur celui de Docker, une alerte part. Chaque tâche a son propre contrôle healthchecks.io : un contrôle qui ne reçoit plus de nouvelles alerte aussi.

### Cas A ou cas B
| Situation sur le serveur | Cas | Qui gère le HTTPS |
|---|---|---|
| Un proxy occupe déjà les ports web | A | le proxy existant |
| Rien sur les ports web | B | le Caddy du projet |
| Proxy dans Docker ou inconnu | — | rien n'est touché : le responsable du serveur décide |

### Les scripts
| Script | Qui le lance | À quoi il sert |
|---|---|---|
| Préparation du serveur | l'administrateur, une fois | crée l'utilisateur `deploy`, clone le dépôt, sans rien installer ; depuis la v1.7, vérifie aussi qu'age et rclone sont là |
| Déploiement | `deploy`, à chaque mise à jour | met le serveur à jour, attend que le site puis l'API soient prêts, ou revient en arrière |
| Sauvegarde (v1.7) | le timer de la nuit, ou `deploy` à la main | copie, chiffre, envoie, fait le ménage, signale le résultat |
| Contrôle du disque (v1.7) | le timer horaire | alerte au-delà de 80 % |
| Contrôle du site | tout le monde | vérifie 6 adresses, dont l'API refusée sans connexion |

Le déploiement n'attend l'API que si la version déployée en a une : un retour vers une version plus ancienne réussit sans elle, et le volume reste. Une sauvegarde et un déploiement ne se chevauchent jamais : la sauvegarde attend jusqu'à 10 minutes la fin d'un déploiement.

### Où ça tourne
| Endroit | Adresse | Pour quoi |
|---|---|---|
| Serveur OVH | `https://recrutement.yeita.fr` | la production, en mode serveur |
| Poste, avec Docker | `https://localhost` | la pile complète, API comprise |
| Poste, API et site sans Docker | `http://127.0.0.1:8000/candidatures/` | essayer le mode serveur, identité choisie au lancement |
| Poste, site seul | `http://localhost:8765` | les tests de navigateur, en mode navigateur |

## À savoir avant de modifier

- **Ne jamais publier de port pour l'API.** Elle ne doit rester joignable que par oauth2-proxy.
- **Ne pas toucher au réseau interne sans refaire les essais.** Ses réglages empêchent le serveur de joindre l'API ; ils ont été vérifiés sur la version de Docker du serveur.
- **Ne toucher qu'au projet.** Le serveur est partagé : le nettoyage ne vise que les images du projet, et les unités systemd portent le préfixe `recrutement-`.
- **Ajouter une page publique, c'est modifier la liste** dans la configuration d'oauth2-proxy.
- **Le dépôt du serveur doit rester propre.** Un fichier en trop entrerait dans l'image : le déploiement refuse de partir.
- **Une unité systemd changée n'est jamais écrasée** par la commande d'installation : elle affiche la différence, et l'administrateur décide.
- **La clé privée de sauvegarde ne va jamais sur le serveur.** Sans elle, les copies sont illisibles : elle est au coffre, connue d'au moins deux personnes.
- **La première mise en service de l'API et celle des sauvegardes** suivent chacune une procédure à part (`deploy/README.md`).

## Voir aussi
- [Comment les pages choisissent où ranger les dossiers](mode-serveur.md)
- [L'API de stockage](api.md)
- [Décisions techniques](decisions.md)
- [Conventions et tests](conventions.md)
- [Déployer sur OVH, pas à pas](deploiement-ovh.md)
- [Lancer le site avec Docker sur ton poste](docker-local.md)
- Le mode d'emploi du serveur : `deploy/README.md` ; restaurer la base : `deploy/RESTAURER.md`
- Le détail (réglages, versions exactes, garde-fous de chaque script) est dans la version complète.
