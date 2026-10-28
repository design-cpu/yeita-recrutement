---
type: spec
version: 1.8
n: 1
statut: validee
date: 2026-10-28
---

# Spec finale — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> `deploy/deploy.sh` fixe `umask 022` avant d'écrire quoi que ce soit : une mise à jour ou un retour arrière lancé depuis un shell à `umask 077` donne des images lisibles par l'API et par le site.

## Changements depuis la version précédente
Revue de spec : T1 (CA1, CA2 précisés), T2 (R3), P1 (R5), T3 (vues humaines dans Inclus), T4 (R4).

## Contexte et objectif
Fiche 1.7-1. Lancé depuis un shell à `umask 077`, `deploy.sh` laisse git réécrire en 600 les fichiers modifiés (V2) ; copiés tels quels dans les images, ils sont illisibles par `node` (V3) et par oauth2-proxy (V4) : l'API ne démarre pas. Les pages de mise à jour contournent avec `umask 022 &&`, mais pas la commande de retour affichée après un échec.

## Périmètre
### Inclus
- `deploy/deploy.sh`, `deploy/METTRE-A-JOUR.md`, `deploy/README.md` (justification du préfixe), pages `hlyja/technique/mise-a-jour-production.md` et `deploiement-ovh.md`, et leurs vues humaines (réécrites par le rédacteur-relecteur, raison du préfixe alignée sur R3).
### Exclu
Reprend le « Hors périmètre » du cadrage : retrait du préfixe `umask 022 &&` des pages ; réparation d'un dépôt déjà abîmé ; Dockerfiles ; masques de `backup.sh`, `verif-disque.sh`, `commun.sh` ; test automatique de `deploy.sh`.

## Existant réutilisé
| Besoin | Décision | Élément | Référentiel |
|---|---|---|---|
| Banc | réutiliser | conteneur `ubuntu:26.04` privilégié, dockerd, dépôt nu local | [Conventions](../../../technique/conventions.md) |
| Contrôle du site | réutiliser | `tools/check-site.sh` | [Déploiement OVH](../../../technique/deploiement-ovh.md) |

## Règles et comportements
| # | Règle | Détail / valeurs |
|---|---|---|
| R1 | `deploy.sh` fixe `umask 022` avant toute écriture | au niveau du script, juste après `set -euo pipefail`, avec un commentaire qui dit pourquoi (V5) ; vaut pour la mise à jour et pour le retour arrière `deploy.sh <commit>` |
| R2 | Le masque du shell appelant n'est pas modifié | `deploy.sh` est un processus à part : le shell de la personne qui déploie garde son masque |
| R3 | Le préfixe `umask 022 &&` reste dans `METTRE-A-JOUR.md` § 2 et `README.md` § 9 et § 10 | sa justification change : il protège toute exécution où le `deploy.sh` présent sur le disque est antérieur à la 1.8 (V6) : le premier passage à la 1.8, et toute commande lancée après un retour vers un commit d'avant la 1.8 ; la mention « contournement de la fiche 1.7-1 » disparaît |
| R4 | Les numéros de ligne de `deploy.sh` cités par la doc suivent le script | chaque numéro cité pointe, après la modification, sur la ligne qui contient le message ou le contrôle cité ; vérifié par `grep -n` sur ces messages, pas par simple décalage (V7) |
| R5 | Les retours arrière d'urgence restent sans préfixe | la commande affichée par `echec` et `METTRE-A-JOUR.md` § 4 (l. 43 et 47) sont couverts par R1 : à ce moment, le script du disque est celui du commit qui vient d'échouer ou d'être déployé, donc 1.8 ou plus |

## Critères d'acceptation
- [ ] CA1 — Dépôt de départ sur un commit qui contient déjà la correction ; commit visé = correction + modification de `api/server.js` et d'un fichier du site ; lanceur `bash -c 'umask 077; deploy/deploy.sh'` : après `deploy.sh`, ces fichiers sont en 644 dans le dépôt, « API saine. » et « Déploiement réussi » s'affichent, `api/server.js` est lisible par `node` dans l'image api et le fichier du site est servi par `front`.
- [ ] CA2 — Depuis un dépôt sur un commit qui contient la correction, mise à jour à `umask 077` vers un commit qui casse l'API (`api/server.js` qui sort en erreur → « l'api n'est pas saine ») : `ÉCHEC` et la commande de retour s'affichent ; cette commande, lancée **telle quelle, sans préfixe**, depuis un shell à `umask 077` (R5), aboutit ; les fichiers réécrits sont en 644, l'API est saine.
- [ ] CA3 — Non-régression depuis `umask 022` : mise à jour et retour arrière aboutissent comme avant ; le masque du shell appelant est inchangé après `deploy.sh` (R2).
- [ ] CA4 — shellcheck 0.10.0 sur `deploy/*.sh` : aucune remarque ; `cd api && npm test` : `ℹ fail 0`.
- [ ] CA5 — La doc ne parle plus de contournement, garde le préfixe avec la raison de R3 (y compris dans les vues humaines) et cite les bons numéros de ligne (R4).

## Hypothèses et questions ouvertes
Aucune.

## Améliorations possibles
Aucune.
