---
type: rapport-qa
version: 1.9
taux: 100
ok: 30
echec: 0
manuel: 1
en_cours: 0
couches: unitaire, intégration, composant / UI, bout-en-bout, régression, accessibilité, sécurité, manuel
date: 2026-10-28
---

# Rapport QA — Déploiement automatique de main après les tests

> **Taux de réussite : 100 % après corrections** (30/30 ; 87 % à la QA, 20/23 : 3 échecs, 1 moyen et 2 mineurs, corrigés puis revérifiés) · niveau B revenu `TOUT OK` (31 vérifications) · 1 à vérifier à la main (guide, partie B)
> Régressions : aucune (le seul `FAIL` de `e2e-serveur` existe à l'identique sur `main`) · Bugs trouvés : 4 (aucun corrigé par la QA, qui ne touche pas au code de production ; B3 repris entre-temps dans la copie de travail par la revue de la documentation) · Tests ajoutés : 7 vérifications d'accessibilité dans `tools/e2e-serveur.py`, toutes vertes, mises à l'épreuve

QA indépendante ([plan](plan-de-test.md)). Version testée : `5e41a2d`. Aucun fichier de production modifié ; rien commité. Seul fichier du projet modifié : `tools/e2e-serveur.py` (fonction `deploiement`).

## Résultats
| # | Scénario | Résultat | Détail |
|---|---|---|---|
| S1 | CA1, nouveau commit (A) | ok | banc A, section « CA1 » : toutes OK |
| S2 | CA2, étape KO | ok | banc A, section « CA2 » |
| S3 | CA3, déploiement KO, retour | ok | banc A, sections « CA3 » et « SC8 (A), Q4 » |
| S4 | CA4, pause et demandes | ok | banc A, section « CA4 / CA5 » |
| S5 | CA5, création de `PAUSE` | ok | banc A, partie D (vrai `deploy.sh`) : 8 OK |
| S6 | CA6, refus | ok | banc A, section « CA6 » ; préfixe ambigu non observable sur ce banc (relevé par la tâche 03, `git rev-parse --verify` lu dans le code) |
| S7 | CA7, fenêtre retrait / lecture | ok | banc A, section « CA7 » |
| S8 | CA8 au niveau A | ok | banc A, section « R7, R10, R19 » et SC8 |
| S9 | CA8, SC1–SC8 sur systemd | ok | niveau B (`banc19`, `--reel`) : SC1, SC2, SC3, SC5, SC6 OK ; SC4, SC7, SC8 couverts au niveau A |
| S10 | CA9 au niveau A | ok | banc A, section « R6 : Docker muet, demande impossible à retirer » |
| S11 | CA9 sur systemd | ok | niveau B |
| S12 | CA10 au niveau A | ok | banc A, section « CA10 (A) » |
| S13 | CA10 sur systemd | ok | niveau B |
| S14 | CA11, vue hostile ou falsifiée | ok | banc A, sections « CA11 » ×3 |
| S15 | CA12, routes | ok | `npm test` 65/65 ; écriture par renommage non observable par `inject` (noté par la tâche 02) |
| S16 | CA13, page | ok | 29 vérifications de la page, toutes OK |
| S17 | Accessibilité au clavier, lecteur d'écran | ok | 7 vérifications ajoutées, OK ; mutation (`role` retiré, `:focus-visible` neutralisé) → 3 `FAIL` attendus |
| S18 | Accessibilité pendant la relecture de 10 s | ok (après correction) | bug B1 (focus perdu), B2 (verdict réannoncé) |
| S19 | CA14, `verify` et installation | ok | `systemd-analyze verify` code 0, aucune sortie ; installation : 3 « copiée » + `active`, 3 « identique », « DIFFÉRENTE » + code 1 ; `deploye` créé (700, `deploy`) |
| S20 | CA14, déclenchement réel | ok | niveau B |
| S21 | CA15, cycle complet | ok | niveau B |
| S22 | CA16, `check-site.sh` | ok | ligne présente (`tools/check-site.sh:44`) ; exécution réelle au niveau B |
| S23 | CA17, shellcheck et banc | ok | shellcheck code 0 ; refus sans `AUTO_DEPLOY_JETABLE=oui` : code 2 ; banc sous `env -i` et `umask 022` (lanceur) |
| S24 | CA18, blocs des docs | ok | 27 blocs `bash`/`sh` de `README.md`, `deploy/README.md`, `deploy/METTRE-A-JOUR.md`, `api/README.md` : 25 passent `bash -n` et `zsh -n` ; 2 échecs = gabarits avec `<…>` (déjà là avant) |
| S25 | CA18, tableau de diagnostic | ok (après correction) | bug B3 (message du journal qui n'existe pas) |
| S26 | CA19, tableau R15 | ok | niveau B ; remarque R1 (version du script dans le journal) |
| S27 | Libellé d'étape d'une interruption | ok (après correction) | bug B4 (« tests de l'api ») |
| S28 | Non-régression | ok | voir « Suite de tests complète » |
| S29 | Sécurité | ok | 403 non-admin et lecture (API, page), texte hostile, lien, NUL, doublon, `par` du membre, `npm audit` 0 |
| S30 | Partie A du guide sous zsh | ok | rejouée pour de vrai : `TOUT OK`, `ℹ tests 65`, `ℹ fail 0`, banc 95 / 0, page 200, demande `par=moi@yeita.fr`, copie rangée (1 min 37 s, image du banc en cache) |
| S31 | Partie B du guide | manuel | sur le serveur, après le merge |

À la QA : 20 / (20 + 3) = 87 %, les 7 scénarios du niveau B alors en cours et le manuel hors calcul. Après les corrections et le retour du niveau B : 30 / 30 ; le manuel (partie B du guide) reste à faire sur le serveur.

## Par couche
| Couche | Scénarios | Réussis | Échoués | En cours / manuel | Outil |
|---|---|---|---|---|---|
| Unitaire | 1 (S15) | 1 | 0 | 0 | `node:test` |
| Intégration | 16 (S1–S8, S10, S12, S14, S19, S22–S25) | 16 | 0 | — | banc A, `qa19-sd`, lecture croisée (1 échec à la QA, corrigé) |
| Composant / UI | 2 (S16, S27) | 2 | 0 | 0 (S27 corrigé après la QA) | Playwright (`e2e-serveur`), sonde |
| Bout en bout | 6 (S9, S11, S13, S20, S21, S26) | 6 | 0 | — | `--reel` sur `banc19` : `TOUT OK` |
| Non-régression | 1 (S28) | 1 | 0 | 0 | suites du projet, comparaison à `main` |
| Accessibilité | 2 (S17, S18) | 2 | 0 | 0 (S18 corrigé après la QA) | Playwright (clavier, `aria_snapshot`), sonde |
| Sécurité | 1 (S29, plus S6, S12, S14, S15) | 1 | 0 | 0 | banc A, `npm test`, e2e |
| Manuel | 2 (S30, S31) | 1 | 0 | 1 | zsh sur le Mac ; guide partie B |

## Suite de tests complète
Lignes de verdict recopiées mot pour mot.

| Suite | Commande | Ligne de verdict | Compte |
|---|---|---|---|
| Règles du parcours | `node tools/test-store.js` | `TOUT OK` | — |
| Mode serveur hors navigateur | `node tools/test-serveur.js` | `TOUT OK (87 vérifications)` | — |
| API | `cd api && umask 022 && npm test` | `ℹ tests 65` · `ℹ pass 65` · `ℹ fail 0` | ~21 s |
| Audit | `cd api && npm audit --omit=dev` | `found 0 vulnerabilities` | — |
| Banc niveau A | `docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot` | `TOUT OK` (code 0) | 95 OK, 0 FAIL, 1 min 08 s |
| Banc, sans accord | même commande sans `-e AUTO_DEPLOY_JETABLE=oui` | `Refusé : ce lanceur crée un utilisateur et efface des dossiers. …` (code 2) | — |
| Sauvegardes | `docker run --rm -e BANC_JETABLE=oui -v "$PWD:/depot:ro" banc-sauvegarde bash /depot/tools/test-sauvegarde.sh /depot` | `TOUT OK` (code 0) | 102 OK, 0 FAIL |
| `e2e-candidatures` | conteneur Playwright | `ALL OK` | 51 OK |
| `e2e-parcours` | idem | `ALL OK` | 66 OK |
| `e2e-liens` | idem | `ALL OK` | 19 OK |
| `e2e-pdf` (poppler-utils) | idem | `ALL OK` | 7 OK |
| `e2e-serveur`, branche telle que livrée | idem | `ÉCHECS` (code 1) | 80 OK, 1 FAIL (connu, voir Régressions) |
| `e2e-serveur`, avec les vérifications de la QA | idem | `ÉCHECS` (code 1) | 87 OK, 1 FAIL (le même) |
| `e2e-serveur` sur `main` (`b066b31`) | idem | `ÉCHECS` (code 1) | 50 OK, 1 FAIL (le même) |
| shellcheck | `docker run --rm -v "$PWD:/mnt:ro" -w /mnt koalaman/shellcheck:v0.10.0 -f gcc -x deploy/*.sh tools/test-auto-deploy.sh` | aucune sortie, **code 0** (idem avec `-e LC_ALL=C.UTF-8`) | 7 scripts |
| Unités | `systemd-analyze verify recrutement-deploy.service recrutement-deploy.timer recrutement-deploy.path` (banc jetable `qa19-sd`, systemd 259, Ubuntu 26.04.1, dépôt cloné dans `/opt/recrutement`, utilisateur `deploy`) | aucune sortie, **code 0** | 3 unités |
| Niveau B | `docker exec -e AUTO_DEPLOY_JETABLE=oui banc19 bash /depot/tools/test-auto-deploy.sh --reel` | **`TOUT OK`** (code 0, 31 `OK`, 0 `FAIL`), rejoué depuis le dépôt (`5e41a2d`) | SC1, SC2, SC3, SC5, SC6, CA9, CA10, CA14 (dont le vrai timer, relevé à la tâche 06), CA15, CA16 (8 `OK` de `check-site.sh` à chaque `deploy.sh`), CA19 |

## Bugs trouvés
| Bug | Gravité | Statut | Correction |
|---|---|---|---|
| B1 — À chaque relecture de 10 s (demande en attente ou passage en cours), la liste des passages est reconstruite (`liste.replaceChildren()` dans `afficher`, `admin/deploiement.html`) : le focus clavier retombe sur `<body>`. Un admin au clavier ou au lecteur d'écran qui lit les passages pendant un passage est renvoyé en haut de la page toutes les 10 s. Les dépliages, eux, sont gardés. | moyen (accessibilité) | corrigé | proposition : noter la clé `data-cle` de l'élément qui a le focus avant la reconstruction et le lui rendre après (comme `ouverts`) |
| B2 — `#verdict` (`role=status`, `aria-live=polite`) est vidé puis rempli à chaque relecture, même si le texte ne change pas (1 mutation en 11,5 s, état inchangé) : un lecteur d'écran peut relire le verdict toutes les 10 s. À l'inverse, `#bandeaux` n'est pas une zone annoncée : la progression « Passage en cours … (k/4) » et « Demande en attente » ne sont pas dites. | mineur (accessibilité) | corrigé | ne remplacer le verdict que si son texte change ; décider si le bandeau de passage doit être annoncé |
| B3 — `deploy/README.md` § 15, « Lire un échec » : la ligne « `Demande illisible : le conteneur n'a pas pu la retirer.` » ne correspond à aucun message ; le journal écrit « `· Demande non retirée : le conteneur n'a pas pu la prendre.` » (`deploy/auto-deploy.sh:203`, renommé pendant le niveau B, fiche 06). Qui cherche le message du journal dans le tableau ne le trouve pas. | mineur (documentation) | corrigé (revue de la documentation) | pendant la QA, la copie de travail de `deploy/README.md` a été modifiée par une autre étape (revue de la documentation, non commitée) : la ligne dit désormais « `Demande non retirée : le conteneur n'a pas pu la prendre.` » ; constat fait sur `5e41a2d`, à vérifier au commit |
| B4 — Libellé d'étape mis en minuscules : « Interrompu pendant tests de l'api » (liste des passages) et « Mise en ligne interrompue pendant tests de l'api : … » (verdict) pour une interruption pendant `npm-test` ; le tableau des étapes dit « Tests de l'API ». `etapeTexte(...).toLowerCase()` dans `libelleResultat` et `calculerVerdict`. Le test de la page ne le voit pas : son seul cas d'interruption est `deploy` (« mise en ligne », sans sigle). | mineur (texte) | corrigé | ne baisser que la première lettre, ou garder le libellé tel quel |

### Reproduction
- **B1, B2, B4** : sonde Playwright hors dépôt, `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/a4cb3ea7-c579-470f-adde-5c004cd2f92a/scratchpad/qa/sondes/sonde.py`, lancée dans le conteneur Playwright sur un instantané de la branche (même commande que les e2e, `python3 /s/sonde.py`). Sorties :
  - `SONDE focus avant relecture: SUMMARY/p2 | après: BODY/undefined | passage toujours ouvert: True`
  - `SONDE mutations de #verdict pendant 11,5 s (état inchangé): 1`
  - `SONDE verdict interrompu: Mise en ligne interrompue pendant tests de l'api : le site est peut-être hors service. En SSH : deploy/deploy.sh aaaaaaa`
  - `SONDE passage interrompu: Interrompu pendant tests de l'api`
  - À la main : ouvrir la page avec une demande en attente, Tab jusqu'à un passage, attendre 10 s, appuyer sur Tab : le focus repart du début de la page.
- **B3** : `grep -n "pas pu la retirer" deploy/auto-deploy.sh` → rien ; `grep -n "Demande non retirée" deploy/auto-deploy.sh` → ligne 203.

## Régressions
Aucune. Le seul `FAIL` de `e2e-serveur` — « `départ de la page (candidat.html), PUT précédent lent : la dernière frappe est en base 0799999999 · PUT :  200 200 200 409` » — sort à l'identique sur `main` (`b066b31`), rejoué par la QA dans le même conteneur (instantané `git archive main`, mêmes `node_modules`, lockfile identique). Il est hors de cette version : candidat au backlog (déjà signalé par la tâche 07).

## Remarques (sans échec)
- **R1 — CA19, « version du script relevée dans le journal »** : aucune ligne de `auto-deploy.sh` ne nomme le commit du script qui tourne (`info` écrit le passage, la demande, la pause, l'étape). Au niveau B, la version est reconnue par des marqueurs ajoutés aux commits d'essai. À confirmer au retour du niveau B ; sinon une ligne « auto-deploy.sh du commit <court> » en début de passage suffirait.
- **R2 — Pas de « Déployer ce commit » juste après la mise en service** : le bouton ne vient que sur un passage de l'automatisme dont le commit n'est plus en ligne ; tant que deux commits ne sont pas passés par l'automatisme, la page n'en montre aucun (comportement voulu, écrit sur la page). Le guide fait le retour arrière après le prochain merge.
- **R3 — Clavier natif** : Entrée et Tab sur `<summary>` relèvent du navigateur ; leur mise à l'épreuve n'a de sens que si les `<details>` étaient remplacés (les vérifications S17 le garderaient).

## À vérifier à la main
- Niveau B (`banc19`, `--reel`) : recopier sa ligne finale (`TOUT OK` ou `ÉCHECS : n`) dans « Suite de tests complète » et passer S9, S11, S13, S20, S21, S22, S26 à ok ou echec.
- Guide de test, partie B, sur le serveur après le merge (S31) : premier déploiement de la 1.9 à la main, unités, rôle admin, page verte, « Déployer maintenant », retour arrière par « Déployer ce commit » puis « Reprendre » après le prochain merge, journal.
- Avec VoiceOver (facultatif) : la page lue au chargement annonce le verdict ; pendant un passage, vérifier si B2 se fait entendre.

## Corrections après la QA
| Constat | Correction | Revérification |
|---|---|---|
| B1 focus perdu à chaque relecture | `admin/deploiement.html` : clé du passage (`data-cle`) qui a le focus notée avant la reconstruction, focus rendu au même résumé ou bouton | e2e : « relecture automatique : le focus clavier reste sur le même passage » OK ; mutation « focus non rendu » : voir fiche 07 |
| B2 verdict relu, bandeaux muets | verdict réécrit seulement si son contenu change (signature) ; `#bandeaux` en `role=status`, `aria-live=polite`, réécrits seulement s'ils changent | e2e : « le verdict inchangé n'est pas réécrit » (0 mutation en 11,5 s), « bandeaux annoncés » OK |
| B3 message du README | ligne du tableau « Lire un échec » alignée sur le journal (« Demande non retirée … ») | lecture |
| B4 « tests de l'api » | première lettre seule en minuscule (`etapeDansPhrase`) | e2e : « Interrompu pendant tests de l'API » OK |
| R1 version du script au journal | `auto-deploy.sh` écrit en tête de passage « · auto-deploy.sh du commit <court> (mode …) » | banc A `TOUT OK` (95) |
| (revue de la doc) boucle de « Maintenance de Docker » (`deploy/README.md` § 14) | `systemctl is-active -q` sortait aussitôt pendant un passage (`activating`) ; remplacée par `systemctl show -p ActiveState … \| grep -qxE 'activating\|active\|deactivating'` | banc systemd : ancienne boucle « sort tout de suite », nouvelle « sortie après 53 s, état : inactive » |
Après corrections : `tools/e2e-serveur.py` 91 `OK`, 1 `FAIL` (celui de `main`), ligne finale `ÉCHECS` ; banc A `TOUT OK` ; `npm test` `ℹ fail 0` ; shellcheck code 0.
