---
type: technique
vue: humaine
page: cle-sauvegarde
titre: La clé des sauvegardes
maj: 1.7
commit: e005282
sources: deploy/CLE-SAUVEGARDE.md, deploy/backup.sh, .env.example
date: 2026-10-28
---

# La clé des sauvegardes

Les sauvegardes de la base sont chiffrées avec **age**. Il y a deux clés :

| Clé | À quoi elle sert | Où elle va |
|---|---|---|
| **Clé publique** (`age1…`) | chiffrer ; elle ne permet pas de relire | sur le serveur, dans `.env` (`AGE_RECIPIENT`) ; elle n'est pas secrète |
| **Clé privée** (`AGE-SECRET-KEY-1…`) | déchiffrer : ouvrir ou restaurer une copie | **jamais sur le serveur** ; un fichier `.txt` gardé sur un Mac et partagé avec quelques personnes de confiance |

> Quiconque a le fichier de la clé privée peut lire **toutes** les sauvegardes (tous les dossiers candidat). Si ce fichier est perdu par tout le monde, **toutes** les sauvegardes deviennent illisibles. Il faut donc le garder à au moins deux endroits sûrs, et nulle part ailleurs.

Toutes les commandes se lancent dans le Terminal du Mac (zsh, le shell par défaut), sauf mention « sur le serveur ».

## 1. Créer la clé (une fois)

Installer age (une fois par Mac) :

```bash
brew install age
```

Créer la clé dans un dossier qui n'est **pas** synchronisé (ni Bureau, ni Documents, ni iCloud Drive, ni Google Drive), lisible par toi seul :

```bash
mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

La commande affiche une ligne `Public key: age1…` : c'est la clé publique. La retrouver à tout moment :

```bash
age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt
```

Si `age-keygen` répond que le fichier existe déjà : une clé a déjà été créée. **Ne pas l'écraser** (les sauvegardes faites avec elle deviendraient illisibles) ; passer à l'étape 2.

## 2. Mettre la clé publique sur le serveur

Sur le Mac, copier la clé publique :

```bash
age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt | pbcopy
```

Sur le serveur, en `deploy` (`ssh deploy@51.75.252.121`) : taper `CLE='`, coller la clé (`Cmd+V`), taper `'`, Entrée. Puis lancer :

```bash
cd /opt/recrutement && [[ "$CLE" =~ ^age1[a-z0-9]+$ ]] && cp -p .env ~/env-avant-cle && sed -i '/^AGE_RECIPIENT=/d' .env && { [ -z "$(tail -c 1 .env)" ] || echo >> .env; } && echo "AGE_RECIPIENT=$CLE" >> .env && grep '^AGE_RECIPIENT=' .env || echo "RIEN N'A ÉTÉ CHANGÉ : la clé collée n'est pas une clé publique age (age1…)."
```

Tu dois voir une seule ligne `AGE_RECIPIENT=age1…`, identique à la clé publique du Mac. Une copie de l'ancien `.env` est gardée hors du dépôt, dans `~/env-avant-cle` (dossier personnel de `deploy`) : rien n'est ajouté au dépôt, que `deploy.sh` exige propre.
Sinon : `RIEN N'A ÉTÉ CHANGÉ` → la variable `CLE` est vide ou mal collée : refaire la ligne `CLE='…'`.

## 3. Garder et partager le fichier

Pour l'instant (en attendant un coffre de mots de passe interne), le fichier `cle-sauvegarde-recrutement.txt` est la clé.

**À faire :**
- Le garder sur ton Mac dans `~/cles-yeita/` (étape 1), sur un disque chiffré (FileVault activé).
- En avoir une seconde copie hors de ton Mac : une clé USB chiffrée rangée en lieu sûr, ou le Mac d'une seconde personne de confiance.
- Le donner seulement à 1 ou 2 personnes qui doivent pouvoir restaurer, **en main propre** : AirDrop entre deux Mac côte à côte, ou une clé USB qu'on se passe. La personne le range comme à l'étape 1 (`~/cles-yeita/`, `chmod 600`).
- Noter qui a le fichier (et depuis quand).

**À ne jamais faire :**
- Le mettre sur le serveur, dans le dépôt Git, dans un dossier synchronisé (iCloud, Google Drive, Dropbox), ou en pièce jointe d'un email, d'un message Slack, WhatsApp, etc.
- L'imprimer ou le coller dans un document partagé.

## 4. Vérifier la clé (après la première sauvegarde, puis de temps en temps)

C'est la seule preuve que le fichier gardé ouvre bien les sauvegardes. Sur le Mac :

```bash
d=$(mktemp -d); F=$(ssh deploy@51.75.252.121 'ls -t /var/backups/recrutement/*.db.age | head -n 1'); echo "$F"
scp "deploy@51.75.252.121:$F" "$d/copie.db.age" && age -d -i ~/cles-yeita/cle-sauvegarde-recrutement.txt -o "$d/copie.db" "$d/copie.db.age" && sqlite3 -readonly "$d/copie.db" "PRAGMA integrity_check; SELECT count(*) FROM candidats;"
rm -rf "$d"
```

Attendu : le nom de la dernière copie, puis `ok` et le nombre de candidatures.
Sinon : `no identity matched any of the recipients` → **ce fichier n'est pas la clé qui chiffre les sauvegardes** : refaire l'étape 2 avec la clé publique de ce fichier, puis lancer une sauvegarde (en `deploy` : `cd /opt/recrutement && deploy/backup.sh`) et revérifier. Les copies déjà faites avec l'autre clé ne pourront pas être ouvertes.

## 5. Si la clé est perdue

Si **plus personne** n'a le fichier : les copies existantes sont définitivement illisibles. Tout de suite :
1. Créer une nouvelle clé (étape 1, avec un autre nom de fichier, par exemple `cle-sauvegarde-recrutement-2.txt`, ou après avoir constaté que l'ancien fichier n'existe plus).
2. Mettre sa clé publique sur le serveur (étape 2).
3. Lancer une sauvegarde (en `deploy` : `cd /opt/recrutement && deploy/backup.sh`), puis vérifier (étape 4).

Les anciennes copies s'effaceront seules au bout de 30 jours.

## 6. Changer de clé

À faire si une personne qui avait le fichier ne doit plus l'avoir, ou si le fichier a pu fuiter.
1. Créer une nouvelle clé sous un autre nom (étape 1 : `cle-sauvegarde-recrutement-AAAA-MM.txt`).
2. Mettre sa clé publique sur le serveur (étape 2), lancer une sauvegarde et vérifier (étape 4) avec le nouveau fichier.
3. Garder l'ancien fichier **30 jours** : les copies déjà faites ne s'ouvrent qu'avec lui. Ensuite, le supprimer partout (`rm ~/cles-yeita/<ancien fichier>`, et sur la clé USB).
4. Donner le nouveau fichier aux personnes qui doivent pouvoir restaurer (étape 3).

Une personne qui avait l'ancien fichier peut encore lire les copies faites avant le changement, jusqu'à leur effacement (30 jours).
