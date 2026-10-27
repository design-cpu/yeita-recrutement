---
type: technique
vue: humaine
page: deploiement-ovh
titre: Déployer sur OVH et tester avec Google, pas à pas
maj: 1.5
commit: ea25fd3
sources: deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/oauth2-proxy.cfg, compose.yaml, .env.example, tools/check-site.sh, api/src/app.js, assets/wording.fr.js
date: 2026-10-27
---

# Déployer sur OVH et tester avec Google, pas à pas

> Coche chaque case dans l'ordre (tes coches restent enregistrées dans ce navigateur). Chaque étape dit quoi taper, ce que tu dois voir, et quoi faire sinon. Compte une heure, plus l'attente du DNS.

À la fin, `https://recrutement.yeita.fr` est en ligne : les pages candidats sont publiques, l'espace Candidatures demande un compte Google @yeita.fr, et tu es le premier admin.

---

## Étape 0 — Rassembler ce qu'il faut

- [ ] J'ai un accès SSH **administrateur** (sudo) au serveur OVH.
- [ ] J'ai noté l'adresse IP du serveur : espace client OVH › **Bare Metal Cloud** › **VPS** (ou Serveurs dédiés) › ton serveur › **IPv4**. On l'appelle `IP_SERVEUR` plus bas.
- [ ] J'ai accès à la zone DNS de `yeita.fr` dans l'espace client OVH.
- [ ] J'ai un compte Google **administrateur** de yeita.fr (pour la console Google Cloud).
- [ ] J'ai le dépôt cloné sur mon poste (pour le contrôle final).

---

## Étape 1 — Ta clé SSH (sur ton poste)

- [ ] Affiche ta clé publique :

```bash
cat ~/.ssh/id_ed25519.pub
```

- [ ] **Tu dois voir** une ligne qui commence par `ssh-ed25519 AAAA…`. Copie-la en entier : c'est `TA_CLE` plus bas.

**Sinon** (« No such file »), crée-la, appuie sur Entrée à chaque question, puis relance la commande du dessus :

```bash
ssh-keygen -t ed25519 -C "prenom.nom@yeita.fr"
```

---

## Étape 2 — Le DNS chez OVH

- [ ] Espace client OVH › **Web Cloud** › **Noms de domaine** › `yeita.fr` › onglet **Zone DNS**.
- [ ] Cherche `recrutement` dans la liste. S'il existe déjà une ligne `recrutement` de type **A**, **AAAA** ou **CNAME**, supprime-la (crayon › Supprimer).
- [ ] **Ajouter une entrée** › **A** › Sous-domaine : `recrutement` › Cible : `IP_SERVEUR` › Suivant › Valider.
- [ ] Attends 5 minutes, puis sur ton poste :

```bash
dig +short recrutement.yeita.fr
```

- [ ] **Tu dois voir** `IP_SERVEUR`, seule.

**Sinon** (rien ou une autre adresse) : attends encore (jusqu'à quelques heures) et relance la commande. Tu peux faire les étapes 3 à 6 en attendant, mais **pas l'étape 6 bis ni l'étape 7**.

---

## Étape 3 — Vérifier le serveur

- [ ] Connecte-toi :

```bash
ssh TON_COMPTE_ADMIN@IP_SERVEUR
```

- [ ] Vérifie Docker :

```bash
docker version --format '{{.Server.Version}}' && docker compose version
```

- [ ] **Tu dois voir** un numéro (par exemple `29.9.2`), puis `Docker Compose version v…`.

**Sinon** : Docker n'est pas installé ou ne tourne pas. Ne l'installe pas au hasard sur un serveur partagé : demande au responsable du serveur.

- [ ] Regarde qui tient les ports web :

```bash
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

- [ ] **Note ton cas** :

| Ce que tu vois dans la colonne de droite | Ton cas |
|---|---|
| Aucune ligne sous l'en-tête | **Cas B** (le projet fait lui-même le HTTPS) |
| `nginx` | **Cas A** (on ajoute le site au nginx existant) |
| Autre chose (`docker-proxy`, `traefik`, `apache2`, `caddy`…) | **Stop** : ne touche à rien, envoie cette sortie au responsable du serveur |

---

## Étape 4 — Préparer le serveur (une seule fois)

- [ ] Toujours connecté en admin, colle ces trois lignes en remplaçant `TA_CLE` par la ligne copiée à l'étape 1 (garde les guillemets) :

```bash
d=$(mktemp -d)
git clone https://github.com/design-cpu/yeita-recrutement.git "$d/recrutement"
sudo "$d/recrutement/deploy/prepare-serveur.sh" "TA_CLE"
```

- [ ] **Tu dois voir** des lignes `· …` puis, à la fin : `Serveur prêt.`

**Sinon** : une ligne `ARRÊT : …` dit ce qui bloque, suivie de `Rien n'a été modifié.` Corrige ce qu'elle dit et relance les trois mêmes lignes (c'est sans risque).

- [ ] Déconnecte-toi : `exit`.

---

## Étape 5 — Créer le client Google (dans le navigateur)

Avec ton compte admin @yeita.fr, sur `https://console.cloud.google.com` :

- [ ] En haut, sélecteur de projet › **Nouveau projet** › nom `recrutement-yeita` › Organisation `yeita.fr` › Créer. Sélectionne-le.
- [ ] Menu ☰ › **API et services** › **Écran de consentement OAuth** (ou **Google Auth Platform**) › Commencer.
- [ ] Nom de l'application : `Yeita Recrutement` ; e-mail d'assistance : le tien.
- [ ] Audience : **Interne** (c'est ce qui réserve la connexion aux comptes yeita.fr).
- [ ] Coordonnées : ton e-mail › Accepter › Créer.
- [ ] **Clients** › **Créer un client** › Type : **Application Web** › nom : `recrutement`.
- [ ] **URI de redirection autorisés** › Ajouter : `https://recrutement.yeita.fr/oauth2/callback` (exactement, sans `/` à la fin) › Créer.
- [ ] **Tu dois voir** une fenêtre avec l'**ID client** (finit par `.apps.googleusercontent.com`) et le **Code secret du client**.
- [ ] J'ai copié les deux dans un endroit sûr (gestionnaire de mots de passe) : Google ne remontrera plus le secret.

**Sinon** (l'option **Interne** est grisée) : ton compte n'est pas dans l'organisation yeita.fr, ou le projet n'y est pas rattaché. Recrée le projet en choisissant l'organisation `yeita.fr`.

---

## Étape 6 — Le fichier de réglages `.env` (sur le serveur, compte `deploy`)

- [ ] Connecte-toi avec le compte créé à l'étape 4 :

```bash
ssh deploy@IP_SERVEUR
```

- [ ] Crée le fichier et un secret de cookies :

```bash
cd /opt/recrutement
cp .env.example .env && chmod 600 .env
echo "SECRET COOKIES : $(openssl rand -base64 32 | tr -- '+/' '-_')"
```

- [ ] Copie la valeur affichée après `SECRET COOKIES :`.
- [ ] Ouvre le fichier avec `nano .env` et remplace ces lignes (garde les autres) :

```
DOMAIN=recrutement.yeita.fr
OAUTH2_PROXY_CLIENT_ID=<ID client de l'étape 5>
OAUTH2_PROXY_CLIENT_SECRET=<code secret de l'étape 5>
OAUTH2_PROXY_REDIRECT_URL=https://recrutement.yeita.fr/oauth2/callback
OAUTH2_PROXY_COOKIE_SECRET=<secret cookies copié juste avant>
COMPOSE_PROFILES=caddy
```

- [ ] **Cas A seulement** : la dernière ligne devient `COMPOSE_PROFILES=` (rien après le `=`).
- [ ] Enregistre : `Ctrl+O`, Entrée, puis `Ctrl+X`.
- [ ] Vérifie :

```bash
grep -E '^(DOMAIN|OAUTH2_PROXY_REDIRECT_URL|COMPOSE_PROFILES)=' .env
```

- [ ] **Tu dois voir** les trois lignes avec `recrutement.yeita.fr`, l'adresse `/oauth2/callback`, et `caddy` (cas B) ou rien (cas A).

**Sinon** : `nano .env` et corrige.

---

## Étape 6 bis — Cas A seulement : brancher nginx

Saute cette étape en cas B. Connecté en **admin** (pas `deploy`) :

- [ ] Le DNS de l'étape 2 répond bien (`dig +short recrutement.yeita.fr` → `IP_SERVEUR`) : sans lui, pas de certificat.
- [ ] Sauvegarde la configuration actuelle :

```bash
sudo cp -a /etc/nginx ~/nginx-avant-recrutement
```

- [ ] Liste les autres sites servis :

```bash
sudo nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u
```

- [ ] Note leur état, en remplaçant `site1.example site2.example` par les noms affichés :

```bash
for s in site1.example site2.example; do printf '%s %s\n' "$s" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$s/")"; done | tee ~/sites-avant.txt
```

- [ ] Demande le certificat :

```bash
sudo certbot certonly --nginx -d recrutement.yeita.fr
```

**Sinon** (`certbot: command not found`) : stop, demande au responsable du serveur.

- [ ] Crée le site avec `sudo nano /etc/nginx/sites-available/recrutement.yeita.fr`, colle ceci, enregistre :

```nginx
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
```

- [ ] Active et teste :

```bash
sudo ln -s ../sites-available/recrutement.yeita.fr /etc/nginx/sites-enabled/ && sudo nginx -t
```

- [ ] **Tu dois voir** `syntax is ok` et `test is successful`. Alors recharge : `sudo systemctl reload nginx`.

**Sinon** : ne recharge pas. Retire le lien : `sudo rm /etc/nginx/sites-enabled/recrutement.yeita.fr`.

- [ ] Revérifie les autres sites (même boucle que plus haut, en remplaçant `sites-avant.txt` par `sites-apres.txt`), puis compare :

```bash
diff ~/sites-avant.txt ~/sites-apres.txt
```

- [ ] **Tu dois voir** : rien.

**Sinon** : retire le site tout de suite :

```bash
sudo rm /etc/nginx/sites-enabled/recrutement.yeita.fr && sudo nginx -t && sudo systemctl reload nginx
```

Tant que l'étape 7 n'est pas faite, `https://recrutement.yeita.fr` répond 502 : c'est normal.

---

## Étape 7 — Déployer (compte `deploy`)

- [ ] Le DNS de l'étape 2 répond bien (`dig +short recrutement.yeita.fr` → `IP_SERVEUR`).
- [ ] Connecté en `deploy`, ouvre une session qui survit à une coupure, puis déploie :

```bash
tmux new -s deploy
/opt/recrutement/deploy/deploy.sh
```

- [ ] **Tu dois voir**, après quelques minutes : `· API saine.`, six lignes `OK`, `Tout est OK sur https://recrutement.yeita.fr`, puis `Déploiement réussi : …`.

**Sinon** :

| Tu vois | Fais |
|---|---|
| `ARRÊT : …` | Rien n'a bougé. Fais ce que dit la ligne (souvent une valeur de `.env`), puis relance `deploy.sh`. |
| `ÉCHEC : …` puis `Pour revenir … : deploy/deploy.sh <commit>` | Copie et lance tout de suite cette commande de retour, puis envoie la sortie à l'équipe technique. |
| `FAIL … reçu aucune réponse` (cas B) | Ports 80/443 fermés par un pare-feu. `sudo ufw status` : si `active`, `sudo ufw allow 80,443/tcp`. Vérifie aussi le pare-feu réseau dans l'espace client OVH (IP › Firewall). Puis relance `deploy.sh`. |
| `FAIL … reçu 502` (cas A) | `docker compose ps` dans `/opt/recrutement` ; si `front` redémarre en boucle : `docker compose logs --tail 50 front`. |

- [ ] Quitte tmux sans l'arrêter : `Ctrl+B` puis `D`.

---

## Étape 8 — Contrôle de sécurité de l'API (une fois, avant d'ajouter qui que ce soit)

- [ ] Connecté en `deploy`, copie **tout** le bloc, colle-le, Entrée. Il ne modifie rien.

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

- [ ] **Tu dois voir** sept lignes `OK` puis `VERDICT : tout est bon.`

**Sinon** : fais ce que dit le verdict, et arrête-toi là.

---

## Étape 9 — Te mettre admin (compte `deploy`)

- [ ] Ajoute-toi en remplaçant l'e-mail et le prénom, puis affiche la liste :

```bash
cd /opt/recrutement && docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin
docker compose exec api node api/equipe.js list
```

- [ ] **Tu dois voir** ton e-mail, ton prénom et `admin` dans la liste.
- [ ] Ajoute chaque collègue (rôle `recruteur`, `admin` ou `lecture`) :

```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom recruteur
```

---

## Étape 10 — Tester avec Google (dans le navigateur)

**Page publique**

- [ ] Fenêtre de navigation privée › `https://recrutement.yeita.fr/`.
- [ ] **Tu dois voir** le guide, cadenas fermé, **sans** demande de connexion.

**Connexion**

- [ ] Même fenêtre › `https://recrutement.yeita.fr/candidatures/`.
- [ ] **Tu dois voir** la page de connexion Google. Choisis ton compte @yeita.fr.
- [ ] **Tu dois voir** l'espace Candidatures, avec en haut `Connecté·e : <ton prénom>`.

**Sinon** :

| Tu vois | Fais |
|---|---|
| `Erreur 400 : redirect_uri_mismatch` | Dans Google Cloud (Clients › recrutement), l'URI doit être exactement `https://recrutement.yeita.fr/oauth2/callback`. Corrige, attends 5 minutes, réessaie. |
| `Erreur 401 : invalid_client` | L'ID ou le secret dans `.env` est faux : corrige-le (étape 6), puis relance `/opt/recrutement/deploy/deploy.sh`. |
| `Tu ne fais pas partie de l'équipe.` | Refais l'étape 9 avec **exactement** l'e-mail du compte choisi. |

**Identité vue par l'API**

- [ ] Même fenêtre › `https://recrutement.yeita.fr/api/moi`.
- [ ] **Tu dois voir** `{"email":"…@yeita.fr","prenom":"…","role":"admin"}`.

**Sinon** (erreur 401 alors que tu es connecté) : sur le serveur, `cd /opt/recrutement && docker compose stop api`, et préviens l'équipe technique.

**Compte extérieur refusé**

- [ ] Nouvelle fenêtre privée › `https://recrutement.yeita.fr/candidatures/` › connecte-toi avec un compte **@gmail.com**.
- [ ] **Tu dois voir** un refus de Google (« Accès bloqué » / application réservée à l'organisation).

**Sinon** (tu entres) : l'audience n'est pas **Interne** ; corrige-la dans Google Cloud (étape 5).

**Enregistrement partagé**

- [ ] Connecté, crée un dossier de test dans Candidatures.
- [ ] Ouvre le site sur un autre appareil (ou demande à un collègue ajouté à l'étape 9).
- [ ] **Tu dois voir** le même dossier. Supprime-le ensuite.

**Contrôle depuis ton poste**

- [ ] À la racine du dépôt cloné sur ton poste :

```bash
tools/check-site.sh https://recrutement.yeita.fr
```

- [ ] **Tu dois voir** six `OK` et `Tout est OK sur https://recrutement.yeita.fr`.

**Sinon** : une ligne `FAIL /candidatures/ … reçu 200` ou `FAIL /api/moi … reçu 200` veut dire que des données sont lisibles sans connexion. Sur le serveur, `cd /opt/recrutement && docker compose stop api`, et préviens l'équipe technique immédiatement.

C'est en ligne. 🎉

---

## Aide-mémoire (compte `deploy`, dans `/opt/recrutement`)

| Besoin | Commande |
|---|---|
| Mettre en ligne la dernière version de `main` | `/opt/recrutement/deploy/deploy.sh` (coupe l'API ~15 s : pas pendant un entretien) |
| Revenir à une version précédente | `/opt/recrutement/deploy/deploy.sh <commit>` |
| Voir l'état | `docker compose ps` |
| Lire les journaux | `docker compose logs --tail 100 front` ou `api` |
| Retirer l'accès à quelqu'un | `docker compose exec api node api/equipe.js disable prenom.nom@yeita.fr` |

**À ne jamais taper sur le serveur** : `docker compose down -v` et `docker volume prune`. Elles effacent la base des candidatures, qui n'a pas d'autre copie.
