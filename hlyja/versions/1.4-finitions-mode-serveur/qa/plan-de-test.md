---
type: plan-de-test
version: 1.4
scenarios: 8
date: 2026-10-27
---

# Plan de test — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> 8 scénarios couvrant 7 critères d'acceptation · 6 couches couvertes, 3 écartées · 8 automatisés, parcours de rendu dans le guide humain

## Matrice
| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Non-régression | Sécurité | Manuel |
|---|---|---|---|---|---|---|---|
| CA1 bandeau des 6 pages | — | — | — | S1 | — | — | guide, parcours 2 |
| CA2 bandeau selon le mode | S2 | S2 | — | — | — | — | — |
| CA3 base vide, garde du clic | — | — | S3 | S3, S4 | — | S4 | guide, parcours 3 |
| CA4 exemple présent puis retiré | — | — | S5 | S5 | — | — | guide, parcours 4 |
| CA5 non-régression, mode navigateur | — | — | S6 | S6 | S7 | — | guide, parcours 5 |
| CA6 ancien modèle | — | — | — | — | S8 | — | — |
| CA7 mutations | contrôles de S1 à S6 mis à l'épreuve (fiches 01 et 02, et rapport QA) | | | | | | |

## Couches
| Couche | Couverte / écartée | Raison |
|---|---|---|
| Unitaire | couverte (S2) | `test-serveur.js` exécute `demarrage.js` seul, dans un faux document : la bascule du bandeau est testée isolément |
| Intégration | couverte (S2) | même suite, démarrage contre une fausse API (serveur, 404 → navigateur, 502 et 404 → bloqué) |
| Composant / UI | couverte dans l'e2e (S3, S5, S6) | aucun outil de test de composant dans le projet ; les états des boutons et du tableau vide sont lus dans la page lancée |
| Bout en bout | couverte (S1, S3 à S6) | `e2e-serveur.py` (API réelle, Playwright) et `e2e-candidatures.py` (mode navigateur) |
| Non-régression | couverte (S7, S8) | les 8 suites du projet, plus les commandes de CA6 |
| Accessibilité | écartée | aucun contrôle ajouté ; les boutons retirés le sont du DOM et `hidden` vaut `display:none` (V11), donc hors de l'arbre d'accessibilité ; seul un texte change |
| Performance | écartée | aucun enjeu de volume : un texte et deux boutons |
| Sécurité | couverte (S4) | l'enjeu est l'écriture d'exemples dans la base partagée : clic pendant l'attente et en mode bloqué ; XSS (`textContent`) vu en revue de code |
| Manuel | couverte (guide humain) | rendu du bandeau à côté de « Connecté·e », lisibilité ; aucun scénario compté, tout est aussi automatisé |

## Scénarios
| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | Mode serveur : bandeau de R1 sur les 6 pages, « Connecté·e : Alice » gardé | CA1 | bout-en-bout | oui (`tools/e2e-serveur.py`) |
| S2 | Bandeau selon le mode retenu : serveur → `commun.serveur` (texte et `data-t`), navigateur et bloqué → inchangé | CA2 | unitaire / intégration | oui (`tools/test-serveur.js`) |
| S3 | Mode serveur, base vide : ni `#demo-load` ni `#empty-demo`, texte de R5, `#demo-clear` caché | CA3 | composant / bout-en-bout | oui (`tools/e2e-serveur.py`) |
| S4 | Garde du clic hors mode navigateur et retrait caché avant le premier affichage : clic pendant l'attente et en mode bloqué n'écrit rien ; `#demo-clear` caché pendant l'attente et en mode bloqué | CA3 (R4, R6), pilote P4 | sécurité / bout-en-bout | oui (`tools/e2e-serveur.py`, 2 contrôles ajoutés par la QA) |
| S5 | Mode serveur : un exemple dans la base → `#demo-clear` visible ; clic → retiré de l'API, dossier ordinaire gardé, bouton caché | CA4 | composant / bout-en-bout | oui (`tools/e2e-serveur.py`) |
| S6 | Mode navigateur inchangé : bandeau « Tout reste dans ce navigateur », tableau vide avec exemples, `#demo-clear` présent, visible après chargement des exemples | CA5 (R7), revue constat 1 | composant / bout-en-bout | oui (`tools/e2e-candidatures.py`, 2 contrôles ajoutés par la QA) |
| S7 | Suite complète : `test-store`, `test-serveur`, `npm test` de l'API, 5 e2e, chacune par sa ligne de verdict | CA5 | régression | oui (commandes du projet, e2e en conteneur) |
| S8 | `docs/modele-de-donnees.md` absent, aucun renvoi hors traces et backlog | CA6 | régression | oui (commandes de CA6) |

## Détail des scénarios
### S1 — Bandeau des six pages en mode serveur
Préconditions : API lancée par l'e2e (base temporaire, `DEV_STATIC`), Alice recruteuse · Étapes : ouvrir `index.html`, créer un dossier, ouvrir `candidat`, `ec1`, `ec2`, `decompte`, `carte` avec `?id=` · Attendu : `.fict` contient le texte de R1, pas « Tout reste dans ce navigateur » ; « Connecté·e : Alice » sur `index.html`.

### S2 — Bandeau selon le mode
Préconditions : faux document avec deux `[data-t="commun.fictif"]` · Étapes : démarrer contre une API qui répond, puis `/api/moi` en 404 HTML, puis 502 et `/api/equipe` en 404 · Attendu : serveur → texte et `data-t` `commun.serveur` ; navigateur et bloqué → « texte fictif » et `commun.fictif`.

### S3 — Base vide en mode serveur
Préconditions : base sans dossier · Étapes : Alice ouvre le tableau · Attendu : `#demo-load` et `#empty-demo` absents, `#empty p` = « Ajoute la première personne avec qui tu as un appel de découverte. », `#demo-clear.hidden`.

### S4 — Garde du clic et retrait caché avant le premier affichage
Préconditions : `/api/equipe` ralenti de 2 s ; puis `/api/moi` en 502 (mode bloqué) · Étapes : pendant l'attente, lire `#demo-clear.hidden`, cliquer `#demo-load` et `#empty-demo` ; en mode bloqué, cliquer les deux boutons · Attendu : mode `attente` au clic, `#demo-clear` caché ; aucun dossier `meta.demo` dans l'API, rien dans `yeita-dossiers` ; `#demo-clear` caché en mode bloqué.

### S5 — Exemple déjà présent puis retiré
Préconditions : un dossier ordinaire · Étapes : vérifier `#demo-clear` caché, écrire un dossier `meta.demo`, recharger, cliquer « Retirer les exemples » · Attendu : bouton visible, puis l'exemple n'est plus dans l'API, le dossier ordinaire reste, bouton caché.

### S6 — Mode navigateur inchangé
Préconditions : site servi sans API (`/api/moi` en 404) · Étapes : ouvrir le tableau vide ; ouvrir « Sauvegarde » et cliquer « Charger des exemples » · Attendu : bandeau « Tout reste dans ce navigateur », texte du tableau vide avec « charge des exemples fictifs », `#empty-demo` visible, `#demo-load` présent, `#demo-clear` non caché ; après chargement, `#demo-clear` visible.

### S7 — Suite complète
Étapes : `node tools/test-store.js`, `node tools/test-serveur.js`, `cd api && npm test`, puis les 5 e2e dans le conteneur Playwright · Attendu : « TOUT OK », « TOUT OK (87 vérifications) », `ℹ fail 0`, « ALL OK » × 4, « TOUT OK ».

### S8 — Ancien modèle retiré
Étapes : `test ! -e docs/modele-de-donnees.md` ; `git grep -n "modele-de-donnees" -- ':!hlyja/versions' ':!hlyja/backlog'` · Attendu : code 0, puis aucune ligne (code 1).
