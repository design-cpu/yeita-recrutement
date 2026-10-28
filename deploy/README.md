# Déployer l'espace Candidatures sur le serveur OVH

L'espace Candidatures est servi sur `https://recrutement.yeita.fr` par **oauth2-proxy**, dans Docker. Les pages destinées aux candidats restent publiques ; tout le reste demande un compte Google **@yeita.fr**. Les données des candidatures restent dans le navigateur de chacun.

Le serveur héberge d'autres services : rien ici ne les modifie. Les scripts vérifient tout avant d'agir et s'arrêtent au moindre doute, sans rien changer.

```
Navigateur ──HTTPS──▶ proxy du serveur (cas A) ou caddy du projet (cas B)
                      ──▶ front : oauth2-proxy, 127.0.0.1:4180 ──▶ fichiers du site
                                                  ├─ /api/ ──▶ api (réseau back, interne)
                                                  └─ sans session ──▶ connexion Google
```

Les candidatures sont enregistrées par l'**API** (`api/`, service `api`), dans une base SQLite du volume `recrutement_data`. Seul `front` la joint, par le réseau interne `back` : aucun port n'est publié, et le réseau n'a aucune adresse côté serveur. L'API croit l'en-tête `X-Forwarded-Email` posé par oauth2-proxy : **quiconque la joindrait autrement pourrait se faire passer pour n'importe quel membre**.

| Pages publiques | Tout le reste (connexion @yeita.fr) |
|---|---|
| `/`, `/index.html` (guide), `/one-pager.html`, `/yeita-match-kit.html`, `assets/yeita.css`, `assets/yeita.js`, `assets/data-yeita-match.js`, les fichiers de `telechargements/` | `candidatures/`, les grilles `assets/data-diamants.js` et `assets/data-employabilite.js`, etc. |

La liste est dans `deploy/oauth2-proxy.cfg` (`skip_auth_routes`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `docker/front.Dockerfile` | Image `front` : construit le site (`tools/build.py`), puis oauth2-proxy le sert |
| `docker/api.Dockerfile` | Image `api` : l'API de stockage, Node 22 figé par digest, utilisateur `node`, sonde de santé |
| `compose.yaml` | Services `front`, `api` et `caddy` (cas B), réseaux `edge` 172.30.0.0/24 et `back` (interne), volume `recrutement_data`, journaux limités à 3 × 10 Mo |
| `deploy/oauth2-proxy.cfg` | Réglages d'oauth2-proxy, sans secret |
| `deploy/Caddyfile` | Caddy du cas B : HTTPS automatique et en-têtes de sécurité |
| `.env.example` | Modèle du fichier `.env` (secrets, domaine, cas A ou B) |
| `deploy/prepare-serveur.sh` | Préparation, une seule fois, par l'administrateur |
| `deploy/deploy.sh` | Déploiement et retour arrière, par le compte `deploy` |
| `tools/check-site.sh` | Contrôle du site (7 adresses, dont `/admin/sauvegardes.html` → Google et `/api/moi` → 401 sans session) |
| `deploy/backup.sh`, `deploy/commun.sh` | Sauvegarde chiffrée de la base chaque nuit, gardée 30 jours sur le serveur (section 14) |
| `deploy/verif-disque.sh` | Occupation des disques, seuil 80 % (section 14) |
| `admin/sauvegardes.html` | Page d'état des sauvegardes, réservée aux admins (section 14) |
| `deploy/systemd/` | Unités `recrutement-backup` et `recrutement-verif-disque` (service et timer) |
| `deploy/RESTAURER.md` | Restaurer la base, ou ouvrir une copie sur un poste |
| `deploy/CLE-SAUVEGARDE.md` | Créer, garder et partager la clé des sauvegardes |
| `deploy/METTRE-A-JOUR.md` | Mettre à jour le site en production, pas à pas |

## 1. Prérequis

Docker avec le plugin Compose, `git`, `curl`, `flock`, `ss`, `ip`, `ssh-keygen`, `useradd`, `runuser`, `getent` et `stat` (Debian ou Ubuntu les fournissent), plus `age` pour les sauvegardes (`sudo apt install age` ; paquet Ubuntu 26.04 : age 1.2.1). **Les scripts n'installent rien** : s'il manque quelque chose, ils s'arrêtent et le disent.

Relevez la version du moteur Docker du serveur (`docker version --format '{{.Server.Version}}'`) et notez-la ici : "29.9.2". La coupure réseau de l'API (`inhibit_ipv4`, `enable_ipv6: false` sur `back`) a été vérifiée avec le moteur **29.9.2** (v1.3). Sur un moteur plus ancien, refaire le contrôle réseau de la section 9b **avant** toute donnée réelle.

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

`deploy.sh` refuse de déployer si `DOMAIN` vaut `localhost`, si l'URL de redirection ne correspond pas à `DOMAIN`, ou si le cookie secret, l'identifiant ou le secret du client ont gardé leur valeur d'exemple. `.env` n'est jamais commité.

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

Quand le commit déployé contient l'API, le script attend aussi qu'elle soit saine (« API saine. », 60 s au plus), sinon il s'arrête en échec avec la commande de retour. Chaque déploiement recrée les conteneurs : **l'API est coupée une quinzaine de secondes**, les pages ouvertes affichent alors « La base ne répond pas » et ce qui est saisi pendant ce temps n'est pas enregistré. Déployez en dehors des entretiens.

Deux déploiements ne peuvent pas tourner en même temps (verrou). Relancer après une interruption est sans risque.

## 9b. Mettre l'API en service (une fois)

Le **premier** déploiement qui apporte l'API est lancé par le `deploy.sh` de la version en place, qui ne connaît pas l'API (le script est lu en entier avant de changer de commit) : il n'attend pas qu'elle soit saine. Après ce premier déploiement, dans `/opt/recrutement` :

1. **État** : `docker compose ps api` doit montrer `healthy`. Sinon : `docker compose logs --tail 50 api` (la cause est sur une ligne), puis relancer `deploy/deploy.sh`.
2. **Contrôle réseau, avant d'ajouter qui que ce soit.** L'API croit l'identité que lui transmet oauth2-proxy : il faut vérifier qu'aucun autre programme du serveur ne peut lui parler. Copiez tout le bloc ci-dessous dans le terminal du serveur (connecté en `deploy`) et appuyez sur Entrée. Il ne modifie rien ; il affiche une ligne `OK` ou `PROBLÈME` par vérification, puis un **verdict** qui dit quoi faire.
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
   Résultat attendu : sept lignes `OK`, puis « VERDICT : tout est bon ». La ligne « témoin » vérifie que l'essai lui-même fonctionne : un conteneur placé exprès sur le réseau de l'API doit la joindre, sinon les autres `OK` ne prouvent rien. Dès qu'une ligne dit `PROBLÈME`, le verdict dit de ne pas continuer : arrêtez l'API (`docker compose stop api`), n'ajoutez personne et envoyez ce qui est affiché à l'équipe technique ; le retour à la version précédente se fait ensuite (section 10). (Tant que l'équipe est vide, personne ne peut lire de dossier, même en cas de problème : c'est pour cela que ce contrôle se fait avant le premier admin.) Essayé sur un moteur Linux jetable en v1.3 : tout `OK` sur la pile normale ; quatre `PROBLÈME` quand la protection du réseau est retirée exprès.
3. **Premier admin** (section 13) : `docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin`.
4. **Vérifier l'identité Google** : connecté avec ce compte, ouvrez `https://recrutement.yeita.fr/api/moi` : la page doit afficher votre email et votre prénom. Un 401 ici veut dire que l'email du compte n'arrive pas à l'API : `docker compose stop api` et signalez-le.
5. **Données des navigateurs** : les dossiers saisis dans les navigateurs avant cette version (données fictives) ne sont pas repris. Une fois l'API en service, chacun efface les données du site dans son navigateur (Chrome : cadenas › Paramètres du site › Supprimer les données), après avoir ressaisi à la main ce qu'il veut garder.

## 10. Revenir en arrière

```bash
/opt/recrutement/deploy/deploy.sh <commit>
```

Le commit doit appartenir à `main` et contenir le déploiement Docker (pas d'avant cette version). En cas d'échec, `deploy.sh` affiche la commande exacte avec le commit précédent.

Après un échec de `deploy.sh` (construction, démarrage ou contrôle), le dépôt est déjà sur le nouveau commit : lancez **tout de suite** la commande de retour affichée. Sinon, au prochain redémarrage du serveur, `front` chargerait la configuration de ce commit (`deploy/oauth2-proxy.cfg` est lu dans le dépôt).

Avant de revenir à un commit **antérieur aux sauvegardes (v1.7)**, arrêtez leurs timers (les scripts n'y existent pas) : `sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer` ; les réactiver au retour (section 14).

Revenez **de préférence à un commit qui contient déjà l'API** : la base reste servie. Un retour vers une version sans API retire le conteneur `api` (le volume `recrutement_data` et ses données restent) et **remet les pages dans le navigateur** : ce qui est saisi pendant ce temps reste sur chaque poste et ne sera pas repris au retour de l'API. Prévenez l'équipe de ne rien saisir tant que l'API n'est pas revenue.

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
| `/api/moi` → reçu 302 | `api_routes` absent : oauth2-proxy redirige au lieu de refuser | `deploy/oauth2-proxy.cfg` : `api_routes = ["^/api/"]` |
| `/api/moi` → reçu 200 | **L'API répond sans session : urgent** | `docker compose stop api`, revenir en arrière, relire `deploy/oauth2-proxy.cfg` et `compose.yaml` |

Le contrôle `/api/moi` → 401 vient d'oauth2-proxy : il ne dit pas que l'API est saine. Pour elle : `docker compose ps api` (`healthy`), et dans un navigateur connecté, une page de `candidatures/` qui affiche « Connecté·e : <prénom> ».

Après une connexion refusée par Google (`redirect_uri_mismatch`) : l'URI de redirection du client Google (section 5) ne correspond pas à `OAUTH2_PROXY_REDIRECT_URL`.

## 12. Journaux et état

```bash
cd /opt/recrutement
docker compose ps
docker compose logs --tail 100 front      # oauth2-proxy : requêtes et connexions (adresses e-mail)
docker compose logs --tail 100 api        # API : méthode, adresse (identifiant du dossier), statut ; une ligne par contrôle de santé (30 s)
docker compose --profile caddy logs --tail 100 caddy
git log -1 --oneline                      # version en place
```

Les journaux sont limités à 3 fichiers de 10 Mo par service : après la suppression d'un dossier, son identifiant (jamais son nom ni son contenu) reste dans les journaux d'oauth2-proxy et de l'API jusqu'à leur rotation. Les conteneurs redémarrent seuls après un redémarrage du serveur. Les adresses des visiteurs n'y figurent pas : oauth2-proxy ne fait pas confiance aux en-têtes `X-Forwarded-*` (`reverse_proxy = false`, voir le commentaire dans `deploy/oauth2-proxy.cfg`).

À surveiller de temps en temps : `docker system df` (place prise par Docker). Après un changement de version de Caddy dans `compose.yaml`, l'ancienne image reste : `docker image rm caddy:<ancienne version>`.

## 13. Gérer l'équipe

L'accès aux candidatures est réservé aux membres actifs de la table `equipe` de l'API (la connexion Google @yeita.fr ne suffit pas). Depuis `/opt/recrutement`, en tant que `deploy` :

```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom [recruteur|admin|lecture]   # ajoute ou réactive
docker compose exec api node api/equipe.js list                                                        # tous les membres, désactivés compris
docker compose exec api node api/equipe.js disable prenom.nom@yeita.fr                                 # retire l'accès
docker compose exec api node api/equipe.js role prenom.nom@yeita.fr lecture                            # change le rôle
```

`disable` coupe l'accès aux données **dès la requête suivante** : la session Google de la personne reste ouverte, mais ne lui montre plus que les pages, sans aucun dossier (« Tu ne fais pas partie de l'équipe. »). Le rôle `lecture` peut tout voir et ne peut rien modifier.

La base est dans le volume `recrutement_data` (`docker volume inspect recrutement_data`) : elle est copiée chaque nuit, chiffrée, hors du serveur (section 14). **Ne lancez jamais `docker compose down -v` ni `docker volume prune`** sur ce serveur : ces commandes effacent la base.

## 14. Sauvegardes

Chaque nuit entre 3 h et 3 h 15, `recrutement-backup.timer` lance `deploy/backup.sh` en tant que `deploy` : copie contrôlée de la base dans le conteneur (`node api/sauvegarde.js`), récupérée dans `/var/backups/recrutement`, chiffrée avec age pour la clé publique `AGE_RECIPIENT`, copie en clair supprimée, copies chiffrées gardées 30 jours. Chaque heure, `recrutement-verif-disque.timer` lance `deploy/verif-disque.sh` : occupation de `/` et du disque de Docker (seuil 80 %). Serveur éteint à l'heure prévue : la tâche part au démarrage suivant.

- **Les copies restent sur ce serveur.** Une panne ou une perte du serveur emporte aussi les sauvegardes (choix assumé).
- **Aucune alerte n'est envoyée.** Le résultat de chaque passage est écrit dans l'état des sauvegardes (`/data/etat` du volume de l'api) et se lit sur la page **`https://recrutement.yeita.fr/admin/sauvegardes.html`**, réservée aux membres au rôle `admin` (section 13 : `docker compose exec api node api/equipe.js role <email> admin`). Verdict vert, ou rouge avec la raison en clair.
- Créer et garder la clé : `deploy/CLE-SAUVEGARDE.md`. Restaurer, ou ouvrir une copie : `deploy/RESTAURER.md`. Mettre à jour le site : `deploy/METTRE-A-JOUR.md`.

Durée de vie d'un dossier supprimé dans les copies : au plus 3 jours dans le volume (`/data/sauvegardes`) et 31 jours dans les copies chiffrées du serveur ; plus longtemps tant que les sauvegardes échouent (les anciennes copies ne sont effacées qu'après une sauvegarde réussie).

### Mise en service (une fois, dans l'ordre)

1. **Clé** : la créer sur un Mac et mettre sa clé publique dans `.env` (`AGE_RECIPIENT=age1…`) : `deploy/CLE-SAUVEGARDE.md`.
2. **age sur le serveur** (administrateur) : `sudo apt install age`.
3. **Unités systemd** (administrateur, compte avec `sudo`). Une unité absente est copiée, une unité identique laissée ; une unité **différente n'est jamais écrasée** : la différence s'affiche et rien d'autre n'est fait.

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

Attendu : 4 lignes « copiée » (ou « identique »), puis les deux timers avec leur prochain passage.

4. **Premiers essais, en tant que `deploy`** :

```bash
cd /opt/recrutement && deploy/backup.sh       # attendu : « Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; 1 copies sur le serveur. »
deploy/verif-disque.sh                         # attendu : « Disque racine : … % ; dossier Docker : … % ; seuil : 80 %. »
```

Puis ouvrir la page d'état (connecté avec un compte admin) : verdict vert. Enfin, depuis le Mac, déchiffrer la copie qui vient d'être faite (`deploy/CLE-SAUVEGARDE.md`, « Vérifier la clé ») : c'est la seule preuve que la clé gardée est la bonne.

**Mettre à jour une unité** (quand la commande de l'étape 3 affiche « DIFFÉRENTE », après un déploiement qui l'a changée) : relire la différence affichée, puis `sudo install -m 644 deploy/systemd/<unité> /etc/systemd/system/<unité> && sudo systemctl daemon-reload`.

**Maintenance de Docker** : `docker.socket` démarre Docker au premier appel d'une commande `docker`. Avant d'arrêter Docker pour une maintenance, arrêter aussi les timers (`sudo systemctl stop recrutement-backup.timer recrutement-verif-disque.timer`), puis les relancer après (`sudo systemctl start recrutement-backup.timer recrutement-verif-disque.timer`).

**Retirer les sauvegardes** (obligatoire avant un retour vers un commit antérieur à la 1.7, section 10) : `sudo systemctl disable --now recrutement-backup.timer recrutement-verif-disque.timer`. Retrait complet : `sudo rm /etc/systemd/system/recrutement-backup.service /etc/systemd/system/recrutement-backup.timer /etc/systemd/system/recrutement-verif-disque.service /etc/systemd/system/recrutement-verif-disque.timer && sudo systemctl daemon-reload`. Les copies déjà faites restent dans `/var/backups/recrutement`.

### Au quotidien

| Besoin | Commande |
|---|---|
| État en un coup d'œil | `https://recrutement.yeita.fr/admin/sauvegardes.html` (compte admin) |
| Prochains passages | `systemctl list-timers 'recrutement-*'` |
| Dernière sauvegarde (administrateur) | `sudo journalctl -u recrutement-backup -n 50` (`deploy` ne lit pas le journal système : il relance `deploy/backup.sh` à la main pour voir la sortie) |
| Sauvegarde à la demande | `sudo systemctl start recrutement-backup`, ou `deploy/backup.sh` en tant que `deploy` |
| Copies sur le serveur | `ls -l /var/backups/recrutement` (seulement des `.db.age`) |

Pendant une sauvegarde, `deploy/deploy.sh` s'arrête sur « un déploiement est déjà en cours » : le relancer quelques minutes après. À l'inverse, une sauvegarde attend jusqu'à 10 minutes la fin d'un déploiement.

| Message de `backup.sh` (ou motif rouge de la page) | Cause | Que faire |
|---|---|---|
| `AGE_RECIPIENT … vide`, `… valeur d'exemple`, `… clé publique age` (étape « réglages ») | Clé absente ou fausse dans `.env` | `deploy/CLE-SAUVEGARDE.md` |
| `« age » est absent` | age pas installé | `sudo apt install age` |
| `ÉCHEC (api non saine)` | L'api ne répond pas | `docker compose ps api`, `docker compose logs --tail 50 api` |
| `ÉCHEC (copie dans le conteneur api)` | Base occupée ou abîmée, disque plein | `docker compose logs --tail 50 api` ; relancer ; disque : `df -h` |
| `ÉCHEC (récupération …)`, `ÉCHEC (chiffrement (age))` | Disque plein | `df -h /var/backups` |
| `… existe déjà : rien n'est écrasé` | Deux sauvegardes dans la même seconde | Relancer |
| `une sauvegarde est déjà en cours` | Autre exécution en cours | Attendre |
| `… l'état des sauvegardes n'a pas pu être écrit` | Docker ou `.env` illisible par Compose | `docker compose config --environment >/dev/null` ; `docker compose ps` |
| Page : « date de plus de 26 heures » | La sauvegarde ne tourne plus | `systemctl list-timers 'recrutement-*'` ; `sudo journalctl -u recrutement-backup -n 50` |
| Page : « Un disque dépasse 80 % » | Disque presque plein | `df -h`, `docker system df` ; faire de la place |

## Tester sur un poste (sans serveur)

```bash
cp .env.example .env
docker compose up -d --build
tools/check-site.sh https://localhost          # cas B
docker compose --profile caddy down
# COMPOSE_PROFILES= (vide) dans .env, puis :
docker compose up -d
tools/check-site.sh http://127.0.0.1:4180      # cas A
docker compose down                            # jamais -v : le volume recrutement_data garde la base
```

`.env.example` fonctionne tel quel en local (faux identifiants : la connexion Google elle-même ne peut pas aboutir). Le navigateur peut retenir l'en-tête HSTS envoyé par Caddy pour `localhost` et refuser ensuite `http://localhost` pour d'autres projets : dans Chrome, `chrome://net-internals/#hsts`, « Delete domain security policies » pour `localhost`.
