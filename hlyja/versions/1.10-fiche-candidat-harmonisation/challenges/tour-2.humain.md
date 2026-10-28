---
type: challenge
vue: humaine
version: 1.10
tour: 2
score: 93
decision: valide
---

# Tour 2 : validé, restaient quelques garanties à verrouiller

> 93 sur 100, spec validée. Plus aucun défaut bloquant ; il restait à faire garantir par le serveur qu'un dossier ne cite jamais un fichier absent, et à relier clairement le bouton Merge à l'étape à faire sur le serveur.

## Ce que le jury a pointé
| Membre du jury | Note | Son point principal | Gravité |
|---|---|---|---|
| Lead dev | 92 | Le serveur acceptait un dossier citant un fichier qui n'existe pas, et l'import d'un export pouvait en créer : « Ouvrir » aurait mené à une page introuvable | important |
| Ops et déploiement | 92 | Le guide de mise à jour disait encore « rien à faire après un merge » : on pouvait merger sans régler le serveur web, et tout CV de plus de 1 Mo aurait été refusé | important |
| Testabilité et concurrence | 82 | Aucun test ne prouvait qu'après un échec, l'enregistrement suivant ou le départ de la page ne renvoie pas le changement raté | important |
| Testabilité et concurrence | | Appliquée à la lettre, la règle « état d'avant » effaçait aussi ce qu'on avait tapé ailleurs pendant ce temps | important |
| Testabilité et concurrence | | Le sort d'un fichier envoyé dont le dossier n'a pas été enregistré restait flou | détail |
| Utilisateur recruteur | 98 | Le bandeau qui signale un échec après fermeture de la fenêtre n'avait pas de texte | détail |
| Sécurité et données personnelles | 100 | Rien à signaler : les points du tour 1 sont réglés | — |

## Ce que l'arbitre a écarté
Deux retours sur huit. L'un craignait que des CV soient effacés après un retour vers la v1.9 ; une vérification dans le code a montré que la v1.9 garde bien les références aux fichiers. L'autre doublait le premier point du Lead dev. Aucune dérive.

## Ce qui change dans la spec
- Le serveur refuse d'enregistrer un dossier qui cite un fichier absent, avec un message clair ; l'import d'un export retire les références à des fichiers qui n'existent plus.
- Le guide de mise à jour dit, dès son introduction, de faire l'étape « avant le merge » avant de cliquer Merge.
- La règle « état d'avant » ne porte que sur le champ du fichier : ce qu'on tape ailleurs est gardé et enregistré ensuite, et quitter la page ne défait jamais un dépôt.
- Un fichier dont le dépôt n'a pas abouti, à l'envoi ou à l'enregistrement, reste en attente et repart à la relance.
- Le bandeau a son texte : « <Champ> de <nom> non enregistré : <raison>. Ouvre sa fiche pour le déposer à nouveau. »
- De nouveaux critères de test prouvent ces cas.

## Ce qui est refusé, et pourquoi
Une confirmation avant « Retirer » a été examinée et non retenue : c'est un choix d'interface de Léo, qui n'est pas cassé.

## Pourquoi le score bouge
De 69 à 93. Les 27 retours gardés au tour 1 ont tous été intégrés, dont le seul défaut bloquant. Les notes montent partout : Testabilité et concurrence de 33 à 82, Sécurité de 82 à 100, Ops de 70 à 92, Utilisateur recruteur de 72 à 98, Lead dev de 86 à 92. Les six retours de ce tour, courts et concrets, sont tous entrés dans la spec finale.
