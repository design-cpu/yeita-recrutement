---
type: bilan
version: 1.7
statut: terminee
mode: complexe
type_version: livrable
score: 87
taches_ok: 7
taches_echec: 0
qa_taux: 100
date: 2026-10-27
---

# Bilan — Version 1.7

> **Terminée** · spec validée au tour 2 (score 44 → 87) · 7/7 tâches ok · QA 23/23 scénarios (100 %, S18 en partie) · revue de code : 0 bloquant, 1 majeur corrigé
> Avant de merger : partie A du guide de test humain (~5 min). Après le déploiement : mise en service des sauvegardes (`deploy/README.md` § 14), puis partie B du guide. Rien n'est poussé.

## Résultat
| Étape | Résultat |
|---|---|
| Démarrage | `main` déjà à jour avec `origin/main` (`7e6c346`, PR #7 et #8) ; le seul commit de `version/1.5-guide-deploiement-ovh` absent de `main` y est sous un autre sha |
| Vérifications | 20 (V1 à V20), 6 écarts, sur un banc `ubuntu:26.04` (le système du serveur) avec son dockerd, puis une variante avec systemd |
| Spec | tour 1 : 44 (21 majeurs) ; tour 2 : **87**, validée ; 2 décisions de l'utilisateur au cadrage, 1 au tour 1 (utilisateur S3 en lecture seule) |
| Tâches | 7 ok, 0 échec ; 28 mutations, toutes détectées (une équivalente) |
| Revue de code | 0 bloquant, 1 majeur (masque `umask 077` laissé dans le shell par le README) corrigé, 6 mineurs corrigés, 3 au backlog |
| QA | 23/23 scénarios, dont une restauration de bout en bout en suivant `deploy/RESTAURER.md` à la lettre (4 cas) ; 2 bugs mineurs corrigés |
| Non-régression | `api npm test` « ℹ tests 55 / ℹ pass 55 / ℹ fail 0 » · `test-store` « TOUT OK » · `test-serveur` « TOUT OK (87 vérifications) » · `tools/test-sauvegarde.sh` « TOUT OK » (125 vérifications, banc systemd et conteneur simple) · shellcheck 0.10.0 sans remarque · e2e Playwright non relancés : aucune page ni route ne change |
| Doc | 5 pages du référentiel, 1 page produit, glossaire (+6 termes) ; relecture : 3 majeurs corrigés, dont `read -p` qui échouait sous zsh dans `RESTAURER.md` |
| Fiche demandée | 1.2-5 → fait |

## Tester en local
```bash
git switch version/1.7-sauvegarde-base
cd api && npm test 2>&1 | grep -E "^ℹ (tests|fail)"; cd ..
```
Puis la partie A de `qa/guide-test-humain.md` (125 vérifications des scripts dans un conteneur Ubuntu 26.04).

## Reste à faire avant de merger
- Partie A du guide de test humain.

## Après le merge (sur le serveur)
- Déployer (`deploy/deploy.sh`), installer `age` et `rclone` (`sudo apt install age rclone`), puis la mise en service de `deploy/README.md` § 14 (clé au coffre, bucket OVH et trois utilisateurs S3, cycle de vie, remote rclone, deux contrôles healthchecks.io, `.env`, unités systemd).
- Partie B du guide de test humain : seule preuve du vrai OVH (droits des comptes, 30 jours), du vrai healthchecks.io et de la clé du coffre.
- Tant que ce n'est pas fait, le volume `recrutement_data` reste la seule copie des candidatures.

## Réserves
Aucune (spec validée).

## Écarts avec la spec
- R14 : `Wants=docker.service` retiré des deux unités après le curateur (une vérification horaire relancerait un Docker arrêté pour une maintenance du serveur partagé) ; `After=docker.service` gardé ; maintenance de Docker documentée (arrêter les timers).
- CA15 : `deploy.sh` n'a pas été lancé de bout en bout avec un `.env` sans les 4 variables (son contrôle final demande un domaine en HTTPS) ; vérifié par la lecture de Compose et l'absence de ces variables dans `deploy.sh`, inchangé.
- CA19 : reste manuel, partie B du guide.
- Points d'appui de test dans `backup.sh` : `RECRUTEMENT_ATTENTE_DEPLOIEMENT` et `RECRUTEMENT_ATTENTE_API` (durées, validées : entier ≥ 2).
- Effort : 28 mutations pour un repère de 10 à 15 (chef d'équipe, P4) ; outillage de test lourd (325 lignes) mais rangé dans le projet et documenté.
- Fichiers hors de la liste de la spec, tracés en P3 : `deploy/healthchecks.sh`, `tools/test-sauvegarde.sh`.

## Tâches en échec
Aucune.

## Changelog
- Ajouté : sauvegarde chaque nuit (3 h–3 h 15) de la base des candidatures, copiée et vérifiée dans le conteneur, chiffrée avec age pour une clé gardée hors du serveur, envoyée sur OVH Object Storage, gardée 30 jours sur le serveur et 30 jours chez OVH (`deploy/backup.sh`, `api/sauvegarde.js`).
- Ajouté : alertes healthchecks.io quand une sauvegarde échoue, quand un disque dépasse 80 % (`deploy/verif-disque.sh`), ou quand l'un des deux ne donne plus de nouvelles.
- Ajouté : `deploy/RESTAURER.md`, restaurer la base (y compris après la perte du serveur) ou ouvrir une copie sur un Mac, sans jamais déchiffrer sur le serveur.
- Ajouté : unités systemd `recrutement-backup` et `recrutement-verif-disque` (service et timer), et leur installation dans `deploy/README.md` § 14.
- Modifié : `deploy/prepare-serveur.sh` exige `age` et `rclone` (sans les installer) ; `.env.example` a 4 variables de sauvegarde.
- Technique : `deploy/healthchecks.sh` (réglages et pings communs) ; `tools/test-sauvegarde.sh` (125 vérifications à faux outils) ; 3 tests de `sauvegarde.js` dans `api/test/equipe.test.js`.

## Backlog
- Ajoutées : [1.7-1](../../backlog/1.7-1-deploy-sans-umask.md) `deploy.sh` ne fixe pas son masque : lancé depuis un shell à `umask 077`, l'API ne démarre plus (bug, **haute**, reproduit) ; [1.7-2](../../backlog/1.7-2-dossier-copies-absent-sans-alerte.md) dossier des copies absent : pas de `/fail` immédiat (évolution, basse) ; [1.7-3](../../backlog/1.7-3-test-nom-copie-deja-pris.md) pas de test du refus d'écraser une copie du même nom (dette, basse) ; [1.7-4](../../backlog/1.7-4-banc-reel-sauvegarde-rejouable.md) essais réels du banc non rejouables depuis le dépôt (dette, basse) ; [1.7-5](../../backlog/1.7-5-rclone-paquet-universe.md) rclone 1.60.1 du dépôt *universe* (dette, basse).
- Nouvelles occurrences : [1.1-6](../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) (`reglage()` en double entre `deploy.sh` et `healthchecks.sh`).
- Traitée par cette version : [1.2-5](../../backlog/1.2-5-sauvegarde-base-sqlite.md) → fait.
- Remarqué par le curateur, non corrigé : les fiches 1.6-1 à 1.6-4 portent `nature: amelioration` (à lire `evolution`).

## Étonnements
3 retenus sur 4 (`etonnements/1.7-sauvegarde-base.md`) : parade ajoutée en challenge essayée contre les exécutions concurrentes (fusion avec la règle 2 de la 1.3), tests depuis un état de processus neutre, commandes du poste essayées sous son shell (zsh). **Règles récurrentes signalées par le validateur** (le skill devrait évoluer) : vérification faite dans des conditions plus favorables que la cible (5e version) ; contrôle qui ne peut pas échouer (4e) ; règle de concurrence non exercée (2e) ; `controles.md` n'a toujours ni colonne « conditions » au § 1, ni classement « bloque / plantage » au § 6.

## Couverture de la doc
| Élément | Page |
|---|---|
| R1 à R4 (copie) | [API de stockage](../../technique/api.md) ; `api/README.md` |
| R5 à R11, R14 (scripts, unités) | [Architecture](../../technique/architecture.md#scripts) ; `deploy/README.md` § 14 |
| R12 (rétention), R16 (restauration) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Décisions](../../technique/decisions.md) ; `deploy/RESTAURER.md` ; `api/README.md` |
| R13, R15, R17 à R19 (mise en service) | `deploy/README.md` § 14 ; [Déployer sur OVH](../../technique/deploiement-ovh.md) (étapes 2 et 11) |
| Tests | [Conventions](../../technique/conventions.md#tests) |
| Termes | [Glossaire](../../glossaire.md) : age, Bucket, Clé de sauvegarde, healthchecks.io, rclone, Restauration, Sauvegarde, Timer systemd |
