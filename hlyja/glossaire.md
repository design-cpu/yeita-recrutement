---
type: glossaire
maj: 1.7
---

# Glossaire

> Les mots du produit et du projet, expliqués simplement.

## age
L'outil qui chiffre les sauvegardes. Il n'a besoin, sur le serveur, que de la partie publique de la clé : la partie secrète reste au coffre.

## API
Un programme qui ne montre pas de pages : il répond aux demandes d'autres programmes, comme les pages du site. Celle du projet garde les dossiers candidat dans une base partagée et dit qui a le droit de les lire ou de les modifier.
Aussi : API de stockage.

## Bandeau d'erreur
Le message rouge qui s'affiche en haut de la page quand la base refuse ou ne répond pas : quelqu'un a modifié le dossier entre-temps, la connexion est coupée, ou le compte n'a pas le droit d'écrire. Il reste visible même en bas d'une longue fiche et propose de recharger la page.
Aussi : bandeau.

## Bandeau jaune
Le bandeau en tête des pages de Candidatures. Sur le site de l'équipe, il dit que les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés, et affiche « Connecté·e : prénom ». Ailleurs, il rappelle que les données sont fictives et restent dans le navigateur.
Aussi : bandeau « Données fictives ».

## Bucket
L'espace de stockage chez OVH (Object Storage) où arrivent les sauvegardes chiffrées. Il efface seul les copies de plus de 30 jours, et le serveur n'a pas le droit d'y effacer quoi que ce soit.
Aussi : OVH Object Storage.

## Caddy
Un logiciel qui reçoit les visites d'un site web et obtient tout seul le certificat HTTPS. Le projet en lance un dans le cas B, quand le serveur n'a pas déjà de proxy.
Aussi : Caddy du projet, service caddy.

## Cas A / cas B
Les deux façons d'installer le site sur le serveur. Cas A : un proxy existe déjà sur le serveur, on lui ajoute le site. Cas B : rien n'occupe les ports web, le projet apporte son propre Caddy.
Aussi : cas A, cas B.

## Clé de sauvegarde
La clé secrète qui ouvre les sauvegardes. Elle n'est jamais sur le serveur : elle est rangée dans le coffre de mots de passe de Yeita et connue d'au moins deux personnes. La perdre rend toutes les sauvegardes illisibles.
Aussi : clé privée age.

## Conflit d'écriture
Ce qui arrive quand deux personnes modifient le même dossier en même temps. Chaque dossier porte un numéro de version : un enregistrement fait à partir d'une version dépassée est refusé, et la personne doit recharger la page au lieu d'écraser le travail de l'autre. Cette méthode s'appelle la « version optimiste ».
Aussi : conflit, conflits, version optimiste.

## Conteneur
Un programme qui tourne isolé du reste du serveur, avec tout ce dont il a besoin. On le démarre à partir d'une image Docker, on peut l'arrêter et le recréer sans rien casser autour.
Aussi : conteneurs.

## Docker Compose
L'outil qui décrit et lance ensemble les conteneurs d'un projet, à partir d'un seul fichier (`compose.yaml`). Une commande démarre tout, une autre arrête tout.
Aussi : Compose, pile Compose.

## Effacement réel
Supprimer un dossier de sorte qu'il ne reste plus lisible nulle part dans les fichiers de la base. Une base de données ordinaire marque souvent la place comme libre sans effacer le contenu ; l'API, elle, l'écrase.
Aussi : effacement.

## En-tête
Une information jointe à chaque demande envoyée à un serveur, invisible pour le visiteur. oauth2-proxy en ajoute une qui donne l'email du compte connecté ; l'API s'y fie pour savoir qui parle.
Aussi : en-têtes, X-Forwarded-Email.

## healthchecks.io
Le service qui prévient l'administrateur par email quand une sauvegarde échoue, quand le disque du serveur se remplit, ou quand il n'a plus de nouvelles de l'un des deux.

## HTTPS
La version chiffrée d'une adresse web. Le navigateur affiche un cadenas ; il faut un certificat, que le proxy du serveur ou Caddy se charge d'obtenir.
Aussi : certificat.

## Image Docker
Le paquet prêt à lancer qui contient un programme et ses fichiers. Pour ce projet, l'image `front` contient le site construit et oauth2-proxy.
Aussi : image, image front.

## Journal
La liste, tenue par l'API, de qui a créé, modifié ou supprimé quel dossier, quand, et à quelle étape. Il ne contient jamais le contenu des dossiers. À ne pas confondre avec le journal du serveur, qui note les demandes reçues.
Aussi : journal des actions.

## Menu ⋯
Le bouton à trois points sur chaque candidat (carte du tableau, ligne de la liste, en-tête de son parcours). Il ouvre la fiche du candidat, son historique, copie le lien de sa candidature, ou la supprime après confirmation. Chacun s'ouvre dans une fenêtre, sans quitter la page.
Aussi : menu trois points, plus d'actions.

## Mode bloqué
Ce qui arrive quand le site de production ne peut pas joindre la base, ou que le compte n'est pas dans l'équipe : la page n'affiche ni n'enregistre aucune candidature, et le bandeau dit pourquoi. Elle ne bascule jamais en silence dans le navigateur.

## Mode local
Une façon de lancer l'API sur son propre poste, sans oauth2-proxy : on lui indique quel membre de l'équipe on est, et elle peut aussi servir le site. Il est refusé sur le serveur.
Aussi : DEV_EMAIL, DEV_STATIC.

## Mode navigateur
La façon de travailler quand il n'y a pas de base sur le site (poste local, tests, aperçu) : les candidatures restent dans le navigateur, comme avant la v1.3, et chacun choisit son prénom dans la liste « Qui es-tu ? ».

## Mode serveur
La façon de travailler sur le site de production : les candidatures sont enregistrées dans la base partagée de l'équipe, chacun sous son compte Google. En haut de page s'affiche « Connecté·e : » suivi du prénom.
Voir : [Mode serveur des pages](technique/mode-serveur.md)

## Node.js
Le logiciel qui fait tourner du JavaScript en dehors du navigateur. L'API du projet est écrite pour Node.js, version 22 ou plus récente.
Aussi : Node.

## oauth2-proxy
Le gardien placé devant le site. Il sert les pages publiques à tout le monde et demande une connexion avec un compte Google @yeita.fr pour tout le reste.
Aussi : front.

## Page publique
Une page accessible sans connexion, par exemple celle envoyée aux candidats. La liste est fermée : une nouvelle page est protégée tant qu'on ne l'y ajoute pas.
Aussi : pages publiques, liste publique.

## Palier suggéré
En EC2, le palier visé est rempli d'office à partir du souhait de rémunération noté à l'appel, placé dans la grille de salaire. Il est marqué « suggéré » tant que personne ne l'a changé. Si le souhait ne donne pas de montant lisible, le palier reste vide.
Aussi : suggéré.

## Panneau Notes
Le panneau qui s'ouvre à droite avec le bouton « Notes », à tout moment, sans perdre l'endroit où on était dans la page. On y écrit en vrac pendant l'entretien, une note par étape ; rien ne part chez le candidat. Les notes des autres étapes s'y relisent.
Aussi : Notes, notes libres.

## Profil Compose
Un interrupteur dans Docker Compose qui active des conteneurs optionnels. Le profil `caddy` allume le Caddy du projet (cas B) ; laissé vide, seul le site tourne (cas A).
Aussi : profil caddy, COMPOSE_PROFILES.

## Proxy
Le programme qui reçoit les visites sur l'adresse publique et les transmet au bon service du serveur. C'est souvent lui qui gère le HTTPS.
Aussi : reverse proxy, proxy de l'hôte, proxy existant.

## rclone
L'outil qui envoie les sauvegardes chiffrées du serveur vers le bucket OVH.

## Réseau interne
Un réseau Docker sans sortie vers Internet ni adresse sur le serveur lui-même. L'API n'est reliée qu'à celui-là, avec oauth2-proxy : personne d'autre, même sur le serveur, ne peut lui parler.
Aussi : réseau back.

## Restauration
Remettre la base des candidatures dans l'état d'une sauvegarde, après une panne ou une erreur. Ce qui a été saisi depuis la date de la copie est perdu, et les suppressions faites depuis sont à refaire.

## Sauvegarde
La copie de la base des candidatures faite chaque nuit, vérifiée puis chiffrée : sans la clé rangée au coffre, personne ne peut la lire. Elle est gardée 30 jours sur le serveur et 30 jours chez OVH, en Europe.
Aussi : copie chiffrée.

## Serveur partagé
Le serveur OVH de Yeita, qui fait tourner d'autres services que le projet ne connaît pas. D'où la règle : ne toucher qu'à ce qui appartient au projet.
Aussi : serveur OVH.

## SQLite
Une base de données tenue dans un simple fichier, sans serveur de base à installer. L'API y range les dossiers candidat, l'équipe et le journal.
Aussi : base SQLite.

## Timer systemd
Le réveil du serveur qui lance une tâche à heure fixe : chaque nuit vers 3 h pour la sauvegarde, chaque heure pour le disque. Si le serveur était éteint, la tâche part à son redémarrage.

## Volume
Un dossier géré par Docker, qui survit à l'arrêt et à la recréation des conteneurs. Le volume `recrutement_data` contient la base des candidatures, à ne jamais supprimer ; depuis la 1.7, elle est aussi sauvegardée chaque nuit hors du serveur.
Aussi : volume Docker, recrutement_data.
