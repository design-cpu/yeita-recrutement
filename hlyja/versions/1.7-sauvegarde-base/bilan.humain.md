---
type: bilan
vue: humaine
version: 1.7
statut: terminee
---

# Les candidatures sont sauvegardées chaque nuit

> Terminé et testé sur une copie du serveur. Il reste à le mettre en service sur le vrai serveur (clé, compte OVH, alertes), puis à suivre le guide de test.

## Ce qui a été fait
- Chaque nuit vers 3 h, la base des candidatures est copiée, vérifiée, chiffrée et envoyée chez OVH, en Europe.
- La clé qui ouvre les copies n'est jamais sur le serveur : elle va au coffre. Le serveur peut déposer des copies chez OVH, mais pas les effacer ; OVH les efface seul au bout de 30 jours.
- Un email arrive si une sauvegarde échoue, si le disque se remplit au-delà de 80 %, ou si l'une des deux vérifications ne donne plus de nouvelles.
- Une procédure pas à pas permet de tout restaurer, même si le serveur disparaît, ou simplement d'ouvrir une copie sur un Mac.

## Comment ça s'est passé
- Le jury a d'abord jugé la restauration impossible à suivre le jour d'une vraie panne (score 44). Au second tour, après corrections, la spec a été validée (87).
- Tout a été essayé sur une copie d'Ubuntu 26.04, le système du serveur : vraie base, vraies pannes (disque plein, arrêt brutal, API arrêtée), restauration complète dans quatre situations.
- Les contrôles ont trouvé plusieurs vrais problèmes avant toi : un ménage qui aurait pu effacer une sauvegarde en cours, une commande de la procédure qui ne marchait pas sur Mac, une alerte disque qui se taisait si la mesure échouait, un réglage qui aurait relancé Docker pendant une maintenance. Tous corrigés.

## À faire avant de merger
- [ ] Partie A du guide de test (`qa/guide-test-humain.md`) : 5 minutes sur le Mac.

## Après le merge, sur le serveur
- [ ] Mettre en service les sauvegardes (`deploy/README.md`, section 14) : la clé au coffre, le stockage OVH et ses trois comptes, les alertes, les minuteries.
- [ ] Partie B du guide de test : la seule preuve avec le vrai OVH, le vrai service d'alerte et la vraie clé.
- Jusque-là, la base du serveur reste la seule copie des candidatures.

## Ce qui n'a pas marché
Rien de bloquant. Un problème plus ancien a été trouvé et mis de côté (priorité haute) : lancer un déploiement depuis une fenêtre de terminal réglée de façon trop stricte peut empêcher l'application de redémarrer. La version évite ce réglage, mais la correction du script de déploiement reste à faire.

## Pour tester
```bash
git switch version/1.7-sauvegarde-base
```
Puis suivre la partie A de `qa/guide-test-humain.md`.
