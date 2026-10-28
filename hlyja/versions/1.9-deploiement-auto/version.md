---
type: version
version: 1.9
slug: deploiement-auto
titre: Déploiement automatique de main après les tests, avec page d'état et de demande
branche: version/1.9-deploiement-auto
base: main
mode: complexe
type_version: livrable
statut: en-cours
date: 2026-10-28
---

# Version 1.9 — Déploiement automatique de main après les tests, avec page d'état et de demande

> **Statut** : en cours · **Branche** : `version/1.9-deploiement-auto`
> Objectif : le serveur déploie seul, toutes les 10 minutes, le dernier commit de `main` dont les tests passent ; un admin suit les passages et demande un déploiement depuis `/admin/deploiement.html`.

## Objectif
Remplacer le déploiement manuel (`deploy/deploy.sh` lancé en SSH) par un passage automatique planifié par systemd, testé avant de déployer, avec une page d'administration qui montre les passages et permet de demander un déploiement, un retour arrière ou la reprise de l'automatisme.

## Pitch d'origine
Déployer automatiquement chaque nouveau commit de main, après les tests, sans GitHub Actions :
le serveur vérifie lui-même toutes les 10 minutes. deploy/deploy.sh fait déjà le déploiement.
Une page admin, sur le modèle de /admin/sauvegardes.html, montre les déploiements et permet d'en
demander un.

Décisions déjà prises (ne pas les rediscuter) :
- deploy/auto-deploy.sh : git fetch de main ; si origin/main est le commit déjà déployé ou le
  dernier commit en échec, et qu'aucune demande n'est en attente, ne rien faire. Sinon, lancer les
  tests sur le commit visé dans un répertoire séparé (git worktree temporaire, jamais dans le
  répertoire de prod) : node tools/test-store.js, npm test dans api/, docker compose build.
  Tests OK → deploy.sh <hash>. Tests KO → noter le hash comme en échec et ne pas déployer. Verrou
  (flock) : un seul passage à la fois ; une demande arrivée pendant un passage est traitée juste
  après (seule la plus récente compte).
- Pause : si le fichier deploy/PAUSE existe, le passage automatique (nouveau commit de main) ne
  fait rien ; les demandes explicites sont toujours traitées. Déployer un commit autre que le
  dernier de main (depuis la page ou par deploy.sh <hash> à la main) crée PAUSE ; le supprimer
  relance l'automatisme.
- Lancer auto-deploy.sh à la main = déployer tout de suite le dernier commit de main, avec les tests.
- Planification : timer systemd toutes les 10 minutes + unité path systemd qui lance auto-deploy.sh
  dès qu'une demande est déposée (deploy/systemd/recrutement-deploy.service, .timer, .path).
  Logs via journalctl. Commandes d'installation données dans le README.
- Demandes depuis la page : l'application ne fait qu'écrire une demande (hash ou « dernier de
  main », ou « reprendre l'automatisme », plus qui l'a faite et quand) dans un emplacement partagé
  avec l'hôte. Elle ne lance jamais de commande, n'a aucun accès à Docker ni à deploy.sh. Côté
  serveur, auto-deploy.sh valide la demande : hash au format ^[0-9a-f]{7,40}$ et présent dans
  l'historique de main, sinon refusée et enregistrée comme telle.
- Statut : chaque passage qui fait quelque chose enregistre date, déclencheur (automatique /
  demande de <qui> / ligne de commande), commit (hash court + message + auteur), branche, résultat
  global (déployé / tests KO / déploiement KO / demande refusée), et pour chaque étape
  (test-store, npm test, docker compose build, deploy.sh) : statut OK/KO/non lancée, durée, sortie
  (limitée aux 300 dernières lignes). Garder les 30 derniers passages. Reprendre exactement le
  mécanisme utilisé par la page sauvegardes (lire comment elle obtient son statut avant de coder)
  plutôt qu'en inventer un autre.
- Page /admin/deploiement.html, même style, même protection d'accès que sauvegardes.html :
  commit en ligne ; état de l'automatisme (actif / en pause) avec bouton « Reprendre » si en
  pause ; bouton global « Déployer maintenant » (dernier commit de main) ; indication d'une demande
  en attente ou d'un passage en cours ; liste des passages, le plus récent en haut. Chaque passage
  se déplie pour afficher ses étapes, chaque étape se déplie pour afficher sa sortie ; l'étape en
  échec est ouverte par défaut. Dans un passage dont les tests sont OK et qui n'est pas le commit
  en ligne, bouton « Déployer ce commit » avec confirmation (« les tests seront relancés ;
  l'automatisme sera mis en pause » si ce n'est pas le dernier de main). Boutons protégés comme
  les autres actions admin existantes (même contrôle d'accès, même protection CSRF s'il y en a une).
- README.md, section « Publier » : merge sur main = en ligne sous 10 minutes si les tests passent ;
  suivre et déployer = /admin/deploiement.html (détail : journalctl -u recrutement-deploy) ;
  revenir en arrière = « Déployer ce commit » sur la page ou deploy.sh <hash> en SSH (met en
  pause), puis « Reprendre » ; secours sans tests = deploy.sh.

Hors périmètre : GitHub Actions, environnement de préproduction, notifications par email ou
message, tout autre changement de l'application.

Décisions de l'utilisateur (2026-10-28) :
- Niveau complexe (recommandé).
- Base : `main` (la branche `version/1.5-guide-deploiement-ovh`, un commit de doc, reste à part).
- Déploiement KO pendant un passage : **retour automatique** au commit précédent (`deploy.sh <précédent>`, sans tests), commit noté en échec ; pas de pause.
- Demande visant un commit de main antérieur à la 1.9 (sans `deploy/auto-deploy.sh`) : **refusée** et enregistrée (« antérieur au déploiement automatique : deploy.sh <hash> en SSH »).

## Niveau
Complexe, recommandé et confirmé : nouvelle route d'API en écriture, nouveau parcours admin, script système qui déploie seul en production (sécurité de la frontière application → hôte, retour arrière).

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (verdict : ok ; détail : `pilote.md`).
- Étapes : cadrage → vérifications sur banc `ubuntu:26.04` jetable avec son dockerd, plus variante systemd en PID 1 (essai d'écriture de demande depuis le conteneur `api`, essai de requête intersite sur la nouvelle route, scénario de concurrence à deux passages : timer + path + `deploy.sh` à la main, l'un ralenti, l'un tué) → P1 → spec v1 → jury de 5 + arbitre, 3 tours max (Sécurité de la frontière application → hôte ; Exploitation systemd et verrous ; Déploiement et retour arrière ; Testabilité et concurrence ; Ergonomie de la page admin) → découpage → P3 → réalisation → revue de code et sécurité → P4 → QA en couches → doc → backlog → bilan → étonnements.
- Ordres de grandeur : spec de 170 à 230 lignes, 15 à 20 CA (avec le tableau « script qui se remplace » et le tableau des commandes de la page selon l'état) ; 8 à 10 tâches ; 15 à 19 fichiers touchés dont ~9 nouveaux ; hors code de production : 2 à 3 fichiers (test API, `tools/test-auto-deploy.sh` avec variable d'accord `…_JETABLE=oui`) ; `api/test` à 8 fichiers au plus ; 22 à 28 scénarios de QA dont un cycle complet sur le banc systemd ; 6 à 8 pages `technique/` plus `README.md`, `deploy/README.md`, `METTRE-A-JOUR.md` ; 15 à 22 mutations.
- Garde-fous : l'API n'écrit qu'une demande, l'hôte valide ; statut repris du mécanisme des sauvegardes ; worktree retiré même en échec ; échec provoqué puis relance ; tests depuis un état neutre ; shellcheck et `systemd-analyze verify` sans remarque ; mutations avec durée maximale ; ligne de verdict de chaque suite recopiée dans les fiches.
- Pas fait : GitHub Actions, préproduction, notifications (hors périmètre) ; aucun essai sur le serveur réel (première mise en route = étape du guide humain) ; pas de vraie connexion Google en QA (en-têtes d'oauth2-proxy) ; pas de nouveau mécanisme CSRF si l'essai intersite montre que la protection existante tient (sinon question à l'utilisateur avant la spec v1) ; pas de refonte de `deploy.sh` au-delà de la pause.

## Liens
- Cadrage : spec/cadrage.md
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
