---
type: guide-test
version: 1.10
date: 2026-10-28
---

# Tester la fiche du candidat et le dépôt de CV

Suivre les étapes dans l'ordre et cocher. Chaque étape dit quoi lancer, ce que tu dois voir, et quoi faire sinon.

- **Partie A — sur le Mac, avant le merge** : 15 minutes.
- **Partie B — sur le serveur, avant le merge** : 10 minutes. Sans elle, en production, aucun CV de plus de 1 Mo ne passerait.
- **Partie C — sur le site, après le merge** : 10 minutes.

Il te faut : le Terminal du Mac (dans le dossier du dépôt, sur la branche `version/1.10-fiche-candidat-harmonisation`), Node installé, l'accès SSH au serveur en `deploy` et en `ubuntu`, un compte de l'équipe sur `https://recrutement.yeita.fr`.

---

# Partie A — sur le Mac, avant le merge

## A1. Les tests de l'API passent

- [ ] Lancer :

```bash
cd api && npm ci >/dev/null && npm test 2>&1 | grep -E "^ℹ (tests|fail)"; cd ..
```

- [ ] Tu dois voir : `ℹ tests 85` puis `ℹ fail 0`.

**Sinon** : m'envoyer ce qu'affiche `cd api && npm test 2>&1 | grep -A8 "✖"; cd ..`.

## A2. Lancer le site sur le Mac, avec un CV d'essai

- [ ] Lancer (la commande ne rend pas la main : c'est normal, le site tourne) :

```bash
python3 tools/build.py _site >/dev/null && d=$(mktemp -d) && echo "CV de test — Essai Guide" | cupsfilter -i text/plain -m application/pdf - > "$d/cv-essai.pdf" 2>/dev/null && DB_PATH=$d/r.sqlite node api/equipe.js add moi@yeita.fr Moi recruteur >/dev/null && echo "CV d'essai : $d/cv-essai.pdf" && echo "Ouvrir http://127.0.0.1:18767/candidatures/" && DB_PATH=$d/r.sqlite DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site PORT=18767 node api/server.js
```

- [ ] Tu dois voir : `CV d'essai : /var/folders/…/cv-essai.pdf` (noter ce chemin), `Ouvrir http://127.0.0.1:18767/candidatures/`, puis des lignes de journal, dont une qui contient `"API démarrée"` et `"user_version":1`.

**Sinon** : `Base d'une version plus récente (user_version 2)` → c'est une ancienne base de test de la branche de Léo : la commande ci-dessus en crée une neuve à chaque fois, relance-la telle quelle ; autre message → me l'envoyer.

## A3. Ajouter un candidat avec son CV

- [ ] Ouvrir `http://127.0.0.1:18767/candidatures/` dans le navigateur. En haut : « Connecté·e : Moi ».
- [ ] Cliquer « Ajouter un candidat ».
- [ ] Tu dois voir : une fenêtre « Fiche du candidat » avec 4 groupes (Identité, Contact, Documents, Suivi) et, en bas, « Enregistrer et revenir à la liste » et « Passer à l'appel de découverte ».
- [ ] Écrire le nom `Essai Guide`.
- [ ] Dans « Documents », champ CV : cliquer « Déposer un fichier », choisir le CV d'essai (le chemin noté en A2 : dans la fenêtre de choix, `Cmd+Maj+G` puis coller le chemin).
- [ ] Tu dois voir : un trombone, `cv-essai.pdf` et sa taille (environ `11 Ko`).
- [ ] Champ Portfolio : cliquer « Coller un lien », écrire `https://exemple.fr/book`, appuyer sur Entrée.
- [ ] Cliquer « Enregistrer et revenir à la liste ».
- [ ] Tu dois voir : la fenêtre se ferme, la carte « Essai Guide » apparaît dans le tableau, un message « … ajouté·e ».

**Sinon** : un message rouge sous le champ CV → me l'envoyer tel quel ; deux cartes « Essai Guide » → me le dire (c'est le défaut que la version corrige).

## A4. Ouvrir et retirer le CV

- [ ] Sur la carte « Essai Guide », cliquer `⋯` puis « Fiche du candidat ».
- [ ] Tu dois voir : CV `cv-essai.pdf` avec « Ouvrir » et « Retirer » ; Portfolio `exemple.fr/book` avec « Modifier » et « Retirer ».
- [ ] Cliquer « Ouvrir » sur le CV.
- [ ] Tu dois voir : un nouvel onglet avec un PDF qui affiche « CV de test — Essai Guide ». Fermer cet onglet.
- [ ] Revenir à la fiche, cliquer « Retirer » sur le CV.
- [ ] Tu dois voir : le champ CV redevient « Déposer un fichier » / « Coller un lien », et un message « CV retiré ».
- [ ] Fermer la fenêtre, puis `⋯` → « Historique ».
- [ ] Tu dois voir, entre autres lignes : « CV retiré : cv-essai.pdf », « Portfolio : lien ajouté (exemple.fr/book) » et « CV déposé : cv-essai.pdf ».

**Sinon** : « Ouvrir » affiche une erreur → me l'envoyer ; le CV ne disparaît pas après « Retirer » → me l'envoyer.

## A5. Un coup d'œil aux étapes

- [ ] Fermer l'historique, cliquer sur le nom « Essai Guide » de la carte.
- [ ] Tu dois voir : l'appel de découverte, la fiche du candidat en haut (mêmes 4 groupes), **plus de « Liens utiles »**, pas de menu pour changer l'État dans l'en-tête de la page.
- [ ] Cliquer le bouton « Notes » sur le côté droit (sur un grand écran).
- [ ] Tu dois voir : le panneau Notes à côté du contenu (pas par-dessus) si l'écran est large ; par-dessus sur un écran plus petit.

**Sinon** : me faire une capture d'écran.

## A6. Arrêter le site du Mac

- [ ] Revenir au Terminal et arrêter avec `Ctrl+C`. Rien à effacer : la base d'essai était dans un dossier temporaire.

---

# Partie B — sur le serveur, avant le merge

Serveur : `51.75.252.121`. Le merge met la version en ligne sous 10 minutes : cette partie se fait **avant** de cliquer « Merge ».

## B1. Une sauvegarde toute fraîche

- [ ] Sur le Mac, lancer :

```bash
ssh deploy@51.75.252.121 'cd /opt/recrutement && deploy/backup.sh'
```

- [ ] Tu dois voir, en dernière ligne : `Sauvegarde réussie : recrutement-…Z.db.age (… octets) ; … copies sur le serveur.`

**Sinon** : ne pas merger, m'envoyer le message.

## B2. Relever le réglage de nginx et les autres sites

- [ ] Sur le Mac, se connecter en `ubuntu` :

```bash
ssh ubuntu@51.75.252.121
```

- [ ] Sur le serveur, lancer :

```bash
sudo nginx -T 2>/dev/null | grep -n client_max_body_size; sudo nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u | tee ~/sites-avant-1.10.txt
```

- [ ] Tu dois voir : aucune ligne `client_max_body_size` (ou seulement pour d'autres sites), puis la liste des sites servis, dont `recrutement.yeita.fr`.

## B3. Ajouter le réglage

- [ ] Toujours sur le serveur, en `ubuntu` : garder une copie du fichier du site et l'ouvrir :

```bash
sudo cp -a /etc/nginx/sites-available/recrutement.yeita.fr ~/recrutement.yeita.fr-avant-1.10 && sudo nano /etc/nginx/sites-available/recrutement.yeita.fr
```

- [ ] Dans le bloc qui contient `listen 443 ssl;`, juste après les lignes `add_header`, ajouter la ligne :

```nginx
    client_max_body_size 10m;
```

- [ ] Enregistrer (`Ctrl+O`, Entrée) et quitter (`Ctrl+X`).

## B4. Vérifier, puis recharger nginx

- [ ] Lancer :

```bash
sudo nginx -t && sudo systemctl reload nginx && sudo nginx -T 2>/dev/null | grep -n client_max_body_size
```

- [ ] Tu dois voir : `syntax is ok`, `test is successful`, puis une ligne `client_max_body_size 10m;`.

**Sinon** (`nginx -t` en erreur) : ne pas recharger ; remettre la copie et revérifier, puis m'envoyer l'erreur :

```bash
sudo cp -a ~/recrutement.yeita.fr-avant-1.10 /etc/nginx/sites-available/recrutement.yeita.fr && sudo nginx -t
```

## B5. Prouver que 2 Mo passent

- [ ] Lancer (sans compte, c'est la connexion Google qui répond : tout code sauf `413` convient) :

```bash
head -c 2097152 /dev/zero | curl -s -o /dev/null -w '%{http_code}\n' --max-time 30 -X POST -H 'Content-Type: application/pdf' --data-binary @- 'https://recrutement.yeita.fr/api/candidats/cand-x-y/fichiers?champ=cv'
```

- [ ] Tu dois voir : `401`.

**Sinon** : `413` → la ligne n'est pas dans le bon bloc : reprendre B3 (le bloc avec `listen 443 ssl;`).

## B6. Les autres sites n'ont pas bougé

- [ ] Lancer :

```bash
sudo nginx -T 2>/dev/null | grep -E '^\s*server_name' | sort -u > ~/sites-apres-1.10.txt; diff ~/sites-avant-1.10.txt ~/sites-apres-1.10.txt && echo "Aucun changement"
```

- [ ] Tu dois voir : `Aucun changement`.

**Sinon** : des lignes `<` ou `>` → remettre la copie (bloc du « Sinon » de B4) et m'envoyer ces lignes.

## B7. Tout est bon : la pull request peut être mergée

- [ ] A1 à A5 et B1 à B6 sont cochés. Merger la pull request sur GitHub.

---

# Partie C — sur le site, après le merge

## C1. La version est en ligne

- [ ] Attendre 10 minutes, puis ouvrir `https://recrutement.yeita.fr/admin/deploiement.html` (compte admin).
- [ ] Tu dois voir : en vert « À jour : le dernier commit de main est en ligne. ».

**Sinon** : un passage en rouge → me faire une capture de la page (le site est revenu de lui-même à la version d'avant).

## C2. Un vrai CV de 2 à 8 Mo

- [ ] Ouvrir `https://recrutement.yeita.fr/candidatures/`, « Ajouter un candidat », nom `Essai Production`, déposer un PDF de 2 à 8 Mo (un portfolio exporté, par exemple), « Enregistrer et revenir à la liste ».
- [ ] `⋯` → « Fiche du candidat » → « Ouvrir » sur le CV.
- [ ] Tu dois voir : le PDF dans un nouvel onglet.

**Sinon** : « Le serveur refuse ce fichier. … » → la partie B n'a pas pris : refaire B4 et B5 ; autre message → me l'envoyer.

## C3. Supprimer le candidat d'essai

- [ ] `⋯` sur « Essai Production » → « Supprimer ».
- [ ] Tu dois voir : le message de confirmation dit que ses documents partent avec lui ; après « Supprimer », la carte disparaît.

---

## Inutile de tester

- Le doublon de candidat quand l'envoi d'un CV échoue, les pannes réseau, les conflits entre deux recruteurs, le rôle lecture, les liens piégés, l'import : couverts par les tests automatiques (`tools/e2e-serveur.py`).
- Le retour vers la 1.9 et la restauration d'une sauvegarde : essayés sur un banc avec le vrai code de la 1.9.
- Le contrôle automatique « départ de la page » qui échoue aussi sur `main` : connu, suivi au backlog.
