---
type: bilan
version: 1.4
statut: terminee
mode: standard
type_version: livrable
taches_ok: 3
taches_echec: 0
qa_taux: 100
date: 2026-10-27
---

# Bilan — Version 1.4

> **Terminée** · spec relue (2 majeurs et 3 mineurs intégrés) · 3/3 tâches ok · QA 8/8 scénarios, 100 % · revue de code : 0 bloquant, 0 majeur
> Avant de merger : suivre `qa/guide-test-humain.md` (5 parcours, ~15 min). Rien n'est poussé.

## Résultat
| Étape | Résultat |
|---|---|
| Spec | validée après une revue technique et produit (2 majeurs, 3 mineurs intégrés) |
| Tâches | 3 ok, 0 échec ; 9 mutations à la réalisation, toutes détectées |
| QA | 8/8 scénarios ; 4 vérifications ajoutées (mode navigateur, mode bloqué, attente) ; 5 mutations de la QA : 4 détectées, 1 plantage analysé (Q2, voir rapport) |
| Non-régression | `test-store` « TOUT OK » · `test-serveur` « TOUT OK (87 vérifications) » · `api npm test` « ℹ tests 52 / ℹ pass 52 / ℹ fail 0 » · `e2e-candidatures` « ALL OK » · `e2e-parcours` « ALL OK » · `e2e-liens` « ALL OK » · `e2e-pdf` « ALL OK » · `e2e-serveur` « TOUT OK » (51 vérifications) |
| Revue de code | 0 bloquant, 0 majeur, 3 mineurs (1 corrigé : trace de CA5 ; 2 notés) |
| Doc | 1 page produit, 2 pages techniques, glossaire ; 5 erreurs de détail du rédacteur-relecteur corrigées |
| Fiches demandées | 1.3-1, 1.3-2, 1.0-1 faites ; 1.2-1, 1.2-2, 1.2-4 déjà faites en 1.3, revérifiées (V7 à V9), non rouvertes |

## Tester en local
```bash
git switch version/1.4-finitions-mode-serveur
python3 tools/build.py _site && cd api && npm ci && node equipe.js add moi@yeita.fr Moi admin && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
Puis ouvrir `http://127.0.0.1:8000/candidatures/` et suivre `qa/guide-test-humain.md`.

## Reste à faire avant de merger
- Suivre le guide de test humain.
- Toujours en attente depuis la 1.3 (fiche 1.2-1) : l'essai avec un vrai compte Google @yeita.fr sur le serveur, avant toute donnée réelle (guide de test de la 1.3).

## Réserves
Aucune.

## Écarts avec la spec
Aucun. Ajouts issus de la revue de spec, dans le périmètre de 1.3-2 : garde du clic hors mode navigateur, « Retirer les exemples » caché avant le premier affichage. Écart de méthode, noté au chef d'équipe : spec et tâches écrites par l'orchestrateur ; 9 mutations au lieu de 3 ou 4.

## Tâches en échec
Aucune.

## Changelog
- Corrigé : en mode serveur, le bandeau jaune des six pages de Candidatures dit « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. » au lieu de « Tout reste dans ce navigateur ».
- Modifié : en mode serveur, le tableau ne propose plus « Charger des exemples » et le tableau vide n'en parle plus ; « Retirer les exemples » n'apparaît que si la base contient des exemples.
- Retiré : `docs/modele-de-donnees.md`, ancien modèle v2 aux liens morts (`docs/backend/MODELE.md` fait foi).
- Technique : `commun.serveur` et `tableau.vide.texteServeur` dans `assets/wording.fr.js` ; 4 vérifications dans `tools/test-serveur.js`, 13 dans `tools/e2e-serveur.py`, 2 dans `tools/e2e-candidatures.py`.

## Backlog
- Ajoutées : [1.4-1](../../backlog/1.4-1-textes-stockage-local-en-mode-serveur.md) En mode serveur, « candidature introuvable » et l'aide du lien parlent encore du stockage local (bug, basse) ; [1.4-2](../../backlog/1.4-2-titre-sauvegarde-en-mode-serveur.md) Renommer la section « Sauvegarde et exemples » en mode serveur (évolution, basse) ; [1.4-3](../../backlog/1.4-3-contribuer-donnees-dans-le-navigateur.md) CONTRIBUER.md dit encore que les données restent dans le navigateur (dette, moyenne ; décision de l'utilisateur sur « données fictives uniquement »).
- Nouvelles occurrences : [1.3-8](../../backlog/1.3-8-mode-serveur-duplications-et-styles.md) (texte de secours recopié dans `demarrage.js`).
- Traitées par cette version : [1.3-1](../../backlog/1.3-1-bandeau-donnees-fictives-faux-en-mode-serveur.md), [1.3-2](../../backlog/1.3-2-exemples-fictifs-dans-la-base-partagee.md), [1.0-1](../../backlog/1.0-1-modele-v2-liens-morts.md) → fait.

## Couverture de la doc
| Élément | Page |
|---|---|
| R1, R2 (bandeau) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) (« Bandeau jaune »), [Mode serveur](../../technique/mode-serveur.md) |
| R4 à R6 (exemples) | [Candidatures partagées](../../doc/produit/stockage-partage.md#règles-métier) (« Pas d'exemples dans la base partagée », Cas particuliers), [Mode serveur](../../technique/mode-serveur.md#pages) |
| R7 | inchangé (mode navigateur) |
| R8 | [Conventions](../../technique/conventions.md#organisation) |
| Terme « Bandeau jaune » | [Glossaire](../../glossaire.md) |
