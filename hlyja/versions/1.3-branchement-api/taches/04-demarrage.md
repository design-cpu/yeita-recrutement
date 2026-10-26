---
type: tache
version: 1.3
numero: 04
titre: Démarrage, bandeau et retour sur l'onglet
statut: a-faire
date: 2026-10-26
---

# Tâche 04 — Démarrage, bandeau et retour sur l'onglet

> **À faire**
> `assets/demarrage.js` choisit le mode, pose l'adaptateur d'attente, affiche le bandeau, relaie le retour sur l'onglet ; textes dans `wording.fr.js`.

## Ce que ça change
`assets/demarrage.js` choisit le mode, pose l'adaptateur d'attente, affiche le bandeau, relaie le retour sur l'onglet ; textes dans `wording.fr.js`.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] Contenu et textes

## Ce qui a été fait
À faire :
- `file:` → navigateur ; `/api/moi` classé ; hôte de `YEITA.SITE` ; 10 s ; `/api/equipe` et options
- Adaptateur d'attente dès le chargement
- `DEMARRAGE.pret`, `mode()`, `auRetour(fn)`, `erreur(message, cas)`
- Bandeau collant `.notice.err` `role=alert`, bouton « Recharger » sauf lecture seule, phrase « saisie non enregistrée »
- Garde du 401 (`sessionStorage`, 60 s)
- Clé `serveur` de `wording.fr.js`
- Tests dans `tools/test-serveur.js`, mutations

Existant à réutiliser : `.notice`, `.notice.err` (`candidatures/style.css`), `YEITA.SITE`, `YEITA.esc`

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R1 à R4e, R8, R11, R11b (bandeau), R15 ; Contenu et textes ; CA2, CA3
