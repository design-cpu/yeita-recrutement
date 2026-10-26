---
type: challenge
version: 1.2
tour: 2
spec: 2
score: 94
scores: Technique Node/SQLite=98; Développeur intégrateur=98; Sécurité=92; Données personnelles=88; Exploitation=96
bloquants: 0
recevables: 8
ecartes: 0
decision: valide
date: 2026-10-26
---

# Challenge — tour 2 (spec v2)

> **Score global : 94/100** · Décision : validé
> Conditions : moyenne ≥ 80 ✓ · aucun challenger < 70 ✓ · aucun bloquant ✓
> Arbitre : 8 retours ouverts, tous recevables (T14 et I10 baissés en mineurs) ; 3 dérives signalées (statut de T2, mécanisme de reprise de D1, CA d'arrêt de E6), non retenues.
> Points clés : exemption de `/api/sante` décidée sur la route (S7) ; ancien contenu d'un dossier encore dans le WAL après un PUT (D1, V25). Intégrés dans la spec finale avec les mineurs.

## Récapitulatif
Score = 100 − 25 × bloquants − 8 × majeurs − 2 × mineurs, sur les retours recevables ouverts. T2 compté résolu (l'arbitre juge son « partiel » non sincère : la course au démarrage est portée par T14).

| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Technique Node/SQLite | 0 | 0 | 1 | 0 | 98 |
| Développeur intégrateur | 0 | 0 | 1 | 0 | 98 |
| Sécurité | 0 | 1 | 0 | 0 | 92 |
| Données personnelles | 0 | 1 | 2 | 0 | 88 |
| Exploitation | 0 | 0 | 2 | 0 | 96 |
| **Global** | | | | | **94** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité retenue | Constat | Proposition |
|---|---|---|---|---|
| S7 | Sécurité | majeur | Exemption de `/api/sante` non définie (route ou chaîne d'URL) | Exemption sur la route trouvée ; cas de contournement dans CA2 |
| D1 | Données | majeur | Après un PUT, l'ancien contenu reste dans le `-wal` | `TRUNCATE` après toute écriture ; CA7 après un PUT seul |

## Verdicts de l'arbitre
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| T14 | Technique | majeur | recevable | mineur | Introduit par la v2 ; échec passager (relance OK), suppression de la base supposée |
| I10 | Intégrateur | majeur | recevable | mineur | Introduit par la correspondance v2 ; seul un adaptateur mal construit est touché |
| S7 | Sécurité | majeur | recevable | majeur | Vrai oubli lié à l'autorisation globale `onRequest` ; CA2 ne teste que `/api/sante` |
| D1 | Données | majeur | recevable | majeur | Repris à bon droit (« anciennes versions après PUT » au tour 1) ; la nouvelle tentative dépasse le retour d'origine |
| D7 | Données | mineur | recevable | mineur | Masque non imposé à `equipe.js`, qui peut créer la base |
| D8 | Données | mineur | recevable | mineur | R15 et R28 inexacts : l'URL reçue est journalisée |
| E4 | Exploitation | mineur | recevable | mineur | `DEV_STATIC` hérite du refus « dossier existant » |
| E6 | Exploitation | mineur | recevable | mineur | « Avant toute écoute » impossible pour le port occupé ; CA d'arrêt non recevable (dépasse l'origine) |
Dérives : T2 « partiel » peu sincère (double compte avec T14) ; D1 ajoute un mécanisme de reprise ; E6 ajoute un CA d'arrêt ; E4 et I10 corrigent les propositions de leurs auteurs au tour 1.

## Technique Node/SQLite — 98/100
### Retours précédents
| # | Statut | Justification |
|---|---|---|
| T1 | resolu | R16, V19, CA6 |
| T2 | partiel | IMMEDIATE partout, mais deux démarrages simultanés sur base neuve échouent sur « table already exists » (T14) |
| T3 | resolu | CA18 |
| T4 | resolu | R12, V22 |
| T5 | resolu | R12 |
| T7 | resolu | R11, CA10 |
| T9 | resolu | CA17 |
| T10 | resolu | V21, CA1 |
| T13 | resolu | R9 realpath, R10 api/ |
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T14 | majeur | R12, CA18 | user_version lu hors transaction ; deux ouvertures simultanées sur base neuve lisent 0, la seconde attend puis son CREATE échoue | Base saine refusée avec le diagnostic d'une base abîmée ; l'admin peut supprimer la base | Relire user_version dans la transaction immédiate ; 1 → rien ; CA18 : ouverture concurrente attend puis réussit |

## Développeur intégrateur — 98/100
### Retours précédents
| # | Statut | Justification |
|---|---|---|
| I1 | resolu | R13 distingue version / data.version ; CA5 version 3 → 409 |
| I2 | resolu | R19 dossier absent → 409 ; 404 retiré du PUT ; CA5 |
| I3 | resolu | Correspondance complète |
| I4 | resolu | Écarté (hors périmètre), Exclu de v2 cohérent |
| I5 | resolu | Textes fixés R5, R6, R7, R16 ; R26 exception ; codes hors-equipe, lecture-seule |
| I6 | resolu | Enveloppe {id, version, data} |
| I7 | resolu | R23, CA13 |
| I8 | resolu | onRequest (V20), corps vide GET/DELETE (R16) ; réglage Fastify non vérifié |
| I9 | resolu | R35, R36 |
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| I10 | majeur | R14, R21, R27, correspondance | La correspondance traduit tout 404 en succès ; la route inconnue rend aussi 404 sans code | Adresse mal construite lue comme « dossier inexistant » ; remove() résolue alors que rien n'est supprimé | code « introuvable » sur les 404 de R14 et R21 ; seul ce 404 donne null / résolue ; CA15 |
Non vérifiés signalés en analyse : réglage Fastify du corps vide (V19 montre 400 par défaut) ; H3 pour un fetch.

## Sécurité — 92/100
### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S1 | resolu | R8, CA11 |
| S2 | resolu | R9, CA11 ; .git/.env au backlog justifié |
| S3 | resolu | R6, V20, CA3 |
| S4 | resolu | Doublon de T1 intégré |
| S5 | resolu | CA2 complet |
| S6 | resolu | R4, CA12, R35 |
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S7 | majeur | R6, R26, CA2 | Exemption de /api/sante non définie (route trouvée ou chaîne d'URL) ; aucun test de contournement | Exemption par préfixe ou inclusion ouvre la lecture sans identité | R6 : exemption sur la route trouvée (routeOptions.url, GET/HEAD), jamais sur la chaîne ; CA2 : /api/candidats?x=/api/sante, /api/sante/, /api/sante/../candidats, /api//candidats → 401 ou 404 ; /api/sante?x=1 → 200 ; CA17 |
Non vérifié signalé : realpath de R9 ; fichiers cachés servis par @fastify/static (backlog S2).

## Données personnelles — 88/100
### Retours précédents
| # | Statut | Justification |
|---|---|---|
| D1 | partiel | DELETE réglé ; après un PUT, ancien contenu dans le -wal, un point de contrôle automatique (PASSIVE) n'efface pas les trames ; Rétention inexacte ; non vérifié |
| D2 | resolu | R21, R22, CA7 |
| D3 | resolu | R15, H4 |
| D4 | resolu | R27, CA15 |
| D5 | resolu | doublon de I6 traité |
| D6 | resolu | ajoute_par retiré |
| D7 | partiel | masque non imposé explicitement à equipe.js ; CA10 ne vérifie pas |
| D8 | partiel | « URL avec l'id opaque » inexact : l'URL brute est journalisée avant la route (400, 401, 404) ; non vérifié |
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D1 | majeur | R21, Rétention, CA7 | TRUNCATE seulement après DELETE ; après PUT l'ancien contenu reste dans le -wal ; pas de nouvelle tentative si le TRUNCATE échoue | Donnée retirée à la demande du candidat lisible pendant une durée indéterminée | TRUNCATE après toute écriture sur candidats ; échec → avertissement et nouvelle tentative à l'écriture suivante et à l'arrêt ; Rétention « aucune version précédente ne survit » ; CA7 repère de la version remplacée après PUT seul |
| D7 | mineur | R10, R32, CA10 | Masque non imposé explicitement à equipe.js | Base 644 si créée par equipe.js | R32 « même masque » ; CA10 600/700 au premier appel |
| D8 | mineur | R15, R28, R35 | URL journalisée telle que reçue même refusée | README promettrait à tort | R15/R28 : URL telle que reçue, même refusée ; retirer la phrase de R15 |

## Exploitation — 96/100
### Retours précédents
| # | Statut | Justification |
|---|---|---|
| E1 | resolu | R4, R32, CA10, CA12 |
| E2 | resolu | Rejet partiel justifié (P2), README, base affichée ; masque 077 rend l'échec bruyant |
| E4 | partiel | DEV_STATIC « mêmes refus de forme » reprend « dossier existant » qui contredit R9 |
| E5 | resolu | R10, CA12 |
| E6 | partiel | Arrêt non vérifié par un CA ; « avant toute écoute » impossible pour le port occupé |
| E8 | resolu | R32, CA10 |
| E9 | resolu | R35 |
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| E4 | mineur | R30, R9 | DEV_STATIC hérite du refus « dossier existant » | Tout DEV_STATIC valide refusé à la lettre | R30 : DEV_STATIC refusé si # ou guillemet ; autres contrôles R9 |
| E6 | mineur | R31, R30, CA12 | Arrêt non vérifié ; port occupé découvert à l'écoute | Code 0 et fermeture non démontrés | CA12 : SIGTERM → code 0, -wal absent ou vide ; R30 « ou à l'échec de l'écoute » |
Non vérifié signalé : effet du masque 0o077 sur -wal/-shm créés par better-sqlite3.

## Traitement
Spec validée : les retours recevables ouverts sont intégrés dans `spec/spec-finale.md` (mineurs simples compris).
| # | Statut | Justification / modification |
|---|---|---|
| T14 | integre | R12 : relecture de `user_version` dans la transaction (V26) ; CA18 (c) |
| I10 | integre | R14, R21 : `code: "introuvable"` ; correspondance ; CA15 |
| S7 | integre | R6 : exemption sur `routeOptions.url` (V28) ; CA2 ; CA17 |
| D1 | integre | R21 : `TRUNCATE` après toute écriture (V25) ; Rétention ; CA7. Nouvelle tentative non retenue (dérive) : avertissement seul |
| D7 | integre | R32 : même masque (V27) ; CA10 |
| D8 | integre | R15, R28 : URL journalisée telle que reçue (V29) |
| E4 | integre | R30 : `DEV_STATIC` refusé seulement pour `#` et guillemets |
| E6 | integre en partie | R30 : « ou à l'échec de l'écoute » ; CA d'arrêt non retenu (dérive) |
