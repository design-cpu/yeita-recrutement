---
type: revue-code
version: 1.7
objet: reprise du 2026-10-28
bloquants: 0
majeurs: 0
mineurs: 12
statut: corrigee
date: 2026-10-28
---

# Revue de code et sécurité — reprise

> Sous-agent indépendant, sur `git diff 34e0f58..HEAD` (20 fichiers hors `hlyja/`). Verdict : approuvé avec réserves mineures. Aucune dépendance ; contrôle du rôle admin après l'autorisation commune ; aucun chemin contrôlable ; aucune donnée de candidat exposée ; page sans XSS (`textContent`) ; JSON des scripts sans valeur injectable ; `npm test` 58/58 ; shellcheck sans remarque.

| # | Sév. | Constat | Traitement |
|---|---|---|---|
| 1 | faible | `CLE-SAUVEGARDE.md` : `echo … >> .env` sans contrôle de la clé, sans copie, et collé à la dernière ligne si `.env` ne finit pas par un saut de ligne | **corrigé** : clé contrôlée (`age1…`), copie `.env.avant-cle`, saut de ligne garanti, message « RIEN N'A ÉTÉ CHANGÉ » sinon ; essayé (fichier sans saut de ligne final, clé invalide) ; même commande dans le guide (B4) |
| 2 | faible | Commentaire des unités « sans jamais démarrer Docker » faux avec `docker.socket` | **corrigé** : commentaire exact ; `METTRE-A-JOUR.md` : arrêter les minuteries avant d'arrêter Docker |
| 3 | faible | Commentaire `TimeoutStopSec` périmé (curl) | **corrigé** |
| 4 | faible | `tools/test-sauvegarde.sh` : boucle d'un seul tour (SC2043) | **corrigé** |
| 5 | info | `ecrire_etat` interpole `$1` dans `sh -c` | **corrigé** : nom refusé s'il n'est pas `[a-z.-]+` |
| 6 | info | Sortie de `docker compose run` jetée ; message « Docker ne répond pas » parfois faux | **corrigé** : 3 dernières lignes d'erreur gardées dans le journal ; message « docker compose run a échoué » |
| 7 | info | Date dans le futur : motif « plus de 26 heures » trompeur, non testé | **corrigé** : motif « date dans le futur : l'horloge du serveur est peut-être fausse » ; test ajouté |
| 8 | info | Tutoiement et vouvoiement mêlés ; « me transmettre » sans destinataire | **corrigé** : tutoiement partout ; « à la personne responsable du site » |
| 9 | info | Clé privée en clair dans le `.txt`, sans phrase de passe | **laissé** : choix de l'utilisateur (fichier `.txt` en attendant un coffre) ; noté au bilan |
| 10 | info | `RESTAURER.md` : `tools/check-site.sh` en chemin relatif après `cd "$d"` | **corrigé** : `depot=$(pwd)` au début, `"$depot/tools/check-site.sh"` |
| 11 | info | IP du serveur et comptes SSH écrits dans les pages | **laissé** : déjà présents dans la doc existante (`deploiement-ovh.md`) ; noté au bilan |
| 12 | info | L'API lit `dirname(DB_PATH)/etat`, les scripts écrivent `/data/etat` | **corrigé** (documenté dans `api/README.md`) |
