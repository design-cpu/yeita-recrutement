---
type: bilan
vue: humaine
version: 1.10
statut: terminee
---

# La branche de Léo, prête à passer en production

> Terminée. Avant de merger : la partie A du guide de test sur ton Mac (15 minutes), puis **la partie B sur le serveur** (10 minutes, réglage de nginx). Après le merge : la partie C sur le site (10 minutes).

## Ce qui a été fait
La branche `feat/fiche-candidat-harmonisation` de Léo a été rejouée sur `main` dans `version/1.10-fiche-candidat-harmonisation`. Son numéro (1.7) était déjà pris : elle devient la 1.10.
Ce que Léo a construit est gardé tel quel : la fenêtre « Fiche du candidat » pour ajouter un candidat, le CV et le portfolio en fichier ou en lien, et des pages d'étapes harmonisées (même largeur, Notes à côté, EC1, EC2 et Bilans retouchés).
Ce qui empêchait de la mettre en production a été corrigé :
- **Retour arrière.** La base passait dans une nouvelle version que la 1.9 ne savait plus lire : un retour arrière automatique aurait échoué. La table des fichiers s'ajoute maintenant sans changer la version de la base.
- **nginx.** Le serveur du site refusait tout fichier de plus de 1 Mo. Le guide dit maintenant comment le régler, **avant** de merger.
- **Doublon.** Un envoi de CV raté, puis un second clic, créaient deux fois le même candidat. Ce n'est plus possible.
- **CV fantômes.** Un CV pouvait rester gardé sans être visible, ou être affiché alors qu'il avait été effacé. La fiche et les fichiers restent maintenant toujours d'accord, et un CV oublié est effacé seul au bout d'une heure.
- **Faille.** Un lien piégé collé comme CV devenait cliquable. Il s'affiche maintenant en simple texte.
- **Lecture seule.** Un compte en lecture voyait des boutons pour déposer ou retirer un CV. Ils sont cachés.

## Ce qui va, ce qui n'allait pas
| Dans la branche de Léo | |
|---|---|
| Fiche du candidat, dépôt de fichiers vérifiés, effacement réel, pages harmonisées, aucune dépendance ajoutée | allait |
| Retour vers la 1.9, nginx, doublon, CV fantômes, lien piégé, message d'erreur trompeur, restauration, description périmée | corrigé |

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Rejeu sur `main` : 4 conflits, tous dans la doc | ok |
| Spec : 69 puis 93 sur 100, validée au 2e tour ; tu as tranché 5 points | ok |
| 7 tâches | ok |
| Revue de code : aucun problème grave, 7 corrections, dont 1 défaut que j'avais introduit (style de la carte), corrigé | ok |
| QA indépendante : 26 scénarios, 1 défaut (lecture seule), corrigé | ok |
| Essais avec le vrai code de la 1.9 et un vrai nginx | ok |
| Documentation : 1 page nouvelle, 6 mises à jour, relues | ok |

## À faire avant de merger
- [ ] Partie A du guide de test (`qa/guide-test-humain.md`), sur le Mac.
- [ ] Partie B, sur le serveur, **avant** de cliquer « Merge » : sauvegarde, réglage de nginx, vérification.
- [ ] Prévenir Léo : une base locale de test créée avec sa branche est à recréer.

## Ce qui n'a pas marché
- Un test automatique de l'espace Candidatures échoue, **déjà sur `main`** : quitter une fiche pendant un enregistrement lent peut perdre la dernière frappe. Ce n'est pas lié à cette version ; c'est au backlog en priorité haute (1.9-1).
- Pendant un essai, j'ai arrêté Docker Desktop par erreur (en arrêtant un programme par son port). Je l'ai relancé ; deux conteneurs de banc des versions précédentes sont restés arrêtés.

## Au backlog
9 idées ou petites dettes repérées en route, aucune urgente : par exemple noter au journal le retrait d'un CV, protéger encore davantage les fichiers ouverts dans le navigateur, nettoyer du code mort dans l'EC2. Et les sujets de Léo : sortir l'Onboarding du parcours, la purge à 22 mois.

## Pour tester
```bash
git switch version/1.10-fiche-candidat-harmonisation
cd api && npm ci && npm test; cd ..
```
Puis suivre le guide de test, étape par étape.
