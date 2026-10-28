---
type: revue-backlog
version: 1.9
candidats: 14
nouvelles: 5
occurrences: 4
fusionnes: 1
rejetes: 4
---

# Revue du backlog — version 1.9

> La 1.9 laisse un bug préexistant à traiter en premier (1.9-1 : dernière frappe perdue au départ d'une fiche, qui garde `e2e-serveur` au rouge), une évolution utile à l'exploitation (1.9-2 : unités systemd modifiées jamais signalées) et trois petites dettes ou évolutions du déploiement automatique ; aucun candidat n'est un défaut de la version.

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| `e2e-serveur` : départ de `candidat.html` avec un PUT précédent lent → `200 200 200 409`, dernière frappe absente de la base | QA (Régressions), tâche 07 (Résultat QA), orchestrateur (2 rejeux sur `main`) | nouvelle (bug, majeur, reproduite, **haute**) | [1.9-1](../../../backlog/1.9-1-depart-page-put-lent-409.md) — préexistant : même échec sur `main` (`b066b31`) ; `TOUT OK` en 1.4 et 1.6, donc apparu après la 1.6 ou venu de l'environnement |
| Unités systemd modifiées par un commit jamais réinstallées (X10) | challenger Exploitation, tour 1 ; arbitre (écarté : extension) ; spec finale (Exclu) | nouvelle (évolution, moyenne) | [1.9-2](../../../backlog/1.9-2-unites-modifiees-jamais-signalees.md) |
| Rien ne limite les demandes répétées (S3) | revue de code | nouvelle (évolution, basse) | [1.9-3](../../../backlog/1.9-3-demandes-repetees-sans-limite.md) |
| Demande illisible enregistrée « refusée », qui peut remplir les 30 passages | `technique/decisions.md` (« Frontière ») | fusion | dans [1.9-3](../../../backlog/1.9-3-demandes-repetees-sans-limite.md) : même sujet (abus du canal des demandes) ; conséquence du pitch (« refusée et enregistrée »), pas un défaut |
| Conteneurs de test sans limites (S5) | revue de code | nouvelle (dette, basse) | [1.9-4](../../../backlog/1.9-4-conteneurs-de-test-sans-limites.md) |
| Variables `AUTO_DEPLOY_*` appliquées sans trace (Q16) | revue de code | nouvelle (dette, basse) | [1.9-5](../../../backlog/1.9-5-reglages-auto-deploy-sans-trace.md) — mineur laissé ouvert par la revue, sans effet en usage normal : pas un défaut de la version (correction d'une ligne, à côté de la l. 372, possible avant le bilan si l'orchestrateur le souhaite) |
| Recopie de `docker compose run --rm --no-deps -T api sh -c` (Q10) | revue de code | occurrence | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) — même sujet (scripts de déploiement qui se recopient, à regrouper dans `deploy/commun.sh`) ; deux copies dans les scripts (`commun.sh` l. 30, `auto-deploy.sh` l. 192), pas trois ; priorité inchangée (basse) |
| Cache de construction de chaque commit testé gardé (X14, R9) | challenger Exploitation, tour 1 ; spec finale R9 | occurrence | [1.1-4](../../../backlog/1.1-4-disque-images-de-construction.md) — même sujet (cache et images qui s'accumulent) ; priorité inchangée (basse) : `verif-disque` surveille |
| Aucune notification non plus pour un retour raté | challenger Déploiement, tour 1 (D6 : « personne averti ») ; R11 (alerte sur la page seulement) | occurrence | [1.7-6](../../../backlog/1.7-6-alertes-email-sauvegardes.md) — même proposition (email aux admins quand un verdict admin passe au rouge), élargie à la page des déploiements ; titre élargi ; priorité gardée moyenne (notifications exclues par le pitch, à reprendre en premier si l'automatisme casse le site) |
| Deux pages admin, sans lien entre elles | constat du curateur sur le code (`admin/*.html`) | occurrence | [1.7-7](../../../backlog/1.7-7-tableau-de-bord-admin.md) — la mention dans le hors périmètre du cadrage ne compte pas ; le constat (aucun `href` d'une page vers l'autre) si ; priorité inchangée (basse) |
| Page admin sans test automatique : `sauvegardes.html` ? | orchestrateur | rejete (comme occurrence) | pas de nouvelle observation : la 1.9 n'a rien vu de neuf sur `sauvegardes.html`, toujours non testée (rappel seulement). [1.7-11](../../../backlog/1.7-11-page-admin-sans-test-automatique.md) mise à jour sans occurrence : la piste réutilise la fonction `deploiement` de `tools/e2e-serveur.py`, effort M → S, lien vers 1.9-1 |
| Pas de « Déployer ce commit » juste après la mise en service (QA R2) | QA, Remarques | rejete | condition 4 : règle écrite de la doc produit (`doc/produit/deploiement-automatique.md` : « « Déployer ce commit » n'existe que pour un commit dont un passage a réussi les tests ; pour un autre commit : `deploy.sh <hash>` en SSH ») ; fenêtre courte (jusqu'au deuxième merge), secours en SSH documenté. L'utilisateur peut en faire une évolution s'il le souhaite |
| « Déployer ce commit » visible sur un commit que l'hôte refusera (Q17) | revue de code (« voulu » selon l'orchestrateur) | rejete | condition 4 : l'hôte décide et enregistre le refus avec son motif (doc produit, R3) ; sans effet nuisible. Le curateur ne pose pas `voulu` (réservé à l'utilisateur) : rien n'entre au backlog |
| Motif « commit mal formé » inatteignable (Q6) | revue de code (« voulu » selon l'orchestrateur) | rejete | condition 3 : rien à corriger, défense en profondeur gardée exprès, sans effet |

Fiches relues sans changement de verdict : [1.3-6](../../../backlog/1.3-6-suites-mode-serveur-robustesse.md) (le `FAIL` de 1.9-1 n'est pas son sujet ; `tools/e2e-serveur.py` garde son port fixe et son lancement hors du `try`, rien de neuf observé en 1.9) ; [1.8-1](../../../backlog/1.8-1-depot-serveur-deja-abime.md) (seulement cité au hors périmètre : pas d'occurrence ; ajout au Risque d'un raisonnement daté 1.9, marqué sans constat : avec un dépôt abîmé, les tests passent dans le worktree neuf et c'est la mise en ligne, puis le retour, qui échouent).

## Défauts de la version
Aucun candidat n'est un défaut de la 1.9 : 1.9-1 existe à l'identique sur `main` ; S3, S5, Q16 et X10 sont des durcissements ou extensions que la revue et l'arbitre ont laissés ouverts, sans effet en usage normal. À dire au bilan : `tools/e2e-serveur.py` finit sur `ÉCHECS` (91 OK, 1 FAIL) à cause de 1.9-1, préexistant.

## Reproduction
Aucune demandée : le seul bug majeur (1.9-1) est déjà reproduit (QA sur `b066b31`, deux rejeux de l'orchestrateur). Proposé, pour qualifier la cause sans changer la priorité : rejouer `e2e-serveur` dans le même conteneur sur `f3ed44c` (1.6, annoncé `TOUT OK`), puis `96ef045` et `2cc0c3d`.

## Doublons fusionnés
Aucun parmi les fiches existantes. Remarque de forme : les fiches 1.6-1 à 1.6-4 portent `nature: amelioration`, absente des natures admises (`bug`, `evolution`, `dette`) ; à corriger en `evolution` lors d'une prochaine modification.
