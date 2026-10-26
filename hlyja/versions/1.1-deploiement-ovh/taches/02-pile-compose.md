---
type: tache
version: 1.1
numero: 02
titre: Pile Compose
statut: ok
date: 2026-10-26
---

# Tâche 02 — Pile Compose

> **QA : réussie** · 4 fichiers (3 créés, 1 modifié) · 0 correction
> Une commande lance le site en local derrière Caddy, en HTTPS, avec les en-têtes de sécurité et des journaux limités.

## Ce que ça change
`docker compose up -d --build` construit l'image et lance `front` (port 4180 sur 127.0.0.1 seulement) et, si `COMPOSE_PROFILES=caddy`, Caddy sur 80 et 443. `.env.example` suffit tel quel pour un essai local sur `https://localhost`. Une variable manquante dans `.env` arrête Compose avec un message.

## Comment tester
1. `cp .env.example .env && docker compose up -d --build`
2. `curl -sk -D - -o /dev/null https://localhost/one-pager.html`
Résultat attendu : 200 et les 4 en-têtes de sécurité.
Tests automatiques : `tools/check-site.sh https://localhost` (tâche 03).

## Critères d'acceptation
- [x] CA4 — 4 en-têtes via Caddy ; `Set-Cookie` d'une page protégée : `HttpOnly; Secure; SameSite=Lax`
- [x] CA5 (partie publication) — `front` : `127.0.0.1:4180->4180/tcp` seulement ; l'arrêt de `caddy` sans profil est vérifié en tâche 03 (CA13)
- [x] CA6 — `json-file`, `max-size:10m`, `max-file:3`, `restart=unless-stopped` sur les deux conteneurs

## Ce qui a été fait
- `compose.yaml` : `name: recrutement` ; `front` (build depuis la racine, image `recrutement-front`, cfg monté en lecture seule, 4 variables `OAUTH2_PROXY_*` obligatoires, `127.0.0.1:4180`) ; `caddy` (`caddy:2.11.7`, profil `caddy`, 80, 443, 443/udp, `DOMAIN` obligatoire, Caddyfile en lecture seule, `caddy_data`, `caddy_config`) ; journaux et redémarrage communs ; réseau `edge` 172.30.0.0/24.
- `deploy/Caddyfile` : `{$DOMAIN}`, `reverse_proxy front:4180`, HSTS, nosniff, Referrer-Policy, X-Frame-Options.
- `.env.example` : prêt pour le test local, valeurs à changer listées, commande du cookie secret (32 caractères).
- `.gitignore` : `.env`.
Fichiers : `compose.yaml`, `deploy/Caddyfile`, `.env.example`, `.gitignore`
Commits : `ef5a08d` feat(deploiement-ovh): tâche 02 – pile Compose, Caddy (cas B), réglages d'exemple

## Résultat QA
| Vérification | Résultat |
|---|---|
| `docker compose config -q` | ok |
| `/one-pager.html`, `/index.html`, `/ping` via Caddy | ok (200) |
| `/candidatures/`, `/assets/data-diamants.js` via Caddy | ok (302 Google, `redirect_uri=https://localhost/oauth2/callback`) |
| En-têtes et cookie (CA4) | ok |
| `docker compose ps` : ports | ok (`front` 127.0.0.1:4180 ; `caddy` 80, 443, 443/udp) |
| `docker inspect` journaux et redémarrage (CA6) | ok |
| Réseau | ok (`recrutement_edge`, `front` 172.30.0.2, `caddy` 172.30.0.3) |
| `.env` sans `OAUTH2_PROXY_CLIENT_SECRET` | ok (« required variable … is missing a value: absent de .env ») |
| `git status` : `.env` non suivi | ok |
Corrections : aucune.

## Spec couverte
R6, R8, R9, R10, R11, R12, R20, R22 ; CA4, CA5 (partiel), CA6
