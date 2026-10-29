---
type: revue-doc
version: 1.10
pages: 8
erreurs: 24
corrigees: 23
vues: 7
date: 2026-10-28
---
# Revue de la documentation — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> 8 pages relues contre le code de la branche (HEAD `0fdd637`, dernier commit de code `ababdde`) : 24 écarts signalés, aucun bloquant sur le fond. Le plus visible : trois pages ont été écrites avant la correction QA B1 (`08ae3e2`) et sont périmées (compteurs de tests, rôle lecture, `commit`). Les autres sont des oublis dans des tableaux exhaustifs (constantes, exports, textes, liens « Voir aussi ») et trois imprécisions de la doc produit. Les 21 règles de la spec finale sont couvertes ; les 4 routes, la table `fichiers` et les méthodes de l'adaptateur sont dans le référentiel, mais `QUI.lectureSeule`, `estPassage` et le contrôle de restauration (`fichiers=<n>`) n'y sont pas. Les 7 vues humaines sont écrites d'après le code là où la source a une erreur. 5 termes ajoutés au glossaire ; ordre alphabétique rétabli.

Méthode : `git diff main...HEAD` sur la doc et le code ; chaque valeur relevée par commande (`grep` dans `api/src`, `assets/`, `candidatures/`, `deploy/`) ; nombre de tests par `grep -cE "^\s*(test|it)\(" api/test/*.test.js` (10+10+21+13+15+9+7 = 85) et par le rapport QA (`ℹ tests 85`, `e2e-serveur` : 134 `OK` + 1 `FAIL` attendu) ; test de péremption (`git log <commit>..HEAD -- <sources>`) : `mode-serveur.md` et `fiche-candidat.md` sont touchés par `08ae3e2`.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| `technique/api.md` l. 120 | « 82 tests (~22 s) » : périmé depuis `08ae3e2` (3 tests QA ajoutés dans `fichiers.test.js`) ; contredit `conventions.md` (85) | « 85 tests » | ouvert |
| `technique/api.md` l. 35 | Ligne `api/src/base.js`, colonne « Exporte » : `AJOUTS` manque (exporté, cité plus bas dans le tableau des réglages) | ajouter `AJOUTS` | ouvert |
| `technique/api.md` l. 43 | Ligne `api/src/valeurs.js` : les 5 constantes de la 1.10 manquent, alors que la page en cite plusieurs ailleurs | ajouter `LIMITE_FICHIER` (10 485 760), `TYPES_FICHIER`, `CHAMPS_FICHIER`, `MOTIF_FICHIER` (`^fic-[a-f0-9]{18}$`), `DELAI_NON_REFERENCE_MS` (3 600 000) | ouvert |
| `technique/api.md` l. 56 | `DELETE /api/candidats/:id` : ne dit pas que les fichiers du candidat sont effacés dans la même transaction (`q.fichiers.run(id)`, `candidats.js`) | « v1.10 : ses fichiers effacés dans la même transaction » ; « Depuis » : `1.2 ; 1.10` | ouvert |
| `technique/api.md` l. 77, 80 | Lignes « Corps » et « Erreurs » : rien sur la route d'envoi (limite 10 Mo encapsulée ; `FST_ERR_CTP_BODY_TOO_LARGE` → 413 `fichier-trop-gros` « Fichier trop volumineux (10 Mo maximum). » et `FST_ERR_CTP_INVALID_MEDIA_TYPE` → 415 `type-fichier` sur `ROUTE_FICHIERS`, `app.js`) | compléter les deux lignes | ouvert |
| `technique/api.md` l. 13 | « Mode d'emploi et contrat HTTP pour l'intégrateur : `api/README.md` » : le README n'a pas été mis à jour en 1.10 (aucune route des fichiers, pas de 409 `fichier-introuvable` sur le PUT, l. 102-105) | mettre à jour `api/README.md`, ou dire dans `api.md` qu'il ne couvre pas les fichiers | ouvert |
| `technique/api.md` l. 132 | « Voir aussi » sans lien vers la doc produit de la version (produit ↔ technique) | ajouter `[Fiche du candidat, CV et portfolio](../doc/produit/fiche-candidat.md)` | ouvert |
| `technique/mode-serveur.md` l. 6 | `commit: c684a41` périmé : `08ae3e2` a modifié `assets/qui.js`, `candidatures/menu-candidat.js`, `tools/e2e-serveur.py` (sources) | après correction, `commit: ababdde` (qui modifie aussi `menu-candidat.js` : croix de la fenêtre désactivée pendant un envoi) | ouvert |
| `technique/mode-serveur.md` l. 92-98, 115 | `QUI.lectureSeule()` (1.10, B1) absent : vrai en état `compte` avec `role === "lecture"` ; `docHTML` force alors la lecture (aucun bouton Déposer, Coller, Retirer, Modifier) | ajouter la fonction au tableau de `qui.js` et une phrase à « CV et portfolio » | ouvert |
| `technique/mode-serveur.md` l. 100-101 | Section `store.js` : `estPassage(h)` absent (les lignes `etat` et `fichier` ne comptent pas pour `undoLast` et `enteredStepAt`), alors que `MODELE.md` le décrit | ajouter `estPassage` | ouvert |
| `technique/mode-serveur.md` l. 74, 81 | `deposer` « rejet sans bandeau » : faux pour un identifiant hors motif (`echec(…, true)` → `surErreur`, `e.ecriture`) ; l. 81 « Tout rejet (hors 401) appelle `surErreur` » est devenu faux pour `deposer`, `fichiers`, `retirerFichier` | préciser l'exception dans les deux phrases | ouvert |
| `technique/mode-serveur.md` l. 130-131 | Section « Textes » : les clés `docs.*` (dont `erreurServeur`, `nonEnregistreConflit`, `relance`, `bandeau`, `erreurLien`, `erreurVide`, `histo.*`), `infos.supprimerFichiers`, `infos.groupes.*` manquent | les ajouter | ouvert |
| `technique/mode-serveur.md` l. 137 | « 120 vérifications (… 24 « 1.10 ») » : périmé (QA) ; contredit `conventions.md` | « 135 vérifications (41 pour la page des déploiements ; 39 pour les CV et portfolios) ; un `FAIL` attendu (1.10-3) » | ouvert |
| `technique/mode-serveur.md` l. 139 | « Voir aussi » sans lien vers `fiche-candidat.md` | l'ajouter | ouvert |
| `technique/decisions.md` l. 7, 50 | `sources` sans `api/src/fichiers.js` ni `api/src/valeurs.js` (les deux décisions 1.10 en dépendent : routes, 10 Mo, types) ; « Voir aussi » sans `fiche-candidat.md` | compléter `sources` et « Voir aussi » | ouvert |
| `technique/architecture.md` l. 96 | Spec R14 : « la doc donne la taille totale (taille d'une copie × 33) ». La ligne `backup.sh` donne la copie (117 Mo) et le nombre de copies, pas le total | ajouter « ≈ 3,9 Go (117,5 Mo × 33, mesure de la tâche 05) » | ouvert |
| `technique/architecture.md` (ou `decisions.md` « Restauration ») | Spec R15 non reprise dans le référentiel : `deploy/RESTAURER.md` affiche désormais `fichiers=<n>`, ou `fichiers=absente` pour une copie d'avant la 1.10, acceptée ; `user_version` doit valoir 1 | une ligne sur le contrôle de restauration 1.10 | ouvert |
| `technique/mise-a-jour-production.md` l. 35 | « « Annuler le dernier passage » refusé » : trop fort ; `METTRE-A-JOUR.md` et spec R2 disent « peut être refusé » (tant qu'une ligne de dépôt est la dernière) | « peut être refusé (tant qu'une ligne de dépôt est la dernière de l'historique) » | ouvert |
| `technique/mise-a-jour-production.md` l. 7 | `sources` sans `deploy/README.md`, dont l'exemple nginx (§ 7) est la référence de l'étape « avant le merge » | ajouter `deploy/README.md` | ouvert |
| `technique/conventions.md` l. 46 | Ligne `e2e-candidatures.py` sans la 1.10 (fenêtre de création, 4 groupes, nom obligatoire, mode navigateur : CV et portfolio en lien seulement) | compléter la ligne | ouvert |
| `doc/produit/fiche-candidat.md` l. 6-7 | `commit: c684a41` périmé (`08ae3e2` modifie `menu-candidat.js`) ; `sources` sans `assets/qui.js` (règle « Lecture seule »), ni `deploy/METTRE-A-JOUR.md` et `deploy/RESTAURER.md` (cas particuliers) | compléter `sources`, `commit: ababdde` | ouvert |
| `doc/produit/fiche-candidat.md` l. 51 | Règle « Fichiers non cités » : le glossaire dit « Fichier non référencé » (terme détecté au survol) | renommer la règle « Fichier non référencé » | ouvert |
| `doc/produit/fiche-candidat.md` l. 61 | EC1 « (ni « Tout déplier », « Copier pour Notion », « Vider la fiche ») » : « Copier pour Notion » reste dans « Envoyer vers la carte d'identité » (`candidatures/ec1.html` l. 207) ; seul celui du bloc « Liens et outils » est parti | « plus de bloc « Liens et outils » (« Tout déplier », son « Copier pour Notion », « Vider la fiche ») » | ouvert |
| `doc/produit/fiche-candidat.md` l. 47, 53, 56 | Manquent : le contrôle d'un lien collé (refusé s'il ne correspond pas à `^https?://[^\s.]+\.[^\s]+$`, message « Ce lien n'est pas valide. Colle une adresse qui commence par https:// ») ; le message « Ce fichier est vide. » ; la phrase de confirmation de suppression « Son CV et son portfolio déposés sont effacés avec elle. » | les ajouter aux règles « CV et portfolio », « Messages », « Effacement » | ouvert |

Rien de spéculatif ni de hors cadre relevé. Les valeurs vérifiées et justes : routes, codes et messages d'erreur (`fichiers.js`, `candidats.js`, `app.js`), schéma de la table `fichiers` (`base.js`, clés étrangères actives par défaut dans better-sqlite3, vérifié par `base.test.js` l. 99), délai d'une heure, 10 Mo, signatures des types, nom nettoyé (110 + extension), ordre dépôt/retrait et remise en état (`menu-candidat.js`), largeurs (1120, 1360, 420, 760, 480 px, `style.css`), libellés EC1/EC2 (`wording.fr.js`), RGPD 22 mois (`config.js`, `one-pager.html`), procédure nginx (`METTRE-A-JOUR.md` § 5), mesure 116 → 117 Mo (tâche 05), « undefined → undefined » (vérification V20). Liens et ancres des pages touchées : valides.

### Couverture de la spec finale dans la doc produit
| Règles | Où | Statut |
|---|---|---|
| R2, R3, R4, R5, R6, R7, R8 (lecture), R9, R10, R11, R12, R15, R16, R17, R19, R20, R21 | `fiche-candidat.md` (règles métier, cas particuliers) | couvertes |
| R1, R1b, R13, R14, R18 | règles techniques : `api.md` (R1, R1b), `mise-a-jour-production.md` (R13), `architecture.md` (R14, total manquant), `conventions.md` (R18 via tests) ; la doc produit y renvoie par « Voir aussi » | couvertes côté référentiel |

### Couverture du référentiel (code modifié)
| Élément | Page | Statut |
|---|---|---|
| 4 routes `/api/candidats/:id/fichiers…`, PUT (références, nettoyage), DELETE (409 `fichier-cite`) | `api.md` | couvert |
| Table `fichiers`, `AJOUTS`, règle `user_version` | `api.md`, `decisions.md` | couvert (export `AJOUTS` manquant) |
| `construireApp({maintenant})`, `creerApp(t, {maintenant})` | `api.md`, `conventions.md` | couvert |
| `AdaptateurServeur.deposer`, `fichiers`, `fichierUrl`, `retirerFichier` | `mode-serveur.md` | couvert |
| `menu-candidat.js` (`docHTML`, `operer`, création, `bandeau`) | `mode-serveur.md`, `conventions.md` (`MC.infosHTML`) | couvert |
| `STORE` : `sansFichiersAbsents` / `estPassage` | `mode-serveur.md` | partiel (`estPassage` manquant) |
| `QUI.lectureSeule` | — | manquant |
| `UI.nomComplet`, `YEITA_CONFIG.equipeNoms`, `rgpd.dureeMois` 22 | `fiche-candidat.md` seulement (pas de page `composants.md` dans ce projet) | à noter, pas d'erreur |
| `deploy/README.md` § 7, `METTRE-A-JOUR.md` § 1 et 5 | `architecture.md`, `mise-a-jour-production.md` | couvert |
| `deploy/RESTAURER.md` (`fichiers=<n>`) | — | manquant (signalé) |

## Vues humaines écrites
| Fichier | Contenu |
|---|---|
| `hlyja/technique/api.humain.md` | réécrite : documents du candidat (schéma d'échange, garanties), table des fichiers, ajout de table sans changer la version ; routes d'administration résumées |
| `hlyja/technique/mode-serveur.humain.md` | réécrite : dépôt et retrait cohérents (schéma, tableau des échecs), création sans doublon, rôle lecture, lignes de documents ignorées par le parcours |
| `hlyja/technique/decisions.humain.md` | réécrite : deux décisions 1.10 (fichiers dans SQLite, table sans changer la version) ; v1.7 résumée en tableau |
| `hlyja/technique/architecture.humain.md` | réécrite : base avec fichiers, réglage nginx 10 Mo en cas A, taille des sauvegardes |
| `hlyja/technique/mise-a-jour-production.humain.md` | réécrite : encadré « avant le merge », case du § 1, partie « 1.10 — avant le merge » en six étapes (commandes recopiées, « Tu dois voir », « Sinon »), « Revenir avant la 1.10 » ; parties 1.7 et 1.9 gardées |
| `hlyja/technique/conventions.humain.md` | réécrite : mise en page des étapes, tests 1.10, échec attendu 1.10-3, horloge simulée |
| `hlyja/doc/produit/fiche-candidat.humain.md` | créée : ajout d'un candidat, documents, étapes harmonisées, règles en clair avec exemples, cas particuliers |

Écrites d'après le code là où la source a une erreur signalée : 85 tests (`api`), 135 vérifications et rôle lecture (`mode-serveur`), lignes de documents ignorées par le parcours (`mode-serveur`), total ≈ 3,9 Go (`architecture`), « peut être refusé » (`mise-a-jour-production`), « Copier pour Notion » encore présent, contrôle des liens et « Ce fichier est vide. » (`fiche-candidat`). Les vues portent `commit: 08ae3e2`, sauf `mode-serveur.humain.md` (`ababdde`, qui touche `menu-candidat.js` ; la croix désactivée pendant un envoi y est décrite).

## Glossaire
- **Ajoutés** (ordre alphabétique) : « Compte en lecture », « Fiche du candidat », « Kanban », « nginx », « Version de la base » (aussi : `user_version`).
- **Remis en place** : « Avant le merge » (après « API »), « Fichier non référencé » (après « Fiche du candidat ») ; « Aussi » avant « Voir » pour « Documents du candidat ».
- Vérifié : tous les titres `##` sont dans l'ordre alphabétique (sans accents ni casse).

## Corrections de l'orchestrateur
23 erreurs corrigées dans les sources (api, mode-serveur, decisions, architecture, mise-a-jour-production, conventions, fiche-candidat) ; `api/README.md` complété (routes des fichiers, 409 du PUT et du DELETE).
Erreur 23 non retenue : le bouton « Copier pour Notion » encore présent dans `candidatures/ec1.html` (l. 207) est dans la section « Envoyer vers la carte d'identité », `hidden` et jamais affichée (aucun code ne la montre, déjà sur `main`) : la doc produit dit juste pour l'utilisateur. La vue humaine `fiche-candidat.humain.md` est alignée sur la source.
