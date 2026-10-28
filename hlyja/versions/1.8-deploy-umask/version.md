---
type: version
version: 1.8
slug: deploy-umask
titre: deploy.sh fixe lui-même le masque des fichiers qu'il écrit
branche: version/1.8-deploy-umask
base: main
mode: standard
type_version: livrable
statut: en-cours
date: 2026-10-28
---

# Version 1.8 — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> **Statut** : en cours · **Branche** : `version/1.8-deploy-umask`
> Objectif : un `deploy/deploy.sh` lancé depuis un shell à `umask 077` produit quand même des images que l'API et le site peuvent lire (fiche 1.7-1).

## Objectif
Corriger la fiche du backlog 1.7-1.

## Pitch d'origine
« Mets à jour le fichier et corrige le bug dans une nouvelle branch » (2026-10-28), sur la fiche 1.7-1 :

> `deploy/deploy.sh` ne fixe pas lui-même le masque des fichiers qu'il crée. Si la personne qui déploie a un shell réglé pour créer des fichiers privés (`umask 077`, ce que demandait la première version de la procédure des sauvegardes), `git pull` réécrit les fichiers modifiés en lecture pour leur seul propriétaire. Ces fichiers entrent tels quels dans les images, où l'API tourne sous un autre utilisateur (`node`) qui ne peut plus les lire : le déploiement casse l'API ou le site. […] Restent exposés tant que le script n'est pas corrigé : la commande de retour affichée par la fonction `echec` […] et `deploy/METTRE-A-JOUR.md` § 4 (l. 43 et 47).
>
> Où : `deploy/deploy.sh` (`main`, avant `git checkout` / `git pull`, l. 95-99) : ajouter `umask 022`. […] Le premier déploiement qui apporte la correction est lancé par l'ancien `deploy.sh` (lu en entier avant de changer de commit) : le `umask 022 &&` de ces pages doit rester au moins pour ce passage.

« Mettre à jour le fichier » : la fiche 1.7-1 a été actualisée au démarrage (§ 9 et § 10 de `deploy/README.md` déjà protégés, retours arrière d'urgence exposés, section « Observé » alignée sur la preuve reproduite).

## Niveau
Standard, recommandé et confirmé par l'utilisateur (2026-10-28) : une seule ligne, mais elle change l'état du processus de `deploy.sh` (ce n'est pas que du texte) ; ni modèle, ni dépendance, ni API, ni parcours.

## Point de départ
`main` (`b1f3567`), choisi par l'utilisateur ; `version/1.5-guide-deploiement-ovh` (1 commit d'avance) reste à part.

## Plan d'équipe
Écrit par le chef d'équipe au démarrage (détail : `pilote.md`).
- Étapes et sous-agents : cadrage court, vérifications ciblées (place du `umask 022`, numéros de ligne cités par la doc), spec courte, revue de spec (1 sous-agent technique et produit), réalisation, revue de code et sécurité (bloquants et majeurs), P4, QA indépendante (conteneur `ubuntu:26.04` privilégié avec son dockerd, lanceur à `umask 077` explicite), documentation et rédacteur-relecteur, curateur, bilan, validateur d'étonnements.
- Ordres de grandeur : spec de 40 à 70 lignes ; 3 ou 4 CA ; 1 ou 2 tâches ; 3 à 5 fichiers touchés (`deploy/deploy.sh` +1 à 3 lignes, `deploy/METTRE-A-JOUR.md`, `deploy/README.md` au besoin, 2 pages `hlyja/technique/`) ; 3 ou 4 scénarios de QA (mise à jour et retour arrière depuis `umask 077`, non-régression depuis `umask 022`, échec provoqué après le `git pull` puis relance de la commande de retour) ; 2 pages de doc Hlýja ; 0 mutation (aucun contrôle automatique ajouté).
- Pas fait : test automatique de `deploy.sh` (extension ; la QA en conteneur suffit) ; tests navigateur et API (aucun code produit ne change) ; retrait du `umask 022 &&` des pages (le premier déploiement qui apporte la correction est lancé par l'ancien script) ; `umask 077` de `backup.sh`, `verif-disque.sh`, `RESTAURER.md` (voulus) ; `chmod` ou `COPY --chmod` dans les Dockerfiles (extension) ; essai sous zsh macOS (aucun bloc concerné ne se lance sur le poste).

## Liens
- Fiche : ../../backlog/1.7-1-deploy-sans-umask.md
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
