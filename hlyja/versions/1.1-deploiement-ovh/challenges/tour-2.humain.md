---
type: challenge
vue: humaine
version: 1.1
tour: 2
score: 94
decision: valide
---

# Tour 2 : spec validée, trois oublis de prudence comblés

> 94/100 : la spec est validée. Docker et sécurité n'ont plus rien à redire ; trois derniers points sont intégrés dans la version finale.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Docker/Compose | Rien : tous ses points du tour 1 sont réglés | — |
| Sécurité | Rien : la faille est fermée, les cookies et les secrets sont tenus | — |
| Exploitation | Si un autre service s'appelle déjà « recrutement » sur le serveur, les scripts pourraient toucher à ses conteneurs | important |
| Testabilité | Le protocole de test des scripts se contredisait ; un `.env` resté sur `localhost` aurait été validé à tort | important |

## Ce que l'arbitre a écarté
Un seul retour, en double avec un autre plus précis. Aucune dérive.

## Ce qui change dans la spec
- Les scripts ne reconnaissent comme « à nous » que ce qui vient du dossier `/opt/recrutement` ; sinon ils s'arrêtent.
- Le déploiement refuse un `.env` où le domaine et l'adresse de retour Google ne correspondent pas, ou resté sur `localhost`.
- Le test des scripts dans un conteneur Ubuntu est décrit pas à pas.
- Une interruption pendant le déploiement est testée.

## Ce qui est refusé, et pourquoi
Aucun.

## Pourquoi le score bouge
De 52 à 94 : les deux failles graves du tour 1 sont réglées (connexion contournable, dossier inutilisable), et presque tous les points importants sont traités. Il ne restait que trois oublis, dont deux causés par les changements de la v2.
