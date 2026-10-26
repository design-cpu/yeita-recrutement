---
type: revue-backlog
version: 1.2
candidats: 13
nouvelles: 9
occurrences: 0
rejetes: 2
---

# Revue du backlog — version 1.2

> La v1.2 laisse surtout ce qu'il faut pour mettre l'API en service et y brancher les pages : vérifier l'email Google et fermer l'accès direct (1.2-1, haute), l'adaptateur et la migration (1.2-3), la doc du contrat (1.2-4), Docker (1.2-2) et les sauvegardes (1.2-5).

Curateur indépendant. 13 candidats ; 2 regroupements (C1 avec la partie « port » de C2 ; C6, C10 et la partie adaptateur de C12) ; C12 réparti entre deux fiches. Aucune fiche existante n'a été fusionnée.

| Candidat | Source | Verdict | Fiche / raison | Priorité proposée | Justification |
|---|---|---|---|---|---|
| C1 — H1 : email Google dans `X-Forwarded-Email` | spec finale H1 ; vérifications V9 ; QA « À vérifier à la main » ; pilote P1 | nouvelle | [1.2-1](../../../backlog/1.2-1-mise-en-service-api-derriere-oauth2-proxy.md) | haute | condition de fonctionnement et de sécurité de la mise en service ; V9 (essai réel) montre l'en-tête absent sans email de session |
| C2 — `.dockerignore` sans `api/` ; port de l'API jamais publié | pilote P1 ; cadrage (hors périmètre) ; revue de code (hors diff) | nouvelle (scindé) | [1.2-2](../../../backlog/1.2-2-contexte-docker-embarque-api.md) (contexte Docker) ; partie « port » dans [1.2-1](../../../backlog/1.2-1-mise-en-service-api-derriere-oauth2-proxy.md) | moyenne | `COPY . .` + `.dockerignore` constatés : 49 Mo de modules et une base locale possible dans le cache de construction ; le port relève de la même garantie que H1 (V10) |
| C3 — `equipe.js` : refus si l'utilisateur n'est pas propriétaire de la base | tour 1 E2 (intégré en partie → backlog) ; pilote P2 | nouvelle | [1.2-6](../../../backlog/1.2-6-equipe-js-proprietaire-de-la-base.md) | basse | échec sûr et visible, README le prévient ; preuve argumentée (non essayé) |
| C4 — `DEV_STATIC` : refuser un dossier contenant `.git` ou `.env` | tour 1 S2 ; tour 2 ; pilote P2, P4 | rejete | condition 3 (rien de concret à faire) : déjà couvert. `dotfiles: "deny"` (revue S3, `api/src/app.js` l. 85) refuse tout chemin caché, vérifié (`/.secret` 403 à la revérification ; `/.env.local` et traversées 403 en QA S39) ; R9 refuse `DEV_STATIC` qui contient la base ou `api/` (donc la racine du dépôt). Mode local seulement | — | — |
| C5 — sauvegardes sans bloquer le point de contrôle | revue de code S2 et hors diff ; `api/README.md` « Ce que l'API garde » ; QA S20 | nouvelle | [1.2-5](../../../backlog/1.2-5-sauvegarde-base-sqlite.md) | moyenne | effet d'un lecteur ouvert reproduit (QA S20) ; aucune sauvegarde n'existe encore ; ajout : rétention des copies (dossiers supprimés) |
| C6 — adaptateur : réponses non JSON (H3), 404 sans `code`, ne pas fusionner `data` | revue de code (hors diff) ; spec H3 | nouvelle (regroupée) | [1.2-3](../../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) | moyenne | sans effet tant que les pages n'utilisent pas l'API. « Ne pas fusionner `data` » écarté : aucun passage ne le demande hors S4, et S4 est corrigé (l'API refuse `__proto__` et `constructor.prototype` en 400 depuis `5cfc294`) |
| C7 — lockfile : âge et audit des transitives | revue de code (majeur tranché, hors diff) ; cadrage (décision de l'utilisateur) | nouvelle | [1.2-7](../../../backlog/1.2-7-suivi-audit-dependances-api.md) | basse | `npm audit` : 0 ; rendu concret par une consigne dans `conventions.md` ; ne rouvre pas la décision de l'utilisateur |
| C8 — `@fastify/static` importé en production | revue de code Q6 | nouvelle | [1.2-8](../../../backlog/1.2-8-fastify-static-importe-en-production.md) | basse | sans effet constaté |
| C9 — une ligne `data` abîmée → liste en 500 | QA S22, observation O1 | nouvelle | [1.2-9](../../../backlog/1.2-9-ligne-abimee-liste-en-500.md) | basse | reproduit par la QA, mais seulement avec une ligne écrite hors de l'API (dette de robustesse, pas un défaut de la version : voir ci-dessous) |
| C10 — identifiants hors `uid()` refusés à la migration | spec H4 ; vérifications V24 | nouvelle (regroupée) | [1.2-3](../../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) | moyenne | même sujet que C6 : branchement des pages et migration de la version suivante |
| C11 — durée de session (1.1-5) et `disable` immédiat | `api/test/api.test.js`, `api/test/equipe.test.js` ; QA S27 | rejete (comme occurrence) | [1.1-5](../../../backlog/1.1-5-duree-de-session.md) : pas une occurrence — le problème (accès qui survit à un départ) n'a pas été ré-observé en 1.2 ; les tests montrent un mécanisme qui l'atténue pour les dossiers, et la seule mention de 1.1-5 en 1.2 est le « Hors périmètre » du cadrage. Note « Contexte depuis 1.2 » ajoutée à la fiche, `maj: 1.2`, priorité **basse inchangée** (la session longue ne compte plus pour les dossiers que sans `disable` ; à revoir au branchement des pages) | basse (inchangée) | — |
| C12 — l'adaptateur doit appliquer `DOSSIER.upgrade` ; phrase contraire de `MODELE.md` | tour 1 I4 (écarté hors-perimetre par l'arbitre) | nouvelle (répartie) | adaptateur dans [1.2-3](../../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) ; phrase dans [1.2-4](../../../backlog/1.2-4-modele-phrases-perimees.md) | moyenne | constaté : `assets/dossier.js` l. 206, 209 (`upgrade` dans `list`/`get`) contre `MODELE.md` l. 17 |
| C13 — `MODELE.md` « Je recommande une colonne version » | tour 1 I9 ; pilote P2 (« hors accord ») | nouvelle (regroupée avec C12) | [1.2-4](../../../backlog/1.2-4-modele-phrases-perimees.md) | moyenne | même fichier, même lecteur (l'auteur de l'adaptateur) ; constaté l. 18 |

## Doublons fusionnés
Aucun. Fiches existantes comparées : 1.0-1 (`docs/modele-de-donnees.md`, autre fichier que `docs/backend/MODELE.md` de 1.2-4), 1.1-8 (images Docker sans empreinte, voisine de 1.2-7 sans être le même sujet), 1.1-9 et 1.0-2 (publication, sans lien avec le contexte Docker de 1.2-2), 1.1-5 (voir C11). Les autres sont sans rapport.

## Renvoyé à l'orchestrateur
Aucun défaut de la version. Deux points examinés :
- **C9** est du code de la v1.2 (`api/src/candidats.js` l. 39), mais aucune exigence de la spec n'est manquée et aucun parcours de l'API ne peut produire la ligne abîmée (`JSON.stringify` à l'écriture) : classé en dette, pas en défaut.
- **C2 (`.dockerignore`)** est une conséquence de l'arrivée d'`api/`, mais `.dockerignore` est explicitement hors périmètre (cadrage, plan du chef d'équipe : « `.dockerignore` relève de Docker : backlog ») et le site publié n'est pas touché (QA S41). Priorité moyenne : à traiter au plus tard à la version qui conteneurise l'API.

Aucune reproduction demandée : aucun candidat n'est un bug bloquant ou majeur.
