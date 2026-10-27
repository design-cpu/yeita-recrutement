---
type: challenge
vue: humaine
version: 1.3
tour: 2
score: 88
decision: nouveau-tour
---

# Tour 2 : presque validée, un ordre de lecture à corriger

> 88 sur 100 (47 au tour 1), nouveau tour, le dernier. La moyenne passe, mais un défaut bloquant restait : les pages auraient été bloquées sur tout serveur sans API.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Intégrateur API | La règle « réponse qui n'est pas du JSON » passait avant la règle « 404 » ; or un serveur de fichiers répond 404 en HTML : les pages étaient bloquées hors production | bloquant |
| Technique front | Quand on quitte une fiche, la relecture du dossier fait partir l'enregistrement trop tard : la dernière saisie se perd | important |
| Recruteur | La nouvelle tentative après un conflit pouvait écraser en silence les notes d'un collègue sur la même fiche | important |
| Données personnelles | Rien ne disait quoi faire si le dossier avait été supprimé pendant qu'une fiche était ouverte | important |
| Sécurité | La coupure côté serveur ne valait que pour IPv4 ; avec IPv6, la machine joindrait encore l'API | important |
| Exploitation | La version de Docker du serveur n'est pas connue, et le contrôle réseau doit avoir lieu avant d'ajouter le premier admin | important |

## Ce que l'arbitre a écarté
2 doublons. Aucune dérive : chaque retour portait sur une règle nouvelle ou modifiée en v2.

## Ce qui change dans la spec
- Le 404 est reconnu avant de regarder le contenu de la réponse : les pages restent en mode navigateur sur un serveur sans API.
- En quittant une fiche, l'enregistrement part aussitôt, sans relire le dossier.
- Une nouvelle tentative n'a lieu que si personne d'autre n'a changé la même partie ; sinon, le bandeau de conflit s'affiche.
- Un dossier supprimé n'est jamais recréé par une fiche restée ouverte.
- IPv6 est coupé sur le réseau de l'API (vérifié : sans cela, la machine la joint).
- Le README demandera de relever la version de Docker du serveur et de faire le contrôle réseau avant le premier admin.

## Ce qui est refusé, et pourquoi
Aucun.

## Pourquoi le score bouge
Les six bloquants du tour 1 sont résolus et le nombre de retours est divisé par cinq. Le seul bloquant restant vient d'un tableau réécrit au tour 1 : son ordre était faux.
