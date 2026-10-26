---
type: challenge
vue: humaine
version: 1.3
tour: 1
score: 47
decision: nouveau-tour
---

# Tour 1 : les enregistrements qui se marchent dessus, et une faille réseau sur Linux

> 47 sur 100, nouveau tour. Les six membres du jury ont chacun trouvé un problème bloquant. Le plus courant : en mode serveur, un recruteur seul pouvait se mettre en conflit avec lui-même.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Technique front | La fiche EC1 et la feuille de décompte d'un même candidat, ouvertes ensemble, se refuseraient l'une l'autre à chaque enregistrement | bloquant |
| Intégrateur API | Les enregistrements automatiques partent toutes les 300 à 400 ms sans attendre le précédent : conflit avec soi-même sur une connexion lente | bloquant |
| Sécurité | Sur un serveur Linux, la machine elle-même peut joindre l'API par son adresse interne, et donc se faire passer pour n'importe qui | bloquant |
| Données personnelles | « Remplacer tout » à l'import effacerait les dossiers de toute l'équipe, sans retour possible | bloquant |
| Exploitation | Revenir à la v1.2 échouerait, car le script de déploiement attendrait une API qui n'existe plus | bloquant |
| Recruteur | Pendant le chargement ou une panne, un bouton pouvait encore enregistrer en silence dans le navigateur | bloquant |

Les autres retours importants : le message de conflit invisible sur une page défilée, la saisie perdue sans prévenir, la page qui se redessine à chaque retour sur l'onglet, le nom réel du volume Docker, la sonde de santé qui accepterait une base en panne.

## Ce que l'arbitre a écarté
9 retours sur 47 : 6 doublons entre membres du jury, un détail de réalisation, un retour déjà couvert. Il a aussi écarté l'idée de masquer « Charger des exemples » : les exemples sont marqués et se retirent. Aucune dérive.

## Ce que tu as tranché
| Question | Décision |
|---|---|
| « Remplacer tout » en mode serveur | Masqué ; seule la fusion reste |
| Une réponse 404 sur le site de production | Page bloquée avec un message, jamais d'enregistrement dans le navigateur |
| Pages ouvertes depuis un fichier (`file://`) | Mode navigateur, sans appeler l'API |

## Ce qui change dans la spec
- Les requêtes sur un même dossier partent l'une après l'autre : plus de conflit avec soi-même.
- Les fiches EC1, EC2 et la feuille de décompte relisent le dossier et n'écrivent que leur partie.
- Tant que le mode n'est pas connu, rien ne s'écrit nulle part.
- Le bandeau d'erreur reste visible en haut de l'écran ; l'indicateur passe à « Non enregistré » et la saisie reste affichée pour être copiée.
- Le réseau de l'API n'a plus d'adresse côté serveur : l'essai sur un moteur Linux montre que l'accès est coupé, et qu'oauth2-proxy la joint toujours.
- Le déploiement n'attend l'API que si la version déployée en a une ; le README dit comment revenir en arrière sans perdre de travail.

## Ce qui est refusé, et pourquoi
- Contrôler toute la configuration Docker dans le script de déploiement : la QA le fait déjà, le pitch ne demande que d'attendre l'API. Mis au backlog.
- Proposer dans le champ Recruteurs les noms trouvés dans les dossiers : c'est une évolution. La petite régression est notée, l'idée va au backlog.
