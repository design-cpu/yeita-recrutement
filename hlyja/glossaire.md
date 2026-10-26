---
type: glossaire
maj: 1.1
---

# Glossaire

> Les mots du produit et du projet, expliqués simplement.

## Caddy
Un logiciel qui reçoit les visites d'un site web et obtient tout seul le certificat HTTPS. Le projet en lance un dans le cas B, quand le serveur n'a pas déjà de proxy.
Aussi : Caddy du projet, service caddy.

## Cas A / cas B
Les deux façons d'installer le site sur le serveur. Cas A : un proxy existe déjà sur le serveur, on lui ajoute le site. Cas B : rien n'occupe les ports web, le projet apporte son propre Caddy.
Aussi : cas A, cas B.

## Conteneur
Un programme qui tourne isolé du reste du serveur, avec tout ce dont il a besoin. On le démarre à partir d'une image Docker, on peut l'arrêter et le recréer sans rien casser autour.
Aussi : conteneurs.

## Docker Compose
L'outil qui décrit et lance ensemble les conteneurs d'un projet, à partir d'un seul fichier (`compose.yaml`). Une commande démarre tout, une autre arrête tout.
Aussi : Compose, pile Compose.

## HTTPS
La version chiffrée d'une adresse web. Le navigateur affiche un cadenas ; il faut un certificat, que le proxy du serveur ou Caddy se charge d'obtenir.
Aussi : certificat.

## Image Docker
Le paquet prêt à lancer qui contient un programme et ses fichiers. Pour ce projet, l'image `front` contient le site construit et oauth2-proxy.
Aussi : image, image front.

## oauth2-proxy
Le gardien placé devant le site. Il sert les pages publiques à tout le monde et demande une connexion avec un compte Google @yeita.fr pour tout le reste.
Aussi : front.

## Page publique
Une page accessible sans connexion, par exemple celle envoyée aux candidats. La liste est fermée : une nouvelle page est protégée tant qu'on ne l'y ajoute pas.
Aussi : pages publiques, liste publique.

## Profil Compose
Un interrupteur dans Docker Compose qui active des conteneurs optionnels. Le profil `caddy` allume le Caddy du projet (cas B) ; laissé vide, seul le site tourne (cas A).
Aussi : profil caddy, COMPOSE_PROFILES.

## Proxy
Le programme qui reçoit les visites sur l'adresse publique et les transmet au bon service du serveur. C'est souvent lui qui gère le HTTPS.
Aussi : reverse proxy, proxy de l'hôte, proxy existant.

## Serveur partagé
Le serveur OVH de Yeita, qui fait tourner d'autres services que le projet ne connaît pas. D'où la règle : ne toucher qu'à ce qui appartient au projet.
Aussi : serveur OVH.
