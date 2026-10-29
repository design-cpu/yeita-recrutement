---
type: revue-backlog
version: 1.10
candidats: 14
nouvelles: 9
occurrences: 2
rejetes: 2
renvois: 2
date: 2026-10-28
---

# Revue du backlog — version 1.10

> La 1.10 laisse surtout des finitions autour des fichiers : rétention d'un CV non cité (moyenne), journal et extraction pour la restauration, durcissements (nginx, CSP), nettoyage du code ; elle reproduit une seconde fois le bug 1.9-1 (haute) et deux défauts de la version sont renvoyés à l'orchestrateur.

Le candidat 6 est séparé en deux lignes (6a, 6b) : deux sujets, deux verdicts. Le candidat 13 donne une occurrence (1.9-1) et une mise à jour sans occurrence (1.10-3).

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| 1. Journal du retrait d'un fichier, pour le refaire après restauration | arbitre, tour 1 (O4, `extension` ; S3 intégré en R15) | nouvelle | [1.10-6](../../../backlog/1.10-6-journal-retrait-fichier.md) — evolution, basse, `constatee` (`RESTAURER.md` l. 155 ; aucune écriture au journal dans `api/src/fichiers.js`) |
| 2. Extraire un CV d'une copie sur le Mac | arbitre, tour 1 (O5, `extension`) | nouvelle | [1.10-7](../../../backlog/1.10-7-extraire-cv-copie.md) — evolution, basse, `constatee` |
| 3. `proxy_request_buffering off` dans nginx | arbitre, tour 1 (O8, `extension`) | nouvelle | [1.10-8](../../../backlog/1.10-8-nginx-corps-sur-disque.md) — evolution, basse, `argumentee` (non vérifié au banc ; plafond moyenne) |
| 4. En création, fichier choisi affiché comme déposé | arbitre, tour 1 (U3, `hors-perimetre`) | nouvelle | [1.10-9](../../../backlog/1.10-9-fichier-choisi-non-envoye.md) — evolution, basse, `constatee` (`menu-candidat.js` l. 30-34) |
| 5. Pas de `Content-Security-Policy` sur un fichier servi `inline` | revue de code (S2) | nouvelle | [1.10-10](../../../backlog/1.10-10-fichiers-servis-sans-csp.md) — dette, basse, `constatee` |
| 6a. `Claude outputs/` et `CONTRIBUER.md` publiés avec le site | revue de code (S4, hors diff), cadrage (P9, V16) | occurrence | [1.1-9](../../../backlog/1.1-9-fichiers-sans-usage-publies.md) — même correction (`SKIP` de `tools/build.py`) ; version 1.10 ajoutée, preuve `reproduite` (V16) : basse → moyenne |
| 6b. Fichier de PR de la 1.10 qui dit « schéma v2 » (et « 60/60 ») | revue de code (S4) | renvoi (défaut de la version) | `Claude outputs/pr-1.10-fiche-candidat.md` est **ajouté par la branche** (`git diff main...HEAD` : +74 lignes, commit de Léo `7533be6`, renommé en `69ec434`) et contredit R1 (`user_version` reste 1) ; la spec dit corriger P8 (« description de la branche en partie périmée ») : à corriger dans cette version |
| 7. Code mort de `ec2.html` et libellés sans usage | revue de code (Q2, reste au backlog) | nouvelle | [1.10-11](../../../backlog/1.10-11-code-mort-ec2-libelles.md) — dette, basse, `constatee` (`id="liens-in"` absent : 0 ; 3 libellés à 0 usage, 5 utilisés par le seul code mort) |
| 8. Constantes dupliquées (route, `INTROUVABLE`, `idValide`, `TYPES`/`MAX`) | revue de code (Q3), arbitre (T9, `realisation`) | nouvelle | [1.10-12](../../../backlog/1.10-12-constantes-fichiers-dupliquees.md) — dette, basse, `constatee` ; sujet distinct de 1.3-8 (fichiers du mode serveur des pages) |
| 9. Croix de la fenêtre ⋯ active pendant un envoi | QA (remarque Q1) | renvoi (défaut de la version) | Dans le périmètre : la fenêtre ⋯ pendant un envoi est une commande de la 1.10 (spec, tableau des commandes l. 106 : fermer « impossible ») ; un bouton actif sans effet ni annonce, alors que la création le désactive (CA4 b) : correction de quelques lignes à faire maintenant, ou à faire accepter par l'utilisateur, mais pas au backlog |
| 10. Fichier non cité gardé si le dossier n'est plus enregistré | QA (S14, remarque Q2) | nouvelle | [1.10-13](../../../backlog/1.10-13-fichiers-non-cites-sans-enregistrement.md) — evolution, moyenne, `reproduite` (S14) ; prolonge la règle arbitrée par l'utilisateur (S2) sans la contredire ; lien avec 1.10-2 |
| 11. Deux `e2e-serveur` en parallèle se gênent | QA (remarque Q4) | rejete | Pas concret : aucune correction proposée au-delà de la consigne, déjà écrite (`technique/conventions.md` l. 83 : « Lancer les e2e un par un ») ; le contrôle échoue désormais proprement |
| 12. Rôle lecture : champs de saisie modifiables depuis la 1.3 | QA (B1, remarque) | nouvelle | [1.10-14](../../../backlog/1.10-14-lecture-seule-champs-modifiables.md) — evolution (pas bug : conforme à la règle 1.3 « toute écriture est refusée », `doc/produit/stockage-partage.md`), basse, `constatee` |
| 13. Contrôle « départ de la page (candidat.html), PUT précédent lent » : 3 sur 3 sur `main` et sur la branche | vérifications (V21), QA (S24) | occurrence | [1.9-1](../../../backlog/1.9-1-depart-page-put-lent-409.md) — même message (`PUT : 200 200 200 409`) : c'est ce bug, observé dans une nouvelle version (1.10), priorité haute inchangée. [1.10-3](../../../backlog/1.10-3-tests-depart-page-instables.md) mise à jour sans occurrence : preuve `reproduite`, contrôle `candidat.html` renvoyé à 1.9-1, la fiche garde `ec1.html` et l'attente du test |
| 14. Pages 1.9 et lignes `type: "fichier"` de l'historique | arbitre, tour 1 (O1, intégré en R2) | rejete | Déjà tranché : dégradation décidée (R2) et écrite dans la doc produit (`fiche-candidat.md`, Cas particuliers, « Retour vers la 1.9 ») |

## Doublons fusionnés
Aucun. Recoupement partiel entre 1.10-3 (Léo, tests instables) et 1.9-1 (bug 409) : non fusionnées, car 1.10-3 couvre aussi `ec1.html` et un autre symptôme (PUT de départ absent) ; renvoi croisé écrit dans les deux fiches.

## Statuts
Aucun changement de statut à poser. 1.10-4 et 1.10-5 restent `fait`. 1.10-3 et 1.9-1 restent `ouvert`.

## Pour l'orchestrateur
- Défauts de la version : 6b (fichier de PR périmé) et 9 (croix de la fenêtre ⋯).
- La doc de la 1.10 attribue le `FAIL` de `e2e-serveur` à 1.10-3 (`spec/cadrage.md` P11, CA17, `technique/conventions.md` l. 83, `qa/rapport-qa.md`) : c'est 1.9-1. À corriger au moins dans `technique/conventions.md` et au bilan.
