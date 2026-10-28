---
type: rapport-qa
version: 1.8
scenarios: 6
reussis: 6
echecs: 0
date: 2026-10-28
---

# Rapport QA — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> 6 scénarios sur 6 réussis, aucun bug. Sous `umask 077`, la mise à jour et la commande de retour affichée après un échec réécrivent les fichiers en 644 ; l'API est saine et le site sert le fichier modifié.
> Le témoin (même essai avec le `deploy/deploy.sh` de `main`) casse bien : fichiers en 600, `EACCES` dans l'image api, `ÉCHEC : l'api n'est pas saine`, page du site en 403.
> Non-régression sous `umask 022` : mise à jour et retour arrière aboutissent ; le masque du shell appelant n'est jamais modifié.
> shellcheck sans remarque, `ℹ fail 0`, doc sans « contournement » et numéros de ligne justes. Un écart de doc est noté hors CA : `deploy/METTRE-A-JOUR.md` n'a pas reçu la précision que sa vue humaine a reçue.

## Banc

| Élément | Version |
|---|---|
| Poste | macOS, Docker Desktop 29.9.2 (aarch64) ; utilisé seulement pour héberger le banc, shellcheck et `npm test` |
| Banc | conteneur `banc-qa-18` : `ubuntu:26.04` (26.04.1 LTS), `--privileged`, `/var/lib/docker` et `/var/lib/containerd` sur volumes, `recrutement.localhost` → 127.0.0.1 par `--add-host` |
| Moteur du banc | `docker.io` 29.1.3, Docker Compose 2.40.3+ds1-0ubuntu1 (paquets Ubuntu) |
| Outils | git 2.53.0, curl 8.18.0, age 1.2.1, iproute2, util-linux |
| Images construites | `recrutement-api` (node 22.23.4, utilisateur `node`), `recrutement-front` (oauth2-proxy v7.15.5, utilisateur 65532), `caddy:2.11.7` (`sha256:5e5286cb…`) |
| Dépôt | dépôt nu `/srv/depot.git` construit depuis la branche à `d85f947` (correction) ; `ancien-main` = `b1f3567` ; clone `/opt/recrutement` par `prepare-serveur.sh` (« Serveur prêt. ») |
| Réglage du banc | `git config --system --add safe.directory /srv/depot.git` : le dépôt nu appartient à root, `git clone` en `deploy` le refusait (« dubious ownership ») ; propre au banc, sans lien avec le produit |

La branche a reçu `d566a73` (documentation) pendant la QA : `git diff d85f947 d566a73 -- deploy/ api/` est vide, les résultats du banc valent pour `d566a73` ; S4 et S5 ont été rejoués sur `d566a73`.

Commits de test ajoutés dans le dépôt nu, au-dessus de `d85f947` : C1 `596ad46` (`api/server.js`, `one-pager.html`, `candidatures/style.css` modifiés), C2 `bd96550` (`api/server.js` sort en erreur au démarrage), C3 `cd612e3` (API réparée, 3 fichiers modifiés), C4 `b1d90cb` (témoin : `deploy/deploy.sh` identique à celui de `b1f3567`, SHA-256 `8824a899…` des deux côtés, `grep -c umask` = 0), C5 `8eb578a` (témoin : 3 fichiers modifiés).

Le banc, ses deux volumes et les images qu'il contenait sont supprimés ; l'image d'essai `qa18-essai-api` du guide aussi. Journaux gardés hors dépôt : `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/4584fb7d-909d-4290-9552-ddd9314d215d/scratchpad/qa/logs/`.

## Résultats

| # | CA | Résultat | Obtenu (cité) |
|---|---|---|---|
| S1 | CA1 | réussi | `bash -c 'umask 077; deploy/deploy.sh'` de `d85f947` vers `596ad46` : « · Dépôt sur main : 596ad46. », « · API saine. », 7 `OK`, « Déploiement réussi : 596ad46 sur https://recrutement.localhost », code 0. `644 deploy api/server.js`, `644 deploy one-pager.html`, `644 deploy candidatures/style.css`. API `healthy`. Image api : « lisible ; dernière ligne : // QA 1.8 : C1 ». Image front : `-rw-r--r-- 0/0 … srv/site/one-pager.html`, idem `candidatures/style.css`. `curl` de `/one-pager.html` : 200, marqueur `QA-1.8-C1` présent. Masque du shell appelant après : `0077` |
| S2 | CA2, R5 | réussi | Vers `bd96550` sous `umask 077` : « ÉCHEC : l'api n'est pas saine après 60 s (état : unhealthy ; docker compose logs api). » puis « Pour revenir à la version précédente : deploy/deploy.sh 596ad46 », code 1 ; journal api : « QA 1.8 : panne voulue au démarrage » ; fichiers déjà en 644. Commande recopiée telle quelle `[deploy/deploy.sh 596ad46]`, lancée par `bash -c 'umask 077; deploy/deploy.sh 596ad46'` : « · Dépôt sur 596ad46 (détaché ; … reprend main). », « · API saine. », 7 `OK`, « Déploiement réussi : 596ad46 … », code 0 ; `api/server.js` et `one-pager.html` réécrits à 11:38:22 et en 644 ; image api « lisible » ; front 644 ; `curl` 200 avec `QA-1.8-C1`. Masque appelant : `0077` |
| S3 | CA3, R2 | réussi | `bash -c 'umask 022; deploy/deploy.sh'` depuis `596ad46` détaché : « · Dépôt sur main : cd612e3. », « · API saine. », « Déploiement réussi : cd612e3 … », code 0, 644, image api « // QA 1.8 : C3 », `curl` `QA-1.8-C3`. Retour `bash -c 'umask 022; deploy/deploy.sh 596ad46'` : « Déploiement réussi : 596ad46 … », code 0, 644, `QA-1.8-C1` servi. Masque appelant : `0022` les deux fois |
| S4 | CA4 | réussi | shellcheck : aucune sortie, code 0 ; `npm test` : `ℹ fail 0` (lignes complètes plus bas) |
| S5 | CA5, R3, R4 | réussi | `grep -i contournement` : aucune occurrence (README, `METTRE-A-JOUR.md`, `mise-a-jour-production.md`, `deploiement-ovh.md` et leurs vues humaines). `README.md` § 9 : préfixe `umask 022 && /opt/recrutement/deploy/deploy.sh` gardé, et « Le préfixe `umask 022 &&` reste utile quand le `deploy.sh` du serveur est antérieur à la 1.8 : au premier passage à la 1.8, et après un retour vers un commit d'avant la 1.8. » ; § 10 garde le préfixe. Les deux pages gardent le préfixe avec la même raison (point « Masque des fichiers »). Numéros vérifiés ligne par ligne, tableau ci-dessous |
| T1 | témoin | réussi (le banc voit le bug) | Avec le `deploy.sh` de `main` sur le disque, `bash -c 'umask 077; deploy/deploy.sh'` vers `8eb578a` : « ÉCHEC : l'api n'est pas saine après 60 s (état : unhealthy ; docker compose logs api). », « Pour revenir à la version précédente : deploy/deploy.sh b1d90cb », code 1. `600 deploy api/server.js`, `600 deploy one-pager.html`, `600 deploy candidatures/style.css`. Image api : « EACCES: permission denied, open '/app/api/server.js' » (même erreur dans `docker compose logs api`). Image front : `-rw------- 0/0 … srv/site/one-pager.html` et `candidatures/style.css`. `curl` `/one-pager.html` : **403**, marqueur absent |

Complément du témoin (illustre R3, hors CA) : sur ce même état, `bash -c 'umask 077; umask 022 && deploy/deploy.sh b1d90cb'` : « Déploiement réussi : b1d90cb … », code 0, fichiers repassés en 644, API `healthy`. Le préfixe gardé par la doc répare bien le cas d'un `deploy.sh` d'avant la 1.8.

Numéros de ligne de `deploy.sh` cités (R4), sur `d566a73` :

| Page | Cité | Ligne de `deploy.sh` (`sed -n`) | Juste ? |
|---|---|---|---|
| `mise-a-jour-production.md` étape 2 | l. 102 | `info "Dépôt sur main : …"` | oui |
| idem | l. 113 | `info "Conteneurs à jour ; anciennes images du projet supprimées."` | oui |
| idem | l. 134 | `info "API saine."` | oui |
| idem | l. 139 | `tools/check-site.sh … && { echo "Déploiement réussi : …` | oui |
| idem (`check-site.sh`) | l. 51 | `echo "Tout est OK sur $BASE"` | oui |
| `mise-a-jour-production.md` « Masque des fichiers », `deploiement-ovh.md` « Masque des fichiers » et historique | l. 9 | `umask 022` | oui |
| `deploiement-ovh.md` étape 5 | l. 36-55 | de `# --- Réglages (.env) ---` au `done` des valeurs d'exemple | oui |
| `deploiement-ovh.md` « Premier déploiement » | l. 122-134 | du commentaire « L'api (depuis la 1.3) » à `info "API saine."` | oui |

## Par couche

| Couche | Couverte ? | Par |
|---|---|---|
| Unitaire | oui | `npm test` (API inchangée, 58 tests) |
| Intégration | oui | images api et front lues après chaque déploiement (S1, S2, T1) |
| Composant / UI | écartée | aucune page du site ne change |
| Bout en bout | oui | S1, S2, S3, T1 sur le banc, `check-site.sh` à chaque fois |
| Non-régression | oui | S3 (`umask 022`), S4 |
| Accessibilité | écartée | aucun écran modifié |
| Performance | écartée | une ligne `umask 022`, sans effet mesurable |
| Sécurité | oui, ciblée | fichiers réécrits en 644, pas plus ouverts ; `.env` reste 600 (non réécrit) |
| Manuel | oui | guide de test humain (essai sur le Mac sous zsh exécuté par la QA, plus contrôle optionnel au prochain déploiement réel) |

## Suite de tests complète

shellcheck (`docker run --rm -e LC_ALL=C.UTF-8 -v "$PWD:/mnt:ro" -w /mnt koalaman/shellcheck:v0.10.0 -x deploy/*.sh`) : aucune ligne affichée, `code shellcheck: 0`.

`cd api && npm test` (Node v22.23.4, `node:22-slim`, utilisateur `node`) :

```
ℹ tests 58
ℹ suites 0
ℹ pass 58
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 21840.96501
```

Lancé en root, la suite affiche en plus « ℹ lancé en root : cas « dossier non inscriptible » ignoré » : d'où le passage en utilisateur `node`.

## Bugs trouvés

Aucun.

## Régressions

Aucune : sous `umask 022`, mise à jour et retour arrière se déroulent comme avant (mêmes messages, code 0) ; `npm test` et shellcheck inchangés.

## À vérifier à la main

- **Premier passage réel à la 1.8** : il sera lancé par le `deploy.sh` d'avant la 1.8 (lu avant le `git pull`). Garder le préfixe `umask 022 &&` de `deploy/METTRE-A-JOUR.md` § 2 ; après, contrôle rapide du guide de test humain (P4).
- **Constat de doc hors CA (à trancher par l'équipe)** : `deploy/METTRE-A-JOUR.md` est inchangé depuis `main` alors que la spec le met dans le périmètre. Sa vue humaine `hlyja/technique/mise-a-jour-production.humain.md` a reçu en `d566a73` deux ajouts que le fichier source n'a pas : la raison R3 du préfixe en § 2 (le source dit encore « le `umask 022` garantit que les fichiers mis à jour restent lisibles par l'application ») et, en § 4, « Seule exception : si tu étais justement en train de revenir vers une version d'avant la v1.8, ajoute `umask 022 &&` devant la commande affichée ». Sur le serveur, c'est `deploy/METTRE-A-JOUR.md` qu'on lit. Pas de « contournement », préfixe présent : CA5 tel que vérifié reste satisfait. La phrase de § 4 décrit un cas réel : le complément du témoin le confirme (même cas que le mineur 1 de la revue de code).

## Traitement après la QA
- Constat de doc hors CA : traité par l'orchestrateur. `deploy/METTRE-A-JOUR.md` § 4 (l. 43) et la source `hlyja/technique/mise-a-jour-production.md` (étape 4) portent maintenant l'exception (« si la commande qui vient d'échouer était déjà un retour vers une version d'avant la 1.8, ajouter `umask 022 &&` devant »). La phrase de § 2 reste telle quelle : elle est exacte.
