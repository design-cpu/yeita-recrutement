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
docker run --rm -e BANC_JETABLE=oui -v "$PWD:/depot:ro" banc-sauvegarde bash /depot/tools/test-sauvegarde.sh /depot | tail -1
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

## B3 et B4. La clé des sauvegardes (Mac, puis serveur)

**Ouvrir le Terminal sur le Mac** : appuie sur `Cmd + Espace`, tape `Terminal`, appuie sur `Entrée`.

**Lancer une commande de cette page** : copie le texte de l'encadré gris (sélectionne-le puis `Cmd + C`), clique dans la fenêtre du Terminal, colle avec `Cmd + V`, puis appuie sur `Entrée`.

### Clé, étape 1 — Installer age sur ton Mac

À faire une seule fois par Mac.

- [ ] **Où** : dans le Terminal de ton Mac.
- [ ] **Copie-colle** :

```bash
brew install age
```

- [ ] **Puis copie-colle** :

```bash
age --version
```

- [ ] **Tu dois voir** un numéro de version, par exemple `1.2.1`.

**Si tu vois `command not found: brew`** : Homebrew n'est pas installé sur ce Mac. Va sur https://brew.sh, copie-colle la commande indiquée sur la page dans le Terminal, attends la fin, puis recommence l'étape 1.


### Clé, étape 2 — Créer la clé

À faire **une seule fois** (pas une fois par personne, pas une fois par Mac).

- [ ] **Où** : dans le Terminal de ton Mac.
- [ ] **Copie-colle** :

```bash
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

- [ ] **Tu dois voir** une ligne `Public key: age1…` (une longue suite de lettres et de chiffres).

Cette commande a créé le fichier `cle-sauvegarde-recrutement.txt` dans un dossier `cles-yeita` de ton dossier personnel. Ce dossier n'est pas synchronisé avec iCloud (ce n'est ni le Bureau, ni Documents).

**Si tu vois `file exists`** : la clé existe déjà. **Ne la recrée pas** : les sauvegardes faites avec l'ancienne deviendraient illisibles. Passe directement à l'étape 3.


### Clé, étape 3 — Faire une copie de secours du fichier

Si ton Mac est perdu ou cassé et que personne d'autre n'a le fichier, les sauvegardes sont perdues. Il faut donc une seconde copie.

- [ ] **Où** : sur ton Mac.
- [ ] **Copie-colle** dans le Terminal, pour ouvrir le dossier de la clé dans le Finder :

```bash
open ~/cles-yeita
```

- [ ] **Tu dois voir** une fenêtre du Finder avec le fichier `cle-sauvegarde-recrutement.txt`.
- [ ] **Fais une des deux choses suivantes** (ou les deux) :
  - copie ce fichier sur une clé USB chiffrée, que tu ranges en lieu sûr ;
  - donne-le à une personne de confiance, **en face à face**, par AirDrop d'un Mac à l'autre. Cette personne le range comme toi : dans un dossier `cles-yeita` de son dossier personnel.
- [ ] **Note** quelque part qui a le fichier, et depuis quand.

**À ne jamais faire avec ce fichier** : l'envoyer par email, Slack, WhatsApp ou tout autre message ; le mettre dans iCloud, Google Drive ou Dropbox ; le mettre sur le serveur ou dans le dépôt Git ; l'imprimer ; le coller dans un document.


### Clé, étape 4 — Copier la clé publique

- [ ] **Où** : dans le Terminal de ton Mac.
- [ ] **Copie-colle** :

```bash
age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

- [ ] **Tu dois voir** une seule ligne qui commence par `age1`, par exemple :

```
age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
```

- [ ] **Sélectionne toute cette ligne** avec la souris (du `a` de `age1` jusqu'au dernier caractère), puis copie-la avec `Cmd + C`.

C'est la clé publique : tu vas la donner au serveur à l'étape 6.


### Clé, étape 5 — Se connecter au serveur

- [ ] **Où** : ouvre une **nouvelle fenêtre** de Terminal sur ton Mac (`Cmd + N` dans le Terminal).
- [ ] **Copie-colle** :

```bash
ssh deploy@51.75.252.121
```

- [ ] **Tu dois voir** une ligne qui se termine par `$`, par exemple `deploy@vps-…:~$`. Tu es maintenant sur le serveur : les commandes que tu tapes dans **cette fenêtre** s'exécutent sur le serveur.

**Si tu vois `Permission denied`** : ton Mac n'a pas l'accès au compte `deploy` du serveur. Demande-le à la personne qui administre le serveur.


### Clé, étape 6 — Donner la clé publique au serveur

- [ ] **Où** : dans la fenêtre connectée au serveur (étape 5).
- [ ] **Copie-colle cette ligne seule**, puis `Entrée` :

```bash
read -r -p "Colle ta clé publique (age1…) puis appuie sur Entrée : " CLE
```

- [ ] **Tu dois voir** la question : `Colle ta clé publique (age1…) puis appuie sur Entrée :`
- [ ] **Colle la clé** copiée à l'étape 4 (`Cmd + V`), puis appuie sur `Entrée`. Rien d'autre ne s'affiche : c'est normal, le serveur a gardé la clé pour la commande suivante.
- [ ] **Copie-colle tout l'encadré ci-dessous**, puis `Entrée`. Il vérifie que c'est bien une clé publique, garde une copie de l'ancien fichier de réglages, puis enregistre la clé dans les réglages du site :

```bash
cd /opt/recrutement
if [[ "$CLE" =~ ^age1[a-z0-9]+$ ]]; then
  cp -p .env ~/env-avant-cle
  sed -i '/^AGE_RECIPIENT=/d' .env
  [ -z "$(tail -c 1 .env)" ] || echo >> .env
  echo "AGE_RECIPIENT=$CLE" >> .env
  echo "C'EST FAIT. Clé enregistrée :"
  grep '^AGE_RECIPIENT=' .env
else
  echo "RIEN N'A ÉTÉ CHANGÉ : ce qui a été collé n'est pas une clé publique (elle doit commencer par age1)."
fi
```

- [ ] **Tu dois voir** `C'EST FAIT. Clé enregistrée :`, puis une ligne `AGE_RECIPIENT=age1…` avec la même clé qu'à l'étape 4.

**Si tu vois `RIEN N'A ÉTÉ CHANGÉ`** : la clé n'a pas été collée en entier, ou autre chose a été collé. Reviens à l'étape 4, recopie la ligne en entier, puis refais l'étape 6 depuis le début.

- [ ] **Quitte le serveur** : copie-colle `exit` puis `Entrée`. Tu peux fermer cette fenêtre.

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
| `AGE_RECIPIENT …` | refaire « Clé, étape 4 » à « Clé, étape 6 » (B3 et B4) |
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

### Clé, étape 7 — Vérifier que ta clé ouvre bien les sauvegardes

À faire **après la première sauvegarde** (une fois les sauvegardes installées sur le serveur), puis de temps en temps. C'est la seule preuve que ton fichier ouvre vraiment les sauvegardes.

- [ ] **Où** : dans le Terminal de ton Mac (pas sur le serveur).
- [ ] **Copie-colle tout l'encadré**, puis `Entrée` :

```bash
d=$(mktemp -d)
F=$(ssh deploy@51.75.252.121 'ls -t /var/backups/recrutement/*.db.age | head -n 1'); echo "Dernière copie : $F"
scp -q "deploy@51.75.252.121:$F" "$d/copie.db.age" && age -d -i ~/cles-yeita/cle-sauvegarde-recrutement.txt -o "$d/copie.db" "$d/copie.db.age" && sqlite3 -readonly "$d/copie.db" "SELECT 'Copie lisible : ' || count(*) || ' candidature(s).' FROM candidats;"
rm -rf "$d"
```

- [ ] **Tu dois voir** `Dernière copie : /var/backups/recrutement/recrutement-…`, puis `Copie lisible : N candidature(s).` Le nombre doit correspondre à peu près à ce que tu vois dans l'espace Candidatures. La copie déchiffrée est effacée tout de suite après.

**Si tu vois `no identity matched any of the recipients`** : le serveur chiffre avec une autre clé que la tienne. Refais les étapes 4, 5 et 6, lance une sauvegarde à la main (sur le serveur : `cd /opt/recrutement && deploy/backup.sh`), puis refais l'étape 7.

**Si tu vois `No such file or directory`** : aucune sauvegarde n'a encore été faite sur le serveur.

## B10. Le lendemain matin : la sauvegarde de la nuit

- [ ] Ouvrir `https://recrutement.yeita.fr/admin/sauvegardes.html`.
- [ ] Tu dois voir l'encadré **vert**, et « Dernière réussite » cette nuit, à l'heure du prochain passage affiché en B5 (colonne `NEXT`, heure du serveur ; la page l'affiche en heure de Paris : 1 h ou 2 h plus tard si le serveur est réglé en UTC), « Copies sur le serveur » à 2.

**Sinon** : en `ubuntu`, lancer `sudo journalctl -u recrutement-backup --since "today 02:00" --no-pager | tail -15` et m'envoyer le résultat.

---

Quand tout est coché : les sauvegardes sont en service.
