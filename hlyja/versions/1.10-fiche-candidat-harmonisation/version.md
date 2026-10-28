---
type: version
version: 1.10
slug: fiche-candidat-harmonisation
titre: Fiche du candidat, dépôt de fichiers et harmonisation des étapes (reprise de la branche de Léo)
branche: version/1.10-fiche-candidat-harmonisation
base: main
mode: complexe
type_version: livrable
statut: en-cours
date: 2026-10-28
---

# Version 1.10 — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> **Statut** : en cours · **Branche** : `version/1.10-fiche-candidat-harmonisation` (base `main` à `b727ded`)
> Objectif : rendre la branche `feat/fiche-candidat-harmonisation` de Léo fonctionnelle et déployable sur `main` (1.7 à 1.9 comprises), avec ses tests et sa documentation.

## Objectif
Reprendre le travail de Léo (2 commits, faits avant les versions 1.7 à 1.9 de `main`), le rejouer sur `main`, établir ce qui va et ce qui ne va pas, corriger ce qui empêche de le faire passer en production (déploiement automatique, retour arrière, sauvegardes, restauration, nginx), compléter les tests et mettre la doc hlyja à jour.

## Pitch d'origine
Demande de l'utilisateur (Sofiane), 2026-10-28 :
> J'ai une branch sur Github "feat/fiche-candidat-harmonisation". Elle a été faite par un collègue et elle apporte des modifications assez importantes. […] Je voudrais que tu la rebase avec la main dans une nouvelle branch avec une nouvelle version et que tu listes tout ce qui va et tout ce qui ne va pas, on va voir pour la faire passer.
> Il faut que son truc fonctionne et que ça puisse être déployé donc il va falloir écrire les tests, la doc dans ton dossier comme d'habitude.

Description de la branche par Léo (résumée ; texte complet : `Claude outputs/pr-1.10-fiche-candidat.md`) :
- Création = la fenêtre « Fiche du candidat » (« Passer à l'appel de découverte », « Enregistrer et revenir à la liste ») ; un seul composant avec le bloc de l'appel (4 groupes, grille de 3 colonnes).
- CV et Portfolio : « Déposer un fichier » ou « Coller un lien » ; fichier : nom, taille, « Ouvrir », « Retirer » ; lien : cliquable, « Modifier », « Retirer ».
- Stockage : table `fichiers` dans la base SQLite (schéma v2), 4 routes sous `/api/candidats/:id/fichiers`, PDF/PNG/JPG vérifiés sur leur contenu, 10 Mo, noms nettoyés, effacés avec le candidat, dépôt et retrait dans l'historique.
- Largeur commune 1120 px ; panneau Notes à côté dès 1360 px.
- Appel sans liens utiles ; EC1 sans « Liens et outils » (Tout déplier, Copier pour Notion, Vider la fiche), section « Yeita Match », bouton du jeu en ligne en visio, feuille de décompte en présentiel ; EC2 : grille de salaire en icône, palier sur une ligne, mention de séniorité, sans « Liens et outils » ; Bilans : partie interne sous la carte.
- Sélecteur d'État retiré des étapes ; noms tels que saisis partout, initiales sur la carte du kanban ; RGPD 22 mois.

## Décisions de l'utilisateur
| Date | Question | Réponse |
|---|---|---|
| 2026-10-28 | Niveau | Complexe |
| 2026-10-28 | Base | `main` (la branche `version/1.5-guide-deploiement-ovh`, non mergée, est ancienne et sans rapport) |
| 2026-10-28 | Retour arrière après la migration (une base v2 est refusée par l'API de la 1.9, reproduit) | Table `fichiers` ajoutée sans changer `user_version` (reste 1) : la 1.9 relit la base |
| 2026-10-28 | `client_max_body_size` du nginx de production (cas A) | Étape du guide de mise en production, appliquée sur le serveur par Sofiane ou Léo avant le merge |

## Reprise de la branche
| Étape | Commit | Note |
|---|---|---|
| Rejeu du commit 1 de Léo | `a8195d5` (origine `becf443`) | 4 conflits, tous dans la doc hlyja (`glossaire.md`, `technique/api.md`, `conventions.md`, `decisions.md`) : les deux côtés gardés |
| Rejeu du commit 2 de Léo | `7533be6` (origine `650c648`) | sans conflit |
| Renumérotation 1.7 → 1.10 | `69ec434` | le numéro 1.7 est pris sur `main` (`1.7-sauvegarde-base`) ; fiches `1.7-1` à `1.7-5` de Léo → `1.10-1` à `1.10-5` |

## Plan d'équipe
Écrit par le chef d'équipe (reprise de code existant : vérifier, corriger, tester, documenter).
- Étapes et sous-agents : cadrage (inventaire de ce qui va et ne va pas) → vérifications → P1 → spec v1 → jury de 5 + arbitre (3 tours au plus) → découpage → P3 → réalisation → revue de code et sécurité → P4 → QA en couches → doc → backlog → bilan → étonnements.
- Jury : Lead dev (API, SQLite, schéma), Sécurité et données personnelles, Ops / déploiement (1.9, retour arrière, sauvegardes, nginx), Testabilité et concurrence (client : orphelins, doublon), Utilisateur recruteur.
- Vérifications avant la spec v1 : repère dans un CV puis suppression et retrait, recherche dans base, WAL, temporaires ; scénario à deux acteurs dépôt × enregistrement du dossier ; aller-retour 1.9 → 1.10 → 1.9 avec restauration ; dépôt > 1 Mo derrière un nginx réglé comme en production ; essais d'attaque sur les routes de fichiers.
- Ordres de grandeur : spec 140 à 200 lignes, 14 à 18 CA (tableau commande × version 1.9 ↔ 1.10, tableau des commandes de la fiche pendant un dépôt) ; 6 à 9 tâches ; 12 à 20 fichiers en plus du diff de Léo, aucune dépendance ; 1 à 2 fichiers de test API au plus, e2e existants complétés ; QA 20 à 26 scénarios ; mutations 12 à 18 ; doc : 8 pages `technique/` + `deploy/RESTAURER.md` + une page produit.
- Pas fait : choix d'interface de Léo non rediscutés (corrigés seulement s'ils sont cassés) ; fiches 1.10-1 à 1.10-5 laissées au backlog ; pas de stockage hors SQLite, d'antivirus ni d'aperçu ; pas de changement de `user_version` ; aucun essai sur le serveur réel ; pas de doc produit de tout l'espace Candidatures.
- Vigilance : pas de refonte de `menu-candidat.js` hors défaut constaté ; cohérence dépôt / dossier par une règle simple et testée (pas de doublon, pas d'orphelin durable) ; doc : seulement les paragraphes rendus faux.

## Liens
- Cadrage : spec/cadrage.md
- Spec finale : spec/spec-finale.md
- Bilan : bilan.md
