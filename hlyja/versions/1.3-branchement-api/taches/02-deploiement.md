---
type: tache
version: 1.3
numero: 02
titre: Déploiement et contrôle du site
statut: a-faire
date: 2026-10-26
---

# Tâche 02 — Déploiement et contrôle du site

> **À faire**
> `deploy.sh` attend une API saine quand la version déployée en a une ; `check-site.sh` vérifie que `/api/moi` sans cookie rend 401.

## Ce que ça change
`deploy.sh` attend une API saine quand la version déployée en a une ; `check-site.sh` vérifie que `/api/moi` sans cookie rend 401.

## Comment tester
À remplir à la réalisation.

## Critères d'acceptation
- [ ] CA19
- [ ] CA20

## Ce qui a été fait
À faire :
- `deploy/deploy.sh` : après `/ping`, attente de `api` `healthy` (60 s) si `config --services` lu après le changement de commit contient `api`, sinon même échec que `front`
- `tools/check-site.sh` : 6e contrôle `/api/moi` → 401
- Banc : `deploy.sh` dans un conteneur Ubuntu jetable (règle 2 de la 1.1), api malade exprès, retour vers un commit sans api

Existant à réutiliser : `echec`, `arret`, boucle d'attente de `/ping` dans `deploy.sh` ; `controle` dans `check-site.sh` ; banc de la 1.1

## Résultat QA
À remplir.

## Mutations
À remplir.

## Spec couverte
R30, R33 ; CA19, CA20
