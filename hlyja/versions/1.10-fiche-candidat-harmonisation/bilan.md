---
type: bilan
version: 1.10
statut: terminee
mode: complexe
type_version: livrable
score: 93
tours: 2
taches_ok: 7
taches_echec: 0
qa_taux: 100
date: 2026-10-28
---

# Bilan — Version 1.10

> **Terminée** · Reprise de la branche de Léo, rejouée sur `main` · spec validée à 93/100 en 2 tours (69 au tour 1) · 7/7 tâches ok · QA 96 % puis 100 % après correction · aucun bloquant
> **Avant de merger** : partie A du guide de test (Mac, ~15 min) puis **partie B sur le serveur** (nginx, ~10 min) : sans elle, aucun CV de plus de 1 Mo ne passerait en production. Après le merge : partie C (~10 min).
> `tools/e2e-serveur.py` finit sur `ÉCHECS` à cause d'un seul `FAIL` qui existe déjà sur `main` (fiche [1.9-1](../../backlog/1.9-1-depart-page-put-lent-409.md)).

## Résultat
| Étape | Résultat |
|---|---|
| Reprise | 2 commits de Léo rejoués sur `main` (`b727ded`) : 4 conflits, tous dans la doc hlyja ; numéro 1.7 déjà pris → 1.10 (version, fiches 1.10-1 à 1.10-5) |
| Inventaire | 11 points (P1 à P11) : ce qui va (routes, effacement, sauvegardes, oauth2-proxy, suites) et ce qui ne va pas, dont 2 bloquants pour la production (retour vers la 1.9 refusé, nginx à 1 Mo) et 3 défauts reproduits dans le navigateur (doublon de candidat, fichier orphelin, 413 lu comme une panne) |
| Spec | validée, 93/100, 2 tours ; 5 décisions de l'utilisateur (table sans changer `user_version`, nginx avant le merge, base de test v2 à recréer, nettoyage automatique des fichiers non cités, fermeture après la création) |
| Tâches | 7 ok, 0 échec |
| Revue de code | 0 bloquant ; 1 majeur (doc) et 6 mineurs corrigés, dont le DELETE d'un fichier encore cité (409 `fichier-cite`) ; 1 régression introduite par une correction (style de l'en-tête de la carte) trouvée à la revérification, corrigée, contrôlée ; 4 mineurs au backlog |
| Tests | `npm test` 85/85 sous Node 22 ; `test-store` `TOUT OK` ; `test-serveur` `TOUT OK (87 vérifications)` ; `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` `ALL OK` ; `e2e-serveur` 134 OK + 1 FAIL préexistant (1.9-1, aussi sur `main`) ; `docker compose build` code 0 ; bancs nginx et oauth2-proxy réels, aller-retour 1.9 → 1.10 → 1.9 avec le vrai code de `main`, restauration |
| Mutations | 37 : 6 base + 9 API + 7 API après la revue + 12 pages (e2e) + 3 QA ; toutes détectées au final ; 3 survivantes au premier essai : un test de concurrence non déterministe (remplacé), le cas portfolio de `fichier-cite` (ajouté), l'attente des enregistrements différés (code inutile, retiré) |
| QA | 26 scénarios, 24/25 puis 25/25 après correction de B1 (le rôle lecture voyait les actions des documents) ; 1 manuel (serveur réel) |
| Doc | 1 page produit créée (`fiche-candidat`), 6 pages techniques mises à jour, 3 termes du glossaire ; vues humaines par le rédacteur-relecteur |

## Ce qui va et ce qui n'allait pas dans la branche de Léo
| Ce qui allait | Ce qui n'allait pas (corrigé) |
|---|---|
| Fenêtre « Fiche du candidat », composant unique, 4 groupes, grille | Base passée en version 2 : la 1.9 ne démarrait plus dessus, le retour automatique du déploiement aurait échoué |
| Routes des fichiers : types vérifiés au contenu, 10 Mo, noms nettoyés, rôles, `nosniff` | nginx de production à 1 Mo : aucun CV de plus de 1 Mo ; l'exemple du guide n'avait pas le réglage |
| Effacement réel (base et WAL) après retrait et suppression | Un 413 de nginx s'affichait comme une panne réseau |
| Fichiers dans la base : inclus dans les sauvegardes de la 1.7 sans rien changer | Création : un envoi de CV raté puis un second clic créaient **deux** candidats |
| Aucune dépendance ajoutée ; suites existantes au vert | Dépôt et retrait : fichier gardé sans être cité, ou fiche qui citait un fichier effacé (« Ouvrir » → 404) |
| Interface : largeur commune, Notes, EC1, EC2, Bilans, État, noms, RGPD 22 mois | Lien collé `javascript:` rendu cliquable (faille introduite par la branche) |
| | Procédure de restauration cassée sur les copies d'avant la 1.10 (si la table avait été comptée) |
| | Description de la branche en partie périmée (« schéma v2 », noms complets) ; doc hlyja écrite pour une 1.7 parallèle |

## Tester en local
```bash
git switch version/1.10-fiche-candidat-harmonisation
cd api && npm ci && npm test; cd ..
```
Puis suivre `qa/guide-test-humain.md` (parties A, B, C).

## Reste à faire avant de merger
- Partie A du guide sur le Mac.
- **Partie B du guide sur le serveur** (sauvegarde, `client_max_body_size 10m;`, preuve par un envoi de 2 Mo), par Sofiane ou Léo.
- Prévenir Léo que sa base locale de test (version 2) est à recréer.

## Réserves
Aucune.

## Écarts avec la spec
- R6 étendue après la revue de code : le DELETE d'un fichier encore cité est refusé (409 `fichier-cite`) ; c'est la tenue de l'invariant de R6 (P4 du chef d'équipe), ajouté au contrat de la spec finale.
- Accessibilité : l'annonce des messages par un lecteur d'écran n'a été vérifiée qu'en automatique (zone `aria-live` présente, message écrit au tour suivant) ; l'écoute VoiceOver reste facultative (guide).
- CA17 : le contrôle e2e qui échoue est celui de la fiche 1.9-1 (et non un contrôle instable, 1.10-3) : préexistant, même message sur `main`.

## Tâches en échec
Aucune.

## Changelog
- Ajouté : dépôt du CV et du portfolio en fichier (PDF, PNG, JPG, 10 Mo), gardés dans la base de l'équipe avec la candidature, ouverts dans un nouvel onglet, effacés avec elle et notés dans l'historique.
- Ajouté : bouton « Ouvrir Yeita Match en ligne » en visio et « Ouvrir la feuille de décompte » en présentiel dans l'EC1 ; partie interne de la carte dans les Bilans ; mention de séniorité sous le barème de l'EC2.
- Modifié : « Ajouter un candidat » ouvre la fenêtre Fiche du candidat (« Passer à l'appel de découverte », « Enregistrer et revenir à la liste ») ; un seul composant de fiche partout ; une seule largeur pour toutes les étapes, Notes à côté dès 1360 px.
- Modifié : grille de salaire en icône, palier sur une ligne ; noms tels que saisis, initiales sur le kanban ; conservation annoncée de 22 mois.
- Retiré : liens utiles de l'appel ; « Liens et outils » de l'EC1 et de l'EC2 (avec « Tout déplier », « Copier pour Notion », « Vider la fiche ») ; sélecteur d'État dans les étapes ; ancien formulaire d'ajout.
- Corrigé : un candidat n'est jamais créé deux fois, même si l'envoi du CV échoue ; un CV n'est jamais gardé en douce ni cité alors qu'il a été effacé ; un fichier refusé par le serveur du site le dit clairement ; un compte en lecture n'a aucune action sur les documents.
- Technique : table `fichiers` ajoutée à la base sans changer sa version (retour vers la 1.9 possible) ; l'API refuse un dossier qui cite un fichier absent et le retrait d'un fichier cité, et efface les fichiers non cités après une heure ; guide de mise en production avec une partie « avant le merge » (nginx) ; restauration compatible avec les copies d'avant la 1.10.

## Backlog
- Ajoutées : [1.10-6](../../backlog/1.10-6-journal-retrait-fichier.md) retrait de fichier noté au journal, [1.10-7](../../backlog/1.10-7-extraire-cv-copie.md) extraire un CV d'une copie, [1.10-8](../../backlog/1.10-8-nginx-corps-sur-disque.md) corps des envois sur le disque de nginx, [1.10-9](../../backlog/1.10-9-fichier-choisi-non-envoye.md) fichier choisi affiché comme déposé, [1.10-10](../../backlog/1.10-10-fichiers-servis-sans-csp.md) CSP des fichiers servis, [1.10-11](../../backlog/1.10-11-code-mort-ec2-libelles.md) code mort de l'EC2, [1.10-12](../../backlog/1.10-12-constantes-fichiers-dupliquees.md) constantes dupliquées, [1.10-13](../../backlog/1.10-13-fichiers-non-cites-sans-enregistrement.md) fichiers non cités d'un dossier qui ne change plus, [1.10-14](../../backlog/1.10-14-lecture-seule-champs-modifiables.md) champs modifiables affichés au rôle lecture ; et de Léo : [1.10-1](../../backlog/1.10-1-onboarding-hors-funnel-candidature.md), [1.10-2](../../backlog/1.10-2-purge-rgpd-22-mois.md), [1.10-3](../../backlog/1.10-3-tests-depart-page-instables.md).
- Nouvelles occurrences : [1.9-1](../../backlog/1.9-1-depart-page-put-lent-409.md) (échec e2e reproduit 3 fois sur 3 sur `main`), [1.1-9](../../backlog/1.1-9-fichiers-sans-usage-publies.md) (`Claude outputs/` publié, priorité moyenne).
- Traitées par cette version : [1.10-4](../../backlog/1.10-4-acces-feuille-decompte.md) → fait, [1.10-5](../../backlog/1.10-5-noms-complets-equipe.md) → fait (par Léo).

## Couverture de la doc
| Élément | Page |
|---|---|
| R1 à R21 (spec) | [Fiche du candidat, CV et portfolio](../../doc/produit/fiche-candidat.md#règles-métier) |
| Table `fichiers`, `user_version`, règle d'ajout | [API](../../technique/api.md) |
| Routes des fichiers, PUT (références, nettoyage), DELETE (`fichier-cite`) | [API](../../technique/api.md) |
| Adaptateur (`deposer`, `fichiers`, `retirerFichier`), ordres de dépôt et de retrait, création | [Mode serveur](../../technique/mode-serveur.md) |
| Décisions (fichiers dans SQLite, ajout sans changer de version) | [Décisions](../../technique/decisions.md) |
| nginx, taille des copies | [Architecture](../../technique/architecture.md) |
| Avant le merge, retour avant la 1.10 | [Mettre à jour le site en production](../../technique/mise-a-jour-production.md) |
| Tests et verdicts | [Conventions](../../technique/conventions.md) |
