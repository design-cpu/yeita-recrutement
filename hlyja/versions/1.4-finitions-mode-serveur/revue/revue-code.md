---
type: revue-code
version: 1.4
bloquants: 0
majeurs: 0
mineurs: 3
corriges: 1
date: 2026-10-27
---

# Revue de code et sécurité — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> Aucun bloquant, aucun majeur. 3 mineurs : un corrigé (trace de CA5), deux notés sans traitement (mode standard). Aucune dépendance ajoutée ; textes posés en `textContent` ; toutes les décisions passent par `DEMARRAGE.mode()`.

## Dépendances
Aucune ajoutée : aucun manifeste ni lockfile dans `git diff main..HEAD --name-only`.

## Sécurité
- XSS : les deux textes ajoutés sont posés en `textContent` (`assets/demarrage.js:99`, `candidatures/index.html:326`), depuis `wording.fr.js` ou une constante ; aucun `innerHTML` ajouté.
- Décisions de garde : bandeau changé dans `serveur()` après le contrôle de `/api/equipe` et `/api/options-disponibilite` ; garde du clic (l. 301), visibilité de `#demo-clear` (l. 182), retrait des boutons (l. 323-327) sur `DEMARRAGE.mode()`. Aucune lecture de `location`, du nom d'hôte, de `req.url` ni d'une réponse brute ajoutée.
- Données personnelles : comptes et noms fictifs seulement dans les tests ; rien de journalisé.

## Qualité et réinvention
Réutilisation conforme à la spec (`DEMARRAGE.mode()`, `STORE.clearDemo`, procédé de « Remplacer tout », bascule de `data-t`). Conventions respectées, pas de code mort. Sections « Mutations » présentes (fiches 01 et 02) ; lignes de verdict recopiées et rejouées par le relecteur (`test-serveur` « TOUT OK (87 vérifications) », `test-store` « TOUT OK »). Régressions : aucune trouvée en mode navigateur (quatre suites « ALL OK ») ni en mode bloqué (conforme à R4 et R6).

| # | Sévérité | Fichier:ligne | Constat | Proposition | Suite |
|---|---|---|---|---|---|
| 1 | mineur | `candidatures/index.html:182` | La branche « mode navigateur → `#demo-clear` visible » n'est vérifiée par aucun test ; le bouton étant `hidden` au départ, une erreur le cacherait pour de bon en mode navigateur (R7) | Contrôle dans `tools/e2e-candidatures.py` après le chargement des exemples, avec mutation | Non traité (mineur, mode standard) ; signalé à la QA |
| 2 | mineur | `assets/demarrage.js:20` | Le texte de secours de `texteServeur()` recopie `commun.serveur` ; les deux peuvent diverger | Pas de repli recopié, ou table `DEFAUT` comme `adapter-serveur.js` | Non traité (mineur) ; même procédé que le repli existant `A.texte` |
| 3 | mineur | `taches/02-exemples-mode-serveur.md` | CA5 coché sans que `cd api && npm test` ait été relancé | Relancer et recopier la ligne de verdict | Corrigé : « ℹ tests 52 / ℹ pass 52 / ℹ fail 0 » |

## Hors diff
- En mode bloqué et pendant l'attente, « Charger des exemples » et le bouton du tableau vide restent affichés mais ne font rien au clic, sans message (accepté par R4). Candidat au backlog (évolution : les cacher ou les désactiver tant que le mode n'est pas `navigateur`).

## Revérification
Constat 3 : corrigé dans la fiche, ligne de verdict recopiée.
