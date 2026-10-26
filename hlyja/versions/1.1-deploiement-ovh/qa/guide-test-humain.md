---
type: guide-test
version: 1.1
parcours: 5
date: 2026-10-26
---

# Guide de test — Déploiement de l'espace Candidatures sur le serveur OVH

> 5 parcours, ~25 min sur un poste avec Docker, puis la connexion Google sur le serveur · commence par les parcours 1 et 2

## Préparer
```bash
git switch version/1.1-deploiement-ovh
cp .env.example .env
docker compose up -d --build
```
Données de test : `.env.example` tel quel (faux identifiants Google : la redirection vers Google se voit, la connexion elle-même ne peut pas aboutir). Docker Desktop doit tourner.

## Parcours essentiels

### 1. Ce qu'un candidat voit, sans compte — priorité haute
- [ ] Ouvrir `https://localhost/` (accepter le certificat local) : le guide s'affiche.
- [ ] Ouvrir `https://localhost/one-pager.html` puis `https://localhost/yeita-match-kit.html` : les pages s'affichent avec leur mise en forme.
- [ ] Ouvrir un fichier de `https://localhost/telechargements/`, par exemple `one-pager-parcours.pdf` : il se télécharge.
- [ ] Vérifier : aucune de ces pages ne demande de connexion.

### 2. Ce qui est réservé à l'équipe — priorité haute
- [ ] Cliquer sur le lien « Candidatures » du guide : le navigateur part vers une page Google.
- [ ] Ouvrir directement `https://localhost/assets/data-diamants.js` : même chose.
- [ ] Ouvrir `https://localhost/telechargements/` (le dossier, sans fichier) : même chose.
- [ ] Vérifier : on ne voit jamais le contenu de ces adresses sans passer par Google.

### 3. Le contrôle automatique — priorité moyenne
- [ ] `tools/check-site.sh https://localhost` : 5 lignes `OK`, « Tout est OK ».
- [ ] `docker compose stop front` puis relancer le contrôle : des lignes `FAIL … reçu 502`, et `echo $?` affiche `1`.
- [ ] `docker compose start front`.

### 4. Le cas A (sans Caddy) — priorité moyenne
- [ ] `docker compose --profile caddy down`, mettre `COMPOSE_PROFILES=` (vide) dans `.env`, puis `docker compose up -d`.
- [ ] `docker compose ps` : seul `front` tourne.
- [ ] `tools/check-site.sh http://127.0.0.1:4180` : 5 `OK`.
- [ ] Remettre `COMPOSE_PROFILES=caddy` et `docker compose down`.

### 5. Sur le serveur, après le premier déploiement — priorité haute, à faire par Yeita
- [ ] Suivre `deploy/README.md` dans l'ordre (choix du cas, DNS, préparation, client Google « Interne », `.env`, cas A ou B, `deploy/deploy.sh`).
- [ ] Avec un compte **@yeita.fr** : ouvrir `https://recrutement.yeita.fr/candidatures/`, se connecter → retour sur l'espace Candidatures.
- [ ] Avec un compte **Google extérieur** : la connexion est refusée.
- [ ] En cas A : comparer `~/sites-avant.txt` et `~/sites-apres.txt` : aucun autre site ne change.
- [ ] Le mail du one-pager : le lien « Ton parcours » mène à `https://recrutement.yeita.fr/one-pager.html`.

## Points d'attention
- Le navigateur peut garder l'en-tête HSTS envoyé pour `localhost` et refuser ensuite `http://localhost` pour d'autres projets : `chrome://net-internals/#hsts`, « Delete domain security policies » pour `localhost`.
- `reverse_proxy = false` : les journaux d'oauth2-proxy montrent l'adresse du proxy, pas celle du visiteur. C'est voulu (une faille de contournement a été trouvée et fermée).
- La durée de session reste celle d'oauth2-proxy par défaut (7 jours).
- Après le test, `docker compose --profile caddy down` et supprimer `.env` si tu n'en as plus besoin.

## Inutile de tester
- La liste complète des chemins publics et protégés, l'en-tête `X-Forwarded-Uri` forgé, les en-têtes de sécurité et le cookie : vérifiés automatiquement (38 chemins via Caddy et en direct).
- Les refus des scripts `prepare-serveur.sh` et `deploy.sh` (10 et une vingtaine de cas), le retour arrière, l'interruption, le nettoyage des images : rejoués dans un conteneur Ubuntu.
- Les pages du site elles-mêmes : les 4 tests de navigateur existants passent (111 vérifications).
