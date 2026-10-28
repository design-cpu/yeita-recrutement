---
type: challenge
vue: humaine
version: 1.7
tour: 1
score: 44
decision: nouveau-tour
---

# Tour 1 : la restauration n'était pas encore faisable

> 44 sur 100, nouveau tour. Le jury a trouvé la mécanique de sauvegarde solide, mais la restauration impossible à suivre le jour d'une vraie panne, et plusieurs façons pour les alertes de se taire.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Restauration | Si le serveur disparaît, plus personne n'a les accès au stockage OVH : les copies existent mais restent hors d'atteinte | important |
| Restauration | Relancer une sauvegarde dans la journée écrasait celle de la nuit, en local et chez OVH | important |
| Exploitation | Si on règle par erreur la même adresse d'alerte pour la sauvegarde et le disque, les pings horaires du disque cachent toute sauvegarde ratée | important |
| Exploitation | Une sauvegarde arrêtée par le système (trop longue) ne prévenait personne | important |
| Sécurité et RGPD | « Le serveur n'a pas le droit d'effacer » doit être un vrai droit retiré chez OVH, pas une promesse du script | important |
| Sécurité et RGPD | Déchiffrer sur un Mac dans un dossier synchronisé avec iCloud enverrait les dossiers candidat dans le cloud | important |
| Testabilité | Plusieurs promesses (pas de donnée dans les alertes, arrêt brutal, essai réel sur le serveur) n'avaient aucun critère pour les prouver | important |

## Ce que l'arbitre a écarté
Deux doublons, un point de réalisation, et une partie d'une proposition : réécrire les suppressions directement dans la base hors de l'application. Elle sortait du périmètre ; les suppressions sont refaites dans l'interface.

## Ce qui change dans la spec
- Chaque sauvegarde porte l'heure dans son nom : rien n'est jamais écrasé.
- Deux comptes OVH : celui du serveur peut déposer mais pas effacer ; un second, en lecture seule, rangé au coffre avec la clé, sert à restaurer depuis un poste (choix confirmé par toi).
- La restauration est contrôlée avant de remplacer quoi que ce soit, réversible, et décrite aussi pour le cas « serveur perdu ».
- Les alertes partent dans tous les cas (arrêt forcé, démarrage du serveur, déploiement en cours), et l'adresse d'alerte n'est plus visible des autres comptes du serveur.

## Ce qui est refusé, et pourquoi
Rien de recevable n'est refusé. Le chef d'équipe a seulement déplacé les détails techniques vers la réalisation, pour garder la spec lisible.

## Pourquoi le score bouge
Premier tour : beaucoup de manques importants, chacun avec une solution simple.
