---
type: bilan
vue: humaine
version: 1.8
statut: terminee
---

# Le script de mise à jour règle lui-même les droits des fichiers

> Terminée et testée. Avant de merger, suis le guide de test (10 minutes sur ton Mac). À la première mise à jour réelle, garde bien `umask 022 &&` au début de la commande.

## Ce qui a été fait
Avant, si le terminal du serveur était réglé en « fichiers privés », une mise à jour réécrivait des fichiers que seul le compte `deploy` pouvait lire. Dans les images Docker, l'API tourne sous un autre compte : elle ne pouvait plus les lire et ne démarrait pas.

Désormais, `deploy.sh` impose lui-même le bon réglage (`umask 022`) avant de toucher au moindre fichier. Peu importe le réglage du terminal, la mise à jour comme le retour arrière donnent des fichiers lisibles.

La doc a été mise à jour. Elle garde `umask 022 &&` devant la commande, parce que la toute première mise à jour vers cette version est encore lancée par l'ancien script.

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Spec | validée après une relecture (5 remarques prises en compte) |
| Correction | 2 lignes dans `deploy.sh`, faite du premier coup |
| Relecture du code | rien de bloquant |
| Tests | 6 sur 6 réussis sur un faux serveur Ubuntu ; avec l'ancien script, le même essai casse bien l'API |
| Doc | 3 pages mises à jour, 4 erreurs corrigées au passage |

## À faire avant de merger
- [ ] Suivre le guide de test humain de la version.
- [ ] À la première mise à jour réelle : garder `umask 022 &&` au début de la commande, puis faire le contrôle du guide sur le serveur.

## Ce qui n'a pas marché
Rien à signaler. Une exception rare est maintenant écrite dans la page de mise à jour : si un retour vers une version d'avant la v1.8 échoue, il faut relancer la commande de retour avec `umask 022 &&` devant.

Il reste au backlog un cas plus rare : un serveur déjà abîmé par un ancien déploiement. Le contrôle du guide dira s'il existe.

## Pour tester
```bash
git switch version/1.8-deploy-umask
```
Puis suis le guide de test humain de la version.
