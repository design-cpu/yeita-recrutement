---
type: bilan
version: 1.2
statut: terminee
mode: complexe
type_version: livrable
score: 94
tours: 2
taches_ok: 9
taches_echec: 0
qa_taux: 100
date: 2026-10-26
---

# Bilan — Version 1.2

> **Terminée** · Spec validée à 94/100 en 2 tours (74 au tour 1) · 9/9 tâches ok · QA 95,6 % puis 100 % après correction de 2 bugs mineurs · 52 tests.
> Avant de merger : suivre le guide de test (5 parcours, ~15 min). L'API n'est encore ni dans Docker, ni derrière oauth2-proxy, ni branchée aux pages : c'est la version suivante (fiche 1.2-1, priorité haute).

## Résultat
| Étape | Résultat |
|---|---|
| Vérifications | 29, dont 8 écarts ; essai d'attaque sur `X-Forwarded-Email` avec témoin avant la spec v1 (V9, V10) |
| Spec | validée, 94/100, 2 tours ; 4 décisions de l'utilisateur (écoute sur 127.0.0.1 et `HOST`, Fastify 5.12.7, tables de `MODELE.md` alignées, journal purgé à la suppression) |
| Tâches | 9 ok, 0 échec ; chaque contrôle mis à l'épreuve par mutation (2 mutations survivantes → tests renforcés) |
| Revue de code | 0 bloquant ; 1 majeur (transitives de moins de 14 jours) tranché par l'utilisateur : lockfile gardé, exception notée ; 11 mineurs, 9 corrigés, Q6 au backlog (1.2-8) ; revérifiée sans régression |
| QA | 45 scénarios, 43 ok puis 45 après correction (B1 `DB_PATH` avec espace, B2 `NODE_ENV` entre guillemets) ; CA1 rejoué dans `node:22-bookworm-slim` sans Python ; 3 points à vérifier à la main |
| Tests | `cd api && npm test` : 52/52 (~20 s) ; `node tools/test-store.js` : TOUT OK |
| Doc | page technique `api.md` créée ; `architecture`, `conventions`, `decisions` mises à jour, avec leurs vues humaines ; 8 termes au glossaire ; `api/README.md` ; tables de `MODELE.md` ; 7 erreurs de source corrigées |
| Backlog | 9 fiches créées (1.2-1 à 1.2-9), 0 occurrence |

## Tester en local
```bash
git switch version/1.2-api-sqlite
cd api && npm ci && npm test
```
Puis suivre qa/guide-test-humain.md.

## Reste à faire avant de merger
- Dérouler le guide de test humain (5 parcours).
- Rien d'autre : la version ne touche ni aux pages ni à Docker, elle peut être mergée seule.

## Réserves
Aucune.

## Écarts avec la spec
- R7 : le rôle `lecture` peut faire `HEAD` en plus de `GET` (Fastify crée `HEAD` pour chaque `GET`) ; documenté.
- R30 : refus ajoutés après la QA (espace au début ou à la fin de `DB_PATH` et `DEV_STATIC`, `#` et guillemets dans `NODE_ENV`), dans l'esprit de la règle.
- R21 : si un autre programme lit la base au même moment, le point de contrôle n'attend pas plus de 100 ms ; l'effacement sur le disque est alors retardé jusqu'à l'écriture suivante (avertissement journalisé, documenté, fiche 1.2-5).
- R15 : un identifiant de plus de 200 caractères reçoit 404 « Route inconnue. » au lieu de 400 ; documenté dans le contrat HTTP.

## Tâches en échec
Aucune.

## Changelog
- Ajouté : une API de stockage dans `api/` garde les dossiers candidat dans une base SQLite, réservée aux membres actifs de l'équipe ; elle n'est pas encore utilisée par les pages.
- Ajouté : deux recruteurs qui modifient le même dossier ne s'écrasent plus : le second reçoit « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. ».
- Ajouté : `node api/equipe.js` pour ajouter, lister, désactiver un membre ou changer son rôle, sur le serveur.
- Ajouté : la suppression d'un dossier l'efface aussi des fichiers de la base ; le journal n'en garde qu'une ligne « supprimé par… le… ».
- Ajouté : un mode local (`DEV_EMAIL`, `DEV_STATIC`) pour développer sur un poste, refusé en production et hors de la machine.
- Modifié : `docs/backend/MODELE.md` décrit les tables réelles et renvoie au contrat HTTP de `api/README.md`.
- Technique : Node.js 22, Fastify 5.12.7, better-sqlite3 13.0.3, @fastify/static 10.1.6, versions figées ; tests `node:test` ; `api` exclu de la publication du site.

## Backlog
- Ajoutées : [1.2-1](../../backlog/1.2-1-mise-en-service-api-derriere-oauth2-proxy.md) vérifier l'email Google dans l'en-tête et ne jamais publier le port de l'API (haute) · [1.2-2](../../backlog/1.2-2-contexte-docker-embarque-api.md) contexte Docker qui embarque `api/` · [1.2-3](../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) cas laissés à l'adaptateur et à la migration · [1.2-4](../../backlog/1.2-4-modele-phrases-perimees.md) deux phrases périmées de `MODELE.md` · [1.2-5](../../backlog/1.2-5-sauvegarde-base-sqlite.md) sauvegarde sans retarder l'effacement · [1.2-6](../../backlog/1.2-6-equipe-js-proprietaire-de-la-base.md) `equipe.js` et le propriétaire de la base · [1.2-7](../../backlog/1.2-7-suivi-audit-dependances-api.md) suivi de l'audit des dépendances · [1.2-8](../../backlog/1.2-8-fastify-static-importe-en-production.md) @fastify/static chargé en production · [1.2-9](../../backlog/1.2-9-ligne-abimee-liste-en-500.md) un dossier abîmé rend la liste indisponible
- Nouvelles occurrences : aucune ([1.1-5](../../backlog/1.1-5-duree-de-session.md) reçoit une note de contexte : `disable` coupe l'accès aux dossiers dès la requête suivante).
- Traitées par cette version : aucune.

## Couverture de la doc
| Élément | Page |
|---|---|
| Routes (9 + attrape-tout), codes et messages d'erreur | [API de stockage](../../technique/api.md#routes) ; `api/README.md` § Contrat HTTP |
| Tables `equipe`, `candidats`, `journal`, `options_disponibilite` | [API de stockage](../../technique/api.md#base-apisrcbasejs) ; `docs/backend/MODELE.md` § Tables SQLite |
| Variables `PORT`, `HOST`, `DB_PATH`, `NODE_ENV`, `DEV_EMAIL`, `DEV_STATIC` | [API de stockage](../../technique/api.md#configuration-apisrcconfigjs) ; `api/README.md` § Variables |
| Dépendances | [Architecture](../../technique/architecture.md#stack) |
| Décisions (API, confiance dans l'en-tête, version optimiste, effacement réel, âge des dépendances) | [Décisions](../../technique/decisions.md) |
| Tests | [Conventions](../../technique/conventions.md#tests) |
| `equipe.js` | [API de stockage](../../technique/api.md#equipejs) ; `api/README.md` § Gérer l'équipe |
Pas de doc produit : aucune page ni aucun parcours utilisateur ne change à cette version.
