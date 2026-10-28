---
type: challenge
version: 1.9
tour: 2
score: 86
valide: oui
date: 2026-10-28
---

# Challenge — tour 2

> **Validé** · score global 86/100 (≥ 80), aucun challenger sous 70, aucun bloquant · 8 majeurs et 3 mineurs recevables ouverts, tous intégrés à la spec finale · 6 retours écartés (doublons).
> Conflit S9 / V12 tranché par l'orchestrateur (voir Traitement).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Score |
|---|---|---|---|---|
| Sécurité frontière (S) | 0 | 0 | 1 | 98 |
| Exploitation systemd (X) | 0 | 2 | 1 | 82 |
| Déploiement et retour arrière (D) | 0 | 2 | 0 | 84 |
| Testabilité (T) | 0 | 2 | 0 | 84 |
| Utilisateur admin (U) | 0 | 2 | 1 | 82 |
| **Global** | 0 | 8 | 3 | **86** |

## Retours recevables bloquants et majeurs
X15, X18 · D3, D11 · T15, T16 · U2, U3.

## Verdicts de l'arbitre
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| S8 | S | majeur | ecarte (doublon) | — | T15, plus précis (trap, double enregistrement) |
| S9 | S | majeur | recevable | mineur | Lacune réelle ; la section Sécurité admettait déjà qu'une application compromise arrête l'automatisme (pause) ; conflit avec V12 |
| X15 | X | majeur | recevable | majeur | Ordre de R1 : un état incertain faisait redéployer le commit en échec toutes les 10 min |
| X16 | X | majeur | recevable | mineur | Issues des attentes du verrou non écrites ; R20 couvre déjà la coupure par systemd |
| X17 | X | majeur | ecarte (doublon) | — | T15 |
| X18 | X | majeur | recevable | majeur | Le diagnostic proposé défaisait un retour mis en pause |
| D3 | D | majeur | recevable | majeur | Argument nouveau : commit visé déjà en place, `HEAD` ne change pas |
| D6 | D | majeur | ecarte (doublon) | — | T16 |
| D11 | D | majeur | recevable | majeur | `deploye` écrit par `auto-deploy.sh` seul : installation et secours SSH laissent « incertain » |
| T6 | T | mineur | ecarte (doublon) | — | X16 |
| T15 | T | majeur | recevable | majeur | Contradiction R13/R20 sur la source de `en_cours` |
| T16 | T | majeur | recevable | majeur | Retour : verrou gardé ou libéré, ambigu ; pas de SC |
| U2 | U | majeur | recevable | majeur | Rouge « ne vérifie plus » pendant un passage long |
| U3 | U | majeur | recevable | majeur | Rouge après 5 min pendant un passage en cours |
| U9 | U | majeur | ecarte (doublon) | — | D11 |
| U10 | U | majeur | recevable | mineur | Texte inexact ; la commande affichée reste la bonne |

Dérives : légères (T6 soumis en mineur au tour 2 ; S9 élargit le modèle de menace). Lien X15/D11 à traiter ensemble.

## Retours des challengers

### Sécurité frontière

#### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S1 | resolu | R3 `--first-parent`, CA6, V16, deploy.sh SSH large (décision utilisateur). |
| S2 | partiel | `en_cours` utilisé par R20 absent des fichiers de l'hôte (voir S8). |
| S3 | resolu | R6 lecture stricte, CA6. |
| S5 | resolu | R8 limites, CA10. |
| S6 | resolu | R17, R18. |
| S7 | resolu | R17, CA12. |

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S8 | majeur | R13, R20, exemple | R20 décide sur un `en_cours` qui n'existe que dans `deploiement.json` (volume, inscriptible par l'appli) ; contradiction avec R13. | Appli compromise forge un `en_cours` à `deploy` → alerte rouge persistante qui invite à lancer en SSH `deploy.sh <commit choisi par l'attaquant>`. | `en_cours` dans `~/.recrutement-deploiement/` (commit, commit d'avant, étape, depuis) ; json n'en est qu'une copie ; CA11 : `en_cours` forgé → ni interrompu ni alerte. |
| S9 | majeur | R6, R13, Sécurité | Le conteneur jetable tourne en `node` comme l'appli : elle peut faire échouer retrait et `ecrire_etat` (chmod 500, répertoire à la place de la cible). | Plus aucun passage n'atteint l'automatisme ; plus aucun merge déployé ; service relancé toutes les 60 s. | Seul « Docker ne répond pas » → 60 s et sortie ; retrait/lecture KO avec Docker qui répond → « demande illisible », on continue ; `ecrire_etat` KO n'arrête jamais un passage ; Sécurité « ni empêcher l'automatisme » ; CA9 avec dossiers en 500. |

### Exploitation systemd

#### Retours précédents
| # | Statut | Justification |
|---|---|---|
| X1, X2, X3, X4, X6, X8, X9, X11–X14 | resolu | R5, R1/R13, R8/R9, R6/CA9, R1/R10, R10, R5/R7/R8/R13, Exploitation, CA18, CA14, R9. |

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| X15 | majeur | R1, R11, R13 | « HEAD ≠ deploye → tester et déployer » passe avant « dernier en échec » ; retour réussi n'écrit pas `deploye`. | Boucle toutes les 10 min sur le commit qui casse la production. | Retour réussi écrit deploye = commit d'avant ; retour KO / interrompu efface deploye ; ordre R1 : pause, puis en échec → rien, puis incertain → déployer ; CA3 d. |
| X16 | majeur | R5, R10, R11, CA14 | deploy.sh et retour non bornés ; expiration des attentes du verrou de deploy.sh non écrite. | Site sur un commit raté sans alerte ; CA14 non jugeable ; un timeout couperait un déploiement. | R10 expiration → `annule` (verrou occupé), non noté ; R11 expiration → retour_ko ; R5 : deploy.sh et retour jamais coupés par le script, 30 min = estimation. |
| X17 | majeur | R13, R20 | `en_cours` seulement dans le volume. | R20 irréalisable ou falsifiable. | `~/.recrutement-deploiement/en-cours` ; R20 le lit ; CA11. |
| X18 | majeur | Exploitation, P3, R1 | Le diagnostic proposé (relancer auto-deploy.sh) met main en ligne, même en pause. | Annule un retour arrière en pause. | Sans sudo : lire `~/.recrutement-deploiement/passages/` ou la page ; avertissement. |

### Déploiement et retour arrière

#### Retours précédents
| # | Statut | Justification |
|---|---|---|
| D1 | resolu | R14, CA5. |
| D2 | resolu | R11, tableau, CA3 b. |
| D3 | partiel | HEAD inchangé faux quand le commit visé est déjà en place (argument nouveau). |
| D4, D5 | resolu | Doublons couverts. |
| D6 | partiel | Maniement du verrou pendant le retour flou. |
| D7–D10 | resolu | R9, R14, tableau, R13. |

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D3 | majeur | R10, UX, CA3 | Redéploiement du commit en place : HEAD ne change pas même si build/up/contrôle échouent → classé « arrêt avant changement ». | Conteneurs recréés hors service, page « refusée avant de commencer ». | « Arrêt avant changement » = deploy.sh KO sans sa ligne `· Dépôt sur` ; ou exception : commit visé = HEAD et ligne présente → KO + alerte « incertain », pas de retour ; CA3 d. |
| D6 | majeur | R11 | Verrou du retour : gardé → flock -n de deploy.sh échoue ; libéré avant checkout → un deploy.sh manuel se glisse. | retour_ko systématique ou faux. | Checkout sous le verrou, libérer, deploy.sh ; « déjà en cours » au retour → `annule`, pas de retour_ko ; SC sauvegarde pendant le retour. |
| D11 | majeur | R1, R11, R13, R15 | `deploye` écrit seulement par auto-deploy.sh ; installation par le deploy.sh de 1.8 et secours SSH laissent HEAD ≠ deploye ; « commit d'avant » non défini si incertain. | Redéploiement inutile après installation ; « incertain » après un deploy.sh SSH réussi ; retour vers un commit à moitié déployé. | deploy.sh 1.9 écrit `deploye` à « Déploiement réussi » quel que soit le lanceur ; installation l'initialise avec HEAD ; commit d'avant = `deploye` au début du passage ; CA19. |

### Testabilité

#### Retours précédents
| # | Statut | Justification |
|---|---|---|
| T1 | resolu | R19, CA8 SC3 (reste à corriger « dernier arrivé gagne » dans verifications.md). |
| T2 | resolu | SC1–SC6, enveloppe docker de CA7. |
| T3 | partiel | Source de l'`en_cours` non définie (T15). |
| T4 | resolu | Banc, niveaux, variables. |
| T5 | resolu | CA3 a/b/c. |
| T6 | partiel | Issue de l'attente du verrou pour le retour non écrite ; « deploy.sh 30 min », « retour 30 min » non bornés par une règle. |
| T7–T14 | resolu | P2, CA19, CA13, exemple, CA6, CA12, R1/CA4, CA17. |

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T6 | mineur | R5, R10, R11, CA14 | deploy.sh et retour non bornés ; expiration de l'attente du verrou du retour non dite. | Budget de 4 h non vérifiable. | Borner (timeout 30 min, issue) ou justifier la marge ; attente expirée → pas de checkout, `retour_ko` ; CA14. |
| T15 | majeur | R13, R20, CA11, CA8 | `en_cours` seulement dans le volume ; R13 interdit de le lire ; `trap` ne dit pas s'il efface le marqueur. | Faux `interrompu` forgé, ou R20 sans source ; double enregistrement. | `~/.recrutement-deploiement/en-cours` écrit à chaque étape, retiré en fin ; R20 lit ce seul fichier ; le trap enregistre puis retire ; CA11 faux `en_cours`/`retour_ko` → rien ; CA8 SC5 un seul `interrompu`. |
| T16 | majeur | R11, CA8 | Le `git checkout` du retour se fait hors verrou ; pas de relecture de HEAD ; aucun SC « deploy.sh manuel entre l'échec et le retour ». | Conflit index.lock / arbre mélangé, ou choix manuel écrasé. | Checkout sous le verrou de deploy.sh (prendre, vérifier HEAD, checkout, libérer, deploy.sh) ; HEAD ≠ commit visé → pas de retour, `annule` ; SC7. |

### Utilisateur admin

#### Retours précédents
| # | Statut | Justification |
|---|---|---|
| U1 | resolu | Verdict ordonné avec couleurs, retour raté en tête ; CA13. |
| U2 | partiel | `dernier_controle` mis à jour « à chaque passage » : un passage de plus de 25 min fait afficher « ne vérifie plus » (rouge, avant « passage en cours »). |
| U3 | partiel | (b) résolu par R20 ; (a) l'alerte de 5 min est fausse pendant un passage en cours (demande traitée à la fin). |
| U4 | resolu | Confirmations écrites. |
| U5 | resolu | Libellés. |
| U6 | resolu | Étape k/4. |
| U7 | resolu | Confirmation et liste. |
| U8 | resolu | Textes 202/400/503. |

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| U2 | majeur | R13, verdict | Seuil de 25 min pendant un passage long. | Fausse alerte, rouge plus cru. | Seuil suspendu tant que `en_cours` est récent, ou `dernier_controle` mis à jour à chaque étape ; cas dans CA13. |
| U3 | majeur | UX bandeau, R6 | Rouge à 5 min sans tenir compte du passage en cours. | Fausse panne à chaque clic pendant un passage. | Rouge seulement sans passage en cours, sinon « traitée à la fin du passage en cours » ; CA13. |
| U9 | majeur | Verdict ligne 1, R1, R13, R14, R19 | `deploy.sh <hash>` en SSH (secours documenté) ou SC3 laissent HEAD ≠ deploye avec PAUSE : « incertain » rouge permanent, mêlé à « retour raté ». | Page rouge après une opération normale. | Si PAUSE nomme le commit de HEAD : en ligne = HEAD, verdict neutre « En pause : <c> mis en ligne à la main par <qui> » ; « incertain » rouge à part pour les écarts inexpliqués ; CA13, CA8 SC3. |
| U10 | majeur | Verdict ligne 1, R20 | Interrompu pendant deploy affiché « Retour arrière raté ». | Diagnostic sur une mauvaise piste. | Texte à part « Mise en ligne interrompue pendant <étape> … » ; ligne du tableau de diagnostic ; CA13. |

## Traitement
Conflit S9 / V12 : on garde la protection de V12 et on suit S9 sur le fond. Docker muet → 60 s puis sortie (inchangé) ; Docker qui répond mais retrait ou lecture en échec → « demande illisible », l'automatisme continue, puis 60 s d'attente avant de sortir : l'unité path est relancée au plus une fois par minute et ne tombe pas. Lien X15 / D11 : `deploye` n'est jamais effacé (il sert de commit d'avant) ; un retour KO ou une interruption pose une marque `incertain` à part.

| # | Traitement | Où |
|---|---|---|
| S9 | integre | R6, R13, Sécurité, CA9 |
| X15 | integre (ordre explicite, marque `incertain`) | R1, R11, R13, CA3 (e) |
| X16 | integre (issues des attentes ; `deploy.sh` jamais coupé) | R5, R10, R11, CA14 |
| X18 | integre | Exploitation |
| D3 | integre (détection par la ligne `· Dépôt sur`, cas du commit déjà en place) | R10, CA3 (d) |
| D11 | integre (`deploye` écrit par `deploy.sh` 1.9 ; initialisé à l'installation) | R11, R13, CA19 |
| T15 | integre (`en-cours` sur l'hôte, `trap`) | R13, R20, CA8 SC6, CA11 |
| T16 | integre (checkout sous le verrou, relecture de `HEAD`) | R11, CA8 SC7, SC8 |
| U2 | integre | R13, verdict, CA13 |
| U3 | integre | bandeau, CA13 |
| U10 | integre | verdict, CA13 |

Mécanismes ajoutés et exécutions concurrentes : `en-cours` est écrit et lu sous le verrou de passage, seul `auto-deploy.sh` y touche ; `deploye` est écrit par `deploy.sh` (verrou de `deploy.sh`), lu par `auto-deploy.sh` au début du passage : un `deploy.sh` manuel qui l'écrit pendant un passage est vu par R19 (`HEAD` changé) ; le checkout du retour se fait sous le verrou de `deploy.sh`, donc jamais pendant un autre `deploy.sh` ni pendant la copie d'une sauvegarde (SC7, SC8).
