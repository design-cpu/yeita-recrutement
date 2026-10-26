---
type: tache
version: 1.2
numero: 01
titre: Socle de api/
statut: ok
date: 2026-10-26
---

# Tâche 01 — Socle de api/

> **QA : réussie** · 3 fichiers créés, 2 modifiés · 0 correction
> Le dossier api/ s'installe, se teste et n'est jamais publié avec le site.

## Ce que ça change
`api/` a son manifeste, ses trois dépendances à version exacte et son `package-lock.json`. L'installation ignore les scripts (pas de compilation, V3, V21). La construction du site ne copie plus `api/`, et git ignore `node_modules` et la base.

## Comment tester
1. `cd api && npm ci && npm audit`
2. `python3 tools/build.py /tmp/site && ls /tmp/site`
Résultat attendu : 0 vulnérabilité ; pas de dossier `api` dans le site.

## Critères d'acceptation
- [x] CA1 (partie dépendances) — 3 dépendances exactes, `npm audit` : 0 vulnérabilité. L'essai sous `node:22-bookworm-slim` est fait à la QA de version.
- [x] CA16 (partie publication) — `api` absent du site construit ; `git status` ne montre pas `node_modules`.

## Ce qui a été fait
- `api/package.json` (`type: module`, `engines`, scripts `start` et `test`), `api/package-lock.json`, `api/.npmrc` (`ignore-scripts=true`).
- `tools/build.py` : `api` dans `SKIP`. `.gitignore` : `api/node_modules/`, `api/data/`.
Fichiers : `api/package.json`, `api/package-lock.json`, `api/.npmrc`, `tools/build.py`, `.gitignore`
Commits : `9884ec8` feat(api-sqlite): tâche 01 – socle de api/

## Résultat QA
| Vérification | Résultat |
|---|---|
| `npm audit` | 0 vulnérabilité |
| `python3 tools/build.py` | `api` absent du site |
| `git status` | `node_modules` non listé |
Corrections : aucune.

## Mutations
Sans objet : aucun contrôle automatique ajouté.

## Spec couverte
R1, R2, R3, R33, R34 ; CA1, CA16
