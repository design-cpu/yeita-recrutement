---
type: technique
page: deploiement-ovh
titre: Déployer sur OVH et tester avec Google, pas à pas
maj: 1.5
commit: ea25fd3
sources: deploy/prepare-serveur.sh, deploy/deploy.sh, deploy/oauth2-proxy.cfg, compose.yaml, .env.example, tools/check-site.sh, api/src/app.js, assets/wording.fr.js
date: 2026-10-27
---

# Déployer sur OVH et tester avec Google, pas à pas

> Ordre des opérations d'une première mise en ligne sur un serveur OVH neuf (dépôt jamais cloné), avec les sorties attendues des scripts. La vue humaine est une checklist autonome (commandes recopiées, pas de renvoi) ; la référence complète reste `deploy/README.md`.

## Ordre
| # | Où | Action | Sortie attendue (lue dans le code) |
|---|---|---|---|
| 1 | poste | clé `~/.ssh/id_ed25519.pub` | ligne `ssh-ed25519 …` |
| 2 | espace client OVH | entrée **A** `recrutement` → IPv4 du serveur ; supprimer A/AAAA/CNAME existants | `dig +short recrutement.yeita.fr` = IP |
| 3 | serveur, admin | `docker version`, `docker compose version`, `ss -ltnp` sur 80/443 | aucun écouteur → cas B ; `nginx` → cas A ; autre → arrêt |
| 4 | serveur, admin | clone dans `mktemp -d`, `sudo prepare-serveur.sh "<clé>"` | `Serveur prêt.` (prepare-serveur.sh l. 163) ; échec : `ARRÊT : …` + `Rien n'a été modifié.` |
| 5 | console Google Cloud | projet dans l'organisation yeita.fr, audience **Interne**, client « Application Web », URI `https://recrutement.yeita.fr/oauth2/callback` | ID `….apps.googleusercontent.com` + secret |
| 6 | serveur, `deploy` | `.env` (DOMAIN, CLIENT_ID, CLIENT_SECRET, REDIRECT_URL, COOKIE_SECRET, COMPOSE_PROFILES `caddy` en B, vide en A) | contrôlé par `deploy.sh` l. 35-52 |
| 6 bis | serveur, admin, cas A | certbot + site nginx vers `127.0.0.1:4180` (exemple de `deploy/README.md` § 7) | `nginx -t` ok, autres sites inchangés |
| 7 | serveur, `deploy`, tmux | `deploy.sh` | `· API saine.`, 6 `OK`, `Tout est OK sur …`, `Déploiement réussi : …` ; échec : `ÉCHEC : …` + commande de retour |
| 8 | serveur, `deploy` | bloc de contrôle réseau de l'API (`deploy/README.md` § 9b, recopié tel quel) | 7 `OK`, `VERDICT : tout est bon.` |
| 9 | serveur, `deploy` | `docker compose exec api node api/equipe.js add <email> <Prénom> admin` | membre listé par `list` |
| 10 | navigateur + poste | public sans connexion ; `/candidatures/` → Google → `Connecté·e : <prénom>` ; `/api/moi` → `{email, prenom, role}` ; compte gmail refusé (Interne) ; `tools/check-site.sh https://recrutement.yeita.fr` → 6 `OK` | |

## Points à savoir
| Point | Détail |
|---|---|
| Premier déploiement sur serveur neuf | le clone est déjà sur un `main` qui contient l'API : `deploy.sh` attend lui-même `healthy` (l. 120-132) ; la mise en garde « premier déploiement lancé par une version sans API » de `deploy/README.md` § 9b ne s'applique pas |
| Cas B, aucune réponse | pare-feu : `ufw` du serveur ou pare-feu réseau OVH sur 80/443 |
| Secret client Google | affiché une seule fois à la création dans la console actuelle |
| Libellés cités | `Connecté·e : ` et `Tu ne fais pas partie de l'équipe.` (`assets/wording.fr.js` l. 36, 42) ; `/api/moi` (`api/src/app.js` l. 77) |
| Interdit sur le serveur | `docker compose down -v`, `docker volume prune` (volume `recrutement_data`, seule copie) |
