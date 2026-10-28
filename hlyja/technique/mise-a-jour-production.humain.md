---
type: technique
vue: humaine
page: mise-a-jour-production
titre: Mettre à jour le site en production
maj: 1.7
commit: e005282
sources: deploy/METTRE-A-JOUR.md, deploy/deploy.sh, deploy/CLE-SAUVEGARDE.md
date: 2026-10-28
---

# Mettre à jour le site en production

Il n'y a pas encore de déploiement automatique : après chaque pull request mergée dans `main`, quelqu'un met le serveur à jour à la main, en suivant cette page. Compter 10 minutes, plus les gestes propres à certaines versions (section 5).

Serveur : `51.75.252.121` (compte `deploy` pour mettre à jour, compte `ubuntu` pour les gestes administrateur avec `sudo`). Site : `https://recrutement.yeita.fr`.

## 1. Avant

- [ ] La pull request est **mergée dans `main`** sur GitHub (pas seulement approuvée). `deploy.sh` prend toujours le dernier `main`.
- [ ] Lire la section 5 : la version demande-t-elle des gestes en plus ? Si oui, les prévoir dans le même créneau.
- [ ] Éviter 3 h–3 h 15 (sauvegarde de la nuit). En dehors, une sauvegarde lancée à la main peut aussi être en cours : `deploy.sh` le dira (voir section 4).
- [ ] Prévenir l'équipe : le site est coupé une quinzaine de secondes ; les pages ouvertes affichent alors le message réseau, il suffit de recharger.
- [ ] Si tu dois arrêter Docker lui-même (maintenance du serveur, rare) : arrêter d'abord les minuteries des sauvegardes (compte `ubuntu`) : `sudo systemctl stop recrutement-backup.timer recrutement-verif-disque.timer`, et les relancer après avec `start` au lieu de `stop`. Sinon une commande `docker` des sauvegardes le redémarrerait.

## 2. Mettre à jour

- [ ] Ouvrir un **nouveau** terminal, puis se connecter au serveur :

```bash
ssh deploy@51.75.252.121
```

- [ ] Sur le serveur, lancer la mise à jour (le `umask 022` garantit que les fichiers mis à jour restent lisibles par l'application) :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

- [ ] Tu dois voir, dans l'ordre : `Commit en place : …`, `· Dépôt sur main : <commit>`, la construction des images, `· Conteneurs à jour ; anciennes images du projet supprimées.`, `· API saine.`, 7 lignes `OK`, `Tout est OK sur https://recrutement.yeita.fr`, et en dernier **`Déploiement réussi : <commit> sur https://recrutement.yeita.fr`**.

**Sinon** : la dernière ligne commence par `ÉCHEC :` ou `ARRÊT :` → section 4.

## 3. Contrôler

- [ ] Dans un navigateur, ouvrir `https://recrutement.yeita.fr/candidatures/` : la connexion Google, puis le tableau des candidatures avec « Connecté·e : <prénom> ».
- [ ] Ouvrir `https://recrutement.yeita.fr/admin/sauvegardes.html` (compte admin) : la page d'état des sauvegardes s'affiche (le verdict peut être rouge juste après une version qui installe les sauvegardes : c'est normal tant que la première n'est pas faite).
- [ ] Optionnel, depuis le Mac, dans le dossier du dépôt : `tools/check-site.sh https://recrutement.yeita.fr` → 7 `OK` et `Tout est OK sur https://recrutement.yeita.fr`.

## 4. Si ça ne va pas

| Dernière ligne affichée | Que faire |
|---|---|
| `ÉCHEC : …` puis `Pour revenir à la version précédente : deploy/deploy.sh <commit>` | Lancer **tout de suite** la commande affichée (`deploy/deploy.sh <commit>`), puis transmettre le message `ÉCHEC` à la personne responsable du site. Le site revient à la version d'avant. |
| `ARRÊT : un déploiement est déjà en cours` | Une sauvegarde ou un autre déploiement tourne : attendre 5 minutes et relancer la commande de la section 2. |
| `ARRÊT : le dépôt contient des modifications ou des fichiers en trop` | Quelqu'un a modifié un fichier sur le serveur : ne rien supprimer ; transmettre la liste affichée à la personne responsable du site. |
| `ARRÊT : … a encore sa valeur d'exemple` ou `… est vide` | Un réglage de `/opt/recrutement/.env` est à remplir : transmettre le nom affiché à la personne responsable du site. |
| Le site affiche une erreur après `Déploiement réussi` | Revenir à la version d'avant : `deploy/deploy.sh <commit précédent>` (le commit est sur la ligne `Commit en place : …` affichée au début). |

Après un retour en arrière, le dépôt reste sur ce commit : la prochaine mise à jour (section 2) reprendra le dernier `main`, une fois le problème corrigé.

## 5. Gestes propres à une version

À faire **une fois**, juste après la section 2, quand la version est déployée pour la première fois.

### 1.7 — sauvegardes de la base

1. **Installer age** (compte `ubuntu`) :

```bash
sudo apt install -y age
```

Tu dois voir à la fin : `age` installé (ou « déjà la version la plus récente »).

2. **Créer la clé sur le Mac** (pas sur le serveur ; une seule fois). Installer age sur le Mac (`brew install age`), puis :

```bash
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

Tu dois voir `Public key: age1…`. Si la commande répond que le fichier existe déjà : une clé existe, **ne rien écraser**, passer à la suite.
Garder ce fichier : une seconde copie sur une clé USB chiffrée, ou le donner en main propre (AirDrop côte à côte) à une personne de confiance ; jamais par email, Slack, Drive, ni sur le serveur.

   **Mettre la clé publique sur le serveur.** Sur le Mac, la copier :

```bash
age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt | pbcopy
```

Puis sur le serveur, en `deploy` : taper `CLE='`, coller (`Cmd+V`), taper `'`, Entrée, puis :

```bash
cd /opt/recrutement && [[ "$CLE" =~ ^age1[a-z0-9]+$ ]] && cp -p .env ~/env-avant-cle && sed -i '/^AGE_RECIPIENT=/d' .env && { [ -z "$(tail -c 1 .env)" ] || echo >> .env; } && echo "AGE_RECIPIENT=$CLE" >> .env && grep '^AGE_RECIPIENT=' .env || echo "RIEN N'A ÉTÉ CHANGÉ : la clé collée n'est pas une clé publique age (age1…)."
```

Tu dois voir une seule ligne `AGE_RECIPIENT=age1…`. Sinon `RIEN N'A ÉTÉ CHANGÉ` → refaire la ligne `CLE='…'`.

3. **Installer les minuteries** (compte `ubuntu`) :

```bash
cd /opt/recrutement && sudo bash -c 'set -e
for u in recrutement-backup.service recrutement-backup.timer recrutement-verif-disque.service recrutement-verif-disque.timer; do
  if [ ! -e /etc/systemd/system/$u ]; then install -m 644 deploy/systemd/$u /etc/systemd/system/$u; echo "copiée : $u"
  elif cmp -s deploy/systemd/$u /etc/systemd/system/$u; then echo "identique : $u"
  else echo "DIFFÉRENTE : $u (rien n est écrasé)"; diff /etc/systemd/system/$u deploy/systemd/$u || true; exit 1; fi
done
systemctl daemon-reload
systemctl enable --now recrutement-backup.timer recrutement-verif-disque.timer' && systemctl list-timers 'recrutement-*'
```

Tu dois voir 4 lignes `copiée : …`, puis deux lignes de minuteries (`recrutement-backup.timer` vers 3 h, `recrutement-verif-disque.timer` à l'heure pleine).

4. **Donner le rôle admin** à qui doit voir la page d'état (compte `deploy`, remplacer l'adresse) :

```bash
cd /opt/recrutement && docker compose exec api node api/equipe.js role prenom.nom@yeita.fr admin
```

Tu dois voir : `Rôle changé : prenom.nom@yeita.fr · <Prénom> · admin · actif`.

5. **Première sauvegarde** (compte `deploy`) :

```bash
cd /opt/recrutement && deploy/backup.sh && deploy/verif-disque.sh
```

Tu dois voir `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur.` puis `Disque racine : … % ; dossier Docker : … % ; seuil : 80 %.`. Ensuite, `https://recrutement.yeita.fr/admin/sauvegardes.html` affiche un verdict **vert**.

6. **Vérifier la clé** (sur le Mac) : c'est la seule preuve que le fichier gardé ouvre les sauvegardes.

```bash
d=$(mktemp -d); F=$(ssh deploy@51.75.252.121 'ls -t /var/backups/recrutement/*.db.age | head -n 1'); echo "$F"
scp "deploy@51.75.252.121:$F" "$d/copie.db.age" && age -d -i ~/cles-yeita/cle-sauvegarde-recrutement.txt -o "$d/copie.db" "$d/copie.db.age" && sqlite3 -readonly "$d/copie.db" "PRAGMA integrity_check; SELECT count(*) FROM candidats;"
rm -rf "$d"
```

Tu dois voir le nom de la dernière copie, puis `ok` et le nombre de candidatures. Sinon `no identity matched any of the recipients` → la clé du serveur n'est pas celle du Mac : refaire l'étape 2, puis l'étape 5, puis celle-ci.

### Revenir avant la 1.7

Avant un `deploy/deploy.sh <commit>` vers un commit antérieur à la 1.7, arrêter les minuteries (compte `ubuntu`) :

```bash
sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer
```
