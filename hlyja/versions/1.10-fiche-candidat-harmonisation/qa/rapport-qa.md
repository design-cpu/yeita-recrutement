---
type: rapport-qa
version: 1.10
taux: 96
ok: 24
echec: 1
manuel: 1
couches: unitaire, intégration, composant / UI, bout-en-bout, régression, accessibilité, sécurité, manuel
date: 2026-10-28
---

# Rapport QA — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> **Taux de réussite : 96 %** (24/25 ; 1 échec mineur, B1, corrigé ensuite : 100 % à la revérification) · 1 à vérifier à la main (mise en production sur le serveur, VoiceOver)
> Régressions : aucune (le seul `FAIL` de `e2e-serveur`, 1.10-3, sort à l'identique sur `main`) · Bugs trouvés : 1 (mineur, affichage pour le rôle lecture) · Tests ajoutés : 3 tests de l'API, 15 contrôles e2e, tous verts, mis à l'épreuve par 3 mutations (toutes détectées ; M1 survivait aux tests des tâches)

QA indépendante ([plan](plan-de-test.md)). Version testée : `c8d9684`. Aucun fichier de production modifié ; rien commité. Fichiers du projet modifiés : `api/test/fichiers.test.js` (3 tests « QA … »), `tools/e2e-serveur.py` (fonctions `relancer_api` et `qa_110`, appelée après `fichiers_110`). Les bancs nginx et aller-retour restent hors du dépôt (ils demandent Docker, un second conteneur et le code de `main`) : `scratchpad/qa/banc-nginx/` (`site.conf`, `sonde.py`) et `scratchpad/qa/banc-ar/s/` (`banc.sh`, `req.mjs`, `dossier.mjs`), sorties dans `scratchpad/qa/out/`.

## Résultats
| # | Scénario | Résultat | Détail |
|---|---|---|---|
| S1 | Base, version, concurrence, cascade | ok | `base.test.js` (tâche 01) dans `npm test` : 85/85 |
| S2 | Types, limites, accès, lecture | ok | tests de la tâche 02 + « QA CA9 » : rôle lecture par `%66ichiers` : GET 200, HEAD 200, DELETE 403 |
| S3 | Références, nettoyage à 59 / 61 min | ok | `fichiers.test.js` (tâche 02) |
| S4 | API : DELETE d'un CV cité par un second recruteur | ok | « QA R6 (deux recruteurs) » : 409 `fichier-cite` (adresse normale et `%66ichiers`), dossier `deepEqual` avant / après, CV relu à l'octet |
| S5 | Deux navigateurs : DELETE de Bob d'un CV cité | ok | `[409, 'fichier-cite']`, dossier identique, CV présent |
| S6 | Page de Bob périmée, « Retirer » | ok | requêtes de Bob : un seul `PUT` (409), aucun `DELETE` ; message « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. » ; nouveau CV d'Alice cité et présent |
| S7 | CA5 (tâche 03) | ok | contrôles « deux recruteurs (1.10 CA5) » |
| S8 | CA4 (tâche 04) | ok | 5 contrôles « création (1.10 …) » |
| S9 | CA6 a d, CA7, CA8, CA11, CA15 (tâche 03) | ok | 19 contrôles « 1.10 » |
| S10 | Fenêtre ⋯ pendant un envoi | ok | ouverte après Échap, croix et clic à côté ; dépôt fait ; Échap ferme ensuite (remarque Q1 : croix non `disabled`) |
| S11 | Panne réelle de l'API | ok | « La base ne répond pas. Vérifie ta connexion, puis réessaie. » ×2 ; portfolio vide, CV affiché ; après redémarrage : `06 77 77 77 77` en base, CV référencé, seul fichier, aucun portfolio |
| S12 | nginx réel, `client_max_body_size 10m` | ok | `[2097152, 10485760]` déposés par la page et référencés ; 10 Mo + 1 → `413 text/html` |
| S13 | nginx réel, réglage par défaut | ok | message exact de R7 ; champ vide ; rien dans l'API ; 500 Ko déposé ; `curl` 2 Mo → `413 text/html` |
| S14 | 502 réel de nginx | ok | envoi : message réseau, rien en base ; DELETE : dossier sans le CV, CV non référencé gardé (R6), jamais affiché après rechargement (remarque Q2) |
| S15 | Aller-retour 1.9 → 1.10 → 1.9 | ok | sorties ci-dessous |
| S16 | Restauration (`RESTAURER.md`) | ok | sorties ci-dessous |
| S17 | Repère dans un CV | ok | retrait seul (test QA, sans autre écriture), retrait dans la page (e2e QA), nettoyage (tâche 02), suppression d'un candidat qui le référence (test QA), suppression par la 1.9 (banc : `0 0 0`) |
| S18 | Clavier seul | ok | focus : « Ouvrir Clavier CV.pdf, nouvel onglet » → « Retirer Clavier CV.pdf » → « Déposer un fichier » → « Coller un lien » → lien `clavier.example/cv` ; lien en base |
| S19 | Lecteur d'écran | ok | `get_by_role` : lien « Ouvrir Clavier CV.pdf, nouvel onglet » ×1, bouton « Retirer Clavier CV.pdf » ×1 ; zone `aria-live` (tâche 03), bandeau `role=alert` (tâche 04) |
| S20 | 375 px | ok | appel : `scrollWidth` 375, commandes à droite ≤ 333 px ; fenêtre de création : 6 commandes, aucune hors de l'écran ni sous 24 px |
| S21 | 1360 px, Notes ouvertes | ok | panneau à 940 px, commandes jusqu'à 602 px, toutes au premier plan (`elementFromPoint`), `scrollWidth` 1360 |
| S22 | Rôle lecture | **échec** (B1, mineur) | refus vérifié (« Lecture seule : tu ne peux pas modifier. », CV et dossier intacts, « Ouvrir » 200) ; mais « Retirer », « Déposer un fichier », « Coller un lien » sont proposés au rôle lecture |
| S23 | Entrées hostiles | ok | nom `<img src=x onerror=…>.pdf` affiché en texte, aucun `img`, titre intact ; `javascript:` (tâche 03) ; `nomPropre` (tâche 02) |
| S24 | Contre-épreuve 1.10-3 sur `main` | ok | même `FAIL`, même message, sur `b727ded` |
| S25 | Non-régression complète | ok | voir « Suite de tests complète » |
| S26 | Mise en production réelle, VoiceOver | manuel | voir « À vérifier à la main » |

Taux : 24 / (24 + 1) = 96 %, le manuel hors calcul.

Sorties du banc aller-retour (S15, S16), recopiées :
```
=== 2. 1.10 : ouverture de la base 1.9, dépôt d'un CV pour A
· API b démarrée : "user_version":1
contrôle : integrity_check=ok user_version=1 candidats=2 equipe=1 journal=3 fichiers=1 dernier=2026-10-28T18:20:42.674Z
=== 3. retour 1.9 sur la base de la 1.10
· API m démarrée : "user_version":1
liste : 200 2 candidats
référence après le PUT de la 1.9 : "cv":{"id":"fic-203d57886f07f3ac99
=== 4. redéploiement de la 1.10 après le retour : rien ne change
fichiers de A : 200 [{"id":"fic-203d57886f07f3ac99","champ":"cv","nom":"CV Q
=== 5. 1.9 : suppression de A (ses fichiers partent avec lui)
DELETE A : 204
contrôle : integrity_check=ok user_version=1 candidats=1 equipe=1 journal=2 fichiers=0 dernier=2026-10-28T18:20:44.789Z
repère dans la base (base WAL SHM) : 0 0 0
=== 6. contrôles de RESTAURER.md (controle.mjs) sur les deux copies
copie 1.9  : integrity_check=ok user_version=1 candidats=2 equipe=1 journal=2 fichiers=absente dernier=2026-10-28T18:20:41.950Z
copie 1.10 : integrity_check=ok user_version=1 candidats=2 equipe=1 journal=3 fichiers=1 dernier=2026-10-28T18:20:42.674Z
=== 7. restauration de la copie 1.10 (remplacer.mjs), API 1.9 : le CV de A revient
Base remplacée.
A : 200 · CV : "cv":{"id":"fic-203d57886f07f3ac99
=== 8. restauration de la copie 1.9, API 1.10 : table créée à l'ouverture
Base remplacée.
avant ouverture : integrity_check=ok user_version=1 candidats=2 equipe=1 journal=2 fichiers=absente dernier=2026-10-28T18:20:41.950Z
après ouverture : integrity_check=ok user_version=1 candidats=2 equipe=1 journal=2 fichiers=0 dernier=2026-10-28T18:20:41.950Z
=== 9. remplacer.mjs refuse une empreinte fausse
REFUS : empreinte 5441979a… au lieu de 0000 (transfert coupé ?). La base actuelle n'est pas touchée.
code 1 ; tmp restant : ls: cannot access '/data/restauration.tm…
```
Étape 3 de `RESTAURER.md` (Mac, zsh, `sqlite3` du système) : copie 1.9 → `ok`, `1`, `candidats|2`, …, `fichiers absente (copie d'avant la 1.10)` ; copie 1.10 → `ok`, `1`, `candidats|2`, …, `fichiers|1` ; empreinte affichée dans les deux cas.

## Par couche
| Couche | Scénarios | Réussis | Échoués | Manuel | Outil |
|---|---|---|---|---|---|
| Unitaire | 4 (S1, S2, S3, S17) | 4 | 0 | 0 | `node:test` (`app.inject`, horloge simulée, fichiers bruts) |
| Intégration | 3 (S4, S15, S16) | 3 | 0 | 0 | `node:test` ; banc aller-retour (`node:22.23.4-slim`, code de `main` et de la branche) |
| Composant / UI | 6 (S8, S9, S10, S20, S21, S23) | 6 | 0 | 0 | Playwright (`e2e-serveur`), interceptions pour la lenteur |
| Bout en bout | 8 (S5, S6, S7, S11, S12, S13, S14, S22) | 7 | 1 (S22) | 0 | Playwright contre la vraie API ; banc nginx 1.28.3 réel |
| Non-régression | 2 (S24, S25) | 2 | 0 | 0 | suites du projet, contre-épreuve sur `main` |
| Accessibilité | 2 (S18, S19) | 2 | 0 | 0 | Playwright (clavier, `filechooser`, noms accessibles) |
| Sécurité | 4 (S2, S17, S22, S23 ; S4 et S5 pour la garde `fichier-cite`) | 4 | 0 | 0 | `node:test`, e2e (le refus du rôle lecture tient : B1 est un défaut d'affichage) |
| Manuel | 1 (S26) ; S16 rejoue l'étape 3 du guide sous zsh | — | — | 1 | serveur réel, VoiceOver |

## Suite de tests complète
Lignes de verdict recopiées mot pour mot ; état final de la branche avec les tests ajoutés par la QA.

| Suite | Commande | Ligne de verdict | Compte |
|---|---|---|---|
| Règles du parcours (Node 22 et poste) | `node tools/test-store.js` | `TOUT OK` | — |
| Mode serveur hors navigateur (Node 22 et poste) | `node tools/test-serveur.js` | `TOUT OK (87 vérifications)` | — |
| API, Node 22 (`node:22.23.4-slim`, `npm ci`, comme `auto-deploy.sh`) | `npm test` | `# tests 85` · `# pass 85` · `# fail 0` | 82 avant la QA + 3 |
| API, poste (Node 26.11.1) | `cd api && npm test` | `ℹ tests 85` · `ℹ pass 85` · `ℹ fail 0` | ~22 s |
| `e2e-candidatures` | conteneur Playwright | `ALL OK` | 55 OK, `errors: []` |
| `e2e-parcours` | idem | `ALL OK` | 84 OK, `errors: []` |
| `e2e-liens` | idem | `ALL OK` | 19 OK |
| `e2e-pdf` (avec `poppler-utils`) | idem | `ALL OK` | 7 OK |
| `e2e-serveur`, branche avec les contrôles QA | idem | `ÉCHECS` | 134 OK (dont 15 « QA 1.10 »), 1 FAIL : 1.10-3 |
| `e2e-serveur` sur `main` (`b727ded`, contre-épreuve) | même conteneur, `node_modules` du dépôt | `ÉCHECS` | 91 OK, 1 FAIL : 1.10-3, même message |
| Banc nginx | `scratchpad/qa/banc-nginx/sonde.py` | `TOUT OK` | 8 OK |
| Construction de la pile | `docker compose -p qa110-essai --env-file depot/.env.example -f depot/compose.yaml -f surcharge.yaml build --progress plain` (copie, noms d'image d'essai, images supprimées après) | code 0 · `Image qa110-essai-api Built` · `Image qa110-essai-front Built` | — |

Le `FAIL` de `e2e-serveur` (branche et `main`) : `FAIL départ de la page (candidat.html), PUT précédent lent : la dernière frappe est en base 0799999999 · PUT :  200 200 200 409`.

Mise à l'épreuve des contrôles ajoutés (copies hors du dépôt) :
| Mutation | Attendu | Obtenu |
|---|---|---|
| M1 : `pointDeControle` retiré après un DELETE de fichier | échec | détectée par « QA R10 (CA10) » seul (14 pass, 1 fail) : **les tests des tâches la laissaient passer** (le repère restait dans le WAL tant que rien d'autre n'écrivait) |
| M2 : nom du fichier retiré du libellé de « Retirer » | échec | détectée : `FAIL QA 1.10, lecteur d'écran … [1, 0]` |
| M3 : focus non rendu au champ | échec | détectée : 3 `FAIL QA 1.10, clavier …` (et le contrôle CA18 de la tâche 03) |

## Bugs trouvés
| Bug | Gravité | Statut | Correction |
|---|---|---|---|
| B1 — Le rôle lecture voit les actions des champs CV et Portfolio. La spec dit « lecteur (aucune action) » (parcours « Déposer, retirer un document ») et, au tableau UX, « Lecture seule : fichier ou lien sans action ; vide : « Non renseigné » ». Sur l'appel (`candidat.html`, `MC.infosHTML(c, false)`), Léa voit « Retirer » sur un CV, « Déposer un fichier » et « Coller un lien » sur un champ vide. L'API refuse (403 `lecture-seule`), la page affiche « Lecture seule : tu ne peux pas modifier. », CV et dossier restent intacts : aucune donnée en jeu. Pour un lien, d'après le code (`retirer`, cas sans fichier), « Retirer » efface le lien à l'écran puis l'enregistrement différé est refusé (bandeau) : non joué par la QA. C'est le comportement de tous les champs de la fiche depuis la 1.3 (le rôle n'est jamais lu par les pages), d'où un écart plutôt qu'une régression. | mineur (UX, écart à la spec) | ouvert | soit passer `ro` aux champs CV et Portfolio pour le rôle lecture (`DEMARRAGE` connaît le rôle : « Connecté·e : Léa · lecture seule »), soit corriger la spec (« lecteur : actions refusées par l'API ») ; à arbitrer |

### Reproduction
- **B1** : `tools/e2e-serveur.py`, contrôle « QA 1.10, rôle lecture » (sortie d'un premier passage, quand le contrôle attendait l'absence d'actions : `CV <nom>.pdf 4 Ko Ouvrir … Retirer … | Portfolio Déposer un fichier Coller un lien ou glisse-le ici · PDF, PNG, JPG, 10 Mo | 200`). À la main, mode serveur local (`DEV_EMAIL` d'un membre `lecture`) : ouvrir `candidatures/candidat.html?id=<id>&etape=appel` d'un candidat qui a un CV déposé → « Retirer » visible ; cliquer → « Lecture seule : tu ne peux pas modifier. ». Le contrôle du projet vérifie aujourd'hui le refus (sûreté), pas l'affichage : à resserrer si la correction est de cacher les actions.

## Régressions
Aucune. Le seul `FAIL` de `e2e-serveur` (1.10-3, « départ de la page (candidat.html), PUT précédent lent ») sort à l'identique sur `main` (`b727ded`), rejoué par la QA dans le même conteneur (91 OK, 1 FAIL), comme V21 l'avait établi : CA17 l'admet. `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf`, `test-store`, `test-serveur` : verts.

## Remarques (sans échec)
- **Q1 — Croix de la fenêtre ⋯ pendant un envoi** : la fermeture est bien impossible (S10), mais la croix reste active (`disabled` faux) alors qu'en création elle est désactivée (CA4 b). Un clic sans effet, non annoncé ; aligner sur la création serait plus clair.
- **Q2 — Un CV retiré dont le DELETE échoue (502, panne) reste en base jusqu'au prochain enregistrement du dossier passé une heure (R6).** Si le dossier n'est plus jamais enregistré (candidat clos), le fichier reste indéfiniment, invisible, jusqu'à la suppression du candidat. Conforme à R6 telle qu'écrite ; à noter pour la rétention des données personnelles (candidat au backlog : nettoyage aussi au démarrage de l'API ou à la sauvegarde de nuit).
- **Q3 — M1** : avant la QA, aucun test ne prouvait l'effacement réel juste après un retrait (le test « retrait puis suppression » ne lit les fichiers bruts qu'après la suppression du candidat). Le test « QA R10 » le prouve désormais.
- **Q4 — Charge** : lancés à deux en parallèle sur le poste, deux `e2e-serveur` mutés ont vu le contrôle clavier attendre le choix de fichier 20 s puis s'arrêter (exception). Seuls, ils passent. Le contrôle échoue désormais proprement (`FAIL` avec le focus courant) au lieu d'arrêter la suite ; lancer les e2e un par un.
- **Q5** : sur une page périmée, « Retirer » affiche le message générique de conflit (pas celui de R7, réservé à l'envoi d'un fichier) : conforme.

## À vérifier à la main
- **S26, mise en production** : `deploy/METTRE-A-JOUR.md` § 5 « 1.10 — avant le merge » sur le serveur (vrai nginx avec TLS, vrai oauth2-proxy) : relevé, directive dans le `server` 443, `nginx -t`, rechargement, preuve d'un envoi de 2 Mo (code autre que 413), relevé des autres sites inchangé. Le banc a montré le comportement de nginx 1.28 avec et sans la directive ; il n'a pas joué TLS ni la session oauth2-proxy.
- **Après le déploiement** : déposer un vrai CV PDF de 2 à 8 Mo depuis la fiche d'un candidat de test, l'ouvrir, le retirer ; le lendemain, la page des sauvegardes est verte (copie plus grosse, R14).
- **VoiceOver** (facultatif) : dépôt et retrait au clavier, écoute du message du champ (`aria-live`) et du bandeau de la liste.
- **B1** : décider entre cacher les actions au rôle lecture et corriger la spec.

## Correction après la QA (orchestrateur)
| Bug | Correction | Revérification |
|---|---|---|
| B1 | `QUI.lectureSeule()` (`assets/qui.js`) ; `docHTML` rend les documents en lecture pour ce rôle (`candidatures/menu-candidat.js`) — `08ae3e2` | contrôle « QA 1.10, rôle lecture » réécrit (aucune action ; DELETE direct → 403) : `FAIL` sans la correction, `OK` avec ; `e2e-serveur` : 134 `OK`, seul `FAIL` 1.10-3, verdict `ÉCHECS` ; `cd api && npm test` : `ℹ tests 85 · ℹ pass 85 · ℹ fail 0` |
Taux après correction : 100 % (25/25), hors 1.10-3 (préexistant, aussi sur `main`) et le scénario manuel.
