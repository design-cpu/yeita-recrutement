---
type: guide-test
version: 1.7
date: 2026-10-27
---

# Tester les sauvegardes sur le vrai serveur

Partie A : 5 minutes sur le Mac, avant de merger. Partie B : ce que les essais automatiques n'ont pas pu prouver (le vrai stockage OVH, le vrai healthchecks.io, les droits des comptes S3, la clé du coffre, une vraie nuit), à faire une fois le site déployé avec cette version et les sauvegardes installées ; compter 45 minutes, plus un coup d'œil le lendemain matin.

Il te faut :
- le terminal du Mac, avec `age`, `rclone`, `sqlite3` et le client `aws` (`brew install age rclone sqlite awscli`) ;
- l'accès SSH au serveur en `deploy` (`ssh deploy@51.75.252.121`) et en `ubuntu` (pour `sudo`) ;
- le coffre de mots de passe : clé privée age, identifiants S3 « administrateur » et « restauration », nom du bucket ;
- l'accès à healthchecks.io.

Dans les commandes, remplace `BUCKET` par le nom du bucket (par exemple `recrutement-sauvegardes`).

---

# Partie A — sur le Mac, avant le merge

Docker Desktop lancé, dans le dossier du dépôt, sur la branche `version/1.7-sauvegarde-base`.

## A1. Les tests de l'API passent

- [ ] Lancer :

```bash
cd api && npm test 2>&1 | grep -E "^ℹ (tests|fail)"; cd ..
```

- [ ] Tu dois voir : `ℹ tests 55` puis `ℹ fail 0`.

**Sinon** : une ligne `ℹ fail` différente de 0 → copier les lignes `✖` (`cd api && npm test 2>&1 | grep -A8 "✖"`) et me les envoyer.

## A2. Les scripts de sauvegarde passent leurs 125 vérifications

- [ ] Construire le banc (une fois, ~2 min), puis lancer les vérifications (~3 min) :

```bash
docker build -q -t banc-sauvegarde - <<'FIN'
FROM ubuntu:26.04
RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 age rclone curl openssl python3 util-linux git iproute2 >/dev/null && useradd -m deploy && install -d -m 700 -o deploy -g deploy /var/backups/recrutement
FIN
docker run --rm -v "$PWD:/depot:ro" banc-sauvegarde bash /depot/tools/test-sauvegarde.sh /depot | tail -1
```

- [ ] Tu dois voir, en dernière ligne : `TOUT OK`.

**Sinon** : `ÉCHECS : n` → relancer sans `| tail -1` et m'envoyer les lignes qui commencent par `FAIL` (avec les 4 lignes en dessous).

---

# Partie B — sur le serveur, après le déploiement et la mise en service des sauvegardes


## B1. healthchecks.io répond `OK` à nos deux adresses

- [ ] Sur le serveur, en `deploy` :

```bash
cd /opt/recrutement && for v in HEALTHCHECK_SAUVEGARDE_URL HEALTHCHECK_DISQUE_URL; do u=$(docker compose config --environment | sed -n "s/^$v=//p"); printf '%s : ' "$v"; curl -sS -m 10 -K <(printf 'url = "%s"\n' "$u"); echo; done
```

- [ ] Tu dois voir : deux lignes qui finissent exactement par `OK` (rien après).
**Sinon** : `OK (not found)` → l'adresse ne correspond à aucun contrôle : recopier l'adresse de ping depuis healthchecks.io dans `/opt/recrutement/.env`. `OK (rate limited)` → attendre une minute et recommencer. Erreur de connexion → le serveur ne sort pas vers Internet en HTTPS : le dire à l'administrateur du serveur.

## B2. Une sauvegarde à la main passe le contrôle au vert

- [ ] Attendre une minute après B1, puis, en `deploy` :

```bash
cd /opt/recrutement && deploy/backup.sh
```

- [ ] Tu dois voir : la dernière ligne est `Sauvegarde réussie : recrutement-…Z.db.age (… octets), envoyée.` ; sur healthchecks.io, le contrôle « Sauvegarde » est vert, avec le message « Sauvegarde réussie (code 0, … octets chiffrés). ».
**Sinon** : lire la ligne `ÉCHEC (…)` ou `ARRÊT : …` :

| Début du message | Que faire |
|---|---|
| `… est vide`, `… valeur d'exemple`, `… https://`, `… identiques`, `… clé publique age` | corriger la variable nommée dans `/opt/recrutement/.env` (`nano .env`), relancer |
| `ÉCHEC (api non saine)` | `docker compose ps api` doit dire `healthy` ; sinon `docker compose logs --tail 50 api` |
| `ÉCHEC (envoi (rclone))` | `rclone lsd ovh:BUCKET` : une erreur `403` ou `AccessDenied` → revoir la politique du compte « serveur » chez OVH |
| `… existe déjà : rien n'est écrasé` | deux essais dans la même seconde : relancer |

## B3. La vérification du disque passe au vert

- [ ] Une minute après B2, en `deploy` :

```bash
cd /opt/recrutement && deploy/verif-disque.sh
```

- [ ] Tu dois voir : `Disque racine : N % ; dossier Docker : N % ; seuil : 80 %.` avec des nombres sous 80 ; contrôle « Disque » vert sur healthchecks.io.
**Sinon** : un nombre au-dessus de 80 → le disque est vraiment presque plein : `df -h` et `docker system df` pour voir ce qui prend la place ; le dire à l'administrateur du serveur.

## B4. La copie est bien chez OVH

- [ ] En `deploy` :

```bash
cd /opt/recrutement && rclone lsl "$(docker compose config --environment | sed -n 's/^RCLONE_DEST=//p')"
```

- [ ] Tu dois voir : au moins une ligne `… recrutement-AAAA-MM-JJTHHMMSSZ.db.age` à l'heure de B2.
**Sinon** : liste vide → `RCLONE_DEST` ne pointe pas où l'envoi a lieu : comparer avec la ligne `RCLONE_DEST` de `.env`.

## B5. Le serveur ne peut pas effacer chez OVH

- [ ] En `deploy`, avec le nom de fichier affiché en B4 :

```bash
cd /opt/recrutement && D=$(docker compose config --environment | sed -n 's/^RCLONE_DEST=//p'); rclone deletefile "$D/recrutement-AAAA-MM-JJTHHMMSSZ.db.age"; echo "code $?"; rclone lsl "$D" | tail -3
```

- [ ] Tu dois voir : une erreur `AccessDenied` (ou `403`), `code 1`, et le fichier toujours listé.
**Sinon** : le fichier a disparu → **le compte « serveur » a le droit d'effacer** : chez OVH, réimporter sa politique (refus de `s3:DeleteObject`) et vérifier que le bucket a été créé par le compte « administrateur », pas par celui-là. Relancer B2 pour remettre une copie.

- [ ] Toujours en `deploy`, aucun autre identifiant S3 sur le serveur :

```bash
ls -a ~ ~/.config; ls ~/.aws 2>&1
```

- [ ] Tu dois voir : pas de dossier `.aws` (`No such file or directory`), seulement `rclone` dans `.config`.
**Sinon** : supprimer `~/.aws` (`rm -r ~/.aws`) : les identifiants « administrateur » ne doivent jamais être sur le serveur.

## B6. Les 30 jours sont réglés chez OVH (depuis le Mac)

- [ ] Sur le Mac, avec les identifiants « administrateur » du coffre (`printf` puis `read` : marche sous zsh) :

```bash
printf "Clé d'accès (administrateur) : "; read -r AWS_ACCESS_KEY_ID; printf "Secret : "; read -r -s AWS_SECRET_ACCESS_KEY; echo; export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION=gra
aws s3api get-bucket-lifecycle-configuration --bucket BUCKET --endpoint-url https://s3.gra.io.cloud.ovh.net
aws s3api get-bucket-versioning --bucket BUCKET --endpoint-url https://s3.gra.io.cloud.ovh.net
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
```

- [ ] Tu dois voir : une règle avec `"Expiration": {"Days": 30}` et `"Status": "Enabled"` ; pour le versionnage, rien (ou pas de `"Status": "Enabled"`).
**Sinon** : `NoSuchLifecycleConfiguration` → poser la règle :

```bash
printf '%s' '{"Rules": [{"ID": "expiration-30-jours", "Status": "Enabled", "Filter": {"Prefix": ""}, "Expiration": {"Days": 30}}]}' > /tmp/lifecycle.json
aws s3api put-bucket-lifecycle-configuration --bucket BUCKET --lifecycle-configuration file:///tmp/lifecycle.json --endpoint-url https://s3.gra.io.cloud.ovh.net && rm /tmp/lifecycle.json
```

(à lancer avant le `unset`). Versionnage `Enabled` → le dire : les copies effacées resteraient en versions cachées.

## B7. La clé du coffre ouvre la copie, avec le compte « restauration » (depuis le Mac)

- [ ] Sur le Mac, dans un dossier temporaire effacé à la fin :

```bash
umask 077; d=$(mktemp -d); cd "$d"
pbpaste > cle.txt; pbcopy </dev/null; age-keygen -y cle.txt
```

(Avant la seconde ligne : copier la clé privée `AGE-SECRET-KEY-…` depuis le coffre.)
- [ ] Tu dois voir : la ligne affichée (`age1…`) est **exactement** la valeur `AGE_RECIPIENT` du serveur (`ssh deploy@51.75.252.121 "cd /opt/recrutement && docker compose config --environment | grep AGE_RECIPIENT"`).
**Sinon** : **arrêter tout** : les copies sont chiffrées pour une autre clé que celle du coffre, donc illisibles. Créer une nouvelle clé sur le Mac : `age-keygen -o nouvelle.key` (la ligne `Public key: age1…` est la clé publique) ; ranger la clé privée (`AGE-SECRET-KEY-…`, dans `nouvelle.key`) et la clé publique au coffre, puis `rm nouvelle.key` ; sur le serveur, en `deploy`, `nano /opt/recrutement/.env` et remplacer la valeur de `AGE_RECIPIENT` par la nouvelle clé publique ; refaire B2 et B7.

- [ ] Toujours dans `$d`, récupérer et ouvrir la copie de B2 :

```bash
printf "Clé d'accès S3 (restauration) : "; read -r RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID; printf "Secret S3 : "; read -r -s RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY; echo
export RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY RCLONE_CONFIG_RESTAU_TYPE=s3 RCLONE_CONFIG_RESTAU_PROVIDER=Other RCLONE_CONFIG_RESTAU_ENDPOINT=https://s3.gra.io.cloud.ovh.net RCLONE_CONFIG_RESTAU_REGION=gra
rclone lsl restau:BUCKET/recrutement
rclone copy restau:BUCKET/recrutement/recrutement-AAAA-MM-JJTHHMMSSZ.db.age .
age -d -i cle.txt -o copie.db recrutement-AAAA-MM-JJTHHMMSSZ.db.age
sqlite3 -readonly copie.db "PRAGMA integrity_check; SELECT count(*) FROM candidats; SELECT count(*) FROM equipe;"
```

- [ ] Tu dois voir : la liste des copies ; puis `ok`, le nombre de candidatures et le nombre de membres de l'équipe tels que tu les connais.
**Sinon** : `AccessDenied` sur `lsl` → revoir la politique du compte « restauration » chez OVH (lecture du bucket) ; `no identity matched` sur `age` → la clé n'est pas la bonne (point précédent).

- [ ] Le compte « restauration » ne peut ni déposer ni effacer :

```bash
echo essai > essai.txt; rclone copyto essai.txt restau:BUCKET/recrutement/essai.txt; echo "copie : code $?"
rclone deletefile restau:BUCKET/recrutement/recrutement-AAAA-MM-JJTHHMMSSZ.db.age; echo "effacement : code $?"
```

- [ ] Tu dois voir : deux erreurs `AccessDenied` (ou `403`), `code 1` les deux fois.
**Sinon** : chez OVH, réimporter la politique « lecture seule » du compte « restauration » ; si `essai.txt` a été déposé, le retirer avec le compte « administrateur ».

- [ ] Tout effacer du Mac :

```bash
cd / && rm -rf "$d"; pbcopy </dev/null; unset RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY
```

- [ ] Tu dois voir : aucune sortie.

## B8. Une alerte arrive vraiment

- [ ] En `deploy`, signaler un faux échec :

```bash
cd /opt/recrutement && u=$(docker compose config --environment | sed -n 's/^HEALTHCHECK_SAUVEGARDE_URL=//p'); curl -sS -m 10 -K <(printf 'url = "%s/fail"\n' "$u") --data-binary "Essai d'alerte (guide de test)"; echo
```

- [ ] Tu dois voir : `OK` ; le contrôle « Sauvegarde » passe au rouge et un email d'alerte arrive dans les minutes qui suivent.
**Sinon** : pas d'email → dans healthchecks.io, vérifier l'intégration email du contrôle et l'adresse de l'équipe.

- [ ] Une minute après, remettre au vert par une vraie sauvegarde : `deploy/backup.sh`.
- [ ] Tu dois voir : `Sauvegarde réussie …`, contrôle vert, email « revenu ».

## B9. Les deux minuteries sont en place

- [ ] Sur le serveur (n'importe quel compte) :

```bash
systemctl list-timers 'recrutement-*' --no-pager
```

- [ ] Tu dois voir : deux lignes, `recrutement-backup.timer` avec un prochain passage entre 3 h et 3 h 15, `recrutement-verif-disque.timer` à la prochaine heure pleine.
**Sinon** : moins de deux lignes → en `ubuntu`, installer les unités (une unité déjà présente et différente n'est jamais écrasée : la commande affiche la différence et s'arrête) :

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

Une ligne `DIFFÉRENTE` → me l'envoyer avec la différence affichée.

## B10. Le lendemain matin : la sauvegarde de la nuit

- [ ] En `ubuntu` :

```bash
sudo journalctl -u recrutement-backup --since "today 02:00" --no-pager | tail -15
sudo grep -c hc-ping /var/log/syslog 2>/dev/null; sudo journalctl -u recrutement-backup --no-pager | grep -c hc-ping
```

- [ ] Tu dois voir : un passage entre 3 h et 3 h 15, qui finit par `Sauvegarde réussie : …` et `Deactivated successfully` ; les deux compteurs à `0` (l'adresse de ping n'apparaît jamais dans les journaux) ; contrôle « Sauvegarde » vert, dernier ping de la nuit.
**Sinon** : aucune ligne → la minuterie n'a pas tourné : `systemctl status recrutement-backup.timer` ; une ligne `ÉCHEC` → tableau de B2 ; un compteur au-dessus de 0 → le signaler : l'adresse de ping ne doit jamais être écrite dans un journal.

---

Quand tout est coché : les sauvegardes sont en service.
