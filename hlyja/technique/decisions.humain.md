---
type: technique
vue: humaine
page: decisions
titre: Décisions techniques
maj: 1.3
commit: 6cd5776
sources: assets/demarrage.js, assets/adapter-serveur.js, assets/dossier.js, candidatures/index.html, docker/api.Dockerfile, api/src/app.js, api/src/base.js, api/src/candidats.js, api/src/config.js, api/package-lock.json, docs/backend/MODELE.md, CONTRIBUER.md, docker/front.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/deploy.sh
date: 2026-10-26
---

# Décisions techniques

> Les grands choix du dépôt et ce qu'ils écartent. En v1.1, le site est hébergé chez Yeita derrière une connexion Google. En v1.2, une API garde les dossiers dans SQLite. En v1.3, les pages l'utilisent, sans jamais basculer en silence dans le navigateur en production.

## En un coup d'œil

| Décision | En clair | Depuis |
|---|---|---|
| Stockage et connexion | SQLite chez Yeita, connexion Google @yeita.fr — réalisé en v1.3 | v1.0 |
| Retrait du code Supabase | La piste abandonnée sort du dépôt | v1.0 |
| Source de vérité | On modifie le dépôt, plus l'artefact Claude | v1.0 |
| Hébergement chez Yeita | Docker sur le serveur OVH, derrière oauth2-proxy | v1.1 |
| Pas de confiance dans les en-têtes de proxy | Fermer une porte dérobée vers les pages protégées | v1.1 |
| `/index.html` servi directement | Pas de redirection vers `/` | v1.1 |
| API de stockage | Un serveur Node.js garde chaque dossier entier dans SQLite | v1.2 |
| Confiance dans l'email transmis | L'API croit oauth2-proxy ; personne d'autre ne doit la joindre | v1.2 |
| Version optimiste | Un enregistrement fait sur une version dépassée est refusé | v1.2 |
| Effacement réel | Un dossier supprimé ne reste pas lisible dans les fichiers | v1.2 |
| Dépendances très récentes | Une exception acceptée pour éviter des failles connues | v1.2 |
| Choix du mode des pages | Navigateur seulement sans API hors production ; sinon bloqué avec un message | v1.3 |
| Versions et file par dossier | Un recruteur seul ne se met pas en conflit avec lui-même | v1.3 |
| Fiches qui écrivent leur partie | Deux fiches d'un même candidat s'ouvrent ensemble | v1.3 |
| Réseau interne sans adresse sur le serveur | Seul oauth2-proxy joint l'API | v1.3 |
| Image Node figée | Une version précise, avec son correctif de sécurité | v1.3 |
| « Remplacer tout » masqué | En mode serveur, seule la fusion est proposée | v1.3 |

Les décisions de v1.0 à v1.2 sont expliquées dans la version complète. Voici celles de v1.3.

## Ne jamais basculer en silence

À la lettre, le pitch passait dans le navigateur dès que l'API ne répondait pas « oui ». Un essai a montré le danger : une API arrêtée ou une session expirée auraient fait travailler les recruteurs dans leur navigateur, sans le savoir, en production.

| Situation | Choix retenu |
|---|---|
| Pas d'API, hors production, ou page ouverte depuis un fichier | mode navigateur, comme avant |
| Session expirée | un rechargement, avec une garde contre la boucle |
| Tout le reste en production | mode bloqué, avec un bandeau |

> Conséquence : un oauth2-proxy mal réglé bloque les pages au lieu de les faire basculer. Les tests et les aperçus restent en mode navigateur.

## Ne pas se mettre en conflit avec soi-même

Les pages enregistrent toutes les 300 à 400 ms, et certaines gardent un dossier lu à l'ouverture. Garder une seule version par dossier aurait laissé un vieil objet écraser un enregistrement récent. Les pages retiennent donc la version de chaque objet lu, et envoient les enregistrements d'un même dossier un par un. Elles ne réessaient jamais seules.

## Laisser chaque fiche écrire sa partie

La fiche EC1 et la feuille de décompte d'un candidat sont faites pour être ouvertes ensemble. Chacune écrivait le dossier entier lu à l'ouverture : elles se seraient refusées l'une l'autre. Désormais, chacune relit le dossier, vérifie que sa partie n'a pas changé ailleurs, la pose et écrit.

> Risque accepté : en quittant la page juste après avoir tapé, les dernières frappes peuvent se perdre si un collègue a enregistré le même dossier juste avant.

## Fermer l'API au serveur lui-même

Sur Linux, un réseau Docker « interne » reste joignable depuis le serveur par l'adresse du conteneur. Or l'API croit l'email qu'on lui transmet. Le réseau de l'API n'a donc ni adresse sur le serveur, ni IPv6, et aucun port n'est publié. Un contrôle du réseau est fait avant d'ajouter le premier admin.

## Figer l'image Node

La version récente de Node 22 apporte un correctif de sécurité, mais a moins de 14 jours. L'utilisateur a accepté l'exception : l'image est figée par son empreinte, et ne change que par une décision explicite.

## Masquer « Remplacer tout »

En mode serveur, « Remplacer tout » effacerait les dossiers de toute l'équipe absents du fichier, sans sauvegarde. Seule la fusion reste proposée (choix de l'utilisateur). Une fusion d'un vieil export peut toutefois faire revenir un dossier supprimé.

## Voir aussi
- [Comment les pages choisissent où ranger les dossiers](mode-serveur.md)
- [L'API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)
- Le détail de chaque décision (contexte, options écartées, conséquences) est dans la version complète.
