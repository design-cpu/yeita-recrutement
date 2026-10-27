---
type: tache
version: 1.3
numero: 02
titre: Déploiement et contrôle du site
statut: ok
date: 2026-10-26
---

# Tâche 02 — Déploiement et contrôle du site

> **QA : réussie** · 2 fichiers modifiés · 0 correction
> `deploy.sh` attend une API saine quand la version déployée en a une ; `check-site.sh` vérifie que `/api/moi` sans cookie rend 401.

## Ce que ça change
`deploy.sh` attend une API saine quand la version déployée en a une ; `check-site.sh` vérifie que `/api/moi` sans cookie rend 401.

## Comment tester
1. Sur une pile locale : `tools/check-site.sh http://127.0.0.1:4180` → 6 contrôles OK, dont `/api/moi → 401`.
2. Sur le serveur : `deploy/deploy.sh` affiche « API saine. » avant le contrôle du site.
Résultat attendu : un déploiement dont l'api ne devient pas saine échoue avec la commande de retour ; un retour vers un commit sans api réussit.
Tests automatiques : `shellcheck` ; banc ci-dessous.

## Critères d'acceptation
- [x] CA19
- [x] CA20

- [x] Non-régression (R16, R37, CA15) : `node tools/test-store.js`, `cd api && npm test`, les 4 `tools/e2e-*.py` si une page est touchée

## Ce qui a été fait
Fait :
- `deploy/deploy.sh` : après `/ping`, attente de `api` `healthy` (60 s) si `config --services` lu après le changement de commit contient `api`, sinon même échec que `front`
- `tools/check-site.sh` : 6e contrôle `/api/moi` → 401
- Banc : `deploy.sh` dans un conteneur Ubuntu jetable (règle 2 de la 1.1), api malade exprès, retour vers un commit sans api

Fichiers : `deploy/deploy.sh`, `tools/check-site.sh`
Commits : `f1ac129` feat(branchement-api): tâche 02 – deploy.sh attend l'api quand le commit la déclare, check-site.sh contrôle /api/moi
Référentiel : `technique/architecture.md` (scripts, services) mis à jour à l'étape Documentation, avec les autres pages touchées.

Existant réutilisé : `echec`, `arret`, boucle d'attente de `/ping` dans `deploy.sh` ; `controle` dans `check-site.sh` ; banc de la 1.1

## Résultat QA
Banc : moteur Linux jetable `docker:29-dind` ; dépôt nu `/srv/origine.git` (clone du dépôt, branche `main` = branche de version + cette tâche) ; utilisateur `deploy` ; `.env` sans valeurs d'exemple, `COMPOSE_PROFILES=caddy`, `DOMAIN=banc.localhost`.
| Vérification | Résultat |
|---|---|
| `shellcheck` 0.10.0 sur `deploy.sh` et `check-site.sh` | aucune remarque |
| CA19 — `check-site.sh http://127.0.0.1:4180` sur la pile de la tâche 01 | 6 OK, dont `/api/moi → 401` |
| CA20 A — déploiement de la 1.3 | « API saine. », 6 contrôles OK, « Déploiement réussi » |
| CA20 B — **échec provoqué** : sonde dirigée vers `/api/inexistant` (401) | « ÉCHEC : l'api n'est pas saine après 60 s (état : starting ; docker compose logs api). Pour revenir à la version précédente : deploy/deploy.sh 351f500 » |
| CA20 C — retour vers `0186993` (1.2, sans api) | `api` arrêtée et retirée, 5 contrôles OK, « Déploiement réussi », volume `recrutement_data` présent |
| Relance depuis la 1.2 vers le commit malade | **le script de la 1.2 tourne** (lu avant le changement de commit) : pas d'attente de l'api, « Déploiement réussi » avec l'api en `starting` → confirme la consigne du premier déploiement (R32, E2 du tour 1) |
| Relance après correction (script de la 1.3) | « API saine. », « Déploiement réussi » |
Corrections : aucune. Remarque : avec une sonde qui échoue, l'état reste `starting` pendant les 60 s (période de démarrage puis intervalle de 30 s) ; le message le nomme.

## Mutations
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| Attente de l'api (`deploy.sh`) | api rendue malade (sonde vers une route qui rend 401) | ÉCHEC avec la commande de retour | ÉCHEC, message attendu |
| Attente de l'api | forme permise : commit sans service `api` | pas d'attente, réussite | réussite |
| `check-site.sh` `/api/moi` | témoin : la pile répond 401 | OK | OK |

## Spec couverte
R30, R33 ; CA19, CA20
