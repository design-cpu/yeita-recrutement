---
type: tache
version: 1.9
numero: 01
titre: deploy.sh : pause et commit déployé
statut: ok
date: 2026-10-28
---

# Tâche 01 — deploy.sh : pause et commit déployé

> **QA : réussie** · 1 fichier modifié · 3 mutations détectées sur 3
> `deploy.sh` lancé à la main sur un ancien commit met le déploiement automatique en pause, et note chaque mise en ligne réussie.

## Ce que ça change
Un retour arrière fait en SSH n'est plus défait dans les 10 minutes : `deploy/PAUSE` arrête l'automatisme jusqu'à « Reprendre ». Le fichier est ignoré par git (exclusion locale, valable quel que soit le commit en place). Chaque « Déploiement réussi » écrit `~/.recrutement-deploiement/deploye`, la référence de l'automatisme.

## Comment tester
`docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot`, partie D (vrai `deploy.sh`, faux docker, `check-site.sh` factice).

## Critères d'acceptation
- [x] CA5 — pause créée par `deploy.sh <hash>` à la main (hors dernier de main) après validation et changement de commit, gardée s'il échoue ; jamais sous `RECRUTEMENT_PAR_AUTO=1`, ni sans argument, ni pour le dernier de main, ni pour un commit refusé ; dépôt « propre » avec la pause.

## Ce qui a été fait
- `deploy/deploy.sh` : exclusion `/deploy/PAUSE` dans `.git/info/exclude` avant le contrôle « dépôt propre » ; pause après `git checkout` (sauf `RECRUTEMENT_PAR_AUTO=1` ou commit = `origin/main`) ; `deploye` écrit à « Déploiement réussi » (700/600).
Commits : `13171c8` ; ajustement shellcheck dans `049f351`.

## Résultat QA
| Vérification | Résultat |
|---|---|
| Banc partie D (8 vérifications) | OK, ligne finale du banc `TOUT OK` |
| `shellcheck -f gcc -x deploy/*.sh` | code 0 |
| Niveau B : 1.8 → 1.9 par le `deploy.sh` de la 1.8 | réussi, aucune pause créée (la 1.8 ne la connaît pas), `deploye` absent puis initialisé par la commande d'installation |

## Mutations
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| D01 | pause créée même sous `RECRUTEMENT_PAR_AUTO=1` | échec « RECRUTEMENT_PAR_AUTO=1 : pas de pause » | détectée |
| D02 | exclusion locale non ajoutée | échec « exclusion /deploy/PAUSE ajoutée une fois » | détectée |
| D03 | `deploye` non écrit | échec « deploy.sh sans argument : … deploye écrit » | détectée |

## Spec couverte
R13 (`deploye`), R14, R15 (premier passage), CA5
