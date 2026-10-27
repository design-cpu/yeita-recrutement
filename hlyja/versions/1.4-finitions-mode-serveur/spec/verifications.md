---
type: verifications
version: 1.4
total: 11
ecarts: 1
date: 2026-10-27
---

# Vérifications — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> 11 vérifications. Un écart avec la piste de la fiche 1.3-2 : le bandeau porte aussi « Connecté·e : prénom » (4 pages sur 6), il ne peut donc pas être masqué : seul son texte change. Les fiches 1.2-1, 1.2-2, 1.2-4 sont toujours faites.

| # | Ce qu'on vérifie | Comment (commande, essai) | Résultat | Conséquence pour la spec |
|---|---|---|---|---|
| V1 | Où est le bandeau | `grep -n 'commun.fictif' candidatures/*.html` | 6 pages ; `<span data-t="commun.fictif">` dans `.fict` ; `#qui` dans le même `.fict` sur `index`, `candidat`, `ec1`, `ec2` ; `decompte` et `carte` en `noprint` | On change le texte du `span`, pas le bandeau (R1) |
| V2 | Ordre : textes posés avant le choix du mode | `grep -n 'demarrage.js\|querySelectorAll("\[data-t\]")' candidatures/*.html` ; lecture de `serveur()` | `demarrage.js` est chargé avant le script de chaque page, qui pose les `data-t` à son exécution ; `serveur()` n'entre en mode serveur qu'après les réponses de `/api/equipe` et `/api/options-disponibilite` (asynchrone) : le texte posé par la page est en principe déjà là ; la garantie vient de R1 (le `data-t` est changé aussi) | Le changement de texte peut se faire dans `serveur()` pour les 6 pages (R1, R3) ; attente acceptée (spec, § Règles) |
| V3 | Rien ne repose les `data-t` du bandeau plus tard | `grep -n 'querySelectorAll("\[data-t\]")\|\[data-t\]' candidatures/*.html` | une seule passe par page ; `candidat.html` l. 78 ne repasse que dans `#pu` | Pas de retour du texte `commun.fictif` après R1 |
| V4 | Retrait d'une offre en mode serveur, existant | `candidatures/index.html` l. 316-319 | `DEMARRAGE.pret.then` retire « Remplacer tout » si `DEMARRAGE.mode() === "serveur"` | Même procédé pour R4 |
| V5 | Les e2e en mode navigateur utilisent les exemples | `grep -n 'demo' tools/e2e-*.py` | `e2e-candidatures` l. 120 (`#demo-load`), l. 155 (`#empty-demo`) ; `e2e-pdf` l. 23 (`#empty-demo`) ; `#demo` de `e2e-liens` et `e2e-pdf` est un autre bouton (`decompte.html`) | Ces suites gardent R7 sous contrôle (CA5) |
| V6 | Référence des suites avant la version | les 8 suites lancées sur `main` | toutes concluent par leur ligne de réussite (Détail) | Base de comparaison de CA5 |
| V7 | 1.2-1 toujours faite (port de l'API) | `grep -n '^  api:' -A12 compose.yaml` | le service `api` n'a pas de `ports:` (le seul `ports:` est celui de `caddy`, l. 49) | Non rouverte ; l'essai Google reste manuel (guide 1.3) |
| V8 | 1.2-2 toujours faite | `cat .dockerignore` | `api/node_modules`, `api/data`, `**/*.sqlite`, `**/*.sqlite-wal`, `**/*.sqlite-shm` | Non rouverte |
| V9 | 1.2-4 toujours faite | `grep -n "tels quels\|recommande" docs/backend/MODELE.md` | aucune ligne | Non rouverte |
| V10 | Renvois vers l'ancien modèle | `git grep -n modele-de-donnees -- ':!hlyja'` | aucun ; dans `hlyja/` : `technique/conventions.md` l. 21 (et traces) | Retirer la ligne de `conventions.md` (R8, CA6) |
| V11 | `[hidden]` cache bien un `.btn` | `grep -n '\[hidden\]' assets/yeita.css` | `[hidden]:not([hidden=until-found i]){display:none !important}` l. 56 | R6 peut s'appuyer sur `hidden` |

## Détail
V6 — `node tools/test-store.js` : « TOUT OK » ; `node tools/test-serveur.js` : « TOUT OK (83 vérifications) » ; `cd api && npm test` : « ℹ tests 52 / ℹ pass 52 / ℹ fail 0 » ; e2e (conteneur `mcr.microsoft.com/playwright/python:v1.63.0-noble`, Node 22 copié de `node:22-slim`)  (moteur Docker Desktop arm64, sans enjeu de plateforme ici) : e2e-candidatures « ALL OK », e2e-parcours « ALL OK », e2e-liens « ALL OK », e2e-pdf « ALL OK », e2e-serveur « TOUT OK » (38 vérifications). Script : `e2e.sh` du scratchpad (construction, `http.server 8765`, puis chaque suite).
