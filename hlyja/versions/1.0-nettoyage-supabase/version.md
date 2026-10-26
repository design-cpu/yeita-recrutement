---
type: version
version: 1.0
slug: nettoyage-supabase
titre: Nettoyage de la piste Supabase abandonnée
branche: version/1.0-nettoyage-supabase
base: main
mode: express
statut: en-cours
date: 2026-10-26
---

# Version 1.0 — Nettoyage de la piste Supabase abandonnée

> **En cours** · express

## Demande
- Pitch : « Nettoyer le dépôt de la piste Supabase abandonnée le 23 octobre 2026. »
- À faire : supprimer `assets/backend.js`, `assets/adapter-supabase.js`, `docs/backend/schema.sql`, `config.example.js`, `test-schema.mjs`, `README.md`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md` ; retirer de `docs/backend/MODELE.md` les mentions de Supabase et de `tools/test-adapter.js` sans rien changer d'autre au modèle ; mettre à jour `README.md` (tableau des tests, « Comment les fiches se parlent », « Mettre à jour » : le dépôt est la seule source de vérité, on travaille par branche et pull request).
- Hors périmètre : toute page HTML, `assets/dossier.js`, `assets/store.js`, toute autre évolution.
- C'est fini quand : les 9 fichiers sont supprimés ; aucune mention de Supabase ni de `test-adapter` dans `MODELE.md` et `README.md` ; le hash du dernier commit contenant `assets/adapter-supabase.js` est noté ; la suite de tests restante passe ; la branche est poussée.

## Niveau
Express, appliqué sans réponse attendue : suppression de fichiers qu'aucune page ne charge (vérifié par `grep`) et texte de documentation ; aucune logique des pages ne change ; la suite existante suffit.

## Plan d'équipe
Fait par l'orchestrateur : suppressions, `MODELE.md`, `README.md`. Vérifié : `grep` des références restantes, `test-store.js` et les 4 tests de navigateur sur le site construit. Première exécution de Hlýja sur le dépôt : référentiel initial réduit aux pages utiles à ce sujet.
