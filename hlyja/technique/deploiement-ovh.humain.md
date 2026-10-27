---
type: technique
vue: humaine
page: deploiement-ovh
titre: Déployer sur OVH et tester avec Google, pas à pas
maj: 1.7
commit: 26c1d9f
sources: deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/oauth2-proxy.cfg, compose.yaml, .env.example, tools/check-site.sh, api/src/app.js, assets/wording.fr.js, deploy/README.md, deploy/backup.sh, deploy/verif-disque.sh, deploy/healthchecks.sh, deploy/systemd/recrutement-backup.service, deploy/systemd/recrutement-backup.timer, deploy/systemd/recrutement-verif-disque.service, deploy/systemd/recrutement-verif-disque.timer, deploy/RESTAURER.md
date: 2026-10-27
---

# Déployer sur OVH et tester avec Google, pas à pas

> Fais une case à la fois, de haut en bas. Chaque commande se copie-colle telle quelle (sauf quand la case te demande d'y remplacer un nom ou une adresse). Après chaque commande, une case « Tu dois voir » te dit si c'est bon. Si ce n'est pas bon, lis le **Sinon** juste en dessous et ne passe pas à la suite. Tes coches restent enregistrées dans ce navigateur : tu peux t'arrêter et reprendre plus tard.

Ce guide est écrit pour **ton** serveur OVH :

| | |
|---|---|
| Adresse du serveur | `51.75.252.121` |
| Système | Ubuntu 26.04 |
| Ce qui tourne déjà | nginx (sites web) et pm2 (`yeita-agents`, `mamie-discord`) : on n'y touche pas |
| Adresse finale du site | `https://recrutement.yeita.fr` |

Tu vas utiliser **deux comptes** sur le serveur. Chaque étape dit lequel.

| Compte | Pour quoi | Commande pour se connecter (depuis ton Mac) |
|---|---|---|
| `ubuntu` | installer, régler nginx | `ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121` |
| `deploy` | le site lui-même (créé à l'étape 3) | `ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121` |

Pour quitter le serveur et revenir sur ton Mac : tape `exit`.

---

## Étape 1 — Le DNS (dans le navigateur, espace client OVH)

- [ ] Ouvre l'espace client OVH › **Web Cloud** › **Noms de domaine** › `yeita.fr` › onglet **Zone DNS**.
- [ ] Dans la recherche du tableau, tape `recrutement`.
- [ ] S'il y a déjà une ou plusieurs lignes `recrutement`, supprime-les (bouton `…` › Supprimer l'entrée).
- [ ] Clique **Ajouter une entrée** › **A**.
- [ ] Sous-domaine : `recrutement`. Cible : `51.75.252.121`. Clique **Suivant**, puis **Valider**.
- [ ] Attends 5 minutes, puis, dans le Terminal de ton Mac :

```bash
dig +short recrutement.yeita.fr
```

- [ ] **Tu dois voir** `51.75.252.121`, et rien d'autre.

**Sinon** (rien ne s'affiche) : c'est normal au début. Continue les étapes 2 à 5, et refais cette commande au début de l'étape 6.

---

## Étape 2 — Installer Docker, certbot et les outils de sauvegarde (compte `ubuntu`)

`age` (chiffrement) et `rclone` (envoi chez OVH) servent aux sauvegardes de l'étape 11. Le script de l'étape 3 refuse de continuer s'ils manquent : on les installe donc dès maintenant.

- [ ] Connecte-toi :

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121
```

- [ ] Vérifie qu'Ubuntu propose bien les logiciels :

```bash
apt-cache policy docker.io docker-compose-v2 certbot python3-certbot-nginx age rclone | grep -E '^[a-z]|Candidate|Candidat'
```

- [ ] **Tu dois voir** six noms (`docker.io:`, `docker-compose-v2:`, `certbot:`, `python3-certbot-nginx:`, `age:`, `rclone:`), chacun suivi d'une ligne `Candidate:` avec un numéro de version.

**Sinon** (une ligne dit `Candidate: (none)`) : arrête-toi ici et envoie la sortie à l'équipe technique.

- [ ] Installe-les (une à deux minutes) :

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 certbot python3-certbot-nginx tmux age rclone
```

- [ ] **Tu dois voir** l'installation défiler, puis le retour à l'invite `ubuntu@vps-b800c3bb:~$`. Certains logiciels (comme certbot) sont peut-être déjà installés : `est déjà la version la plus récente` (ou `is already the newest version`) est normal.

**Sinon** (`Could not get lock` ou `Impossible d'obtenir le verrou`) : Ubuntu fait ses mises à jour automatiques en arrière-plan. Attends 3 minutes et relance la même commande. Ne supprime jamais de fichier de verrou.

- [ ] Vérifie que tout est installé :

```bash
sudo docker version --format 'Docker {{.Server.Version}}' && sudo docker compose version && certbot --version && age --version && rclone version | head -n 1
```

- [ ] **Tu dois voir** cinq lignes : `Docker …`, `Docker Compose version …`, `certbot …`, un numéro de version d'age (par exemple `1.2.1` ou `v1.2.1`), puis `rclone v…`.

**Sinon** : arrête-toi ici et envoie la sortie à l'équipe technique.

- [ ] Vérifie que tes autres services tournent toujours :

```bash
pm2 list && systemctl is-active nginx
```

- [ ] **Tu dois voir** `yeita-agents` et `mamie-discord` en `online`, puis le mot `active`.

**Sinon** : `pm2 resurrect` relance tes apps, `sudo systemctl start nginx` relance nginx.

- [ ] Quitte le serveur :

```bash
exit
```

---

## Étape 3 — Préparer le serveur (compte `ubuntu`, une seule fois)

Ce script crée le compte `deploy`, lui donne accès avec ta clé SSH, et télécharge le projet dans `/opt/recrutement`. Il ne touche ni à nginx, ni à pm2, ni au pare-feu.

- [ ] Sur ton Mac, copie ta clé SSH (rien ne s'affiche, c'est normal) :

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

- [ ] Connecte-toi en `ubuntu` :

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121
```

- [ ] Copie-colle cette ligne, puis `Entrée` :

```bash
read -r -p "Colle ta clé puis Entrée : " CLE
```

- [ ] Le serveur affiche `Colle ta clé puis Entrée :`. Fais `Cmd+V`, puis `Entrée`.
- [ ] Copie-colle ces trois lignes d'un coup :

```bash
d=$(mktemp -d)
git clone https://github.com/design-cpu/yeita-recrutement.git "$d/recrutement"
sudo "$d/recrutement/deploy/prepare-serveur.sh" "$CLE"
```

- [ ] **Tu dois voir** plusieurs lignes qui commencent par `·`, et à la fin : `Serveur prêt.`

**Sinon** :
- `ARRÊT : la clé SSH donnée n'est pas une clé publique valide.` : refais les trois cases précédentes (la ligne `read`, `Cmd+V`, les trois lignes).
- une autre ligne `ARRÊT : …`, suivie de `Rien n'a été modifié.` : envoie ces lignes à l'équipe technique. Une fois le problème réglé, tu peux relancer sans risque.

- [ ] Quitte le serveur :

```bash
exit
```

- [ ] Depuis ton Mac, vérifie que le compte `deploy` te laisse entrer :

```bash
ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121 whoami
```

- [ ] **Tu dois voir** `deploy`.

**Sinon** (`Permission denied`) : la clé collée n'était pas la bonne. Refais l'étape 3 depuis le début.

---

## Étape 4 — Vérifier le client Google (dans le navigateur)

Tu as déjà l'**ID client** et le **Code secret du client**. Il reste deux réglages à vérifier.

- [ ] Ouvre `https://console.cloud.google.com` › menu ☰ › **API et services** › **Identifiants** (ou **Google Auth Platform** › **Clients**) › clique sur ton client.
- [ ] Dans **URI de redirection autorisés**, il doit y avoir exactement : `https://recrutement.yeita.fr/oauth2/callback`
- [ ] S'il n'y est pas : **Ajouter un URI**, colle-le, puis **Enregistrer**.
- [ ] Menu ☰ › **API et services** › **Écran de consentement OAuth** (ou **Google Auth Platform** › **Audience**) : le type d'utilisateur doit être **Interne**.

**Sinon** (il est « Externe ») : passe-le en **Interne** sur cette même page. C'est ce qui empêche les comptes Gmail d'entrer.

---

## Étape 5 — Les réglages du site (compte `deploy`)

- [ ] Connecte-toi en `deploy` :

```bash
ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121
```

- [ ] Crée le fichier de réglages (copie-colle tout le bloc d'un coup) :

```bash
cd /opt/recrutement
touch .env && chmod 600 .env
cat > .env <<EOF
DOMAIN=recrutement.yeita.fr
OAUTH2_PROXY_CLIENT_ID=A_REMPLACER
OAUTH2_PROXY_CLIENT_SECRET=A_REMPLACER
OAUTH2_PROXY_REDIRECT_URL=https://recrutement.yeita.fr/oauth2/callback
OAUTH2_PROXY_COOKIE_SECRET=$(openssl rand -base64 32 | tr -- '+/' '-_')
COMPOSE_PROFILES=
EOF
```

- [ ] Ouvre le fichier :

```bash
nano .env
```

- [ ] Sur la ligne `OAUTH2_PROXY_CLIENT_ID=`, efface `A_REMPLACER` et colle ton **ID client** Google.
- [ ] Sur la ligne `OAUTH2_PROXY_CLIENT_SECRET=`, efface `A_REMPLACER` et colle ton **Code secret du client**.
- [ ] Ne touche pas aux autres lignes. Enregistre et ferme : `Ctrl+O`, puis `Entrée`, puis `Ctrl+X`.
- [ ] Vérifie :

```bash
grep -q A_REMPLACER .env && echo "PROBLÈME : il reste A_REMPLACER dans .env" || echo "OK : .env rempli"
```

- [ ] **Tu dois voir** `OK : .env rempli`.

**Sinon** : refais `nano .env` et remplace ce qui reste.

- [ ] Quitte le serveur :

```bash
exit
```

---

## Étape 6 — Brancher le site dans nginx (compte `ubuntu`)

Le DNS doit être prêt, sinon le certificat HTTPS sera refusé.

- [ ] Sur ton Mac :

```bash
dig +short recrutement.yeita.fr
```

- [ ] **Tu dois voir** `51.75.252.121`.

**Sinon** : attends et réessaie plus tard. Ne fais pas la suite tant que ce n'est pas bon.

- [ ] Connecte-toi en `ubuntu` :

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121
```

- [ ] Fais une copie de secours de nginx :

```bash
sudo cp -a /etc/nginx ~/nginx-avant-recrutement
```

- [ ] Note l'état de tes autres sites, pour comparer à la fin :

```bash
for s in $(sudo nginx -T 2>/dev/null | awk '$1=="server_name"{for(i=2;i<=NF;i++){gsub(";","",$i); print $i}}' | grep -v -e '^_$' -e '\*' -e '^recrutement\.yeita\.fr$' | sort -u); do printf '%s %s\n' "$s" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$s/")"; done | tee ~/sites-avant.txt
```

- [ ] **Tu dois voir** une ligne par site, avec un nombre à côté (par exemple `200` ou `301`). C'est noté, rien d'autre à faire.
- [ ] Demande le certificat HTTPS :

```bash
sudo certbot certonly --nginx -d recrutement.yeita.fr
```

- [ ] Si certbot pose des questions : donne ton e-mail, tape `Y` pour accepter les conditions, puis `N` pour la lettre d'information.
- [ ] **Tu dois voir** `Successfully received certificate.`

**Sinon** : refais la première case de cette étape (DNS), puis réessaie. Si ça échoue encore, envoie la sortie à l'équipe technique.

- [ ] Crée le fichier du site (copie-colle tout le bloc d'un coup) :

```bash
sudo tee /etc/nginx/sites-available/recrutement.yeita.fr > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name recrutement.yeita.fr;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name recrutement.yeita.fr;

    ssl_certificate     /etc/letsencrypt/live/recrutement.yeita.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recrutement.yeita.fr/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://127.0.0.1:4180;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF
```

- [ ] Active-le et fais vérifier la configuration par nginx :

```bash
sudo ln -s ../sites-available/recrutement.yeita.fr /etc/nginx/sites-enabled/ && sudo nginx -t
```

- [ ] **Tu dois voir** `syntax is ok` et `test is successful`.

**Sinon** : ne va pas plus loin. Retire le site (tes autres sites n'ont pas encore été touchés) et envoie la sortie à l'équipe technique :

```bash
sudo rm /etc/nginx/sites-enabled/recrutement.yeita.fr
```

- [ ] Applique la configuration (sans couper les autres sites) :

```bash
sudo systemctl reload nginx
```

- [ ] Vérifie que tes autres sites n'ont pas bougé :

```bash
for s in $(sudo nginx -T 2>/dev/null | awk '$1=="server_name"{for(i=2;i<=NF;i++){gsub(";","",$i); print $i}}' | grep -v -e '^_$' -e '\*' -e '^recrutement\.yeita\.fr$' | sort -u); do printf '%s %s\n' "$s" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$s/")"; done > ~/sites-apres.txt; diff ~/sites-avant.txt ~/sites-apres.txt && echo "OK : les autres sites n'ont pas changé"
```

- [ ] **Tu dois voir** `OK : les autres sites n'ont pas changé`.

**Sinon** (des lignes avec `<` et `>`) : retire le site tout de suite, puis envoie la sortie à l'équipe technique :

```bash
sudo rm /etc/nginx/sites-enabled/recrutement.yeita.fr && sudo nginx -t && sudo systemctl reload nginx
```

- [ ] Quitte le serveur :

```bash
exit
```

À ce moment, `https://recrutement.yeita.fr` affiche une erreur `502` : c'est normal, le site n'est pas encore lancé.

---

## Étape 7 — Lancer le site (compte `deploy`)

- [ ] Connecte-toi en `deploy` :

```bash
ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121
```

- [ ] Ouvre une session protégée (si ta connexion coupe, le lancement continue) :

```bash
tmux new -s deploy
```

- [ ] Lance le site (la première fois, compte 3 à 5 minutes) :

```bash
/opt/recrutement/deploy/deploy.sh
```

- [ ] **Tu dois voir**, à la fin : `· API saine.`, six lignes qui commencent par `OK`, `Tout est OK sur https://recrutement.yeita.fr`, puis `Déploiement réussi : …`.

**Sinon** :
- une ligne `ARRÊT : …` : rien n'a bougé ; fais ce qu'elle dit (souvent une ligne de `.env`, étape 5), puis relance `/opt/recrutement/deploy/deploy.sh`.
- une ligne `ÉCHEC : …` suivie de `Pour revenir … : deploy/deploy.sh <code>` : copie-colle cette commande de retour tout de suite, puis envoie toute la sortie à l'équipe technique.

- [ ] Sors de la session protégée sans l'arrêter : appuie sur `Ctrl+B`, lâche, puis appuie sur `D`.

---

## Étape 8 — Contrôle de sécurité (compte `deploy`, obligatoire)

Ce contrôle vérifie qu'aucun autre programme du serveur ne peut lire les candidatures. Il ne modifie rien.

- [ ] Toujours connecté en `deploy`, copie-colle **tout** le bloc d'un coup, puis `Entrée` :

```bash
cd /opt/recrutement && (
pb=0
ok() { echo "  OK        $*"; }
ko() { echo "  PROBLÈME  $*"; pb=1; }
echo "Contrôle réseau de l'API :"
etat=$(docker inspect -f '{{.State.Health.Status}}' recrutement-api-1 2>/dev/null)
if [ "$etat" = healthy ]; then ok "l'API tourne et va bien"; else ko "l'API ne va pas bien (état : ${etat:-introuvable}) : docker compose logs --tail 50 api"; fi
reseau=$(docker network inspect recrutement_back --format '{{.Internal}} {{.EnableIPv6}} {{index .Options "com.docker.network.bridge.inhibit_ipv4"}}' 2>/dev/null)
if [ "$reseau" = "true false true" ]; then ok "le réseau de l'API est fermé (interne, sans IPv6, sans adresse sur le serveur)"; else ko "le réseau de l'API n'est pas réglé comme prévu (lu : ${reseau:-introuvable})"; fi
ip4=$(docker inspect -f '{{(index .NetworkSettings.Networks "recrutement_back").IPAddress}}' recrutement-api-1 2>/dev/null)
ip6=$(docker inspect -f '{{json (index .NetworkSettings.Networks "recrutement_back").GlobalIPv6Address}}' recrutement-api-1 2>/dev/null)
if [ "$ip6" = '""' ]; then ok "l'API n'a pas d'adresse IPv6"; else ko "l'API a une adresse IPv6 : $ip6"; fi
temoin=$(docker run --rm --network recrutement_back curlimages/curl:8.11.1 -s -m 5 -o /dev/null -w '%{http_code}' http://api:8000/api/sante 2>/dev/null)
if [ "$temoin" = 200 ]; then ok "témoin : un conteneur placé exprès sur le réseau de l'API la joint (l'essai sait voir une API joignable)"; else ko "témoin : même un conteneur du réseau de l'API ne la joint pas (réponse : ${temoin:-aucune}) ; les essais suivants ne prouvent rien"; fi
essai() {
  if [ "$2" = 200 ]; then ko "$1 JOINT l'API : n'importe quel programme de ce serveur pourrait se faire passer pour un membre de l'équipe"; else ok "$1 ne joint pas l'API"; fi
}
essai "le serveur, par l'adresse de l'API ($ip4)" "$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://$ip4:8000/api/sante" 2>/dev/null)"
essai "le serveur, par 127.0.0.1:8000" "$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/sante 2>/dev/null)"
essai "un conteneur en réseau hôte" "$(docker run --rm --network host curlimages/curl:8.11.1 -s -m 5 -o /dev/null -w '%{http_code}' "http://$ip4:8000/api/sante" 2>/dev/null)"
echo
if [ "$pb" = 0 ]; then
  echo "VERDICT : tout est bon. Tu peux ajouter le premier admin."
else
  echo "VERDICT : NE PAS CONTINUER. Arrête l'API (docker compose stop api), n'ajoute personne à l'équipe,"
  echo "          et envoie tout ce qui est affiché ci-dessus à l'équipe technique."
fi
)
```

- [ ] **Tu dois voir** sept lignes `OK`, puis `VERDICT : tout est bon.`

**Sinon** : fais exactement ce que dit le verdict, et arrête-toi là.

---

## Étape 9 — Te donner l'accès (compte `deploy`)

- [ ] Ajoute-toi comme admin, en remplaçant l'e-mail et le prénom par les tiens :

```bash
cd /opt/recrutement && docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin
```

- [ ] Affiche l'équipe :

```bash
docker compose exec api node api/equipe.js list
```

- [ ] **Tu dois voir** ton e-mail, ton prénom et `admin`.
- [ ] Pour chaque collègue, même commande avec `recruteur` (peut modifier) ou `lecture` (peut seulement lire) à la place de `admin` :

```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom recruteur
```

- [ ] Quitte le serveur :

```bash
exit
```

---

## Étape 10 — Tester avec Google (dans le navigateur)

- [ ] Ouvre une **fenêtre de navigation privée** et va sur `https://recrutement.yeita.fr/`
- [ ] **Tu dois voir** le guide Yeita, avec le cadenas, **sans** qu'on te demande de te connecter.
- [ ] Dans la même fenêtre, va sur `https://recrutement.yeita.fr/candidatures/`
- [ ] **Tu dois voir** la page de connexion Google. Choisis ton compte @yeita.fr.
- [ ] **Tu dois voir** l'espace Candidatures, avec en haut `Connecté·e : <ton prénom>`.

**Sinon** :
- `Erreur 400 : redirect_uri_mismatch` : refais l'étape 4 (adresse de retour), attends 5 minutes, réessaie.
- `Erreur 401 : invalid_client` : l'ID ou le secret est mal recopié. Refais l'étape 5 à partir de `nano .env`, puis, toujours en `deploy`, relance `/opt/recrutement/deploy/deploy.sh`.
- `Tu ne fais pas partie de l'équipe.` : refais l'étape 9 avec **exactement** l'e-mail du compte Google choisi.

- [ ] Dans la même fenêtre, va sur `https://recrutement.yeita.fr/api/moi`
- [ ] **Tu dois voir** une ligne comme `{"email":"prenom.nom@yeita.fr","prenom":"Prénom","role":"admin"}`.
- [ ] Ouvre une **nouvelle** fenêtre privée, va sur `https://recrutement.yeita.fr/candidatures/` et essaie de te connecter avec un compte **@gmail.com**.
- [ ] **Tu dois voir** un refus de Google (accès bloqué, application réservée à l'organisation).

**Sinon** (tu entres) : l'écran de consentement n'est pas **Interne** : refais la dernière case de l'étape 4.

- [ ] Connecté avec ton compte @yeita.fr, crée un dossier de test dans Candidatures.
- [ ] Ouvre le site sur ton téléphone (ou demande à un collègue ajouté à l'étape 9).
- [ ] **Tu dois voir** le même dossier. Supprime-le ensuite.
- [ ] Dernier contrôle, dans le Terminal de ton Mac :

```bash
cd ~/Documents/Yeita/Projects/Github/yeita-recrutement && tools/check-site.sh https://recrutement.yeita.fr
```

- [ ] **Tu dois voir** six lignes `OK`, puis `Tout est OK sur https://recrutement.yeita.fr`.

**Sinon** : si une ligne dit `FAIL /candidatures/ … reçu 200` ou `FAIL /api/moi … reçu 200`, des candidatures sont visibles sans connexion. Connecte-toi en `deploy`, tape `cd /opt/recrutement && docker compose stop api`, et préviens l'équipe technique tout de suite.

C'est en ligne. 🎉

> **Avant d'enregistrer de vraies candidatures, fais l'étape 11.** Tant qu'elle n'est pas faite, la base n'existe qu'à un seul endroit : le serveur.

---

## Étape 11 — Les sauvegardes de chaque nuit (Mac, OVH, healthchecks.io, serveur)

Chaque nuit vers 3 h, le serveur copiera la base, la chiffrera et l'enverra chez OVH. Un email te préviendra si ça rate ou si le disque se remplit. Cette étape se fait une seule fois, dans l'ordre. Compte une heure.

Il te faut :
- l'accès au **coffre de mots de passe** de Yeita (tu vas y ranger une clé et des identifiants) ;
- un compte sur **healthchecks.io** (gratuit) ;
- ton espace client **OVH**.

### 11.1 — La clé des sauvegardes (sur ton Mac)

Cette clé ouvre les sauvegardes. Elle ne va **jamais** sur le serveur. **Si elle est perdue, toutes les sauvegardes sont illisibles.**

- [ ] Dans le Terminal de ton Mac, installe les outils (quelques minutes) :

```bash
brew install age rclone sqlite awscli
```

- [ ] **Tu dois voir** le retour à l'invite, sans ligne `Error:`.

**Sinon** (`brew: command not found`) : Homebrew n'est pas installé sur ton Mac. Demande à l'équipe technique.

- [ ] Crée la clé :

```bash
(umask 077; age-keygen -o ~/recrutement-sauvegarde.key)
```

- [ ] **Tu dois voir** une ligne `Public key: age1…`.
- [ ] Copie la **clé privée** (rien ne s'affiche, c'est normal) :

```bash
grep '^AGE-SECRET-KEY-' ~/recrutement-sauvegarde.key | pbcopy
```

- [ ] Dans le coffre, crée une fiche « Recrutement — clé des sauvegardes » et colle (`Cmd+V`) la clé privée dans le champ mot de passe. Elle commence par `AGE-SECRET-KEY-`.
- [ ] Affiche la **clé publique**, et colle-la aussi dans la fiche (champ notes) :

```bash
age-keygen -y ~/recrutement-sauvegarde.key
```

- [ ] **Tu dois voir** une seule ligne qui commence par `age1`. Garde-la sous la main : elle sert à l'étape 11.5.
- [ ] Partage la fiche du coffre avec au moins une autre personne de Yeita.
- [ ] Efface la clé de ton Mac et vide le presse-papiers :

```bash
rm ~/recrutement-sauvegarde.key && pbcopy </dev/null && echo "OK : clé effacée du Mac"
```

- [ ] **Tu dois voir** `OK : clé effacée du Mac`.

### 11.2 — Le stockage chez OVH (navigateur, puis Mac)

Trois comptes de stockage (« utilisateurs S3 ») se partagent les rôles :

| Utilisateur | Sert à | Où vont ses identifiants |
|---|---|---|
| administrateur | créer et régler le stockage | le coffre ; jamais sur le serveur |
| serveur | déposer les copies, sans pouvoir les effacer | le serveur (étape 11.4) ; aussi le coffre |
| restauration | relire les copies | le coffre, dans la fiche de la clé |

- [ ] Ouvre l'espace client OVH › **Public Cloud** › **Object Storage**.
- [ ] Crée les trois utilisateurs S3 : `administrateur`, `serveur`, `restauration`. Pour chacun, range dans le coffre sa **clé d'accès** et son **secret** (le secret ne s'affiche souvent qu'une fois).
- [ ] Avec l'utilisateur **administrateur**, crée un conteneur (« bucket ») :
  - région **GRA** (Gravelines, Union européenne) ;
  - **sans** versionnement ;
  - un nom à toi, par exemple `yeita-recrutement-sauvegardes`. Note-le dans le coffre : il revient dans toutes les commandes qui suivent.

**Sinon** (le nom est déjà pris) : choisis-en un autre, et utilise-le partout à la place.

- [ ] Sur ton Mac, prépare les deux règles d'accès. Remplace d'abord `yeita-recrutement-sauvegardes` par ton nom de bucket sur la première ligne, puis copie-colle tout le bloc :

```bash
B=yeita-recrutement-sauvegardes
cat > ~/politique-serveur.json <<EOF
{"Statement": [
  {"Sid": "DeposerEtLire", "Effect": "Allow",
   "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation", "s3:ListBucketMultipartUploads", "s3:ListMultipartUploadParts", "s3:AbortMultipartUpload"],
   "Resource": ["arn:aws:s3:::$B", "arn:aws:s3:::$B/*"]},
  {"Sid": "JamaisEffacer", "Effect": "Deny",
   "Action": ["s3:DeleteObject", "s3:DeleteBucket", "s3:PutLifecycleConfiguration", "s3:PutBucketPolicy", "s3:PutBucketVersioning"],
   "Resource": ["arn:aws:s3:::$B", "arn:aws:s3:::$B/*"]}
]}
EOF
cat > ~/politique-restauration.json <<EOF
{"Statement": [
  {"Sid": "Lire", "Effect": "Allow",
   "Action": ["s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation", "s3:ListBucketMultipartUploads"],
   "Resource": ["arn:aws:s3:::$B", "arn:aws:s3:::$B/*"]},
  {"Sid": "JamaisEffacer", "Effect": "Deny",
   "Action": ["s3:DeleteObject", "s3:DeleteBucket", "s3:PutLifecycleConfiguration", "s3:PutBucketPolicy", "s3:PutBucketVersioning"],
   "Resource": ["arn:aws:s3:::$B", "arn:aws:s3:::$B/*"]}
]}
EOF
ls ~/politique-*.json
```

- [ ] **Tu dois voir** deux fichiers : `politique-restauration.json` et `politique-serveur.json`.
- [ ] Dans OVH, onglet des **utilisateurs S3** : sur l'utilisateur `serveur`, **Importer une politique** › choisis `politique-serveur.json` (dans ton dossier personnel). Sur l'utilisateur `restauration`, importe `politique-restauration.json`. Ne pose aucune politique sur `administrateur`.

**Sinon** (tu ne trouves pas « Importer une politique ») : arrête-toi ici et demande à l'équipe technique. Sans ces règles, le serveur pourrait effacer les sauvegardes.

- [ ] Règle l'effacement automatique à 30 jours, avec l'utilisateur **administrateur**. Remplace le nom du bucket sur la première ligne, copie-colle le bloc, puis colle la clé d'accès et le secret de l'administrateur quand on te les demande (le secret ne s'affiche pas) :

```bash
B=yeita-recrutement-sauvegardes
printf "Clé d'accès S3 (administrateur) : "; read -r AWS_ACCESS_KEY_ID; printf "Secret S3 (administrateur) : "; read -r -s AWS_SECRET_ACCESS_KEY; echo
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION=gra
cat > ~/lifecycle.json <<'EOF'
{"Rules": [{"ID": "expiration-30-jours", "Status": "Enabled", "Filter": {"Prefix": ""}, "Expiration": {"Days": 30}}]}
EOF
aws s3api put-bucket-lifecycle-configuration --bucket "$B" --lifecycle-configuration file://$HOME/lifecycle.json --endpoint-url https://s3.gra.io.cloud.ovh.net
aws s3api get-bucket-lifecycle-configuration --bucket "$B" --endpoint-url https://s3.gra.io.cloud.ovh.net | grep -q '"Days": 30' && echo "OK : effacement automatique à 30 jours" || echo "PROBLÈME : la règle des 30 jours n'est pas en place"
aws s3api get-bucket-versioning --bucket "$B" --endpoint-url https://s3.gra.io.cloud.ovh.net | grep -q Enabled && echo "PROBLÈME : le versionnement est actif" || echo "OK : pas de versionnement"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; rm -f ~/lifecycle.json ~/politique-serveur.json ~/politique-restauration.json
```

- [ ] **Tu dois voir** `OK : effacement automatique à 30 jours`, puis `OK : pas de versionnement`.

**Sinon** :
- `PROBLÈME : le versionnement est actif` : désactive-le dans OVH (page du bucket), puis relance le bloc.
- une erreur `AccessDenied` ou `InvalidAccessKeyId` : la clé ou le secret de l'administrateur est mal recopié. Relance le bloc.
- une autre erreur : envoie la sortie à l'équipe technique.

### 11.3 — Les alertes (navigateur, healthchecks.io)

- [ ] Sur `https://healthchecks.io`, crée deux contrôles **distincts** :

| Nom | Période (Period) | Délai de grâce (Grace) |
|---|---|---|
| `recrutement-sauvegarde` | 1 jour | 2 heures |
| `recrutement-disque` | 1 heure | 30 minutes |

- [ ] Pour les deux, la notification par email va à l'équipe.
- [ ] Copie l'**adresse de ping** de chacun (elle ressemble à `https://hc-ping.com/…`) dans le coffre. Ce sont des secrets : nulle part ailleurs.

### 11.4 — Le compte de stockage du serveur (compte `deploy`)

- [ ] Connecte-toi en `deploy` :

```bash
ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121
```

- [ ] Remplace le nom du bucket sur la deuxième ligne, copie-colle **tout** le bloc (parenthèses comprises), puis colle la clé d'accès et le secret de l'utilisateur **serveur** (le secret ne s'affiche pas) :

```bash
(
B=yeita-recrutement-sauvegardes
umask 077; mkdir -p ~/.config/rclone
[ ! -e ~/.config/rclone/rclone.conf ] || { echo "rclone.conf existe déjà : ajouter le remote ovh avec « rclone config »."; exit 1; }
read -r -p "Clé d'accès S3 (serveur) : " K; read -r -s -p "Secret S3 : " S; echo
cat > ~/.config/rclone/rclone.conf <<EOF
[ovh]
type = s3
provider = Other
endpoint = https://s3.gra.io.cloud.ovh.net
region = gra
access_key_id = $K
secret_access_key = $S
acl = private
no_check_bucket = true
EOF
rclone lsd "ovh:$B" && echo "Remote ovh prêt."
)
```

- [ ] **Tu dois voir** `Remote ovh prêt.`

**Sinon** :
- `rclone.conf existe déjà` : arrête-toi et demande à l'équipe technique (un réglage existe déjà, on ne l'écrase pas).
- une erreur `AccessDenied`, `403` ou `SignatureDoesNotMatch` : la clé ou le secret est mal recopié. Efface le fichier avec `rm ~/.config/rclone/rclone.conf`, puis refais cette case.

### 11.5 — Les réglages des sauvegardes (compte `deploy`)

- [ ] Toujours en `deploy`, ajoute les quatre lignes de réglage (copie-colle tout le bloc) :

```bash
cd /opt/recrutement
if grep -q '^AGE_RECIPIENT=' .env; then echo "Les lignes sont déjà dans .env : passe à la case suivante."; else cat >> .env <<'EOF'

AGE_RECIPIENT=A_REMPLACER
RCLONE_DEST=ovh:A_REMPLACER/recrutement
HEALTHCHECK_SAUVEGARDE_URL=A_REMPLACER
HEALTHCHECK_DISQUE_URL=A_REMPLACER
EOF
echo "OK : quatre lignes ajoutées"; fi
```

- [ ] Ouvre le fichier :

```bash
nano .env
```

- [ ] Descends jusqu'aux quatre nouvelles lignes, et remplace chaque `A_REMPLACER` :
  - `AGE_RECIPIENT=` : la **clé publique** `age1…` de l'étape 11.1 (pas la clé privée) ;
  - `RCLONE_DEST=ovh:` … `/recrutement` : ton **nom de bucket**, par exemple `RCLONE_DEST=ovh:yeita-recrutement-sauvegardes/recrutement` ;
  - `HEALTHCHECK_SAUVEGARDE_URL=` : l'adresse de ping du contrôle `recrutement-sauvegarde` ;
  - `HEALTHCHECK_DISQUE_URL=` : l'adresse de ping du contrôle `recrutement-disque`.
- [ ] Ne touche pas aux autres lignes. Enregistre et ferme : `Ctrl+O`, puis `Entrée`, puis `Ctrl+X`.
- [ ] Vérifie :

```bash
grep -q A_REMPLACER .env && echo "PROBLÈME : il reste A_REMPLACER dans .env" || echo "OK : .env rempli"
```

- [ ] **Tu dois voir** `OK : .env rempli`.

**Sinon** : refais `nano .env` et remplace ce qui reste.

- [ ] Quitte le serveur :

```bash
exit
```

### 11.6 — Les réveils de la nuit et de chaque heure (compte `ubuntu`)

- [ ] Connecte-toi en `ubuntu` :

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121
```

- [ ] Installe et active les deux timers (copie-colle tout le bloc) :

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

- [ ] **Tu dois voir** quatre lignes `copiée : …` (ou `identique : …`), puis un tableau avec `recrutement-backup.timer` (prochain passage vers 3 h) et `recrutement-verif-disque.timer` (prochain passage à l'heure pleine).

**Sinon** (une ligne `DIFFÉRENTE : …`) : rien n'a été écrasé. Arrête-toi et envoie la sortie à l'équipe technique.

- [ ] Quitte le serveur :

```bash
exit
```

### 11.7 — Premier essai (compte `deploy`)

- [ ] Connecte-toi en `deploy` :

```bash
ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121
```

- [ ] Lance une sauvegarde à la main (moins d'une minute) :

```bash
cd /opt/recrutement && deploy/backup.sh
```

- [ ] **Tu dois voir**, à la fin : `Sauvegarde réussie : recrutement-….db.age (… octets), envoyée.`
- [ ] Attends une minute (healthchecks.io ignore les signaux trop rapprochés), puis lance le contrôle du disque :

```bash
deploy/verif-disque.sh
```

- [ ] **Tu dois voir** une ligne `Disque racine : … % ; dossier Docker : … % ; seuil : 80 %.`
- [ ] Vérifie que la copie est arrivée chez OVH :

```bash
rclone lsl "$(docker compose config --environment | sed -n 's/^RCLONE_DEST=//p')"
```

- [ ] **Tu dois voir** au moins une ligne qui finit par `.db.age`.
- [ ] Sur `https://healthchecks.io`, **tu dois voir** les deux contrôles au vert.

**Sinon**, d'après le message affiché :

| Message | Que faire |
|---|---|
| `ARRÊT : … est vide`, `… valeur d'exemple`, `… https://`, `… identiques`, `… clé publique age` | une ligne de `.env` est fausse : refais l'étape 11.5 à partir de `nano .env`, puis relance |
| `ÉCHEC (api non saine)` | l'API ne va pas bien : tape `docker compose logs --tail 50 api` et envoie la sortie à l'équipe technique |
| `ÉCHEC (envoi (rclone))` | le compte de stockage du serveur est refusé : refais l'étape 11.4 |
| `Signalement … impossible` ou `refusé` | vérifie les deux adresses de ping dans `nano .env`, attends une minute, relance |
| `une sauvegarde est déjà en cours` | attends deux minutes et relance |
| autre chose | envoie la sortie à l'équipe technique |

- [ ] Quitte le serveur :

```bash
exit
```

### 11.8 — Vérifier qu'une sauvegarde s'ouvre (sur ton Mac)

Le but : prouver que la clé du coffre ouvre bien la copie arrivée chez OVH. Tout se passe dans un dossier temporaire, effacé à la fin.

- [ ] Dans un **nouveau** Terminal sur ton Mac, crée le dossier temporaire :

```bash
umask 077; d=$(mktemp -d); cd "$d"; echo "$d"
```

- [ ] **Tu dois voir** un chemin qui commence par `/var/folders/`.
- [ ] Dans le coffre, copie la clé privée (`AGE-SECRET-KEY-…`), puis vérifie qu'elle correspond à celle du serveur :

```bash
pbpaste > "$d/cle.txt"; pbcopy </dev/null
[ "$(age-keygen -y "$d/cle.txt")" = "$(ssh -i ~/.ssh/id_ed25519 deploy@51.75.252.121 "sed -n 's/^AGE_RECIPIENT=//p' /opt/recrutement/.env")" ] && echo "OK : la clé du coffre correspond au serveur" || echo "PROBLÈME : la clé du coffre ne correspond pas à AGE_RECIPIENT"
```

- [ ] **Tu dois voir** `OK : la clé du coffre correspond au serveur`.

**Sinon** : arrête-toi. Les sauvegardes seraient illisibles avec cette clé. Envoie le message à l'équipe technique (jamais la clé elle-même).

- [ ] Donne les identifiants de l'utilisateur **restauration** (copie-colle, puis colle la clé d'accès et le secret ; rien n'est écrit sur le disque) :

```bash
printf "Clé d'accès S3 (restauration) : "; read -r RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID; printf "Secret S3 : "; read -r -s RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY; echo
export RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY RCLONE_CONFIG_RESTAU_TYPE=s3 RCLONE_CONFIG_RESTAU_PROVIDER=Other RCLONE_CONFIG_RESTAU_ENDPOINT=https://s3.gra.io.cloud.ovh.net RCLONE_CONFIG_RESTAU_REGION=gra
```

- [ ] Récupère la dernière copie, déchiffre-la et contrôle-la. Remplace le nom du bucket sur la première ligne, puis copie-colle tout le bloc :

```bash
B=yeita-recrutement-sauvegardes
f=$(rclone lsf "restau:$B/recrutement" | grep '\.db\.age$' | sort | tail -n 1); echo "Copie : $f"
rclone copy "restau:$B/recrutement/$f" "$d/"
age -d -i "$d/cle.txt" -o "$d/copie.db" "$d/$f"
[ "$(sqlite3 -readonly "$d/copie.db" 'PRAGMA integrity_check;')" = ok ] && echo "OK : la sauvegarde s'ouvre et elle est intacte" || echo "PROBLÈME : la sauvegarde ne s'ouvre pas"
```

- [ ] **Tu dois voir** `Copie : recrutement-….db.age`, puis `OK : la sauvegarde s'ouvre et elle est intacte`.

**Sinon** : envoie les messages affichés à l'équipe technique (jamais la clé ni la copie).

- [ ] Efface tout du Mac (copie, clé, identifiants) :

```bash
cd / && rm -rf "$d"; pbcopy </dev/null; unset RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY; echo "OK : poste nettoyé"
```

- [ ] **Tu dois voir** `OK : poste nettoyé`. Ferme ce Terminal.

Les sauvegardes sont en place. 🎉 À refaire (11.8 seulement) après tout changement de clé.

---

## Pour plus tard (compte `deploy`, dans `/opt/recrutement`)

| Tu veux | Tape |
|---|---|
| Mettre en ligne la dernière version | `/opt/recrutement/deploy/deploy.sh` (le site est coupé ~15 secondes : pas pendant un entretien ; pendant une sauvegarde, il s'arrête sur « un déploiement est déjà en cours » : relance-le quelques minutes après) |
| Revenir à la version d'avant | `/opt/recrutement/deploy/deploy.sh <code>` (le code est affiché en cas d'échec) |
| Voir si tout tourne | `docker compose ps` |
| Retirer l'accès à quelqu'un | `docker compose exec api node api/equipe.js disable prenom.nom@yeita.fr` |
| Faire une sauvegarde tout de suite | `deploy/backup.sh` |
| Voir les prochaines sauvegardes | `systemctl list-timers 'recrutement-*'` |
| Voir les copies gardées sur le serveur | `ls -l /var/backups/recrutement` (seulement des fichiers `.db.age`) |
| Restaurer la base | ne le fais pas seul : la procédure est dans `deploy/RESTAURER.md`, à suivre avec l'équipe technique |

**Ne tape jamais** `docker compose down -v` ni `docker volume prune` sur le serveur : ces commandes effacent toutes les candidatures. Les sauvegardes de la nuit permettent de les remettre, mais tout ce qui a été saisi depuis la dernière serait perdu.
