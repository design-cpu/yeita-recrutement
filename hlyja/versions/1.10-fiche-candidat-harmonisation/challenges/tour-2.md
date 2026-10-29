---
type: challenge
version: 1.10
tour: 2
spec: 2
score: 93
scores: Lead dev=92; Sécurité et données personnelles=100; Ops et déploiement=92; Testabilité et concurrence=82; Utilisateur recruteur=98
bloquants: 0
recevables: 6
ecartes: 2
decision: valide
date: 2026-10-28
---

# Challenge — tour 2 (spec v2)

> **Score global : 93/100** · Décision : validé
> Conditions : moyenne ≥ 80 ✓ · aucun challenger < 70 ✓ (minimum : Testabilité et concurrence 82) · aucun bloquant ✓
> Arbitre : 6 retours recevables (4 majeurs, 2 mineurs), 2 écartés (T11 levé par V20, C11 doublon de T10) ; aucune dérive.
> Les 6 recevables sont intégrés dans la spec finale (au-delà des seuls mineurs : chacun est concret et court).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Lead dev | 0 | 1 (T10) | 0 | 1 | 92 |
| Sécurité et données personnelles | 0 | 0 | 0 | 0 | 100 |
| Ops et déploiement | 0 | 1 (O10) | 0 | 0 | 92 |
| Testabilité et concurrence | 0 | 2 (C1, C10) | 1 (C6) | 1 | 82 |
| Utilisateur recruteur | 0 | 0 | 1 (U4) | 0 | 98 |
| **Global** | | | | | **93** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité | Constat | Proposition |
|---|---|---|---|---|
| T10 | Lead dev | majeur | Invariant de R6 non garanti par l'API ; import d'un export | Vérification des références dans la transaction du PUT ; import qui remet à `null` |
| O10 | Ops | majeur | `METTRE-A-JOUR.md` ne relie pas le merge à l'étape « avant le merge » | Intro, § 1 et § 5 du guide |
| C1 | Concurrence | majeur | Dernière clause de R19 sans preuve | CA7 étendu |
| C10 | Concurrence | majeur | Saisies faites ailleurs pendant l'action | R19 précisée, CA7 |

## Verdicts de l'arbitre

Contrôles dans le code : `candidats.js` l. 27-35 (`corpsPut` ne vérifie pas `identite.fichiers`), `store.js` l. 283-301 (`importAll`), `adapter-serveur.js` l. 51 et 138 (version par objet, version prédite au départ), `METTRE-A-JOUR.md` l. 3 et 54.

| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| T10 | Lead dev | majeur | recevable | majeur | Invariant de R6 non garanti (PUT l. 27-35, import) ; point nouveau de la v2 ; garant unique (C11 en doublon) |
| T11 | Lead dev | majeur | ecarte | — | `sans-consequence` : levé par V20 (pages et API de `main` gardent `identite.fichiers`) |
| O10 | Ops | majeur | recevable | majeur | `METTRE-A-JOUR.md` l. 3 et 54 contredisent « avant le merge » ; détail (case de PR) aux tâches |
| C1 | Concurrence | majeur (repris) | recevable | majeur | Aucun CA ne prouve la dernière clause de R19 |
| C6 | Concurrence | mineur (repris) | recevable | mineur | Sort d'un fichier envoyé dont l'enregistrement a échoué, ambigu dans R3 |
| C10 | Concurrence | majeur | recevable | majeur | R19 à la lettre efface les saisies faites ailleurs ; 409 auto-provoqué possible |
| C11 | Concurrence | majeur | ecarte | — | `doublon` de T10 ; son scénario entre dans le CA de T10 |
| U4 | Utilisateur | mineur (repris) | recevable | mineur | Bandeau de R3 sans texte ; CA4 (d) teste le succès seul |

Statuts « resolu » douteux : S2 et C3 (garant de l'invariant suivi par T10) ; O1 (fichier du guide de retour renvoyé aux tâches) : acceptés. Autres « resolu » confirmés.

### Dérives et conflits
1. T10 × C11 : même garant ; contrats divergents (400 et import à `null` / 409 et nettoyage dans la transaction) → tranché au Traitement.
2. T11 levé par V20.
3. C10 × C11 sur le départ de la page : conséquences distinctes, traitées ensemble avec R19.
4. C1 × C10 : même réécriture de R19 et même CA7.
5. Aucune dérive nette (case de PR et code d'erreur : détail de tâche).

## Lead dev — tour 2

### Analyse
| Critère | Analyse |
|---|---|
| Faisabilité avec l'existant | Solide : R4, R5 sur la file de l'adaptateur ; R6 dans la transaction du PUT (`candidats.js` l. 79-89) ; R1 à condition de passer avant le retour anticipé de `appliquerSchema`. |
| Données et migration | R2, R15 décrits. Manque : l'invariant de R6 n'est pas garanti par le PUT, l'import peut le casser (T10) ; « rien n'est perdu » (R2) non vérifié alors que R6 efface les non référencés (T11). |
| Contrat de l'API | Complet ; rien sur un PUT qui référence un fichier inconnu (T10). |
| Testabilité | CA6 a/b, CA7, CA8, CA17 vérifiables. |
| Maintenabilité | Règle de schéma documentée ; invariant de R6 sans point de contrôle unique. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| T2 | resolu | R4, R5, CA6 (a) |
| T5 | resolu | R1, CA1 |
| T7 | resolu | R7, CA8 |
| T8 | resolu | CA17 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T10 | majeur | R6, API (PUT), Données | `corpsPut` (`candidats.js` l. 27-35) accepte tout `identite.fichiers` ; l'import (`importAll`, `store.js` l. 283-301) renvoie des références d'un export JSON sans le contenu (candidat supprimé puis réimporté, export d'avant un retrait) | « Ouvrir » → 404 ; invariant de R6 faux | PUT refuse une référence inconnue (400 `fichier-introuvable`) ; l'import remet à `null` les références absentes ; CA |
| T11 | majeur | R2 × R6, CA2 | « Rien n'est perdu » suppose que les pages 1.9 gardent `identite.fichiers` ; sinon R6 efface au redéploiement ; non prouvé (V19 : affichage seulement) | CV effacés pour de bon après un retour arrière | CA2 : dossier avec fichier modifié par les pages de `main` garde `identite.fichiers` ; après redéploiement, enregistrement > 1 h → fichier présent et référencé ; V20 |

## Sécurité et données personnelles — tour 2

### Analyse
| Critère | Analyse |
|---|---|
| Contrôle des entrées | Fichiers inchangés, solides. R20 ferme le trou : un seul endroit rend le lien en `href` (`docHTML`, `menu-candidat.js` l. 34). |
| Accès par rôle | Inchangé ; R6 ne passe que par le PUT (recruteur, admin), ne vise que ce candidat, âge lu dans `depose_le` écrit par le serveur. |
| Effacement réel et rétention | R6 + R10, CA10 ; PUT appelle déjà `pointDeControle`. Retour 1.9 vérifié dans le code de `main` (`updateFiche`, fiche ⋯ en `Object.assign`, `upgrade`/`fill` ne suppriment rien) : R6 n'efface pas un CV encore référencé. R15. |
| Exposition | R12 inchangée ; R20 et CA15. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S1 | resolu | R20, CA15 |
| S2 | resolu | Arbitrage utilisateur, R6 réécrite, CA6 (b), CA10, renvoi faux disparu |
| S3 | resolu | R15 |

### Retours ouverts
Aucun.

## Ops et déploiement — tour 2

### Analyse
| Critère | Analyse |
|---|---|
| Aller-retour de versions | Solide (tableau à 6 lignes, R2, V19, R18). `updateFiche`/`normFiche` de `main` gardent `identite.fichiers` (`store.js` l. 71-101). Un retour automatique ne peut arriver qu'au premier déploiement, avant tout dépôt. Mineur : fichier du « guide de retour » non nommé. |
| Sauvegarde et restauration | Solide (R14, R15, CA14) ; pas de conflit R6 × restauration. |
| Prérequis nginx | Solide sur le fond (R13, V10, V18). Manque : rien n'oblige à lire l'étape avant de merger (O10). |
| Guide exécutable | Format et CA13 corrects ; le cadre de `METTRE-A-JOUR.md` contredit « avant le merge » (O10). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| O1 | resolu | R2, CA2, guide (nom du fichier aux tâches) |
| O2 | resolu | R15, CA14 |
| O3 | resolu | R13, CA13 ; reste O10 (nouveau) |
| O6 | resolu | R14 |
| O7 | resolu | V18 |
| O9 | resolu | R13 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| O10 | majeur | R13, parcours, CA13 | `METTRE-A-JOUR.md` dit « rien à faire après un merge » (intro), commence par « La pull request est mergée » (§ 1) et place le § 5 « juste après la section 2 » ; rien ne relie le bouton Merge à l'étape « avant le merge » | Merge sans réglage nginx ni sauvegarde : 1.10 en ligne sous 10 min, premier CV > 1 Mo refusé | Intro et § 1 : faire la section « avant le merge » avant de cliquer Merge ; intro du § 5 distingue les deux moments ; description de PR avec la case « Fait sur le serveur … (preuve `curl` ≠ 413) » ; ligne 1.10 de `technique/mise-a-jour-production.md` ; CA13 vérifie ces mentions |

## Testabilité et concurrence — tour 2

### Analyse
| Critère | Analyse |
|---|---|
| Ordre dépôt / enregistrement | Solide (R4, R5, R19). Manque : les autres saisies faites pendant l'enregistrement d'un fichier, et le départ de la page pendant cet enregistrement. |
| Échecs partiels et relance | Solide ; flou : en création, fichier envoyé mais enregistrement du dossier en échec (R3). |
| Absence d'orphelins et de doublons | Doublon réglé (R3, CA4 b). Invariant de R6 sans garant côté API. |
| Preuves automatisées | Bon (CA5, CA6, CA7, CA17). Manque : aucun CA ne prouve la dernière clause de R19. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| C1 | partiel | R19 existe, mais aucun CA ne prouve qu'un enregistrement différé ou un départ après l'échec ne renvoie pas le changement |
| C2 | resolu | R5, CA7 |
| C3 | resolu | R6 ; garant de l'invariant → C11 |
| C4 | resolu | R3, tableau, CA4 (d) |
| C5 | resolu | R3, CA4 (b) |
| C6 | partiel | « Fichiers non encore envoyés » ambigu si l'envoi a réussi mais pas l'enregistrement |
| C7 | resolu | CA6, CA7 ; reste en QA (P2) |
| C8 | resolu | CA7 |
| C9 | resolu | R4, R5, CA5 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| C1 | majeur | CA5, CA7 | Pas de preuve qu'après un échec, l'enregistrement suivant n'emporte pas le changement échoué | Le défaut V14 peut revenir sans test rouge | CA7 : retrait forcé en échec réseau, saisie ailleurs (différé), départ → fichier présent et référencé, saisie enregistrée ; dépôt en échec → aucune référence |
| C6 | mineur | R3 | Sort d'un fichier envoyé dont l'enregistrement a échoué | CV perdu sans message ou renvoyé | « Les fichiers dont le dépôt n'a pas abouti (envoi ou enregistrement) restent en attente et sont renvoyés » |
| C10 | majeur | R19, tableau des commandes | Saisies ailleurs pendant l'action : versions par objet (`adapter-serveur.js` l. 51, 107, 138) | Saisie perdue, 409 auto-provoqué, ou départ qui défait le dépôt | R19 ne porte que sur le fichier ; saisie gardée et enregistrée après, sur la bonne version ; départ jamais destructeur ; CA |
| C11 | majeur | R6, API (PUT) | Le PUT accepte toute référence ; à deux recruteurs, un départ de page (version prédite) peut référencer un fichier effacé | « Ouvrir » → 404, invariant faux | Vérification dans la transaction du PUT : 409 si un fichier référencé n'existe pas sous ce candidat ; nettoyage dans la même transaction ; test API |

## Utilisateur recruteur — tour 2

### Analyse
| Critère | Analyse |
|---|---|
| Compréhension | Solide : « Remplacer = Retirer puis déposer », tableau des commandes, état Erreur (R19), R20. |
| Parcours de création et de dépôt | R3 donne une issue à chaque cas ; CA4 (a) à (d). |
| Erreurs et cas réels | R7 donne le bon message dans chaque cas (`docs.erreurTaille`, `docs.erreurType` vérifiés) ; CA5, CA8. Manque : le texte du « bandeau de la page » de R3 et son CA. |
| Confiance | Bon : R19, R6 (invariant), R2 (rien n'est perdu ; `identite.fichiers` gardé par les pages de `main`, `store.js` l. 98). Point faible : échec après fermeture sans texte. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| U1 | resolu | Parcours et tableau ; R4 sur champ vide ; CA7 sur le vrai parcours |
| U2 | resolu | R3, CA4 (c) |
| U4 | partiel | Arbitrage appliqué ; texte du bandeau non défini, CA4 (d) ne teste que le succès |
| U5 | resolu | R7, CA8 |
| U6 | resolu | R7, CA5 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| U4 | mineur | R3, R7, CA4 (d) | Bandeau d'échec après fermeture sans texte ni CA | Recruteur qui ne sait pas quel candidat est resté sans CV | Texte « <Champ> de <nom> non enregistré : <raison>. Ouvre sa fiche pour le déposer à nouveau. » ; CA4 (d) avec envoi forcé en échec |

Aucun nouveau retour bloquant ou majeur (confirmation avant « Retirer » examinée, non retenue : choix de Léo non cassé).

## Traitement
| # | Statut | Justification / modification |
|---|---|---|
| T10 | integre | R6 : l'API vérifie les références dans la transaction de l'enregistrement, 409 `fichier-introuvable` (choix du 409 de C11 : c'est un conflit d'état, comme une version périmée), nettoyage dans la même transaction ; R21 : l'import remet à `null` les références absentes ; R7 : message ; CA6 (c), (d) avec le scénario de C11 |
| O10 | integre | R13 : introduction et § 1 de `METTRE-A-JOUR.md`, introduction du § 5 ; CA13. Case de la description de PR : tâches |
| C1 | integre | CA7 (b) |
| C10 | integre | R19 réécrite (porte sur le champ ; saisies ailleurs gardées, sans 409 auto-provoqué ; départ jamais destructeur) ; CA7 (c) |
| C6 | integre | R3 : un dépôt qui n'a pas abouti (envoi ou enregistrement) reste en attente |
| U4 | integre | R7 : texte du bandeau ; CA4 (d) avec l'envoi forcé en échec |
