---
type: technique
vue: humaine
page: deploiement-ovh
titre: Déployer sur OVH et tester avec Google, pas à pas
maj: 1.6
commit: 4b98c3a
sources: deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/oauth2-proxy.cfg, compose.yaml, .env.example, tools/check-site.sh, api/src/app.js, assets/wording.fr.js
date: 2026-10-27
---

# Déployer sur OVH et tester avec Google, pas à pas

> Fais une case à la fois, de haut en bas. Chaque commande se copie-colle telle quelle. Après chaque commande, une case « Tu dois voir » te dit si c'est bon. Si ce n'est pas bon, lis le **Sinon** juste en dessous et ne passe pas à la suite. Tes coches restent enregistrées dans ce navigateur : tu peux t'arrêter et reprendre plus tard.

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

## Étape 2 — Installer Docker et certbot (compte `ubuntu`)

- [ ] Connecte-toi :

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.75.252.121
```

- [ ] Vérifie qu'Ubuntu propose bien les logiciels :

```bash
apt-cache policy docker.io docker-compose-v2 certbot python3-certbot-nginx | grep -E '^[a-z]|Candidate|Candidat'
```

- [ ] **Tu dois voir** quatre noms (`docker.io:`, `docker-compose-v2:`, `certbot:`, `python3-certbot-nginx:`), chacun suivi d'une ligne `Candidate:` avec un numéro de version.

**Sinon** (une ligne dit `Candidate: (none)`) : arrête-toi ici et envoie la sortie à l'équipe technique.

- [ ] Installe-les (une à deux minutes) :

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 certbot python3-certbot-nginx tmux
```

- [ ] Vérifie que tout est installé :

```bash
sudo docker version --format 'Docker {{.Server.Version}}' && sudo docker compose version && certbot --version
```

- [ ] **Tu dois voir** trois lignes : `Docker …`, `Docker Compose version …`, `certbot …`.

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

---

## Pour plus tard (compte `deploy`, dans `/opt/recrutement`)

| Tu veux | Tape |
|---|---|
| Mettre en ligne la dernière version | `/opt/recrutement/deploy/deploy.sh` (le site est coupé ~15 secondes : pas pendant un entretien) |
| Revenir à la version d'avant | `/opt/recrutement/deploy/deploy.sh <code>` (le code est affiché en cas d'échec) |
| Voir si tout tourne | `docker compose ps` |
| Retirer l'accès à quelqu'un | `docker compose exec api node api/equipe.js disable prenom.nom@yeita.fr` |

**Ne tape jamais** `docker compose down -v` ni `docker volume prune` sur le serveur : ces commandes effacent toutes les candidatures, et il n'y en a pas d'autre copie.
