---
type: revue-code
version: 1.3
bloquants: 0
majeurs: 1
mineurs: 12
corriges: 9
dependances: 1
audit: ok
date: 2026-10-26
---

# Revue de code et sécurité — Pages de candidatures branchées sur l'API, API dans Docker

> Aucun bloquant · 1 majeur corrigé (l'envoi de départ d'une fiche pouvait écraser en silence la partie écrite par une autre page) · 6 mineurs corrigés en même temps (sécurité, repli silencieux), 6 notés.
> Pile Docker et contrôle d'accès conformes à la spec ; textes injectés échappés ; aucune dépendance npm ajoutée, audit propre.
> Revue faite par un sous-agent indépendant, sur le diff `main..HEAD` hors `hlyja/` (24 fichiers) ; corrections en `7a996af`, revérifiées par tests, mutations et e2e.

## Dépendances
| Dépendance | Version | Publiée le | Licence | Audit | Verdict |
|---|---|---|---|---|---|
| Image `node` (`docker/api.Dockerfile:4`) | `22.23.4-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d` (index multi-architecture, V32) | Node 22.23.4 le 2026-10-20 (sécurité), image du 2026-10-21 : moins de 14 jours | MIT (Node), Debian | sans objet (figée par digest) | accepté : exception décidée par l'utilisateur (`spec/cadrage.md`, décision 3) |
| npm (`api/package.json`, `api/package-lock.json`) | inchangé | — | — | 0 vulnérabilité | aucune dépendance ajoutée ni modifiée |
Commandes : `git diff main..HEAD --stat -- api/package.json api/package-lock.json api/.npmrc` → aucun changement ; `cd api && npm audit --omit=dev` → `found 0 vulnerabilities` ; `node tools/test-store.js` → TOUT OK ; `node tools/test-serveur.js` → TOUT OK (75) ; `cd api && npm test` → 52/52 (21,9 s). Docker et `shellcheck` n'étaient pas disponibles pour le réviseur : banc et `shellcheck` rejoués par l'orchestrateur après corrections (voir Revérification).

## Sécurité
| # | Sévérité | Fichier | Constat | Correction | Statut |
|---|---|---|---|---|---|
| S1 | mineur | `assets/demarrage.js` (`hoteDeProduction`) | Garde décidée sur une forme brute (règle 2 de la 1.2) : `recrutement.yeita.fr.` (point final) ou une autre casse n'étaient pas reconnus comme production ; le `catch` ouvrait la garde | Noms comparés en minuscules sans point final ; `catch` → production (bloqué) ; tests des deux formes | corrige |
| S2 | mineur | `assets/demarrage.js` (`sur401`) | Sans `sessionStorage` (exception), la garde contre la boucle de rechargement ne tenait plus | Si l'horodatage ne peut pas être écrit : mode bloqué, message de session, sans rechargement ; test | corrige |
| S3 | mineur | `assets/demarrage.js` (bandeau) | Repli `String` sans échappement si `YEITA` manquait | Échappement local de repli | corrige |
| S4 | mineur | `.dockerignore` | `*.sqlite*` ne visait que la racine du contexte | `**/*.sqlite`, `**/*.sqlite-wal`, `**/*.sqlite-shm` ; essai avec `api/y.sqlite` et `api/data/x.sqlite` : absents de l'image | corrige |
Vérifié sans constat : secrets ; contrôle d'accès (aucun droit déduit par la page, aucun en-tête d'identité envoyé) ; joignabilité (`api` sans `ports` ni variable, `back` interne sans IPv4 ni IPv6 côté hôte) ; identifiant contrôlé et encodé, aucun contenu de dossier dans l'adresse ; stockage du navigateur (seul `yeita-rechargement-401`, un horodatage) ; recherche de la règle 2 (`location.`, `req.url`, `pathname`, `hostname`) : seul S1.

## Qualité et réinvention
| # | Sévérité | Fichier | Constat | Existant à réutiliser | Statut |
|---|---|---|---|---|---|
| Q1 | majeur | `assets/adapter-serveur.js` (`partir`), `assets/dossier.js`, `ec1.html`, `ec2.html`, `decompte.html` | L'envoi de départ portait la version « que le PUT en cours produira », sinon la plus haute connue, alors que la fiche posait sa partie sur `cand`, parfois plus ancien : reproduit en Node, (1) départ pendant un PUT en cours → partie du décompte perdue ; (2) départ après une relecture non adoptée (EC2 au retour sur l'onglet) → EC1 de Bob perdue | `DOSSIER.partirPartie(base, poser)` : la partie se pose sur l'objet du PUT en cours (`adapter.enVol(id)`), sinon sur `cand` ; `partir(d, base)` porte la version de cet objet (+1 s'il est en vol), jamais la plus haute connue. R6g de la spec finale révisé en conséquence. Deux scénarios ajoutés à `tools/test-serveur.js`, mutations MQ1a et MQ1b détectées | corrige |
| Q2 | mineur | `assets/dossier.js`, `assets/adapter-serveur.js` | Après un 409 suivi d'une nouvelle tentative réussie, le bandeau de conflit reste affiché | Option silencieuse ou effacement du bandeau à la réussite | corrige (`3b314a9`, renvoyé par le curateur : `DOSSIER.onRetabli`, test et mutation) |
| Q3 | mineur | `assets/demarrage.js`, `decompte.html` | En mode navigateur, un refus de `ecrirePartie` ne montrait aucun bandeau (R6i : « dans les deux modes ») | `D.onRefus` posé aussi en mode navigateur ; test, mutation MQ3 détectée | corrige |
| Q4 | mineur | `deploy/deploy.sh` | `config --services \| grep -qx` sous `pipefail` : SIGPIPE possible, l'attente de l'api sautait ; erreur de `config` muette | Services lus dans une variable, échec explicite ; `shellcheck` sans remarque | corrige |
| Q5 | mineur | `assets/demarrage.js`, `assets/adapter-serveur.js`, `assets/dossier.js` | Options de `fetch` et texte de conflit dupliqués | Exposer la requête de l'adaptateur ; `wording.fr.js` seule source des textes | noté |
| Q6 | mineur | `candidatures/candidat.html` | Gardes du retour sur l'onglet évaluées avant la lecture seulement | Réévaluer la garde complète à la réponse | corrige (`3b314a9`, renvoyé par le curateur : `peutRelire()` avant et après la lecture ; sans test automatique propre) |
| Q7 | mineur | fiches 02, 05, 06, 09 | Sections Mutations incomplètes (6e contrôle de `check-site.sh`, options, plusieurs CA de l'e2e) | Une mutation par vérification ajoutée | noté (à la QA : critères comptés sur leurs mutations existantes) |
| Q8 | mineur | `tools/e2e-serveur.py` | Port fixe sans contrôle d'occupation ; `lancer_api` hors du `try` ; journal non fermé ; envoi de départ de Bob ou Léa non exercé (écart à R38 documenté) | `p.poll()`, `try` englobant, CA8 avec le seul contexte d'Alice | noté |
| Q9 | mineur | `assets/demarrage.js`, `assets/qui.js`, `assets/adapter-serveur.js` | Style du bandeau en ligne (classe sans règle) ; `.qui-compte` sans règle ; commentaire de `version()` | Règles dans `candidatures/style.css` ; commentaire corrigé | partiel (commentaire corrigé) |
Vérifié sans constat : règles de `store.js` inchangées (seule la source des ajouts) ; pas de réinvention ; file par dossier et version prise au départ ; `ecrirePartie`.

## Revérification
Après `7a996af` :
- Q1 : scénarios (1) et (2) dans `tools/test-serveur.js` → OK ; mutations MQ1a (retour à la version la plus haute) et MQ1b (départ sans l'objet en vol) → échec avec le message visé ; e2e CA7 et CA8 → OK.
- S1 : `recrutement.yeita.fr.` et `RECRUTEMENT.yeita.fr` → bloqué ; mutation MS1 → détectée. S2 : test et mutation MS2 → détectée. Q3 : test et mutation MQ3 → détectée.
- Q4 : `shellcheck` 0.10.0 → aucune remarque. S4 : image construite avec `api/y.sqlite` et `api/data/x.sqlite` présents : absents de `/app/api`.
- Suites : `node tools/test-store.js` TOUT OK ; `node tools/test-serveur.js` 81/81 ; `e2e-candidatures` 40, `e2e-parcours` 45, `e2e-liens` 19, `e2e-pdf` 7, `e2e-serveur` 37 : tous OK.

## Hors diff
Aucun constat.
