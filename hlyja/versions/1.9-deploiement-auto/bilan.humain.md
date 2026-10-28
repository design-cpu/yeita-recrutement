---
type: bilan
vue: humaine
version: 1.9
statut: terminee
---

# Le serveur met main en ligne tout seul, après les tests

> Terminée. Avant de merger : la partie A du guide de test sur ton Mac (10 minutes). Après le merge : la partie B sur le serveur, pour la mise en service (40 minutes).

## Ce qui a été fait
Après un merge sur `main`, plus besoin de se connecter au serveur : toutes les 10 minutes, il teste le nouveau commit dans un coin à part et le met en ligne si tout passe. Un commit qui casse un test ne part jamais. Si la mise en ligne elle-même rate, le serveur revient seul à la version d'avant.
La page `/admin/deploiement.html` dit en une phrase où on en est (« À jour », « En pause », ou en rouge ce qui ne va pas), garde l'historique des 30 derniers passages avec la sortie de chaque test, et permet de déployer tout de suite, de revenir à une ancienne version ou de reprendre l'automatisme.
La page ne peut rien lancer elle-même : elle dépose une demande, et c'est le serveur qui vérifie qu'elle est valable avant d'agir.

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Spec : 55 puis 86 sur 100, validée au 2e tour ; tu as tranché 3 points | ok |
| 8 tâches | ok |
| Revue de code : 4 problèmes importants, tous corrigés | ok |
| Essais sur un vrai serveur Linux de test (systemd, Docker) : cycle complet, pannes, arrêts en plein passage | ok |
| QA indépendante : 4 défauts de la page et de la doc, corrigés | ok |
| Documentation : 2 pages nouvelles, 6 mises à jour, relues | ok |

## À faire avant de merger
- [ ] Partie A du guide de test (`qa/guide-test-humain.md`), sur le Mac.
- [ ] Après le merge, partie B sur le serveur : mettre la 1.9 en ligne à la main une dernière fois, installer le déploiement automatique, vérifier la page.

## Ce qui n'a pas marché
- Un test existant de l'espace Candidatures échoue, **déjà sur `main`** : quitter une fiche pendant un enregistrement lent peut perdre la dernière frappe. Ce n'est pas lié à cette version ; c'est au backlog en priorité haute (1.9-1).
- Le banc de test réel a trouvé un vrai défaut, corrigé : le nettoyage après un arrêt du service ne tournait jamais.

## Pour tester
```bash
git switch version/1.9-deploiement-auto
docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot
```
Puis suivre le guide de test, étape par étape.
