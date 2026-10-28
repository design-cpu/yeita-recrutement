# Mettre à jour le site en production

Depuis la 1.9, **le serveur met `main` en ligne tout seul**, sous 10 minutes, si les tests passent : rien à faire après un merge, sauf suivre `https://recrutement.yeita.fr/admin/deploiement.html`. **Mais** quand la section 5 a, pour la version, une partie « avant le merge », elle se fait **avant de cliquer Merge** : le merge met la version en ligne sous 10 minutes. Cette page sert pour le **premier passage à la 1.9** (section 5), pour le **secours sans tests**, et pour les gestes propres à certaines versions. Compter 10 minutes.

Serveur : `51.75.252.121` (compte `deploy` pour mettre à jour, compte `ubuntu` pour les gestes administrateur avec `sudo`). Site : `https://recrutement.yeita.fr`.

## 1. Avant

- [ ] **Avant de merger** : la section 5 a-t-elle, pour cette version, une partie « avant le merge » (par exemple « 1.10 — avant le merge ») ? Si oui, la faire d'abord, en entier.
- [ ] La pull request est **mergée dans `main`** sur GitHub (pas seulement approuvée). `deploy.sh` prend toujours le dernier `main`.
- [ ] Depuis la 1.9 : vérifier sur `/admin/deploiement.html` que rien n'est en cours (sinon `deploy.sh` attend ou s'arrête sur « déjà en cours »). Lancer `deploy.sh` à la main pendant un passage l'annule.
- [ ] Lire la section 5 : la version demande-t-elle des gestes en plus ? Si oui, les prévoir dans le même créneau.
- [ ] Éviter 3 h–3 h 15 (sauvegarde de la nuit). En dehors, une sauvegarde lancée à la main peut aussi être en cours : `deploy.sh` le dira (voir section 4).
- [ ] Prévenir l'équipe : le site est coupé une quinzaine de secondes ; les pages ouvertes affichent alors le message réseau, il suffit de recharger.
- [ ] Si tu dois arrêter Docker lui-même (maintenance du serveur, rare) : `deploy/README.md`, section 14, « Maintenance de Docker » (arrêter les minuteries des sauvegardes et du déploiement automatique, attendre la fin d'un passage).

## 2. Mettre à jour

- [ ] Ouvrir un **nouveau** terminal, puis se connecter au serveur :

```bash
ssh deploy@51.75.252.121
```

- [ ] Sur le serveur, lancer la mise à jour (le `umask 022` garantit que les fichiers mis à jour restent lisibles par l'application) :

```bash
umask 022 && cd /opt/recrutement && deploy/deploy.sh
```

- [ ] Tu dois voir, dans l'ordre : `Commit en place : …`, `· Dépôt sur main : <commit>`, la construction des images, `· Conteneurs à jour ; anciennes images du projet supprimées.`, `· API saine.`, 8 lignes `OK`, `Tout est OK sur https://recrutement.yeita.fr`, et en dernier **`Déploiement réussi : <commit> sur https://recrutement.yeita.fr`**.

**Sinon** : la dernière ligne commence par `ÉCHEC :` ou `ARRÊT :` → section 4.

## 3. Contrôler

- [ ] Dans un navigateur, ouvrir `https://recrutement.yeita.fr/candidatures/` : la connexion Google, puis le tableau des candidatures avec « Connecté·e : <prénom> ».
- [ ] Ouvrir `https://recrutement.yeita.fr/admin/sauvegardes.html` (compte admin) : la page d'état des sauvegardes s'affiche (le verdict peut être rouge juste après une version qui installe les sauvegardes : c'est normal tant que la première n'est pas faite).
- [ ] Optionnel, depuis le Mac, dans le dossier du dépôt : `tools/check-site.sh https://recrutement.yeita.fr` → 8 `OK` et `Tout est OK sur https://recrutement.yeita.fr`.

## 4. Si ça ne va pas

| Dernière ligne affichée | Que faire |
|---|---|
| `ÉCHEC : …` puis `Pour revenir à la version précédente : deploy/deploy.sh <commit>` | Lancer **tout de suite** la commande affichée (`deploy/deploy.sh <commit>`), telle quelle. Seule exception : si la commande qui vient d'échouer était déjà un retour vers une version d'avant la 1.8, ajouter `umask 022 &&` devant. Puis transmettre le message `ÉCHEC` à la personne responsable du site. Le site revient à la version d'avant. |
| `ARRÊT : un déploiement est déjà en cours` | Une sauvegarde ou un autre déploiement tourne : attendre 5 minutes et relancer la commande de la section 2. |
| `ARRÊT : le dépôt contient des modifications ou des fichiers en trop` | Quelqu'un a modifié un fichier sur le serveur : ne rien supprimer ; transmettre la liste affichée à la personne responsable du site. |
| `ARRÊT : … a encore sa valeur d'exemple` ou `… est vide` | Un réglage de `/opt/recrutement/.env` est à remplir : transmettre le nom affiché à la personne responsable du site. |
| Le site affiche une erreur après `Déploiement réussi` | Revenir à la version d'avant : `deploy/deploy.sh <commit précédent>` (le commit est sur la ligne `Commit en place : …` affichée au début). |

Après un retour en arrière, le dépôt reste sur ce commit : la prochaine mise à jour (section 2) reprendra le dernier `main`, une fois le problème corrigé. Depuis la 1.9, un `deploy/deploy.sh <commit>` qui n'est pas le dernier `main` **met le déploiement automatique en pause** (`· Déploiement automatique en pause …`) : une fois `main` corrigé, cliquer « Reprendre » sur `/admin/deploiement.html`.

## 5. Gestes propres à une version

À faire **une fois**. Une partie « avant le merge » se fait avant de cliquer Merge (le déploiement automatique met `main` en ligne sous 10 minutes) ; les autres, juste après la section 2, quand la version est déployée pour la première fois.

### 1.10 — avant le merge (compte `ubuntu`)

Le site accepte désormais des CV et portfolios jusqu'à 10 Mo ; le nginx du serveur refuse tout envoi de plus de 1 Mo tant qu'il n'est pas réglé. Compter 10 minutes.

1. **Sauvegarder** maintenant (compte `deploy`), pour avoir une copie toute fraîche d'avant la 1.10 :

```bash
ssh deploy@51.75.252.121 'cd /opt/recrutement && deploy/backup.sh'
```

Tu dois voir : `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; … copies sur le serveur.`
**Sinon** : ne pas merger ; transmettre le message à la personne responsable du site.

2. **Se connecter** en `ubuntu` et relever le réglage actuel et les autres sites :

```bash
ssh ubuntu@51.75.252.121
```

```bash
sudo nginx -T 2>/dev/null | grep -n client_max_body_size; sudo nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u | tee ~/sites-avant-1.10.txt
```

Tu dois voir : aucune ligne `client_max_body_size` (ou seulement celles d'autres sites), puis la liste des noms servis, dont `recrutement.yeita.fr`.

3. **Copier le fichier du site**, puis **ajouter le réglage** dans le bloc `server` du port 443 (celui qui a `listen 443 ssl;`), juste après les lignes `add_header`, comme dans l'exemple de `deploy/README.md` § 7 :

```bash
sudo cp -a /etc/nginx/sites-available/recrutement.yeita.fr ~/recrutement.yeita.fr-avant-1.10 && sudo nano /etc/nginx/sites-available/recrutement.yeita.fr
```

Ligne à ajouter : `client_max_body_size 10m;` — puis enregistrer (Ctrl+O, Entrée) et quitter (Ctrl+X).

4. **Valider puis recharger** :

```bash
sudo nginx -t && sudo systemctl reload nginx && sudo nginx -T 2>/dev/null | grep -n client_max_body_size
```

Tu dois voir : `syntax is ok`, `test is successful`, puis une ligne `client_max_body_size 10m;`.
**Sinon** (`nginx -t` en erreur) : ne pas recharger ; remettre la copie (`sudo cp -a ~/recrutement.yeita.fr-avant-1.10 /etc/nginx/sites-available/recrutement.yeita.fr`), relancer `sudo nginx -t`, et transmettre l'erreur.

5. **Prouver** que nginx laisse passer 2 Mo (sans compte, la réponse vient d'oauth2-proxy : tout code **sauf 413** convient, en général `401`) :

```bash
head -c 2097152 /dev/zero | curl -s -o /dev/null -w '%{http_code}\n' --max-time 30 -X POST -H 'Content-Type: application/pdf' --data-binary @- 'https://recrutement.yeita.fr/api/candidats/cand-x-y/fichiers?champ=cv'
```

Tu dois voir : `401` (ou un autre code que `413`).
**Sinon** `413` : le réglage n'est pas dans le bon bloc ; reprendre l'étape 3.

6. **Vérifier les autres sites** : relancer la commande de l'étape 2 avec `~/sites-apres-1.10.txt`, puis `diff ~/sites-avant-1.10.txt ~/sites-apres-1.10.txt` : rien ne doit s'afficher.

Ensuite seulement : merger. Le déploiement automatique met la 1.10 en ligne ; au premier démarrage, la base gagne la table des fichiers (rien à faire).

### Revenir avant la 1.10

Le retour automatique et « Déployer ce commit » vers la 1.9 marchent : l'API de la 1.9 relit la base. Tant que la 1.9 est en ligne : les CV et portfolios déposés en fichier n'apparaissent pas dans les fiches (ils sont gardés, ne pas les recoller en lien), l'historique montre leurs lignes comme des passages sans étape, et « Annuler le dernier passage » peut être refusé pour ces candidats. Tout revient avec la 1.10. Le réglage nginx peut rester.

### 1.7 — sauvegardes de la base

1. **Installer age** (compte `ubuntu`) :

```bash
sudo apt install -y age
```

Tu dois voir à la fin : `age` installé (ou « déjà la version la plus récente »).

2. **Créer la clé et la mettre sur le serveur** : suivre `deploy/CLE-SAUVEGARDE.md`, étapes 1 à 6 (sur ton Mac, puis sur le serveur : la page dit exactement quoi copier-coller).

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

6. **Vérifier la clé** : `deploy/CLE-SAUVEGARDE.md`, étape 7.

### 1.9 — déploiement automatique

1. **Déployer la 1.9 à la main** : section 2 (c'est encore le `deploy.sh` de la 1.8 qui tourne). Tu dois voir à la fin `Déploiement réussi : <commit> sur https://recrutement.yeita.fr`, et 8 lignes `OK` (dont `/admin/deploiement.html → 302`).
2. **Installer le déploiement automatique** (compte `ubuntu`) : la commande de `deploy/README.md`, section 15, « Mise en service », étape 2 (copier le bloc en entier). Tu dois voir 3 lignes `copiée : recrutement-deploy.…`, le timer avec son prochain passage, puis `active`.
   **Sinon** : `ARRÊT : le volume recrutement_data est dans …` → ne rien installer, transmettre le message à la personne responsable du site.
3. **Vérifier**, après 10 minutes au plus : `https://recrutement.yeita.fr/admin/deploiement.html` (compte admin) affiche en vert « À jour : le dernier commit de main est en ligne. ».
   **Sinon** : « Aucun passage enregistré » au-delà de 10 minutes → `systemctl list-timers 'recrutement-*'` doit montrer `recrutement-deploy.timer` ; `sudo journalctl -u recrutement-deploy -n 50` pour la cause.

### Revenir avant la 1.9

Avant un `deploy/deploy.sh <commit>` vers un commit antérieur à la 1.9, arrêter le déploiement automatique (compte `ubuntu`) :

```bash
sudo systemctl disable --now recrutement-deploy.timer recrutement-deploy.path
```

Au retour vers une version ≥ 1.9 : refaire l'étape 2 de la section « 1.9 », puis « Reprendre » sur la page (la pause posée par le retour reste).

### Revenir avant la 1.7

Avant un `deploy/deploy.sh <commit>` vers un commit antérieur à la 1.7, arrêter les minuteries (compte `ubuntu`) :

```bash
sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer
```
