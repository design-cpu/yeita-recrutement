---
type: guide-test-humain
version: 1.8
date: 2026-10-28
---

# Guide de test humain — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> But : voir de tes yeux qu'un fichier réécrit par git sous un réglage « fichiers privés » (`umask 077`) reste lisible dans l'image de l'API quand c'est le début du nouveau `deploy.sh` qui lance git, alors qu'il devient illisible avec l'ancien.
> Tout se passe sur ton Mac, dans une copie jetable du dépôt : rien n'est modifié dans ton dossier de travail, rien ne touche le serveur. Compte 10 minutes.
> En option, un contrôle de 2 minutes sur le serveur après la prochaine mise à jour réelle.
> Chaque bloc se copie en entier dans le Terminal (zsh) et se valide par Entrée.

## Préparer

1. **Docker Desktop est lancé.** Copie :

   ```zsh
   docker info --format '{{.ServerVersion}}'
   ```

   Tu dois voir un numéro de version, par exemple `29.9.2`.
   Sinon (message « Cannot connect to the Docker daemon ») : ouvre l'application Docker Desktop, attends que la baleine de la barre de menus ne bouge plus, relance la commande.

2. **Copie jetable du dépôt**, dans le même Terminal que la suite (le bloc retient le dossier dans `$d`) :

   ```zsh
   cd ~/Documents/Yeita/Projects/Github/yeita-recrutement && d=$(mktemp -d) && git clone --quiet --branch version/1.8-deploy-umask . "$d/r" && cd "$d/r" && grep -n '^umask' deploy/deploy.sh
   ```

   Tu dois voir `9:umask 022` : la ligne ajoutée par la 1.8, en 9e ligne du script.
   Sinon :
   - « no such file or directory » : ton dépôt est ailleurs ; remplace `~/Documents/Yeita/Projects/Github/yeita-recrutement` par son chemin et relance.
   - « Remote branch version/1.8-deploy-umask not found » : la version a déjà été fusionnée ; fais `git pull` sur `main` dans ton dépôt, remplace `version/1.8-deploy-umask` par `main` dans le bloc et relance.
   - rien ne s'affiche après le clone : la copie ne contient pas la correction (mauvaise branche) ; arrête-toi là et signale-le.

## Parcours essentiels

### P1 — Témoin : l'ancien script laisse git écrire un fichier privé

Ce bloc rejoue, avec l'en-tête du `deploy.sh` d'avant la 1.8 (commit `b1f3567`), ce que fait une mise à jour : git réécrit `api/server.js`. Les parenthèses gardent le réglage `umask 077` à l'intérieur du bloc : ton Terminal n'est pas modifié.

```zsh
( umask 077; bash -c "$(git show b1f3567:deploy/deploy.sh | sed -n '1,/^set -euo pipefail/p'); rm api/server.js; git checkout -- api/server.js"; stat -f '%Lp %N' api/server.js )
```

Tu dois voir `600 api/server.js` (lisible par son seul propriétaire).
Sinon : `644 api/server.js` veut dire que le réglage n'a pas joué ; vérifie que tu as copié le bloc en entier, parenthèses comprises, et relance. « bad revision » : ta copie ne connaît pas `b1f3567` ; refais l'étape 2 de « Préparer ».

Puis construis l'image de l'API avec ce fichier et demande à l'API de le lire (1 à 3 minutes la première fois) :

```zsh
docker build -q -f docker/api.Dockerfile -t qa18-essai-api . >/dev/null && docker run --rm --entrypoint node qa18-essai-api -e "require('fs').readFileSync('/app/api/server.js'); console.log('lisible')" 2>&1 | grep -E 'lisible|EACCES' | head -1
```

Tu dois voir `Error: EACCES: permission denied, open '/app/api/server.js'` : c'est le bug, l'API ne pourrait pas démarrer.
Sinon : `lisible` veut dire que le fichier n'était pas en 600 ; refais le bloc précédent. Une erreur de construction (« failed to solve ») : vérifie ta connexion Internet (l'image télécharge ses dépendances) et relance.

### P2 — Correction : le nouveau script fixe le réglage pour git, pas pour toi

Même essai, mais avec le début du `deploy.sh` de la 1.8 (jusqu'à sa ligne `umask 022`) :

```zsh
( umask 077; bash -c "$(sed -n '1,/^umask 022/p' deploy/deploy.sh); rm api/server.js; git checkout -- api/server.js; echo \"masque dans le script : \$(umask)\""; stat -f '%Lp %N' api/server.js; echo "masque du shell qui a lancé le script : $(umask)" )
```

Tu dois voir, dans l'ordre :
- `masque dans le script : 0022` (le script s'est réglé lui-même) ;
- `644 api/server.js` (lisible par tous) ;
- `masque du shell qui a lancé le script : 077` (le shell qui l'a lancé garde son réglage).

Sinon : `600 api/server.js` ou `masque dans le script : 0077` : la correction n'est pas dans ta copie ; refais l'étape 2 de « Préparer » et vérifie `9:umask 022`, puis signale-le.

Puis la même image, reconstruite avec ce fichier :

```zsh
docker build -q -f docker/api.Dockerfile -t qa18-essai-api . >/dev/null && docker run --rm --entrypoint node qa18-essai-api -e "require('fs').readFileSync('/app/api/server.js'); console.log('lisible')" 2>&1 | grep -E 'lisible|EACCES' | head -1
```

Tu dois voir `lisible`.
Sinon : `EACCES` veut dire que l'image a gardé l'ancien fichier ; vérifie que le bloc précédent affichait bien `644`, puis relance celui-ci.

Enfin, ton Terminal n'a pas changé :

```zsh
echo "masque de ton Terminal : $(umask)"
```

Tu dois voir ton réglage habituel, en général `022`. Sinon (`077`) : tu as copié un bloc sans ses parenthèses ; ferme ce Terminal et ouvre-en un nouveau.

### P3 — Ranger

```zsh
cd ~ && docker image rm qa18-essai-api >/dev/null && rm -rf "$d" && echo "rangé"
```

Tu dois voir `rangé`.
Sinon : « No such image » : l'image n'existait plus, lance seulement `rm -rf "$d" && echo "rangé"`. Si `$d` est vide (Terminal fermé entre-temps), il n'y a rien à supprimer à la main : macOS vide ce dossier temporaire tout seul.

### P4 — En option : sur le serveur, juste après la prochaine mise à jour réelle

À faire seulement quand une mise à jour du site est prévue de toute façon, connecté en `deploy` sur le serveur (`ssh deploy@51.75.252.121`). Lance la mise à jour **avec le préfixe**, comme d'habitude :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

Tu dois voir en dernière ligne `Déploiement réussi : <commit> sur https://recrutement.yeita.fr`.
Sinon : si la dernière ligne commence par `ÉCHEC :`, lance tout de suite la commande affichée juste en dessous (`deploy/deploy.sh <commit>`), puis transmets le message à la personne responsable du site ; si elle commence par `ARRÊT : un déploiement est déjà en cours`, attends 5 minutes et relance.

Puis, toujours sur le serveur :

```bash
cd /opt/recrutement && grep -n '^umask' deploy/deploy.sh && find . -path ./.git -prune -o -type f ! -perm -o=r -print && docker compose ps api
```

Tu dois voir :
- `9:umask 022` (le serveur a la 1.8) ;
- une seule ligne de fichier : `./.env` (le seul fichier privé voulu) ;
- une ligne `recrutement-api-1` dont la colonne STATUS finit par `(healthy)`.

Sinon :
- pas de `9:umask 022` : le serveur n'est pas encore en 1.8 (la version n'était pas dans `main`) ; rien d'anormal, refais ce contrôle après la mise à jour qui l'apportera.
- d'autres fichiers que `./.env` sont listés : ils sont illisibles pour l'API ou le site ; ne touche à rien et envoie la liste à la personne responsable du site.
- `(unhealthy)` ou `(health: starting)` : attends une minute et relance `docker compose ps api` ; toujours pas `(healthy)` : envoie le résultat de `docker compose logs --tail 20 api` à la personne responsable du site.

## Points d'attention

- **Le préfixe `umask 022 &&` reste** dans les commandes de mise à jour : la toute première mise à jour vers la 1.8 est lancée par l'ancien `deploy.sh` (le script est lu avant que git le remplace). Ne le retire pas de tes habitudes.
- **Commande de retour après un échec** : lance-la telle qu'elle est affichée. Seule exception : si l'échec est arrivé pendant un retour vers une version d'avant la 1.8, ajoute `umask 022 &&` devant.
- Les blocs P1 et P2 n'exécutent que le **début** de `deploy.sh` (ses réglages), suivi de la réécriture d'un fichier par git : c'est exactement l'endroit corrigé. Le déploiement complet a été essayé par la QA sur une copie de serveur jetable.

## Inutile de tester

- Le parcours dans le navigateur (connexion Google, candidatures) : aucune page ni l'API ne changent.
- Les sauvegardes (`backup.sh`, `verif-disque.sh`) : elles gardent volontairement leur propre réglage de fichiers privés, sans lien avec `deploy.sh`.
- Un vrai `deploy/deploy.sh` sur le Mac : il est fait pour le serveur (Linux, compte `deploy`, `.env` du serveur) et s'arrêterait avant d'agir.
