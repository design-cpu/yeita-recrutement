---
type: revue-doc
version: 1.9
pages: 8
erreurs: 13
corrigees: 13
vues: 7
date: 2026-10-28
---

# Revue de la documentation — version 1.9

> 8 pages vérifiées contre le code de `5e41a2d` (7 sources du référentiel et de la doc produit, plus le glossaire). 13 erreurs de source à corriger, dont 4 qui changent le sens (retour sans `RECRUTEMENT_PAR_AUTO=1`, compteurs du contrôle du site et de l'e2e serveur, frontière « une fois par minute »). S'y ajoutent 4 écarts dans les docs du code. 7 vues humaines écrites d'après le code, pas d'après les erreurs.

Méthode : relevé par commande (`grep -n`, `git diff main...HEAD`, `git rev-list`) dans `deploy/auto-deploy.sh`, `deploy/deploy.sh`, `deploy/systemd/recrutement-deploy.*`, `api/src/deploiement.js`, `api/src/app.js`, `api/src/sauvegardes.js`, `admin/deploiement.html`, `tools/check-site.sh`, `tools/test-auto-deploy.sh`, `api/test/*.test.js`, `deploy/README.md`, `deploy/METTRE-A-JOUR.md`. Ce qui est conforme : l'ordre d'un passage, les étapes et leurs issues, les noms de fichiers et leurs droits, les durées réglables, les unités, les routes (corps, codes, `admin-requis`, `demande-non-ecrite`), le format des passages, 65 tests de l'API (5 + 13 + 7 + 10 + 21 + 9, dont 7 ajoutés), 95 vérifications du banc A, 227 ancêtres et 19 commits sur la ligne principale, les liens et ancres (`conventions.md#tests`, `../../technique/…`). La colonne « Depuis » est renseignée partout.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| technique/mise-a-jour-production.md | Étapes, ligne 2 : « 7 `OK` » ; `tools/check-site.sh` fait 8 contrôles depuis la 1.9 (`/admin/deploiement.html`, l. 44). Numéros de ligne périmés : `deploy.sh` l. 102, 113, 134, 139 sont devenues l. 115, 126, 147, 156 ; `check-site.sh` l. 51 → l. 52 ; « Masque des fichiers » : `umask 022` (l. 9) → l. 11 | « 8 `OK` » ; recaler les numéros de ligne ; à l'étape 3, ajouter `/admin/deploiement.html` (compte admin) | corrige |
| technique/conventions.md | Ligne `python3 tools/e2e-serveur.py` : « 51 vérifications », et la page des déploiements n'y figure pas. Pourtant l'Historique 1.9 dit qu'`e2e-serveur` la vérifie. La tâche 07 relève 81 vérifications (80 `OK`, 1 `FAIL` qui existait déjà sur `main`), dont 29 pour `admin/deploiement.html` (états d'exemple par verdict, sortie hostile affichée comme texte, double clic) | Recompter et écrire le nombre réel ; ajouter « page `admin/deploiement.html` (v1.9) » | corrige |
| technique/deploiement-automatique.md | « Un passage », ligne `retour` : `deploy/deploy.sh <deploye>`, sans la variable. Le code lance `env RECRUTEMENT_PAR_AUTO=1 deploy/deploy.sh "$AVANT"` (`auto-deploy.sh` l. 310). Sans elle, le `deploy.sh` (≥ 1.9) du commit d'avant poserait la pause, puisque ce commit n'est pas `origin/main` | `env RECRUTEMENT_PAR_AUTO=1 deploy/deploy.sh <deploye>` | corrige |
| technique/deploiement-automatique.md | « Fichiers et formats », ligne Vue : `pause: {depuis, par, commit}`, alors que la même cellule définit « commit = `{commit, court, message, auteur}` ». Dans le code, `pause.commit` est le hash court, en texte (l. 72) | `pause: {depuis, par, commit: <hash court>}\|null` | corrige |
| technique/deploiement-automatique.md | « Ordre », étape 8 : « demande refusée « GitHub injoignable » ». Une demande `reprendre` est traitée avant le test du `fetch` (l. 391-394) : elle retire la pause même sans GitHub | « demande `deployer` refusée « GitHub injoignable » ; `reprendre` traitée » | corrige |
| technique/deploiement-automatique.md | « Un passage », ligne `deploy` : « commit visé = commit d'avant → `incertain`, `redeploiement-ko` ». Le code fait de même quand `deploye` est absent (l. 286), avec le motif « pas de commit d'avant vers lequel revenir ». Les modes `--nettoyer` (utilisé par `ExecStopPost`) et le refus de root (code 1) ou d'un argument inconnu (code 2) ne figurent pas sur la page | Ajouter « ou `deploye` absent » ; une ligne « Modes : `--auto`, sans option, `--nettoyer` ; refuse root » | corrige |
| technique/api.md | Tableau des modules : `api/src/app.js` ne liste pas `adminRequis(req)`, nommé seulement dans l'Historique ; `api/src/sauvegardes.js` ne liste pas `lire(fichier)`, exporté depuis la 1.9 et utilisé par `deploiement.js` ; sa description « contrôle du rôle `admin` dans la route » ne dit pas que c'est désormais `adminRequis` | Ajouter `adminRequis(req)` (v1.9) aux exports d'`app.js`, `lire(fichier)` (v1.9) à ceux de `sauvegardes.js` ; « contrôle par `adminRequis` (v1.9) » | corrige |
| technique/api.md | `POST /api/deploiement/demande` : les erreurs n'ont pas 413, alors qu'un corps de plus de 1 Mo (`bodyLimit`) le renvoie comme sur les autres routes à corps. Le tableau « Consommateurs » n'a ni `admin/deploiement.html` ni `admin/sauvegardes.html` | Ajouter 413 ; ajouter deux lignes au tableau des consommateurs (`GET /api/sauvegardes` → `admin/sauvegardes.html` ; `GET /api/deploiement`, `POST /api/deploiement/demande` → `admin/deploiement.html`) | corrige |
| technique/decisions.md | « Frontière application → hôte », Conséquences : « faire tourner le service (au plus une fois par minute si elle rend la demande illisible) ». Dans le code, l'attente de 60 s ne vaut que pour une demande **non retirée** : dossier remplacé par un lien, ou conteneur en échec (l. 195, 203, 424). Une demande illisible est retirée et enregistrée « demande refusée », sans attente : l'application peut ainsi remplir les 30 passages de l'historique | « … faire tourner le service (au plus une fois par minute si elle empêche le retrait de la demande) ; une demande illisible est refusée et enregistrée comme un passage » | corrige |
| glossaire.md | « Commit en ligne incertain » : les causes sont incomplètes. Le code marque aussi incertain un redéploiement raté du commit en place, ou un `deploye` absent ou différent de `HEAD` (l. 70, 286, 415). L'effet est trop large : le passage suivant ne remet rien en ligne en pause ni sans GitHub (l. 412-413) | « … parce qu'une mise en ligne n'a pas abouti (arrêtée, ratée sans retour possible, ou retour raté). … le passage suivant remet le dernier commit de main en ligne, sauf en pause ou si ce commit a échoué. » | corrige |
| glossaire.md | Alias trop généraux : « demande » (Demande de déploiement), « passages » et le titre « Passage », « en pause », « incertain ». L'appli détecte ces mots partout et afficherait la définition du déploiement là où ils ont un autre sens : « transmet la demande à l'API » (api.humain, architecture.humain), « Chaque passage écrit son résultat dans l'état des sauvegardes » (architecture.humain), « premier passage à la 1.9 » (mise-a-jour-production) | Retirer l'alias « demande » (garder « demande de déploiement ») ; choisir un titre moins courant pour Passage (« Passage du déploiement ») ou accepter le survol | corrige |
| doc/produit/deploiement-automatique.md | « La page » : « Seuls les commits passés par l'automatisme figurent dans la liste ». La liste montre les passages de tous les déclencheurs (automatique, demande, ligne de commande) ; « Déployer ce commit » n'apparaît que sur un passage dont les trois étapes de test ont réussi et dont le commit n'est pas en ligne. Détail manquant : le passage le plus récent est ouvert quand il n'est pas « Mis en ligne » | « Seuls les commits d'un des 30 derniers passages, tests réussis, peuvent être redemandés ; pour un autre : `deploy.sh <hash>` en SSH » ; ajouter « le plus récent ouvert s'il a échoué » | corrige |
| technique/architecture.md | « Environnements », ligne Serveur OVH : la commande est encore `deploy/deploy.sh` ; depuis la 1.9, c'est `recrutement-deploy.timer` → `deploy/auto-deploy.sh --auto`, et `deploy.sh` reste le secours | « `deploy/auto-deploy.sh` (timer, v1.9) ; secours : `deploy/deploy.sh` » | corrige |

### Écarts dans les docs du code (hors `hlyja/`, citées dans les `sources`)
| Fichier | Problème | Correction attendue |
|---|---|---|
| `deploy/README.md` § 15, « Lire un échec », dernière ligne | Message `Demande illisible : le conteneur n'a pas pu la retirer.` ; le code écrit `Demande non retirée : le conteneur n'a pas pu la prendre.` (`auto-deploy.sh` l. 203) | Recopier le message du code |
| `deploy/README.md` § 14, « Maintenance de Docker » (repris par `METTRE-A-JOUR.md` § 1) | `while systemctl is-active -q recrutement-deploy recrutement-backup; do …` : `is-active` ne rend 0 que pour l'état `active`. Un service oneshot qui tourne est `activating`, comme le note `technique/conventions.md` ; la boucle sort donc aussitôt, même pendant un passage. À confirmer sur le banc systemd | Attendre sur `systemctl show -p ActiveState --value … \| grep -qE '^(activating\|active\|deactivating)$'` (forme reprise dans la vue humaine de la mise à jour) |
| `deploy/METTRE-A-JOUR.md` § 2 et § 3 | « 7 lignes `OK` », « 7 `OK` » ; la même page dit 8 au § 5 (1.9), et `check-site.sh` en fait 8 | « 8 » |
| `hlyja/technique/mode-serveur.md` l. 118 (page non touchée par la 1.9) | « `tools/e2e-serveur.py` (51 vérifications) » | Même compteur que dans `conventions.md` |

## Vues humaines écrites
- doc/produit/deploiement-automatique.humain.md (nouvelle)
- technique/deploiement-automatique.humain.md (nouvelle)
- technique/architecture.humain.md (réécrite)
- technique/api.humain.md (réécrite)
- technique/conventions.humain.md (réécrite)
- technique/decisions.humain.md (réécrite)
- technique/mise-a-jour-production.humain.md (réécrite ; checklist autonome qui recopie les commandes, y compris la commande d'installation de `deploy/README.md` § 15)

Les vues suivent le code là où une source se trompe : 8 contrôles du site, retour lancé avec `RECRUTEMENT_PAR_AUTO=1`, frontière décrite avec la distinction illisible / non retirée, 81 vérifications pour l'e2e serveur (chiffre de la tâche 07), boucle d'attente sur `ActiveState` pour la maintenance de Docker.

## Glossaire
Aucun terme ajouté : les sources ne devaient pas être modifiées dans cette revue. Les vues humaines utilisent les termes du glossaire tels qu'ils y sont écrits. « Worktree » y est expliqué au passage, ainsi que « unité » (systemd). Propositions à l'orchestrateur : « Worktree » (copie de travail git à part, où tournent les tests), et la correction des alias décrite plus haut.
