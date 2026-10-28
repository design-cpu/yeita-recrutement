---
type: challenge
vue: humaine
version: 1.9
tour: 2
score: 86
decision: validee
---

# Tour 2 : validé, restaient des faux rouges et deux trous de logique

> 86 sur 100, spec validée. Le jury ne trouvait plus de faille de fond ; il restait des cas où la page passe au rouge alors que tout va bien, et deux cas où le serveur pouvait tourner en rond sur un commit cassé.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Exploitation | Après un retour arrière raté, le serveur aurait pu redéployer le commit cassé toutes les 10 minutes | important |
| Exploitation | « Relancer le script pour voir ce qui se passe » remettait main en ligne, même en pause | important |
| Déploiement | Après une mise en ligne faite en SSH, la page aurait affiché « commit incertain » pour toujours | important |
| Déploiement | Redéployer le commit déjà en ligne qui échoue passait pour « refusé avant de commencer » | important |
| Testabilité | Le serveur devait savoir qu'un passage a été tué, mais lisait cette information dans un fichier modifiable par l'application | important |
| Testabilité | Le retour arrière changeait de commit hors du verrou, pendant qu'un autre déploiement pouvait tourner | important |
| Utilisateur admin | Pendant un passage long, la page aurait dit « le serveur ne vérifie plus » ou « demande non prise en charge » | important |

## Ce que l'arbitre a écarté
Six doublons : plusieurs membres du jury avaient vu le même problème (le passage tué, le verrou du retour, le « commit incertain »). Aucune dérive.

## Ce qui change dans la spec
- Le serveur garde lui-même la trace du passage en cours ; l'application ne peut ni la forger ni l'effacer.
- `deploy.sh` note chaque mise en ligne réussie, qu'il soit lancé par l'automatisme ou en SSH.
- Ordre clair : un commit en échec n'est jamais retenté seul, même si l'état est incertain.
- Le retour arrière change de commit sous le verrou et s'annule si quelqu'un a déployé à la main entre-temps.
- Pas de rouge pendant un passage qui avance normalement.

## Ce qui est refusé, et pourquoi
Rien de nouveau : le contrôle des unités installées reste hors du pitch.
