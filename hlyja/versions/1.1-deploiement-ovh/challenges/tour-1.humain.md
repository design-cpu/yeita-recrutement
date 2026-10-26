---
type: challenge
vue: humaine
version: 1.1
tour: 1
score: 52
decision: nouveau-tour
---

# Tour 1 : une faille de connexion trouvée, et des scripts pas encore sûrs pour un serveur partagé

> 52/100 : la spec doit être reprise. Le jury a trouvé un moyen de voir l'espace Candidatures sans se connecter, et le premier déploiement aurait échoué.

## Ce que le jury a pointé
| Membre du jury | Son point principal | Gravité |
|---|---|---|
| Docker/Compose | oauth2-proxy n'écoutait pas sur la bonne adresse, et un changement de configuration n'aurait pas été pris en compte au déploiement | important |
| Sécurité | Un en-tête ajouté à la main permettait d'ouvrir une page protégée sans connexion. Vérifié : c'est vrai | bloquant |
| Exploitation | Le dossier du site cloné par l'administrateur n'était pas modifiable par le compte de déploiement ; un compte `deploy` déjà présent aurait reçu des droits élevés sans prévenir | bloquant |
| Testabilité | Rien ne disait comment tester les scripts du serveur sans le serveur, ni comment repérer qu'un autre site tombe | important |

## Ce que l'arbitre a écarté
10 retours sur 41 : 6 doublons entre membres du jury, 2 détails de réalisation, 1 sans effet concret, et la procédure de retrait du projet, qui n'est pas demandée (proposée pour plus tard).

## Ce qui change dans la spec
- oauth2-proxy ne fait plus confiance aux en-têtes des proxys : la faille est fermée (ton choix).
- Le compte `deploy` possède le dossier du site ; un compte `deploy` existant hors du groupe Docker arrête le script.
- Le déploiement vérifie le commit de retour arrière, les ports 80 et 443 en cas B, et refuse les secrets d'exemple.
- Les conteneurs redémarrent seuls après un redémarrage du serveur, et prennent toujours la configuration à jour.
- Le mode d'emploi gagne : DNS, certificat, client Google « Interne », relevé des autres sites avant et après, lecture des échecs.
- Un protocole de test des scripts dans un conteneur Ubuntu, et un critère pour le cas A.

## Ce qui est refusé, et pourquoi
Aucun retour recevable n'est refusé.
