---
type: revue-doc
version: 1.8
pages: 3
erreurs: 4
corrigees: 4
vues: 3
date: 2026-10-28
---

# Revue de la documentation — version 1.8

> Les pages touchées citent les bons numéros de ligne de `deploy.sh` (vérifiés par `grep -n` sur les messages) et ne parlent plus de contournement. `mise-a-jour-production.md` est conforme. `deploiement-ovh.md` a deux écarts : des numéros de ligne faux dans `assets/wording.fr.js` (antérieurs à la 1.8) et rien sur le préfixe `umask 022 &&` que sa vue utilise. Hors pages touchées, `architecture.md` décrit `deploy.sh` sans le masque. Les 4 écarts sont corrigés dans les sources et revérifiés ; vues écrites.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| `technique/deploiement-ovh.md` | « Libellés cités » : `Connecté·e : ` et `Tu ne fais pas partie de l'équipe.` donnés en `assets/wording.fr.js` l. 36, 42 ; `grep -n` : l. 39 et l. 45 (l. 36 = `note`, l. 42 = commentaire). Écart présent depuis la 1.6 (`f3ed44c`), pas causé par la 1.8, mais la page est republiée en `maj: 1.8` | `assets/wording.fr.js` l. 39, 45 | corrige |
| `technique/deploiement-ovh.md` | Incomplète pour la 1.8 : la page ne dit rien du masque fixé par `deploy.sh` ni du préfixe `umask 022 &&`, que sa vue garde (étape 7, « Pour plus tard »), ni de sa raison (R3). L'étape 7 écrit `deploy.sh` sans préfixe | Ligne « Masque des fichiers » dans « Points à savoir » : `deploy.sh` fixe `umask 022` (l. 9) depuis la 1.8 ; sur un serveur neuf, le clone est déjà en 1.8 ou plus, donc le préfixe n'est pas nécessaire au premier déploiement ; les commandes de la vue le gardent pour le cas d'un `deploy.sh` du disque antérieur à la 1.8 (renvoi à `mise-a-jour-production.md`) | corrige |
| `technique/deploiement-ovh.md` | `sources` sans `deploy/commun.sh` ni `admin/sauvegardes.html`, que la vue humaine liste et dont la page parle (`/admin/sauvegardes.html`, étape 11) | Ajouter les deux fichiers à `sources` | corrige |
| `technique/architecture.md` (non touchée) | La ligne `deploy/deploy.sh [commit]` du tableau des scripts liste les contrôles et effets du script sans le `umask 022` ajouté en 1.8 ; la page n'est plus complète sur ce script | Ajouter « `umask 022` avant toute écriture (v1.8) » dans la colonne des garde-fous, une ligne 1.8 dans l'historique, `maj`/`commit` à jour | corrige |
| `technique/mise-a-jour-production.md` | Aucun : `deploy.sh` l. 102, 113, 134, 139 et l. 9 pointent sur les messages et la ligne cités ; `check-site.sh` l. 51 et `equipe.js` l. 77 justes ; raison du préfixe conforme à R3 et à `deploy/README.md` § 9 ; plus de « contournement » | — | conforme |
| `deploy/METTRE-A-JOUR.md` § 2 (référence de `mise-a-jour-production.md`) | Garde l'ancienne raison du préfixe (« garantit que les fichiers mis à jour restent lisibles »), exacte mais différente de R3 et de `README.md` § 9 ; choix délibéré de la tâche 01 | À décider : aligner la phrase sur `README.md` § 9 pour que la vue et sa référence disent la même chose | suggestion |

Vérifié sans écart : `deploiement-ovh.md` l. 36-55 (bloc de contrôle de `.env`) et l. 122-134 (attente de l'API `healthy`), `prepare-serveur.sh` l. 165, `api/src/app.js` l. 77. Aucune autre page de `technique/`, `doc/produit/` ni le glossaire ne dit que `deploy.sh` ne fixe pas de masque ni ne cite de ligne de `deploy.sh`.

## Vues humaines écrites
- `technique/mise-a-jour-production.humain.md` : `maj` et `commit` à jour ; à la section 2, la raison du préfixe `umask 022` est celle de R3 (encadré) ; à la section 4, la commande de retour se lance telle qu'affichée, sauf pendant un retour vers une version d'avant la v1.8. Le reste, toujours exact, est inchangé.
- `technique/deploiement-ovh.humain.md` : `maj` et `commit` à jour ; à l'étape 7, encadré sur la raison du préfixe. Aucun numéro de ligne dans la vue. Revérifiée après correction de la source (point « Masque des fichiers », `sources`) : l'encadré de l'étape 7 dit la même chose, rien d'autre à changer.
- `technique/architecture.humain.md` : `maj` et `commit` à jour ; ligne « Déploiement » du tableau des scripts : `deploy.sh` règle lui-même les droits des fichiers depuis la v1.8. Le reste est inchangé.

## Glossaire
Aucun. Les vues expliquent `umask 022` sur place ; le terme « umask » pourrait entrer au glossaire s'il revient dans d'autres pages.
