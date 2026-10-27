---
type: version
version: 1.5
slug: guide-deploiement-ovh
titre: Guide pas à pas pour déployer sur OVH et tester avec Google
branche: version/1.5-guide-deploiement-ovh
base: main
mode: express
statut: terminee
date: 2026-10-27
---

# Version 1.5 — Guide pas à pas pour déployer sur OVH et tester avec Google

> **Terminée** · express · 2 pages de doc · aucun code touché

## Demande
- Pitch : « une page rapide dans la documentation […] qui détaille tout ce dont j'ai besoin de manière simple et efficace pour déployer sur OVH et tester avec Google […] toutes les étapes sans réfléchir, avec des todos, super simple ».
- À faire : une page `technique/deploiement-ovh` (source + vue humaine en checklist autonome : commande, « Tu dois voir », « Sinon »).
- Hors périmètre : toute modification des scripts, de `compose.yaml` ou de `deploy/README.md`.
- C'est fini quand : la page couvre DNS OVH → préparation → client Google → `.env` → déploiement → contrôle API → premier admin → tests Google, et les blocs recopiés sont identiques à ceux du dépôt.

## Plan
Mode express choisi d'office : documentation seule, aucune logique. Fait : les deux pages. Vérifié : blocs recopiés comparés au dépôt. Pas fait : aucun test de code (rien ne change).

## Résultat
- Fichiers : `hlyja/technique/deploiement-ovh.md`, `hlyja/technique/deploiement-ovh.humain.md`
- Tests : suite non relancée (aucun fichier du projet modifié) · contrôles ciblés : bloc de contrôle réseau identique à `deploy/README.md` (`diff` vide), exemple nginx identique (`diff` vide), `bash -n` du bloc → syntaxe OK ; libellés `Connecté·e : ` et `Tu ne fais pas partie de l'équipe.` relus dans `assets/wording.fr.js` ; sorties `Serveur prêt.`, `· API saine.`, `Tout est OK sur …`, `Déploiement réussi : …` relues dans les scripts.
- Non vérifié : les écrans de l'espace client OVH et de la console Google Cloud (libellés de menus décrits de mémoire, susceptibles de bouger).
- Doc : page ajoutée.
- Backlog : aucune fiche.

## Comment tester
`node hlyja/serve.mjs`, ouvrir la page technique « Déployer sur OVH et tester avec Google, pas à pas », la suivre sur le serveur.

## Changelog
- Ajouté : guide pas à pas (checklist) pour la première mise en ligne sur OVH et le test de la connexion Google.
