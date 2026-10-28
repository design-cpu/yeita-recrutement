---
type: tache
version: 1.10
numero: 06
titre: Retour vers la 1.9 : pages de main
statut: ok
date: 2026-10-28
---

# Tâche 06 — Retour vers la 1.9 : pages de `main`

> **QA : réussie** · aucun fichier du projet (essai de QA documenté, sans outil : P3)
> Après un retour vers la 1.9, rien n'est perdu : les CV restent en base et réapparaissent avec la 1.10.

## Ce que ça change
Rien dans le code : la tâche prouve R2 avec le vrai code de `main`.

## Comment tester
Dans le conteneur Playwright, deux copies du dépôt (`main` à `b727ded` dans un worktree jetable, et cette branche), `api/node_modules` partagé, Node 22 :
1. API de la 1.10 sur une base neuve : création d'un candidat à l'EC1, dépôt d'un CV par `POST …/fichiers`, dossier enregistré avec sa référence et sa ligne `type: "fichier"`. API arrêtée.
2. API et pages de `main` sur la même base : page du candidat, historique, `STORE.undoLast`, saisie du téléphone dans la fiche ⋯.
3. API de la 1.10 de nouveau : enregistrement du dossier, liste des fichiers.

## Critères d'acceptation
- [x] CA2 (pages) — sorties :
```
1.10 : dossier avec CV 200
1.9 : page ouverte, erreurs de script : []
1.9 : historique : 28 octobre à 10:00 | undefined → undefined, Alice | 28 octobre à 09:30 | Appel de découverte → EC1, Alice | …
1.9 : Annuler le dernier passage : refus : Le dernier passage ne correspond plus à l'étape en cours.
1.9 : saisie enregistrée : 06 19 19 19 19 | référence gardée : True | erreurs : []
retour 1.10 : enregistrement 200 | fichier toujours là : True
```

## Ce qui a été fait
Essai décrit ci-dessus ; script jetable dans le dossier de travail de la session, hors du projet.

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA2 (pages) | ok : la dégradation est exactement celle de R2 |

## Mutations
Aucun contrôle automatique ajouté.

## Spec couverte
R2, CA2 (pages)
