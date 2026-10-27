---
type: version
version: 1.6
slug: guide-ovh-serveur
titre: Guide de déploiement adapté au vrai serveur OVH
branche: version/1.6-guide-ovh-serveur
base: main
mode: express
statut: terminee
date: 2026-10-27
---

# Version 1.6 — Guide de déploiement adapté au vrai serveur OVH

> **Terminée** · express · 3 fichiers · aucun code du projet touché

## Demande
- Pitch : « Crée une branch et mets à jour le document et garde le super simple stp, je dois pouvoir suivre ligne après ligne sans pression facilement », après la sortie du serveur (Ubuntu 26.04, nginx sur 80/443, pm2, Docker absent).
- À faire : guide propre à ce serveur (cas A seul, IP et comptes écrits), installation de Docker et certbot, commandes sans valeur à deviner ; reprendre le correctif des cases à cocher de la 1.5, resté hors de `main` (PR fusionnée avant le dernier commit).
- Hors périmètre : scripts de déploiement, `compose.yaml`, `deploy/README.md`.
- C'est fini quand : chaque bloc passe `bash -n`, les blocs recopiés sont identiques au dépôt, la page s'affiche avec des cases cliquables.

## Plan
Mode express : documentation seule. Fait : correctif 1.5 repris (cherry-pick), vue humaine réécrite, source mise à jour. Vérifié : syntaxe, copies, rendu.

## Résultat
- Fichiers : `hlyja/index.html` (cases cliquables sur les pages de doc, repris de la 1.5), `hlyja/technique/deploiement-ovh.humain.md`, `hlyja/technique/deploiement-ovh.md`
- Tests : suite non relancée (aucun fichier du projet modifié) · contrôles ciblés : 39 blocs `bash` → `bash -n` sans erreur ; bloc de contrôle réseau et site nginx identiques à `deploy/README.md` (`diff` vide) ; heredoc `.env` essayé (mode 600, secret généré) ; extraction des `server_name` essayée sur un exemple (commentaires, `_`, jokers et le site lui-même écartés) ; appli de doc : 80 cases, toutes cliquables, 39 blocs, aucun bloc cassé dans une liste.
- Non vérifié : noms des paquets sur Ubuntu 26.04 (site des paquets en erreur ; le guide les fait vérifier par `apt-cache policy` avant l'installation), menus OVH et Google Cloud, aucune commande jouée sur le serveur.
- Doc : page `technique/deploiement-ovh` mise à jour.
- Backlog : aucune fiche.

## Comment tester
`node hlyja/serve.mjs`, page « Déployer sur OVH et tester avec Google, pas à pas », la suivre sur le serveur.

## Changelog
- Modifié : le guide de déploiement est écrit pour le vrai serveur OVH (installation de Docker et certbot, nginx existant, deux comptes `ubuntu` et `deploy`).
- Corrigé : les cases à cocher des pages de documentation sont cliquables.
