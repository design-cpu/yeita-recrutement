---
type: guide-test
version: 1.9
date: 2026-10-28
---

# Tester le déploiement automatique de main

Suivre les étapes dans l'ordre et cocher. Chaque étape dit quoi lancer, ce que tu dois voir, et quoi faire sinon.

- **Partie A — sur le Mac, avant le merge** : 10 minutes (un peu plus la première fois : le banc d'essai se prépare).
- **Partie B — sur le serveur, après le merge** : 40 minutes le jour de la mise en service, puis 20 minutes après le merge suivant.

Il te faut : le Terminal du Mac, Docker Desktop lancé, et pour la partie B l'accès SSH au serveur en `deploy` et en `ubuntu`, et ton navigateur connecté avec ton compte Google @yeita.fr.

Tout ce qui se fait sur le Mac a lieu dans une copie jetable du dépôt : ton dossier de travail n'est pas touché. Fais toute la partie A **dans le même Terminal** : les blocs retiennent le dossier de la copie.

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

- [ ] Lancer :

```bash
cd ~/Documents/Yeita/Projects/Github/yeita-recrutement && d=$(mktemp -d) && git clone --quiet --branch version/1.9-deploiement-auto . "$d/r" && cd "$d/r" && ls deploy/auto-deploy.sh deploy/systemd/
```

- [ ] Tu dois voir : `deploy/auto-deploy.sh`, puis la liste du dossier `deploy/systemd/`, où figurent `recrutement-deploy.path`, `recrutement-deploy.service` et `recrutement-deploy.timer`.

**Sinon** :
- « no such file or directory » → ton dépôt est ailleurs : remplacer `~/Documents/Yeita/Projects/Github/yeita-recrutement` par son chemin et relancer.
- « Remote branch version/1.9-deploiement-auto not found » → la version est déjà mergée : faire `git pull` sur `main` dans ton dépôt, remplacer `version/1.9-deploiement-auto` par `main` dans le bloc et relancer.

## A3. Les tests du parcours et de l'API passent

- [ ] Lancer (environ 1 minute) :

```bash
node tools/test-store.js > "$d/store.txt" 2>&1; tail -1 "$d/store.txt"
( cd api && npm ci --no-audit --no-fund >/dev/null 2>&1 && umask 022 && npm test > "$d/api.txt" 2>&1 ); grep -E '^ℹ (tests|fail) ' "$d/api.txt"
grep -qx 'TOUT OK' "$d/store.txt" && grep -qx 'ℹ fail 0' "$d/api.txt" && echo "VERDICT : OK" || echo "VERDICT : PROBLÈME"
```

- [ ] Tu dois voir : `TOUT OK`, `ℹ tests 65`, `ℹ fail 0`, puis `VERDICT : OK`.

**Sinon** :
- « command not found: node » → installer Node (`brew install node`), puis relancer.
- `VERDICT : PROBLÈME` sans ligne `ℹ tests` → `npm ci` n'a pas pu installer les dépendances : vérifier la connexion Internet et relancer.
- `ℹ fail 1` ou plus → m'envoyer ce qu'affiche `grep -B2 -A12 '✖' "$d/api.txt" | head -60`.

## A4. Le déploiement automatique passe ses vérifications

- [ ] Lancer (la première fois ~3 minutes pour préparer le banc d'essai, puis ~1 minute de vérifications) :

```bash
docker build -q -t banc-deploiement - >/dev/null <<'FIN'
FROM ubuntu:26.04
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 age rclone curl sqlite3 git iproute2 python3 util-linux sudo >/dev/null && rm -rf /var/lib/apt/lists/*
FIN
docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-deploiement bash /depot/tools/test-auto-deploy.sh /depot > "$d/banc.txt" 2>&1
echo "vérifications réussies : $(grep -c '^OK' "$d/banc.txt") ; en échec : $(grep -c '^FAIL' "$d/banc.txt")"
[ "$(tail -1 "$d/banc.txt")" = "TOUT OK" ] && echo "VERDICT : OK" || echo "VERDICT : PROBLÈME"
```

- [ ] Tu dois voir : `vérifications réussies : 95 ; en échec : 0`, puis `VERDICT : OK`.

Ce banc rejoue, avec de faux outils, tout ce que fait le serveur : commit testé puis mis en ligne, tests en échec, retour arrière automatique, pause, demandes refusées, deux passages en même temps, fichiers abîmés.

**Sinon** :
- « failed to solve » ou « Temporary failure resolving » → la préparation n'a pas pu télécharger Ubuntu : vérifier la connexion Internet et relancer.
- `vérifications réussies : 0` → m'envoyer ce qu'affiche `tail -5 "$d/banc.txt"`.
- des échecs → m'envoyer ce qu'affiche `grep -A6 '^FAIL' "$d/banc.txt" | head -60`.

## A5. Voir la page du déploiement sur le Mac

- [ ] Lancer (la commande ne rend pas la main : c'est normal, le serveur local tourne) :

```bash
python3 tools/build.py _site >/dev/null && p="$d/page" && mkdir -p "$p/etat" && DB_PATH="$p/r.sqlite" node api/equipe.js add moi@yeita.fr Moi admin >/dev/null && N=$(date -u +%Y-%m-%dT%H:%M:%SZ) && A=$(git rev-parse HEAD~1) && C=$(git rev-parse HEAD) && cat > "$p/etat/deploiement.json" <<FIN
{"maj":"$N","dernier_controle":{"le":"$N","fetch":"ok"},
 "en_ligne":{"commit":"$A","court":"${A:0:7}","message":"le commit d'avant","auteur":"Moi"},"incertain":false,
 "dernier_main":{"commit":"$C","court":"${C:0:7}","message":"le dernier commit de main","auteur":"Moi"},
 "pause":null,"echec":{"commit":"$C","court":"${C:0:7}","message":"le dernier commit de main","auteur":"Moi"},"retour_ko":null,"en_cours":null,
 "passages":[
  {"id":"2","debut":"$N","fin":"$N","declencheur":{"type":"automatique"},"commit":{"commit":"$C","court":"${C:0:7}","message":"le dernier commit de main","auteur":"Moi"},"branche":"main","resultat":"tests-ko","motif":"",
   "etapes":[{"nom":"test-store","statut":"ok","duree_s":2,"sortie":"TOUT OK"},{"nom":"npm-test","statut":"ko","duree_s":25,"sortie":"✖ un test de l'API a échoué\nℹ fail 1"},{"nom":"build","statut":"non-lancee","duree_s":0,"sortie":""},{"nom":"deploy","statut":"non-lancee","duree_s":0,"sortie":""}]},
  {"id":"1","debut":"$N","fin":"$N","declencheur":{"type":"automatique"},"commit":{"commit":"$A","court":"${A:0:7}","message":"le commit d'avant","auteur":"Moi"},"branche":"main","resultat":"deploye","motif":"",
   "etapes":[{"nom":"test-store","statut":"ok","duree_s":2,"sortie":"TOUT OK"},{"nom":"npm-test","statut":"ok","duree_s":24,"sortie":"ℹ fail 0"},{"nom":"build","statut":"ok","duree_s":60,"sortie":"construit"},{"nom":"deploy","statut":"ok","duree_s":90,"sortie":"Déploiement réussi"}]}]}
FIN
echo "Ouvrir http://127.0.0.1:18769/admin/deploiement.html" && DB_PATH="$p/r.sqlite" DEV_EMAIL=moi@yeita.fr DEV_STATIC="$PWD/_site" PORT=18769 node api/server.js
```

- [ ] Ouvrir `http://127.0.0.1:18769/admin/deploiement.html` dans le navigateur.
- [ ] Tu dois voir :
  - un encadré **rouge** « Le dernier commit de main a échoué (Tests en échec : pas mis en ligne) : il ne sera pas mis en ligne tant que main n'avance pas. » ;
  - en dessous : Commit en ligne, Dernier commit de main, Automatisme « actif », Dernier commit en échec, Dernière vérification (maintenant) ;
  - les boutons « Déployer maintenant » et « Actualiser » (pas de « Reprendre ») ;
  - sous « Passages », le premier ouvert : « Tests en échec : pas mis en ligne », avec l'étape « Tests de l'API : en échec » ouverte et sa sortie ; le second replié : « Mis en ligne ».
- [ ] Au clavier seulement : appuyer sur `Tab` jusqu'au passage « Mis en ligne » (un contour noir l'entoure), puis `Entrée` : il s'ouvre et montre ses quatre étapes et le bouton « Déployer ce commit ». `Entrée` encore : il se referme.
- [ ] Cliquer « Déployer maintenant ». Une fenêtre de confirmation dit « Le dernier commit de main (…) sera testé puis mis en ligne. » puis « Il a échoué la dernière fois. ». Cliquer **OK**.
- [ ] Tu dois voir : « Demande envoyée : le serveur la prend en charge dans quelques secondes. », et en haut un bandeau « Demande en attente : déployer le dernier commit de main par moi@yeita.fr à <heure>. ». Sur le Mac, personne ne prend la demande : elle reste en attente, c'est normal.
- [ ] Revenir au Terminal et arrêter avec `Ctrl+C`.

**Sinon** :
- « address already in use » dans le Terminal → un autre serveur occupe le port : remplacer les deux `18769` par `18779` et relancer.
- « Réservé aux admins de l'équipe. » → le bloc a été coupé avant `equipe.js` : `Ctrl+C`, puis relancer le bloc en entier.
- « Aucun passage enregistré » → l'exemple n'a pas été écrit : `Ctrl+C`, vérifier que le bloc a été copié jusqu'à la dernière ligne, relancer.
- autre chose dans le Terminal → me l'envoyer.

## A6. La page a bien déposé la demande

- [ ] Lancer :

```bash
cat "$d/page/demandes/deploiement.demande"; grep -qx 'par=moi@yeita.fr' "$d/page/demandes/deploiement.demande" && echo "VERDICT : OK" || echo "VERDICT : PROBLÈME"
```

- [ ] Tu dois voir quatre lignes : `action=deployer`, `commit=main`, `par=moi@yeita.fr`, `le=<date et heure>`, puis `VERDICT : OK`. C'est ce fichier que le serveur prend et vérifie ; la page ne lance rien elle-même.

**Sinon** : « No such file or directory » → la demande n'a pas été envoyée : refaire A5 jusqu'au clic sur OK.

## A7. On range

- [ ] Lancer :

```bash
cd ~ && rm -rf "$d" && echo "rangé"
```

- [ ] Tu dois voir : `rangé`.

**Sinon** : le Terminal a été fermé entre-temps → rien à supprimer à la main : macOS vide ce dossier temporaire tout seul. L'image `banc-deploiement` peut rester (elle resservira) ; pour la retirer : `docker image rm banc-deploiement`.

## A8. Tout est bon : la pull request peut être mergée

- [ ] A1 à A7 sont cochés.

---

# Partie B — sur le serveur, après le merge

Serveur : `51.75.252.121`. Les commandes « en `deploy` » se lancent dans un Terminal ouvert par `ssh deploy@51.75.252.121`, celles « en `ubuntu` » dans un autre Terminal ouvert par `ssh ubuntu@51.75.252.121`.

```bash
ssh deploy@51.75.252.121
```

```bash
ssh ubuntu@51.75.252.121
```

## B1. Mettre la 1.9 en ligne à la main

- [ ] En `deploy`, lancer, **en gardant `umask 022 &&` au début** (cette première mise à jour est encore faite par l'ancien script) :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

- [ ] Tu dois voir, en dernière ligne : `Déploiement réussi : <commit> sur https://recrutement.yeita.fr`.
- [ ] Puis lancer :

```bash
cd /opt/recrutement && git log -1 --format='en place : %h %s' && ls deploy/auto-deploy.sh && { [ -e deploy/PAUSE ] && echo "PROBLÈME : une pause existe déjà" || echo "OK : pas de pause"; }
```

- [ ] Tu dois voir : `en place : <commit> <message du merge de la 1.9>`, `deploy/auto-deploy.sh`, puis `OK : pas de pause`.

**Sinon** :
- la dernière ligne commence par `ÉCHEC :` → lancer tout de suite la commande affichée juste en dessous (`deploy/deploy.sh <commit>`), telle quelle, puis m'envoyer le message `ÉCHEC` ; ne pas continuer.
- `ARRÊT : un déploiement est déjà en cours` → attendre 5 minutes et relancer.
- « No such file or directory » pour `deploy/auto-deploy.sh` → `main` n'a pas encore la 1.9 : vérifier que la pull request est mergée, puis refaire B1.

## B2. Installer les unités du déploiement automatique

- [ ] En `ubuntu`, lancer **tout le bloc** (il vérifie l'emplacement du volume, copie les trois unités, note le commit en place comme « mis en ligne », puis active la vérification toutes les 10 minutes et la surveillance des demandes) :

```bash
cd /opt/recrutement && sudo bash -c 'set -e
m=$(docker volume inspect recrutement_data -f "{{.Mountpoint}}")
attendu=$(sed -n "s#^PathExists=\(.*\)/demandes/deploiement.demande\$#\1#p" deploy/systemd/recrutement-deploy.path)
[ -n "$m" ] && [ "$m" = "$attendu" ] || { echo "ARRÊT : le volume recrutement_data est dans « $m », pas dans « $attendu » : rien n est installé (voir deploy/README.md)."; exit 1; }
for u in recrutement-deploy.service recrutement-deploy.timer recrutement-deploy.path; do
  if [ ! -e /etc/systemd/system/$u ]; then install -m 644 deploy/systemd/$u /etc/systemd/system/$u; echo "copiée : $u"
  elif cmp -s deploy/systemd/$u /etc/systemd/system/$u; then echo "identique : $u"
  else echo "DIFFÉRENTE : $u (rien n est écrasé)"; diff /etc/systemd/system/$u deploy/systemd/$u || true; exit 1; fi
done
runuser -u deploy -- sh -c "d=\$HOME/.recrutement-deploiement; [ -d \$d ] || mkdir -m 700 \$d; [ -f \$d/deploye ] || git -C /opt/recrutement rev-parse HEAD > \$d/deploye"
systemctl daemon-reload
systemctl enable --now recrutement-deploy.timer recrutement-deploy.path' && systemctl list-timers 'recrutement-deploy*' && systemctl is-active recrutement-deploy.path
```

- [ ] Tu dois voir, dans l'ordre :
  - `copiée : recrutement-deploy.service`, `copiée : recrutement-deploy.timer`, `copiée : recrutement-deploy.path` ;
  - deux lignes `Created symlink …` ;
  - un tableau avec une ligne `recrutement-deploy.timer` dont la colonne `NEXT` est dans 10 minutes au plus ;
  - `active` en dernière ligne.

**Sinon** :
- `ARRÊT : le volume recrutement_data est dans …` → rien n'a été installé : ne pas continuer, m'envoyer la ligne en entier.
- `DIFFÉRENTE : …` suivi d'une différence → des unités d'un essai précédent sont là : m'envoyer la différence affichée ; ne rien écraser à la main.
- `identique : …` (trois fois) → les unités étaient déjà installées : rien d'anormal, continuer.
- « sudo: a password is required » ou « Permission denied » → tu n'es pas en `ubuntu` : ouvrir le Terminal `ssh ubuntu@51.75.252.121` et relancer.

## B3. Tu as le rôle admin

- [ ] En `deploy`, lancer :

```bash
cd /opt/recrutement && docker compose exec -T api node api/equipe.js list | grep -E ' admin .*actif' || echo "PROBLÈME : aucun admin actif"
```

- [ ] Tu dois voir : une ligne avec ton adresse @yeita.fr, `admin` et `actif`.

**Sinon** : ton adresse n'est pas dans la liste, ou `PROBLÈME : aucun admin actif` → lancer la ligne ci-dessous **après avoir remplacé** `prenom.nom@yeita.fr` et `Prénom` par les tiens, puis relancer le bloc du dessus :

```bash
cd /opt/recrutement && docker compose exec -T api node api/equipe.js add prenom.nom@yeita.fr Prénom admin
```

## B4. Le premier passage du serveur ne redéploie rien

- [ ] En `deploy`, lancer (attend le premier passage, 10 minutes au plus ; la commande rend la main toute seule) :

```bash
cd /opt/recrutement && echo "attente du premier passage (10 minutes au plus)…" && for i in $(seq 1 70); do docker compose exec -T api test -f /data/etat/deploiement.json && break; sleep 10; done; docker compose exec -T api node -e '
const e = JSON.parse(require("fs").readFileSync("/data/etat/deploiement.json", "utf8"));
console.log("dernière vérification :", e.dernier_controle.le, "· en ligne :", e.en_ligne && e.en_ligne.court, "· dernier de main :", e.dernier_main && e.dernier_main.court, "· passages :", e.passages.length);
console.log(e.en_ligne && e.dernier_main && e.en_ligne.commit === e.dernier_main.commit && !e.incertain && !e.pause && e.passages.length === 0 ? "VERDICT : OK" : "VERDICT : PROBLÈME");'
```

- [ ] Tu dois voir : `dernière vérification : <date> · en ligne : <commit de B1> · dernier de main : <le même> · passages : 0`, puis `VERDICT : OK`. Le serveur a vérifié `main`, vu que le commit en place est déjà le dernier, et n'a rien relancé.

**Sinon** :
- « no such file » ou une erreur `ENOENT` après 11 minutes → le timer n'a pas tourné : en `ubuntu`, m'envoyer ce qu'affichent `systemctl list-timers 'recrutement-deploy*'` et `sudo journalctl -u recrutement-deploy -n 30 --no-pager`.
- `passages : 1` → un passage a quand même eu lieu : continuer, et m'envoyer la ligne `VERDICT` avec ce qu'affiche B10.
- `VERDICT : PROBLÈME` avec deux commits différents → `main` a avancé depuis B1 : rien d'anormal, le passage suivant va le tester ; continuer.

## B5. La page est verte

- [ ] Dans le navigateur, connecté avec ton compte Google @yeita.fr : `https://recrutement.yeita.fr/admin/deploiement.html`.
- [ ] Tu dois voir : un encadré **vert** « À jour : le dernier commit de main est en ligne. », Commit en ligne = le commit de B1, Automatisme « actif », Dernière vérification il y a moins de 10 minutes, et le bouton « Déployer maintenant ».

**Sinon** :
- « Réservé aux admins de l'équipe. » → refaire B3 puis recharger la page.
- « Aucun passage enregistré : le déploiement automatique n'est peut-être pas installé » → le premier passage n'a pas encore eu lieu : refaire B4.
- encadré rouge → m'envoyer son texte.

- [ ] Si un collègue recruteur (non admin) est disponible : il ouvre la même adresse et doit voir « Réservé aux admins de l'équipe. », sans aucun bouton.

## B6. « Déployer maintenant » depuis la page

- [ ] Sur la page, cliquer « Déployer maintenant ». La confirmation dit « Le dernier commit de main (…) sera testé puis mis en ligne. » puis « Il est déjà en ligne : il sera retesté et redéployé. ». Cliquer **OK**.
- [ ] Tu dois voir : « Demande envoyée : le serveur la prend en charge dans quelques secondes. », puis, en moins d'une minute, sans recharger, un bandeau « Passage en cours depuis <heure> : <commit> — Tests des règles du parcours (1/4) », qui avance jusqu'à « Mise en ligne (4/4) ».
- [ ] Au bout de 5 à 10 minutes : l'encadré redevient **vert**, et sous « Passages » le premier est « Mis en ligne », avec quatre étapes réussies et leur durée. Le site `https://recrutement.yeita.fr` répond pendant et après.

**Sinon** :
- le bandeau « Demande en attente » devient rouge (« La demande n'a pas été prise en charge … ») → en `ubuntu`, lancer `sudo systemctl reset-failed recrutement-deploy.service recrutement-deploy.path && sudo systemctl start recrutement-deploy.path`, puis m'envoyer ce qu'affiche `sudo journalctl -u recrutement-deploy -n 30 --no-pager`.
- le passage finit « Tests en échec : pas mis en ligne » → ouvrir l'étape en échec et m'envoyer sa sortie ; le site n'a pas changé. Si c'est un souci de réseau (npm, Docker Hub), « Déployer maintenant » relance les tests.
- encadré rouge « Retour arrière raté … » ou « Mise en ligne interrompue … » → **tout de suite**, en `deploy`, lancer la commande affichée dans l'encadré (`deploy/deploy.sh <commit>`) avec `umask 022 && cd /opt/recrutement && ` devant, puis m'envoyer le texte de l'encadré.

## B7. Après le merge suivant : il part tout seul

À faire au prochain merge d'une pull request sur `main` (n'importe laquelle).

- [ ] Ouvrir la page dans les 10 minutes qui suivent le merge.
- [ ] Tu dois voir : d'abord « main a avancé : test au prochain passage (10 min au plus). » (encadré neutre) ou déjà « Passage en cours », puis, 5 à 10 minutes plus tard, l'encadré **vert** et un nouveau passage « Mis en ligne » avec le commit du merge, déclenché « Automatique ». Personne n'a eu à se connecter au serveur.

**Sinon** : « Tests en échec : pas mis en ligne » → le commit mergé ne passe pas ses tests : il n'est pas en ligne et l'ancien reste ; ouvrir l'étape en échec et corriger sur `main`. Encadré rouge « Le serveur ne vérifie plus main » → en `ubuntu`, m'envoyer `systemctl list-timers 'recrutement-deploy*'`.

## B8. Revenir en arrière avec « Déployer ce commit »

- [ ] Sur la page, ouvrir le passage précédent (celui de B6, qui n'est plus en ligne) : il porte un bouton « Déployer ce commit ». Le cliquer. La confirmation dit « Les tests seront relancés. » puis « L'automatisme sera mis en pause. ». Cliquer **OK**.
- [ ] Au bout de 5 à 10 minutes, tu dois voir : un encadré neutre « En pause : les nouveaux commits de main ne sont pas mis en ligne. », Commit en ligne = le commit de B6, Automatisme « en pause depuis … (par <ton adresse>, commit …) », et le bouton « Reprendre ».
- [ ] En `deploy`, lancer :

```bash
cd /opt/recrutement && git log -1 --format='en place : %h %s' && cat deploy/PAUSE && git status --short | grep -q . && echo "PROBLÈME : dépôt modifié" || echo "OK : dépôt propre"
```

- [ ] Tu dois voir : `en place : <commit de B6> …`, trois lignes `le=…`, `par=<ton adresse>`, `commit=<commit de B6 en entier>`, puis `OK : dépôt propre`.

**Sinon** :
- pas de bouton « Déployer ce commit » → le passage précédent n'a pas ses trois tests réussis, ou B7 n'a pas encore eu lieu : attendre le merge suivant.
- « Demande refusée : … » en tête des passages → m'envoyer le motif affiché.
- `PROBLÈME : dépôt modifié` → m'envoyer ce qu'affiche `git status --short`.

## B9. « Reprendre »

- [ ] Sur la page, cliquer « Reprendre ». La confirmation dit « L'automatisme reprend : le dernier commit de main (…) sera testé puis mis en ligne s'il ne l'est pas déjà. ». Cliquer **OK**.
- [ ] Au bout de 5 à 10 minutes, tu dois voir : l'encadré **vert** « À jour : le dernier commit de main est en ligne. », Commit en ligne = le commit du merge de B7, Automatisme « actif », plus de bouton « Reprendre ».
- [ ] En `deploy`, lancer :

```bash
cd /opt/recrutement && git log -1 --format='en place : %h %s' && { [ -e deploy/PAUSE ] && echo "PROBLÈME : la pause est restée" || echo "OK : plus de pause"; }
```

- [ ] Tu dois voir : `en place : <commit de B7> …`, puis `OK : plus de pause`.

**Sinon** : l'encadré reste « En pause » plus de 10 minutes → en `ubuntu`, m'envoyer ce qu'affiche `sudo journalctl -u recrutement-deploy -n 40 --no-pager`.

## B10. Le journal garde la trace

- [ ] En `ubuntu`, lancer :

```bash
sudo journalctl -u recrutement-deploy --since "2 days ago" --no-pager | grep -E ': · (Passage|Demande de|Pause retirée|Déploiement automatique en pause)' | tail -12
```

- [ ] Tu dois voir, parmi les dernières lignes, de B6 à B9 (dans une même étape, l'ordre des lignes peut varier) :
  - `· Demande de <ton adresse> (…) : deployer main` puis `· Passage … : deploye` (B6) ;
  - `· Passage … : deploye` (B7) ;
  - `· Demande de <ton adresse> (…) : deployer <commit>`, `· Déploiement automatique en pause (commit … demandé par <ton adresse>).`, `· Passage … : deploye` (B8) ;
  - `· Demande de <ton adresse> (…) : reprendre`, `· Pause retirée par <ton adresse>.`, `· Passage … : deploye` (B9).
- [ ] En `deploy`, sans `sudo`, la même histoire se lit aussi ici :

```bash
ls -t ~/.recrutement-deploiement/passages | head -5
```

- [ ] Tu dois voir : jusqu'à 5 noms de fichiers datés, le plus récent en haut.

**Sinon** : aucune ligne → le journal a été vidé ou la période est trop courte : remplacer `2 days ago` par `7 days ago` et relancer ; toujours rien → m'envoyer ce qu'affiche `sudo journalctl -u recrutement-deploy -n 50 --no-pager`.

## B11. Tout est bon : le déploiement automatique est en service

- [ ] B1 à B10 sont cochés.

En cas de souci plus tard, arrêter l'automatisme (en `ubuntu`) : `sudo systemctl disable --now recrutement-deploy.timer recrutement-deploy.path` ; mettre en ligne à la main (en `deploy`) : `umask 022 && cd /opt/recrutement && deploy/deploy.sh`.

---

## Inutile de tester

- Les cas difficiles du serveur : deux passages en même temps, une demande déposée pendant les tests, un `deploy.sh` lancé en SSH pendant un passage, un passage arrêté en pleine mise en ligne, Docker arrêté, des fichiers d'état falsifiés, des demandes piégées (lien, fichier énorme, clé en double). Ils sont rejoués par le banc d'essai (A4) et sur une copie de serveur jetable avec un vrai systemd.
- Un retour arrière automatique après une mise en ligne ratée : il a été provoqué sur la copie de serveur jetable (l'API qui ne démarre jamais) ; ne pas casser `main` exprès pour le voir.
- Les textes exacts de chaque encadré de la page (12 cas) et des confirmations : vérifiés automatiquement.
- Les sauvegardes et l'espace Candidatures : rien n'y change ; leurs tests passent.
