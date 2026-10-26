---
type: technique
page: decisions
titre: Décisions techniques
maj: 1.1
commit: COMMIT
sources: docs/backend/MODELE.md, assets/dossier.js, CONTRIBUER.md, docker/front.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/deploy.sh
date: 2026-10-26
---

# Décisions techniques

> Les choix d'architecture qui orientent le dépôt, avec ce qu'ils écartent. Une décision remplacée reste listée.
> v1.1 : hébergement Docker sur le serveur OVH derrière oauth2-proxy ; `reverse_proxy = false`.

| Décision | Contexte | Choix | Écarté | Conséquences | Version |
|---|---|---|---|---|---|
| Stockage et authentification | L'espace Candidatures doit être partagé entre recruteurs et réservé à l'équipe | SQLite sur le serveur OVH de Yeita ; authentification oauth2-proxy, SSO Google réservé aux comptes @yeita.fr ; portés par Sacha sur sa branche (23 octobre 2026) | Supabase (Postgres, RLS, lien e-mail), Firebase, API Notion, base partagée de l'artefact Claude | Les pages ne changent pas : le stockage se branche par `DOSSIER.use(adaptateur)` (`assets/dossier.js`), contrat dans `docs/backend/MODELE.md`. Jusqu'au déploiement, tout vit dans le navigateur, données fictives uniquement | 1.0 |
| Retrait du code Supabase | La piste Supabase, préparée mais jamais chargée par une page, est abandonnée | Suppression de l'adaptateur, du branchement, du schéma, de la mise en place, de leurs tests et de `STORAGE.md` | Garder les fichiers « pour mémoire » dans l'arbre | Référence pour la version 4 : le dernier commit de `main` qui contient `assets/adapter-supabase.js` est **`a86b6f4`** (contenu inchangé depuis `f11d015`). Lire avec `git show a86b6f4:assets/adapter-supabase.js` ; idem pour `assets/backend.js`, `docs/backend/schema.sql`, `docs/backend/README.md`, `docs/backend/test-schema.mjs`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md` | 1.0 |
| Source de vérité | Le dépôt était le miroir publié de l'artefact Claude « Expérience Collaborateur » | Le dépôt est la seule source de vérité ; chaque changement passe par une branche et une pull request vers `main` | Recopier les fichiers depuis l'artefact | `README.md` § « Mettre à jour » ; `CONTRIBUER.md` § « Proposer un changement » | 1.0 |
| Hébergement et authentification | L'espace Candidatures doit être servi chez Yeita, réservé aux comptes @yeita.fr, sur un serveur OVH partagé dont les autres services sont inconnus | Image Docker `front` : `python:3.12-slim` construit le site, oauth2-proxy `v7.15.5` le sert (upstream `file://`) et impose Google `email_domains = ["yeita.fr"]` ; port 4180 sur 127.0.0.1 seulement ; HTTPS par le proxy existant (cas A) ou par un `caddy:2.11.7` du projet (cas B, profil Compose `caddy`) ; données toujours dans le navigateur | GitHub Pages (public), serveur web séparé derrière oauth2-proxy | Liste publique fermée dans `deploy/oauth2-proxy.cfg` ; `.env` hors dépôt ; scripts `deploy/prepare-serveur.sh` et `deploy/deploy.sh` qui vérifient tout avant d'agir ; `.github/workflows/pages.yml` supprimé | 1.1 |
| Pas de confiance dans les en-têtes de proxy | Avec `reverse_proxy = true` et `trusted_proxy_ips = ["172.30.0.0/24"]`, un `X-Forwarded-Uri` forgé depuis une adresse de confiance ouvre une page protégée ; toute requête locale au serveur arrive depuis 172.30.0.1 (vérifié, v1.1) | `reverse_proxy = false` (arbitrage de l'utilisateur, contre la décision initiale du pitch) | Garder `true` et réécrire l'en-tête dans chaque proxy (faille locale restante) ; confiance limitée à Caddy (faille locale restante en cas A) | Les journaux montrent l'adresse du proxy, pas celle du visiteur ; repasser à `true` exige que chaque proxy réécrive `X-Forwarded-Uri` (commentaire dans `deploy/oauth2-proxy.cfg`) | 1.1 |
| `/index.html` en 200 | Le serveur de fichiers d'oauth2-proxy (Go) redirige `/index.html` vers `/` (301) | Second upstream `file:///srv/site/#/index.html` (choix de l'utilisateur) | Accepter la redirection | `/` et `/index.html` servent le guide | 1.1 |

## Voir aussi
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)

## Historique
| Version | Changement |
|---|---|
| 1.0 | Création : stockage, retrait de Supabase, source de vérité |
| 1.1 | Hébergement Docker derrière oauth2-proxy (l'authentification de la décision « Stockage et authentification » est en place ; le stockage SQLite reste à faire), `reverse_proxy = false`, `/index.html` en 200 |
