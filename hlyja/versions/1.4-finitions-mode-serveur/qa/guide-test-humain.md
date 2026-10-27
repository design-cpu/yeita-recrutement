---
type: guide-test
version: 1.4
parcours: 5
date: 2026-10-27
---

# Guide de test — Textes justes en mode serveur, exemples hors de la base partagée

> 5 parcours, ~15 min · commence par les parcours 2 et 3 · tout se fait sur ton poste, avec une base jetable dans `/tmp`

Il te faut : Node 22 ou plus récent (`node --version`), Python 3, Chrome ou Firefox, deux terminaux. Les commandes se lancent depuis la racine du dépôt. Les adresses `127.0.0.1:8000` et `localhost:8765` sont deux sites différents : le navigateur garde des données séparées pour chacun.

## Préparer
- [ ] **Se placer sur la branche** (terminal 1, à la racine du dépôt) :
  ```bash
  git switch version/1.4-finitions-mode-serveur
  ```
  - [ ] Attendu : `Switched to branch 'version/1.4-finitions-mode-serveur'` (ou `Already on …`).
  - Sinon : si git refuse à cause de modifications locales, lance `git stash`, puis relance la commande.
- [ ] **Installer l'API et construire le site** :
  ```bash
  (cd api && npm ci) && python3 tools/build.py _site
  ```
  - [ ] Attendu : `npm ci` finit par `added … packages` sans `ERR!`, puis la commande rend la main sans erreur ; le dossier `_site/candidatures/` existe (`ls _site/candidatures/index.html` l'affiche).
  - Sinon : `npm ERR!` sur la version de Node → installe Node 22 et relance ; `python3: command not found` → installe Python 3.
- [ ] **Créer une base jetable avec ton compte local** :
  ```bash
  rm -f /tmp/recrutement-qa-1.4.sqlite*; DB_PATH=/tmp/recrutement-qa-1.4.sqlite node api/equipe.js add moi@yeita.fr Moi admin
  ```
  - [ ] Attendu : deux lignes, `Base : /tmp/recrutement-qa-1.4.sqlite (créée)` (sur macOS le chemin peut commencer par `/private/tmp`) puis `Ajouté : moi@yeita.fr · Moi · admin · actif …`.
  - Sinon : `Cannot find module` → l'étape « Installer » n'a pas abouti, refais-la.
- [ ] **Lancer l'API en mode serveur local** (terminal 1, laisse-le ouvert) :
  ```bash
  cd api && DB_PATH=/tmp/recrutement-qa-1.4.sqlite DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
  ```
  - [ ] Attendu : des lignes de journal avec `"msg":"API démarrée"`, `"dev_email":"moi@yeita.fr"` et `Server listening at http://127.0.0.1:8000`.
  - Sinon : `EADDRINUSE` → le port 8000 est pris : arrête l'autre programme, ou ajoute `PORT=8001` au début de la commande et remplace `8000` par `8001` dans tout le guide ; `DEV_STATIC refusé` → le dossier `_site` manque, refais « Installer ».
- [ ] **Vérifier que l'API te reconnaît** (terminal 2, à la racine du dépôt) :
  ```bash
  curl -s http://127.0.0.1:8000/api/moi
  ```
  - [ ] Attendu : `{"email":"moi@yeita.fr","prenom":"Moi","role":"admin"}`.
  - Sinon : `Connection refused` → l'API du terminal 1 n'est pas lancée ou s'est arrêtée, relis son message d'erreur ; `{"erreur":…}` → l'étape « Créer une base » n'a pas visé `/tmp/recrutement-qa-1.4.sqlite`, refais-la puis relance l'API.

## Parcours essentiels

### 1. Tableau vide en mode serveur — priorité haute
- [ ] Ouvre dans le navigateur : `http://127.0.0.1:8000/candidatures/`
  - [ ] Attendu : le tableau s'affiche avec « Aucune candidature pour l'instant ».
  - Sinon : page blanche ou 404 → vérifie le terminal 1 (API arrêtée ?) et l'adresse (avec `/candidatures/`).
- [ ] Lis le texte sous « Aucune candidature pour l'instant ».
  - [ ] Attendu : exactement « Ajoute la première personne avec qui tu as un appel de découverte. », sans la phrase sur les exemples fictifs.
  - [ ] Attendu : aucun bouton « Charger des exemples » sous ce texte.
  - Sinon : note le texte lu et fais une capture : c'est un bug (R5 ou R4).
- [ ] Ouvre la section « Sauvegarde et exemples » en bas de la page (clic sur son titre ; le titre reste le même en mode serveur, hors périmètre).
  - [ ] Attendu : ni « Charger des exemples » ni « Retirer les exemples » en bas de la section.
  - [ ] Attendu : dans « Importer », pas d'option « Remplacer tout ».
  - Sinon : capture et note le bouton vu : c'est un bug (R4 ou R6).

### 2. Bandeau jaune en mode serveur — priorité haute
- [ ] Sur `http://127.0.0.1:8000/candidatures/`, lis le bandeau jaune en haut de la page.
  - [ ] Attendu : « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. »
  - [ ] Attendu : « Connecté·e : Moi » toujours dans le bandeau, à côté du texte, lisible (pas de chevauchement).
  - [ ] Attendu : nulle part « Tout reste dans ce navigateur ».
  - Sinon : recharge la page une fois ; si le texte reste « Données fictives… Tout reste dans ce navigateur. », c'est un bug (R1) : capture du bandeau.
- [ ] Clique « Ajouter un candidat », tape `Bandeau Test` dans le champ du nom, puis clique « Ouvrir l'appel de découverte ».
  - [ ] Attendu : la page du candidat s'ouvre sur l'appel de découverte (`candidat.html?id=…&etape=appel`), même bandeau jaune avec le texte du serveur et « Connecté·e : Moi ».
  - Sinon : si la page ne s'ouvre pas, note le message affiché.
- [ ] Copie l'identifiant de l'adresse (la partie après `id=`, jusqu'au `&` s'il y en a un), puis ouvre une à une, en remplaçant `<id>` : `http://127.0.0.1:8000/candidatures/ec1.html?id=<id>`, `…/ec2.html?id=<id>`, `…/decompte.html?id=<id>`, `…/carte.html?id=<id>`
  - [ ] Attendu `ec1.html` : bandeau avec le texte du serveur.
  - [ ] Attendu `ec2.html` : bandeau avec le texte du serveur.
  - [ ] Attendu `decompte.html` : bandeau avec le texte du serveur.
  - [ ] Attendu `carte.html` : bandeau avec le texte du serveur.
  - Sinon : note la page fautive et le texte lu : bug (R1).

### 3. Pas d'exemples dans la base partagée — priorité haute
- [ ] Revenir au tableau : `http://127.0.0.1:8000/candidatures/`. Ouvre « Sauvegarde et exemples ».
  - [ ] Attendu : la carte « Bandeau Test » est au tableau ; « Retirer les exemples » n'apparaît pas (aucun exemple dans la base).
  - Sinon : bouton visible → bug (R6), capture.
- [ ] Dans le terminal 2, compte les exemples dans la base :
  ```bash
  curl -s http://127.0.0.1:8000/api/candidats | grep -c '"demo":true'
  ```
  - [ ] Attendu : `0`.
  - Sinon : un nombre plus grand → des exemples ont été écrits dans la base partagée : bug (R4) ; note ce que tu as cliqué avant.

### 4. Exemple déjà présent, puis retiré — priorité moyenne
Simule un exemple laissé dans la base par une version précédente.
- [ ] Sur `http://127.0.0.1:8000/candidatures/`, ouvre la console du navigateur (Chrome : `Cmd+Option+J` sur Mac, `Ctrl+Shift+J` sinon ; Firefox : `Cmd+Option+K` / `Ctrl+Shift+K`), colle cette ligne et appuie sur Entrée :
  ```js
  (function(){ var c = DOSSIER.blank('Exemple Ancien'); c.meta.demo = true; return DOSSIER.save(c); })()
  ```
  - [ ] Attendu : la console affiche une promesse (`Promise {…}`) sans erreur rouge.
  - Sinon : Chrome peut demander de taper `allow pasting` avant de coller : tape-le, Entrée, puis recolle la ligne. `DOSSIER is not defined` → tu n'es pas sur l'onglet du tableau.
- [ ] Recharge la page (`Cmd+R` / `F5`), ouvre « Sauvegarde et exemples ».
  - [ ] Attendu : la carte « Exemple Ancien » est au tableau, et le bouton « Retirer les exemples » est visible ; toujours pas de « Charger des exemples ».
  - Sinon : bouton absent → bug (R6), capture.
- [ ] Clique « Retirer les exemples ».
  - [ ] Attendu : « Exemple Ancien » disparaît du tableau, « Bandeau Test » reste, et le bouton « Retirer les exemples » disparaît.
  - Sinon : note ce qui reste affiché : bug (R6).
- [ ] Dans le terminal 2 :
  ```bash
  curl -s http://127.0.0.1:8000/api/candidats | grep -c '"demo":true'
  ```
  - [ ] Attendu : `0`.
  - Sinon : `1` → l'exemple est resté dans la base : bug (CA4).

### 5. Mode navigateur inchangé — priorité moyenne
- [ ] Dans le terminal 2, lance le site seul, sans API :
  ```bash
  python3 -m http.server 8765 --directory _site
  ```
  - [ ] Attendu : `Serving HTTP on :: port 8765 …` (ou `0.0.0.0 port 8765`).
  - Sinon : `Address already in use` → un autre serveur tient le port 8765 : arrête-le, ou remplace `8765` par `8766` ici et dans l'adresse ci-dessous.
- [ ] Ouvre `http://localhost:8765/candidatures/` (si tu as déjà utilisé ce site dans ce navigateur, ouvre plutôt une fenêtre de navigation privée pour partir d'un tableau vide).
  - [ ] Attendu : bandeau jaune « Données fictives uniquement, jusqu'au déploiement sécurisé. Tout reste dans ce navigateur. » et la liste « Qui es-tu ? ».
  - [ ] Attendu : tableau vide avec « … Pour une démo, charge des exemples fictifs. » et le bouton « Charger des exemples » dessous.
  - Sinon : texte du serveur affiché ici → bug (R2/R7), capture ; tableau non vide → ouvre une fenêtre privée.
- [ ] Ouvre « Sauvegarde et exemples ».
  - [ ] Attendu : « Charger des exemples » et « Retirer les exemples » tous deux présents, et l'option « Remplacer tout » dans « Importer ».
  - Sinon : bouton manquant → bug (R7).
- [ ] Clique « Charger des exemples ».
  - [ ] Attendu : des candidats fictifs apparaissent au tableau, « Retirer les exemples » toujours visible.
- [ ] Clique « Retirer les exemples ».
  - [ ] Attendu : les candidats fictifs disparaissent, le tableau redevient vide.
  - Sinon : note ce qui reste : bug (R7).

## Ranger
- [ ] Arrête les deux serveurs : `Ctrl+C` dans le terminal 1, puis dans le terminal 2.
  - [ ] Attendu : chaque terminal rend la main.
- [ ] Supprime la base jetable :
  ```bash
  rm -f /tmp/recrutement-qa-1.4.sqlite*
  ```
  - [ ] Attendu : la commande ne dit rien.

## Points d'attention
- Pendant la seconde de démarrage, le bandeau peut encore montrer « Données fictives… » avant de passer au texte du serveur : c'est accepté par la spec. Seul un texte qui reste après le chargement est un bug.
- En cas de panne de l'API (mode bloqué), les boutons d'exemples restent affichés mais ne font rien : accepté par la spec (R4).

## Inutile de tester
Les bascules du bandeau en mode bloqué, le clic pendant l'attente du démarrage, l'absence d'écriture dans la base et la suppression de l'ancien modèle de données sont vérifiés par les tests automatisés (`tools/test-serveur.js`, `tools/e2e-serveur.py`, `tools/e2e-candidatures.py`).
