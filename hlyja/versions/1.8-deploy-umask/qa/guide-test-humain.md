---
type: guide-test
version: 1.8
date: 2026-10-28
---

# Tester le réglage des droits dans deploy.sh

Suivre les étapes dans l'ordre et cocher. Chaque étape dit quoi lancer, ce que tu dois voir, et quoi faire sinon.

- **Partie A — sur le Mac, avant le merge** : 10 minutes.
- **Partie B — sur le serveur, à la prochaine mise à jour après le merge** : 5 minutes.

Il te faut : le Terminal du Mac, Docker Desktop lancé, et pour la partie B l'accès SSH au serveur en `deploy`.

Tout ce qui se fait sur le Mac a lieu dans une copie jetable du dépôt : ton dossier de travail n'est pas touché. Les parenthèses de certains blocs gardent le réglage « fichiers privés » (`umask 077`) à l'intérieur du bloc : ton Terminal n'est pas modifié.

---

# Partie A — sur le Mac, avant le merge

## A1. Docker répond

- [ ] Lancer :

```bash
docker info --format '{{.ServerVersion}}'
```

- [ ] Tu dois voir : un numéro de version, par exemple `29.9.2`.

**Sinon** : « Cannot connect to the Docker daemon » → ouvrir Docker Desktop, attendre que la baleine de la barre de menus ne bouge plus, relancer.

## A2. Préparer une copie jetable du dépôt

- [ ] Lancer, **dans le même Terminal que la suite** (le bloc retient le dossier de la copie) :

```bash
cd ~/Documents/Yeita/Projects/Github/yeita-recrutement && d=$(mktemp -d) && git clone --quiet --branch version/1.8-deploy-umask . "$d/r" && cd "$d/r" && grep -n '^umask' deploy/deploy.sh
```

- [ ] Tu dois voir : `9:umask 022` (la ligne ajoutée par la 1.8).

**Sinon** :
- « no such file or directory » → ton dépôt est ailleurs : remplacer `~/Documents/Yeita/Projects/Github/yeita-recrutement` par son chemin et relancer.
- « Remote branch version/1.8-deploy-umask not found » → la version est déjà mergée : faire `git pull` sur `main` dans ton dépôt, remplacer `version/1.8-deploy-umask` par `main` dans le bloc et relancer.
- rien ne s'affiche → la copie n'a pas la correction : s'arrêter là et me le signaler.

## A3. Avec l'ancien script, le bug apparaît

- [ ] Lancer (rejoue, avec le début du `deploy.sh` d'avant la 1.8, la réécriture d'un fichier par git sous un terminal en « fichiers privés ») :

```bash
( umask 077; bash -c "$(git show b1f3567:deploy/deploy.sh | sed -n '1,/^set -euo pipefail/p'); rm api/server.js; git checkout -- api/server.js"; stat -f '%Lp %N' api/server.js )
```

- [ ] Tu dois voir : `600 api/server.js` (lisible par son seul propriétaire).
- [ ] Puis lancer (construit l'image de l'API avec ce fichier et lui demande de le lire ; 1 à 3 minutes la première fois) :

```bash
docker build -q -f docker/api.Dockerfile -t qa18-essai-api . >/dev/null && docker run --rm --entrypoint node qa18-essai-api -e "require('fs').readFileSync('/app/api/server.js'); console.log('lisible')" 2>&1 | grep -E 'lisible|EACCES' | head -1
```

- [ ] Tu dois voir : `Error: EACCES: permission denied, open '/app/api/server.js'`. C'est le bug : l'API ne pourrait pas démarrer.

**Sinon** :
- `644 api/server.js` ou `lisible` → le réglage n'a pas joué : vérifier que le premier bloc a été copié en entier, parenthèses comprises, et relancer les deux blocs.
- « bad revision » → la copie ne connaît pas l'ancien commit : refaire A2.
- « failed to solve » → la construction n'a pas pu télécharger ses dépendances : vérifier la connexion Internet et relancer.

## A4. Avec le nouveau script, le fichier reste lisible

- [ ] Lancer (même essai, avec le début du `deploy.sh` de la 1.8) :

```bash
( umask 077; bash -c "$(sed -n '1,/^umask 022/p' deploy/deploy.sh); rm api/server.js; git checkout -- api/server.js; echo \"masque dans le script : \$(umask)\""; stat -f '%Lp %N' api/server.js; echo "masque du shell qui a lancé le script : $(umask)" )
```

- [ ] Tu dois voir, dans l'ordre :
  - `masque dans le script : 0022` (le script s'est réglé lui-même) ;
  - `644 api/server.js` (lisible par tous) ;
  - `masque du shell qui a lancé le script : 077` (le terminal qui l'a lancé garde son réglage).
- [ ] Puis lancer :

```bash
docker build -q -f docker/api.Dockerfile -t qa18-essai-api . >/dev/null && docker run --rm --entrypoint node qa18-essai-api -e "require('fs').readFileSync('/app/api/server.js'); console.log('lisible')" 2>&1 | grep -E 'lisible|EACCES' | head -1
```

- [ ] Tu dois voir : `lisible`.

**Sinon** :
- `600 api/server.js` ou `masque dans le script : 0077` → la copie n'a pas la correction : refaire A2, vérifier `9:umask 022`, puis me le signaler.
- `EACCES` au second bloc → l'image a gardé l'ancien fichier : vérifier que le premier bloc affichait bien `644`, puis relancer le second.

## A5. Ton Terminal n'a pas changé, et on range

- [ ] Lancer :

```bash
echo "masque de ton Terminal : $(umask)"; cd ~ && docker image rm qa18-essai-api >/dev/null && rm -rf "$d" && echo "rangé"
```

- [ ] Tu dois voir : `masque de ton Terminal : 022` (ou ton réglage habituel), puis `rangé`.

**Sinon** :
- `077` → un bloc a été copié sans ses parenthèses : fermer ce Terminal et en ouvrir un nouveau.
- « No such image » → l'image n'existait plus : lancer seulement `rm -rf "$d" && echo "rangé"`.
- le Terminal a été fermé entre-temps → rien à supprimer à la main : macOS vide ce dossier temporaire tout seul.

## A6. Tout est bon : la pull request peut être mergée

- [ ] A1 à A5 sont cochés.

---

# Partie B — sur le serveur, à la prochaine mise à jour après le merge

À faire quand une mise à jour du site est prévue de toute façon. Serveur : `51.75.252.121`, en `deploy` :

```bash
ssh deploy@51.75.252.121
```

## B1. Mettre à jour, avec le préfixe

- [ ] Lancer, **en gardant `umask 022 &&` au début** (cette première mise à jour vers la 1.8 est encore faite par l'ancien script) :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

- [ ] Tu dois voir, en dernière ligne : `Déploiement réussi : <commit> sur https://recrutement.yeita.fr`.

**Sinon** :
- la dernière ligne commence par `ÉCHEC :` → lancer tout de suite la commande affichée juste en dessous (`deploy/deploy.sh <commit>`), telle quelle, puis m'envoyer le message `ÉCHEC`.
- `ARRÊT : un déploiement est déjà en cours` → attendre 5 minutes et relancer.

## B2. Le serveur a la correction et aucun fichier n'est resté privé

- [ ] Lancer :

```bash
cd /opt/recrutement && grep -n '^umask' deploy/deploy.sh && find . -path ./.git -prune -o -type f ! -perm -o=r -print && docker compose ps api
```

- [ ] Tu dois voir :
  - `9:umask 022` (le serveur a la 1.8) ;
  - une seule ligne de fichier : `./.env` (le seul fichier qui doit rester privé) ;
  - une ligne `recrutement-api-1` dont la colonne STATUS finit par `(healthy)`.

**Sinon** :
- pas de `9:umask 022` → la mise à jour n'a pas apporté la 1.8 (pas encore dans `main`) : rien d'anormal, refaire B1 et B2 à la mise à jour qui l'apportera.
- d'autres fichiers que `./.env` sont listés → ils sont illisibles pour l'API ou le site : ne toucher à rien et m'envoyer la liste.
- `(unhealthy)` ou `(health: starting)` → attendre une minute et relancer `docker compose ps api` ; toujours pas `(healthy)` → m'envoyer ce qu'affiche `docker compose logs --tail 20 api`.

## B3. À retenir pour les prochaines fois

- [ ] Garder l'habitude du préfixe `umask 022 &&` devant `deploy/deploy.sh` : il protège aussi le cas où l'on revient à une version d'avant la 1.8.
- [ ] Après un `ÉCHEC`, la commande de retour affichée se lance telle quelle. Seule exception : si l'échec est arrivé pendant un retour vers une version d'avant la 1.8, ajouter `umask 022 &&` devant.

---

## Inutile de tester

- Le parcours dans le navigateur (connexion Google, candidatures) : ni les pages ni l'API ne changent.
- Les sauvegardes : elles gardent volontairement leur propre réglage « fichiers privés », sans lien avec `deploy.sh`.
- Un vrai `deploy/deploy.sh` sur le Mac : il est fait pour le serveur et s'arrêterait avant d'agir. Le déploiement complet a été essayé sur une copie de serveur jetable.
