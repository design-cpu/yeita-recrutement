---
type: tache
version: 1.1
numero: 06
titre: Mode d'emploi
statut: ok
date: 2026-10-26
---

# Tâche 06 — Mode d'emploi

> **QA : réussie** · 1 fichier créé · 0 correction
> `deploy/README.md` guide l'administrateur pas à pas, du choix du cas au retour arrière ; ses exemples nginx et Caddy sont validés et l'exemple nginx a servi le site en cas A dans le banc.

## Ce que ça change
Une personne qui n'est pas experte Docker peut déployer : choix du cas par `ss`, DNS, préparation, client Google « Interne », `.env`, procédure prudente du cas A (relevé des sites avant et après, copie, validation, rechargement, retour), cas B, déploiement, retour arrière, lecture des échecs, journaux, test local.

## Comment tester
1. Extraire les exemples entre les marqueurs `<!-- exemple-nginx -->` et `<!-- exemple-caddy -->`.
2. nginx : `docker run --rm -v <conf>:/etc/nginx/conf.d/recrutement.conf:ro -v <cert auto-signé>:/etc/letsencrypt/live/recrutement.yeita.fr:ro nginx:1.27.5 nginx -t`
3. Caddy : `docker run --rm -v <Caddyfile>:/etc/caddy/Caddyfile:ro caddy:2.11.7 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`
Résultat attendu : « syntax is ok … test is successful » ; « Valid configuration ».

## Critères d'acceptation
- [x] CA12 — `nginx -t` (certificat auto-signé de test) et `caddy validate` passent

## Ce qui a été fait
- `deploy/README.md` : 12 sections + test local ; exemples nginx (redirection 80 → 443, `add_header … always`, `Host`, `X-Forwarded-Proto`, tampons pour les cookies d'oauth2-proxy) et Caddy ; tableau « ligne en échec → cause → que faire ».
- Les points de R19 sont tous présents : arbre de choix (s'arrêter pour un proxy conteneurisé ou inconnu, solution réversible à proposer), DNS, client « Interne », certificat par l'outil en place, relevé avant/après, HEAD détachée, groupe `docker` = root, HSTS sur `localhost`, `tmux`.
Fichiers : `deploy/README.md`
Commits : `a421b7d` feat(deploiement-ovh): tâche 06 – deploy/README.md (cas A, cas B, procédure prudente)

## Résultat QA
| Vérification | Résultat |
|---|---|
| `nginx -t` sur l'exemple (nginx 1.27.5, certificat auto-signé) | ok |
| `caddy validate` sur l'exemple (2.11.7) | ok |
| Banc, cas A : exemple nginx (nom changé en `recrutement.localhost`) en réseau hôte devant `front`, `deploy.sh` | ok : 5 OK, « Déploiement réussi », HSTS et X-Frame-Options présents, `X-Forwarded-Uri` forgé → 302 |
| Banc, cas A sans proxy | ok : échec du contrôle, commande de retour affichée |
Corrections : aucune.

## Spec couverte
R19 ; CA12
