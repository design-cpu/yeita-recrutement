---
type: plan-de-test
version: 1.9
scenarios: 31
date: 2026-10-28
---

# Plan de test — Déploiement automatique de main après les tests

> 31 scénarios couvrant les 19 critères d'acceptation · 8 couches couvertes (unitaire, intégration, composant / UI, bout en bout, non-régression, accessibilité, sécurité, manuel), 1 écartée (performance) · 23 automatisés lancés par la QA, 7 au banc systemd réel (niveau B, en cours au moment de la QA), 1 manuel (guide, partie B)

QA indépendante, plan écrit à partir de la spec finale (R1–R20, CA1–CA19), des fiches `taches/`, de la revue de code et de `technique/conventions.md`. Version testée : `5e41a2d` (branche `version/1.9-deploiement-auto`), comparée à `main` = `b066b31` pour la non-régression.

Environnements :
- **Mac** (zsh 5.9, Node 26.11.1, Docker Desktop 29.9.2) : `test-store`, `test-serveur`, `npm test` (sous `umask 022`), `npm audit`, partie A du guide rejouée pour de vrai sous zsh.
- **Banc A** : image `banc-1.7` (Ubuntu 26.04, docker CLI et compose, git, python3, util-linux), `tools/test-auto-deploy.sh` (faux docker, vrais git et flock, `env -i` et `umask 022` à chaque lancement) ; banc `banc-sauvegarde` pour `tools/test-sauvegarde.sh`.
- **Conteneur Playwright** `mcr.microsoft.com/playwright/python:v1.63.0-noble` + Node 22 copié : les 5 e2e, sur un instantané de la branche et un instantané de `main` (`git archive`, même `api/node_modules`, lockfile identique).
- **Banc systemd jetable** `qa19-sd` (image `banc-1.7-systemd`, Ubuntu 26.04.1, systemd 259, lancé et supprimé par la QA) : `systemd-analyze verify`, commande d'installation de `deploy/README.md` § 15 dans ses trois cas. Le banc `banc19` (niveau B, `--reel`) n'a pas été touché : son résultat est attendu.

## Matrice
| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Non-régression | Accessibilité | Sécurité | Manuel |
|---|---|---|---|---|---|---|---|---|
| CA1 commit testé et déployé | — | S1 (banc A) | — | S21 (B, en cours) | S28 | — | — | S31 |
| CA2 étape KO | — | S2 | — | — | — | — | — | — |
| CA3 déploiement KO, retour | — | S3 | — | S21 (B) | — | — | — | — |
| CA4 pause, demande, reprendre | — | S4 | — | S21 (B) | — | — | — | S31 |
| CA5 création de `PAUSE` | — | S5 (vrai `deploy.sh`) | — | — | — | — | — | — |
| CA6 refus | S15 (lecture côté API) | S6 | — | — | — | — | S6, S29 | — |
| CA7 fenêtre retrait / lecture | — | S7 | — | — | — | — | — | — |
| CA8 concurrence SC1–SC8 | — | S8 (A : SC1, SC3, SC8, R7, R10, R19) | — | S9 (B, en cours) | — | — | — | — |
| CA9 sorties rapides | — | S10 (A) | — | S11 (B, en cours) | — | — | — | — |
| CA10 images, isolement | — | S12 (A) | — | S13 (B, en cours) | — | — | S12 | — |
| CA11 `deploiement.json` hostile | — | S14 | — | — | — | — | S14 | — |
| CA12 routes | S15 (`npm test`) | S15 | — | — | S28 | — | S15 | — |
| CA13 page | — | — | S16 (e2e-serveur), S27 | — | — | S17, S18 | S16 (texte hostile) | S30, S31 |
| CA14 unités | — | S19 (verify, installation) | — | S20 (B, en cours) | — | — | — | S31 |
| CA15 cycle complet | — | — | — | S21 (B, en cours) | — | — | — | S31 |
| CA16 `check-site.sh` | — | S22 (B, en cours) | — | — | — | — | — | — |
| CA17 shellcheck, suites | — | S23 | — | — | S28 | — | — | — |
| CA18 documentation | — | S24, S25 | — | — | — | — | — | S30 |
| CA19 script qui se remplace | — | — | — | S26 (B, en cours) | — | — | — | S31 |

## Couches écartées
| Couche | Raison |
|---|---|
| Performance | Aucun enjeu de volume : un passage par 10 minutes, 30 passages gardés, 300 lignes par étape (bornes vérifiées par S14) |

Unitaire : seule la lecture de la demande côté API est une fonction isolée testable (`lireDemande`, S15) ; la logique de `auto-deploy.sh` n'existe qu'en script entier, testée en intégration au banc A.

## Scénarios
| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | Nouveau commit : 4 étapes OK, durée, sortie, `deploye` mis à jour | CA1 | intégration | oui (`tools/test-auto-deploy.sh`, banc A) |
| S2 | Chacune des 3 étapes KO : suivantes non lancées, commit en échec, passage suivant sans enregistrement | CA2 | intégration | oui (banc A) |
| S3 | `deploy.sh` KO : avant / après changement, retour KO, redéploiement raté, pas de boucle | CA3 | intégration | oui (banc A) |
| S4 | Pause, demande traitée en pause, « reprendre », lancement à la main avec demande en attente | CA4 | intégration | oui (banc A) |
| S5 | `PAUSE` créée ou non selon le lanceur ; dépôt propre | CA5 | intégration | oui (banc A, partie D) |
| S6 | Refus : format, introuvable, branche fusionnée, < 1.9, demande mal formée (doublon, action, lien, taille, NUL) | CA6 | intégration / sécurité | oui (banc A) |
| S7 | Demande posée entre retrait et lecture ; deux demandes → la plus récente | CA7 | intégration | oui (banc A) |
| S8 | Concurrence au niveau A : SC1, SC3, SC8, verrous R7 et R10, R19 | CA8 | intégration | oui (banc A) |
| S9 | SC1–SC8 sur le vrai systemd | CA8 | bout en bout | oui (`--reel`, banc `banc19`) |
| S10 | Docker muet, demande non retirée : attente, pas d'enregistrement | CA9 | intégration | oui (banc A) |
| S11 | Docker arrêté, `.env` et dossiers illisibles sur le vrai systemd | CA9 | bout en bout | oui (`--reel`) |
| S12 | Arguments des conteneurs de test, surcharge des noms, suppression par nom sans `-f` | CA10 | intégration / sécurité | oui (banc A) |
| S13 | Images de production intactes, `docker inspect` des montages | CA10 | bout en bout | oui (`--reel`) |
| S14 | JSON valide avec sorties hostiles, 300 lignes, 30 passages, vue falsifiée sans effet | CA11 | intégration / sécurité | oui (banc A) |
| S15 | Routes : 403, 415, 400, `par`, demande identique, 503, `GET` | CA12 | unitaire / intégration | oui (`npm test`) |
| S16 | Page : 12 verdicts, bandeaux, boutons, confirmations, double clic, texte hostile, rôle lecture | CA13 | composant / UI | oui (`tools/e2e-serveur.py`) |
| S17 | Accessibilité : `role=status`, arbre d'accessibilité du verdict, Tab jusqu'aux `<summary>`, Entrée ouvre et referme, contour de focus, étape et bouton au clavier | CA13 (UX) | accessibilité | oui (`tools/e2e-serveur.py`, 7 vérifications ajoutées par la QA) |
| S18 | Accessibilité pendant la relecture de 10 s : le focus clavier reste sur le passage, le verdict inchangé n'est pas réannoncé | CA13 (UX) | accessibilité | oui (sonde hors dépôt) |
| S19 | `systemd-analyze verify` des 3 unités ; installation : copiée, identique, différente | CA14 | intégration | oui (banc `qa19-sd`) |
| S20 | Timer et path déclenchent le service, y compris après recréation du volume ; attentes réduites | CA14 | bout en bout | oui (`--reel`) |
| S21 | Cycle : merge → déployé ; tests KO ; déploiement KO → retour ; demande → « Déployer ce commit » → pause → « Reprendre » | CA15 | bout en bout | oui (`--reel`) |
| S22 | `check-site.sh` : `/admin/deploiement.html` → 302 vers Google | CA16 | intégration | oui (`--reel`, vrai `check-site.sh`) |
| S23 | shellcheck sans remarque ; banc sous `env -i` et `umask 022` ; refus sans `AUTO_DEPLOY_JETABLE=oui` | CA17 | intégration | oui |
| S24 | Blocs des docs : `bash -n` et `zsh -n` | CA18 | intégration | oui (extraction des blocs) |
| S25 | Tableau « Lire un échec » de `deploy/README.md` : chaque message du journal existe dans `auto-deploy.sh` | CA18 | intégration | non (lecture croisée) |
| S26 | Tableau R15 rejoué (1.8 → 1.9, `auto-deploy.sh` modifié, retour, `deploy.sh <hash>`) | CA19 | bout en bout | oui (`--reel`) |
| S27 | Libellés d'étape dans « Interrompu pendant … » et dans le verdict d'interruption | CA13 (textes) | composant / UI | oui (sonde hors dépôt) |
| S28 | Non-régression : `test-store`, `test-serveur`, `npm test`, `npm audit`, sauvegardes, 5 e2e (comparés à `main`) | CA17 | non-régression | oui |
| S29 | Sécurité : non-admin et lecture refusés (API et page), texte hostile, lien, NUL, doublon, `par` du membre | CA6, CA12, CA13 | sécurité | oui (S6, S15, S16) |
| S30 | Partie A du guide rejouée pour de vrai sous zsh (copie, tests, banc, page locale, demande écrite) | CA13, CA18 | manuel (rejoué) | oui (QA) |
| S31 | Partie B du guide : premier déploiement, unités, page verte, « Déployer maintenant », retour arrière, journal | CA1, CA4, CA14, CA15, CA19 | manuel | non |

## Détail des scénarios
### S17 — Accessibilité au clavier et lecteur d'écran
Préconditions : état « à jour », deux passages « Mis en ligne » (le second pas en ligne). · Étapes : lire `role` et `aria-live` de `#verdict` et `#retour` ; `aria_snapshot()` du verdict ; Tab depuis le haut de la page jusqu'au premier `<summary>` ; Entrée deux fois ; Tab vers l'étape, Entrée ; focus sur le second passage, Entrée, Tab jusqu'à « Déployer ce commit ». · Attendu : `status`/`polite` ×2 ; le lecteur lit « status » puis le titre du verdict ; ordre « Déployer maintenant », « Actualiser », passage ; contour `solid` ; ouvert puis refermé ; sortie visible ; bouton atteint. Mise à l'épreuve : `role` retiré et `:focus-visible` neutralisé dans une copie → 3 vérifications en échec.
### S18 — Relecture de 10 s
Préconditions : demande en attente (la page relit toutes les 10 s), deux passages. · Étapes : focus clavier sur le second `<summary>`, Entrée ; attendre 11,5 s ; lire `document.activeElement` ; compter les mutations de `#verdict`. · Attendu : focus toujours sur ce `<summary>` ; aucune mutation du verdict tant que son texte ne change pas.
### S25 — Messages du tableau de diagnostic
Étapes : pour chaque ligne « Message (journal) » de `deploy/README.md` § 15, chercher le texte dans `deploy/auto-deploy.sh`. · Attendu : chaque message existe tel quel.
### S27 — Libellé d'étape dans une interruption
Préconditions : `retour_ko` de type `interrompu` et passage `interrompu` à l'étape `npm-test`. · Attendu : « Interrompu pendant Tests de l'API » (libellé du tableau des étapes, casse gardée).
### S30 — Partie A du guide
Étapes : les blocs A1 à A7 du guide, exécutés dans une seule session `zsh`, le serveur local lancé en arrière-plan, un `POST` à la place du clic. · Attendu : `TOUT OK`, `ℹ tests 65`, `ℹ fail 0`, banc 95 / 0, page 200, demande écrite avec `par=moi@yeita.fr`, copie supprimée.
