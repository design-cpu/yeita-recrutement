---
type: technique
vue: humaine
page: decisions
titre: Décisions techniques
maj: 1.2
commit: 2497be9
sources: api/src/app.js, api/src/base.js, api/src/candidats.js, api/src/config.js, api/package-lock.json, docs/backend/MODELE.md, assets/dossier.js, CONTRIBUER.md, docker/front.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/deploy.sh
date: 2026-10-26
---

# Décisions techniques

> Les grands choix du dépôt et ce qu'ils écartent. En v1.1 : le site est hébergé chez Yeita, derrière une connexion Google @yeita.fr. En v1.2 : une API garde les dossiers dans SQLite, protège contre les écrasements et efface vraiment ce qu'on supprime.

## En un coup d'œil

| Décision | En clair | Depuis |
|---|---|---|
| Stockage et connexion | SQLite chez Yeita, connexion Google @yeita.fr | v1.0 |
| Retrait du code Supabase | La piste abandonnée sort du dépôt | v1.0 |
| Source de vérité | On modifie le dépôt, plus l'artefact Claude | v1.0 |
| Hébergement chez Yeita | Docker sur le serveur OVH, derrière oauth2-proxy | v1.1 |
| Pas de confiance dans les en-têtes de proxy | Fermer une porte dérobée vers les pages protégées | v1.1 |
| `/index.html` servi directement | Pas de redirection vers `/` | v1.1 |
| API de stockage | Un serveur Node.js garde chaque dossier entier dans SQLite | v1.2 |
| Confiance dans l'email transmis | L'API croit oauth2-proxy, et n'écoute que sur la machine elle-même | v1.2 |
| Version optimiste | Un enregistrement fait sur une version dépassée est refusé | v1.2 |
| Effacement réel | Un dossier supprimé ne reste pas lisible dans les fichiers | v1.2 |
| Dépendances très récentes | Une exception acceptée pour éviter des failles connues | v1.2 |

## Où vivront les données

Le choix de v1.0 : une base SQLite sur le serveur OVH, et une connexion par compte Google réservée aux adresses @yeita.fr.

Depuis la v1.1, la connexion est en place. Depuis la v1.2, l'API qui range les dossiers dans SQLite existe aussi. Mais les pages ne l'utilisent pas encore : tout vit toujours dans le navigateur, avec des données inventées. Les pages n'auront pas à changer : elles passent par un seul point d'entrée, le dossier candidat.

## Pourquoi le code Supabase a disparu

Supabase était une autre piste de stockage, abandonnée le 23 octobre 2026. Aucune page ne chargeait son code : il a été retiré en v1.0.

> Rien n'est perdu : l'historique git garde tout. Pour relire l'ancien adaptateur : `git show a86b6f4:assets/adapter-supabase.js`.

## D'où partent les changements

On ne recopie plus les fichiers depuis l'artefact Claude. Le dépôt est la seule référence : une branche par sujet, puis une pull request vers `main`.

## Héberger le site chez Yeita

L'espace Candidatures doit être réservé à l'équipe. GitHub Pages rendait tout public : il est abandonné.

Le site est désormais rangé dans une image Docker avec oauth2-proxy, qui le sert et demande la connexion. Un serveur web séparé a été écarté : une pièce de moins à surveiller. Le HTTPS vient du proxy déjà présent sur le serveur (cas A) ou d'un Caddy apporté par le projet (cas B).

## Ne pas croire les en-têtes du proxy

Le pitch prévoyait de faire confiance aux en-têtes envoyés par les proxys. Un essai a montré qu'un en-tête forgé ouvrait une page protégée sans connexion. L'utilisateur a tranché : oauth2-proxy les ignore.

| Ce qu'on gagne | Ce qu'on perd |
|---|---|
| Aucune page protégée ne s'ouvre par un en-tête forgé | Les journaux montrent l'adresse du proxy, pas celle du visiteur |

> Revenir en arrière exige que chaque proxy devant le site réécrive cet en-tête. Le commentaire dans la configuration d'oauth2-proxy le rappelle.

## Servir `/index.html` sans détour

Le serveur de fichiers d'oauth2-proxy redirigeait `/index.html` vers `/`. À la demande de l'utilisateur, une seconde entrée sert la page directement : `/` et `/index.html` affichent tous deux le guide.

## Une API qui garde le dossier entier

L'API est écrite pour Node.js 22. Elle range chaque dossier tel quel, d'un seul bloc, sans le découper en colonnes. L'ancienne proposition du modèle de données, avec des colonnes et des tables annexes, est abandonnée : plus simple, et rien à resynchroniser quand le dossier évolue.

L'équipe se gère par une commande sur le serveur, pas par le site : moins de surface à protéger.

## Croire l'email transmis par oauth2-proxy

oauth2-proxy ajoute l'email du compte connecté à chaque demande, et retire celui qu'un visiteur aurait forgé. Mais une demande envoyée directement à l'API garde l'email forgé : c'est vérifié.

L'API croit donc l'email, mais seulement parce qu'elle n'écoute que sur la machine elle-même. Si on change cela, elle prévient au démarrage. Le mode local, qui permet de choisir son email, est refusé en production.

> Le port de l'API ne devra jamais être ouvert hors du réseau d'oauth2-proxy. Avec un vrai compte Google, l'email transmis reste à vérifier à la version suivante.

## Ne pas écraser le travail d'un collègue

Deux recruteurs peuvent ouvrir le même dossier. Plutôt que de laisser le dernier enregistrement gagner, l'API refuse celui qui part d'une version dépassée : c'est la version optimiste.

| Avant | Après |
|---|---|
| Le dernier qui enregistre efface le travail de l'autre | Le second reçoit « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. » |

Le même refus s'applique si le dossier a été supprimé entre-temps.

## Effacer pour de bon

Une suppression ordinaire laisse le contenu lisible dans les fichiers de la base : c'est vérifié. L'API écrase donc la place libérée, et vide le fichier de transit après chaque écriture d'un dossier. Le journal du dossier supprimé est vidé aussi, sauf une ligne « suppression » (choix de l'utilisateur).

> Si un autre programme lit la base au même moment (une sauvegarde par exemple), l'effacement peut attendre l'écriture suivante. Le journal du serveur le signale.

## Des dépendances très récentes

La règle du projet : ne pas prendre de bibliothèque publiée depuis moins de 14 jours. Ici, les versions plus anciennes de Fastify et de ses dépendances ont des failles connues. L'utilisateur a accepté l'exception : la vérification de sécurité ne trouve aucune faille.

## Voir aussi
- [L'API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)
- Le détail de chaque décision (contexte, options écartées, conséquences) est dans la version complète.
