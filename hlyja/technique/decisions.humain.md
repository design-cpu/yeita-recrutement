---
type: technique
vue: humaine
page: decisions
titre: Décisions techniques
---

# Décisions techniques

> Les grands choix du dépôt et ce qu'ils écartent. En v1.1 : le site est hébergé chez Yeita, derrière une connexion Google @yeita.fr, et ne fait pas confiance aux en-têtes envoyés par les proxys.

## En un coup d'œil

| Décision | En clair | Depuis |
|---|---|---|
| Stockage et connexion | SQLite chez Yeita, connexion Google @yeita.fr | v1.0 |
| Retrait du code Supabase | La piste abandonnée sort du dépôt | v1.0 |
| Source de vérité | On modifie le dépôt, plus l'artefact Claude | v1.0 |
| Hébergement chez Yeita | Docker sur le serveur OVH, derrière oauth2-proxy | v1.1 |
| Pas de confiance dans les en-têtes de proxy | Fermer une porte dérobée vers les pages protégées | v1.1 |
| `/index.html` servi directement | Pas de redirection vers `/` | v1.1 |

## Où vivront les données

Le choix de v1.0 : une base SQLite sur le serveur OVH, et une connexion par compte Google réservée aux adresses @yeita.fr.

Depuis la v1.1, la connexion est en place. Le stockage SQLite, lui, reste à faire. En attendant, tout vit dans le navigateur, avec des données inventées. Les pages n'auront pas à changer : elles passent par un seul point d'entrée, le dossier candidat.

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

## Voir aussi
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)
- Le détail de chaque décision (contexte, options écartées, conséquences) est dans la version complète.
