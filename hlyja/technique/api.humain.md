---
type: technique
vue: humaine
page: api
titre: API de stockage (api/)
maj: 1.9
commit: 5e41a2d
sources: api/server.js, api/equipe.js, api/sauvegarde.js, api/src/app.js, api/src/base.js, api/src/candidats.js, api/src/config.js, api/src/options.js, api/src/routes.js, api/src/valeurs.js, api/package.json, api/.npmrc, api/README.md, api/src/sauvegardes.js, api/src/deploiement.js
date: 2026-10-28
---


# L'API de stockage

> Un petit serveur garde les dossiers candidat dans une base SQLite partagée et ne répond qu'aux membres de l'équipe. Arrivée en v1.2, elle est en service depuis la v1.3, dans Docker, derrière oauth2-proxy. Depuis la v1.7, une commande en fait chaque nuit une copie vérifiée, et une route réservée aux admins dit où en sont les sauvegardes. Depuis la v1.9, deux routes admin servent la page des déploiements : lire l'état, déposer une demande.

## En un coup d'œil

```mermaid
flowchart LR
  N[Pages] -->|cookie de session| P[oauth2-proxy]
  P -->|réseau interne, email du compte| A[API]
  A --> D[(Base SQLite)]
  C[Commande équipe] --> D
  S[Commande sauvegarde] -->|lecture seule| D
  S --> K[Copie vérifiée]
  E[(État des sauvegardes et du déploiement)] -->|lu par les routes admin| A
  A -->|dépose| Q[(Demande de déploiement)]
```

oauth2-proxy vérifie la connexion Google, puis transmet la demande avec l'email du compte. L'API regarde si cet email fait partie de l'équipe, puis lit ou écrit dans la base. Deux commandes, lancées dans le conteneur, ouvrent la base à côté : l'une gère l'équipe, l'autre copie la base.

## Les éléments principaux

### Ce que l'API sait faire, et qui s'en sert
| Demande | Ce qu'elle fait | Qui l'appelle |
|---|---|---|
| Qui suis-je | rend l'email, le prénom et le rôle du compte | le démarrage de chaque page |
| L'équipe | rend les prénoms et rôles des membres actifs | le démarrage (champ Recruteurs) |
| Options de disponibilité | liste ou ajoute une option | le démarrage, puis l'ajout d'une option |
| Dossiers | liste, lit, enregistre, supprime | l'adaptateur serveur des pages |
| État des sauvegardes (v1.7) | rend la dernière tentative, la dernière réussite et la mesure des disques | la page d'état, admins seulement |
| État du déploiement (v1.9) | rend ce que le serveur a écrit (en ligne, pause, passages) et la demande en attente | la page des déploiements, admins seulement |
| Demande de déploiement (v1.9) | dépose « déployer `main` », « déployer ce commit » ou « reprendre » | la page des déploiements, admins seulement |
| État de santé | dit si la base répond | la sonde de Docker, dans le conteneur |

Le dossier est gardé entier, tel que les pages le fabriquent.

### Qui a le droit

```mermaid
flowchart LR
  A[Demande] --> B{Email valide ?}
  B -- non --> X[Refus : identité]
  B -- oui --> C{Membre actif ?}
  C -- non --> Y[Refus : hors équipe]
  C -- oui --> D{Lecteur qui modifie ?}
  D -- oui --> Z[Refus : lecture seule]
  D -- non --> E[Demande traitée]
```

Il y a trois rôles : recruteur, admin et lecture. L'équipe est relue à chaque demande : un membre désactivé perd l'accès dès sa demande suivante. Les routes d'administration (sauvegardes, et depuis la v1.9 déploiement) ajoutent un contrôle commun : un compte qui n'est pas admin reçoit « Réservé aux admins de l'équipe. ».

### Deux personnes sur le même dossier
Chaque dossier porte un numéro de version, qui augmente à chaque enregistrement. Pour enregistrer, il faut donner le numéro qu'on a lu. S'il a changé entre-temps, ou si le dossier a été supprimé, l'API refuse : « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. »

### Ce que la base garde
| Table | Contenu |
|---|---|
| Dossiers | chaque dossier entier, sa version, la date et l'auteur du dernier enregistrement |
| Journal | qui a fait quoi sur quel dossier, quand ; jamais le contenu |
| Équipe | email, prénom, rôle, actif ou non |
| Options de disponibilité | seulement celles ajoutées |

Une suppression efface vraiment : le contenu ne reste pas lisible dans les fichiers de la base. Il reste en revanche dans les sauvegardes faites avant : 3 jours au plus dans la copie de travail, 31 jours au plus dans les copies chiffrées du serveur.

### Gérer l'équipe
On gère l'équipe par une commande, pas par le site. Sur le serveur, elle passe par le conteneur de l'API :

```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin
```

La même commande liste l'équipe (`list`), désactive un membre (`disable`) ou change son rôle (`role`).

### Copier la base (v1.7)
La commande de sauvegarde fait une copie cohérente, même pendant que l'équipe enregistre. Elle ne garde la base ouverte que le temps de la copie : l'effacement réel n'est pas retardé.

```mermaid
flowchart LR
  A[Copie sous un nom provisoire] --> B{Copie intacte ?}
  B -- oui --> C[Un seul fichier, nom du jour]
  B -- non --> D[Rien n'est gardé, erreur]
```

| Ce qu'elle garantit | En clair |
|---|---|
| Un nom définitif = une copie vérifiée | une copie abîmée n'est jamais gardée |
| Un seul fichier | la copie s'ouvre seule, sans fichiers annexes |
| Lisible par son seul propriétaire | comme la base elle-même |
| Ménage sur demande | avec `--nettoyer`, les copies de plus de 2 jours partent, jamais celle qui vient d'être faite |

Chaque nuit, le script de sauvegarde du serveur la lance ainsi, puis récupère et chiffre la copie :

```bash
docker compose exec -T api node api/sauvegarde.js --nettoyer
```

La dernière ligne affichée est le chemin de la copie : le script de sauvegarde s'en sert, il ne faut pas en changer la forme.

### L'état des sauvegardes (v1.7)
Les scripts du serveur écrivent trois petits fichiers à côté de la base, dans `etat/`. La route les rend tels quels, avec deux drapeaux « en retard ».

| Ce que rend la route | Quand c'est « en retard » | Si le fichier manque ou est abîmé |
|---|---|---|
| Dernière tentative et dernière réussite | réussite de plus de 26 h, sans date, ou datée dans le futur | vide, ou marqué « illisible » |
| Mesure des disques | mesure de plus de 2 h, sans date, ou datée dans le futur | vide, ou marqué « illisible » |

La route ne fait que lire : elle n'écrit rien et ne touche pas aux dossiers. La page `admin/sauvegardes.html` en tire son verdict vert ou rouge.

### Le déploiement automatique (v1.9)
L'API ne lance jamais de commande. Pour la page des déploiements, elle fait deux choses seulement.

```mermaid
sequenceDiagram
  participant P as Page
  participant A as API
  participant S as Serveur
  P->>A: demande (admin)
  A->>A: écrit la demande sous un nom provisoire, puis la renomme
  A-->>P: 202, demande enregistrée
  S->>S: prend la demande, la vérifie, agit
  S->>A: écrit l'état (fichier du volume)
  P->>A: lire l'état
  A-->>P: état et demande en attente
```

| Ce qu'elle garantit | En clair |
|---|---|
| Une forme stricte | seulement « déployer » avec `main` ou un hash, ou « reprendre » ; sinon 400 |
| L'auteur est le compte connecté | l'email vient de la connexion, jamais de ce que la page envoie |
| Pas de doublon | la même demande déjà en attente n'est pas réécrite |
| Jamais une demande à moitié écrite | nom provisoire, puis renommage ; fichier lisible par son seul propriétaire |
| Écriture impossible | 503, « Le serveur n'a pas pu enregistrer la demande. » |

Pour afficher la demande en attente, l'API la relit avec les mêmes règles que le serveur. C'est le serveur, et lui seul, qui vérifie que le commit demandé est admis.

### Lancer l'API sur son poste
Le mode local permet d'essayer l'API sans oauth2-proxy. On dit à l'API quel membre on est ; elle peut aussi servir le site construit.

```bash
cd api && npm ci
node equipe.js add moi@yeita.fr Moi admin
DEV_EMAIL=moi@yeita.fr npm start
```

## À savoir avant de modifier

- **L'API croit l'email que lui transmet oauth2-proxy.** Elle n'est donc reliée qu'à lui, par un réseau interne, sans aucun port publié.
- **Le mode local est verrouillé.** L'image de production le refuse, et l'API s'arrête si on tente de l'activer.
- **Les réponses comptent pour les pages.** Changer un code ou un message change ce que voit le recruteur, ou ce qu'affiche la page d'état.
- **Une écriture à la fois.** Si la base est occupée plus de 5 secondes, l'API demande de réessayer.
- **Ne jamais copier la base autrement.** Copier ses fichiers à chaud, ou la lire longtemps avec un autre outil, retarde l'effacement des dossiers supprimés.
- **Les dossiers `etat/` et `demandes/` suivent le chemin de la base**, mais les scripts du serveur utilisent toujours `/data/etat` et `/data/demandes` : les changer ensemble.
- **Le format de la demande est partagé avec le serveur.** Ses quatre lignes `clé=valeur` sont lues aussi par `deploy/auto-deploy.sh` : les changer ensemble, et rester lisible par celui de la v1.9.
- **Les tests** : `cd api && npm test` (65 tests, une vingtaine de secondes, dont la commande de sauvegarde et les routes d'administration).

## Voir aussi
- [Comment les pages choisissent où ranger les dossiers](mode-serveur.md)
- [Architecture et déploiement](architecture.md)
- [Décisions techniques](decisions.md)
- [Conventions et tests](conventions.md)
- [Le déploiement automatique](deploiement-automatique.md)
- Le mode d'emploi complet et le contrat de chaque demande : `api/README.md`
- Le détail des routes, des messages, des réglages et des tables est dans la version complète.
