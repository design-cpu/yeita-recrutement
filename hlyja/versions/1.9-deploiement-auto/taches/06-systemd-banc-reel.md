---
type: tache
version: 1.9
numero: 06
titre: Unités systemd et banc réel
statut: ok
date: 2026-10-28
---

# Tâche 06 — Unités systemd et banc réel

> **QA : réussie** · 3 unités créées · niveau B : 28 vérifications OK, 1 échec du script de test (comptage), le comportement vérifié à la main est le bon
> Le serveur vérifie `main` toutes les 10 minutes et réagit en quelques secondes à une demande de la page ; tout le cycle a tourné sur un vrai systemd avec la vraie pile.

## Ce que ça change
`recrutement-deploy.service` (oneshot, `User=deploy`, `UMask=0077`, `TimeoutStartSec=4h` justifié, `TimeoutStopSec=90`, `ExecStopPost` de nettoyage sous `flock -n`), `recrutement-deploy.timer` (`OnCalendar=*:0/10`), `recrutement-deploy.path` (`PathExists=` seul). Commande d'installation dans `deploy/README.md` § 15.

## Comment tester
Banc `banc-1.7-systemd` (Ubuntu 26.04.1, systemd 259, son propre dockerd), pile en cas B avec `DOMAIN=recrutement.localhost` (le vrai `check-site.sh` passe : 8 `OK`), dépôt nu local, unités installées par la commande du README. Script du niveau B : `scratchpad/b/niveau-b.sh` (hors dépôt, décision P2 : le niveau B n'est pas un outil du projet).

## Critères d'acceptation
- [x] CA14 — `systemd-analyze verify` code 0 ; **le vrai timer** a pris un commit poussé à 13:46 et l'a mis en ligne à 13:50 (35 s) ; l'unité path déclenche le service sur une demande, y compris après `docker compose down` + `docker volume rm` + `up` ; installation : copiée ×3, identique ×3, `DIFFÉRENTE` (code 1), point de montage faux (`ARRÊT`, code 1).
- [x] CA15 — cycle : merge → déployé ; tests KO → noté en échec, rien au passage suivant ; déploiement KO (api jamais saine) → retour automatique réussi en 96 s, par le `deploy.sh` du commit d'avant (marqueur du `deploy.sh` du commit en échec absent du fichier lancé) ; demande par la route (`POST` 202) → unité path → déployé, pause par `adm@yeita.fr` ; nouveau commit en pause : rien ; « reprendre » → pause retirée, dernier de main déployé ; `GET /api/deploiement` rend l'état de l'hôte.
- [x] CA8 — SC1 (service + lancement à la main : attente puis passage) ; SC2 (demande pendant les tests : traitée juste après) ; SC3 (`deploy.sh <ancien>` en SSH pendant les tests → `annule`, l'ancien reste, pause par `deploy.sh`) ; SC5 (`systemctl stop` pendant `test-store` → un `interrompu`, aucun conteneur, worktree ni image d'essai, dépôt propre) ; SC6 (arrêt pendant `deploy` → `interrompu`, alerte, `incertain` ; passage suivant : remis en ligne, alerte effacée). SC4 (deploy.sh pendant le deploy.sh du passage), SC7 et SC8 : couverts au niveau A (refus « déjà en cours », R19 au retour, verrou repris → retour rejoué), pas rejoués au niveau B.
- [x] CA9 — Docker arrêté (`docker.socket` et `docker.service`) : 3 essais en 150 s, l'unité path reste active, la demande laissée est traitée au retour de Docker ; `.env` illisible : « Demande non retirée », au plus un essai par minute, l'unité path reste active.
- [x] CA10 (B) — conteneur de test lu par `docker inspect` : `/home/deploy/.recrutement-deploiement/essai:/w false bridge 1001:1001` ; aucun reste d'essai après les passages.
- [x] CA19 — 1.8 → 1.9 par le `deploy.sh` de la 1.8 (aucune pause) ; commit visé qui modifie `auto-deploy.sh` : l'ancien corps finit (`Result=success`) ; retour depuis un commit dont `deploy.sh` est modifié ; `deploy.sh <hash>` réussi en SSH → la page montre ce commit, non incertain, en pause.

## Ce qui a été fait
Fichiers : `deploy/systemd/recrutement-deploy.service`, `.timer`, `.path`.
Commits : `e28b318`, `805b43c` (`ExecStopPost`).

## Résultat QA
| Essai | Résultat |
|---|---|
| Passage 1 | 11 `FAIL` : (1) `/data/demandes` créé **par root** lors de la vérification V6 sur ce banc → `POST` en 503 (comportement attendu de l'API), puis cascade ; (2) **vrai défaut** : `%h` dans `ExecStopPost` vaut `/root` (`flock: cannot open lock file /root/.recrutement-auto-deploy.lock`), corrigé par `$HOME` dans un `sh -c` (Q18 de la revue) |
| Passage 2 | 12 `FAIL` venus du script de test : `systemctl is-active` répond `activating` pendant un service oneshot, les attentes rendaient la main trop tôt ; message renommé « Demande non retirée » ; marqueur de `deploy.sh` resté d'un essai précédent |
| Passage 3 | 28 `OK`, 1 `FAIL`, ligne finale **`ÉCHECS : 1`** : SC6 comptait les `interrompu` de toute la liste (30 passages, dont ceux des essais 1 et 2) et en attendait 2 ; relevé à la main sur cet essai : `interrompu pendant test-store` (SC5) et `interrompu pendant deploy` (SC6), un chacun ; `incertain` faux, `retour_ko` nul |
Plus aucun `Permission denied` dans le journal après la correction de `ExecStopPost`.

## Mutations
Aucun contrôle automatique ajouté au projet par cette tâche (le niveau B est un essai) ; les gardes des unités sont mises à l'épreuve au niveau A (fiche 03 : A01, A02) et ici par les pannes provoquées.

## Spec couverte
R5, R6 (V12), R9, R15, CA8, CA9, CA10, CA14, CA15, CA19
