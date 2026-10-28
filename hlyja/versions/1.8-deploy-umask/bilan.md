---
type: bilan
version: 1.8
statut: terminee
mode: standard
type_version: livrable
taches_ok: 1
taches_echec: 0
qa_taux: 100
date: 2026-10-28
---

# Bilan — Version 1.8

> **Terminée** · spec validée après une revue (5 retours intégrés) · 1/1 tâche ok · QA 6/6, témoin en échec comme attendu
> `deploy/deploy.sh` fixe `umask 022` : une mise à jour ou un retour arrière lancé depuis un shell à `umask 077` ne casse plus l'API ni le site (fiche 1.7-1).
> Avant de merger : suivre `qa/guide-test-humain.md` (~10 min sur le Mac). Au premier déploiement réel de la 1.8, garder le préfixe `umask 022 &&`.

## Résultat
| Étape | Résultat |
|---|---|
| Spec | validée ; revue technique et produit : 3 majeurs et 2 mineurs, tous intégrés |
| Tâches | 1 ok, 0 échec |
| Revue de code | 0 bloquant, 0 majeur, 4 mineurs (2 prévus à la doc, 1 traité après la QA, 1 sans effet) |
| QA | 6 scénarios sur 6 réussis en banc `ubuntu:26.04.1` (dockerd 29.1.3) ; témoin avec le `deploy.sh` de `main` : 600, `EACCES`, `ÉCHEC : l'api n'est pas saine`, page du site en 403 |
| Suites | shellcheck 0.10.0 : code 0 ; `npm test` : `ℹ tests 58` · `ℹ pass 58` · `ℹ fail 0` |
| Doc | 3 pages techniques mises à jour (`mise-a-jour-production`, `deploiement-ovh`, `architecture`) et leurs vues humaines ; 4 erreurs de source corrigées ; `deploy/README.md` § 9, `deploy/METTRE-A-JOUR.md` § 4 |
| Chef d'équipe | plan et P4 : ok, aucun ajout non demandé ; le 5e CA est un contrôle de routine (shellcheck, doc), pas un scénario de plus |

## Tester en local
```bash
git switch version/1.8-deploy-umask
```
Puis suivre `qa/guide-test-humain.md` (témoin avec l'ancien script, puis correction, dans une copie jetable du dépôt).

## Reste à faire avant de merger
- Suivre le guide de test humain.
- Au premier déploiement réel de la 1.8 : lancer la commande de `deploy/METTRE-A-JOUR.md` § 2 **avec** son préfixe `umask 022 &&` (c'est l'ancien `deploy.sh` qui tourne), puis le contrôle `find` du guide (si d'autres fichiers que `./.env` sortent : fiche 1.8-1).

## Réserves
Aucune.

## Écarts avec la spec
- R5 disait les retours arrière d'urgence toujours couverts par le script. Il reste une exception (revue de code, constat 1, confirmée par la QA) : après l'échec d'un retour vers un commit d'avant la 1.8, le `deploy.sh` du disque est l'ancien. Traitée dans la doc : exception ajoutée à `deploy/METTRE-A-JOUR.md` § 4 et à `technique/mise-a-jour-production.md` (étape 4).
- `deploy/METTRE-A-JOUR.md` § 2 est inchangé : sa phrase (« le `umask 022` garantit que les fichiers mis à jour restent lisibles ») reste exacte ; la raison complète est dans `deploy/README.md` § 9.

## Tâches en échec
Aucune.

## Changelog
- Corrigé : une mise à jour ou un retour arrière lancé depuis un terminal réglé en « fichiers privés » (`umask 077`) ne rend plus l'API et le site illisibles dans leurs images (fiche 1.7-1).
- Modifié : `deploy/README.md` § 9 explique pourquoi le préfixe `umask 022 &&` reste ; `deploy/METTRE-A-JOUR.md` § 4 donne l'exception du retour vers une version d'avant la 1.8.
- Technique : `deploy/deploy.sh` fixe `umask 022` en l. 9, avant toute écriture.

## Backlog
- Ajoutées : [1.8-1](../../backlog/1.8-1-depot-serveur-deja-abime.md) Un dépôt serveur déjà abîmé par un déploiement à umask 077 construit encore des images illisibles (dette, basse)
- Nouvelles occurrences : aucune
- Traitées par cette version : [1.7-1](../../backlog/1.7-1-deploy-sans-umask.md) → fait

## Couverture de la doc
| Élément | Page |
|---|---|
| R1, R2 (masque fixé par le script) | [Mise à jour en production](../../technique/mise-a-jour-production.md), [Architecture](../../technique/architecture.md), [Déploiement OVH](../../technique/deploiement-ovh.md) |
| R3 (préfixe gardé, raison) | [Mise à jour en production](../../technique/mise-a-jour-production.md), [Déploiement OVH](../../technique/deploiement-ovh.md), `deploy/README.md` § 9 |
| R4 (numéros de ligne) | [Mise à jour en production](../../technique/mise-a-jour-production.md), [Déploiement OVH](../../technique/deploiement-ovh.md) |
| R5 et son exception | [Mise à jour en production](../../technique/mise-a-jour-production.md), `deploy/METTRE-A-JOUR.md` § 4 |
Aucune règle métier : pas de doc produit concernée.
