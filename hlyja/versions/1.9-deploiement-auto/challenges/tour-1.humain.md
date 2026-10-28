---
type: challenge
vue: humaine
version: 1.9
tour: 1
score: 55
decision: nouveau-tour
---

# Tour 1 : l'automatisme pouvait se taire ou défaire un retour arrière

> 55 sur 100, nouveau tour. Le principe tient : l'application dépose une demande, le serveur décide. Mais le jury a trouvé des cas où l'automatisme s'arrête sans que la page le dise, et des cas où il défait ce qu'un humain vient de faire.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Sécurité | Une demande pouvait viser n'importe quel commit intermédiaire d'une branche fusionnée, jamais relu ni mis en ligne | important |
| Sécurité | Le serveur risquait de prendre ses décisions dans un fichier que l'application peut modifier | important |
| Exploitation | Le passage pouvait être coupé par systemd au milieu d'une mise en ligne (durée maximale trop courte) | important |
| Exploitation | Une demande impossible à lire faisait tomber l'unité qui surveille les demandes, sans aucun signe | important |
| Déploiement | Le retour arrière lançait le script du commit cassé ; un arrêt avant tout changement déclenchait un retour inutile | important |
| Déploiement | Un merge pendant les tests, ou le retour automatique, mettait l'automatisme en pause tout seul | important |
| Testabilité | Un retour arrière fait en SSH pendant les tests était écrasé quelques minutes plus tard | important |
| Testabilité | Le banc, les scénarios de concurrence et la page n'avaient pas de moyen de preuve | important |
| Utilisateur admin | Pas de phrase qui dit « tout va bien » ou « à vérifier », comme sur la page des sauvegardes ; « actif » affiché même si plus rien ne tourne | important |
| Utilisateur admin | « Reprendre » met un commit en ligne sans le dire ; aucune confirmation écrite | important |

## Ce que l'arbitre a écarté
Sept retours : quatre doublons, une option système qui n'existe pas dans la spec, et un contrôle des unités installées après chaque déploiement, que le pitch ne demande pas. Aucune dérive.

## Ce qui change dans la spec
- Depuis la page, seuls les commits qui ont été la pointe de main sont acceptés (ton choix) ; `deploy.sh` en SSH garde la règle large.
- Le serveur garde ses propres fichiers de décision (dernier commit mis en ligne, dernier en échec, historique) hors de portée de l'application.
- Le retour arrière utilise le script du commit qui marchait ; un arrêt avant tout changement ne déclenche pas de retour.
- Seul celui qui demande un commit précis met en pause ; un déploiement fait à la main pendant les tests l'emporte (passage « annulé »).
- La page dit en une phrase ce qui se passe (vert, neutre, rouge), montre la dernière vérification et alerte si une demande n'est pas prise en charge en 5 minutes.
- Tous les textes affichés et les confirmations sont écrits.

## Ce qui est refusé, et pourquoi
- Vérifier après chaque déploiement que les unités installées sont à jour : hors du pitch.
- Le détail du banc de test et la liste des contrôles à mettre à l'épreuve : renvoyés au découpage en tâches, pour garder la spec lisible.
