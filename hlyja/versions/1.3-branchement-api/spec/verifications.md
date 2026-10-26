---
type: verifications
version: 1.3
total: 40
ecarts: 8
date: 2026-10-26
---

# Vérifications — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> 29 vérifications sur `main` (`0186993`) et sur un banc Docker jetable (Docker Desktop 29.9.2, projet Compose `banc13`, copie du dépôt dans le scratchpad), avec un fournisseur OIDC de test (Dex v2.41.1) à la place de Google.
> Les essais d'attaque tiennent : port de l'API non publié, caddy sans accès à l'api, en-tête forgé écrasé par l'email de la session.
> 7 écarts : repli silencieux en production (V9, V10), messages absents de `MODELE.md` (V3), image de moins de 14 jours (V13), seconde note « site GitHub » et lien mort (V25), dossier `/data` en 755 (V14), **hôte Linux qui joint l'API par son adresse sur le réseau interne** (V30, après le tour 1, S1), nom du volume préfixé par le projet (V36). Les quatre premiers ont été tranchés par l'utilisateur avant la spec (cadrage).
> Après le tour 1 : V30 à V37 ; après le tour 2 : V38, V39 (**IPv6 sur `back` : l'hôte joint l'API** si IPv6 y est actif, écart) ; après le tour 3 : V40.

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | Inventaire des pages : points d'entrée, écoutes `storage`, localStorage hors `dossier.js`/`qui.js` | `grep -n "QUI\.\|DOSSIER\.\|localStorage\|YEITA.store\|addEventListener(\"storage\"" candidatures/* assets/store.js` | tableau du cadrage : 6 pages lisent à la fin de leur script ; 5 écoutes `storage` ; 10 clés locales hors dossiers | R1 à R4, R12 ; une seule écoute (`yeita-match-resultat`) reste |
| V2 | L'ancien adaptateur est lisible | `git show a86b6f4:assets/adapter-supabase.js` | 56 lignes : `versions[id]` gardée à la lecture, `DOSSIER.upgrade` dans `fromRow`, `forget(id)`, 4 messages (`conflit`, `existe`, `acces`, `reseau`) | Forme reprise (R5 à R8) ; message réseau repris (R9) |
| V3 | Messages de `MODELE.md` | `grep -n -i "message\|réseau\|accès" docs/backend/MODELE.md` | **Écart** : seul le message de conflit (l. 18) | Décision de l'utilisateur : accès = texte de l'API, réseau = ancien adaptateur, les trois ajoutés à `MODELE.md` (R9, R40) |
| V4 | Contrat HTTP et textes d'erreur de l'API | `api/README.md` § Contrat HTTP | 401 `Identité absente ou invalide.` ; 403 `hors-equipe`, `lecture-seule` ; 404 `introuvable` ou sans `code` ; 409 `conflit` ; 413, 415, 503 ; enveloppe `{id, version, data}` | R5 à R10 |
| V5 | oauth2-proxy avec l'upstream `http://api:8000/api/` et `api_routes = ["^/api/"]`, sans session | banc, `curl -k https://localhost<chemin>` | `/api/moi`, `/api/sante`, `/api/candidats` → **401** ; `/candidatures/` → 302 Google ; `/one-pager.html` → 200 | Réglages du pitch tenus ; `check-site.sh` (R33) ; `/api/sante` n'est pas publique au travers du proxy (healthcheck dans le conteneur, R27) |
| V6 | Formes d'adresse divergentes, sans session (règle 2 de la 1.2) | banc, `curl --path-as-is` | `/%61pi/moi` → 302 Google ; `/API/moi` → 302 ; `/api` → 302 ; `//api/moi` et `/api/../api/moi` → 301 vers `/api/moi` | Aucune forme n'atteint l'API sans session ; les formes non reconnues comme route d'API reçoivent une redirection, que `fetch` suit (R10) |
| V7 | **Essai d'attaque**, avec une session OIDC (Dex, `alice@yeita.fr`) : en-têtes d'identité forgés | banc, Playwright dans le réseau `edge`, `ctx.request.get` avec `X-Forwarded-Email: lea@yeita.fr`, puis `X-Forwarded-User` et `X-Auth-Request-Email` | `/api/moi` → 200 **`alice@yeita.fr`** dans les trois cas : l'email de la session écrase l'en-tête forgé | La confiance de l'API tient au travers d'oauth2-proxy ; H1 (Google pose bien l'email) reste manuel |
| V8 | Témoins de V7 : autres comptes | même banc : `hors@yeita.fr` (hors équipe), `lea@yeita.fr` (lecture) | hors équipe → 403 `hors-equipe` (JSON) ; Léa → 200 `{prenom: "Léa", role: "lecture"}`, `DELETE` → 403 `lecture-seule` ; Alice `PUT` → 201 | R7, R9, R14 |
| V9 | Session expirée sur une route d'API | même banc, cookies effacés puis `GET /api/moi` | **401**, `Content-Type: application/json`, corps `{}` (sans `erreur`) | **Écart** avec « sinon mode navigateur » : une page restaurée après expiration passerait en mode navigateur. Décision de l'utilisateur (R2) ; l'adaptateur ne se fie pas au corps du 401 (R8) |
| V10 | API arrêtée | `docker compose stop api`, `GET /api/moi` avec session | **502**, `text/html` | **Écart** : à la lettre du pitch, repli silencieux dans le navigateur en production. Décision de l'utilisateur : message réseau, aucune donnée (R2, R9) |
| V11 | **Essai d'attaque** : qui joint l'API ? avec témoins | `curl http://127.0.0.1:8000` depuis l'hôte ; `wget http://api:8000` et par adresse IP depuis caddy ; `curlimages/curl` sur `banc13_back` puis sur `banc13_edge` seul ; `fetch('https://example.com')` depuis l'api | hôte : refusé (code 7) ; caddy : `api` inconnu (NXDOMAIN), par IP : délai dépassé ; conteneur sur `back` : `{"ok":true}` (**témoin**) ; conteneur sur `edge` seul : échec ; api : pas de sortie (`EAI_AGAIN`) | R22 à R24 ; le réseau `internal: true` coupe aussi la sortie de l'API |
| V12 | En-tête forgé sans session | `curl -H 'X-Forwarded-Email: alice@yeita.fr'` via caddy et via `127.0.0.1:4180` | 401 dans les deux cas ; journal de l'api : 0 requête hors `/api/sante` | R24 |
| V13 | Image `node:22-slim` | `docker pull`, `docker inspect` ; Docker Hub `tags?name=22.` ; `nodejs.org/dist/index.json` | `node:22-slim` = `22.23.4-slim`, digest `sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d`, construite le 2026-10-21 ; Node 22.23.4 publiée le 2026-10-20 (**sécurité**), 22.23.3 le 2026-09-23 | **Écart** (moins de 14 jours). Décision de l'utilisateur : `node:22.23.4-slim@sha256:de170b…` (R25) |
| V14 | Dockerfile d'essai : installation, binaires, droits | `npm ci --omit=dev` (`.npmrc` `ignore-scripts=true`), `USER node`, `mkdir /data && chown node`, volume nommé | construit ; `better-sqlite3` se charge (healthy, `equipe.js` écrit) ; uid 1000 `node` ; volume initialisé avec le propriétaire de `/data` de l'image ; base en 600 ; **`/data` en 755** | R25, R26 (`/data` en 700) |
| V15 | Mode local impossible dans le conteneur | `docker run -e DEV_EMAIL=… recrutement-api` ; `-e DEV_STATIC=/app` ; `-e NODE_ENV= -e DEV_EMAIL=…` | code 1 « DEV_EMAIL refusé : interdit quand NODE_ENV vaut production. » ; idem `DEV_STATIC` ; `NODE_ENV` vidé : code 1 « … quand HOST (0.0.0.0) n'est pas … » | R28 : double verrou déjà dans l'API ; l'image fixe `NODE_ENV=production` et `HOST=0.0.0.0` |
| V16 | Échec provoqué puis relance (règle 2 de la 1.1) | volume monté en lecture seule, puis le même volume en écriture | code 1 « Base impossible à ouvrir (/data/recrutement.sqlite) : unable to open database file » ; relance : `{"ok":true}` | R29 |
| V17 | `equipe.js` dans le conteneur | `docker compose exec -T api node api/equipe.js add|list` | `Base : /data/recrutement.sqlite` ; ajout et liste visibles par l'API à la requête suivante | R31 (`deploy/README.md`) |
| V18 | Valeurs résolues par Compose (règle 2 de la 1.2) | `docker compose config --format json`, service `api` | `environment: None`, `ports: None`, `networks: {back}` ; réseau `back` `internal: true` | R22, R28 ; la QA contrôle sur cette sortie |
| V19 | Audit | `cd api && npm audit --omit=dev` | 0 vulnérabilité ; aucune dépendance npm ajoutée | — |
| V20 | Healthcheck sans `curl` | `node:22-slim` : ni `curl` ni `wget` ; `node -e "fetch('http://127.0.0.1:8000/api/sante')…"` | conteneur `healthy` en 15 s | R27 |
| V21 | Mode serveur sans oauth2-proxy, pour le test de bout en bout | API locale `DEV_STATIC=<site construit>`, sans `DEV_EMAIL` ; `curl` avec et sans `X-Forwarded-Email` | site 200 ; sans en-tête : 401 `Identité absente ou invalide.` ; avec `alice@yeita.fr` : 200 | R38 : l'identité de chaque navigateur de test passe par l'en-tête |
| V22 | Serveur statique des tests existants | `python3 -m http.server`, `GET /api/moi` | **404** `text/html` | R2 : les tests existants restent en mode navigateur |
| V23 | Lectures synchrones de l'identité et des options | `ui.js` l. 113, 119, 128, 172, 182 ; `store.js` l. 108-116 | `QUI.equipe()`, `QUI.ajouter()`, `S.dispos()`, `S.addDispo()` synchrones | R12 à R16 : valeurs chargées par le démarrage, avant le premier rendu |
| V24 | Indicateur « données volatiles » | `store.js` l. 376, `index.html` l. 216, `candidat.html` l. 105 | lit `D.adapter().volatile` | R5 : l'adaptateur serveur expose `volatile: false` |
| V25 | Notes d'impression | `grep -n -i github candidatures/* assets/yeita.js` | **Écart** : `carte.html` l. 232 et `decompte.html` l. 171 ; `wirePrint` (`yeita.js` l. 185) y ajoute « Ouvrir sur le site » vers `SITE` = `https://leofuster-story.github.io/yeita-recrutement/` (404, fiche 1.1-1) | R35 ; `SITE` [ajout] (R36) |
| V26 | Déploiement : nettoyage et attente | `deploy/deploy.sh` l. 110-121 | `image prune --filter label=fr.yeita.projet=recrutement` ; attente de `/ping` sur front seulement | R25 (étiquette), R30 |
| V27 | Poids de l'image | `docker inspect recrutement-api --format '{{.Size}}'` | 418 Mo | — |
| V28 | Cookie de session | `deploy/oauth2-proxy.cfg` | `cookie_samesite = "lax"`, `cookie_httponly`, `cookie_secure` | Argument (non essayé) : une page d'un autre site ne peut pas envoyer de `PUT`/`DELETE` avec le cookie ; le `fetch` des pages est de même origine (R10) |
| V29 | 401 de l'API comparé au 401 d'oauth2-proxy | V21 et V9 | API : `{"erreur":"Identité absente ou invalide."}` ; oauth2-proxy : `{}` | R8 : tout 401 recharge, quel que soit le corps |
| V30 | **Essai d'attaque** (S1, tour 1) : l'hôte Linux joint-il un conteneur sur un réseau `internal: true` ? | moteur Linux jetable (`docker:29-dind`, moteur 29.9.2) : réseau `--internal`, conteneur `httpd`, `wget http://<IP>` depuis l'hôte, depuis un conteneur `--network host`, et témoin depuis un conteneur du réseau | **Écart** : hôte → IP du conteneur : **joignable** ; `--network host` : **joignable** ; témoin : joignable. Le pont reçoit la passerelle `172.19.0.1/16` | R24 faux sur Linux sans réglage : option du pont (R22b) |
| V31 | Parade de V30 | même moteur : `-o com.docker.network.bridge.inhibit_ipv4=true`, puis `-o com.docker.network.bridge.gateway_mode_ipv4=isolated` | les deux : pont sans adresse IPv4 ; hôte → IP : délai dépassé ; `--network host` : délai dépassé ; conteneur relié au réseau (seul, ou relié aussi à un autre réseau, comme `front`) → par nom : joignable | R22b : `inhibit_ipv4` (option la plus ancienne des deux) ; contrôle à la mise en service et au guide (R32) |
| V32 | Digest de l'image (E6, tour 1) | `docker buildx imagetools inspect node:22.23.4-slim@sha256:de170b…` | `application/vnd.oci.image.index.v1+json` : index multi-architecture, avec `linux/amd64` (`sha256:ea11b74b…`) et arm64 | R25 : digest de l'index |
| V33 | Taille d'un dossier (A2, tour 1) | `loadDemo()` dans Node (même chargement que `tools/test-store.js`), `Buffer.byteLength(JSON.stringify({version, data}))` ; dossier rempli de ~13 000 caractères | exemples : 1 428 à 4 753 octets ; dossier très rempli : 20 138 octets | R6g : `keepalive` sous 60 000 octets couvre l'usage courant |
| V34 | `Cache-Control` au travers d'oauth2-proxy (D9, tour 1) | banc, session Dex, `GET /api/candidats`, `/api/moi`, `/api/candidats/<id>` | `no-store` sur les trois | § Sécurité |
| V35 | Écritures inter-sites (S3, tour 1) | banc, session Dex : `POST` `text/plain` et formulaire ; `OPTIONS` (prévol) avec et sans cookie ; depuis une page d'une autre origine (`http://dex:5556`) : `fetch` `PUT` `credentials: "include"`, puis `POST` `no-cors` `text/plain` | `POST` `text/plain` et formulaire : **415** ; prévol sans cookie : 401, aucun `Access-Control-Allow-Origin` ; `PUT` inter-origine : bloqué (« Failed to fetch ») ; `POST` `no-cors` : envoyé (réponse opaque) mais **aucune option ajoutée** (liste inchangée) | § Sécurité réécrit : la protection est le 415 et le prévol refusé, pas `SameSite` |
| V36 | Nom du volume (E3, tour 1) | `docker compose -p recrutement config --format json` sur le `compose.yaml` du banc | clé `recrutement_data` → `recrutement_recrutement_data` | **Écart** : R22 déclare `name: recrutement_data` |
| V37 | Champs écrits par les fiches (F4, tour 1) | `ec1.html` l. 337-344, `ec2.html` l. 581-588, `decompte.html` l. 249-252, `candidat.html` l. 79-82 | `ec1` : `fiches.ec1`, `ec1` ; `ec2` : `fiches.ec2`, `ec2` (lit `identite.poste`) ; `decompte` : `fiches.decompte` ; `candidat` : le dossier entier (`S.saveCandidate(cur)`) | R6h : les trois fiches écrivent leur partie sur le dossier relu |
| V38 | Sortie de `front` relié à `edge` et à `back` (S7, tour 2) | moteur Linux jetable : réseau `edge3` normal, `back3` `--internal` + `inhibit_ipv4` ; conteneur relié dans l'ordre `edge` puis `back`, puis dans l'ordre inverse ; `ip route`, `nslookup` et `wget https://oauth2.googleapis.com/` | les deux ordres : route par défaut par `edge` (`default via 172.22.0.1`) ; DNS résolu ; Google répond (404 HTTP : la connexion aboutit) ; témoin : ce conteneur joint l'api par nom | Aucune priorité de passerelle nécessaire ; repris dans CA17 |
| V39 | IPv6 sur `back` (S6, tour 2) | même moteur : `back3` sans option IPv6 → `EnableIPv6=false` ; réseau `--internal --ipv6` + `inhibit_ipv4`, `wget http://[<IPv6 de api>]/` depuis l'hôte | **Écart** : avec IPv6 actif, l'hôte joint l'api (`fd56:d188:bccf::2`) malgré `inhibit_ipv4` | R22b : `enable_ipv6: false` explicite (un `daemon.json` qui active IPv6 par défaut ne s'applique pas) ; CA16 : `EnableIPv6: false` |
| V40 | `enable_ipv6: false` face à un moteur qui active IPv6 par défaut (S8, tour 3) | moteur jetable `docker:29-dind` lancé avec `--default-network-opt bridge=com.docker.network.enable_ipv6=true`, Compose 5.6.1 : réseau `back` (`internal`, `enable_ipv6: false`, `inhibit_ipv4`) et témoin `libre` (`internal`, sans option) | `back` : `EnableIPv6=false`, aucune adresse IPv6 pour `api`, IPv4 injoignable depuis l'hôte ; **témoin** `libre` : `EnableIPv6=true`, adresse `fd40:…::2` joignable depuis l'hôte | Le `false` explicite est transmis et l'emporte sur le réglage du moteur (R22b) ; le contrôle de mise en service vérifie aussi `EnableIPv6` (R32) |

## Détail
V5, V6 (sans session, via caddy, `https://localhost`) :
```
/api/moi           401
/api/sante         401
/%61pi/moi         302 https://accounts.google.com/o/oauth2/auth?…
//api/moi          301 https://localhost/api/moi
/API/moi           302 https://accounts.google.com/…
/api/../api/moi    301 https://localhost/api/moi
/candidatures/     302 https://accounts.google.com/…
/one-pager.html    200
```
V7, V8, V9 (Playwright, session Dex) :
```
session /api/moi 200 {"email":"alice@yeita.fr","prenom":"Alice","role":"recruteur"}
session /%61pi/moi 200 {"email":"alice@yeita.fr",…}
session /API/moi 404 404 page not found
forgé lea 200 {"email":"alice@yeita.fr",…}
forgé autres 200 {"email":"alice@yeita.fr",…}
put 201 {"id":"cand-abc-12345","version":1,…}
hors équipe 403 {"erreur":"Tu ne fais pas partie de l'équipe.","code":"hors-equipe"}
lea delete 403 {"erreur":"Lecture seule : tu ne peux pas modifier.","code":"lecture-seule"}
après déconnexion 401 application/json {}
```
V11 :
```
hôte → 127.0.0.1:8000 : 000, exit=7
caddy → api:8000 : wget: bad address 'api:8000' ; nslookup : NXDOMAIN
caddy → 172.18.0.3:8000 : wget: download timed out
conteneur sur back → api : {"ok":true}
conteneur sur edge seul → api : exit=6
api → https://example.com : pas de sortie EAI_AGAIN
```
Banc : `compose.yaml` modifié dans une copie (service `api`, réseau `back` `internal: true`, volume `recrutement_data`, `front` sur `edge` et `back`), `deploy/oauth2-proxy.cfg` (upstream et `api_routes`), `compose.banc.yaml` (Dex, `OAUTH2_PROXY_PROVIDER=oidc`, `OAUTH2_PROXY_COOKIE_SECURE=false` pour un accès en `http://front:4180` depuis le conteneur Playwright). Rien n'a été modifié dans le dépôt.

V30, V31 (moteur Linux jetable, `docker:29-dind`) :
```
hote -> IP api: JOIGNABLE        (réseau --internal, sans option)
network host:   JOIGNABLE
=== inhibit_ipv4=true      : hote injoignable, network host injoignable, conteneur du réseau JOIGNABLE, conteneur edge2+back2 JOIGNABLE
=== gateway_mode_ipv4=isolated : idem
```
