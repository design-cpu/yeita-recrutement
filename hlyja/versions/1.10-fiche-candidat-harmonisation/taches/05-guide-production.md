---
type: tache
version: 1.10
numero: 05
titre: Mise en production et restauration
statut: ok
date: 2026-10-28
---

# Tâche 05 — Mise en production et restauration

> **QA : réussie** · 3 fichiers (`deploy/README.md`, `deploy/METTRE-A-JOUR.md`, `deploy/RESTAURER.md`) · 1 correction
> Le guide dit quoi faire sur le serveur avant de merger (nginx, sauvegarde), et la restauration marche avec les copies d'avant et d'après la 1.10.

## Ce que ça change
`METTRE-A-JOUR.md` dit en tête qu'une partie « avant le merge » se fait avant de cliquer Merge, et contient « 1.10 — avant le merge » (sauvegarde, relevé, copie du fichier du site, `client_max_body_size 10m;` dans le `server` 443, `nginx -t`, rechargement, preuve par un envoi de 2 Mo, autres sites inchangés) et « Revenir avant la 1.10 ». L'exemple nginx de `README.md` § 7 a la directive. `RESTAURER.md` affiche `fichiers=<n>` ou `fichiers=absente` et prévient qu'un fichier retiré depuis la copie revient avec elle.

## Comment tester
Lire `deploy/METTRE-A-JOUR.md` § 5, « 1.10 — avant le merge ».

## Critères d'acceptation
- [x] CA13 — étape et directive présentes ; introduction et § 1 renvoient à « avant le merge » ; blocs : `bash -n` et `zsh -n` sans erreur (6 blocs) ; bloc nginx de `README.md` § 7 : `nginx -t` réussi sur le banc (`nginx:1.28`, certificat jetable) ; preuve `curl` jouée sur le banc derrière le vrai `deploy/oauth2-proxy.cfg` : 2 097 152 o → `401`, 10 485 760 o → `401`, 10 485 761 o → `413`.
- [x] CA14 — `controle.mjs` : copie 1.9 → `… fichiers=absente …`, copie 1.10 → `… fichiers=1 …` ; commande `sqlite3` de l'étape 3 (zsh) : `fichiers absente (copie d'avant la 1.10)` puis `fichiers|1` ; `remplacer.mjs` accepte `user_version` 1 (inchangé).
- [x] R14 — mesure : 60 candidats et 60 fichiers (116 Mo de fichiers) → base 117,4 Mo, copie 117,4 Mo, copie chiffrée 117,5 Mo ; × 33 copies ≈ 3,9 Go (pour la doc).

## Ce qui a été fait
Voir « Ce que ça change ». Commits : `50a15ee` feat(fiche-candidat-harmonisation): tâche 05 – mise en production et restauration.

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA13 | ok (sorties ci-dessus) |
| CA14 | ok |
Corrections : l'adresse de la preuve `curl` contenait `?` sans guillemets (motif de fichier sous zsh) : mise entre apostrophes.

## Mutations
Aucun contrôle automatique ajouté (guide).

## Spec couverte
R2 (guide), R13, R14, R15, CA13, CA14
