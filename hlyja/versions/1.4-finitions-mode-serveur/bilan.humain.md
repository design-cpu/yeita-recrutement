---
type: bilan
vue: humaine
version: 1.4
statut: terminee
---

# Le site de l'équipe dit enfin où sont les candidatures, et n'y mêle plus d'exemples fictifs

> Version terminée, tous les tests passent. Avant de merger : suivre le guide de test (environ 15 minutes).

## Ce qui a été fait
Sur `recrutement.yeita.fr`, le bandeau jaune des pages de Candidatures disait encore « Tout reste dans ce navigateur », alors que les candidatures sont dans la base partagée depuis la v1.3. Il dit maintenant « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. ».

Le tableau ne propose plus de charger des candidats fictifs dans cette base partagée. S'il en reste d'avant, un bouton permet de les retirer, puis disparaît.

Hors du site de l'équipe, rien ne change. L'ancien document du modèle de données, aux liens morts, est supprimé.

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Spec | relue une fois ; la relecture a trouvé un vrai trou (voir ci-dessous) |
| Réalisation | 3 tâches sur 3 |
| Tests | 8 scénarios sur 8, et les 8 suites de tests du projet passent |
| Revue de code | rien de bloquant |
| Documentation | 3 pages et le glossaire à jour |

> Le trou trouvé à la relecture : un clic sur « Charger des exemples » pendant la seconde où la page attend la base aurait écrit 12 candidats fictifs dans la base de l'équipe. Les boutons ne font maintenant rien tant que la page n'est pas sûre d'être dans le navigateur.

## À faire avant de merger
- [ ] Suivre le guide de test humain de la version.
- [ ] Toujours en attente depuis la v1.3 : vérifier la connexion avec un vrai compte Google @yeita.fr sur le serveur, avant d'y mettre de vraies candidatures.

## Ce qui n'a pas marché
Rien à signaler.

Trois sujets voisins vont au backlog : deux textes qui parlent encore du stockage local, le titre « Sauvegarde et exemples », et `CONTRIBUER.md`, qui interdit encore les vraies données. Pour ce dernier, la décision vous revient.

## Pour tester
```bash
git switch version/1.4-finitions-mode-serveur
python3 tools/build.py _site && cd api && npm ci && node equipe.js add moi@yeita.fr Moi admin && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
Ouvrir `http://127.0.0.1:8000/candidatures/`, puis suivre le guide de test.
