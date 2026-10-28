---
type: bilan
version: 1.7
statut: terminee
mode: complexe
type_version: livrable
score: 87
taches_ok: 8
taches_echec: 0
qa_taux: 92
date: 2026-10-28
---

# Bilan — Version 1.7

> **Terminée** (avec la reprise du 2026-10-28) · spec validée au tour 2 (87), puis réécrite pour la reprise et relue · 8/8 tâches ok · QA de la reprise 22/24 scénarios, les 2 restants corrigés · revues de code : 0 bloquant
> Avant de merger : partie A du guide de test humain (~10 min). Après le merge : `deploy/METTRE-A-JOUR.md` (§ 5 « 1.7 »), puis partie B du guide. La branche est poussée jusqu'au bilan d'avant la reprise ; les commits de la reprise ne sont pas encore poussés.

## Résultat
| Étape | Résultat |
|---|---|
| Démarrage | `main` déjà à jour avec `origin/main` (`7e6c346`) |
| Spec | tours 1 et 2 (44 → 87, validée) ; **reprise du 2026-10-28** (décisions de l'utilisateur) : spec réécrite d'un seul tenant (`spec/spec-finale.md`, l'ancienne dans `spec-avant-reprise.md`), relue (7 majeurs intégrés) |
| Tâches | 8 ok (7 + la reprise) ; mutations : 28 avant la reprise, 12 pour la reprise, toutes détectées (une équivalente) |
| Revues de code | avant la reprise : 1 majeur corrigé ; reprise : 0 majeur, 12 mineurs (10 corrigés, 2 laissés et notés) |
| QA | avant la reprise : 23/23 ; reprise : 22/24, puis B2 (majeur) et les autres bugs corrigés et revérifiés |
| Non-régression | `api npm test` « ℹ tests 58 / ℹ pass 58 / ℹ fail 0 » · `test-store` « TOUT OK » · `test-serveur` « TOUT OK (87 vérifications) » · `tools/test-sauvegarde.sh` « TOUT OK » (102 vérifications, banc systemd et conteneur simple) · shellcheck 0.10.0 sans remarque sur les scripts livrés · e2e Playwright des pages Candidatures non relancés : ces pages ne changent pas |
| Doc | 5 pages du référentiel, 1 page produit, glossaire, vues humaines réécrites ; pages projet : `deploy/README.md` § 14, `RESTAURER.md`, **`CLE-SAUVEGARDE.md`**, **`METTRE-A-JOUR.md`** (nouvelles) |
| Fiche demandée | 1.2-5 → fait |

## Ce que fait la version (après la reprise)
- Chaque nuit, la base est copiée, contrôlée, chiffrée avec age et gardée 30 jours **sur le serveur** (`/var/backups/recrutement`). Pas de copie ailleurs : la perte du serveur emporte les sauvegardes (choix assumé).
- Aucune alerte n'est envoyée : l'état (dernière sauvegarde, dernière tentative, disques) se lit sur **`/admin/sauvegardes.html`**, réservée aux admins (vert, ou rouge avec la raison).
- La clé privée est un fichier `.txt` gardé et partagé en main propre (`deploy/CLE-SAUVEGARDE.md`).
- La mise à jour du site en production se fait à la main, avec `deploy/METTRE-A-JOUR.md`.

## Tester en local
```bash
git switch version/1.7-sauvegarde-base
cd api && npm test 2>&1 | grep -E "^ℹ (tests|fail)"; cd ..
```
Puis la partie A de `qa/guide-test-humain.md` (scripts dans un conteneur Ubuntu 26.04, page d'état sur le Mac).

## Reste à faire avant de merger
- Partie A du guide de test humain.
- Pousser les commits de la reprise, puis ouvrir la pull request (le texte préparé avant la reprise est à refaire : il parle encore d'OVH et de healthchecks.io).

## Après le merge (sur le serveur)
- `deploy/METTRE-A-JOUR.md` : mise à jour, puis § 5 « 1.7 » (age, clé, minuteries, rôle admin, première sauvegarde, page verte, vérification de la clé) ; c'est aussi la partie B du guide.

## Réserves
Aucune sur la spec. Choix de l'utilisateur à garder en tête : pas de copie hors du serveur (1.7-8), pas d'alerte (1.7-6), clé en fichier `.txt` sans phrase de passe (1.7-9).

## Écarts avec la spec
- CA15 : `deploy.sh` non lancé de bout en bout sur le banc (son contrôle final exige un domaine en HTTPS).
- CA19 et la redirection de `/admin/sauvegardes.html` vers Google : seulement sur le vrai serveur (pas d'oauth2-proxy sur le banc).
- CA25 : page vérifiée au navigateur (vert, rouge, recruteur, session expirée, API absente, réseau), sans test automatisé (1.7-11).
- Effort : mutations au-delà du repère (40 au total pour 10 à 15 prévues) ; reprise importante après la livraison (voir Étonnements).
- `umask 022 &&` ajouté devant `deploy.sh` dans la doc (contournement de 1.7-1, hors périmètre : `deploy.sh` n'est pas modifié).
- IP du serveur et comptes SSH écrits dans les nouvelles pages (déjà présents dans la doc existante).

## Tâches en échec
Aucune.

## Changelog
- Ajouté : sauvegarde chaque nuit (3 h–3 h 15) de la base des candidatures, copiée et vérifiée dans le conteneur, chiffrée avec age, gardée 30 jours sur le serveur (`deploy/backup.sh`, `api/sauvegarde.js`).
- Ajouté : page d'état des sauvegardes `/admin/sauvegardes.html`, réservée aux admins, et sa route `GET /api/sauvegardes` ; vérification horaire des disques (`deploy/verif-disque.sh`) affichée sur la même page.
- Ajouté : `deploy/RESTAURER.md` (restaurer la base, ou ouvrir une copie sur un Mac), `deploy/CLE-SAUVEGARDE.md` (créer, garder, partager, changer la clé), `deploy/METTRE-A-JOUR.md` (mettre à jour le site en production).
- Ajouté : minuteries systemd `recrutement-backup` et `recrutement-verif-disque`.
- Modifié : `deploy/prepare-serveur.sh` exige `age` ; `.env.example` a `AGE_RECIPIENT` ; `tools/check-site.sh` a un 7e contrôle (`/admin/sauvegardes.html` protégée).
- Technique : `deploy/commun.sh` ; `tools/test-sauvegarde.sh` (102 vérifications, `BANC_JETABLE=oui`) ; tests de `sauvegarde.js` et de la route.

## Backlog
- Ajoutées : [1.7-1](../../backlog/1.7-1-deploy-sans-umask.md) `deploy.sh` lancé avec un masque 077 : l'API ne démarre plus (bug, **haute**, reproduit ; contourné dans la doc par `umask 022 &&`) ; [1.7-6](../../backlog/1.7-6-alertes-email-sauvegardes.md) alertes par email (évolution, moyenne) ; [1.7-7](../../backlog/1.7-7-tableau-de-bord-admin.md) tableau de bord sous `/admin/` (évolution, basse) ; [1.7-8](../../backlog/1.7-8-copie-hors-du-serveur.md) copie hors du serveur (évolution, moyenne) ; [1.7-9](../../backlog/1.7-9-cle-sauvegarde-coffre.md) coffre pour la clé (évolution, moyenne) ; [1.7-10](../../backlog/1.7-10-installation-unites-dupliquee.md) installation des unités recopiée dans deux pages (dette, basse) ; [1.7-11](../../backlog/1.7-11-page-admin-sans-test-automatique.md) page admin sans test automatique (dette, moyenne) ; [1.7-3](../../backlog/1.7-3-test-nom-copie-deja-pris.md), [1.7-4](../../backlog/1.7-4-banc-reel-sauvegarde-rejouable.md) (dette, basse).
- Faites dans la version : [1.7-2](../../backlog/1.7-2-dossier-copies-absent-sans-alerte.md) (l'état « echec » est écrit), [1.7-5](../../backlog/1.7-5-rclone-paquet-universe.md) (rclone retiré), [1.2-5](../../backlog/1.2-5-sauvegarde-base-sqlite.md).
- Nouvelle occurrence : [1.1-6](../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md).
- Remarqué : les fiches 1.6-1 à 1.6-4 portent `nature: amelioration` (à lire `evolution`).

## Étonnements
Voir `etonnements/1.7-sauvegarde-base.md` (premier passage : 3 retenus sur 4 ; reprise : candidats ci-dessous validés à part). Règles récurrentes signalées par le validateur au premier passage : vérification faite dans des conditions plus favorables que la cible (5e version), contrôle qui ne peut pas échouer (4e), concurrence non exercée (2e).

## Couverture de la doc
| Élément | Page |
|---|---|
| R1 à R4 (copie), R22 (route) | [API de stockage](../../technique/api.md) ; `api/README.md` |
| R5 à R11, R14, R21, R24 (scripts, unités, état, contrôle) | [Architecture](../../technique/architecture.md#scripts) ; `deploy/README.md` § 14 |
| R12 (rétention), R16 (restauration), R23 (page) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Décisions](../../technique/decisions.md) ; `deploy/RESTAURER.md` |
| R13, R17, R19, R25, R26 (mise en service, clé, mise à jour) | `deploy/CLE-SAUVEGARDE.md`, `deploy/METTRE-A-JOUR.md` ; [Déployer sur OVH](../../technique/deploiement-ovh.md) (étapes 2 et 11) |
| Tests | [Conventions](../../technique/conventions.md#tests) |
| Termes | [Glossaire](../../glossaire.md) : age, Clé de sauvegarde, Page d'état des sauvegardes, Restauration, Sauvegarde, Timer systemd |
