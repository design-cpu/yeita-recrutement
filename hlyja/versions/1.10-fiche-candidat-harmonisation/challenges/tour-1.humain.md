---
type: challenge
vue: humaine
version: 1.10
tour: 1
score: 69
decision: nouveau-tour
---

# Tour 1 : l'ordre des enregistrements ne tenait pas après un échec

> 69 sur 100 : nouveau tour. Un défaut bloquant (après un échec, la page pouvait renvoyer un dossier faux), et le membre du jury chargé des pannes et des accès simultanés n'a donné que 33.

## Ce que le jury a pointé
Cinq membres du jury ont relu la première version de la spec, chacun sous un angle.

| Membre du jury | Note | Son point principal | Gravité |
|---|---|---|---|
| Testabilité et concurrence | 33 | La page modifiait le dossier avant de l'enregistrer : après un échec, l'enregistrement suivant renvoyait le changement raté (lien vers un fichier effacé, ou fichier abandonné) | bloquant |
| Testabilité et concurrence | | Le second bouton de la fenêtre restait actif (second candidat possible) ; la relance après création et la fermeture pendant un envoi n'étaient pas définies | important |
| Sécurité et données personnelles | 82 | Un lien collé de type `javascript:` devenait cliquable et pouvait exécuter un script avec la session du recruteur | important |
| Sécurité et données personnelles | | Les fichiers abandonnés n'étaient jamais nettoyés, alors que la spec promettait de corriger ce défaut | important |
| Ops et déploiement | 70 | La restauration échouait sur toute copie d'avant la v1.10 ; le réglage du serveur web n'était pas écrit sous forme d'étapes à suivre | important |
| Ops et déploiement | | Après un retour vers la v1.9, les lignes de dépôt s'affichaient mal et « Annuler le dernier passage » était bloqué, sans que la spec le dise | important |
| Lead dev | 86 | La spec confondait un refus clair du serveur et une coupure réseau : dans le second cas, on pouvait retirer un fichier pourtant enregistré | important |
| Utilisateur recruteur | 72 | La spec parlait de « remplacer » un fichier, alors que l'écran n'offre que « Retirer » puis « Déposer » | important |
| Utilisateur recruteur | | Un fichier qui échoue à chaque fois bloquait la création ; un échec après fermeture de la fenêtre ne s'affichait nulle part | important |

## Ce que l'arbitre a écarté
L'arbitre, qui trie les retours du jury, en a gardé 27 et écarté 9 : 4 doublons, 2 détails qui relèvent de la réalisation, 2 ajouts hors du sujet de la version, 1 hors périmètre. Il a vérifié les constats dans le code et baissé la gravité de 4 retours. Légère dérive : deux propositions sortaient du sujet, elles ont été écartées.

## Ce que l'utilisateur a tranché
| Question | Décision |
|---|---|
| Faut-il nettoyer les fichiers abandonnés ? | Oui : à chaque enregistrement du dossier, le serveur efface les fichiers de ce candidat qu'il ne cite plus, déposés il y a plus d'une heure |
| Que faire si on ferme la fenêtre de création ? | Pendant un envoi, elle ne se ferme pas ; une fois le candidat créé, fermer revient à « Enregistrer et revenir à la liste », et un échec s'affiche dans un bandeau |

## Ce qui change dans la spec
- Un échec laisse le champ dans son état d'avant : aucun enregistrement ultérieur ne renvoie le changement raté.
- Refus du serveur et coupure réseau sont traités différemment ; le nettoyage automatique rattrape les cas incertains.
- Dès le premier clic, les deux boutons et la fermeture sont bloqués ; « Retirer » permet de continuer sans un fichier qui échoue.
- Un lien n'est cliquable que s'il commence par `http://` ou `https://`.
- La restauration accepte les copies d'avant la v1.10 ; le guide de mise en production donne l'étape du serveur web pas à pas, avec une preuve.
- La gêne d'affichage pendant un retour vers la v1.9 est décrite et acceptée ; « remplacer » devient « Retirer puis déposer ».

## Ce qui est refusé, et pourquoi
- Afficher un état « fichier choisi, pas encore envoyé » pendant la création : choix d'interface de Léo, qui n'est pas cassé.
- Pouvoir extraire un CV d'une copie de sauvegarde : ajout hors du sujet.
- Empêcher le serveur web d'écrire temporairement les gros envois sur disque : ajout hors du sujet, le comportement existe déjà pour les dossiers.
- Tracer les retraits de fichiers dans le journal du serveur : ajout hors du sujet ; la procédure de restauration dit à la place de refaire les retraits.
