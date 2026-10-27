---
type: challenge
vue: humaine
version: 1.7
tour: 2
score: 87
decision: validee
---

# Tour 2 : spec validée

> 87 sur 100 (44 au tour 1), validée. Tout ce qui avait été pointé est réglé ; les derniers points portent sur des détails ajoutés au tour précédent.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Exploitation | Le ménage fait après l'arrêt de la sauvegarde automatique pouvait effacer une sauvegarde lancée à la main au même moment | important |
| Restauration | Pour revenir à la copie gardée dans le serveur, sauvegarder d'abord l'état actuel aurait remplacé justement cette copie | important |
| Sécurité et RGPD | Une restauration ratée pouvait laisser une copie complète des données dans le serveur | important |
| Sécurité et RGPD | Les accès « administrateur » d'OVH n'avaient pas de place : ils ne doivent jamais aller sur le serveur | important |
| Testabilité | La vérification du disque et l'arrêt brutal n'avaient pas encore de preuve | important |

## Ce que l'arbitre a écarté
Un point sans conséquence (deux sauvegardes dans la même seconde, impossible en pratique) et deux doublons.

## Ce qui change dans la spec
- Le ménage après arrêt ne touche à rien si une autre sauvegarde est en cours.
- En restauration, la copie choisie est mise à l'abri avant toute autre opération ; après coup, le serveur ne garde aucune copie en trop.
- Les accès administrateur OVH restent au coffre et ne servent que depuis un poste.

## Ce qui est refusé, et pourquoi
Rien.

## Pourquoi le score bouge
Les manques du tour 1 sont réglés ; il ne restait que quelques points précis, intégrés sans ajouter de critère.
