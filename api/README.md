# API de l'espace Candidatures

Le serveur qui garde les dossiers candidat dans une base SQLite. Il remplace le stockage du navigateur (`localStorage`) ; il est placé derrière oauth2-proxy, qui authentifie les comptes Google @yeita.fr. Depuis la v1.3, les pages l'utilisent quand il répond (`assets/demarrage.js`, `assets/adapter-serveur.js`), et il tourne dans Docker (service `api`, `docker/api.Dockerfile`, mode d'emploi : `deploy/README.md`).

Node.js 22, Fastify 5.12.7, better-sqlite3 13.0.3, @fastify/static 10.1.6 (mode local seulement), versions figées par `package-lock.json`.

## Installer

```bash
cd api
npm ci
```

`api/.npmrc` contient `ignore-scripts=true` : better-sqlite3 fournit ses binaires (Linux glibc et musl, macOS, Windows), rien n'est compilé et Python n'est pas nécessaire.

## Première mise en place (serveur)

1. `npm ci` dans `api/`.
2. Créer le premier admin, **avec le même utilisateur système et le même `DB_PATH` que l'API** :
   ```bash
   node api/equipe.js add prenom.nom@yeita.fr Prénom admin
   ```
   La commande affiche la base utilisée (`Base : /chemin/absolu (créée)`) : c'est celle que l'API devra ouvrir.
3. Démarrer l'API (`npm start` dans `api/`, ou `node api/server.js`), avec `NODE_ENV=production`.
4. Contrôler : `curl http://127.0.0.1:8000/api/sante` rend `{"ok":true}`.

L'ordre des étapes 2 et 3 peut être inversé : l'API et `equipe.js` créent le schéma s'il manque.

## Exposition

L'API croit l'en-tête `X-Forwarded-Email` posé par oauth2-proxy : **elle ne doit être joignable que par oauth2-proxy**. Quiconque l'atteint directement peut se faire passer pour n'importe quel membre (vérifié à la version 1.2 : un en-tête forgé envoyé directement passe ; au travers d'oauth2-proxy v7.15.5, il est retiré).

- Par défaut, elle n'écoute que sur `127.0.0.1`.
- Avec `HOST=0.0.0.0` (dans un conteneur, par exemple), le port ne doit pas être publié hors du réseau d'oauth2-proxy ; l'API le rappelle au démarrage par un avertissement.

## Variables

| Variable | Défaut | Valeurs admises | Refus (code 1) |
|---|---|---|---|
| `PORT` | `8000` | chiffres seuls, de 1 à 65535 | `abc`, `0`, `70000`, `8000 # commentaire` |
| `HOST` | `127.0.0.1` | une adresse sans espace | une valeur avec un espace |
| `DB_PATH` | `data/recrutement.sqlite` | chemin d'un fichier ; un chemin relatif part de `api/`, quel que soit le dossier courant | `:memory:`, `#`, guillemets, espace au début ou à la fin, un dossier existant |
| `NODE_ENV` | — | `production` sur le serveur (casse et espaces ignorés) | `#`, guillemets |
| `DEV_EMAIL` | — | mode local : email @yeita.fr utilisé quand l'en-tête est absent | adresse invalide ; `HOST` autre que `127.0.0.1`, `::1`, `localhost` ; `NODE_ENV=production` |
| `DEV_STATIC` | — | mode local : dossier du site construit (avec `index.html`), servi à la racine | dossier absent, sans `index.html`, contenant la base ou `api/` (ex. `..`), `#`, guillemets, espace au début ou à la fin ; mêmes conditions que `DEV_EMAIL` |

Une variable vide vaut absente. Au démarrage, une ligne de journal donne les valeurs résolues : hôte, port, chemin absolu de la base, `user_version`, `NODE_ENV`, et le mode local s'il est actif.

## Mode local (poste de développement)

`DEV_EMAIL` et `DEV_STATIC` ne servent qu'au poste : **jamais en production**. L'API refuse de démarrer si on les donne avec `NODE_ENV=production` ou une adresse d'écoute non locale.

```bash
cd api
npm ci
node equipe.js add moi@yeita.fr Moi admin
DEV_EMAIL=moi@yeita.fr npm start
```

Pour servir aussi le site construit à la même adresse (les pages passent alors en mode serveur) :

```bash
python3 tools/build.py _site
cd api && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```

Le site est alors à `http://127.0.0.1:8000/`, l'API sous `/api/`. `DEV_EMAIL` passe par l'autorisation comme un vrai compte : il doit être dans l'équipe.

## Gérer l'équipe

```bash
node api/equipe.js add <email> <prénom> [rôle]   # rôle : recruteur (défaut), admin, lecture ; réactive un membre désactivé
node api/equipe.js list                          # email · prénom · rôle · actif · ajouté le, désactivés compris
node api/equipe.js disable <email>               # l'accès est refusé dès la requête suivante
node api/equipe.js role <email> <rôle>           # ne réactive pas un membre désactivé
```

Chaque commande bien tapée commence par `Base : <chemin absolu>` (une commande mal tapée n'affiche que l'erreur et n'ouvre aucune base). Code 0 si c'est fait, 1 sinon (message en français). Si l'API écrit au même moment, la commande attend jusqu'à 5 secondes, puis abandonne sans rien écrire : il suffit de la relancer.

## Arrêter

`Ctrl+C` (`SIGINT`) ou `SIGTERM` : l'API ferme le serveur puis la base, et sort en code 0. Toute erreur de démarrage (variable refusée, port déjà utilisé, base impossible à ouvrir ou d'une version plus récente) sort en code 1, avec une ligne qui nomme la cause.

## Tests

```bash
cd api
npm test
```

Les tests (`node:test`) travaillent sur des bases temporaires et lancent l'API et `equipe.js` en processus fils ; ils ne touchent pas à `api/data/`. Compter une vingtaine de secondes : cinq écritures attendent volontairement l'expiration du délai de 5 secondes (base occupée).

## Contrat HTTP

Toutes les routes sauf `/api/sante` exigent un membre actif de l'équipe, identifié par `X-Forwarded-Email`. Le rôle `lecture` peut faire `GET` et `HEAD`. Toute réponse de l'API porte `Cache-Control: no-store`.

| Méthode et route | Rôles | Succès | Erreurs |
|---|---|---|---|
| `GET /api/sante` | sans authentification | 200 `{"ok": true}` | 503 `{"ok": false}` |
| `GET /api/moi` | tous | 200 `{email, prenom, role}` | 401, 403 |
| `GET /api/equipe` | tous | 200 `[{prenom, role}]`, membres actifs, triés par prénom | 401, 403 |
| `GET /api/candidats` | tous | 200 `[{id, version, data}]`, du plus récent au plus ancien (`data.meta.modifieLe`) | 401, 403 |
| `GET /api/candidats/:id` | tous | 200 `{id, version, data}` | 400, 401, 403, 404 |
| `PUT /api/candidats/:id` | recruteur, admin | 201 (création) ou 200, `{id, version, data}` | 400, 401, 403, 409, 413, 415, 503 |
| `DELETE /api/candidats/:id` | recruteur, admin | 204 | 400, 401, 403, 404, 503 |
| `GET /api/options-disponibilite` | tous | 200 `["…"]` : les options **ajoutées**, dans l'ordre d'ajout | 401, 403 |
| `POST /api/options-disponibilite` `{libelle}` | recruteur, admin | 201 (ajoutée) ou 200 (déjà là, ou option de base), corps : la liste | 400, 401, 403, 413, 415, 503 |

**L'enveloppe.** `version` est la version de la ligne en base (1, 2, 3…), qui change à chaque enregistrement. Elle est **distincte de `data.version`**, la version du schéma du dossier (toujours 3), que l'API ne lit pas. `data` est le dossier entier, rendu tel qu'il a été enregistré.

**Le PUT.** Corps `{"version": <version lue> | null, "data": <dossier>}`, en `application/json`, 1 Mo au plus. `version: null` crée le dossier ; sinon l'enregistrement n'a lieu que si la version en base est toujours celle lue. `data.schema` doit valoir `"yeita-dossier-candidat"` et `data.id` l'identifiant de l'adresse (`cand-…`, le format de `uid()` dans `assets/dossier.js`).

**Les erreurs** sont en JSON `{"erreur": "…"}`, avec un `code` quand le client doit réagir autrement :

| Statut | `erreur` | `code` |
|---|---|---|
| 400 | `Identifiant invalide.`, `JSON invalide.` (y compris un corps qui contient `__proto__` ou `constructor.prototype`), ou le champ en faute (`Champ version : …`, `Champ data.id : …`) | — |
| 401 | `Identité absente ou invalide.` | — |
| 403 | `Tu ne fais pas partie de l'équipe.` | `hors-equipe` |
| 403 | `Lecture seule : tu ne peux pas modifier.` | `lecture-seule` |
| 404 | `Candidature introuvable.` | `introuvable` |
| 404 | `Route inconnue.` | — |
| 409 | `La candidature a été modifiée par quelqu'un d'autre. Recharge la page.` (création d'un id existant, version périmée ou dossier supprimé entre-temps) | `conflit` |
| 413 | `Dossier trop volumineux (1 Mo maximum).` | — |
| 415 | `Le corps doit être en JSON (application/json).` | — |
| 500 | `Erreur interne.` | — |
| 503 | `Base occupée, réessaie dans un instant.` | — |

Les contrôles se font dans cet ordre : identité (401), équipe (403), rôle (403), puis le corps (415, 413, 400), puis l'identifiant et les champs (400), enfin 404 ou 409. Derrière oauth2-proxy, une requête sans session reçoit sa réponse à lui (redirection ou 403, pas du JSON de l'API).

**Correspondance avec l'adaptateur** (`DOSSIER.use(...)`, contrat de `docs/backend/MODELE.md`) :

| Méthode | Appel | Résultat |
|---|---|---|
| `list()` | `GET /api/candidats` | le `data` de chaque enveloppe ; garder `version` par id |
| `get(id)` | `GET /api/candidats/:id` | `data` ; 404 `introuvable` ou 400 → `null` |
| `put(d)` | `PUT /api/candidats/:id` avec la version gardée pour cet id, ou `null` | `data` ; garder la nouvelle `version` |
| `remove(id)` | `DELETE /api/candidats/:id` | résolue sur 204 ou 404 `introuvable` |

Toute autre erreur rejette la promesse avec le texte de `erreur` (un 404 sans `code` est une route inconnue, pas un dossier absent ; c'est aussi le cas d'un identifiant de plus de 200 caractères, que le routeur ne reconnaît pas).

## Ce que l'API garde

- `candidats` : le dossier entier en JSON, sa version, la date et l'auteur du dernier enregistrement.
- `journal` : qui a créé, modifié ou supprimé quel identifiant, quand, et à quelle étape ; jamais le contenu du dossier. Quand un dossier est supprimé, son journal est purgé et il ne reste qu'une ligne « suppression ».
- `equipe`, `options_disponibilite`.
- Effacement réel : avec `secure_delete` et un point de contrôle `TRUNCATE` après chaque enregistrement, ni un dossier supprimé ni une version remplacée ne restent lisibles dans les fichiers de la base. Exception : si un autre programme lit la base au même moment (ligne de commande `sqlite3`, sauvegarde), le point de contrôle n'attend pas plus de 100 ms ; l'ancienne version reste alors dans les fichiers jusqu'à l'enregistrement suivant, et le journal du serveur le signale (« Point de contrôle incomplet »).
- Fichiers de la base (`.sqlite`, `-wal`, `-shm`) lisibles par leur seul propriétaire (dossier en 700, fichiers en 600).
- Journal du serveur (sortie standard, JSON) : méthode, adresse demandée (telle que reçue), hôte, adresse distante, statut, durée ; jamais le corps ni l'email d'une requête (en mode local seulement, la ligne de démarrage rappelle `DEV_EMAIL`).
