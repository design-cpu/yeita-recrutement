---
type: technique
page: decisions
titre: Décisions techniques
maj: 1.2
commit: 2497be9
sources: api/src/app.js, api/src/base.js, api/src/candidats.js, api/src/config.js, api/package-lock.json, docs/backend/MODELE.md, assets/dossier.js, CONTRIBUER.md, docker/front.Dockerfile, compose.yaml, deploy/oauth2-proxy.cfg, deploy/deploy.sh
date: 2026-10-26
---

# Décisions techniques

> Les choix d'architecture qui orientent le dépôt, avec ce qu'ils écartent. Une décision remplacée reste listée.
> v1.1 : hébergement Docker sur le serveur OVH derrière oauth2-proxy ; `reverse_proxy = false`.
> v1.2 : API de stockage Node.js sur SQLite, qui croit `X-Forwarded-Email` et n'écoute que sur 127.0.0.1 par défaut ; version optimiste ; effacement réel et journal purgé à la suppression.

| Décision | Contexte | Choix | Écarté | Conséquences | Version |
|---|---|---|---|---|---|
| Stockage et authentification | L'espace Candidatures doit être partagé entre recruteurs et réservé à l'équipe | SQLite sur le serveur OVH de Yeita ; authentification oauth2-proxy, SSO Google réservé aux comptes @yeita.fr ; portés par Sacha sur sa branche (23 octobre 2026) | Supabase (Postgres, RLS, lien e-mail), Firebase, API Notion, base partagée de l'artefact Claude | Les pages ne changent pas : le stockage se branche par `DOSSIER.use(adaptateur)` (`assets/dossier.js`), contrat dans `docs/backend/MODELE.md`. Jusqu'au branchement du stockage, tout vit dans le navigateur, données fictives uniquement (l'authentification est en place depuis v1.1 ; l'API de stockage SQLite existe depuis v1.2, pas encore branchée aux pages) | 1.0 |
| Retrait du code Supabase | La piste Supabase, préparée mais jamais chargée par une page, est abandonnée | Suppression de l'adaptateur, du branchement, du schéma, de la mise en place, de leurs tests et de `STORAGE.md` | Garder les fichiers « pour mémoire » dans l'arbre | Référence pour la version 4 : le dernier commit de `main` qui contient `assets/adapter-supabase.js` est **`a86b6f4`** (contenu inchangé depuis `f11d015`). Lire avec `git show a86b6f4:assets/adapter-supabase.js` ; idem pour `assets/backend.js`, `docs/backend/schema.sql`, `docs/backend/README.md`, `docs/backend/test-schema.mjs`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md` | 1.0 |
| Source de vérité | Le dépôt était le miroir publié de l'artefact Claude « Expérience Collaborateur » | Le dépôt est la seule source de vérité ; chaque changement passe par une branche et une pull request vers `main` | Recopier les fichiers depuis l'artefact | `README.md` § « Mettre à jour » ; `CONTRIBUER.md` § « Proposer un changement » | 1.0 |
| Hébergement et authentification | L'espace Candidatures doit être servi chez Yeita, réservé aux comptes @yeita.fr, sur un serveur OVH partagé dont les autres services sont inconnus | Image Docker `front` : `python:3.12-slim` construit le site, oauth2-proxy `v7.15.5` le sert (upstream `file://`) et impose Google `email_domains = ["yeita.fr"]` ; port 4180 sur 127.0.0.1 seulement ; HTTPS par le proxy existant (cas A) ou par un `caddy:2.11.7` du projet (cas B, profil Compose `caddy`) ; données toujours dans le navigateur | GitHub Pages (public), serveur web séparé derrière oauth2-proxy | Liste publique fermée dans `deploy/oauth2-proxy.cfg` ; `.env` hors dépôt ; scripts `deploy/prepare-serveur.sh` et `deploy/deploy.sh` qui vérifient tout avant d'agir ; `.github/workflows/pages.yml` supprimé | 1.1 |
| Pas de confiance dans les en-têtes de proxy | Avec `reverse_proxy = true` et `trusted_proxy_ips = ["172.30.0.0/24"]`, un `X-Forwarded-Uri` forgé depuis une adresse de confiance ouvre une page protégée ; toute requête locale au serveur arrive depuis 172.30.0.1 (vérifié, v1.1) | `reverse_proxy = false` (arbitrage de l'utilisateur, contre la décision initiale du pitch) | Garder `true` et réécrire l'en-tête dans chaque proxy (faille locale restante) ; confiance limitée à Caddy (faille locale restante en cas A) | Les journaux montrent l'adresse du proxy, pas celle du visiteur ; repasser à `true` exige que chaque proxy réécrive `X-Forwarded-Uri` (commentaire dans `deploy/oauth2-proxy.cfg`) | 1.1 |
| `/index.html` en 200 | Le serveur de fichiers d'oauth2-proxy (Go) redirige `/index.html` vers `/` (301) | Second upstream `file:///srv/site/#/index.html` (choix de l'utilisateur) | Accepter la redirection | `/` et `/index.html` servent le guide | 1.1 |
| API de stockage | Remplacer le stockage du navigateur par une base partagée, derrière oauth2-proxy | `api/` en Node.js 22 : Fastify 5.12.7, better-sqlite3 13.0.3, tests `node:test` ; dossier entier en JSON (`candidats.data`), aucune colonne tirée du JSON ; schéma appliqué au démarrage (`user_version`) ; équipe gérée par `node api/equipe.js` (décisions du pitch) | Colonnes tirées du JSON et tables de provenances et de recruteurs (proposition d'origine de `MODELE.md`, section remplacée) ; gestion de l'équipe par HTTP | Les pages restent inchangées jusqu'à l'adaptateur ; `MODELE.md` renvoie au contrat HTTP de `api/README.md` | 1.2 |
| Confiance dans `X-Forwarded-Email` | oauth2-proxy v7.15.5 retire un en-tête forgé (route publique ou protégée), mais un accès direct à l'API le laisse passer (vérifié, v1.2) | L'API croit l'en-tête, vérifie l'équipe à chaque requête ; écoute sur `127.0.0.1` par défaut, `HOST` pour la changer, avertissement sinon ; mode local (`DEV_EMAIL`, `DEV_STATIC`) refusé hors bouclage ou en production (choix de l'utilisateur pour `HOST`) | Écoute sur toutes les interfaces ; secret partagé entre proxy et API | Le port de l'API ne doit jamais être publié hors du réseau d'oauth2-proxy ; avec Google, l'email posé reste à vérifier (H1) | 1.2 |
| Conflits par version optimiste | Deux recruteurs écrivent le même dossier | Colonne `version` ; PUT `version: null` = création ; sinon mise à jour si la version lue est la bonne ; tout autre cas (version périmée, id existant, dossier supprimé) → 409 « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. » | Dernier écrit gagne ; 404 pour un dossier supprimé | L'adaptateur garde la version de l'enveloppe par id, distincte de `data.version` | 1.2 |
| Effacement réel | Un `DELETE` SQLite laisse le contenu lisible dans les fichiers (vérifié, v1.2) | `secure_delete = ON` et `wal_checkpoint(TRUNCATE)` après chaque écriture sur `candidats` (PUT, DELETE) ; à la suppression, journal du dossier purgé, une ligne `suppression` gardée (choix de l'utilisateur) | Garder tout le journal ; point de contrôle automatique seul | Un lecteur ouvert (sauvegarde, `sqlite3`) peut retarder l'effacement jusqu'à l'écriture suivante (avertissement journalisé) | 1.2 |
| Dépendances de moins de 14 jours | Fastify 5.12.5 a une faille faible ; ses correctifs et 9 dépendances transitives ont moins de 14 jours | Fastify 5.12.7 et lockfile gardé tel quel, exception notée (choix de l'utilisateur) | Versions de plus de 14 jours : 4 failles modérées de fast-uri | `npm audit` : 0 vulnérabilité au 26 octobre 2026 | 1.2 |

## Voir aussi
- [API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)

## Historique
| Version | Changement |
|---|---|
| 1.0 | Création : stockage, retrait de Supabase, source de vérité |
| 1.1 | Hébergement Docker derrière oauth2-proxy (l'authentification de la décision « Stockage et authentification » est en place ; le stockage SQLite reste à faire), `reverse_proxy = false`, `/index.html` en 200 |
| 1.2 | API de stockage, confiance dans `X-Forwarded-Email`, version optimiste, effacement réel, exception sur l'âge des dépendances |
