---
type: tache
version: 1.2
numero: 09
titre: Documentation livrée
statut: ok
date: 2026-10-26
---

# Tâche 09 — Documentation livrée

> **QA : réussie** · 1 fichier créé, 2 modifiés · 1 correction (durée des tests)

## Ce que ça change
`api/README.md` explique l'installation, la première mise en place, l'exposition, les variables, le mode local, `equipe.js`, l'arrêt, les tests et le contrat HTTP complet. Le README racine y renvoie ; la section des tables de `MODELE.md` décrit les tables réelles.

## Comment tester
Lire `api/README.md` ; dérouler « Première mise en place » sur une base temporaire.

## Critères d'acceptation
- [x] R35 — sections demandées présentes.
- [x] R36 — section des tables de `MODELE.md` remplacée, renvoi vers `api/README.md` ; le reste du document inchangé (`git diff`).

## Ce qui a été fait
- `api/README.md` ; `README.md` (section « L'API de stockage », ligne de test) ; `docs/backend/MODELE.md` (section « Tables SQLite »).
Fichiers : `api/README.md`, `README.md`, `docs/backend/MODELE.md`
Commits : `fd5a15e` docs(api-sqlite): tâche 09 ; `ab9392e` durée des tests

## Résultat QA
| Vérification | Résultat |
|---|---|
| `git diff main -- docs/backend/MODELE.md` | seule la dernière section change |
| Suite complète | 43/43 en ~8 s |
Corrections : « trois tests » et « une vingtaine de secondes » corrigés en « deux » et « une dizaine » après mesure.

## Mutations
Sans objet.

## Spec couverte
R35, R36
