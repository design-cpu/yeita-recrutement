---
type: rapport-qa
version: 1.4
taux: 100
ok: 8
echec: 0
manuel: 0
couches: unitaire, intégration, composant, bout-en-bout, régression, sécurité, manuel
date: 2026-10-27
---

# Rapport QA — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> **Taux de réussite : 100 %** (8/8) · 0 échec · rendu du bandeau à revoir à la main (guide, parcours 2)
> Régressions : aucune · Bugs : aucun · 4 contrôles ajoutés par la QA, mis à l'épreuve par 5 mutations (4 détectées, 1 plantage après détection ; la partie « écriture » du contrôle du mode bloqué survit, voir CA7)

## Résultats
| # | Scénario | Résultat | Détail |
|---|---|---|---|
| S1 | Bandeau de R1 sur les 6 pages en mode serveur | ok | `e2e-serveur` : 6 contrôles « bandeau jaune … (1.4, CA1) » OK, texte lu : « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, … » ; « Connecté·e : Alice » gardé sur `index.html` |
| S2 | Bandeau selon le mode (serveur, navigateur, bloqué ×2) | ok | `test-serveur` : « TOUT OK (87 vérifications) », dont les 4 contrôles « bandeau jaune : … » |
| S3 | Base vide en mode serveur | ok | `e2e-serveur` : « exemples, base vide : … (1.4, CA3) » OK, texte lu « Ajoute la première personne avec qui tu as un appel de découverte. » |
| S4 | Garde du clic hors mode navigateur, retrait caché avant le premier affichage | ok | `e2e-serveur` : clic pendant l'attente (mode `attente`, 0 dossier) OK ; **ajoutés par la QA** : « « Retirer les exemples » caché pendant l'attente du démarrage (1.4, R6) » OK, « mode bloqué : clic sur « Charger des exemples » → rien dans l'API ni dans yeita-dossiers, « Retirer les exemples » caché (1.4, R4, R6) » OK |
| S5 | Exemple déjà présent, puis retiré | ok | `e2e-serveur` : 3 contrôles « (1.4, CA4) » OK (caché avec un dossier ordinaire seul, visible avec un exemple, retiré de l'API, 1 dossier restant, bouton caché) |
| S6 | Mode navigateur inchangé | ok | **ajoutés par la QA** dans `e2e-candidatures` : « mode navigateur : bandeau « Tout reste dans ce navigateur », tableau vide avec ses exemples, « Retirer les exemples » présent (1.4, R7) » OK ; « mode navigateur : exemples chargés, « Retirer les exemples » visible (1.4, R7) » OK (constat 1 de la revue de code) |
| S7 | Suite complète | ok | voir « Suite de tests complète » : 8 suites, toutes par leur ligne de réussite |
| S8 | Ancien modèle retiré | ok | `test ! -e docs/modele-de-donnees.md` → code 0 ; `git grep -n "modele-de-donnees" -- ':!hlyja/versions' ':!hlyja/backlog'` → aucune ligne (code 1) |

## Par couche
| Couche | Scénarios | Réussis | Échoués | Outil |
|---|---|---|---|---|
| Unitaire | S2 | 1 | 0 | `node tools/test-serveur.js` (faux document) |
| Intégration | S2 | 1 | 0 | `node tools/test-serveur.js` (fausse API) |
| Composant / UI | S3, S5, S6 | 3 | 0 | Playwright, dans les e2e (pas d'outil de composant dans le projet) |
| Bout en bout | S1, S3, S4, S5, S6 | 5 | 0 | `tools/e2e-serveur.py`, `tools/e2e-candidatures.py` |
| Non-régression | S7, S8 | 2 | 0 | les 8 suites, commandes de CA6 |
| Sécurité | S4 | 1 | 0 | `tools/e2e-serveur.py` (aucune écriture d'exemple dans la base partagée) |
| Accessibilité | — | — | — | écartée : aucun contrôle ajouté, boutons retirés du DOM ou `hidden` (`display:none`, V11) |
| Performance | — | — | — | écartée : aucun enjeu de volume |
| Manuel | guide, parcours 1 à 5 | — | — | rendu et lisibilité ; non compté (tout est aussi automatisé) |

## Suite de tests complète
Lancée sur l'arbre de travail de la branche, avec les 4 contrôles ajoutés par la QA. e2e dans le conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble` (Playwright 1.63.0, Node 22 copié, `poppler-utils`), script `e2e.sh` du scratchpad.

| Commande | Dernière ligne de verdict (recopiée) | Vérifications |
|---|---|---|
| `node tools/test-store.js` | `TOUT OK` | — |
| `node tools/test-serveur.js` | `TOUT OK (87 vérifications)` | 87 |
| `cd api && npm test` | `ℹ tests 52` · `ℹ pass 52` · `ℹ fail 0` | 52 |
| `python3 tools/e2e-candidatures.py` | `ALL OK` | 42 OK, 0 FAIL (40 avant la QA) |
| `python3 tools/e2e-parcours.py` | `ALL OK` | 45 OK, 0 FAIL |
| `python3 tools/e2e-liens.py` | `ALL OK` | 19 OK, 0 FAIL |
| `python3 tools/e2e-pdf.py` | `ALL OK` | 7 OK, 0 FAIL |
| `python3 tools/e2e-serveur.py` | `TOUT OK` | 51 OK, 0 FAIL (49 avant la QA) |

## Contrôles ajoutés et mutations (CA7)
Contrôles ajoutés par la QA :
- `tools/e2e-candidatures.py`, après « état vide » : mode navigateur, bandeau `commun.fictif`, texte du tableau vide avec exemples, `#empty-demo` visible, `#demo-load` présent, `#demo-clear` non caché (R2, R7).
- `tools/e2e-candidatures.py`, après « Charger des exemples » : `#demo-clear` visible (R7, constat 1 de la revue).
- `tools/e2e-serveur.py`, au clic pendant l'attente : `#demo-clear` caché tant que le mode est `attente` (R6, pilote P4).
- `tools/e2e-serveur.py`, démarrage en 502 (mode bloqué) : clic sur les deux boutons d'exemples → aucun dossier `meta.demo` dans l'API, rien dans `yeita-dossiers`, `#demo-clear` caché (R4, R6, pilote P4).

Mutations, chacune dans une copie hors du dépôt (`/m` dans le conteneur, sans `.git` ni `hlyja`), suite visée seule, classée selon sa conclusion. Script : `qa-muter.py` et `qa-mutations.json` du scratchpad.

| # | Mutation (`candidatures/index.html`) | Suite | Conclusion | Message d'échec obtenu |
|---|---|---|---|---|
| Q1 | branche navigateur de `#demo-clear` : `: DEMARRAGE.mode() !== "navigateur";` → `: true;` (retrait jamais visible) | e2e-candidatures | **détectée** (`SOMETHING FAILED`) | `FAIL mode navigateur : bandeau … « Retirer les exemples » présent (1.4, R7)` et `FAIL mode navigateur : exemples chargés, « Retirer les exemples » visible (1.4, R7)` |
| Q2 | retrait des boutons : `if(DEMARRAGE.mode() === "serveur"){ ["demo-load"…` → `if(true){…` (boutons retirés en mode navigateur) | e2e-candidatures | **plantage** après détection : le contrôle visé échoue d'abord (`FAIL mode navigateur : bandeau … « Retirer les exemples » présent (1.4, R7)`), puis le clic existant sur `#demo-load` attend en vain (`waiting for locator("#demo-load")`) et la suite s'arrête sans ligne de verdict | message visé obtenu avant l'arrêt |
| Q3 | attribut `hidden` retiré de `#demo-clear` (visible avant le premier affichage) | e2e-serveur | **détectée** (`ÉCHECS`) | `FAIL exemples : « Retirer les exemples » caché pendant l'attente du démarrage (1.4, R6) mode : attente` et `FAIL mode bloqué : clic sur « Charger des exemples » → … « Retirer les exemples » caché (1.4, R4, R6)` |
| Q4 | garde du clic : `!== "navigateur"` → `=== "serveur"` (garde limitée au mode serveur) | e2e-serveur | **détectée** (`ÉCHECS`) | `FAIL exemples : clic sur « Charger des exemples » pendant l'attente du démarrage → rien dans la base (1.4, CA3) mode au clic : attente · dossiers : 12` (contrôle de la réalisation) ; le contrôle bloqué ajouté par la QA **survit** |
| Q5 | garde du clic retirée | e2e-serveur | **détectée** (`ÉCHECS`) | même message que Q4 ; le contrôle bloqué ajouté par la QA **survit** |

Lecture : en mode bloqué, l'adaptateur d'attente n'envoie rien (« en mode bloqué, rien ne part », `assets/demarrage.js`), donc le contrôle « mode bloqué : clic … rien dans l'API » ne peut pas distinguer une garde présente d'une garde absente : sa partie « écriture » survit à Q4 et Q5 (seule sa partie « `#demo-clear` caché » est utile, détectée par Q3). Ce n'est pas un bug : R4 est tenue en mode bloqué par deux protections, la garde du clic et l'adaptateur ; seule la garde en attente est observable, et elle est détectée.

Les contrôles écrits à la réalisation (CA1 à CA4) ont déjà été mis à l'épreuve par 9 mutations, toutes détectées (fiches `taches/01-bandeau-serveur.md` et `taches/02-exemples-mode-serveur.md`, section « Mutations »).

## Bugs trouvés
| Bug | Gravité | Statut | Correction |
|---|---|---|---|
| aucun | — | — | — |

## Régressions
Aucune : les quatre suites du mode navigateur concluent par `ALL OK` comme sur `main` (V6), `e2e-serveur` par `TOUT OK`, `test-serveur` passe de 83 à 87 vérifications, l'API reste à 52 tests.

## À vérifier à la main
- Rendu du bandeau jaune en mode serveur : le texte de R1 est plus long que l'ancien ; vérifier qu'il reste lisible à côté de « Connecté·e : prénom » sur les 6 pages et sur un écran étroit (guide, parcours 2).
- Parcours complet sur un vrai poste, avec l'API lancée en `DEV_EMAIL` / `DEV_STATIC` (guide, parcours 1 à 5).
- Hors périmètre, rappel de la revue : en mode bloqué et pendant l'attente, les boutons d'exemples restent affichés mais ne font rien, sans message (accepté par R4, candidat au backlog).
