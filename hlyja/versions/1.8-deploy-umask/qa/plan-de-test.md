---
type: plan-de-test
version: 1.8
scenarios: 6
date: 2026-10-28
---

# Plan de test — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> 6 scénarios limités aux CA1 à CA5, plus un témoin obligatoire (CA1 rejoué avec le `deploy/deploy.sh` de `main`, sans la correction).
> CA1 à CA3 se jouent de bout en bout sur un banc jetable `ubuntu:26.04` privilégié avec son propre dockerd, un dépôt nu local et l'utilisateur `deploy` créé par `deploy/prepare-serveur.sh`.
> Chaque lanceur fixe son masque lui-même (`bash -c 'umask 077; …'` ou `umask 022`), jamais celui du shell de la QA.
> CA4 (shellcheck, `npm test`) et CA5 (doc, `grep -n`) sont des contrôles directs sur la branche.

## Matrice

| CA | Unitaire | Intégration | Composant / UI | Bout en bout | Non-régression | Accessibilité | Performance | Sécurité | Manuel |
|---|---|---|---|---|---|---|---|---|---|
| CA1 — mise à jour sous `umask 077` | — | S1 (images api et front) | — | S1 | — | — | — | S1 (droits 644, pas plus) | guide P2 |
| CA2 — échec puis commande de retour sous `umask 077` | — | S2 | — | S2 | — | — | — | — | — |
| CA3 — `umask 022`, masque appelant inchangé | — | — | — | S3 | S3 | — | — | — | guide P4 |
| CA4 — shellcheck, `npm test` | S4 (`npm test`) | — | — | — | S4 | — | — | — | — |
| CA5 — doc | — | — | — | — | — | — | — | — | S5 (`grep -n`) |
| Témoin | — | T1 | — | T1 | — | — | — | — | guide P1 |

## Couches écartées

| Couche | Raison |
|---|---|
| Composant / UI | aucune page ni script du site ne change ; le site n'est regardé qu'à travers le fichier servi par `front` (S1). |
| Accessibilité | aucun écran modifié. |
| Performance | une ligne `umask 022` ; aucun effet mesurable sur la durée d'un déploiement. |
| Unitaire sur `deploy.sh` | pas de test automatique de `deploy.sh` (exclu par la spec) ; `npm test` sert de non-régression de l'API, inchangée. |
| Sécurité au-delà des droits | la revue de code a traité le reste (verrou, `.git/`, `.env` jamais réécrit) ; la QA vérifie seulement que les fichiers réécrits sont en 644, pas plus ouverts. |

## Scénarios

| # | CA | Masque du lanceur | Départ → visée | Attendu |
|---|---|---|---|---|
| S1 | CA1 | `umask 077` | correction (`d85f947`) → C1 (correction + `api/server.js`, `one-pager.html`, `candidatures/style.css` modifiés) | 3 fichiers en 644 ; « API saine. » ; « Déploiement réussi » ; `node` lit `server.js` dans l'image api ; fichiers du site en 644 dans `recrutement-front` (utilisateur 65532) ; `one-pager.html` modifié servi |
| S2 | CA2, R5 | `umask 077` (mise à jour puis retour) | C1 → C2 (`api/server.js` sort en erreur) → commande affichée | `ÉCHEC : l'api n'est pas saine…` et `Pour revenir à la version précédente : deploy/deploy.sh <C1>` ; la commande lancée telle quelle aboutit, fichiers réécrits en 644, API saine |
| S3 | CA3, R2 | `umask 022` | C1 (détaché) → C3 (main réparé) → retour à C1 | deux « Déploiement réussi » ; 644 ; masque appelant inchangé (`0022` ; `0077` dans S1 et S2) |
| S4 | CA4 | — | branche | shellcheck code 0 sans remarque ; `ℹ fail 0` |
| S5 | CA5, R3, R4 | — | branche | aucune « contournement » ; préfixe gardé avec la raison de R3 ; chaque « l. n » de `deploy.sh` cité pointe sur le message ou le contrôle |
| T1 | témoin | `umask 077` | C4 (`deploy.sh` remis à l'identique de `main` `b1f3567`) → C5 (mêmes fichiers modifiés) | 600, `EACCES` dans l'image api, `ÉCHEC : l'api n'est pas saine`, fichier du site non servi |

## Détail des scénarios

**Banc commun.** Conteneur `ubuntu:26.04` `--privileged`, `--add-host recrutement.localhost:127.0.0.1`, `/var/lib/docker` et `/var/lib/containerd` sur deux volumes ; paquets `docker.io docker-compose-v2 git curl age iproute2 util-linux openssh-client passwd` ; `dockerd` lancé à la main. Dépôt nu `/srv/depot.git` construit depuis un bundle de la branche (`main` du dépôt nu = `d85f947`, branche `ancien-main` = `b1f3567`) ; `deploy/prepare-serveur.sh` lancé avec `RECRUTEMENT_REPO=/srv/depot.git` ; `.env` copié de `.env.example` puis `DOMAIN=recrutement.localhost`, URL de retour, identifiant et secret client changés, cookie secret de 32 caractères régénéré, `COMPOSE_PROFILES=caddy`. Premier déploiement sous `umask 022` pour partir d'une pile qui tourne. Commandes de `deploy` : `runuser -u deploy -- env -i HOME=/home/deploy PATH=… bash -c "cd /opt/recrutement && …"`.

**Contrôles après chaque déploiement** (`controles`) : `stat -c '%a %U %n'` des 3 fichiers ; état de santé de `recrutement-api-1` ; `docker run --rm --entrypoint node recrutement-api -e "readFileSync('/app/api/server.js')"` ; `docker create recrutement-front` + `docker export | tar -tvf -` sur `srv/site/one-pager.html`, `candidatures/style.css`, `index.html` ; `curl -sk https://recrutement.localhost/one-pager.html` et recherche du marqueur du commit. `candidatures/style.css` est derrière la connexion Google : contrôlé dans l'image seulement (pas de compte Google dans le banc). `index.html` n'est pas pris comme sonde : `tools/build.py` le réécrit, et `one-pager.html` (public, copié tel quel par `copytree`) montre mieux la propagation des droits.

**S1.** C1 poussé dans le dépôt nu ; `bash -c 'umask 077; deploy/deploy.sh; echo "code…"; echo "masque…$(umask)"'`.

**S2.** C2 ajoute `console.error("QA 1.8 : panne voulue au démarrage"); process.exit(1);` en tête de `api/server.js` ; même lanceur. La ligne `Pour revenir…` est extraite du journal et lancée par `bash -c 'umask 077; <commande>'` depuis `/opt/recrutement`.

**S3.** C3 retire la panne et modifie les 3 fichiers ; `bash -c 'umask 022; deploy/deploy.sh'` puis `bash -c 'umask 022; deploy/deploy.sh <C1>'`.

**S4.** `docker run --rm -e LC_ALL=C.UTF-8 -v "$PWD:/mnt:ro" -w /mnt koalaman/shellcheck:v0.10.0 -x deploy/*.sh` ; `npm test` dans `node:22-slim` en utilisateur `node`, avec terminal (`-t`) pour le rapporteur `spec`.

**S5.** `grep -n -i contournement` sur `deploy/README.md`, `deploy/METTRE-A-JOUR.md`, les deux pages et leurs vues humaines ; lecture de `README.md` § 9 ; `grep -nE "l\. ?[0-9]"` des deux pages, puis `sed -n "<n>p" deploy/deploy.sh` de chaque numéro.

**T1.** Après S3, C4 remet `deploy/deploy.sh` à l'octet près comme dans `b1f3567` (empreintes SHA-256 comparées), déployé sous `umask 022` (le script du disque devient l'ancien) ; C5 modifie les 3 fichiers ; `bash -c 'umask 077; deploy/deploy.sh'`.
