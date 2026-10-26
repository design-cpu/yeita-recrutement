---
type: challenge
vue: humaine
version: 1.2
tour: 2
score: 94
decision: valide
---

# Tour 2 : spec validée, deux derniers trous bouchés

> Score de 94 sur 100 : la spec est validée. Les deux points importants restants ont été intégrés dans la spec finale.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Technique | Deux programmes qui installent la base en même temps ne doivent pas se gêner | détail |
| Développeur intégrateur | « Dossier introuvable » et « adresse inconnue » doivent se distinguer | détail |
| Sécurité | La seule adresse sans connexion, `/api/sante`, ne doit pas pouvoir servir de porte dérobée | important |
| Données personnelles | Après une modification, l'ancienne version d'un dossier restait dans un fichier de travail de SQLite | important |
| Exploitation | Deux règles se contredisaient sur le dossier du site servi en local | détail |

## Ce que l'arbitre a écarté
Aucun retour écarté. L'arbitre a refusé trois demandes qui allaient plus loin qu'au premier tour : un mécanisme de reprise, un test d'arrêt et un statut « partiel » qui comptait deux fois le même problème.

## Ce qui change dans la spec
- L'exception de connexion de `/api/sante` porte sur la route reconnue, pas sur le texte de l'adresse : `/api/candidats?x=/api/sante` reste refusé.
- Après chaque enregistrement, SQLite vide son fichier de travail : l'ancienne version d'un dossier n'est plus lisible sur le disque.
- Un dossier introuvable renvoie un code dédié, qui le distingue d'une adresse inconnue.

## Ce qui est refusé, et pourquoi
- Réessayer automatiquement le vidage du fichier de travail : il est demandé après chaque enregistrement, un avertissement suffit en cas d'échec.

## Pourquoi le score bouge
De 74 à 94 : les dix points importants du premier tour sont réglés. Il ne reste que deux points importants, apparus avec les changements, et six détails, tous intégrés.
