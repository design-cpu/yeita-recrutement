---
type: decoupage
version: 1.2
taches: 9
date: 2026-10-26
---

# Découpage — API Node.js sur SQLite pour les dossiers candidat

> 9 tâches · ordre : socle et configuration, puis la base (risque principal : schéma, transactions, effacement), puis l'autorisation, les routes, le serveur, `equipe.js`, la documentation livrée.

## Tâches
| # | Tâche | Objectif | Dépend de | Spec |
|---|---|---|---|---|
| 01 | [Socle de `api/`](01-socle.md) | `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`, `api` dans `SKIP`, `npm test` qui tourne | — | R1, R2, R3, R33, R34 ; CA1, CA16 |
| 02 | [Configuration](02-configuration.md) | Lecture et contrôle des variables (fonction pure, testée sans processus) ; résolution des chemins depuis `api/` | 01 | R8 (règles), R9 (règles), R10 (chemins), R30 ; CA11 et CA12 (partie configuration) |
| 03 | [Base et schéma](03-base.md) | Ouverture (masque, WAL, `busy_timeout`, `secure_delete`), schéma en transaction immédiate avec relecture de `user_version` | 02 | R10, R11, R12 ; CA9, CA18 (a, c) |
| 04 | [Application et autorisation](04-autorisation.md) | Construction de l'application à partir de la configuration : analyseur JSON, crochet `onRequest` (identité, équipe, rôle, exemption de `/api/sante`), format des erreurs, `no-store`, `/api/sante`, `/api/moi`, `/api/equipe` | 03 | R5, R6, R7, R8 (identité), R16, R24 à R29 ; CA2, CA3, CA14, CA15, CA17 (401, 403, exemption) |
| 05 | [Dossiers candidat](05-candidats.md) | Liste, lecture, PUT (création, mise à jour, conflit), DELETE (purge du journal), journal, point de contrôle `TRUNCATE`, 503 | 04 | R11, R13 à R15, R17 à R22 ; CA4 à CA8, CA10 (503), CA15, CA17 (409) |
| 06 | [Options de disponibilité](06-options.md) | GET et POST des options ajoutées | 04 | R23 ; CA13 |
| 07 | [Serveur](07-serveur.md) | Point d'entrée : écoute, ligne de démarrage, avertissements, `DEV_STATIC`, erreurs de démarrage en code 1, arrêt en code 0 | 05, 06 | R4, R8, R9, R30, R31 ; CA11, CA12 |
| 08 | [`equipe.js`](08-equipe.md) | Les 4 commandes, affichages, erreurs, même base, même masque, même schéma | 03 | R32 ; CA10, CA18 (b) |
| 09 | [Documentation livrée](09-documentation.md) | `api/README.md` (dont le contrat HTTP), renvoi du `README.md` racine, section des tables de `MODELE.md` | 07, 08 | R35, R36 |

## Logique d'ordre
La base porte le risque principal (transactions, schéma, effacement sur le disque) : elle vient juste après la configuration dont elle dépend. L'autorisation précède toutes les routes, qui la supposent. Le serveur assemble le tout ; `equipe.js` ne dépend que de la base. La documentation décrit le code fini.

## Dépendances
```mermaid
flowchart LR
  T01[01 Socle] --> T02[02 Configuration] --> T03[03 Base]
  T03 --> T04[04 Autorisation]
  T04 --> T05[05 Dossiers]
  T04 --> T06[06 Options]
  T05 --> T07[07 Serveur]
  T06 --> T07
  T03 --> T08[08 equipe.js]
  T07 --> T09[09 Documentation]
  T08 --> T09
