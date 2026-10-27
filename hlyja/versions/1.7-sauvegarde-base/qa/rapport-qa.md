---
type: rapport-qa
version: 1.7
scenarios: 23
reussis: 23
echecs: 0
bugs: 2
date: 2026-10-27
---

# Rapport de QA — Sauvegarde chiffrée de la base, hors du serveur, avec alertes

> 23 scénarios sur 23 réussis (100 %, dont S18 en partie) · aucune régression · 2 bugs mineurs (une doc, une forme de ping), aucun bloquant ni majeur · 5 remarques conformes à la spec · restauration de bout en bout réussie dans les 4 cas · CA19 reste à faire sur le vrai serveur

QA indépendante, plan écrit avant de lire les fiches de tâches ([plan](plan-de-test.md)). Banc `banc17s` (Ubuntu 26.04.1, systemd en PID 1, vrai dockerd et vraie image api, `age` 1.2.1, `rclone` 1.60.1 avec le remote `ovh` en alias local, faux healthchecks.io en HTTPS avec un certificat du magasin du système). `/opt/recrutement` est sur `00e76bc` : le dernier commit ne change que de la doc `hlyja/`, ce qui revient au code de `26c1d9f`. Aucun code de production n'a été modifié.

## Non-régression : lignes de verdict recopiées
| Suite | Où | Ligne de verdict (mot pour mot) | Code |
|---|---|---|---|
| `cd api && npm test` | poste | `ℹ pass 55` / `ℹ fail 0` | 0 |
| `node tools/test-store.js` | poste | `TOUT OK` | 0 |
| `node tools/test-serveur.js` | poste | `TOUT OK (87 vérifications)` | 0 |
| `tools/test-sauvegarde.sh /depot` | banc (`banc-hc` arrêté) | `TOUT OK` (119 `OK`) ; après l'ajout de la QA : `TOUT OK` (125 `OK`) | 0 |
| shellcheck 0.10.0 (`backup.sh`, `verif-disque.sh`, `healthchecks.sh`, `prepare-serveur.sh`) | poste | aucune sortie | 0 |
| e2e Playwright (5 suites) | — | non lancées : ni page, ni asset, ni route de l'API ne changent (dans `api/`, seul `sauvegarde.js` s'ajoute, hors du serveur HTTP) | — |

`api/test` compte toujours 7 fichiers. Il y a 55 tests au lieu des 52 notés dans `conventions.md` : ce sont les 3 tests de `sauvegarde.js` (CA1-CA3).

**Ajout au lanceur (signalé)** : CA14 n'avait aucune couverture automatique. J'ai ajouté 6 vérifications à la fin de `tools/test-sauvegarde.sh` (section « CA14 … (ajout QA) ») : `prepare-serveur.sh` lancé avec un `PATH` réduit, sans `age` puis sans `rclone`. Pour chaque cas : code 1, message exact de R13, empreinte du système inchangée. shellcheck ne fait aucune remarque sur les lignes ajoutées. CA10 à CA13 n'ont pas non plus de couverture automatique dans le dépôt : il leur faut systemd, un vrai dockerd et l'image api. Ils sont couverts par les scénarios du banc ci-dessous, et je propose de les automatiser via le backlog plutôt que dans ce lanceur.

## Résultat par scénario
| # | Scénario | Critère | Résultat | Constat |
|---|---|---|---|---|
| S1 | Bout en bout réel avec repère | CA10 | réussi | code 0. Le `.db.age` est en 600 et commence par `age-encryption.org/v1`. L'objet distant est identique octet pour octet. Une fois déchiffré : `ok`, 3 candidats, repère présent. Le repère est absent de `/var/backups/recrutement`, `/tmp`, `/home/deploy` et `/opt/recrutement`. Ping de succès reçu. |
| S2 | Deux exécutions le même jour | CA4 | réussi | deux `.db.age` distincts en local et sur le remote ; une seule copie du jour dans `/data/sauvegardes` |
| S3 | `--nettoyer` dans le vrai conteneur | CA3 | réussi | « supprimées : 2 » (copie et temporaire de 49 h) ; la copie de 47 h et `autre.txt` sont gardés |
| S4 | Aucun secret dans `ps`, la sortie, le journal ou les corps de ping | CA5, CA9, R20 | réussi | `ps` a été relevé 400 fois pendant une sauvegarde réelle. `curl` y apparaît avec `-K /dev/fd/63` : l'adresse n'est jamais en argument. Ni les UUID, ni `AGE_RECIPIENT`, ni le repère n'apparaissent dans la sortie, le journal ou les corps. Remarque R4. |
| S5 | `verif-disque.sh` réel et son unité | CA9 | réussi | « Disque racine : 7 % ; dossier Docker : 7 % ; seuil : 80 %. » ; le ping part sur l'adresse « disque » ; unité `Result=success` |
| S6 | `systemctl start recrutement-backup` | CA13 | réussi | `Result=success`, nouvel objet distant, journal sans adresse de ping |
| S7 | `.env` aux valeurs de `.env.example` | CA6, R19 | réussi | refus qui nomme la variable, code 1, aucune copie lancée. Adresses à l'exemple : aucun ping. `RCLONE_DEST` à l'exemple ou réduit à un commentaire : `/fail « réglages »`, conforme à R7 (1). |
| S8 | API arrêtée, puis relance | CA11 | réussi | `ÉCHEC (api non saine)`, `/fail`, aucun clair, les 5 copies chiffrées sont gardées ; la relance aboutit |
| S9 | Disque plein (tmpfs de 40 puis 76 Ko) | CA11 | réussi | `ÉCHEC (récupération (docker compose cp))`, puis `ÉCHEC (chiffrement (age))`. Dans les deux cas : `/fail`, aucun `.db` ni `.tmp` restant, ancienne copie gardée. La relance aboutit. |
| S10 | 4 000 écritures par l'API pendant les sauvegardes | CA11, CA1 | réussi | les 4 000 PUT ont répondu 201, aucune erreur côté API. La copie faite pendant la rafale est `ok` et contient un état intermédiaire (1 277 dossiers). Remarque R1. |
| S11 | Dossier en lecture seule (500), puis en 750 | CA11 | réussi | 500 : « absent ou non inscriptible » (remarque R2). 750 : `ÉCHEC (réglages) : … n'est pas en 700.` et `/fail`. La relance aboutit. |
| S12 | API redémarrée pendant la sauvegarde | CA11 | réussi | les deux essais aboutissent sans clair. Je ne peux pas garantir que le redémarrage est tombé pile pendant la copie : la fenêtre ne dure que quelques dixièmes de seconde. |
| S13 | SIGKILL de l'unité pendant le chiffrement | CA11, R14 | réussi | pendant l'arrêt, `recrutement-2026-10-27.db` est présent. Après `systemctl kill -s KILL`, `ExecStopPost` ne laisse que `.backup.lock`. Surcharge de test hors du dépôt (`age` ralenti), retirée ensuite. |
| S14 | `TimeoutStartSec=12s` dépassé pendant un envoi lent | CA11 | réussi | `Result=timeout`, `/fail « envoi (rclone) (interrompue) »`, aucun clair, rien envoyé |
| S15 | Sauvegarde manuelle ralentie, unité lancée pendant ce temps | CA11, CA7 | réussi | l'unité sort en code 1 sur « une sauvegarde est déjà en cours », sans ping. Le clair de la sauvegarde manuelle reste en place pendant ce temps : `ExecStopPost` n'y touche pas. La sauvegarde manuelle aboutit, en local et sur le remote. |
| S16 | `systemd-analyze verify` et commandes d'installation du README | CA13 | réussi | `verify` ne fait aucune remarque. 1re fois : « copiée » ×4, puis les timers sont listés. 2e fois : « identique » ×4. Unité modifiée : « DIFFÉRENTE », la différence s'affiche, code 1, rien n'est écrasé. La commande « Mettre à jour une unité » ramène l'état à « identique ». |
| S17 | `prepare-serveur.sh` sans `age`, sans `rclone`, puis avec | CA14, CA15 | réussi | message exact de R13, code 1, « Rien n'a été modifié. » (empreinte inchangée) ; avec les deux outils : aboutit, et une seconde exécution aussi (« Clé SSH déjà autorisée. ») |
| S18 | `deploy.sh` pendant une sauvegarde, et `.env` sans les 4 variables | R5, CA15, R19 | réussi en partie | « un déploiement est déjà en cours », code 1, et la sauvegarde aboutit. Sans les 4 variables : `docker compose config` aboutit, et ni `deploy.sh` ni `compose.yaml` ne les citent. `deploy.sh` n'a **pas** été lancé jusqu'au bout : il basculerait le banc sur `main`, qui n'a pas les scripts, et reconstruirait le front. |
| S19 | **Restauration de bout en bout**, `RESTAURER.md` à la lettre (étapes 1 à 9) | CA12, R16 | réussi | voir la section suivante |
| S20 | Transfert tronqué, empreinte fausse, copie abîmée, `user_version=2` | CA12 | réussi | trois `REFUS : …`, puis « La base actuelle n'est pas touchée. » La base actuelle est inchangée (`cand-qa-s20` toujours là) et `/data` ne contient que la base, ses `-wal`/`-shm` et `sauvegardes`. |
| S21 | Volume intact, API saine (1 bis puis 4 à 8) | CA12 | réussi | la copie mise de côté a 3 dossiers (`cand-qa-s20`…) ; l'état actuel en a 4 (`cand-qa-intact`) et est sauvegardé à l'étape 4. Après restauration : les 3 de la copie choisie, pas l'état actuel. `/data` est propre. |
| S22 | Volume neuf (« Serveur perdu », étape 3) | CA12 | réussi | volume supprimé, puis l'API démarre sur une base vide. Étapes 1-3, 5, 6, 7, 8 : `Base remplacée.`, `healthy`, comptes de l'étape 3 |
| S23 | Relecture des docs contre la spec | CA16 | réussi avec un écart | les éléments de CA16 sont présents. Bug B1 : le retrait complet des unités n'est pas documenté. |

## Restauration de bout en bout (S19)
Je n'ai appliqué que les substitutions qu'impose le banc :
- `ssh deploy@SERVEUR '…'` devient `runuser -u deploy -- bash -c '…'`, avec la même entrée standard ;
- `pbpaste` lit la clé de test, et `pbcopy` est ignoré ;
- le remote `restau` est un alias vers `/srv/distant`, avec `BUCKET=bucket` ;
- `TMPDIR=/root/poste-qa` : le « poste » partage la machine du « serveur ». Ce n'est pas un second conteneur, comme le demanderait CA12.

Les trois programmes sont **extraits automatiquement** de `RESTAURER.md`, pas recopiés à la main.

| Étape | Obtenu |
|---|---|
| Avant de commencer | `age-keygen -y` = `AGE_RECIPIENT` du serveur ; dossier en 077 |
| 1-2 | copie `…T162233Z.db.age` récupérée par `restau:` et déchiffrée |
| 3 | `ok`, `1`, `candidats|3`, `equipe|1`, `journal|2`, dernier `2026-10-27T16:22:21.345Z` ; empreinte notée |
| 4 | `Sauvegarde réussie : recrutement-2026-10-27T163011Z.db.age …` (état actuel gardé, 4 303 dossiers) |
| 5 | `cand-qa-suppr 2026-10-27T16:29:27.367Z banc@yeita.fr` (le dossier supprimé après la copie est listé) |
| 6 | `Base remplacée.` |
| 7 | `healthy` ; `/data` = `recrutement.sqlite`, `-shm`, `-wal`, `sauvegardes` ; fichiers `1000:1000` (`node`) en 600 |
| 8 | mêmes comptes qu'à l'étape 3. La commande affiche `À SUPPRIMER https://recrutement.yeita.fr/candidatures/candidat.html?id=cand-qa-suppr`. Le dossier est supprimé par l'API (`DELETE`, 204, comme le fait l'interface). La relance affiche `rien à faire : cand-qa-suppr`. |
| 9 | dossier du poste effacé |
| Après | repère absent hors du volume côté serveur : recherche dans `/var/backups`, `/tmp`, `/home`, `/opt/recrutement` et `/var/lib/docker` hors de `volumes/recrutement_data` |

Non fait : `tools/check-site.sh https://DOMAINE` et « un membre ouvre un dossier connu ». Le banc n'a ni front ni domaine : ces deux gestes sont à faire sur le serveur.

## Résultat par couche
| Couche | Résultat |
|---|---|
| Unitaire | `npm test` : 55/55 (CA1-CA3) |
| Intégration | lanceur 125/125 (CA4-CA9, R8, CA14 ajouté) ; S3, S10, S15, S17, S18 réussis |
| Bout en bout | S1-S22 réussis sur le banc systemd réel |
| Non-régression | 5 suites vertes, aucune régression |
| Sécurité | clair jamais laissé (S8, S9, S11, S13, S14), aucun secret en argument ni dans les traces (S4), aucun repère hors du volume après restauration (S19), refus d'une copie tronquée, abîmée ou de mauvaise version (S20) |
| Manuel | S23 (relecture) ; CA19 : à faire sur le serveur |

Taux de réussite : **23 / 23 scénarios (100 %)**, dont S18 en partie. **0 régression.**

## Bugs
| # | Sévérité | Reproduction | Attendu | Obtenu |
|---|---|---|---|---|
| B1 | mineure (doc) | lire `deploy/README.md` (sections retour arrière et 14) | spec, « Déploiement et compatibilité » : « retrait complet : les 4 fichiers de `/etc/systemd/system` supprimés, `daemon-reload` » | seul `disable --now` des timers est écrit (l. 269). Rien n'indique comment retirer les 4 unités. |
| B2 | mineure (forme) | `deploy/backup.sh` réussi, puis en échec ; lire les corps reçus par healthchecks | R10 : corps = texte fixe par étape, **le code de sortie et la taille du `.age`** | succès : « Sauvegarde réussie (32968 octets chiffrés). », sans code. Échec : « Échec : chiffrement (age) (code 1). », sans taille. Aucun effet sur les alertes. |

## Remarques (conformes à la spec, à arbitrer)
- **R1** : deux sauvegardes lancées dans la même seconde. La seconde échoue sur « `….db.age` existe déjà : rien n'est écrasé. » et envoie `/fail` (vu en S10, lancements à moins d'une seconde d'écart). C'est conforme à R8 et couvre le test « nom déjà pris » du backlog. En contrepartie, une relance immédiate à la main peut faire passer l'alerte au rouge à tort.
- **R2** : `/var/backups/recrutement` absent ou non inscriptible. Le script s'arrête avant de lire les adresses, parce que son verrou est dans ce dossier : aucun `/fail` ne part. L'alerte ne vient que par absence de ping, donc jusqu'à 26 h plus tard (période + grâce).
- **R3** : « l'api n'est pas saine après 6 s » s'affiche au bout d'environ 4 s : la boucle fait n/2 essais et n/2 − 1 pauses. Avec la valeur par défaut, l'écart est d'environ 2 s sur 120 : négligeable.
- **R4** : `AGE_RECIPIENT` apparaît dans `ps`, comme argument de `age -r`. C'est une clé publique, et R20 ne vise que le journal et les corps de ping : pas un problème.
- **R5** : CA10 à CA13 n'ont pas de test automatique dans le dépôt. Les preuves viennent des essais du banc (fiches 05 et 06, et ce rapport). Entrée de backlog proposée : un lanceur « banc réel » rejouable.

## Reste manuel : CA19, sur le vrai serveur
Non faisable sur le banc (OVH, healthchecks.io et politiques S3 réels ; hypothèses H1 et H3) :
1. `curl` vers l'adresse de ping affiche exactement `OK`.
2. `deploy/backup.sh` passe le contrôle « sauvegarde » au vert ; `deploy/verif-disque.sh`, une minute après, passe le contrôle « disque » au vert.
3. `rclone lsl "$RCLONE_DEST"` montre le `.db.age`.
4. Depuis un poste, avec l'utilisateur « administrateur » : `get-bucket-lifecycle-configuration` relit la règle de 30 jours ; `get-bucket-versioning` n'indique pas `Enabled`.
5. Sur le serveur : `rclone deletefile` sur l'objet est **refusé** (H3). Aucun fichier d'identifiants S3 autre que `rclone.conf` dans le dossier de `deploy`.
6. Depuis un poste, avec l'utilisateur « restauration » : `rclone lsl` liste les copies ; `rclone copyto` vers le bucket et `rclone deletefile` sont **refusés** (H3).
7. Essai de bout en bout de R17 : « Ouvrir une copie » de `RESTAURER.md` sur la dernière copie OVH donne `ok`.
8. Un `/fail` fait passer l'alerte au rouge, email reçu ; une sauvegarde la remet au vert.
9. `systemctl list-timers 'recrutement-*'` montre les deux timers.
10. Le lendemain : `sudo journalctl -u recrutement-backup` montre la sauvegarde de la nuit, sans adresse de ping.
11. Sur le serveur, lors d'une vraie restauration : `tools/check-site.sh https://recrutement.yeita.fr` finit par `Tout est OK`, et un membre ouvre un dossier connu (S19, étape 8).

## État du banc après la QA
- Le volume `recrutement_data` a été recréé (S22). Il contient la copie `…T162233Z` restaurée : 3 dossiers.
- Les unités ont été réinstallées à l'identique par la commande du README, et les timers sont actifs.
- `.env` et `authorized_keys` sont remis à l'état d'avant la QA ; les surcharges systemd et les faux outils de test sont retirés ; `banc-hc` est relancé.
- Scripts de la QA : `/root/qa/` (`s19.sh`, `s20c.sh`, `s4.sh`, `api.mjs`, journaux).

## Corrections après la QA (orchestrateur)
| Bug | Traitement |
|---|---|
| B1 (mineur) — retrait complet des unités absent de `deploy/README.md` | corrigé : paragraphe « Retirer les sauvegardes » (§ 14) |
| B2 (mineur) — code de sortie absent du message de succès | corrigé : « Sauvegarde réussie (code 0, n octets chiffrés). » ; le message d'échec garde l'étape et le code (pas de fichier chiffré, donc pas de taille) |
| Remarque — deux sauvegardes dans la même seconde | backlog |
| Remarque — `/var/backups/recrutement` absent : alerte par absence seulement | backlog |
| Banc — le cas « vrai `df` » visait `/var/lib/docker`, absent d'un conteneur sans dockerd | corrigé : `FAUX_DOCKER_DIR=/var` pour ce cas |
Revérification : `tools/test-sauvegarde.sh` → **`TOUT OK`** (125 vérifications) dans le banc systemd et dans un conteneur `ubuntu:26.04` simple (la commande du guide de test humain, partie A) ; shellcheck sans remarque.
