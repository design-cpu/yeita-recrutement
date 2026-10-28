---
type: revue-code
version: 1.10
bloquants: 0
majeurs: 1
mineurs: 10
corriges: 7
dependances: 0
audit: found 0 vulnerabilities (npm audit --omit=dev, api/)
date: 2026-10-28
---

# Revue de code et sécurité — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> Aucun bloquant. Aucune dépendance ajoutée, audit sans vulnérabilité.
> 1 majeur (documentation contraire à R1) corrigé ; 10 mineurs dont 6 corrigés (le plus utile : un DELETE pouvait retirer un fichier encore cité par le dossier, l'invariant de R6 tient maintenant aussi côté API), 4 au backlog.
> Revue faite par un sous-agent indépendant sur le diff `main...HEAD` au commit `7e11deb` ; corrections au commit `56eefd7`.

## Dépendances
| Dépendance | Version | Publiée le | Licence | Audit | Verdict |
|---|---|---|---|---|---|
| (aucune ajoutée ni changée) | — | — | — | — | ok |
Commandes : `git diff main...HEAD -- api/package.json api/package-lock.json | wc -l` → `0` ; `cd api && npm audit --omit=dev` → `found 0 vulnerabilities`.

## Sécurité
| # | Sévérité | Fichier | Constat | Correction | Statut |
|---|---|---|---|---|---|
| S1 | mineur | `api/src/fichiers.js` (DELETE) | L'invariant de R6 n'était garanti que par le PUT : un DELETE pouvait retirer un fichier cité par le dossier enregistré (essai : PUT avec `cv:{id}` → 200, DELETE → 204, PUT suivant → 409 sans fin) | Dans la transaction du DELETE : refus si `candidats.data` de ce candidat cite le fichier (cv ou portfolio) → 409 `fichier-cite` « Ce fichier est encore sur la fiche. Recharge la page. » ; test et 3 mutations | corrige |
| S2 | mineur | `api/src/fichiers.js` (GET) | Pas de `Content-Security-Policy` sur un fichier servi `inline` depuis l'origine du site (risque faible : PDF/PNG/JPEG, `nosniff`, `X-Frame-Options: DENY`) | `sandbox` risque de casser l'affichage des PDF dans le lecteur de Chrome ; à essayer à part | backlog |
| S3 | mineur | `candidatures/ui.js` (`nomComplet`) | `M[n]` lisait le prototype (« constructor » → une fonction affichée) | `hasOwnProperty` | corrige |
| S4 | mineur | `tools/build.py` (hors diff) | `Claude outputs/` (et `CONTRIBUER.md`) publiés dans le site, derrière oauth2-proxy | Ajouter à `SKIP` | backlog |
Vérifiés sans constat : rôle lecture refusé en écriture (y compris `%66ichiers`), décision sur la route reconnue ; premiers octets, nom nettoyé, `Content-Disposition` sûr ; `nosniff`, `no-store`, lecture sous le seul candidat ; point de contrôle après le nettoyage ; aucun nom de fichier au journal ; innerHTML toujours échappé (`YEITA.esc`), R20 ; aucun secret dans l'historique de la branche.

## Qualité et réinvention
| # | Sévérité | Fichier | Constat | Existant à réutiliser | Statut |
|---|---|---|---|---|---|
| Q1 | majeur | `docs/backend/MODELE.md` ; `hlyja/technique/api.md` | Décrivaient la base de Léo en `user_version` 2, contraire à R1 | Commentaire de `AJOUTS` (`api/src/base.js`) | corrige (`MODELE.md` ; `api.md` réécrit à l'étape documentation) |
| Q2 | mineur | `ec1.html`, `ec2.html`, `style.css`, `wording.fr.js` | Code mort depuis le retrait de « Liens et outils » et de l'ancien formulaire d'ajout | — | corrige pour EC1, styles, 6 libellés ; EC2 (`liens()`, `grille.href` posé deux fois) au backlog |
| Q3 | mineur | `api/src/app.js`, `fichiers.js`, `valeurs.js` | Duplications (`ROUTE_FICHIERS`/`ROUTE_ENVOI`, `INTROUVABLE`, `idValide`) ; valeurs recopiées sans source | `valeurs.js` | source citée dans `valeurs.js` ; duplications au backlog |
| Q4 | mineur | `api/test/fichiers.test.js` | `Content-Disposition` non testé ; mutations des en-têtes de R12, de la lecture sous le candidat et du rôle lecture absentes | — | corrige (assertion ; mutations dans la fiche 02, addendum) |
| Q5 | mineur | `candidatures/menu-candidat.js` | Relance de création sans normalisation (`xp` en texte…) | `S.normFiche` (comme `appliquer`) | corrige |
| Q6 | mineur | `candidatures/menu-candidat.js` | Message écrit dans une zone `aria-live` recréée dans le même tour : souvent non annoncé | — | corrige (`requestAnimationFrame`) ; annonce réelle : contrôle manuel au guide de test |
| Q7 | mineur | fiches 03, 04, 07 | Verdicts et mutations incomplets ; preuve 1.10-3 sur `main` absente | — | à la QA de version |

## Revérification
<à compléter par le relecteur>
