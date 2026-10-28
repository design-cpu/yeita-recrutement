---
type: cadrage
version: 1.8
mode: standard
type_version: livrable
sujet: correction-script-deploiement
date: 2026-10-28
---

# Cadrage — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> Mode standard, version livrable.

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | standard | recommandé et confirmé : la ligne change l'état du processus de `deploy.sh` ; ni modèle, ni dépendance, ni API, ni parcours |
| Type | livrable | correction destinée à être mergée |

## Périmètre
### Ce que le pitch demande
- Actualiser la fiche 1.7-1 (fait au démarrage).
- `deploy/deploy.sh` fixe lui-même `umask 022`, avant toute écriture dans le dépôt (`git checkout`, `git pull`), pour la mise à jour comme pour le retour arrière.
- Aligner la doc qui justifie le `umask 022 &&` comme un contournement, et les numéros de ligne de `deploy.sh` cités par la doc.
### Hors périmètre
- Retirer le `umask 022 &&` de `deploy/METTRE-A-JOUR.md` § 2 et `deploy/README.md` § 9 et § 10 : le premier déploiement qui apporte la correction est lancé par l'ancien script (V6).
- Réparer un dépôt serveur déjà abîmé par un ancien déploiement à `umask 077` (fichiers 600 non réécrits par git) : candidat au backlog.
- `chmod` ou `COPY --chmod` dans les Dockerfiles : extension.
- Les `umask 077` de `deploy/backup.sh`, `deploy/verif-disque.sh`, `deploy/commun.sh` (voulus).
- Test automatique de `deploy.sh` (il n'en existe aucun).

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Banc des scripts serveur | conteneur `ubuntu:26.04` privilégié avec son dockerd, dépôt nu local | réutiliser | [Conventions](../../../technique/conventions.md) |
| Contrôle de style | shellcheck 0.10.0 (`LC_ALL=C.UTF-8`) | réutiliser | [Conventions](../../../technique/conventions.md) |
| Contrôle du site | `tools/check-site.sh` (accepte `*.localhost`) | réutiliser | [Déploiement OVH](../../../technique/deploiement-ovh.md) |
