---
type: revue-backlog
version: 1.7
candidats: 12
nouvelles: 5
occurrences: 1
rejetes: 6
date: 2026-10-27
---

# Revue du backlog — version 1.7

> La 1.7 laisse surtout un risque de déploiement préexistant (`deploy.sh` sans masque, reproduction demandée), une alerte tardive dans un cas rare et de la dette de test ; trois rejets sont des défauts de la version à trancher maintenant (C1, C12, et la décision sur C5).

Curateur indépendant. Entrées : `version.md`, `spec/cadrage.md`, `spec/spec-finale.md` (R5, R7, R8, R10, R14), `revue/revue-code.md`, `revue/revue-doc.md`, `qa/rapport-qa.md`, `taches/05-banc-reel.md`, `challenges/tour-2.md`, `spec/verifications.md`, les 35 fiches de `hlyja/backlog/`, `doc/produit/stockage-partage.md`, et le code cité (`deploy/*.sh`, `deploy/systemd/*`, `docker/*.Dockerfile`).

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| C1 `Wants=docker.service` relance un Docker arrêté volontairement | revue de code, constat 3 | rejete | **Condition 2 — défaut de la version, renvoyé à l'orchestrateur.** Les deux unités sont nouvelles (R14) et la vérification horaire du disque redémarrerait Docker pendant une maintenance, avec tous les services du serveur partagé : contraire au critère du jury « pas d'effet sur les autres services ». À traiter avant la fin : corriger (retirer `docker.service` de `Wants=` en gardant `After=` ; noter que tout appel `docker` peut aussi réveiller Docker par `docker.socket`) ou documenter dans `deploy/README.md` § 14 « arrêter les timers `recrutement-*` avant une maintenance de Docker » et faire valider par l'utilisateur. |
| C2 `reglage()` en double (`deploy.sh` / `healthchecks.sh`) | revue de code, constat 10 | occurrence | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) : même proposition (contrôles communs des scripts de déploiement dans un fichier sourcé) ; ligne 1.7 ajoutée, priorité inchangée (basse, aucun effet). |
| C3 Pas de test « nom de `.db.age` déjà pris » | revue de code, constat 8 ; challenge T22 ; QA R1 | nouvelle | [1.7-3](../../../backlog/1.7-3-test-nom-copie-deja-pris.md) — dette, basse |
| C4 `deploy.sh` sans `umask` | revue de code, constat 1 (hors diff) ; P4 | nouvelle | [1.7-1](../../../backlog/1.7-1-deploy-sans-umask.md) — bug majeur préexistant (`deploy.sh` exclu par R5), preuve `constatee` : **reproduction demandée** (commande dans la fiche) ; moyenne en attendant, haute si reproduit. |
| C5 Deux sauvegardes dans la même seconde → `/fail` à tort | QA R1 ; tâche 05 (CA11) | rejete | **Conditions 2 et 4** : comportement voulu par la spec de la version (R7 « un nom par exécution », R8 « nom déjà pris → échec, rien n'est écrasé »), relevé conforme par la QA. Le verrou sérialise les exécutions : une collision exige une exécution complète en moins d'une seconde, vue seulement au banc avec un remote local ; sur le serveur, l'envoi vers OVH dure plusieurs secondes. Si l'orchestrateur veut l'éviter quand même, c'est une modification de la version (attendre la seconde suivante), pas une entrée de backlog. |
| C6 Dossier des copies absent : pas de `/fail`, alerte jusqu'à ~26 h | QA R2 (S11) ; tâche 05 | nouvelle | [1.7-2](../../../backlog/1.7-2-dossier-copies-absent-sans-alerte.md) — évolution, basse : conforme à la spec (R5 puis R7), amélioration du délai d'alerte. |
| C7 rclone 1.60.1, paquet *universe* | revue de code § A | nouvelle | [1.7-5](../../../backlog/1.7-5-rclone-paquet-universe.md) — dette, basse. Distincte de 1.2-7 (dépendances npm de l'API). |
| C8 Unités systemd sans durcissement | revue de code § B (selon la liste) | rejete | **Condition 1 — non fondé** : aucun passage de `revue/revue-code.md` (ni d'une autre trace de la 1.7) ne parle de `NoNewPrivileges`, `ProtectSystem` ou de durcissement ; le § B ne contient pas la phrase citée. Le raisonnement rapporté (« `deploy` est dans le groupe docker ») dit d'ailleurs que le gain serait nul. |
| C9 CA10 à CA13 sans test automatique dans le dépôt | QA R5 | nouvelle | [1.7-4](../../../backlog/1.7-4-banc-reel-sauvegarde-rejouable.md) — dette, basse |
| C10 `deploy.sh` jamais lancé de bout en bout avec un `.env` sans les 4 variables | tâche 05 (CA15) ; QA S18 | rejete | **Conditions 2 et 3** : c'est l'écart de vérification d'un CA de la version, à noter au bilan (et couvert par le premier déploiement réel, CA19) ; il ne décrit aucun défaut à corriger. `deploy.sh` ne cite aucune des 4 variables et `docker compose config` aboutit sans elles (S18). |
| C11 `docker compose cp` écrit « Copying / Copied » dans le journal | tâche 05 ; `spec/verifications.md` V6 | rejete | **Condition 3 (sans défaut) et 2** : le journal est l'endroit voulu du détail des outils (R10 : « le détail reste dans le journal ») ; deux lignes informatives, aucune donnée sensible. Si on veut les taire, c'est une redirection d'une ligne dans le code de la version (`deploy/backup.sh` l. 106), à faire maintenant. |
| C12 Mineurs de la relecture de doc laissés (schéma de `api.md`, phrase de `decisions.md`, `sources`, numéro de ligne) | `revue/revue-doc.md` § Traitement | rejete | **Condition 2 — défaut de la version, renvoyé à l'orchestrateur** : ce sont des pages du référentiel écrites par la 1.7 (constats 4, 5, 6, 9, 10) ; la correction attendue est déjà rédigée dans la revue de doc, quelques lignes chacune. À corriger avant le bilan plutôt que de les reporter. |

## Renvoyés à l'orchestrateur (défauts de la version)
- **C1** : `Wants=docker.service` (corriger ou documenter, avec l'accord de l'utilisateur).
- **C12** : constats mineurs 4, 5, 6, 9, 10 de `revue/revue-doc.md`.
- **C5** et **C11** : rien à faire sauf choix contraire de l'orchestrateur ; si une correction est voulue, elle se fait dans la version.

## Reproduction demandée
- **1.7-1** (bug majeur, preuve `constatee`) : commande dans la fiche (§ Reproduire), à lancer dans le scratchpad, sans toucher au dépôt. Attendu si le bug est réel : `600 api/server.js`, puis `EACCES` dans le conteneur. Reproduit → preuve `reproduite`, résultat recopié dans la fiche, priorité `haute`. Non reproduit → le noter dans la fiche, priorité à revoir.

## Doublons fusionnés
Aucun : les 35 fiches existantes ont été comparées deux à deux par sujet (notamment 1.1-6 / 1.3-3, 1.2-7 / 1.7-5, 1.3-1 / 1.4-1, 1.2-6 / 1.7-1) ; sujets voisins, problèmes distincts.

## Remarque sur les fiches existantes
Les fiches 1.6-1 à 1.6-4 portent `nature: amelioration`, qui n'est pas une nature du backlog (`bug`, `evolution`, `dette`) : elles se lisent `evolution`. Non modifiées ici ; à corriger par la version qui les touchera.

## Suite donnée par l'orchestrateur
- 1.7-1 : reproduction faite (dossier temporaire du scratchpad, rien dans le dépôt) : `600 api/server.js`, puis `Error: EACCES: permission denied, open '/app/api/server.js'` → preuve `reproduite`, priorité **haute**.
- C1 (défaut de la version) : **corrigé** — `docker.service` retiré de `Wants=` dans les deux unités (`After=` gardé) ; § 14 de `deploy/README.md` : arrêter les timers avant une maintenance de Docker (`docker.socket` démarre Docker au premier appel). Unités revérifiées sur le banc systemd (`systemd-analyze verify`, sauvegarde et vérification du disque lancées). Écart à R14 noté au bilan.
- C12 (défaut de la version) : **corrigé** — mineurs 4, 5, 6, 9, 10 de `revue-doc.md` (numéro de ligne, `sources`, schéma de `api.md`, phrase de `decisions.md`).

## Reprise (2026-10-28)

> La reprise laisse surtout des choix assumés par l'utilisateur à suivre (alertes par email, copie hors du serveur, coffre pour la clé) et une page d'état sans test automatique alors qu'elle est devenue le seul signal d'échec ; deux fiches de la première passe sont réglées ou sans objet.

Curateur indépendant, second passage. Entrées : `version.md` (section Reprise), `spec/spec-finale.md`, `revue/revue-code-reprise.md`, `qa/rapport-qa.md` (reprise ; l'ancien rapport est lu par `git show 0e037e9:…`), `taches/08-reprise.md`, `technique/decisions.md`, les 40 fiches de `hlyja/backlog/`, et le code cité (`deploy/backup.sh`, `deploy/commun.sh`, `deploy/deploy.sh`, `deploy/README.md`, `deploy/METTRE-A-JOUR.md`, `deploy/CLE-SAUVEGARDE.md`, `deploy/RESTAURER.md`, `tools/test-sauvegarde.sh`, `tools/`, `api/src/sauvegardes.js`). 6 candidats : 6 nouvelles, 0 occurrence, 0 rejet.

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| C13 Alertes par email (sauvegarde ratée, disque > 80 %) | `version.md` (reprise) ; spec finale (Exclu, R10) | nouvelle | [1.7-6](../../../backlog/1.7-6-alertes-email-sauvegardes.md) — évolution, **moyenne** : bénéfice concret et constaté, mais vérification à la main acceptée par l'utilisateur et page d'état rouge dès la tentative. Distincte de 1.1-4 (nettoyage des images, « alerte de disque hors sujet »). |
| C14 Tableau de bord d'administration sous `/admin/` | `version.md` (reprise) ; `technique/decisions.md` | nouvelle | [1.7-7](../../../backlog/1.7-7-tableau-de-bord-admin.md) — évolution, **basse** : contenu non défini, bénéfice encore flou. |
| C15 Copie des sauvegardes hors du serveur | spec finale (Contexte) ; `deploy/RESTAURER.md` « Serveur perdu » ; `technique/decisions.md` | nouvelle | [1.7-8](../../../backlog/1.7-8-copie-hors-du-serveur.md) — évolution, **moyenne**. Condition 4 vérifiée : l'utilisateur a accepté le risque *pour l'instant* (« pourra être ajoutée plus tard »), ce n'est pas une règle métier contraire. Option « autre machine en SSH » : évoquée par l'orchestrateur, sans passage écrit trouvé ; « Google Drive de Workspace » : `decisions.md`. Pas `haute` tant que le choix de l'utilisateur tient. |
| C16 Clé age en clair dans un `.txt`, sans phrase de passe ; coffre interne voulu | revue de code de la reprise (#9, laissé) ; `version.md` ; spec R17 | nouvelle | [1.7-9](../../../backlog/1.7-9-cle-sauvegarde-coffre.md) — évolution, **moyenne** (données personnelles ; il faut aussi une copie `.db.age`, qui ne sort que du serveur). |
| C17 Bloc d'installation des unités dupliqué (`deploy/README.md` § 14 / `deploy/METTRE-A-JOUR.md` § 5) | annoncé comme « revue de code de la reprise, C. Qualité » : **passage introuvable** dans `revue-code-reprise.md` (pas de section C) ; constat refait par le curateur dans les deux fichiers ; QA de la reprise R2 | nouvelle | [1.7-10](../../../backlog/1.7-10-installation-unites-dupliquee.md) — dette, **basse** (blocs identiques aujourd'hui). Distincte de 1.1-6 (scripts, pas pages). |
| C18 `admin/sauvegardes.html` sans test automatique | QA de la reprise (couche UI à la main) ; tâche 08 ; constat : aucun fichier de `tools/` ni `api/test/` n'ouvre la page | nouvelle | [1.7-11](../../../backlog/1.7-11-page-admin-sans-test-automatique.md) — dette, **moyenne** : la page est le seul signal d'échec depuis le retrait des alertes. Même remarque de source que C17 pour « revue de code, C. Qualité ». |

### Fiches revues

| Fiche | Avant | Après | Raison |
|---|---|---|---|
| [1.7-1](../../../backlog/1.7-1-deploy-sans-umask.md) `deploy.sh` sans `umask` | ouvert, haute | ouvert, **haute** (inchangée) | Le bug reste (`deploy/deploy.sh` non modifié) ; `METTRE-A-JOUR.md` § 2 le contourne par `umask 022 &&`, mais `deploy/README.md` § 9 lance encore le script sans masque. Résumé et « Où » mis à jour. Pas d'occurrence : aucune nouvelle observation à la reprise. |
| [1.7-2](../../../backlog/1.7-2-dossier-copies-absent-sans-alerte.md) dossier des copies absent sans alerte | ouvert, basse | **fait** (`fait_en: 1.7`) | Réglée par la reprise : `backup.sh` écrit l'état `echec` « dossier des copies » (l. 53-55), testé (« R5 dossier des copies absent : échec écrit ») ; la page passe au rouge. Le délai healthchecks.io n'existe plus ; l'envoi d'une alerte relève de 1.7-6. |
| [1.7-3](../../../backlog/1.7-3-test-nom-copie-deja-pris.md) pas de test « nom déjà pris » | ouvert, basse | ouvert, basse | Toujours juste (aucun cas dans `tools/test-sauvegarde.sh`). Retirés : « chez OVH », `/fail`, rclone ; attendu réécrit sur l'état ; numéros de ligne et nombre de vérifications (102) mis à jour ; passage de QA pointé vers l'ancien rapport. |
| [1.7-4](../../../backlog/1.7-4-banc-reel-sauvegarde-rejouable.md) banc réel non rejouable | ouvert, basse | ouvert, basse | Toujours juste : le banc a été remonté à la main une seconde fois, scripts hors dépôt. Ajouts : CA24, garde `BANC_JETABLE=oui` du lanceur réécrit, source QA de la reprise (R4) sur la même ligne 1.7 ; piste exprimée en CA au lieu des numéros de scénarios de l'ancien rapport. |
| [1.7-5](../../../backlog/1.7-5-rclone-paquet-universe.md) rclone *universe* | ouvert, basse | **fait** (`fait_en: 1.7`) | Sans objet : rclone retiré par la reprise (CA16). Rien à proposer au refus : le risque a disparu avec l'outil. |
| [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) contrôles dupliqués des scripts | ouvert, basse | ouvert, basse | `deploy/healthchecks.sh` est devenu `deploy/commun.sh` : constat et piste réécrits (faire charger `commun.sh` par `deploy.sh`) ; `reglage()` toujours en double (`deploy.sh` l. 39). |
| [1.2-5](../../../backlog/1.2-5-sauvegarde-base-sqlite.md) sauvegarde de la base | fait | fait | Une ligne ajoutée à « Décision » : l'envoi hors du serveur est retiré par la reprise, suivi par 1.7-8 (la décision d'origine parlait d'OVH). |

### Doublons fusionnés
Aucun : 1.7-6 / 1.1-4, 1.7-10 / 1.1-6, 1.7-11 / 1.3-6, 1.7-8 / 1.2-5 comparées ; sujets voisins, problèmes distincts.

### À signaler à l'orchestrateur
- Les sources « revue de code de la reprise, C. Qualité » de C17 et C18 n'existent pas dans `revue/revue-code-reprise.md` ; les deux constats sont fondés sur les fichiers eux-mêmes et sur la QA. Si une section Qualité a été perdue, la rétablir dans la revue.
- QA B4 : les fiches 1.7-2 et 1.7-5 (passées en `fait`) gardent dans leur corps les mentions historiques de healthchecks.io et rclone, expliquées par leur « Décision » ; le grep de B4 les trouvera encore.
