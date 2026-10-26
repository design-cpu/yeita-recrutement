---
type: tache
version: 1.1
numero: 04
titre: Préparation du serveur
statut: ok
date: 2026-10-26
---

# Tâche 04 — Préparation du serveur

> **QA : réussie** · 1 fichier créé · 1 correction (reprise après un clone en échec)
> `deploy/prepare-serveur.sh` prépare le serveur une seule fois, vérifie tout avant d'agir et s'arrête sans rien changer au moindre doute.

## Ce que ça change
L'administrateur lance une commande avec `sudo` et la clé SSH du compte de déploiement. Le script contrôle les outils, le port 4180, le sous-réseau 172.30.0.0/24, l'utilisateur `deploy` existant, les conteneurs d'un autre projet « recrutement », puis seulement crée l'utilisateur, ajoute la clé, clone le dépôt (par `deploy`) et crée le dossier des sauvegardes. Relancé, il ne change rien.

## Comment tester
Banc d'essai R23 (ci-dessous), puis `env RECRUTEMENT_REPO=/srv/depot.git /root/prepare-serveur.sh "$(cat /root/cle-test.pub)"`.
Résultat attendu : « Serveur prêt », code 0 ; seconde exécution identique.

## Critères d'acceptation
- [x] CA8 — arrêt sans modification (Docker absent, 4180 pris par un conteneur ou par un processus, `deploy` hors groupe docker, conteneur `recrutement` d'un autre dossier, sous-réseau qui chevauche, clé invalide, dépôt d'une autre origine) ; `sudo -u deploy git -C /opt/recrutement status` réussit ; seconde exécution identique

## Ce qui a été fait
- `deploy/prepare-serveur.sh` : vérifications (outils `docker`, `docker compose`, `git`, `flock`, `ss`, `ip`, `curl`, `ssh-keygen`, `useradd`, `runuser` ; groupe `docker` ; clé sur une ligne et valide ; conteneurs `recrutement` d'un autre dossier ; port 4180 par `docker ps` et `ss` ; chevauchement de sous-réseau avec les réseaux Docker et les routes, calcul en entiers ; utilisateur ; dossier ; sauvegardes), puis modifications.
- Écart avec la spec : « ressource du projet d'un autre dossier » vérifiée sur les **conteneurs** seulement. Compose ne pose pas l'étiquette de dossier sur les réseaux ni les volumes (vérifié : `docker network inspect recrutement_edge`, `docker volume inspect recrutement_caddy_data`). Un réseau étranger qui gênerait est de toute façon arrêté par le contrôle du sous-réseau.
- `RECRUTEMENT_REPO` : URL du dépôt réglable (défaut GitHub), pour le banc.
- `runuser` plutôt que `sudo` (util-linux, présent sur toute Debian/Ubuntu).
Fichiers : `deploy/prepare-serveur.sh`
Commits : `21a6979` feat(deploiement-ovh): tâche 04 – deploy/prepare-serveur.sh ; `afe67b6` fix(deploiement-ovh): tâche 04 – reprise après un clone en échec

## Résultat QA
| Vérification | Résultat |
|---|---|
| Docker absent (`/usr/bin/docker` renommé) | ok : « ARRÊT : « docker » est absent… », code 1, rien créé |
| 4180 publié par un autre conteneur | ok : arrêt, conteneur nommé |
| 4180 écouté hors Docker (`nc` en réseau hôte) | ok : arrêt, ligne `ss` affichée |
| `deploy` existant hors groupe docker | ok : arrêt, rien créé |
| Conteneur `recrutement` d'un autre dossier | ok : arrêt (`etranger /ailleurs`) |
| Réseau 172.30.0.0/16 existant | ok : arrêt (chevauchement) |
| Clé invalide / sans argument | ok : code 1 / code 2 |
| Dépôt présent d'une autre origine | ok : arrêt |
| Préparation réelle | ok : utilisateur, clé (600), `.ssh` (700), `/opt/recrutement` (deploy, 755), `/var/backups/recrutement` (deploy, 700) |
| Seconde exécution | ok : `id`, empreinte de `authorized_keys`, `stat`, `HEAD` identiques |
| `sudo -u deploy git status` | ok |
| `shellcheck` 0.10.0 | ok (0 remarque) |
Corrections : le premier essai du banc a fait échouer le clone (dépôt nu du banc appartenant à root). Le script laissait `/opt/recrutement` vide et la relance s'arrêtait (« n'est pas un dépôt git »). Corrigé : un clone en échec retire le dossier vide ; un dossier vide de `deploy` est repris. Revérifié : clone en échec → dossier retiré ; relance après correction → code 0.

## Spec couverte
R16, R23 ; CA8
## Banc d'essai (R23)
Commandes, sur le poste (rien sur le serveur) :
```bash
git clone --bare . <tmp>/depot.git && git -C <tmp>/depot.git branch -f main version/1.1-deploiement-ovh && git -C <tmp>/depot.git symbolic-ref HEAD refs/heads/main
docker run -d --privileged --name banc -v /var/lib/docker ubuntu:24.04 sleep infinity
docker cp <tmp>/depot.git banc:/srv/depot.git
docker exec banc sh -c 'apt-get update && apt-get install -y docker.io docker-compose-v2 iproute2 util-linux openssh-client git curl sudo && (dockerd >/var/log/dockerd.log 2>&1 &)'
docker exec banc sh -c 'chmod -R a+rX /srv/depot.git && git config --system --add safe.directory /srv/depot.git && ssh-keygen -q -t ed25519 -N "" -f /root/cle-test'
```
`safe.directory` est propre au banc : le dépôt nu y appartient à root ; sur le serveur, le clone vient de GitHub en HTTPS. Docker 29.1.3, stockage `overlayfs` (containerd).
