---
type: challenge
vue: humaine
version: 1.3
tour: 3
score: 97
decision: valide
---

# Tour 3 : spec validée, trois précisions intégrées

> 97 sur 100, spec validée. Plus aucun problème bloquant ; trois remarques précises ont été intégrées dans la version finale.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Recruteur | Une fiche relit le dossier avant d'écrire : le refus en cas de notes changées ailleurs ne se déclenchait donc presque jamais | important |
| Intégrateur API | En quittant la page, l'enregistrement de départ peut arriver avant celui qui est encore en cours, et se faire refuser | important |
| Sécurité | Le contrôle à la mise en service ne regardait que l'IPv4 | détail |
| Technique front, Données personnelles, Exploitation | Rien de nouveau | — |

## Ce que l'arbitre a écarté
2 doublons. Aucune dérive, aucun conflit.

## Ce qui change dans la spec
- La fiche compare sa partie à ce qu'elle a lu, à chaque écriture : si un collègue a changé la même partie, rien n'est écrasé et le bandeau de conflit s'affiche.
- Le risque de perdre les toutes dernières frappes en quittant la page sur une connexion lente est écrit noir sur blanc, et le test le reproduit fidèlement.
- Avant le premier admin, l'exploitant vérifie aussi qu'IPv6 est coupé sur le réseau de l'API (essayé sur un moteur qui l'active par défaut : la coupure tient).

## Ce qui est refusé, et pourquoi
Aucun.

## Pourquoi le score bouge
De 88 à 97 : le bloquant du tour 2 est réglé, et les retours restants portaient sur des règles réécrites au tour 2, chacune réglée en une phrase.
