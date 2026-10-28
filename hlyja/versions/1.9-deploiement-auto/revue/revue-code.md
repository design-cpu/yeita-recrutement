---
type: revue-code
version: 1.9
bloquants: 0
majeurs: 4
mineurs: 21
corriges: 16
dependances: 0
audit: ok
date: 2026-10-28
---

# Revue de code et sécurité — Déploiement automatique de main

> **Aucun bloquant.** La frontière application → hôte tient : l'hôte ne lit dans le volume que la demande, prise par un conteneur jetable, bornée et validée par motifs fixes ; décisions sur `~/.recrutement-deploiement` ; JSON échappé ; page en `textContent`.
> **4 majeurs, tous corrigés** (lien à la place du dossier des demandes, doublon de clé réintroduit par une simplification, retour annulé sans alerte quand une sauvegarde reprend le verrou, demande non retirée qui remplaçait l'historique) et 12 mineurs corrigés ; 9 mineurs restants notés (candidats au backlog ou à la doc technique).
> Revue sur `339265b` ; corrections dans `805b43c` et `d305a95` ; une découverte du niveau B ajoutée (Q18, `%h` dans `ExecStopPost`).

## Dépendances
| Dépendance | Version | Publiée le | Licence | Audit | Verdict |
|---|---|---|---|---|---|
| (aucune ajoutée) | — | — | — | `npm audit --omit=dev` : 0 vulnérabilité ; `api/package.json` et `package-lock.json` inchangés | ok |
| Outils système (`iconv`, `flock`, `timeout`, `head -c`, `wc`, `date +%N`, `sort`, `tr`, `awk`, `git worktree`) | Ubuntu 26.04 | — | — | présents sans installation (vérifié dans `ubuntu:26.04`, coreutils uutils compris) | ok |

## Sécurité
| # | Sévérité | Fichier | Constat | Correction | Statut |
|---|---|---|---|---|---|
| S1 | majeur | `deploy/auto-deploy.sh` (prise de la demande), `recrutement-deploy.path` | L'application remplace `/data/demandes` par un lien absolu : l'unité path (sur l'hôte) voit une demande que le conteneur ne voit pas ; le service repart en boucle | Le conteneur refuse un lien ou un non-dossier à la place de `/data/demandes`, le retire, et sort en « non retirée » (attente de 60 s) ; cas ajouté au banc (lien absolu) | corrige |
| S2 | majeur | `deploy/auto-deploy.sh` | La copie de travail retirait le refus des doublons : `le` en double + `commit` absente (4 lignes) acceptée | Refus des doublons rétabli ; cas « doublon + clé manquante » ajouté au banc ; mutation R01 détectée | corrige |
| S3 | mineur | `deploy/auto-deploy.sh` | Rien ne limite les demandes répétées (redéploiements en boucle par un admin ou une application compromise) | — (risque écrit au README § 15 ; candidat au backlog) | ouvert |
| S4 | mineur | `deploy/auto-deploy.sh` | Un octet NUL disparaît dans `$(…)` : l'hôte et l'API lisaient la demande différemment | Le conteneur refuse un fichier qui contient un NUL ; cas au banc ; mutation R03 détectée | corrige |
| S5 | mineur | `deploy/auto-deploy.sh` (`essai_run`) | Conteneurs de test sans limites (capacités, pids, mémoire ; réseau pour `test-store`) | — (code de `main`, de confiance ; candidat au backlog) | ouvert |
| S6 | mineur | `deploy/auto-deploy.sh` (`ecrire_pause`) | `deploy/PAUSE` (email de l'admin) en 644 | Écrite sous `umask 077` | corrige |
| S7 | mineur | `deploy/auto-deploy.sh` (`lancer_tests`) | Image du `FROM` commençant par `-` lue comme une option | Refusée | corrige |
| S8 | mineur | `deploy/README.md` § 15 | Risque résiduel non écrit (retour à une version ancienne maintenu par la pause ; page ≠ audit) | Écrit au § 15 | corrige |

## Qualité et réinvention
| # | Sévérité | Fichier | Constat | Existant à réutiliser | Statut |
|---|---|---|---|---|---|
| Q1 | majeur | `deploy/auto-deploy.sh` (`retour`) | Verrou relâché entre le checkout et `deploy.sh "$AVANT"` : une sauvegarde peut le prendre ; le passage finissait `annule` sans `incertain` | Attente du verrou, puis retour rejoué une fois si `HEAD` est toujours le commit d'avant ; SC8 au banc A ; mutation R04 détectée | corrige |
| Q2 | majeur | `deploy/auto-deploy.sh` | Demande impossible à retirer enregistrée comme « demande refusée » à chaque passage : historique remplacé en 30 minutes | `non-retiree` : journal seulement ; mutation R05 détectée | corrige |
| Q3 | mineur | spec R6 | L'ordre réel est R20 → R9 → R6 (reprise, nettoyage, puis demande) | — (écrit dans `technique/`) | ouvert (doc) |
| Q4 | mineur | `deploy/auto-deploy.sh` | Refus « déjà en cours » (sauvegarde) présenté comme « refusée avant de commencer » | `annule`, motif neutre ; mutation R06 détectée | corrige |
| Q5 | mineur | `deploy/auto-deploy.sh` | Demande « main » sans `origin/main` abandonnée sans trace | Refus « dernier commit de main introuvable » | corrige |
| Q6 | mineur | `deploy/auto-deploy.sh` (`valider_commit`) | Motif « commit mal formé » inatteignable (la lecture l'a déjà refusé) | Gardé en défense | ouvert (voulu) |
| Q7 | mineur | `deploy/auto-deploy.sh` | Commentaire de format des noms de passage périmé | Corrigé | corrige |
| Q8 | mineur | `deploy/auto-deploy.sh` (`etape_json`) | `tail -n 300` ne borne pas la longueur des lignes | `cut -c1-2000` | corrige |
| Q9 | mineur | `api/src/deploiement.js` | `adminRequis` recopié de `sauvegardes.js` | Une seule fonction dans `app.js`, utilisée par les deux ; mutation M1' détectée | corrige |
| Q10 | mineur | `deploy/auto-deploy.sh` | Deuxième recopie de `docker compose run --rm --no-deps -T api sh -c` | `deploy/commun.sh` (une fonction `dans_volume`) | ouvert (dette, candidat au backlog) |
| Q11 | mineur | `tools/test-auto-deploy.sh` | 7 remarques shellcheck | Corrigées ou désactivées avec leur raison ; `shellcheck -x deploy/*.sh tools/test-auto-deploy.sh` → code 0 | corrige |
| Q12 | mineur | spec (exemple T10, R14) | `incertain` au premier niveau ; `PAUSE` sur 3 lignes `clé=valeur` | — (format réel écrit dans `technique/`) | ouvert (doc) |
| Q13 | mineur | `deploy/auto-deploy.sh` | Code 1 pour `annule` et `demande-refusee` : service « failed » pour des issues normales | Code 1 seulement pour `tests-ko`, `deploiement-ko`, `interrompu` | corrige |
| Q14 | mineur | `tools/test-auto-deploy.sh` | Cas manquants : SC8, `trap TERM`, lien absolu, NUL, doublon + manquante, `ecrire_etat` en échec | Ajoutés au banc A (SC8, lien, NUL, doublon, `run-ko`) ; `trap TERM` couvert au niveau B (SC5, SC6) | corrige |
| Q15 | mineur | `hlyja/technique/` | Rien sur les routes, `/data/demandes`, la contrainte R15 | — (étape documentation) | ouvert (doc) |
| Q16 | mineur | `deploy/auto-deploy.sh` | Variables `AUTO_DEPLOY_*` d'un shell à la main appliquées sans trace | — (candidat au backlog) | ouvert |
| Q17 | mineur | `admin/deploiement.html` | « Déployer ce commit » visible sur un commit que l'hôte refusera | — (acceptable : l'hôte décide) | ouvert (voulu) |
| Q18 | mineur | `deploy/systemd/recrutement-deploy.service` | (trouvé au niveau B) `%h` dans `ExecStopPost` vaut `/root` (gestionnaire système), pas le dossier de `deploy` : le nettoyage après arrêt échouait (`Permission denied`), le `trap` le faisait à sa place | `$HOME` dans un `sh -c` (celui de `User=deploy`) | corrige |

## Revérification
- Banc A (`tools/test-auto-deploy.sh`, `d305a95`) : **95 vérifications, `TOUT OK`** ; shellcheck sur `deploy/*.sh tools/test-auto-deploy.sh` : code 0.
- Mutations des contrôles modifiés : R01 doublon, R02 lien, R03 NUL, R04 retour rejoué, R05 non retirée, R06 « déjà en cours », M1' `adminRequis` partagé : **toutes détectées** (après un renforcement du banc : un passage nouveau se vérifie par son identifiant, pas par le nombre de passages, figé à 30).
- `npm test` : `ℹ tests 65` · `ℹ pass 65` · `ℹ fail 0` ; `npm audit --omit=dev` : 0.
- Niveau B après correction de Q18 : voir la fiche de la tâche 06.
