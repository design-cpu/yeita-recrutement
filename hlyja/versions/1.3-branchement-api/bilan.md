---
type: bilan
version: 1.3
statut: terminee
mode: complexe
type_version: livrable
score: 97
tours: 3
taches_ok: 10
taches_echec: 0
qa_taux: 100
date: 2026-10-26
---

# Bilan — Version 1.3

> **Terminée** · Spec validée à 97/100 en 3 tours (47, 88, 97) · 10/10 tâches ok · QA 100 % après corrections (90,7 % au passage, 3 bugs corrigés)
> Avant de merger : suivre `qa/guide-test-humain.md`, en particulier l'essai avec un vrai compte Google (H1) et le contrôle réseau de `deploy/README.md` § 9b sur le serveur, avant d'ajouter le premier admin.

## Résultat
| Étape | Résultat |
|---|---|
| Spec | validée, 97/100, 3 tours ; 7 décisions de l'utilisateur (démarrage, messages, image Node, note de `decompte.html`, « Remplacer tout », 404 en production, `file://`) |
| Vérifications | 40 (V1 à V40), dont essais d'attaque sur moteur Linux avec témoins ; 8 écarts au pitch ou à la spec v1, tous traités |
| Tâches | 10 ok, 0 échec |
| Revue de code | 0 bloquant, 1 majeur corrigé (Q1), 12 mineurs : 9 corrigés (S1 à S4, Q2, Q3, Q4, Q6, Q9 en partie), 3 au backlog (Q5, Q8, Q9 reste) |
| QA | 43/43 après corrections (39/43 au passage) ; 47 scénarios dont 4 manuels ; 18 mutations de la QA (17 détectées, 1 survivante au backlog : 1.3-5) |
| Tests du projet | `tools/test-serveur.js` 83 vérifications (créé) ; `tools/e2e-serveur.py` 38 (créé) ; non-régression `test-store.js`, `npm test` 52/52, 4 e2e navigateur (111) : verts, verdicts lus |
| Doc | 1 page produit créée, 1 page technique créée, 5 mises à jour, 7 vues humaines, glossaire (6 termes) ; `docs/backend/MODELE.md`, `deploy/README.md`, `api/README.md` |
| Backlog | 8 fiches créées, 2 occurrences, 4 fiches passées à fait |

## Tester en local
```bash
git switch version/1.3-branchement-api
node tools/test-store.js && node tools/test-serveur.js && (cd api && npm ci && npm test)
python3 tools/build.py _site && cd api && node equipe.js add moi@yeita.fr Moi admin && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
# puis http://127.0.0.1:8000/candidatures/ : « Connecté·e : Moi »
```
Pile Docker locale : `cp .env.example .env && docker compose up -d --build && tools/check-site.sh https://localhost` (6 contrôles). Puis suivre `qa/guide-test-humain.md`.

## Reste à faire avant de merger
- Parcours du guide de test, dont **H1** : avec un vrai compte Google, `https://recrutement.yeita.fr/api/moi` rend son email (vérifié seulement avec un fournisseur OIDC de test, Dex).
- Au déploiement : relever la version de Docker du serveur (`deploy/README.md` § 1) et faire le contrôle réseau du § 9b avant le premier admin (parade vérifiée sur le moteur 29.9.2).
- Confirmer H4 : aucune vraie candidature dans les navigateurs de l'équipe (les données locales ne sont pas reprises).
- Fiche **1.3-1** (haute) : le bandeau « Données fictives » dit encore « Tout reste dans ce navigateur » en mode serveur (hors périmètre du pitch) ; à traiter avant les premières vraies candidatures (candidate au mode express).

## Réserves
Aucune (spec `validee`).

## Écarts avec la spec
| Règle | Écart | Raison |
|---|---|---|
| R6g | Réécrite à la revue de code (Q1) : la partie part posée sur l'objet du PUT en cours ou sur le dernier dossier relu, avec sa version ; plus jamais « la version la plus haute connue » | La règle d'origine écrasait en silence la partie d'une autre page (reproduit en Node) ; spec finale mise à jour |
| R37 | `tools/e2e-candidatures.py` et `tools/e2e-parcours.py` modifiés : leur filtre de console écarte la seule erreur de l'adresse `/api/moi` | En mode navigateur, Chromium journalise le 404 attendu de `/api/moi` comme erreur de console : les deux suites concluaient « SOMETHING FAILED » (QA, B1) |
| R38 | `tools/e2e-serveur.py` pose `DEV_EMAIL` (Alice) pour les seules requêtes sans en-tête | L'envoi de départ (`keepalive`, après le déchargement) ne reçoit pas les en-têtes ajoutés par Playwright ; la QA a vérifié sur le banc Dex que ces envois partent sous le bon compte (Bob) |
| R27 | La sonde exige aussi `/data` inscriptible | Un volume en lecture seule, monté pendant qu'une API tourne en écriture, laissait l'API `healthy` avec des écritures en 500 (QA, B2) |
| R36 | Le lien « Ouvrir sur le site » garde le dossier `candidatures/` | Sans cela, il menait à une adresse inexistante (défaut trouvé à la tâche 08) |
| H5 | Précisé : la perte des dernières frappes au départ vaut aussi quand une autre page de la même personne (feuille de décompte) a écrit juste avant | Constaté en tâche 09 ; risque accepté (doc produit) |

## Tâches en échec
Aucune.

## Changelog
- Ajouté : sur `recrutement.yeita.fr`, les candidatures sont enregistrées dans la base partagée de l'équipe ; chacun agit sous son compte Google, affiché « Connecté·e : <prénom> » (« · lecture seule » pour un lecteur).
- Ajouté : un enregistrement fait sur un dossier modifié entre-temps est refusé, avec un bandeau visible et « Non enregistré » ; la saisie reste à l'écran pour être copiée.
- Ajouté : en cas de panne, de session expirée ou de compte hors équipe, la page le dit et n'enregistre rien ; elle ne passe jamais en silence dans le navigateur.
- Ajouté : les options de disponibilité ajoutées sont partagées par l'équipe ; la page se met à jour au retour sur l'onglet.
- Modifié : la fiche EC1, la fiche EC2 et la feuille de décompte d'un même candidat peuvent être ouvertes ensemble sans s'écraser.
- Modifié : en mode serveur, l'import ne propose plus « Remplacer tout » ; le texte d'export rappelle qu'un export est une copie.
- Corrigé : la note d'impression et le lien « Ouvrir sur le site » renvoient vers `recrutement.yeita.fr` (et non plus vers l'ancien site GitHub).
- Technique : service Docker `api` (`docker/api.Dockerfile`, Node 22.23.4 figé par digest, utilisateur `node`, sonde de santé), réseau interne `back` sans adresse côté hôte (IPv4 et IPv6), volume `recrutement_data`, oauth2-proxy (upstream `/api/`, `api_routes`), `deploy.sh` qui attend l'api, 6e contrôle de `check-site.sh`, `.dockerignore` ; `assets/demarrage.js`, `assets/adapter-serveur.js`, `DOSSIER.ecrirePartie` ; tests `tools/test-serveur.js`, `tools/e2e-serveur.py`.

## Backlog
- Ajoutées : [1.3-1](../../backlog/1.3-1-bandeau-donnees-fictives-faux-en-mode-serveur.md) bandeau « Données fictives » faux en mode serveur (haute) ; [1.3-2](../../backlog/1.3-2-exemples-fictifs-dans-la-base-partagee.md) exemples fictifs dans la base partagée ; [1.3-3](../../backlog/1.3-3-deploy-controle-configuration-api.md) contrôle de la configuration de `api` dans `deploy.sh` ; [1.3-4](../../backlog/1.3-4-recruteurs-hors-equipe-proposes.md) recruteurs hors équipe ; [1.3-5](../../backlog/1.3-5-check-site-401-origine.md) origine du 401 de `check-site.sh` ; [1.3-6](../../backlog/1.3-6-suites-mode-serveur-robustesse.md) robustesse des suites du mode serveur ; [1.3-7](../../backlog/1.3-7-npm-test-sans-duree-maximale.md) `npm test` sans durée maximale ; [1.3-8](../../backlog/1.3-8-mode-serveur-duplications-et-styles.md) duplications et styles.
- Nouvelles occurrences : [1.1-1](../../backlog/1.1-1-liens-ancien-site-github-pages.md) (reste le libellé « GitHub Pages » de l'inventaire), [1.2-8](../../backlog/1.2-8-fastify-static-importe-en-production.md) (`@fastify/static` maintenant dans l'image).
- Traitées par cette version : [1.2-1](../../backlog/1.2-1-mise-en-service-api-derriere-oauth2-proxy.md) → fait (essai Google réel au guide), [1.2-2](../../backlog/1.2-2-contexte-docker-embarque-api.md) → fait, [1.2-3](../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) → fait (sans la migration), [1.2-4](../../backlog/1.2-4-modele-phrases-perimees.md) → fait (phrases de `MODELE.md` réécrites).

## Étonnements
2 apprentissages retenus, 3 fusionnés avec des règles existantes ([1.3](../../etonnements/1.3-branchement-api.md)). Règles récurrentes signalées par le validateur (le skill devrait évoluer) : vérifications faites dans des conditions plus favorables que la cible (1.2 et 1.3 : `controles.md` § 1 devrait comparer les conditions — plateforme, état des données, concurrence, IPv4/IPv6 — à celles de la cible avant la spec v1) ; résultats de tests lus sur un signal partiel au lieu de la conclusion de la suite (1.2 et 1.3 : `controles.md` § 4 et § 6) ; une règle de concurrence validée par le débat et contredite par l'exécution (première occurrence).

## Couverture de la doc
| Élément | Page |
|---|---|
| R1 à R4e, R8 (démarrage, modes) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Mode serveur](../../technique/mode-serveur.md) |
| R5 à R7, R10 (adaptateur) | [Mode serveur](../../technique/mode-serveur.md) |
| R6g à R6i (fiches, départ) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Mode serveur](../../technique/mode-serveur.md) ; [Décisions](../../technique/decisions.md) |
| R11, R11b (bandeau, Non enregistré) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Mode serveur](../../technique/mode-serveur.md) |
| R12 à R15b (identité, options, retour sur l'onglet) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Mode serveur](../../technique/mode-serveur.md) |
| R16 à R18 (mode navigateur, import, export) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) |
| R22 à R34 (Docker, oauth2-proxy, déploiement) | [Architecture](../../technique/architecture.md) ; [Lancer avec Docker](../../technique/docker-local.md) ; `deploy/README.md` |
| R35, R36 (impression) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) ; [Mode serveur](../../technique/mode-serveur.md) |
| R37, R38 (tests) | [Conventions](../../technique/conventions.md#tests) |
| R40 | `docs/backend/MODELE.md` |
| Composants `demarrage.js`, `adapter-serveur.js`, `DOSSIER.ecrirePartie`, `partirPartie` | [Mode serveur](../../technique/mode-serveur.md) |
| Image `node:22.23.4-slim`, service `api`, réseau `back`, volume | [Architecture](../../technique/architecture.md) ; [Décisions](../../technique/decisions.md) |
| Routes consommées | [API de stockage](../../technique/api.md) |
