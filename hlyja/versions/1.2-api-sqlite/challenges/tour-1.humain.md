---
type: challenge
vue: humaine
version: 1.2
tour: 1
score: 74
decision: nouveau-tour
---

# Tour 1 : solide sur le fond, des trous dans l'effacement et les cas d'échec

> Score de 74 sur 100 : il faut un second tour. Deux membres du jury sont sous 70 (technique et exploitation), à cause de cas d'échec non prévus.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Technique | Les écritures doivent attendre leur tour plutôt qu'échouer tout de suite, et l'API doit vraiment refuser ce qui n'est pas du JSON | important |
| Développeur intégrateur | Deux « versions » portent le même nom, et un dossier supprimé par un collègue doit donner un conflit, comme le prévoyait le pitch | important |
| Sécurité | Le mode local doit rester verrouillé, même si une variable traîne | détail |
| Données personnelles | Supprimer un dossier ne l'effaçait pas vraiment du disque, et le journal gardait tout son parcours | important |
| Exploitation | L'administrateur doit voir quelle base il modifie, et l'API doit refuser les réglages absurdes | important |

## Ce que l'arbitre a écarté
10 retours sur 46 : six doublons, trois points qui relèvent du code plutôt que de la spec, et un qui concerne l'adaptateur de la version suivante. Il a signalé un conflit (d'où partent les chemins relatifs) et un choix qui revenait à l'utilisateur : que garder du journal après une suppression.

## Ce qui change dans la spec
- Supprimer un dossier l'efface aussi du disque, et le journal n'en garde qu'une ligne « suppression » (choix de l'utilisateur).
- Toute écriture attend son tour, jusqu'à 5 secondes, et l'installation de la base est mise à l'épreuve par une panne provoquée puis une relance.
- L'API ne renvoie plus que trois champs par dossier : son identifiant, sa version et son contenu, sans l'email de l'auteur.
- Au démarrage, l'API affiche ses vrais réglages, et `equipe.js` affiche la base qu'il modifie.
- Le mode local refuse de démarrer dès qu'on n'est pas sur la machine ou qu'on est en production.

## Ce qui est refusé, et pourquoi
- Faire vérifier par `equipe.js` le propriétaire des fichiers : le mode d'emploi et l'affichage de la base suffisent, l'idée va au backlog.
- Refuser `.git` et `.env` dans le site servi en local : le refus de servir la base suffit à cette version, l'idée va au backlog.

## Pourquoi le score bouge
Premier tour.
