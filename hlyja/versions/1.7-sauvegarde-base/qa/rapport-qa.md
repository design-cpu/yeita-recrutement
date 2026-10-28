---
type: rapport-qa
version: 1.7
iteration: reprise
scenarios: 24
reussis: 22
echecs: 2
bugs: 8
date: 2026-10-28
---

# Rapport de QA — Reprise 1.7 : sauvegarde chiffrée sur le serveur, avec page d'état

> 22 scénarios sur 24 réussis (92 %) · aucune régression (4 suites au vert) · 8 bugs : 1 majeur (la copie `.env.avant-cle` bloque le déploiement suivant), 2 moyens, 5 mineurs (dont 1 corrigé pendant la campagne) · 3 restaurations de bout en bout réussies à la lettre · partie A du guide jouée telle quelle : conforme · la partie B reste à faire sur le vrai serveur.

QA indépendante ([plan](plan-de-test.md), écrit sans lire les fiches `taches/`). Aucun code de production modifié, rien commité.

**Version testée.** La campagne a commencé sur `8308ce6` ; le commit `64f1bd6` (« corrections de la revue de la reprise ») est arrivé pendant le déroulé. Le banc a été remis sur `64f1bd6` (image api reconstruite, unités mises à jour par la procédure documentée, S18), les 4 suites et la partie A du guide ont été rejouées dessus, ainsi que S13 et S19-S23. S1-S12 et S14-S17 ont été joués sur `8308ce6` ; `64f1bd6` ne change, sur leur chemin, que le motif de date future de la page (S13), les messages d'erreur de `ecrire_etat` et des commentaires d'unités.

## Non-régression — lignes de verdict (mot pour mot)

| Suite | `8308ce6` | `64f1bd6` |
|---|---|---|
| `cd api && npm test` | `ℹ tests 58` · `ℹ pass 58` · `ℹ fail 0` | `ℹ tests 58` · `ℹ pass 58` · `ℹ fail 0` |
| `node tools/test-store.js` | `TOUT OK` | `TOUT OK` |
| `node tools/test-serveur.js` | `TOUT OK (87 vérifications)` | `TOUT OK (87 vérifications)` |
| `docker exec banc17s bash /depot/tools/test-sauvegarde.sh /depot` | `TOUT OK` (102 lignes OK) | `TOUT OK` (102 lignes OK) |

shellcheck 0.10.0 (`-x`) : aucune remarque sur `backup.sh`, `verif-disque.sh`, `commun.sh`, `prepare-serveur.sh`, `check-site.sh` ; 23 remarques de niveau *info* sur `tools/test-sauvegarde.sh` (SC2016 ×18, SC2317 ×3, SC2015, SC2043), contre 26 avant la reprise. **Aucune régression.**

## Résultats par scénario

| # | Scénario | Résultat | Constat |
|---|---|---|---|
| S1 | Page admin verte (disque Docker à 80 %) | ✅ | « Tout va bien… », réussite « mercredi 28 octobre 2026 à 09:37 » (heure de Paris), 32 Ko, 3 copies, « racine 34 %, Docker 80 % » ; largeur téléphone lisible |
| S2 | Aucun fichier d'état | ✅ | Rouge, 2 motifs ; détails « aucune », copies « ? » |
| S3 | Retards 27 h / 3 h | ✅ | « …plus de 26 heures. », « …plus de 2 heures. » |
| S4 | Échec + disque plein 81 % | ✅ | « La dernière tentative a échoué (étape : api non saine). », « Un disque dépasse 80 %… » |
| S5 | Trois fichiers illisibles | ✅ | 3 motifs « illisible » (remarque R1 : les détails disent « aucune ») |
| S6 | `mesure-impossible` | ✅ | « La mesure des disques a échoué. », détail « mesure impossible » |
| S7 | Recruteur, `lecture` | ✅ | « Réservé aux admins de l'équipe. », détails et aide masqués |
| S8 | Inconnu, désactivé | ✅ | « Tu ne fais pas partie de l'équipe. » |
| S9 | Sans identité | ✅ | « Session expirée : recharge la page pour te reconnecter. » |
| S10 | Site sans API | ✅ | « État indisponible ici : ce site n'a pas l'API. » |
| S11 | Serveur arrêté, Actualiser | ✅ | « Le serveur ne répond pas. Réessaie dans un instant. » |
| S12 | `<img onerror>` dans l'étape | ✅ | Texte brut affiché, 0 `img`, titre inchangé |
| S13 | Date future | ✅ sur `64f1bd6` | Sur `8308ce6` : motif « plus de 26 heures » (bug B1) ; sur `64f1bd6` : « …dans le futur : l'horloge du serveur est peut-être fausse. » |
| S14 | Route comme oauth2-proxy | ✅ | admin 200 ; `rec2` 403 `admin-requis` ; inconnu 403 `hors-equipe` |
| S15 | Unités réelles de bout en bout | ✅ | `recrutement-2026-10-28T083909Z.db.age` 600 `deploy`, en-tête `age-encryption.org/v1` ; `/data/etat` 700, 3 fichiers 600 `node` ; route 200 avec l'état ; copie déchiffrée `ok`, 4 repères ; repère absent du `.db.age` et de `/var/backups`, `/home`, `/opt`, `/root` (hors poste), `/tmp` |
| S16 | Échec réel api arrêtée | ✅ | `ÉCHEC (api non saine)…`, code 1 ; `{"resultat": "echec", "etape": "api non saine", "code": 1}` écrit api arrêtée ; réussite inchangée ; route après redémarrage cohérente |
| S17 | Concurrence, verrou, root | ✅ | `verif-disque.sh` code 0 pendant la sauvegarde ; 2e `backup.sh` « une sauvegarde est déjà en cours », code 1, état = celui de la 1re ; root « pas en root », code 1 |
| S18 | Unités à trois issues | ✅ | Après `64f1bd6` : « DIFFÉRENTE : recrutement-backup.service (rien n est écrasé) » + diff, code 1 ; mise à jour documentée ; puis 3 « identique » et « copiée : recrutement-verif-disque.timer », timer réactivé ; `systemd-analyze verify` muet (remarque R2) |
| S19 | Restauration, base existante | ✅ | Tronqué : `REFUS : empreinte 1bd7… au lieu de 2255… (transfert coupé ?)`, empreinte de la base identique avant/après ; puis `Base remplacée.`, `healthy`, `/data` = base, `-wal`, `-shm`, `sauvegardes`, `etat` ; comptes = étape 3 ; `À SUPPRIMER …?id=cand-qa-b2` → suppression → `rien à faire` ; dossier créé après la copie perdu (attendu) ; poste effacé, `EMPREINTE` vidée |
| S20 | Restauration, volume intact (1 bis) | ✅ | Copie `/data/sauvegardes/recrutement-2026-10-28.db` contrôlée, `Base remplacée.`, `À SUPPRIMER …cand-qa-c3`, `rien à faire : cand-qa-b2` |
| S21 | Restauration, volume neuf | ✅ avec réserve | Tronqué refusé, `Base remplacée.`, `healthy`, comptes de l'étape 3, `etat/` présent ; étape 8 sans suppression listée : la commande affiche le journal des suppressions au lieu de « rien à faire » (bug B3) |
| S22 | Partie A du guide telle quelle | ✅ | A1 `ℹ tests 58` / `ℹ fail 0` ; A2 `TOUT OK` (23 s, image en cache) ; A3 page verte exactement comme décrite (`recrutement-essai.db.age`, 32 Ko, 3, « racine 34 %, Docker 34 % ») |
| S23 | Blocs sous zsh/bash, écriture de la clé | ❌ | 41 blocs sur 42 passent `zsh -n` et `bash -n` (B7) ; la commande de la clé refuse vide et clé SSH sans rien changer, gère un `.env` sans fin de ligne, mais laisse `.env.avant-cle` non ignoré dans le dépôt : `git status --porcelain` → `?? .env.avant-cle` (bug B2) |
| S24 | Plus de rclone / healthchecks / OVH Object Storage | ❌ | Code, `deploy/`, `.env.example`, `api/README.md`, `README.md` propres (seul « OVH » = l'hébergeur du serveur) ; le grep littéral de CA16 trouve 1 ligne (le test d'absence lui-même, `tools/test-sauvegarde.sh:154`) ; la couche humaine de `hlyja/technique/` et 4 fiches du backlog décrivent encore rclone, OVH Object Storage et healthchecks.io (bug B4) ; aucun lien vers `/admin/` |

**Taux : 22 / 24 = 92 %** (S21 compté réussi : la base est restaurée, le défaut porte sur un affichage).

## Résultats par couche

| Couche | Scénarios | Résultat |
|---|---|---|
| Unitaire | `npm test` (CA1-CA3, CA22, dont date future) | 58/58 |
| Intégration | lanceur `test-sauvegarde.sh` (CA4-CA9, CA14, CA23) ; S14 | 102 OK ; S14 ✅ |
| Bout en bout (banc) | S15-S21 | 7/7 (S21 avec réserve) |
| Non-régression | 4 suites, shellcheck | tout au vert |
| Sécurité | S7-S9, S12, S14, S15 (repère, droits), S19 (tronqué) | ✅ ; B2 et B6 relevés |
| UI | S1-S13, S22 (A3) | 14/14 |
| Manuel / doc | S22-S24 | S22 ✅, S23 ❌, S24 ❌ ; partie B du guide à faire |

## Bugs

| # | Sévérité | Titre | Reproduction | Attendu | Obtenu |
|---|---|---|---|---|---|
| B1 | Mineure — **corrigé** (`64f1bd6`, vérifié S13) | Date de réussite dans le futur → motif trompeur | `sauvegarde-reussie.json` avec `le` = maintenant + 5 h, ouvrir la page | Un motif qui parle d'horloge | Sur `8308ce6` : « …date de plus de 26 heures. » |
| B2 | **Majeure** | La copie `.env.avant-cle` bloque la mise à jour suivante | Sur le serveur, en `deploy` : la commande de `CLE-SAUVEGARDE.md` § 2 (= guide B4) avec une bonne clé, puis `git -C /opt/recrutement status --porcelain` | Dépôt propre (`deploy.sh` l. 62-64 exige `git status --porcelain` vide) | `?? .env.avant-cle` : `.gitignore` ne contient que `.env` ; le prochain `deploy/deploy.sh` s'arrête sur « ARRÊT : le dépôt contient des modifications ou des fichiers en trop (une copie de .env serait publiée) », et METTRE-A-JOUR § 4 dit alors « ne rien supprimer ». Le fichier n'entre pas dans l'image (`.dockerignore` : `.env*`), la phrase « elle n'est jamais publiée » est juste, mais la mise à jour est bloquée. Vu sur le banc jusqu'au `git status` (le `deploy.sh` du banc s'arrête avant, sur `DOMAIN=localhost`) |
| B3 | Mineure | RESTAURER étape 8 : sans suppression listée, la vérification affiche le journal | Volume neuf, base illisible, ou simplement aucune suppression depuis la copie : `IDS` vide → `-e IDS=''` | « rien à faire », ou rien | `suppressions.mjs` passe en mode liste (`!process.env.IDS`) et imprime les suppressions du journal de la copie (`cand-qa-b2 2026-10-28T08:43:02.054Z banc@yeita.fr`…), ni `À SUPPRIMER` ni `rien à faire` : ambigu pour l'opérateur (S21) |
| B4 | Mineure (doc) | Couche humaine du référentiel et backlog encore sur l'ancienne architecture | `git grep -il 'rclone\|healthchecks\|object storage' -- hlyja ':!hlyja/versions'` | Seules des mentions « retiré » | `hlyja/technique/architecture.humain.md` (l. 8 `deploy/healthchecks.sh`, l. 62, 72, 74, 86), `conventions.humain.md` (l. 50, 58, 60, 72), `decisions.humain.md` (l. 40, 77, 79), `deploiement-ovh.humain.md` ; backlog `1.7-5-rclone-paquet-universe.md` (sans objet), `1.7-2`, `1.7-3`, `1.1-6` (healthchecks, rclone, `deploy/healthchecks.sh`). En plus, le grep littéral de CA16 trouve `tools/test-sauvegarde.sh:154` (le test d'absence) |
| B5 | Mineure | Heure de la sauvegarde : « 3 h – 3 h 15 » est l'heure du serveur, pas forcément celle de Paris | `OnCalendar=*-*-* 03:00:00` suit le fuseau du serveur ; sur le banc (UTC) : prochain passage `03:05:36 UTC` | Guide B10 juste quel que soit le fuseau | Guide B10 attend « entre 3 h et 3 h 15 (heure de Paris) » sur la page, qui affiche l'heure de Paris : si le serveur est en UTC (défaut des images cloud Ubuntu), la page montrera 4 h – 4 h 15 (5 h en été). Fuseau du serveur réel non vérifié (`timedatectl`) ; même remarque pour la phrase de la page et de README § 14 |
| B6 | Moyenne | `tools/test-sauvegarde.sh` vide `/var/backups/recrutement` et ses gardes laissent passer le serveur | Lancer la suite en root sur une machine Ubuntu qui a `deploy` et `/var/backups/recrutement` (ce que le serveur de production a) | Refus hors d'un conteneur jetable | l. 104 `find "$COPIES" -mindepth 1 -delete`, l. 180 `rm -rf "$COPIES"` ; seul un commentaire dit « jamais sur le serveur ». Observé sur le banc : la relance de la suite a effacé les 2 copies faites juste avant. Sur le serveur, ce serait la perte de **toutes** les sauvegardes (il n'y a pas d'autre copie) |
| B7 | Mineure (doc) | RESTAURER 1 bis : ligne `EMPREINTE=<l'empreinte affichée par sha256sum>` | Coller le bloc 1 bis tel quel dans zsh ; `zsh -n` / `bash -n` du bloc | Bloc collable, ou valeur extraite par la commande | `unmatched '` : le shell attend la suite (`quote>`) ; seul bloc sur 42 refusé |
| B8 | Mineure (cosmétique) | Commentaires contradictoires dans les deux `.service` | `deploy/systemd/recrutement-*.service` l. 5-8 | Un seul commentaire juste | « sans jamais le démarrer : un Docker arrêté… n'est pas relancé » suivi de « docker.socket relance Docker au premier appel » (ajout de `64f1bd6` sans retrait de l'ancien) |

### Remarques (conformes à la spec, à arbitrer)
- **R1** : fichier illisible → le verdict le dit, mais la grille de détails affiche « aucune » (S5).
- **R2** : la commande d'installation des unités s'arrête à la première « DIFFÉRENTE » ; après une version qui change deux unités, il faut relancer une fois par unité.
- **R3** : RESTAURER étape 4 sur un volume neuf fait une sauvegarde chiffrée d'une base vide (sans danger, une copie de plus).
- **R4** : CA11 n'est rejoué ici qu'en partie (api arrêtée, concurrence, SIGTERM au lanceur) ; disque plein, lecture seule, SIGKILL et durée dépassée viennent de la campagne d'avant la reprise, dont `backup.sh` a gardé ces chemins.

## Ce qui reste manuel (partie B du guide, serveur réel)
B1 mise à jour par `deploy.sh` (7 `OK`) · B2 `apt install age` · B3 clé créée sur le Mac · B4 clé publique dans `.env` (**attention B2** : retirer ou ignorer `.env.avant-cle` avant le prochain déploiement) · B5 unités · B6 rôle admin · B7 première sauvegarde · B8 page verte en vrai derrière oauth2-proxy (dont un recruteur réel) · B9 déchiffrement sur le Mac · B10 sauvegarde de la nuit (**attention B5** : vérifier le fuseau du serveur). Non joués sur le banc faute d'oauth2-proxy : `tools/check-site.sh` (7 contrôles, vérifiés seulement à la lecture) et la redirection de `/admin/sauvegardes.html` vers Google.

## État du banc en fin de campagne
`/opt/recrutement` sur `64f1bd6`, dépôt propre, `.env` d'origine ; api `healthy` ; unités identiques à la branche, deux timers actifs ; 5 copies `.db.age` de test dans `/var/backups/recrutement` ; état des sauvegardes et du disque à jour (vert). Fichiers temporaires de la QA retirés de `/root/qa`. Serveurs locaux du Mac arrêtés.

## Corrections après la QA de la reprise (orchestrateur)
| Bug | Traitement |
|---|---|
| B2 (majeur) — `.env.avant-cle` laissé dans le dépôt : le `deploy.sh` suivant s'arrêterait | corrigé : copie dans `~/env-avant-cle` (hors du dépôt), page de la clé et guide (B4) |
| B3 — étape 8 de `RESTAURER.md` sans suppression : affiche le journal | corrigé : « Aucune suppression à refaire. » |
| B4 — vues humaines et fiches du backlog parlent encore de rclone, OVH, healthchecks.io | traité à l'étape documentation (rédacteur-relecteur) et backlog (curateur) |
| B5 — « heure de Paris » dans le guide (B10) faux si le serveur est en UTC | corrigé : heure du passage affiché par `list-timers` en B5, et décalage expliqué |
| B6 — le lanceur vide `/var/backups/recrutement` sans garde suffisante | corrigé : refus sans `BANC_JETABLE=oui`, et refus hors conteneur si les unités sont installées ; vérifié (refus, puis `TOUT OK` avec la variable, banc systemd et conteneur simple) |
| B7 — `EMPREINTE=<…>` bloque le shell | corrigé : empreinte récupérée par la commande |
| B8 — commentaires contradictoires des unités | corrigé |
Revérification : `tools/test-sauvegarde.sh` → `TOUT OK` (banc systemd et conteneur simple) ; shellcheck sans remarque sur les scripts livrés ; blocs des pages et du guide passés à `zsh -n` et `bash -n`.
