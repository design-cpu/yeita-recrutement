---
type: technique
page: decisions
titre: Décisions techniques
maj: 1.0
commit: 99657f4
sources: docs/backend/MODELE.md, assets/dossier.js, CONTRIBUER.md
date: 2026-10-26
---

# Décisions techniques

> Les choix d'architecture qui orientent le dépôt, avec ce qu'ils écartent. Une décision remplacée reste listée.

| Décision | Contexte | Choix | Écarté | Conséquences | Version |
|---|---|---|---|---|---|
| Stockage et authentification | L'espace Candidatures doit être partagé entre recruteurs et réservé à l'équipe | SQLite sur le serveur OVH de Yeita ; authentification oauth2-proxy, SSO Google réservé aux comptes @yeita.fr ; portés par Sacha sur sa branche (23 octobre 2026) | Supabase (Postgres, RLS, lien e-mail), Firebase, API Notion, base partagée de l'artefact Claude | Les pages ne changent pas : le stockage se branche par `DOSSIER.use(adaptateur)` (`assets/dossier.js`), contrat dans `docs/backend/MODELE.md`. Jusqu'au déploiement, tout vit dans le navigateur, données fictives uniquement | 1.0 |
| Retrait du code Supabase | La piste Supabase, préparée mais jamais chargée par une page, est abandonnée | Suppression de l'adaptateur, du branchement, du schéma, de la mise en place, de leurs tests et de `STORAGE.md` | Garder les fichiers « pour mémoire » dans l'arbre | Référence pour la version 4 : le dernier commit de `main` qui contient `assets/adapter-supabase.js` est **`a86b6f4`** (contenu inchangé depuis `f11d015`). Lire avec `git show a86b6f4:assets/adapter-supabase.js` ; idem pour `assets/backend.js`, `docs/backend/schema.sql`, `docs/backend/README.md`, `docs/backend/test-schema.mjs`, `tools/test-adapter.js`, `tools/e2e-backend.py`, `STORAGE.md` | 1.0 |
| Source de vérité | Le dépôt était le miroir publié de l'artefact Claude « Expérience Collaborateur » | Le dépôt est la seule source de vérité ; chaque changement passe par une branche et une pull request vers `main` | Recopier les fichiers depuis l'artefact | `README.md` § « Mettre à jour » ; `CONTRIBUER.md` § « Proposer un changement » | 1.0 |
