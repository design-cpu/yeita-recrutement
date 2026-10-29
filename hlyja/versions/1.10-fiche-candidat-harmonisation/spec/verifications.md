---
type: verifications
version: 1.10
total: 21
ecarts: 7
date: 2026-10-28
---

# Vérifications — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> 20 vérifications (V18, V19 ajoutées au tour 1, V20 au tour 2) sur la branche rejouée (`7533be6`, puis `69ec434`) et sur `main` (`b727ded`).
> 7 écarts avec la description de la branche : retour arrière vers la 1.9 refusé (V4), nginx de production à 1 Mo (V9, V11), 413 de nginx affiché comme une panne réseau (V13), doublon de candidat et fichier orphelin reproduits dans le navigateur (V14), description périmée (V15), un contrôle e2e instable (V3).

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | Rejeu des 2 commits sur `main` | `git cherry-pick becf443 650c648` sur `version/1.10-…` | 4 conflits, tous dans `hlyja/` (glossaire, api, conventions, decisions) ; aucun dans le code ; numéro 1.7 déjà pris sur `main` → renuméroté 1.10 (`69ec434`) | Doc hlyja à reprendre (P10) |
| V2 | Suites unitaires et d'intégration | `cd api && npm test` (Node 26 sur le poste ; Node 22.23.4 dans l'image de `docker/api.Dockerfile`, comme le fait `auto-deploy.sh`) ; `node tools/test-store.js` ; `node tools/test-serveur.js` | `# tests 73 · # pass 73 · # fail 0` (Node 22) ; `ℹ pass 73 · ℹ fail 0` (Node 26) ; `TOUT OK` ; `TOUT OK (87 vérifications)` | Base de non-régression |
| V3 | Suites e2e | `tools/e2e-*.py` dans `mcr.microsoft.com/playwright/python:v1.63.0-noble` (conventions) | `e2e-candidatures` `ALL OK`, `e2e-parcours` `ALL OK`, `e2e-liens` `ALL OK`, `e2e-pdf` `ALL OK`, `e2e-serveur` `ÉCHECS` : seul « départ de la page (candidat.html), PUT précédent lent » (1.10-3) | Instabilité hors périmètre ; la QA la relance sur `main` pour confirmer qu'elle préexiste |
| V4 | Retour arrière après la migration | base créée par `main`, ouverte par la 1.10, rouverte par `main` (`ouvrirBase`, worktree de `main`) | `user_version 1` → `2` → **refus** : « Base d'une version plus récente (user_version 2) » | P1 ; décision : table ajoutée sans changer `user_version` (R1, R2) |
| V5 | Limites de taille de l'API | `app.inject` : PDF de 10 485 760 o ; 10 485 761 o ; dossier JSON de 1 048 577 o | 201 ; 413 `fichier-trop-gros` « Fichier trop volumineux (10 Mo maximum). » ; 413 « Dossier trop volumineux (1 Mo maximum). » | Conformes (R6) |
| V6 | Accès et formes d'adresse sur la route d'envoi | `app.inject` : rôle lecture GET et HEAD d'un fichier ; POST sur `/%66ichiers`, `/FICHIERS`, `//fichiers` ; lecture sur `/%66ichiers` | GET 200, HEAD 200 ; `%66ichiers` reconnu (201 pour un recruteur, **403 pour lecture**) ; `FICHIERS` et `//fichiers` non reconnus (415, aucun fichier écrit) | Garde par la route reconnue, conforme (R8) |
| V7 | Effacement réel | repère dans un PDF déposé ; recherche dans `b.sqlite`, `-wal`, `-shm` après retrait du fichier seul ; test existant après suppression du candidat (`fichiersContiennent`) | après dépôt : présent dans `b.sqlite` ; après retrait : **absent** des trois fichiers ; après suppression : absent (test « retrait puis suppression ») | Conforme (R10) |
| V8 | Les sauvegardes 1.7 contiennent les fichiers | copie par l'API de sauvegarde de SQLite (`db.backup`, comme `api/sauvegarde.js`) | repère présent dans la copie | Rien à changer à `backup.sh` ; la taille des copies croît avec les fichiers (R14) |
| V9 | nginx devant le site, réglage par défaut | banc Docker : `nginx:1.28` (réglage par défaut) → `oauth2-proxy:v7.15.5` → compteur d'octets | 2 Mo et 10 Mo : **413 `text/html`** de nginx | P2, P3 |
| V10 | nginx `client_max_body_size 10m` + oauth2-proxy | même banc, `client_max_body_size 10m` | 2 097 161 o et 10 485 760 o reçus en entier par l'amont ; 10 485 769 o : 413 nginx (HTML) ; un `X-Forwarded-Email` posé par nginx est écrasé par oauth2-proxy (401 de l'API sans session) | `10m` suffit, oauth2-proxy ne limite pas (R13) |
| V11 | Exemple nginx du guide | `grep -n client_max_body_size deploy/README.md hlyja/technique/*.md` | absent de `deploy/README.md` ; cité seulement dans `technique/api.md` (historique 1.10) | P2 : à ajouter au guide (R13) |
| V12 | Dépendances | `git diff main -- api/package.json api/package-lock.json` | aucun changement | Rien à auditer |
| V13 | Lecture d'une réponse non JSON par les pages | `assets/adapter-serveur.js` l. 32-43 (`lire`) ; `MESSAGE_CODE` l. 28 | toute réponse non JSON → `erreur("reseau")` ; `fichier-trop-gros` et `type-fichier` absents de `MESSAGE_CODE` (le message du serveur est repris tel quel) | P3 (R7) |
| V14 | Cohérence dépôt / dossier dans le navigateur | script Playwright contre la vraie API (helpers de `tools/e2e-serveur.py`) : (a) création avec un CV, envoi du fichier forcé en 500, puis second clic ; (b) dépôt d'un CV sur un candidat existant, `PUT` du dossier forcé en 409 ; lecture du code `menu-candidat.js` l. 193-203, 225-235, 265-273 | (a) 1 candidat après le 1er clic, message « panne simulée », **2 candidats** après le 2e clic ; (b) fichier `fic-44f4…` en base, **non référencé** par le dossier ; (c) lecture : `validerLien` retire le fichier avant l'enregistrement différé | P4, P5, P6, P7 (R3 à R5) |
| V15 | Description de la branche contre le code | `git show 650c648 -- assets/config.js` ; `grep -n journal api/src/fichiers.js` | `equipeNoms: {}` (prénoms) depuis le 2e commit ; aucune écriture au journal du serveur pour un dépôt ou un retrait : la trace est dans l'historique du dossier (`type: "fichier"`) | P8 : la spec et la doc disent ce que fait le code |
| V16 | Publication de `Claude outputs/` | `python3 tools/build.py <dossier>` puis `ls "<dossier>/Claude outputs"` | `pr-1.10-fiche-candidat.md`, `pr-1.6-allegement-ux.md` publiés (pages protégées par oauth2-proxy) | Hors périmètre (P9), candidat au backlog |
| V17 | Clés étrangères actives | `new Database(...).pragma("foreign_keys")` (better-sqlite3 13.0.3) | `1` | La suppression d'un candidat par le code de la 1.9 entraîne ses fichiers (`ON DELETE CASCADE`) : à prouver par test une fois R1 appliquée (R2) |
| V18 | Caddy (cas B) et la taille des corps | banc Docker : `caddy:2.11.7` (`reverse_proxy` vers le compteur d'octets) | 10 485 760 et 10 485 769 o reçus en entier (200) : aucune limite | R13 (O7) |
| V19 | Pages de la 1.9 devant une ligne `type: "fichier"` | `git show main:candidatures/menu-candidat.js` (`histHTML` l. 52-60) ; `git show main:assets/store.js` l. 240-246 (`undoLast`) | toute ligne autre que `etat` est lue comme un passage : `histHTML` affiche « <étape vide> → <étape vide> » ; `undoLast` prend la ligne pour le dernier passage et refuse (« ne correspond plus à l'étape en cours ») | R2 : dégradation décrite (O1) |
| V20 | Les pages et l'API de la 1.9 gardent la référence d'un fichier | Playwright contre l'API et les pages de `main` (worktree `b727ded`), base avec la table `fichiers` et un dossier qui référence `fic-…01` plus une ligne `type: "fichier"` ; saisie du téléphone dans la fiche, enregistrement ; historique ouvert | téléphone enregistré, **`identite.fichiers` gardé** (même `id`), version 6 ; historique : « 1 janvier à 00:00 undefined → undefined, Alice », aucune erreur de script | R2 confirmée : rien n'est perdu ; l'affichage dégradé est celui que R2 décrit (T11) |
| V21 | Le contrôle e2e « départ de la page (candidat.html), PUT précédent lent » sur `main` | `tools/e2e-serveur.py` de `main` (`b727ded`), 3 fois, conteneur Playwright, Node 22 | 3 fois sur 3 : `FAIL départ de la page (candidat.html), PUT précédent lent : la dernière frappe est en base 0799999999 · PUT :  200 200 200 409` puis `ÉCHECS` ; même message sur la branche | Préexistant et reproductible dans ce conteneur (pas seulement intermittent) : CA17 l'admet (1.10-3) |

## Détail
V4 :
```
1) base créée par main :           ouverte, user_version 1
2) ouverte par 1.10 :              ouverte, user_version 2
3) rouverte par main (retour) :    REFUS: Base d'une version plus récente (user_version 2)
```
V9 et V10 (banc Docker, conteneurs supprimés après l'essai) :
```
port 18081 (nginx défaut) f2 (2097161 o) : 413 <html> <head><title>413 Request Entity Too Large</title>
port 18082 (nginx 10m) f2 (2097161 o) : 200 {"recu":2097161}
port 18082 (nginx 10m) f10 (10485760 o) : 200 {"recu":10485760}
port 18082 (nginx 10m) f11 (10485769 o) : 413 <html> …
```
V14 :
```
P4 après 1er clic : candidats « DOUBLON Test » = 1 | message : panne simulée
P4 après 2e clic : candidats « DOUBLON Test » = 2
P5 fichiers en base avant : [] après : ['fic-44f4eaf000ecd83223'] | référencé par le dossier : None | existe encore : False
```
Incident pendant V9 : l'arrêt de l'API de banc par son port a aussi arrêté Docker Desktop (qui relayait ce port) ; Docker a été relancé, la pile `recrutement` du poste a redémarré seule, les conteneurs de banc `banc19` et `banc17s` sont restés arrêtés.
