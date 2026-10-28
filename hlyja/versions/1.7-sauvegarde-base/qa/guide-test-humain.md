---
type: guide-test
version: 1.7
date: 2026-10-28
---

# Tester les sauvegardes

Suivre les étapes dans l'ordre et cocher. Chaque étape dit quoi lancer, ce que tu dois voir, et quoi faire sinon.

- **Partie A — sur le Mac, avant le merge** : 10 minutes.
- **Partie B — sur le serveur, après le merge** : 30 minutes, puis un coup d'œil le lendemain matin.

Il te faut : le Terminal du Mac (dans le dossier du dépôt, sur la branche `version/1.7-sauvegarde-base`), Docker Desktop lancé, l'accès SSH au serveur en `deploy` et en `ubuntu`.

---

# Partie A — sur le Mac, avant le merge

## A1. Les tests de l'API passent

- [ ] Lancer :

```bash
cd api && npm ci >/dev/null && npm test 2>&1 | grep -E "^ℹ (tests|fail)"; cd ..
```

- [ ] Tu dois voir : `ℹ tests 58` puis `ℹ fail 0`.

**Sinon** : m'envoyer ce qu'affiche `cd api && npm test 2>&1 | grep -A8 "✖"; cd ..`.

## A2. Les scripts de sauvegarde passent leurs vérifications

- [ ] Lancer (la première fois ~2 min pour préparer, puis ~2 min de vérifications) :

```bash
docker build -q -t banc-sauvegarde - <<'FIN'
FROM ubuntu:26.04
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 age python3 util-linux git iproute2 curl >/dev/null && useradd -m deploy && install -d -m 700 -o deploy -g deploy /var/backups/recrutement
FIN
docker run --rm -v "$PWD:/depot:ro" banc-sauvegarde bash /depot/tools/test-sauvegarde.sh /depot | tail -1
```

- [ ] Tu dois voir, en dernière ligne : `TOUT OK`.

**Sinon** : `ÉCHECS : n` → relancer la dernière ligne sans `| tail -1` et m'envoyer les lignes qui commencent par `FAIL` (avec les 4 lignes en dessous).

## A3. Voir la page d'état sur le Mac

- [ ] Lancer (la commande ne rend pas la main : c'est normal, le serveur tourne) :

```bash
python3 tools/build.py _site >/dev/null && d=$(mktemp -d) && DB_PATH=$d/r.sqlite node api/equipe.js add moi@yeita.fr Moi admin >/dev/null && mkdir $d/etat && N=$(date -u +%Y-%m-%dT%H:%M:%SZ) && echo "{\"le\": \"$N\", \"resultat\": \"reussie\", \"fichier\": \"recrutement-essai.db.age\", \"taille\": 32968, \"copies\": 3}" | tee $d/etat/sauvegarde-reussie.json > $d/etat/sauvegarde-derniere.json && echo "{\"le\": \"$N\", \"resultat\": \"normal\", \"racine\": 34, \"docker\": 34, \"seuil\": 80}" > $d/etat/disque.json && echo "Ouvrir http://127.0.0.1:18766/admin/sauvegardes.html" && DB_PATH=$d/r.sqlite DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site PORT=18766 node api/server.js
```

- [ ] Ouvrir `http://127.0.0.1:18766/admin/sauvegardes.html` dans le navigateur.
- [ ] Tu dois voir : un encadré **vert** « Tout va bien : la dernière sauvegarde a réussi et les disques ont de la place. », puis Dernière réussite (aujourd'hui, `recrutement-essai.db.age`, 32 Ko), Dernière tentative « réussie », Copies sur le serveur « 3 », Disques « racine 34 %, Docker 34 % ».
- [ ] Revenir au Terminal et arrêter avec `Ctrl+C`.

**Sinon** : la page dit « État indisponible ici » → l'adresse n'est pas la bonne : vérifier le port `18766` ; une erreur dans le Terminal → me l'envoyer.

## A4. Tout est bon : la pull request peut être mergée

- [ ] A1, A2 et A3 sont cochés.

---

# Partie B — sur le serveur, après le merge

Serveur : `51.75.252.121`. Les commandes « en `deploy` » se lancent après `ssh deploy@51.75.252.121`, celles « en `ubuntu` » après `ssh ubuntu@51.75.252.121`.

## B1. Mettre à jour le site

- [ ] Ouvrir un **nouveau** Terminal, puis :

```bash
ssh deploy@51.75.252.121
```

- [ ] Sur le serveur, en `deploy` :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

- [ ] Tu dois voir 7 lignes `OK`, puis `Tout est OK sur https://recrutement.yeita.fr`, et en dernier `Déploiement réussi : <commit> sur https://recrutement.yeita.fr`.

**Sinon** : une ligne `ÉCHEC : …` suivie de `Pour revenir à la version précédente : deploy/deploy.sh <commit>` → lancer tout de suite cette commande `deploy/deploy.sh <commit>`, puis m'envoyer la ligne `ÉCHEC`. `ARRÊT : un déploiement est déjà en cours` → attendre 5 minutes et relancer.

## B2. Installer age sur le serveur

- [ ] Dans un autre Terminal, en `ubuntu` :

```bash
ssh ubuntu@51.75.252.121 'sudo apt install -y age && age --version'
```

- [ ] Tu dois voir en dernière ligne un numéro de version, par exemple `1.2.1`.

**Sinon** : `Could not get lock` → les mises à jour automatiques tournent : attendre 2 minutes et relancer.

## B3. Créer la clé sur le Mac

- [ ] Sur le Mac (pas sur le serveur) :

```bash
brew install age
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

- [ ] Tu dois voir : `Public key: age1…` (une longue ligne qui commence par `age1`).

**Sinon** : `file exists` → une clé existe déjà : **ne rien écraser**, passer à B4.

- [ ] Garder ce fichier : en faire une seconde copie sur une clé USB chiffrée, ou le donner en main propre (AirDrop côte à côte) à une personne de confiance. Jamais par email, Slack, Drive ou sur le serveur.

## B4. Mettre la clé publique sur le serveur

- [ ] Sur le Mac, copier la clé publique :

```bash
age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt | pbcopy
```

- [ ] Sur le serveur, en `deploy` : taper `CLE='`, coller (`Cmd+V`), taper `'`, Entrée. Puis :

```bash
cd /opt/recrutement && sed -i '/^AGE_RECIPIENT=/d' .env && echo "AGE_RECIPIENT=$CLE" >> .env && grep '^AGE_RECIPIENT=' .env
```

- [ ] Tu dois voir une seule ligne `AGE_RECIPIENT=age1…`, la même clé qu'en B3.

**Sinon** : `AGE_RECIPIENT=` sans rien après → la variable `CLE` est vide : refaire la ligne `CLE='…'` puis la commande.

## B5. Installer les minuteries

- [ ] En `ubuntu` (sur le serveur) :

```bash
cd /opt/recrutement && sudo bash -c 'set -e
for u in recrutement-backup.service recrutement-backup.timer recrutement-verif-disque.service recrutement-verif-disque.timer; do
  if [ ! -e /etc/systemd/system/$u ]; then install -m 644 deploy/systemd/$u /etc/systemd/system/$u; echo "copiée : $u"
  elif cmp -s deploy/systemd/$u /etc/systemd/system/$u; then echo "identique : $u"
  else echo "DIFFÉRENTE : $u (rien n est écrasé)"; diff /etc/systemd/system/$u deploy/systemd/$u || true; exit 1; fi
done
systemctl daemon-reload
systemctl enable --now recrutement-backup.timer recrutement-verif-disque.timer' && systemctl list-timers 'recrutement-*' --no-pager
```

- [ ] Tu dois voir 4 lignes `copiée : …`, puis un tableau avec `recrutement-backup.timer` (prochain passage vers 3 h) et `recrutement-verif-disque.timer` (prochaine heure pleine).

**Sinon** : une ligne `DIFFÉRENTE` → m'envoyer la différence affichée.

## B6. Te donner le rôle admin

- [ ] En `deploy`, avec ton adresse :

```bash
cd /opt/recrutement && docker compose exec api node api/equipe.js role prenom.nom@yeita.fr admin
```

- [ ] Tu dois voir : `Rôle changé : prenom.nom@yeita.fr · <ton prénom> · admin · actif`.

**Sinon** : `Membre inconnu` → t'ajouter d'abord : `docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin`.

## B7. Première sauvegarde

- [ ] En `deploy` :

```bash
cd /opt/recrutement && deploy/backup.sh && deploy/verif-disque.sh
```

- [ ] Tu dois voir : `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur.`, puis `Disque racine : … % ; dossier Docker : … % ; seuil : 80 %.`.

**Sinon** :

| Message | Que faire |
|---|---|
| `AGE_RECIPIENT …` | refaire B4 |
| `« age » est absent` | refaire B2 |
| `ÉCHEC (api non saine)` | `docker compose ps api` doit dire `healthy` ; sinon m'envoyer `docker compose logs --tail 30 api` |
| `disque presque plein` | `df -h` et me l'envoyer |
| autre | me l'envoyer |

## B8. La page d'état est verte

- [ ] Dans le navigateur, connecté avec ton compte Google @yeita.fr : `https://recrutement.yeita.fr/admin/sauvegardes.html`.
- [ ] Tu dois voir l'encadré **vert** « Tout va bien… », la dernière réussite à l'heure de B7, « Copies sur le serveur » à 1, et l'occupation des disques.

**Sinon** : « Réservé aux admins de l'équipe. » → refaire B6 puis recharger ; encadré rouge → lire les motifs affichés et me les envoyer.

- [ ] Si un collègue recruteur (non admin) est disponible : il ouvre la même adresse et doit voir « Réservé aux admins de l'équipe. » et aucune autre information.

## B9. La clé ouvre bien les sauvegardes

- [ ] Sur le Mac :

```bash
d=$(mktemp -d); F=$(ssh deploy@51.75.252.121 'ls -t /var/backups/recrutement/*.db.age | head -n 1'); echo "$F"
scp "deploy@51.75.252.121:$F" "$d/copie.db.age" && age -d -i ~/cles-yeita/cle-sauvegarde-recrutement.txt -o "$d/copie.db" "$d/copie.db.age" && sqlite3 -readonly "$d/copie.db" "PRAGMA integrity_check; SELECT count(*) FROM candidats;"
rm -rf "$d"
```

- [ ] Tu dois voir : le nom de la copie de B7, puis `ok`, puis le nombre de candidatures que tu connais.

**Sinon** : `no identity matched any of the recipients` → la clé du serveur n'est pas celle du Mac : refaire B4, puis B7, puis B9.

## B10. Le lendemain matin : la sauvegarde de la nuit

- [ ] Ouvrir `https://recrutement.yeita.fr/admin/sauvegardes.html`.
- [ ] Tu dois voir l'encadré **vert**, et « Dernière réussite » cette nuit entre 3 h et 3 h 15 (heure de Paris), « Copies sur le serveur » à 2.

**Sinon** : en `ubuntu`, lancer `sudo journalctl -u recrutement-backup --since "today 02:00" --no-pager | tail -15` et m'envoyer le résultat.

---

Quand tout est coché : les sauvegardes sont en service.
