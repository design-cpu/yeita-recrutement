---
type: plan-de-test
version: 1.10
scenarios: 26
date: 2026-10-28
---

# Plan de test — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> 26 scénarios couvrant les 18 critères d'acceptation · 8 couches couvertes (unitaire, intégration, composant / UI, bout en bout, non-régression, accessibilité, sécurité, manuel), 1 écartée (performance) · 12 scénarios déjà automatisés par les tâches (cités, rejoués par les suites), 13 ajoutés par la QA (18 contrôles dans le projet, 2 bancs Docker hors du projet), 1 manuel (serveur réel)

QA indépendante, plan écrit à partir de la spec finale (R1–R21, CA1–CA18), de `spec/verifications.md`, du point P4 de `pilote.md` et des fiches `taches/`. Version testée : `c8d9684` (branche `version/1.10-fiche-candidat-harmonisation`), comparée à `main` = `b727ded` (1.9) pour la non-régression et l'aller-retour.

Ce que les tâches ont déjà automatisé n'est pas rejoué à part : leurs contrôles tournent dans les suites (S25) et sont cités dans la matrice. La QA cible ce que P4 demande et que les tâches n'ont pas couvert : deux recruteurs réels avec un DELETE d'un fichier cité, pannes réelles (API arrêtée, 502 et 413 de nginx), nginx réel au-delà de 1 Mo, aller-retour 1.9 → 1.10 → 1.9 avec restauration, repère dans un CV, clavier seul et lecteur d'écran, 375 px et 1360 px, contre-épreuve de 1.10-3 sur `main`.

Environnements :
- **Mac** (zsh 5.9, Node 26.11.1, Docker Desktop, `sqlite3` du système) : `npm test`, `test-store`, `test-serveur`, étape 3 de `deploy/RESTAURER.md` sous zsh, mutation M1.
- **Node 22** : `node:22.23.4-slim` (comme `auto-deploy.sh`) : `npm test`, `test-store`, `test-serveur` ; banc aller-retour.
- **Conteneur Playwright** `mcr.microsoft.com/playwright/python:v1.63.0-noble` + Node 22 copié : les 5 e2e (`poppler-utils` pour `e2e-pdf`), sur la branche, sur `main` (`b727ded`) et sur les copies mutées.
- **Banc nginx** (hors dépôt) : `nginx:1.28` (1.28.3) devant la vraie API (`node:22.23.4-slim`, base en tmpfs), dans le même espace réseau, vrai Chromium ; trois `server` : 8081 réglage par défaut (1 Mo), 8082 directive et `location` de `deploy/README.md` § 7 (`client_max_body_size 10m`), 8084 adresses `/fichiers` vers un amont mort (502 réel). Sans TLS ni oauth2-proxy (l'identité vient de `X-Forwarded-Email` ; oauth2-proxy ne limite pas, V10).
- **Banc aller-retour** (hors dépôt) : `node:22.23.4-slim`, code de `main` (`/m`) et de la branche (`/b`), même `node_modules`, base `/data/recrutement.sqlite` ; programmes `controle.mjs`, `suppressions.mjs`, `remplacer.mjs` extraits tels quels de `deploy/RESTAURER.md` et créés par son bloc sous zsh.
- **Pile Docker** : `docker compose build` sur une copie, avec `.env.example` et des noms d'image d'essai (comme `auto-deploy.sh`), images supprimées après.

## Matrice
| Critère | Unitaire | Intégration | Composant / UI | Bout en bout | Non-régression | Accessibilité | Sécurité | Manuel |
|---|---|---|---|---|---|---|---|---|
| CA1 base 1.9 ouverte par la 1.10 | S1 (tâche 01) | S15 | — | — | S25 | — | — | — |
| CA2 retour vers la 1.9 | S1 (cascade) | S15 | — | (tâche 06, pages de `main`) | — | — | — | — |
| CA3 base v2 refusée | S1 (tâche 01) | — | — | — | — | — | — | — |
| CA4 création, un seul candidat | — | — | S8 (tâche 04) | — | S25 | — | — | — |
| CA5 deux recruteurs | — | S4 | — | S5, S6, S7 (tâche 03) | — | — | — | — |
| CA6 issue inconnue, références | S3 (tâche 02) | — | S9 (tâche 03) | S11, S14 | — | — | — | — |
| CA7 retrait, lien, commandes | — | — | S9 (tâche 03), S10 | S11, S14 | — | — | — | — |
| CA8 413 de nginx | — | — | S9 (tâche 03, interception) | S13 (nginx réel) | — | — | — | — |
| CA9 limites, accès | S2 | S12 | — | — | — | — | S2 | — |
| CA10 repère effacé | S17 | S15 | — | S17 | — | — | S17 | — |
| CA11 historique | — | — | S9 (tâche 03) | — | — | — | — | — |
| CA12 lecture d'un fichier | S2 (tâche 02) | — | — | S12 | — | — | S2 | — |
| CA13 guide nginx | — | — | — | S12, S13 (banc) | — | — | — | S26 |
| CA14 restauration | — | S16 | — | — | — | — | — | S16 (zsh) |
| CA15 mode navigateur, `javascript:` | — | — | S9 (tâche 03), S25 (`e2e-candidatures`) | — | — | — | S23 | — |
| CA16 interface de Léo | — | — | S20, S21 | — | S25 (`e2e-parcours`, tâche 07) | — | — | — |
| CA17 suites, 1.10-3 | — | — | — | — | S24, S25 | — | — | — |
| CA18 accessibilité | — | — | — | — | — | S18, S19 | — | S26 (VoiceOver) |
| R8, UX « lecteur » | — | — | — | S22 | — | — | S22 | — |

## Couches écartées
| Couche | Raison |
|---|---|
| Performance | Aucun enjeu de charge : quelques dizaines de candidats par an, 1 à 2 fichiers chacun (hypothèses de la spec). La seule grandeur utile, la taille des copies (R14), a été mesurée par la tâche 05 (60 fichiers, 117,5 Mo par copie, ≈ 3,9 Go pour 33 copies). Le banc nginx vérifie en passant qu'un envoi de 10 Mo aboutit dans le délai d'un contrôle (8 s). |

Unitaire : les règles de l'API (R1, R6, R8–R12) sont des fonctions et des routes testables par `app.inject` ; la logique des pages (R3–R5, R19) n'existe qu'avec l'API et le navigateur, testée en composant / UI et de bout en bout.

## Scénarios
| # | Scénario | Critère | Type | Automatisé |
|---|---|---|---|---|
| S1 | Base 1.9 complétée sans changer `user_version`, ouvertures simultanées, v2 et v3 refusées, cascade | CA1, CA2, CA3 | unitaire | oui (`api/test/base.test.js`, tâche 01) |
| S2 | Types, 10 Mo pile et + 1, nom nettoyé, accès, HEAD, `%66ichiers`, lecture (`nosniff`, `inline`, `no-store`, sous son candidat) | CA9, CA12 | unitaire / sécurité | oui (`fichiers.test.js`, tâche 02 ; + 1 test QA : rôle lecture par `%66ichiers`) |
| S3 | Références vérifiées (409 `fichier-introuvable`), nettoyage à 59 / 61 min (horloge simulée) | CA6 b, c | unitaire | oui (`fichiers.test.js`, tâche 02) |
| S4 | API : un second recruteur retire un CV cité par le dossier → 409 `fichier-cite`, dossier identique, CV lisible, y compris par `%66ichiers` | R6, CA5 | intégration | oui (test QA, `fichiers.test.js`) |
| S5 | Deux recruteurs réels (deux navigateurs) : Bob envoie depuis sa page un DELETE du CV qu'Alice a déposé → 409 `fichier-cite`, dossier intact | R6, CA5 | bout en bout | oui (QA, `e2e-serveur.py`, `qa_110`) |
| S6 | Page de Bob périmée : Alice retire le CV puis en dépose un autre ; Bob clique « Retirer » sur l'ancien → refus, aucun DELETE, le nouveau CV cité et présent | R5, R19, CA5 | bout en bout | oui (QA, `e2e-serveur.py`) |
| S7 | Dépôt de Bob sur une version périmée → 409, message, fichier retiré, saisie suivante sans référence | CA5 | bout en bout | oui (`e2e-serveur.py`, tâche 03) |
| S8 | Création : envoi en échec puis second clic, autre action pendant une création lente, CV retiré, fermeture → bandeau | CA4 | composant / UI | oui (`e2e-serveur.py`, tâche 04) |
| S9 | Pannes simulées (interception) : réponse coupée, import, retrait refusé, ordre PUT puis DELETE, envoi ralenti, départ de page, 413 HTML, historique, `javascript:` | CA6 a d, CA7, CA8, CA11, CA15 | composant / UI | oui (`e2e-serveur.py`, tâche 03) |
| S10 | Fenêtre ⋯ : Échap, croix et clic à côté ne ferment pas pendant un envoi ralenti ; Échap ferme après | UX (tableau des commandes) | composant / UI | oui (QA, `e2e-serveur.py`) |
| S11 | Panne réelle : l'API s'arrête (processus arrêté) ; dépôt et retrait → message réseau, champ dans son état d'avant ; redémarrage → saisie suivante enregistrée, base cohérente | R4, R5, R19, CA6, CA7 | bout en bout | oui (QA, `e2e-serveur.py`) |
| S12 | nginx réel avec la directive du guide : CV de 2 Mo et portfolio de 10 Mo pile par la page ; 10 Mo + 1 octet → 413 HTML de nginx | R13, CA9, CA13 | bout en bout | oui (banc nginx, hors dépôt) |
| S13 | nginx réel au réglage par défaut : CV de 2 Mo par la page → vrai 413 HTML → message de R7, champ vide, rien dans l'API ; 500 Ko passe ; `curl` 2 Mo → 413 | R7, CA8, CA13 | bout en bout | oui (banc nginx) |
| S14 | 502 réel de nginx (amont mort) : sur l'envoi → message réseau, rien en base ; sur le DELETE après l'enregistrement → dossier sans le CV, CV non référencé laissé à R6, jamais affiché | R4, R5, R6 | bout en bout | oui (banc nginx) |
| S15 | Aller-retour : base créée par la 1.9, ouverte par la 1.10 (dépôt), relue et réécrite par la 1.9 (référence gardée), redéploiement de la 1.10, suppression par la 1.9 (fichiers et repère effacés) | CA1, CA2, tableau « Déploiement » | intégration | oui (banc aller-retour, hors dépôt) |
| S16 | Restauration : `controle.mjs` et étape 3 (`sqlite3`, zsh) sur une copie 1.9 (`fichiers=absente`) et une copie 1.10 (`fichiers=1`) ; `remplacer.mjs` : copie 1.10 sous la 1.9 (le CV revient), copie 1.9 sous la 1.10 (table créée), empreinte fausse refusée | CA14, R15 | intégration / manuel rejoué | oui (banc aller-retour, programmes extraits de `RESTAURER.md`) |
| S17 | Repère dans un CV : absent de la base, du WAL et des temporaires après un retrait seul, après un retrait dans la page, après le nettoyage (tâche 02), après la suppression d'un candidat qui le référence, après une suppression par la 1.9 | CA10, R10 | unitaire / bout en bout / sécurité | oui (test QA `fichiers.test.js`, `e2e-serveur.py`, banc aller-retour) |
| S18 | Clavier seul : Tab jusqu'à « Déposer un fichier », Entrée ouvre le choix du fichier ; Tab, Entrée sur « Retirer » ; « Coller un lien », saisie, Entrée ; focus rendu au champ | CA18 | accessibilité | oui (QA, `e2e-serveur.py`) |
| S19 | Lecteur d'écran : « Ouvrir » annonce le nom et « nouvel onglet », « Retirer » le nom ; zones `aria-live` (tâche 03), bandeau `role=alert` (tâche 04) | CA18 | accessibilité | oui (QA, `e2e-serveur.py`) |
| S20 | 375 px, mode serveur : appel avec un CV au nom long et un lien long, fenêtre de création (« Déposer un fichier », « Coller un lien », pied), sans défilement horizontal | R17, CA16 | composant / UI | oui (QA, `e2e-serveur.py`) |
| S21 | 1360 px : Notes ouvertes à côté, commandes des champs CV et Portfolio à gauche du panneau, visibles et cliquables | R17, CA16 | composant / UI | oui (QA, `e2e-serveur.py`) |
| S22 | Rôle lecture (Léa) : « Ouvrir » sert le CV ; les actions du champ ne doivent pas être proposées (spec : « lecteur (aucune action) ») et sont refusées par l'API | R8, UX | bout en bout / sécurité | oui (QA, `e2e-serveur.py` : refus vérifié ; affichage : constat, B1) |
| S23 | Entrées hostiles : nom de fichier `<img onerror>` dans le dossier affiché en texte ; lien `javascript:` (tâche 03) ; nom nettoyé (tâche 02) | R20, sécurité | sécurité | oui (QA + tâches) |
| S24 | Contre-épreuve : `e2e-serveur` de `main` dans le même conteneur → 1.10-3 échoue à l'identique | CA17 | non-régression | oui |
| S25 | Non-régression complète : `npm test` (Node 22 et poste), `test-store`, `test-serveur`, 5 e2e, `docker compose build` | CA16, CA17, R18 | non-régression | oui |
| S26 | Mise en production réelle (`METTRE-A-JOUR.md` § 5 « 1.10 — avant le merge » sur le serveur, TLS et oauth2-proxy réels) ; écoute avec VoiceOver | CA13, CA18 | manuel | non |

## Détail des scénarios
### S5, S6 — Deux recruteurs réels
Préconditions : API réelle, deux navigateurs (Alice, Bob, recruteurs). · Étapes : Alice dépose un CV dans le bloc Infos de l'appel ; Bob ouvre la même page et envoie `fetch(…/fichiers/<id>, {method: "DELETE"})` depuis sa page ; puis Alice retire le CV et en dépose un autre ; Bob, sans recharger, clique « Retirer ». · Attendu : 409 `fichier-cite` ; dossier identique (version, données) et CV présent ; puis aucun DELETE envoyé par Bob, message de conflit dans son champ, champ inchangé ; le nouveau CV d'Alice cité et présent.
### S11 — Panne réelle de l'API
Préconditions : candidat avec un CV référencé, page ouverte. · Étapes : arrêt du processus de l'API (SIGTERM) ; dépôt d'un portfolio ; « Retirer » sur le CV ; redémarrage de l'API sur la même base ; saisie du téléphone. · Attendu : « La base ne répond pas… » dans les deux champs ; portfolio vide, CV affiché ; après le redémarrage : téléphone en base, CV référencé et seul fichier, aucun portfolio, aucun 409.
### S12 à S14 — nginx réel
Préconditions : banc nginx (voir Environnements) ; sonde `scratchpad/qa/banc-nginx/sonde.py`. · Étapes et attendus : voir le tableau ; le 413 et le 502 sont produits par nginx lui-même (aucune interception).
### S15, S16 — Aller-retour et restauration
Étapes : `scratchpad/qa/banc-ar/s/banc.sh` (9 étapes) dans `node:22.23.4-slim` ; copies faites par `api/sauvegarde.js` de la version qui tourne ; étape 3 de `RESTAURER.md` extraite et jouée sous zsh sur le Mac. · Attendu : `user_version` 1 à chaque démarrage ; référence gardée par la 1.9 ; `fichiers=absente` / `fichiers=1` ; `Base remplacée.` ; CV revenu avec la copie 1.10 ; table créée à l'ouverture de la copie 1.9 par la 1.10 ; `REFUS` sur une empreinte fausse, fichier temporaire retiré.
### S18, S19 — Clavier et lecteur d'écran
Étapes : focus sur le téléphone, Tab jusqu'à « Déposer un fichier » (60 au plus), Entrée → `filechooser` ; Tab, Entrée ; Tab, Entrée, frappe, Entrée ; noms accessibles lus par `get_by_role`. · Attendu : focus sur « Ouvrir », puis « Déposer un fichier », puis le lien ; noms « Ouvrir Clavier CV.pdf, nouvel onglet » et « Retirer Clavier CV.pdf ».
### Mise à l'épreuve des contrôles ajoutés (copies hors du dépôt)
| Mutation | Contrôle visé |
|---|---|
| M1 : `pointDeControle` retiré après un DELETE de fichier (`api/src/fichiers.js`) | S17, test « QA R10 » |
| M2 : nom du fichier retiré du libellé accessible de « Retirer » (`docHTML`) | S19 |
| M3 : focus non rendu au champ après une opération (`focusChamp`) | S18 |
