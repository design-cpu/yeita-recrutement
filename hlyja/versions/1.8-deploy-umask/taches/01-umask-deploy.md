---
type: tache
version: 1.8
numero: 01
titre: umask dans deploy.sh
statut: ok
date: 2026-10-28
---

# Tâche 01 — umask dans deploy.sh

> **QA de tâche : réussie** · 2 fichiers modifiés · 0 correction
> `deploy.sh` règle lui-même le masque des fichiers : un déploiement lancé depuis un terminal en mode « privé » ne casse plus l'API.

## Ce que ça change
`deploy/deploy.sh` fixe `umask 022` juste après `set -euo pipefail`, avant le verrou et tout `git checkout` / `git pull`. Les fichiers que git réécrit sont en 644, quel que soit le masque du terminal qui lance le script. `deploy/README.md` § 9 dit pourquoi le préfixe `umask 022 &&` reste (R3).

## Comment tester
1. `(umask 077; bash -c "$(sed -n '1,/^umask 022$/p' deploy/deploy.sh); umask"; umask)`
Résultat attendu : `0022` (masque vu par le script), puis `077` (appelant inchangé).
Bout en bout (CA1 à CA3) : QA de version, banc `ubuntu:26.04`.

## Critères d'acceptation
- [x] CA4 — shellcheck sans remarque ; `npm test` `ℹ fail 0`
- [ ] CA1, CA2, CA3 — QA de version (banc)

## Ce qui a été fait
- `umask 022` et son commentaire en l. 8-9 de `deploy/deploy.sh` (+2 lignes : les lignes suivantes sont décalées de 2).
- `deploy/README.md` § 9 : un paragraphe sur le masque fixé par le script et la raison du préfixe.
- `deploy/METTRE-A-JOUR.md` inchangé : sa phrase (« le `umask 022` garantit que les fichiers mis à jour restent lisibles ») reste exacte ; § 4 sans préfixe (R5).
Fichiers : `deploy/deploy.sh`, `deploy/README.md`
Commits : `df8a1fd` feat(deploy-umask): tâche 01 – deploy.sh fixe umask 022 avant toute écriture (fiche 1.7-1)

## Résultat QA
| Vérification | Résultat |
|---|---|
| shellcheck 0.10.0 `-x deploy/*.sh` (`LC_ALL=C.UTF-8`) | code 0, aucune remarque |
| `bash -n deploy/deploy.sh` | syntaxe ok |
| masque vu par le script, lanceur à 077 | `0022` |
| masque de l'appelant après (R2) | `077` |
| `cd api && npm test` | `ℹ tests 58` · `ℹ pass 58` · `ℹ fail 0` |
Corrections : aucune.

## Mutations
Aucun contrôle automatique ajouté ou modifié.

## Spec couverte
R1, R2, R3 (`README.md`), R5, CA4
