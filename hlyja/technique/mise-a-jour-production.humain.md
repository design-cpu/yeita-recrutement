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

2. **La clé des sauvegardes** (sur ton Mac, puis sur le serveur), en suivant les étapes ci-dessous.

**Ouvrir le Terminal sur le Mac** : appuie sur `Cmd + Espace`, tape `Terminal`, appuie sur `Entrée`.

**Lancer une commande de cette page** : copie le texte de l'encadré gris (sélectionne-le puis `Cmd + C`), clique dans la fenêtre du Terminal, colle avec `Cmd + V`, puis appuie sur `Entrée`.

#### Clé, étape 1 — Installer age sur ton Mac

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


#### Clé, étape 2 — Créer la clé

À faire **une seule fois** (pas une fois par personne, pas une fois par Mac).

- [ ] **Où** : dans le Terminal de ton Mac.
- [ ] **Copie-colle** :

```bash
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

- [ ] **Tu dois voir** une ligne `Public key: age1…` (une longue suite de lettres et de chiffres).

Cette commande a créé le fichier `cle-sauvegarde-recrutement.txt` dans un dossier `cles-yeita` de ton dossier personnel. Ce dossier n'est pas synchronisé avec iCloud (ce n'est ni le Bureau, ni Documents).

**Si tu vois `file exists`** : la clé existe déjà. **Ne la recrée pas** : les sauvegardes faites avec l'ancienne deviendraient illisibles. Passe directement à l'étape 3.


#### Clé, étape 3 — Faire une copie de secours du fichier

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


#### Clé, étape 4 — Copier la clé publique

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


#### Clé, étape 5 — Se connecter au serveur

- [ ] **Où** : ouvre une **nouvelle fenêtre** de Terminal sur ton Mac (`Cmd + N` dans le Terminal).
- [ ] **Copie-colle** :

```bash
ssh deploy@51.75.252.121
```

- [ ] **Tu dois voir** une ligne qui se termine par `$`, par exemple `deploy@vps-…:~$`. Tu es maintenant sur le serveur : les commandes que tu tapes dans **cette fenêtre** s'exécutent sur le serveur.

**Si tu vois `Permission denied`** : ton Mac n'a pas l'accès au compte `deploy` du serveur. Demande-le à la personne qui administre le serveur.


#### Clé, étape 6 — Donner la clé publique au serveur

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

6. **Vérifier la clé** (sur ton Mac) :

#### Clé, étape 7 — Vérifier que ta clé ouvre bien les sauvegardes

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

### Revenir avant la 1.7

Avant un `deploy/deploy.sh <commit>` vers un commit antérieur à la 1.7, arrêter les minuteries (compte `ubuntu`) :

```bash
sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer
```
