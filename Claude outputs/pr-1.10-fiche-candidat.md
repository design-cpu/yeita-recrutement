# 1.10 — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

Branche `version/1.10-fiche-candidat-harmonisation` → `main`. Reprise de la branche `feat/fiche-candidat-harmonisation` de Léo (2 commits rejoués sur `main`), rendue déployable.

- [ ] **Fait sur le serveur avant de merger** : `deploy/METTRE-A-JOUR.md` § 5, « 1.10 — avant le merge » (sauvegarde, `client_max_body_size 10m;`, preuve : un envoi de 2 Mo répond `401`, pas `413`). Sans cela, aucun CV de plus de 1 Mo ne passe en production.

## Ce qui change
- « Ajouter un candidat » ouvre la fenêtre « Fiche du candidat » (« Passer à l'appel de découverte », « Enregistrer et revenir à la liste ») ; un seul composant de fiche partout (4 groupes, grille de 3 colonnes).
- CV et Portfolio : un fichier déposé (PDF, PNG, JPG, 10 Mo, gardé dans la base avec la candidature, effacé avec elle, noté dans l'historique) ou un lien.
- Étapes harmonisées : une seule largeur (1120 px), Notes à côté dès 1360 px ; appel sans liens utiles ; EC1 et EC2 sans « Liens et outils » ; bouton du jeu en ligne (visio) et de la feuille de décompte (présentiel) ; grille de salaire en icône ; partie interne de la carte dans les Bilans ; plus de sélecteur d'État dans les étapes ; RGPD 22 mois.

## Ce que la reprise a corrigé
- La base reste en `user_version` 1 (table ajoutée sans changer de version) : la 1.9 relit la base, le retour automatique du déploiement marche.
- Un candidat n'est jamais créé deux fois, même si l'envoi du CV échoue.
- Une fiche ne cite jamais un fichier absent, et un fichier n'est jamais gardé en douce : ordre envoi → enregistrement → retrait, état d'avant après un échec ; l'API refuse une référence absente et le retrait d'un fichier cité, et efface les fichiers non cités après une heure.
- Le 413 de nginx est expliqué ; un lien `javascript:` n'est plus cliquable ; un compte en lecture n'a aucune action sur les documents.
- Guide de mise en production (« avant le merge ») et procédure de restauration compatibles.

## Tests
`cd api && npm test` : 85/85 (Node 22). `test-store` et `test-serveur` : `TOUT OK`. `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` : `ALL OK`. `e2e-serveur` : 134 OK et 1 FAIL déjà présent sur `main` (backlog 1.9-1). Détail : `hlyja/versions/1.10-fiche-candidat-harmonisation/bilan.md`.

## Pour tester
`hlyja/versions/1.10-fiche-candidat-harmonisation/qa/guide-test-humain.md` (Mac, serveur avant le merge, site après le merge). Une base locale de test créée avec la branche de Léo (version 2) est à recréer.
