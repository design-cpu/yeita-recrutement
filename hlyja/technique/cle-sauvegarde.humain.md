---
type: technique
vue: humaine
page: cle-sauvegarde
titre: La clé des sauvegardes
maj: 1.7
commit: 287c215
sources: deploy/CLE-SAUVEGARDE.md, deploy/backup.sh, .env.example
date: 2026-10-28
---

# La clé des sauvegardes

Chaque nuit, le serveur fait une copie de la base des candidatures et la **chiffre** : sans la clé, personne ne peut la lire. Cette page explique comment créer cette clé, la garder, et la donner au serveur.

Il y a deux clés, qui vont ensemble :

| | À quoi elle sert | Où elle va |
|---|---|---|
| **La clé publique** (une ligne qui commence par `age1`) | Elle sert à chiffrer. Elle ne permet pas de relire les copies : elle n'est pas secrète. | Sur le serveur. |
| **La clé privée** (un fichier `cle-sauvegarde-recrutement.txt`) | Elle sert à ouvrir les copies. | Sur ton Mac, et chez une ou deux personnes de confiance. **Jamais sur le serveur.** |

> **Important** : quelqu'un qui a le fichier de la clé privée peut lire toutes les sauvegardes. Si plus personne n'a ce fichier, plus personne ne peut ouvrir les sauvegardes. Garde-le à deux endroits sûrs, et nulle part ailleurs.

---

## Avant de commencer

Il te faut :
- ton Mac ;
- l'accès au serveur avec le compte `deploy` (la commande `ssh deploy@51.75.252.121` doit fonctionner depuis ton Mac).

**Ouvrir le Terminal sur le Mac** : appuie sur `Cmd + Espace`, tape `Terminal`, appuie sur `Entrée`.

**Lancer une commande de cette page** : copie le texte de l'encadré gris (sélectionne-le puis `Cmd + C`), clique dans la fenêtre du Terminal, colle avec `Cmd + V`, puis appuie sur `Entrée`.

---

## Étape 1 — Installer age sur ton Mac

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

---

## Étape 2 — Créer la clé

À faire **une seule fois** (pas une fois par personne, pas une fois par Mac).

- [ ] **Où** : dans le Terminal de ton Mac.
- [ ] **Copie-colle** :

```bash
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

- [ ] **Tu dois voir** une ligne `Public key: age1…` (une longue suite de lettres et de chiffres).

Cette commande a créé le fichier `cle-sauvegarde-recrutement.txt` dans un dossier `cles-yeita` de ton dossier personnel. Ce dossier n'est pas synchronisé avec iCloud (ce n'est ni le Bureau, ni Documents).

**Si tu vois `file exists`** : la clé existe déjà. **Ne la recrée pas** : les sauvegardes faites avec l'ancienne deviendraient illisibles. Passe directement à l'étape 3.

---

## Étape 3 — Faire une copie de secours du fichier

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

---

## Étape 4 — Copier la clé publique

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

---

## Étape 5 — Se connecter au serveur

- [ ] **Où** : ouvre une **nouvelle fenêtre** de Terminal sur ton Mac (`Cmd + N` dans le Terminal).
- [ ] **Copie-colle** :

```bash
ssh deploy@51.75.252.121
```

- [ ] **Tu dois voir** une ligne qui se termine par `$`, par exemple `deploy@vps-…:~$`. Tu es maintenant sur le serveur : les commandes que tu tapes dans **cette fenêtre** s'exécutent sur le serveur.

**Si tu vois `Permission denied`** : ton Mac n'a pas l'accès au compte `deploy` du serveur. Demande-le à la personne qui administre le serveur.

---

## Étape 6 — Donner la clé publique au serveur

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

---

## Étape 7 — Vérifier que ta clé ouvre bien les sauvegardes

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

---

## Si plus personne n'a le fichier de la clé

Les sauvegardes déjà faites ne pourront plus jamais être ouvertes. Fais tout de suite :
1. l'étape 2 avec un **nouveau nom** de fichier : dans la commande, remplace les deux `cle-sauvegarde-recrutement.txt` par `cle-sauvegarde-recrutement-2.txt` ;
2. les étapes 3 à 6 avec ce nouveau fichier (remplace aussi le nom dans les commandes des étapes 4 et 7) ;
3. l'étape 7, après la sauvegarde suivante.

Les anciennes sauvegardes s'effaceront seules au bout de 30 jours.

## Si tu dois changer de clé

À faire si une personne qui avait le fichier ne doit plus l'avoir, ou si le fichier a pu être vu par quelqu'un d'autre.
1. Fais les étapes 2 à 6 avec un nouveau nom de fichier, par exemple `cle-sauvegarde-recrutement-2026-11.txt` (remplace le nom dans chaque commande).
2. Fais l'étape 7 avec le nouveau fichier, après la sauvegarde suivante.
3. **Garde l'ancien fichier 30 jours** : les sauvegardes déjà faites ne s'ouvrent qu'avec lui. Ensuite, supprime-le partout (ton Mac, la clé USB, chez les personnes qui l'avaient).

Une personne qui avait l'ancien fichier peut encore lire les sauvegardes faites avant le changement, jusqu'à ce qu'elles s'effacent (30 jours).
