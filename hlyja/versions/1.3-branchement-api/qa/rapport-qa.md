---
type: rapport-qa
version: 1.3
taux: 100
ok: 43
echec: 0
manuel: 4
couches: unitaire, intégration, composant, bout en bout, régression, accessibilité, sécurité, manuel
date: 2026-10-26
---

# Rapport QA — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> **Taux de réussite : 100 %** (43/43) après corrections (`03975ab`) ; **90,7 %** (39/43) au passage de la QA · 4 à vérifier à la main
> Régressions : 1 au passage (verdict des e2e `candidatures` et `parcours`, B1), corrigée · Bugs : 2 majeurs (B1, B2), 1 mineur (B3), **corrigés** par l'orchestrateur et revérifiés (section « Corrections après la QA ») · aucun bloquant.
> Ce qui tient : isolement de l'API sur le moteur Linux (hôte, réseau hôte, caddy, `edge`, IPv6), identité de la session qui écrase tout en-tête forgé (Dex), envoi de départ sous l'identité de Bob, effacement vérifié dans les octets de `/data` et dans les journaux, `deploy.sh` (attente, échec provoqué puis relance, retour à la 1.2 et retour), CA22, textes mot pour mot ; 18 mutations, toutes détectées avec le message visé sauf une survivante sans effet de sécurité.

QA indépendante sur `e59d120`, code de production non modifié, aucun fichier de test ajouté au projet (scripts dans le scratchpad : `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/d97386d7-da7f-4b43-bc26-6c29f916ac88/scratchpad/qa/`). Bancs : moteur Linux jetable `dind13` (29.9.2, HEAD poussé dans le dépôt nu et déployé par `deploy.sh`, commit de banc `9ffc7a7`) ; pile `banc13` sur Docker Desktop avec Dex à la place de Google, fichiers actuels recopiés ; conteneur Playwright 1.63.0 avec le Node de `node:22-slim`.

## Résultats
| # | Scénario | Résultat | Détail |
|---|---|---|---|
| S1 | Rejeu `test-store.js` | ok | `TOUT OK` (48 vérifications), 0,07 s |
| S2 | Rejeu `test-serveur.js` | ok | `TOUT OK (81 vérifications)`, 3,6 s |
| S3 | Rejeu `npm test` | ok | `pass 52`, `fail 0`, 21,9 s |
| S4 | Rejeu `e2e-candidatures` | ok (après `03975ab`) | 40 OK, 0 FAIL, mais verdict `SOMETHING FAILED` : 9 erreurs de console `Failed to load resource: … 404 (File not found)` (B1) |
| S5 | Rejeu `e2e-parcours` | ok (après `03975ab`) | 45 OK, 0 FAIL, verdict `SOMETHING FAILED` : 31 erreurs de console, même cause (B1) |
| S6 | Rejeu `e2e-liens` | ok | 19 OK, `errors []`, `ALL OK` |
| S7 | Rejeu `e2e-pdf` | ok | 7 OK, `ALL OK` |
| S8 | Rejeu `e2e-serveur` | ok | 37 OK, `TOUT OK` |
| S9 | Témoin sur `main` | ok | `e2e-candidatures` et `e2e-parcours` : `errors: []`, `ALL OK` ; sur HEAD, la seule adresse en erreur est `http://127.0.0.1:8765/api/moi` (404) → régression du verdict, due à la 1.3 |
| S10 | `deploy.sh` de HEAD (banc Linux) | ok | « API saine. », 6 OK dont `/api/moi → 401`, « Déploiement réussi : 9ffc7a7 » ; rejoue CA19 et CA20 après la correction Q4 (`7a996af`), que la tâche 02 n'avait pas exécutée |
| S11 | Échec provoqué puis relance | ok | sonde vers `/api/inexistant` : « ÉCHEC : l'api n'est pas saine après 60 s (état : starting ; docker compose logs api). Pour revenir à la version précédente : deploy/deploy.sh 9ffc7a7 » ; `deploy.sh 9ffc7a7` : « API saine. », réussite |
| S12 | Retour vers la 1.2 puis vers la 1.3 | ok | `deploy.sh 0186993` : api arrêtée et retirée, « Tout est OK », réussite, `recrutement_data` présent ; `deploy.sh 9ffc7a7` : réussite, équipe retrouvée dans la base |
| S13 | CA16 | ok | `api` : `ports` None, `environment` None, réseau `back` seul, `unless-stopped`, journaux 10m × 3 ; `front` : `back`, `edge` ; `caddy` : `edge` ; `back` : `internal: True`, `enable_ipv6: False`, `inhibit_ipv4: "true"` ; volume `recrutement_data` (étiquette) ; `network inspect` : `true false map[com.docker.network.bridge.inhibit_ipv4:true]` |
| S14 | CA17 hôte et réseau hôte | ok | hôte → `172.19.0.2:8000` : `000` ; `--network host` → même adresse : `000` ; hôte → `127.0.0.1:8000` : `000` ; **témoins** depuis `recrutement_back` : par nom `{"ok":true} 200`, par adresse `200` |
| S15 | CA17 autres conteneurs, sorties | ok | caddy → `api:8000` : `bad address` ; caddy → adresse : `download timed out` ; conteneur du seul `edge` : `000` (nom et adresse) ; `front` (son espace réseau) → api : `{"ok":true} 200` ; `front` → `https://oauth2.googleapis.com/` : `404` (connexion aboutie), route `default via 172.30.0.1` (`edge`) ; api → Internet : `EAI_AGAIN` |
| S16 | CA17 sans session, formes | ok | `/api/moi`, `/api/sante` : 401 ; `//api/moi`, `/api/../api/moi` : 301 vers `/api/moi` ; `/%61pi/moi`, `/API/moi`, `/api` : 302 Google ; forme absolue (`--request-target http://…/api/moi`) : 401 |
| S17 | CA17 en-tête forgé sans session | ok | `X-Forwarded-Email: alice@yeita.fr` via `front` et via caddy : 401 ; journal de l'api : **0** requête ; **témoin** : la même requête depuis `recrutement_back` arrive (1 requête, 200) |
| S18 | CA18 image | ok | `FROM node:22.23.4-slim@sha256:de170b39…` ; `User node`, étiquette `fr.yeita.projet=recrutement`, `NODE_ENV=production HOST=0.0.0.0 PORT=8000 DB_PATH=/data/recrutement.sqlite` ; `/data` 700 `node`, base, `-wal`, `-shm` 600 ; sonde Node (30 s, 5 s, 10 s, 3) ; `healthy` |
| S19 | `DEV_EMAIL`, `DEV_STATIC` | ok | code 1, « DEV_EMAIL refusé : interdit quand NODE_ENV vaut production. », idem `DEV_STATIC` |
| S20 | V16, volume vide en lecture seule | ok | code 1, « Base impossible à ouvrir (/data/recrutement.sqlite) : unable to open database file » ; relance en écriture : `{"ok":true}` |
| S21 | V16, volume **avec base** en lecture seule | ok (après `03975ab`) | l'API démarre (« API démarrée »), `healthy`, `/api/moi` 200, `GET /api/candidats` 200 ; `PUT` valide → **500 « Erreur interne. »**, `POST` d'option → 500 ; journal : `SQLITE_READONLY` (B2) |
| S22 | R29 sous Compose, échec provoqué puis relance | ok | base en `000` : `Restarting (1)`, 7 relances en 12 s, cause au journal (« Base impossible à ouvrir … ») ; base en `600` : `healthy`, `check-site.sh` tout OK |
| S23 | CA23 `.dockerignore` | ok | `api/data/x.sqlite`, `api/data/x.sqlite-wal`, `api/y.sqlite` (repère) et `api/node_modules/zz-qa` présents dans le contexte : `/app/api/data` absent, repère introuvable dans `/app`, `zz-qa` absent |
| S24 | Mutations du 6e contrôle de `check-site.sh` | ok | `api_routes` retiré : « FAIL /api/moi → reçu 302 vers https://accounts.google.com/…, attendu 401 », code 1 ; témoin (configuration du dépôt) : OK, code 0. Seconde mutation, `"^/api/"` dans `skip_auth_routes` : **survit** (401, venu de l'API) ; sans effet de sécurité observé : un `X-Forwarded-Email` forgé reçoit 401 « Identité absente ou invalide. » |
| S25 | README § 9b, commandes | ok (après `03975ab`) | toutes les commandes marchent et les verdicts sont bons (`true false map[…]`, `000` × 3) ; mais la commande de l'adresse IPv6 affiche `invalid IP` là où le README annonce « vide » (B3) |
| S26 | CA17 avec session (Dex) | ok | Alice : `/api/moi` 200 `{"email":"alice@yeita.fr","prenom":"Alice","role":"recruteur"}`, `no-store` ; `X-Forwarded-Email: lea@…`, `X-Forwarded-User` + `X-Auth-Request-Email`, `X-Forwarded-Preferred-Username` forgés : `alice@yeita.fr` ; Bob avec `X-Forwarded-Email: alice@…` : `bob@yeita.fr` ; `/%61pi/moi`, `/api/../api/moi` : 200 Alice, `//api/moi` : 301 ; sans session : 6 formes et `PUT` forgé en 401/302 |
| S27 | Pages derrière oauth2-proxy | ok | `DEMARRAGE.mode()` = `serveur`, « Connecté·e : Alice », aucun `#qui-sel` ; création : en base, `historique[0].par` = « Alice » |
| S28 | Léa sur la pile | ok | « Connecté·e : Léa · lecture seule » ; écriture : « Lecture seule : tu ne peux pas modifier. », aucun bouton ; journal d'oauth2-proxy : `PUT` de `lea@yeita.fr` en 403 |
| S29 | Conflit sur la pile | ok | bandeau « La candidature a été modifiée … Recharge la page. \| Ce que tu as saisi depuis n'est pas enregistré : copie-le avant de recharger. \| Recharger » ; `PUT` d'Alice en 409 au journal |
| S30 | Envoi de départ sous l'identité de Bob | ok | `ec1.html` (navigation 80 ms après la frappe, sous le délai de 350 ms) : « Bob au depart … » en base ; `candidat.html` (sous 400 ms) : téléphone en base ; journal d'oauth2-proxy : ces `PUT` en 200 au nom de `bob@yeita.fr` : le cookie de session part avec l'envoi `keepalive` (l'écart R38 de l'e2e est sans objet en production) |
| S31 | CA22 | ok | session de Bob ouverte : `disable` → `/api/moi` et `/api/candidats` en 403 `hors-equipe` dès la requête suivante ; `list` le montre « désactivé » ; `add` → 200 ; `role … lecture` → `"role":"lecture"` |
| S32 | Règle 4, suppression | ok | dossier « Quetzalqa Dossier » + note EC1 ; deux pages de Bob ouvertes ; suppression par Alice (204) ; saisie chez Bob : 409 au journal, `decompte.html` n'écrit rien, 404 ensuite (aucune recréation) ; `grep -a Quetzalqa` dans `recrutement.sqlite`, `-wal`, `-shm` copiés sans `VACUUM` : 0 ; journaux `api front` (378 lignes) : 0, identifiant présent 61 fois (**témoin** de lecture des journaux) ; stockage des 5 pages : 0 ; **témoin** : dossier « Temoinqa » non supprimé trouvé 1 fois dans `/data` |
| S33 | Règle 4, rectification | ok | `identite.personne` « QuetzalqaAncien » puis « Rectifie » (200) : ancienne valeur absente de `/data` (même recherche) |
| S34 | Accessibilité du bandeau | ok | `role="alert"` ; conflit pendant une frappe : focus resté sur `#i-telephone`, frappe continue (`061122`) ; à 375 px : largeur de page 375 (pas de défilement horizontal), bandeau à `y = 0` après défilement ; « Recharger » atteint au clavier, Entrée recharge |
| S35 | Mutations des options (Q7) | ok | MO1 pas de POST → « FAIL options : POST vers l'API, rien dans le localStorage » ; MO2 ajout aussi écrit en local → même FAIL + « FAIL attente : aucune écriture locale (dossiers, options) » ; MO3 liste de l'API ignorée → « FAIL options : base + ajouts venus de l'API » |
| S36 | Durée maximale, `test-serveur.js` | ok | MT1 `put` sans réponse : « FAIL création échéance dépassée : création », fin en 5,1 s (code 1) ; MT2 `/api/moi` sans réponse : « FAIL pret (serveur) échéance dépassée », 21 FAIL, fin en 11,4 s ; aucun blocage |
| S37 | Mutations de l'e2e serveur (Q7) | ok | 10/10 détectées par l'assertion visée, 47 s chacune : ME1 compte affiché comme liste (« prénom sans liste ») ; ME2 bandeau sans la phrase de saisie (« conflit : refus, bandeau … ») ; ME3 bandeau non collant (« bandeau visible page défilée en bas », `y: -636`) ; ME4 bouton en lecture seule (« lecteur : … sans bouton ») ; ME5 retour sur l'onglet ignoré (« la modification de Bob apparaît ») ; ME6 pas d'envoi de départ (« départ de la page (candidat.html) », `0799999999`) ; ME7 option non envoyée (« proposée à Bob ») ; ME8 texte d'export (« texte d'export « copie » ») ; ME9 repli navigateur sur 502 (« démarrage 502 HTML », 200 non JSON, 403) ; ME10 email au lieu du prénom (« au nom d'Alice dans l'historique ») |
| S38 | Durée maximale, `e2e-serveur.py` | ok | MT3 `/api/moi` sans réponse : 10 FAIL dont « démarrage : /api/moi retardé de 2 s … » et « démarrage : mode serveur », fin en 5 s (code 1, API arrêtée par le `finally`) ; la suite s'arrête ensuite sur une exception Playwright (`Cannot read properties of null (reading 'dataset')`) au lieu de continuer : échec franc, pas de blocage |
| S39 | `MODELE.md` contre R40 | ok | branchement (`demarrage.js`, `adapter-serveur.js`), messages, fiches, départ et risque H5, identité et régression de `QUI.ajouter`, copies (export, « Fusion », « Remplacer tout »), tableau « Ce qui vit encore dans le navigateur » ; remarque : le tableau des messages omet « Identifiant invalide… » et « Ce que tu as saisi… » (présents dans `wording.fr.js`) |
| S40 | `api/README.md`, mode local | ok | dans une copie : `node equipe.js add moi@yeita.fr Moi admin`, `DEV_EMAIL=… DEV_STATIC=../_site node server.js` : site 200, `/api/moi` 200 `Moi`, `assets/demarrage.js` 200 |
| S41 | CA24 | ok | `grep -i github` dans `carte.html`, `decompte.html`, `assets/yeita.js` : aucune occurrence ; `SITE = "https://recrutement.yeita.fr/"` ; `e2e-liens` 19 OK |
| S42 | Textes de la spec | ok | 13/13 mot pour mot (`wording.fr.js`, notes de `carte.html` et `decompte.html`) |
| S43 | Relecture des captures | ok | bandeau lisible, collé en haut, « Recharger » souligné ; « Connecté·e : Alice » à l'emplacement de « Qui es-tu ? », même taille ; remarque : le bandeau jaune voisin dit « … Tout reste dans ce navigateur. », faux en mode serveur (hors périmètre, voir Points notés) |
| S44 | H1, vrai compte Google | manuel | guide, parcours 2 |
| S45 | Contrôle réseau sur le serveur | manuel | guide, parcours 1 (dépend du moteur du serveur) |
| S46 | H2, aperçu dans l'artefact | manuel | guide, parcours 6 |
| S47 | H4, données des navigateurs | manuel | guide, points d'attention |

## Par couche
| Couche | Scénarios | Réussis | Échoués | Outil |
|---|---|---|---|---|
| Unitaire | 3 (S2, S35, S36) | 3 | 0 | Node (`tools/test-serveur.js`, mutations) |
| Intégration | 11 (S10-S12, S18, S20-S22, S24, S25, S31, S40) | 9 | 2 (S21, S25) | banc Linux `docker:29-dind`, Compose 5.6.1, `curl` |
| Composant / UI | 2 (S28, S29) | 2 | 0 | Playwright, banc Dex |
| Bout en bout | 5 (S8, S27, S30, S37, S38) | 5 | 0 | Playwright (`tools/e2e-serveur.py`, banc Dex) |
| Régression | 7 (S1, S3-S7, S9) | 5 | 2 (S4, S5) | suites du projet |
| Accessibilité | 1 (S34) | 1 | 0 | Playwright |
| Sécurité | 10 (S13-S17, S19, S23, S26, S32, S33) | 10 | 0 | banc Linux, banc Dex, `grep -a` |
| Manuel relu par la QA | 4 (S39, S41-S43) | 4 | 0 | lecture, `grep`, script de comparaison |
| Manuel (personne qui teste) | 4 (S44-S47) | — | — | guide de test |
Performance : écartée (plan de test).

## Suite de tests complète
Commandes : `node tools/test-store.js` · `node tools/test-serveur.js` · `cd api && npm test` · e2e en conteneur (commande de `hlyja/technique/conventions.md`).
Résultat : 48 + 81 + 52 + 148 vérifications e2e passées (40 + 45 + 19 + 7 + 37), 0 `FAIL` ; **mais** `e2e-candidatures` et `e2e-parcours` concluent `SOMETHING FAILED` (B1). Les codes de sortie des quatre e2e historiques valent 0 même en échec (déjà le cas sur `main`) : seul le verdict imprimé compte.
Mutations de la QA : 18 (MO1-MO3, MT1, MT2 en Node ; ME1-ME10, MT3 en e2e ; 2 sur `check-site.sh`) : 17 détectées par l'assertion visée, 1 survivante sans effet de sécurité (S24), aucune « bloque ».

## Bugs trouvés
| Bug | Gravité | Statut | Correction |
|---|---|---|---|
| B1 — `e2e-candidatures` et `e2e-parcours` finissent par `SOMETHING FAILED` sur la branche (`ALL OK` sur `main`). Cause : ces suites comptent toute erreur de console ; le démarrage appelle `/api/moi`, le serveur statique répond 404 (attendu, R2), Chromium journalise « Failed to load resource … 404 ». CA15 et R37 (« passent sans modification ») ne sont donc pas tenus, et toute vraie erreur de console future serait noyée. Reproduction : commande e2e de `conventions.md`, lire la dernière ligne de chaque suite ; témoin : même commande sur `git archive main`. La tâche 06 et P4 ont compté les `OK` (« 111 OK ») sans lire le verdict | majeur | corrige | `03975ab` : le filtre de console des deux suites écarte la seule erreur dont l'adresse finit par `/api/moi` (écart à R37 tracé au bilan) ; rejeu : `ALL OK` ×2 — piste initiale de la QA : (ex. écarter la seule erreur 404 de `/api/moi` dans le filtre de console des deux suites — modification des tests, donc écart à R37 à tracer — ou éviter l'erreur de console côté page) ; la QA ne corrige pas |
| B2 — volume en lecture seule avec une base existante : l'API démarre, reste `healthy`, sert les lectures ; tout `PUT`, `DELETE`, `POST` → 500 « Erreur interne. » (`SQLITE_READONLY` au journal). CA18 (« volume en lecture seule → code 1 ») et R29 ne tiennent que pour un volume vide (V16 avait été fait ainsi). `deploy.sh` et `check-site.sh` ne voient rien ; les pages affichent « Erreur interne. » à chaque enregistrement. Reproduction (banc) : `docker run --rm -d -v recrutement_data:/data:ro recrutement-api`, puis dans le conteneur `fetch('http://127.0.0.1:8000/api/candidats/cand-ro-qa1', {method:'PUT', headers:{'X-Forwarded-Email':'alice@yeita.fr','Content-Type':'application/json'}, body:'{"version":null,"data":{"schema":"yeita-dossier-candidat","id":"cand-ro-qa1","version":3}}'})` → 500 ; `docker inspect` → `healthy` | majeur | corrige | `03975ab` : la sonde de l'image exige aussi `/data` inscriptible (`fs.accessSync('/data', W_OK)`), hors `api/src/` ; rejeu : `unhealthy` (témoin, ancienne sonde : `healthy`, POST → 500) — piste initiale de la QA : la spec interdit de toucher `api/src/` ; pistes hors `api/src/` : sonde (`HEALTHCHECK`) qui vérifie aussi que `/data` est inscriptible, ou consigne d'exploitation au README ; sinon écart à CA18 accepté et fiche au backlog |
| B3 — `deploy/README.md` § 9b : la commande de l'adresse IPv6 de l'api annonce « attendu : vide » ; Docker 29.9.2 affiche `invalid IP` quand il n'y a pas d'adresse (`{{json …}}` affiche `""`). L'exploitant, au moment du contrôle « sinon pas de mise en service », lit une sortie qui ne ressemble pas à l'attendu | mineur | corrige | `03975ab` : « attendu : aucune adresse IPv6 (Docker 29 affiche « invalid IP », d'autres versions une ligne vide) » — piste initiale : (`invalid IP`, ou passer la commande en `{{json …}}` → `""`) |

## Corrections après la QA
Faites par l'orchestrateur en `03975ab`, revérifiées :
| Bug | Revérification | Résultat |
|---|---|---|
| B1 | conteneur Playwright, les 4 e2e en mode navigateur et l'e2e serveur, dernière ligne lue | `ALL OK` × 4 (40, 45, 19, 7), `TOUT OK` (37) ; forme permise : seule l'adresse `/api/moi` est écartée, toute autre erreur de console compte toujours |
| B2 | moteur Linux jetable : API en écriture qui tourne sur un volume, second conteneur sur le même volume en lecture seule (la reproduction de la QA) ; témoin : même image avec l'ancienne sonde | nouvelle sonde : `unhealthy` ; **témoin** : `healthy`, `POST /api/options-disponibilite` → 500 ; volume en écriture : `healthy` |
| B3 | relecture du § 9b | ligne « attendu » conforme à la sortie de Docker 29.9.2 |
Suites rejouées : `node tools/test-serveur.js` 81/81 ; `node tools/test-store.js` TOUT OK.

## Régressions
- B1 : verdict des deux e2e historiques (pas de régression du comportement des pages : les 85 vérifications passent).
- Aucune autre : mode navigateur, `npm test`, `test-store.js` inchangés ; `deploy.sh` vers la 1.2 fonctionne.

## Points notés (sans échec)
- Le bandeau « Données fictives uniquement, jusqu'au déploiement sécurisé. Tout reste dans ce navigateur. » (`wording.fr.js`, `fictif`) reste affiché en mode serveur, où il devient faux. Exclu par la spec (« Bandeau Données fictives ») : à porter au backlog ou à trancher avant la première vraie candidature.
- `MODELE.md` : tableau des messages sans « Identifiant invalide… » ni « Ce que tu as saisi… » (R40 dit « messages » sans liste).
- `check-site.sh` ne voit pas `"^/api/"` ajouté à `skip_auth_routes` (S24, mutation survivante) ; l'effet est nul aujourd'hui (oauth2-proxy ne transmet pas l'en-tête forgé, l'API rend 401), donc pas de bug.
- `npm test` n'a pas de durée maximale globale (`node --test` sans `--test-timeout`), seulement sur ses 4 tests concurrents ; `api/` est hors périmètre de la 1.3. Les deux suites de la 1.3 échouent avec un message en cas d'attente sans fin (S36, S38), mais s'arrêtent à la première exception au lieu de continuer.
- Q8 de la revue (envoi de départ de Bob non exercé par l'e2e) : couvert par S30 sur la pile réelle.

## À vérifier à la main
S44 (H1, vrai compte Google), S45 (contrôle réseau du README § 9b sur le serveur, sortie `invalid IP` attendue pour l'IPv6), S46 (H2, aperçu), S47 (H4, effacement des données des navigateurs) : `guide-test-humain.md`. Captures pour la relecture : `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/d97386d7-da7f-4b43-bc26-6c29f916ac88/scratchpad/qa/captures/` (`conflit-bas-de-page.png`, `conflit-haut-de-page.png`, `conflit-mobile.png`, `conflit-mobile-defile.png`, `lecture-seule.png`, `tableau-alice.png`, `entete-alice.png`, `entete-lea.png`).
