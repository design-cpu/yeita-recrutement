# Déployer l'espace Candidatures sur le serveur OVH

L'espace Candidatures est servi sur `https://recrutement.yeita.fr` par **oauth2-proxy**, dans Docker. Les pages destinées aux candidats restent publiques ; tout le reste demande un compte Google **@yeita.fr**. Les données des candidatures restent dans le navigateur de chacun.

Le serveur héberge d'autres services : rien ici ne les modifie. Les scripts vérifient tout avant d'agir et s'arrêtent au moindre doute, sans rien changer.

```
Navigateur ──HTTPS──▶ proxy du serveur (cas A) ou caddy du projet (cas B)
                      ──▶ front : oauth2-proxy, 127.0.0.1:4180 ──▶ fichiers du site
                                                  └─ sans session ──▶ connexion Google
```

| Pages publiques | Tout le reste (connexion @yeita.fr) |
|---|---|
| `/`, `/index.html` (guide), `/one-pager.html`, `/yeita-match-kit.html`, `assets/yeita.css`, `assets/yeita.js`, `assets/data-yeita-match.js`, les fichiers de `telechargements/` | `candidatures/`, les grilles `assets/data-diamants.js` et `assets/data-employabilite.js`, etc. |

La liste est dans `deploy/oauth2-proxy.cfg` (`skip_auth_routes`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `docker/front.Dockerfile` | Image `front` : construit le site (`tools/build.py`), puis oauth2-proxy le sert |
| `compose.yaml` | Services `front` et `caddy` (cas B), réseau `edge` 172.30.0.0/24, journaux limités à 3 × 10 Mo |
| `deploy/oauth2-proxy.cfg` | Réglages d'oauth2-proxy, sans secret |
| `deploy/Caddyfile` | Caddy du cas B : HTTPS automatique et en-têtes de sécurité |
| `.env.example` | Modèle du fichier `.env` (secrets, domaine, cas A ou B) |
| `deploy/prepare-serveur.sh` | Préparation, une seule fois, par l'administrateur |
| `deploy/deploy.sh` | Déploiement et retour arrière, par le compte `deploy` |
| `tools/check-site.sh` | Contrôle du site (5 adresses) |

## 1. Prérequis

Docker avec le plugin Compose, `git`, `curl`, `flock`, `ss`, `ip`, `ssh-keygen`, `useradd`, `runuser`, `getent` et `stat` (Debian ou Ubuntu les fournissent). **Les scripts n'installent rien** : s'il manque quelque chose, ils s'arrêtent et le disent.

> Le compte `deploy` est mis dans le groupe `docker`. Ce groupe donne des droits équivalents à root sur le serveur : ne donnez la clé SSH de `deploy` qu'aux personnes qui déploient.

## 2. Choisir le cas A ou B

Regarder qui écoute sur les ports 80 et 443 :

```bash
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

| Ce que montre `ss` | Cas | Suite |
|---|---|---|
| `nginx` ou `caddy` installé sur le serveur | **A** | Section 7, exemple nginx ou Caddy |
| `docker-proxy`, `traefik`, `apache2` ou autre chose | — | **Ne rien modifier.** S'arrêter et faire valider par le responsable du serveur (encadré ci-dessous) |
| Rien | **B** | Section 8 |

> **Proxy dans Docker ou logiciel inconnu.** Ne changez jamais vous-même la configuration ni le réseau d'un proxy qui sert d'autres sites. Proposez au responsable du serveur une solution réversible : relier son conteneur au réseau du projet (`docker network connect recrutement_edge <conteneur-du-proxy>`), puis lui faire transmettre `recrutement.yeita.fr` à `http://front:4180`. Pour revenir : `docker network disconnect recrutement_edge <conteneur-du-proxy>`. Le réseau n'existe qu'après le premier déploiement.

## 3. DNS

Avant tout, l'enregistrement `recrutement.yeita.fr` doit pointer vers le serveur :

```bash
dig +short recrutement.yeita.fr
```

La réponse doit être l'adresse IP du serveur. Sans DNS, aucun certificat HTTPS ne peut être obtenu.

## 4. Préparer le serveur (une fois, administrateur)

```bash
d=$(mktemp -d)        # dossier privé : un autre compte du serveur ne peut pas y glisser un script
git clone https://github.com/design-cpu/yeita-recrutement.git "$d/recrutement"
sudo "$d/recrutement/deploy/prepare-serveur.sh" "ssh-ed25519 AAAA… personne@poste"
```

Le script vérifie : les outils, le port 4180 (libre), le sous-réseau 172.30.0.0/24 (libre), l'absence de conteneurs « recrutement » venus d'ailleurs, et un utilisateur `deploy` déjà présent (s'il existe hors du groupe `docker`, le script s'arrête : c'est à vous de décider). Puis il crée l'utilisateur `deploy`, autorise la clé, clone le dépôt dans `/opt/recrutement` (propriétaire `deploy`) et crée `/var/backups/recrutement` (mode 700). Il ne touche ni au pare-feu, ni aux autres services, ni aux ports 80 et 443. On peut le relancer : il ne change rien.

## 5. Créer le client OAuth Google

Dans la console Google Cloud de Yeita :

1. Écran de consentement OAuth de type **Interne** : seuls les comptes de l'organisation yeita.fr peuvent se connecter.
2. Identifiant client OAuth de type « Application Web », URI de redirection autorisée : `https://recrutement.yeita.fr/oauth2/callback`.
3. Noter l'identifiant et le secret du client.

## 6. Créer le fichier `.env`

En tant que `deploy` :

```bash
cd /opt/recrutement
cp .env.example .env && chmod 600 .env
openssl rand -base64 32 | tr -- '+/' '-_'     # nouveau secret des cookies
nano .env
```

À changer **obligatoirement** :

| Variable | Valeur |
|---|---|
| `DOMAIN` | `recrutement.yeita.fr` |
| `OAUTH2_PROXY_REDIRECT_URL` | `https://recrutement.yeita.fr/oauth2/callback` |
| `OAUTH2_PROXY_CLIENT_ID`, `OAUTH2_PROXY_CLIENT_SECRET` | ceux du client Google |
| `OAUTH2_PROXY_COOKIE_SECRET` | la sortie de `openssl` ci-dessus |
| `COMPOSE_PROFILES` | `caddy` en cas B, **vide** en cas A |

`deploy.sh` refuse de déployer si `DOMAIN` vaut `localhost`, si l'URL de redirection ne correspond pas à `DOMAIN`, ou si le cookie secret ou l'identifiant client ont gardé leur valeur d'exemple. `.env` n'est jamais commité.

## 7. Cas A : ajouter le site au proxy existant

Le proxy du serveur garde le HTTPS et transmet `recrutement.yeita.fr` à `127.0.0.1:4180`, avec les en-têtes `Host` et `X-Forwarded-Proto`.

### Procédure prudente (à suivre dans l'ordre)

1. **Relever l'état des autres sites.** Lister les noms servis, puis noter le code HTTP de chacun :
   ```bash
   sudo nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u      # nginx
   grep -E '^[^#[:space:]].*\{' /etc/caddy/Caddyfile                    # Caddy
   for s in site1.example site2.example; do
     printf '%s %s\n' "$s" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$s/")"
   done | tee ~/sites-avant.txt
   ```
2. **Copier la configuration existante** : `sudo cp -a /etc/nginx ~/nginx-avant-recrutement` (ou `sudo cp -a /etc/caddy/Caddyfile ~/Caddyfile-avant-recrutement`).
3. **Certificat** (nginx) : avec l'outil déjà en place sur le serveur, par exemple `sudo certbot certonly --nginx -d recrutement.yeita.fr` si certbot est installé. S'il n'y en a pas, s'arrêter et demander au responsable du serveur. Caddy obtient le sien tout seul.
4. **Ajouter** la configuration ci-dessous.
5. **Valider** : `sudo nginx -t` ou `caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`. En cas d'erreur, ne pas recharger : revenir à la copie.
6. **Recharger sans redémarrer** : `sudo systemctl reload nginx` (ou `sudo nginx -s reload`), `sudo systemctl reload caddy` (ou `caddy reload --config /etc/caddy/Caddyfile`).
7. **Relever à nouveau** l'état des sites (même boucle, dans `~/sites-apres.txt`) et comparer : `diff ~/sites-avant.txt ~/sites-apres.txt`.
8. **Au premier écart**, revenir à la copie (nginx : `sudo rm /etc/nginx/sites-enabled/recrutement.yeita.fr`, ou restaurer `~/nginx-avant-recrutement`), valider, recharger, relever.

### Exemple nginx

Fichier `/etc/nginx/sites-available/recrutement.yeita.fr`, activé par `sudo ln -s ../sites-available/recrutement.yeita.fr /etc/nginx/sites-enabled/` :

<!-- exemple-nginx -->
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

    # « always » : aussi sur les réponses d'erreur. Pas d'autre add_header dans location (il annulerait ceux-ci).
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://127.0.0.1:4180;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Les cookies de session d'oauth2-proxy dépassent la taille d'en-tête par défaut de nginx.
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```
<!-- /exemple-nginx -->

### Exemple Caddy

Bloc à ajouter au Caddyfile du serveur :

<!-- exemple-caddy -->
```caddyfile
recrutement.yeita.fr {
	reverse_proxy 127.0.0.1:4180

	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "same-origin"
		X-Frame-Options "DENY"
	}
}
```
<!-- /exemple-caddy -->

Caddy transmet `Host` et `X-Forwarded-Proto` de lui-même.

## 8. Cas B : le Caddy du projet

Rien n'écoute sur 80 et 443 : mettre `COMPOSE_PROFILES=caddy` dans `.env`. Le service `caddy` publie 80, 443 et 443/udp et obtient le certificat tout seul (volumes `caddy_data` et `caddy_config`). `deploy.sh` vérifie avant chaque déploiement que 80 et 443 sont libres ou tenus par ce Caddy ; sinon il s'arrête.

Passer du cas B au cas A : vider `COMPOSE_PROFILES` dans `.env` ; au déploiement suivant, `deploy.sh` arrête et supprime le Caddy du projet.

## 9. Déployer

En tant que `deploy`, de préférence dans `tmux` ou `screen` (une coupure SSH n'interrompt pas le déploiement) :

```bash
/opt/recrutement/deploy/deploy.sh
```

Le script affiche le commit en place, `DOMAIN` et le cas, vérifie les réglages (tels que Compose les lit) et que le dépôt n'a ni modification ni fichier en trop (une copie de `.env` serait publiée), met le dépôt sur le dernier `main`, reconstruit l'image, recrée les conteneurs (la configuration est toujours rechargée), supprime les anciennes images **du projet seulement** (étiquette `fr.yeita.projet=recrutement`, jamais de nettoyage global), puis lance `tools/check-site.sh https://$DOMAIN`. En cas B, le contrôle est retenté pendant une minute, le temps que Caddy obtienne son certificat au premier déploiement.

Deux déploiements ne peuvent pas tourner en même temps (verrou). Relancer après une interruption est sans risque.

## 10. Revenir en arrière

```bash
/opt/recrutement/deploy/deploy.sh <commit>
```

Le commit doit appartenir à `main` et contenir le déploiement Docker (pas d'avant cette version). En cas d'échec, `deploy.sh` affiche la commande exacte avec le commit précédent.

Après un échec de `deploy.sh` (construction, démarrage ou contrôle), le dépôt est déjà sur le nouveau commit : lancez **tout de suite** la commande de retour affichée. Sinon, au prochain redémarrage du serveur, `front` chargerait la configuration de ce commit (`deploy/oauth2-proxy.cfg` est lu dans le dépôt).

Après un retour arrière, le dépôt reste **détaché** sur ce commit. Le prochain `deploy.sh` **sans argument** reprend le dernier `main` : ne le lancez qu'une fois `main` corrigé.

## 11. Contrôler et lire un échec

```bash
/opt/recrutement/tools/check-site.sh https://recrutement.yeita.fr
```

| Ligne en échec | Cause probable | Que faire |
|---|---|---|
| `/candidatures/` ou `data-diamants.js` → **reçu 200** | L'authentification ne protège plus : **urgent** | Revenir en arrière tout de suite (section 10), puis lire `deploy/oauth2-proxy.cfg` |
| `/one-pager.html` ou `/index.html` → reçu 302 | La liste publique est cassée | `docker compose logs --tail 50 front` ; relire `skip_auth_routes` |
| Toutes → reçu 502 | `front` est arrêté ou redémarre en boucle | `docker compose ps` ; `docker compose logs --tail 50 front` (souvent une variable de `.env`) |
| Toutes → reçu aucune réponse | Pas de réponse : DNS, certificat ou proxy | `dig +short recrutement.yeita.fr` ; cas B : `docker compose logs --tail 50 caddy` ; cas A : journal du proxy du serveur |
| Toutes → reçu 404 ou 421 | Le proxy du cas A ne transmet pas ce nom | Relire l'exemple de la section 7 (`server_name`) |
| `/candidatures/` → 302 vers une autre adresse | Mauvais fournisseur dans la configuration | `deploy/oauth2-proxy.cfg` : `provider = "google"` |

Après une connexion refusée par Google (`redirect_uri_mismatch`) : l'URI de redirection du client Google (section 5) ne correspond pas à `OAUTH2_PROXY_REDIRECT_URL`.

## 12. Journaux et état

```bash
cd /opt/recrutement
docker compose ps
docker compose logs --tail 100 front      # oauth2-proxy : requêtes et connexions (adresses e-mail)
docker compose --profile caddy logs --tail 100 caddy
git log -1 --oneline                      # version en place
```

Les journaux sont limités à 3 fichiers de 10 Mo par service. Les conteneurs redémarrent seuls après un redémarrage du serveur. Les adresses des visiteurs n'y figurent pas : oauth2-proxy ne fait pas confiance aux en-têtes `X-Forwarded-*` (`reverse_proxy = false`, voir le commentaire dans `deploy/oauth2-proxy.cfg`).

À surveiller de temps en temps : `docker system df` (place prise par Docker). Après un changement de version de Caddy dans `compose.yaml`, l'ancienne image reste : `docker image rm caddy:<ancienne version>`.

## Tester sur un poste (sans serveur)

```bash
cp .env.example .env
docker compose up -d --build
tools/check-site.sh https://localhost          # cas B
docker compose --profile caddy down
# COMPOSE_PROFILES= (vide) dans .env, puis :
docker compose up -d
tools/check-site.sh http://127.0.0.1:4180      # cas A
docker compose down
```

`.env.example` fonctionne tel quel en local (faux identifiants : la connexion Google elle-même ne peut pas aboutir). Le navigateur peut retenir l'en-tête HSTS envoyé par Caddy pour `localhost` et refuser ensuite `http://localhost` pour d'autres projets : dans Chrome, `chrome://net-internals/#hsts`, « Delete domain security policies » pour `localhost`.
