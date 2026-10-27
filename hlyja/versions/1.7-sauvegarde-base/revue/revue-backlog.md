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
