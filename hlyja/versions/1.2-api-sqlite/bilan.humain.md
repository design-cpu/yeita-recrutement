---
type: bilan
vue: humaine
version: 1.2
statut: terminee
---

# Le serveur qui gardera les dossiers candidat est prêt

> Version terminée. Avant de merger, il te reste à dérouler le guide de test, environ 15 minutes dans un terminal.

## Ce qui a été fait
Les dossiers candidat peuvent maintenant être gardés dans une base commune sur le serveur, au lieu du navigateur de chacun. Seuls les membres actifs de l'équipe Yeita y ont accès, et un membre en lecture seule ne peut rien modifier. Deux recruteurs qui modifient le même dossier ne s'écrasent plus : le second est prévenu et doit recharger. Supprimer un dossier l'efface vraiment, y compris des fichiers de la base. L'équipe se gère par une commande sur le serveur.

Les pages ne s'en servent pas encore : les brancher, et mettre le serveur derrière la connexion Google, ce sera la version suivante.

## Comment ça s'est passé
| Étape | Résultat |
|---|---|
| Spec | validée à 94 sur 100, en 2 tours |
| Réalisation | 9 tâches sur 9 réussies |
| Revue de sécurité | aucune faille bloquante ; 9 petits points corrigés |
| Tests | 52 tests automatiques, tous verts ; QA à 100 % après 2 petites corrections |
| Documentation | une page sur l'API, 3 pages mises à jour, 8 mots au glossaire |
| Backlog | 9 idées notées pour plus tard, dont une prioritaire |

Tu as pris quatre décisions en chemin : le serveur n'écoute que sur la machine par défaut, une version de Fastify récente qui corrige une faille, les tables du document de référence alignées sur le code, et le journal d'un dossier effacé quand le dossier est supprimé.

## À faire avant de merger
- [ ] Dérouler le guide de test (5 parcours).
- [ ] À la version suivante, d'abord la fiche 1.2-1 : vérifier que la connexion Google transmet bien l'email, et ne jamais exposer le serveur autrement qu'au travers d'oauth2-proxy.

## Ce qui n'a pas marché
Rien à signaler. Quatre petits écarts avec la spec sont documentés : le rôle lecture peut aussi faire `HEAD`, des réglages mal tapés supplémentaires sont refusés, l'effacement sur le disque peut être retardé si un autre programme lit la base au même moment, et un identifiant très long reçoit « Route inconnue. ».

## Pour tester
```bash
git switch version/1.2-api-sqlite
cd api && npm ci && npm test
```
Puis suivre le guide de test humain de la version.
