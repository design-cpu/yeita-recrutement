---
type: tache
version: 1.10
numero: 01
titre: Base sans changer de version
statut: ok
date: 2026-10-28
---

# Tâche 01 — Base sans changer de version

> **QA : réussie** · 3 fichiers (`api/src/base.js`, `api/test/base.test.js`, `api/test/serveur.test.js` revenu à l'état de `main`) · 1 correction (contrôle de concurrence non déterministe)
> La table des fichiers s'ajoute à la base existante sans changer sa version : la 1.9 relit toujours la base, un retour arrière reste possible.

## Ce que ça change
À la première ouverture par la 1.10, la base de production gagne la table `fichiers` et reste en `user_version` 1. L'API de la 1.9 démarre donc encore sur cette base, et sa suppression d'un candidat efface aussi ses fichiers. Une base déjà à jour s'ouvre sans rien écrire. Une base de test passée en version 2 par la branche de Léo est refusée (à recréer).

## Comment tester
1. `cd api && node --test test/base.test.js`
Résultat attendu : `ℹ pass 10 · ℹ fail 0`.
Tests automatiques : `cd api && npm test` → `ℹ tests 77 · ℹ pass 77 · ℹ fail 0`.

## Critères d'acceptation
- [x] CA1 — base de la 1.9 : table ajoutée, `user_version` 1, dossiers intacts ; ouvertures simultanées (3 processus) et ouverture pendant l'ajout par une autre instance : réussies.
- [x] CA2 (partie API) — base relue avec la règle de la 1.9 (`user_version` 1), cascade de la suppression. La partie pages est la tâche 06.
- [x] CA3 — base en `user_version` 2 ou 3 refusée avec le message existant (le guide de test : tâche 05).

## Ce qui a été fait
- `VERSION_SCHEMA` revient à 1 ; `MIGRATIONS` remplacé par `AJOUTS` (`CREATE TABLE IF NOT EXISTS fichiers`, `CREATE INDEX IF NOT EXISTS fichiers_candidat`) et `TABLES_AJOUTEES`.
- `appliquerSchema` : base à jour (version 1 et tables présentes) → retour sans écrire ; sinon transaction immédiate qui relit la version, crée le schéma si 0, applique `AJOUTS`, pose la version si elle manquait.
- Tests : base neuve (version 1), refus v2 et v3, base 1.9 complétée, ouverture sans écriture (verrou tenu ailleurs), cascade, ajout par une autre instance pendant l'attente, trois ouvertures simultanées. `serveur.test.js` : la ligne de démarrage annonce de nouveau `user_version` 1 (fichier identique à `main`).
Fichiers : `api/src/base.js`, `api/test/base.test.js`, `api/test/serveur.test.js`
Commits : `ca14453` feat(fiche-candidat-harmonisation): tâche 01 – table fichiers ajoutée sans changer de version

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA1 | ok (`base.test.js`, 4 tests) |
| CA2 (API) | ok (« retour vers la 1.9 … ») |
| CA3 | ok (« base d'une version plus récente … ») |
| Non-régression | `cd api && npm test` : `ℹ tests 77 · ℹ pass 77 · ℹ fail 0` |
Corrections : M4 (sans `IF NOT EXISTS`) survivait au test à trois processus, non déterministe ; ajout d'un test où le parent tient le verrou et ajoute la table pendant l'attente du fils.

## Mutations
Copie hors du dépôt, `node --test --test-timeout=30000 test/base.test.js`, classement selon la conclusion de la suite.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| R1 table ajoutée | `fichiers` renommée dans `AJOUTS` | échec | détectée (« base neuve … », « réouverture … ») |
| R1 version 1 | `VERSION_SCHEMA = 2` | échec | détectée (« base neuve », « refus … R1b ») |
| Ouverture sans écriture | retour anticipé supprimé | échec | détectée (« l'ouverture d'une base à jour a attendu le verrou d'écriture ») |
| R1 concurrence | `IF NOT EXISTS` retiré | échec | détectée (« … pendant l'attente », « deux ouvertures simultanées ») |
| R1b refus | les deux contrôles `> VERSION_SCHEMA` passés à `> 99` | échec | détectée (« … refus … R1b ») ; un seul des deux : survivante (contrôles redondants, le second protège une version changée pendant l'attente du verrou) |
| R2 cascade | `ON DELETE CASCADE` retiré | échec | détectée (« retour vers la 1.9 … ») |

## Spec couverte
R1, R1b, R2 (API), CA1, CA2 (API), CA3
