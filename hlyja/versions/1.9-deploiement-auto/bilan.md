---
type: bilan
version: 1.9
statut: terminee
mode: complexe
type_version: livrable
score: 86
tours: 2
taches_ok: 8
taches_echec: 0
qa_taux: 100
date: 2026-10-28
---

# Bilan — Version 1.9

> **Terminée** · Spec validée à 86/100 en 2 tours (55 au tour 1) · 8/8 tâches ok · QA 100 % après corrections (87 % à la QA) · aucun bloquant
> Avant de merger : partie A du guide de test (Mac, ~10 min). Après le merge : partie B sur le serveur (mise en service, ~40 min).
> `tools/e2e-serveur.py` finit sur `ÉCHECS` à cause d'un seul `FAIL` qui existe déjà sur `main` (fiche [1.9-1](../../backlog/1.9-1-depart-page-put-lent-409.md), priorité haute).

## Résultat
| Étape | Résultat |
|---|---|
| Spec | validée, 86/100, 2 tours ; 3 décisions de l'utilisateur (retour automatique, refus avant la 1.9, ligne principale de `main`) |
| Tâches | 8 ok, 0 échec |
| Revue de code | 0 bloquant ; 4 majeurs et 12 mineurs corrigés ; 9 mineurs ouverts (5 au backlog, 2 voulus, 2 documentés) ; 1 défaut trouvé par le banc réel (`%h` dans `ExecStopPost`) |
| Tests | banc A `TOUT OK` (95) ; niveau B sur systemd réel `TOUT OK` (31) ; `npm test` 65/65 ; `test-store`, `test-serveur`, sauvegardes, 4 e2e `ALL OK` ; `e2e-serveur` 91 OK + 1 FAIL préexistant ; shellcheck et `systemd-analyze verify` sans remarque |
| Mutations | 42 : 9 API + 22 niveau A + 7 après la revue + 4 page + 1 `adminRequis` partagé ; toutes détectées sauf 1 non observable (écriture par renommage, API) ; 3 survivantes au premier essai (deux contrôles qui se masquaient, comptage figé à 30 passages) renforcées puis détectées |
| QA | 30/30 après corrections ; 4 défauts trouvés (focus perdu à la relecture, annonces du lecteur d'écran, « tests de l'api », message du README) corrigés et revérifiés ; 1 manuel (serveur) |
| Doc | 2 pages créées (produit et technique « Déploiement automatique »), 6 pages techniques mises à jour, 6 termes du glossaire ; 13 erreurs de source signalées par le rédacteur-relecteur, toutes corrigées ; 7 vues humaines |

## Tester en local
```bash
git switch version/1.9-deploiement-auto
docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot
(cd api && npm test)
```
Puis suivre `qa/guide-test-humain.md` (partie A sur le Mac, partie B sur le serveur après le merge).

## Reste à faire avant de merger
- Partie A du guide de test (Mac).
- Après le merge : partie B (premier passage à la 1.9 à la main, installation des unités, rôle admin, page verte, « Déployer maintenant », retour par « Déployer ce commit », « Reprendre »).

## Réserves
Aucune (spec `validee`).

## Écarts avec la spec
- **Ajouts nés de la revue de code et de la QA**, dans l'esprit des règles : dossier des demandes remplacé par un lien refusé (S1), octet NUL refusé (S4), retour rejoué une fois quand une sauvegarde reprend le verrou (Q1), demande non retirée sans passage enregistré (Q2), refus « déjà en cours » avant changement classé `annule` (Q4), code de sortie non nul seulement pour les échecs (Q13), focus gardé et annonces sans répétition sur la page (QA B1, B2), version du script au journal (QA R1).
- **Formats** : `incertain` est au premier niveau de `deploiement.json` (l'exemple de la spec le mettait dans `en_ligne`) ; `deploy/PAUSE` tient sur 3 lignes `clé=valeur` (R14 disait « une ligne ») ; écrits dans [Déploiement automatique](../../technique/deploiement-automatique.md#fichiers-et-formats-contrat-r15-lisibles-par-lauto-deploysh-de-la-19).
- **Ordre d'un passage** : reprise des passages interrompus et nettoyage avant la prise de la demande (R20 → R9 → R6), décrit dans la page technique.
- **Niveau B** : SC4, SC7 et SC8 couverts au niveau A seulement (faux docker), pas rejoués sur le banc systemd.
- **Mutations** : 42 pour un repère de 15 à 22 (P4) : le niveau A atteint seul le plafond des 22 gardes ; le reste vient de l'API, de la page et des corrections de la revue et de la QA.

## Tâches en échec
Aucune.

## Changelog
- Ajouté : un merge sur `main` est mis en ligne tout seul dans les 10 minutes si les tests passent (règles du parcours, API, construction des images), sans GitHub Actions ; un commit dont un test échoue n'est jamais mis en ligne.
- Ajouté : la page `/admin/deploiement.html` (admins) dit en une phrase si le site est à jour, montre les 30 derniers passages avec la sortie de chaque étape, et permet de déployer maintenant, de revenir à un ancien commit (pause) et de reprendre l'automatisme.
- Ajouté : une mise en ligne ratée revient seule au commit d'avant ; un retour raté ou une mise en ligne interrompue s'affiche en rouge avec la commande à lancer.
- Modifié : `deploy/deploy.sh <commit>` lancé à la main sur un autre commit que le dernier de `main` met le déploiement automatique en pause ; il note chaque mise en ligne réussie.
- Modifié : le contrôle du site vérifie aussi que `/admin/deploiement.html` exige la connexion (8 contrôles).
- Corrigé : la boucle d'attente de « Maintenance de Docker » (`deploy/README.md`) attend vraiment la fin des tâches en cours.
- Technique : `deploy/auto-deploy.sh`, unités `recrutement-deploy.service`, `.timer`, `.path` ; routes `GET /api/deploiement` et `POST /api/deploiement/demande` ; banc `tools/test-auto-deploy.sh` (faux docker, et `--reel` sur un banc systemd).

## Backlog
- Ajoutées : [1.9-1](../../backlog/1.9-1-depart-page-put-lent-409.md) dernière frappe perdue en quittant une fiche pendant un enregistrement lent (préexistant, haute) · [1.9-2](../../backlog/1.9-2-unites-modifiees-jamais-signalees.md) unités systemd modifiées jamais signalées · [1.9-3](../../backlog/1.9-3-demandes-repetees-sans-limite.md) demandes répétées sans limite · [1.9-4](../../backlog/1.9-4-conteneurs-de-test-sans-limites.md) conteneurs de test sans limites · [1.9-5](../../backlog/1.9-5-reglages-auto-deploy-sans-trace.md) réglages de durée sans trace
- Nouvelles occurrences : [1.7-6](../../backlog/1.7-6-alertes-email-sauvegardes.md) (aucune alerte pour un retour raté), [1.7-7](../../backlog/1.7-7-tableau-de-bord-admin.md) (deux pages admin sans accueil), [1.1-4](../../backlog/1.1-4-disque-images-de-construction.md) (cache de construction des essais), [1.1-6](../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) (conteneur jetable recopié)
- Traitées par cette version : aucune.

## Couverture de la doc
| Élément | Page |
|---|---|
| R1–R20 (spec) | [Déploiement automatique (produit)](../../doc/produit/deploiement-automatique.md#règles-métier) |
| Ordre d'un passage, formats, contrat R15 | [Déploiement automatique (technique)](../../technique/deploiement-automatique.md) |
| Routes `GET /api/deploiement`, `POST /api/deploiement/demande`, `adminRequis` | [API](../../technique/api.md#routes) |
| `deploy/auto-deploy.sh`, unités `recrutement-deploy`, pause de `deploy.sh`, 8e contrôle | [Architecture](../../technique/architecture.md#scripts) |
| Décisions (sans GitHub Actions, frontière, commits admis, retour et pause) | [Décisions](../../technique/decisions.md) |
| `tools/test-auto-deploy.sh`, e2e de la page, shellcheck `-f gcc` | [Conventions](../../technique/conventions.md#tests) |
| Gestes de la 1.9, retour avant la 1.9 | [Mise à jour en production](../../technique/mise-a-jour-production.md) |
| Passage, pause, demande, retour automatique, ligne principale, commit incertain | [Glossaire](../../glossaire.md) |
