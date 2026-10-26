---
type: version
version: 1.1
slug: deploiement-ovh
titre: Déploiement de l'espace Candidatures sur le serveur OVH, derrière Google
branche: version/1.1-deploiement-ovh
base: main
mode: complexe
type_version: livrable
statut: terminee
date: 2026-10-26
---

# Version 1.1 — Déploiement de l'espace Candidatures sur le serveur OVH, derrière Google

> **Statut** : terminée · **Branche** : `version/1.1-deploiement-ovh`
> Objectif : rendre le site déployable sur le serveur OVH partagé de Yeita, dans Docker, l'espace Candidatures réservé aux comptes Google @yeita.fr, sans rien casser ni supposer des autres services du serveur.

## Objectif
Livrer de quoi construire, protéger, déployer et vérifier le site sur le serveur OVH : image Docker (build Python puis oauth2-proxy qui sert les fichiers), Compose avec Caddy en option, configuration sans secret, scripts de préparation et de déploiement, contrôle du site, mode d'emploi. Les données restent dans le navigateur.

## Pitch d'origine
Rendre l'espace Candidatures déployable sur le serveur OVH de Yeita, dockerisé, derrière une connexion Google réservée aux comptes @yeita.fr. Le serveur héberge déjà d'autres services (je n'ai pas encore la liste) : le déploiement ne doit rien casser ni rien supposer sur eux. Les données restent dans le navigateur à cette version.

Décisions déjà prises (ne pas les rediscuter) :
- Service front = docker/front.Dockerfile en deux étapes : python:3.12-slim lance python3 tools/build.py /site, puis l'image quay.io/oauth2-proxy/oauth2-proxy en dernière 7.15.x (tag figé) sert /site par une upstream file:///srv/site/#/.
- front publie le port 4180 sur 127.0.0.1 uniquement, jamais sur l'extérieur. Deux façons d'arriver jusqu'à lui :
  cas A, le serveur a déjà un reverse proxy (nginx, Caddy, Traefik…) : il gère le HTTPS de recrutement.yeita.fr et transmet à 127.0.0.1:4180 avec les en-têtes X-Forwarded-Proto et Host ;
  cas B, rien n'écoute sur 80 et 443 : un service caddy (image caddy:2, tag figé, certificat automatique, volumes caddy_data et caddy_config) activé par le profil Compose « caddy » (COMPOSE_PROFILES=caddy dans .env).
- Réseau Docker edge en 172.30.0.0/24 ; oauth2-proxy : reverse_proxy = true, trusted_proxy_ips = ["172.30.0.0/24"], email_domains = ["yeita.fr"], skip_provider_button = true. Vérifier que les requêtes du reverse proxy de l'hôte (cas A) arrivent bien depuis ce sous-réseau.
- Pages publiques sans connexion : le guide (/ et index.html), one-pager.html et yeita-match-kit.html (choix de Léo), les trois fichiers qu'ils chargent (assets/yeita.css, assets/yeita.js, assets/data-yeita-match.js) et telechargements/. Tout le reste est protégé, en particulier candidatures/ et les grilles d'évaluation de assets/ (data-diamants.js, data-employabilite.js).
- Configuration sans secret dans deploy/oauth2-proxy.cfg et deploy/Caddyfile (site {$DOMAIN}, reverse_proxy front:4180, en-têtes HSTS, nosniff, Referrer-Policy same-origin, X-Frame-Options DENY).
- Secrets dans .env (jamais commité) : DOMAIN, OAUTH2_PROXY_CLIENT_ID, OAUTH2_PROXY_CLIENT_SECRET, OAUTH2_PROXY_COOKIE_SECRET, OAUTH2_PROXY_REDIRECT_URL, COMPOSE_PROFILES. Un .env.example avec des valeurs d'exemple et la commande qui génère le cookie secret.
- Mode test local : cas B avec DOMAIN=localhost (certificat local de Caddy) et faux identifiants.
- tools/check-site.sh BASE_URL : one-pager 200, /index.html 200, /candidatures/ redirige vers Google, /assets/data-diamants.js redirige, /ping 200 ; code de sortie non nul en cas d'échec.
- deploy/prepare-serveur.sh, lancé une fois avec sudo, idempotent, prudent sur un serveur partagé : vérifie Docker et le plugin Compose (s'ils manquent : s'arrête avec un message, n'installe rien), vérifie que le port 4180 est libre, crée l'utilisateur deploy (groupe docker, clé SSH en argument), clone le dépôt public dans /opt/recrutement, crée /var/backups/recrutement en mode 700. Il ne touche ni au pare-feu, ni aux autres services, ni aux ports 80 et 443.
- deploy/deploy.sh, lancé par deploy, verrouillé par flock : git pull de main (ou checkout d'un commit passé en argument pour revenir en arrière), docker compose build --pull, up -d --remove-orphans, nettoyage limité aux seules images du projet (étiquetées, jamais un docker image prune global : le serveur est partagé), puis check-site.sh sur https://$DOMAIN.
- Chaque service limite ses journaux Docker (pilote json-file, 10 Mo, 3 fichiers), dans compose.yaml et non dans la configuration globale de Docker du serveur.
- deploy/README.md : le mode d'emploi du serveur, avec pour le cas A un exemple de configuration nginx et un exemple Caddy qui transmettent recrutement.yeita.fr à 127.0.0.1:4180, et la procédure prudente pour les ajouter : copie du fichier existant, validation (nginx -t ou caddy validate), rechargement sans redémarrage, retour arrière si un autre site ne répond plus.
- GitHub Pages n'est plus utilisé : supprimer .github/workflows/pages.yml ; dans assets/config.js, pagesCandidat.tonParcours devient https://recrutement.yeita.fr/one-pager.html.
- tools/build.py ne publie pas docker/, deploy/, compose.yaml, .dockerignore, .env.example ; .dockerignore exclut .git, hlyja, _site et .env.

Hors périmètre : base de données et API, sauvegardes, déploiement automatique, changement des pages, installation de Docker ou du pare-feu sur le serveur. Tu n'exécutes rien sur le serveur.

## Niveau
Complexe, recommandé et confirmé par l'utilisateur : nouvelles dépendances (Docker, oauth2-proxy, Caddy) et authentification. Toutes les décisions d'architecture sont prises par le pitch ; le jury juge leur mise en œuvre, pas leur choix.

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Cadre : aucune décision du pitch n'est rediscutée ; le jury juge la mise en œuvre (fidélité, oublis, risques sur un serveur partagé). Rien n'est exécuté sur le serveur : essais en local avec Docker Desktop (cas B, `DOMAIN=localhost`, faux identifiants).
- Jury de 4 + arbitre : Technique Docker/Compose (obligatoire), Sécurité et authentification, Exploitation sur serveur partagé, Testabilité et lecteur du mode d'emploi. Puis chef d'équipe P1 à P4, revue de code et sécurité (scripts shell, configuration oauth2-proxy et Caddy), QA, rédacteur-relecteur, curateur, validateur.
- Ordres de grandeur : spec 150 à 220 lignes ; 7 à 9 tâches ; ~14 fichiers (10 créés, 2-3 modifiés, 1 supprimé) ; 8 à 10 scénarios de QA ; doc : `technique/architecture.md` (nouvelle), `decisions.md`, `conventions.md`, mentions de GitHub Pages dans `README.md` et `CONTRIBUER.md`.
- Pas fait : nouveau test Playwright (les pages ne changent pas), vraie connexion Google (pas de vrais identifiants), cas A avec un nginx réel (exemple seulement), tests unitaires shell (bats), doc produit et glossaire (rien ne change pour les utilisateurs), `outillage.md` (scripts décrits dans `deploy/README.md`).
- Garde-fous : tout ajout hors pitch (CI de déploiement, supervision, pare-feu) va au backlog ; une vérification qui contredit le pitch est remontée à l'utilisateur, pas tranchée en silence.

## Liens
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
