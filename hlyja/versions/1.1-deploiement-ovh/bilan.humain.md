---
type: bilan
vue: humaine
version: 1.1
statut: terminee
---

# L'espace Candidatures est prêt à être mis en ligne chez Yeita, réservé à l'équipe

> Terminée. Avant de merger : un test d'environ 25 minutes sur ton poste, et la confirmation d'une phrase de `CONTRIBUER.md`.

## Ce qui a été fait
Le site peut maintenant tourner sur le serveur OVH de Yeita, dans Docker, à l'adresse `recrutement.yeita.fr`. L'espace Candidatures et les grilles d'évaluation demandent un compte Google @yeita.fr ; les pages pour les candidats restent ouvertes à tous. Un mode d'emploi guide l'administrateur pas à pas. Deux scripts préparent le serveur et déploient, en vérifiant tout avant d'agir, pour ne rien casser sur un serveur partagé. Les données restent dans le navigateur, comme avant.

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Spec | validée à 94/100 en deux tours (52 au premier) |
| Tâches | 7 sur 7 réussies |
| Revue de code | aucun problème grave ; 3 points importants corrigés |
| Tests | 100 % après correction d'un petit défaut ; tous les anciens tests passent |
| Documentation | page d'architecture, décisions et conventions à jour, glossaire créé |

Deux choix du départ ont changé, avec ton accord : `/index.html` est servi par une seconde règle, et oauth2-proxy ne fait plus confiance aux en-têtes des proxys. Ce second point ferme une vraie faille, trouvée pendant la relecture : un en-tête ajouté à la main permettait d'ouvrir l'espace Candidatures sans connexion.

## À faire avant de merger
- [ ] Suivre les parcours 1 à 4 du guide de test (sur ton poste, avec Docker).
- [ ] Relire les deux lignes modifiées de `CONTRIBUER.md` (qui touche à l'authentification et au déploiement).
- [ ] Après le merge, sur le serveur : suivre `deploy/README.md`, puis tester la connexion avec un compte @yeita.fr et un compte extérieur.

## Ce qui n'a pas marché
Rien à signaler : aucune tâche en échec. Neuf points repérés en chemin sont rangés dans le backlog, dont un seul à traiter assez vite : un lien des pages mène encore à l'ancien site GitHub Pages, qui répond 404.

## Pour tester
```bash
git switch version/1.1-deploiement-ovh
cp .env.example .env
docker compose up -d --build
tools/check-site.sh https://localhost
```
Puis le guide de test, parcours 1 à 4.
