---
type: tache
version: 1.1
numero: 03
titre: Contrôle du site
statut: ok
date: 2026-10-26
---

# Tâche 03 — Contrôle du site

> **QA : réussie** · 1 fichier créé · 0 correction · 5 mutations détectées
> `tools/check-site.sh` vérifie en quelques secondes que les pages publiques s'ouvrent et que les pages protégées renvoient vers Google.

## Ce que ça change
Après un déploiement (ou en local), une commande dit si le site est sain : une ligne OK ou FAIL par contrôle, et un code de sortie exploitable par `deploy.sh`. Le mode test local est vérifié dans les deux cas (B avec Caddy, A sans).

## Comment tester
1. `cp .env.example .env && docker compose up -d --build`
2. `tools/check-site.sh https://localhost` → 5 OK, code 0.
3. Cas A : `docker compose --profile caddy down`, `COMPOSE_PROFILES=` dans `.env`, `docker compose up -d`, `tools/check-site.sh http://127.0.0.1:4180` → code 0.
Tests automatiques : `tools/check-site.sh <BASE_URL>`

## Critères d'acceptation
- [x] CA2 — `tools/check-site.sh https://localhost` → code 0
- [x] CA3 — 9 chemins publics en 200, 9 chemins protégés en 302 Google via Caddy, et `X-Forwarded-Uri` forgé → 302 via Caddy et en direct
- [x] CA5 — sans profil, seul `front` existe (`docker compose ps -a`)
- [x] CA7 — code 1 sur chaque mutation et sur un service injoignable ; code 2 sans argument ou avec un schéma invalide
- [x] CA13 — variante cas A : seul `front`, `check-site.sh http://127.0.0.1:4180` → 0

## Ce qui a été fait
- `tools/check-site.sh` : 5 contrôles (R13), `curl --max-time 10`, `-k` seulement pour `localhost`, codes 0/1/2, une ligne par contrôle avec le reçu et l'attendu.
Fichiers : `tools/check-site.sh`
Commits : `b7e0a31` feat(deploiement-ovh): tâche 03 – tools/check-site.sh

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA2 cas B | ok |
| CA3 via Caddy et en direct | ok |
| CA13 cas A | ok |
| Sans argument / `ftp://x` | ok (code 2, message d'usage) |
| Service injoignable (`http://127.0.0.1:4999`) | ok (`FAIL … reçu 000`, code 1) |
Corrections : aucune.

## Mutations
Faites dans une copie du projet hors du dépôt (scratchpad), pile relancée avec `--force-recreate` à chaque fois.
| Contrôle | Mutation ou forme permise | Attendu | Obtenu |
|---|---|---|---|
| `/assets/data-diamants.js` 302 | grille ajoutée aux routes publiques | FAIL sur ce contrôle | `FAIL /assets/data-diamants.js → reçu 200, attendu 302 vers https://accounts.google.com/` |
| `/one-pager.html` 200 | route publique du one-pager retirée | FAIL sur ce contrôle | `FAIL /one-pager.html → reçu 302 vers https://accounts.google.com/…, attendu 200` |
| `/index.html` 200 | second upstream retiré | FAIL sur ce contrôle | `FAIL /index.html → reçu 301 vers https://localhost/, attendu 200` |
| redirection « vers Google » | `provider = "github"` | FAIL sur les 2 contrôles protégés | 2 FAIL « reçu 302 vers https://github.com/…, attendu 302 vers https://accounts.google.com/ » |
| tous | `front` arrêté | 5 FAIL, code 1 | 5 FAIL « reçu 502 », code 1 |
| forme permise | `BASE_URL` avec `/` final | OK | OK, code 0 |
| forme permise | `http://127.0.0.1:4180` (sans `-k`) | OK | OK, code 0 |
Retour à l'état d'origine : 5 OK, code 0.

## Spec couverte
R13, R21 ; CA2, CA3, CA5, CA7, CA13
