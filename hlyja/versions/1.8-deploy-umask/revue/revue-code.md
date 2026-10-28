---
type: revue-code
version: 1.8
bloquants: 0
majeurs: 0
mineurs: 4
date: 2026-10-28
---

# Revue de code et sécurité — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> Aucun bloquant ni majeur ; 4 mineurs notés, non traités (mode standard). Les mineurs 2 et 3 sont du travail déjà prévu à l'étape Documentation.

## Dépendances
Aucune ajoutée (diff des manifestes, Dockerfiles et `compose.yaml` vide). Code touché : `deploy/deploy.sh` (+2), `deploy/README.md` (+2).

## Sécurité
`umask 022` ne rend lisible rien qui devait rester privé : c'est le masque que la doc demandait déjà. Le verrou `$HOME/.recrutement-deploy.lock` est créé en 644 s'il n'existe pas : il est vide et `/home/deploy` est en 750. Les fichiers `.git/` et les fichiers suivis passent en 644 ou 444 (dépôt public, `.git/config` sans secret). `.env` n'est jamais réécrit (ignoré par git, et `git status --porcelain` arrête le script). Pas d'interaction avec les `umask 077` de `backup.sh` (l. 50) et `commun.sh` (l. 31) : ce sont des processus séparés.

## Qualité et réinvention
Ligne placée avant la première écriture (verrou l. 35), avec un commentaire dans le style du fichier ; essai du masque relancé (`0022`, appelant `077`) ; shellcheck 0.10.0 : code 0 ; `README.md` § 9 cohérent avec § 9b, § 10 et `METTRE-A-JOUR.md` § 2 ; la fiche de tâche porte les lignes de verdict.

| # | Sévérité | Fichier:ligne | Constat | Proposition | Dans le diff ? | Suite |
|---|---|---|---|---|---|---|
| 1 | mineur | `deploy/deploy.sh:151` (`echec`), `deploy/METTRE-A-JOUR.md:43`, spec R5 | Exception à R5 : un retour arrière vers un commit d'avant la 1.8 qui échoue laisse sur le disque le `deploy.sh` d'avant la 1.8 ; la commande de retour affichée, lancée sans préfixe sous `umask 077`, réécrit en 600. Rare ; couvert en principe par la phrase de `README.md` § 9. | Préciser R5 ou ajouter un préfixe conditionnel dans `METTRE-A-JOUR.md` § 4. | oui | noté en revue ; relevé aussi par la QA (écart entre la vue humaine et `METTRE-A-JOUR.md` § 4) : traité après la QA (exception ajoutée à `METTRE-A-JOUR.md` § 4 et à la source `mise-a-jour-production.md`) |
| 2 | mineur | `hlyja/technique/mise-a-jour-production.md:19` | Numéros de ligne décalés de 2 ; mention « contournement de la fiche 1.7-1 ». | Étape Documentation (R4, CA5). | oui | prévu |
| 3 | mineur | `hlyja/technique/deploiement-ovh.md:22`, `:33` | « l. 35-52 » et « l. 120-132 » décalés de 2. | Étape Documentation. | oui | prévu |
| 4 | mineur | `deploy/deploy.sh:35` | Verrou en 644 ou 600 selon le premier script qui le crée ; sans effet pratique. | Rien à faire. | non | non retenu |

## Revérification
Sans objet : aucune correction.
