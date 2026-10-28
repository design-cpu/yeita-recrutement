---
type: challenge
version: 1.9
tour: 1
score: 55
valide: non
date: 2026-10-28
---

# Challenge — tour 1

> **Non validé** · score global 55/100 (seuil 80) · 22 majeurs et 25 mineurs recevables, aucun bloquant · 7 retours écartés.
> Trois points à trancher : S1 (demandes limitées à la ligne principale de main : **accepté par l'utilisateur**), conflits D3/X6 et S2/X2 (tranchés par l'orchestrateur, voir Traitement).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Score |
|---|---|---|---|---|
| Sécurité frontière (S) | 0 | 2 | 4 | 76 |
| Exploitation systemd (X) | 0 | 5 | 6 | 48 |
| Déploiement et retour arrière (D) | 0 | 4 | 4 | 60 |
| Testabilité (T) | 0 | 7 | 7 | 30 |
| Utilisateur admin (U) | 0 | 4 | 4 | 60 |
| **Global** | 0 | 22 | 25 | **55** |

## Retours recevables bloquants et majeurs
S1, S2 · X1, X2, X3, X4, X6 · D1, D2, D3, D6 · T1, T2, T3, T4, T6, T8, T9 · U1, U2, U3, U4.

## Verdicts de l'arbitre
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| S1 | S | majeur | a-arbitrer | majeur | `--is-ancestor` laisse passer les commits intermédiaires ; `--first-parent` resserre « présent dans l'historique de main » : à l'utilisateur. |
| S2 | S | majeur | recevable | majeur | Rien n'interdit au script de relire `deploiement.json`, modifiable par l'application. |
| S3 | S | mineur | recevable | mineur | Ni taille, ni type de fichier, ni clés uniques pour la demande. |
| S4 | S | mineur | ecarte (sans-consequence) | — | R5 a déjà `PathExists=` seul ; option future absente de la spec. |
| S5 | S | mineur | recevable | mineur | Montages des conteneurs de test non dits. |
| S6 | S | mineur | recevable | mineur | Demandes refusées en série remplissent les 30 passages. |
| S7 | S | mineur | recevable | mineur | En-tête brut au lieu de l'identité vérifiée. |
| X1 | X | majeur | recevable | majeur | `TimeoutStartSec=1h` < attentes cumulées. |
| X2 | X | majeur | recevable | majeur | `HEAD` faux après un passage tué après le checkout. |
| X3 | X | majeur | recevable | majeur | Conteneurs d'essai non nettoyés. |
| X4 | X | majeur | recevable | majeur | Toute sortie rapide sans retrait arrête l'unité path (V12). |
| X5 | X | majeur | ecarte (doublon) | — | Porté par U2 (et U3a). |
| X6 | X | majeur | recevable | majeur | `git fetch` en échec non défini ; partie « refus avant changement » : conflit avec D3. |
| X7 | X | majeur | ecarte (doublon) | — | T1, plus précis. |
| X8 | X | mineur | recevable | mineur | Verrou de `deploy.sh` gardé ou libéré : non dit. |
| X9 | X | mineur | recevable | mineur | Unités, chemins, umask non nommés. |
| X10 | X | mineur [extension] | ecarte (extension) | — | Ni le pitch ni le cadrage ; ni faux ni dangereux sans. |
| X11 | X | mineur | recevable | mineur | Arrêter timer et path n'arrête pas un passage en cours. |
| X12 | X | mineur | recevable | mineur | Pas de lien message → conduite à tenir. |
| X13 | X | mineur | recevable | mineur | Volume supprimé puis recréé non vérifié. |
| X14 | X | mineur | recevable | mineur | Cache de construction non dit. |
| D1 | D | majeur | recevable | majeur | Pause créée à tort par `deploy.sh` (main qui avance, retour automatique). |
| D2 | D | majeur | recevable | majeur | Retour par le `deploy.sh` du commit en échec. |
| D3 | D | majeur | recevable | majeur | Arrêt avant changement de commit (comparaison de `HEAD`) ; conflit avec X6. |
| D4 | D | majeur | ecarte (doublon) | — | X1, X2, T3. |
| D5 | D | majeur | ecarte (doublon) | — | T1. |
| D6 | D | majeur | recevable | majeur | « Retour KO » sans suite ; retour sans verrou. |
| D7 | D | mineur | recevable | mineur | Suppression des images d'essai non décrite (V4). |
| D8 | D | mineur | recevable | mineur | Moment de création de `PAUSE`. |
| D9 | D | mineur | recevable | mineur | Remontée depuis < 1.9 avec `PAUSE`. |
| D10 | D | mineur | recevable | mineur | Page juste après l'installation (état absent). |
| T1 | T | majeur | recevable | majeur | Retour SSH pendant les tests défait sans bruit. |
| T2 | T | majeur | recevable | majeur | CA8 sans ordre ; fenêtre de CA7 non provoquable. |
| T3 | T | majeur | recevable | majeur | « Passage en cours » orphelin. |
| T4 | T | majeur | recevable | majeur | Banc non décrit. |
| T5 | T | majeur | recevable | mineur | CA3 en deux cas porté par D3 ; reste la façon de provoquer les échecs. |
| T6 | T | majeur | recevable | majeur | Attentes non essayables ; expiration de R7 non dite. |
| T7 | T | majeur | recevable | mineur | Liste des gardes à muter, pas une règle de comportement. |
| T8 | T | majeur | recevable | majeur | Aucun CA ne rejoue une ligne de R15. |
| T9 | T | majeur | recevable | majeur | CA13 sans outil ni données. |
| T10 | T | mineur | recevable | mineur | Noms des champs de `deploiement.json`. |
| T11 | T | mineur | recevable | mineur | Préfixe ambigu non fabricable simplement. |
| T12 | T | mineur | recevable | mineur | Renommage non observable. |
| T13 | T | mineur | recevable | mineur | Lancement à la main pendant une demande. |
| T14 | T | mineur | recevable | mineur | Lignes de verdict. |
| U1 | U | majeur | recevable | majeur | Pas de verdict d'en-tête ; recoupe D6. |
| U2 | U | majeur | recevable | majeur | « Actif » faux quand le timer est arrêté. |
| U3 | U | majeur | recevable | majeur | (a) demande jamais prise en charge ; (b) porté par T3. |
| U4 | U | majeur | recevable | majeur | Confirmations de « Déployer maintenant » et « Reprendre ». |
| U5 | U | mineur | recevable | mineur | Libellés affichés. |
| U6 | U | mineur | recevable | mineur | Bandeau figé pendant le passage. |
| U7 | U | mineur | recevable | mineur | Commit déjà en échec au déploiement. |
| U8 | U | mineur | recevable | mineur | Textes 202, 400, 503. |

### Dérives et conflits
- Conflit D3 / X6 (a-arbitrer) : arrêt de `deploy.sh` avant changement de commit : pas de retour pour les deux ; D3 note le commit en échec (sauf verrou), X6 non ; détection par `HEAD` (D3) ou ligne « · Dépôt sur » (X6).
- Conflit S2 / X2 (a-arbitrer) : commit en place = `HEAD` (S2) ou « dernier commit déployé avec succès » hors du dépôt (X2) ; d'accord pour garder les fichiers de décision hors du volume.
- S1 (a-arbitrer, utilisateur).
- Recoupements : U1/D6 ; U2/U3a (X5 doublon) ; T1 (X7, D5) ; X1, X2, T3 couvrent D4.
- Dérives : aucune ; X10 écarté.

## Retours des challengers

### Sécurité frontière

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S1 | majeur | R3, Sécurité, CA6 | `--is-ancestor` accepte les commits intermédiaires des branches fusionnées par merge commit (ex. étapes `hlyja(1.9): tâche NN`). | Un admin ou une appli compromise met en ligne un état à moitié fait ; son auto-deploy.sh incomplet tourne ensuite. | R3 : commit présent dans `git rev-list --first-parent origin/main` ; motif « hors de la ligne principale de main » ; CA6 ; V13 bis ; dire si deploy.sh SSH garde --is-ancestor. |
| S2 | majeur | R13, Architecture, CA11 | `/data/etat/deploiement.json` est inscriptible par l'appli ; rien n'interdit au script de le relire pour décider. | Marque d'échec effacée, passages forgés recopiés. | R13 : le script ne lit dans le volume que la demande ; en place = HEAD ; échec et historique dans des fichiers de deploy hors volume et hors dépôt ; deploiement.json réécrit en entier ; CA : json falsifié ou supprimé → réécrit, décisions inchangées. |
| S3 | mineur | R6, format, R18 | Lecture de la demande sans règles : taille, fichier ordinaire (lien vers la base suivi par `cat`), clés uniques, action fermée, motifs par/le ; motif de refus qui recopierait le contenu. | Base des candidats lue et recopiée ; fichier énorme. | `[ -f ] && [ ! -L ]`, `head -c 1024`, clés exactes une fois, action fermée, par motif email ≤ 254, le ISO ; motifs de refus fixes ; CA6 lien et 2 Mo. |
| S4 | mineur | Sécurité, R5 | L'unité path est évaluée par root sur un chemin du volume qui suit les liens de l'appli. | Une option `MakeDirectory=` future ferait créer par root via un lien. | R5 : seulement `PathExists=` ; le service ne lit jamais ce chemin côté hôte ; « le seul effet de l'appli sur l'hôte est de déclencher le service ». |
| S5 | mineur | R8 | Limites des conteneurs de test non écrites (montages). | Un montage de trop donne root ou la base. | `--rm`, seul le worktree monté, ni socket, ni volume, ni .env, ni privileged, ni réseau hôte ; npm ci dans api/ (ignore-scripts) ; CA10 vérifie par docker inspect. |
| S6 | mineur | R12, R13 | Demandes refusées ou répétées vident l'historique de 30 et redémarrent la prod à volonté. | La page ne vaut plus trace. | Sécurité : la trace complète est le journal ; R17 : demande identique à celle en attente → 202 sans réécrire. |
| S7 | mineur | R17 | « email de la session (X-Forwarded-Email) » lu à la lettre = en-tête brut. | Email différent du membre. | `par` = `req.membre.email`. |

### Exploitation systemd

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| X1 | majeur | R5–R10 | TimeoutStartSec=1h plus court que la somme des attentes (verrou 1 h, 3×20 min, 15 min, deploy, retour, reboucle sans borne). | SIGTERM au milieu de deploy.sh ou du retour. | Supprimer la reboucle (le path relance tant que la demande existe) ; attentes bornées pour finir avant systemd ; TimeoutStartSec=3h, TimeoutStopSec=90 ; CA14 vérifie le budget. |
| X2 | majeur | R1, R9, R11 | Passage arrêté pendant deploy/retour : deploy.sh a déjà fait son checkout ; HEAD = origin/main → « rien à faire » alors que les conteneurs sont anciens. | Page affiche en ligne un commit non déployé. | « Dernier commit déployé avec succès » hors du dépôt ; R1 compare à lui ; HEAD différent → inconnu → déployer ; trap TERM qui note l'étape interrompue ; CA8 cas tué pendant deploy. |
| X3 | majeur | R9, CA8 | Conteneurs d'essai non nettoyés ; tuer `docker run` ne tue pas le conteneur. | npm test orphelin qui écrit pendant le passage suivant. | Conteneurs étiquetés ; arrêtés/supprimés au début et à la fin ; ExecStopPost sous flock -n ; CA8. |
| X4 | majeur | R6, CA9 | Protection start-limit seulement pour Docker muet ; autres sorties rapides (.env illisible, fetch avant retrait, auto-deploy.sh absent 203/EXEC). | Path en failed sans signe. | Retrait = première action après le verrou ; toute sortie en échec sans retrait attend 60 s ; doc de reprise (reset-failed) ; CA9 .env illisible. |
| X5 | majeur | R12, R13, UX | « Actif » = pas de PAUSE ; passages vides non enregistrés. | Timer arrêté, path failed, réseau coupé : page « actif », rien ne part. | `dernier_controle`, `dernier_fetch_ok` ; page : pas de contrôle depuis 30 min ; demande en attente depuis 2 min. |
| X6 | majeur | R1, R3, R10, R11 | Réseau absent : fetch KO non défini ; deploy.sh qui refuse avant changement (fetch, .env, ports, verrou) tombe dans R11 ; npm ci réseau → tests KO. | Retour inutile, bon commit noté en échec. | deploy.sh KO sans sa ligne « · Dépôt sur » = refus avant changement : ni retour ni échec ; fetch KO → automatisme sans action, demande refusée « git fetch impossible » ; doc. |
| X7 | majeur | R10, R14 | Décision « automatisme » prise au début ; un retour SSH pendant les tests est écrasé. | Retour d'urgence annulé en silence. | Après le verrou de deploy.sh, relire PAUSE et HEAD ; changés → abandon, noté ; CA8. |
| X8 | mineur | R10 | flock lié à la description ; deploy.sh rouvre son verrou. | Garder le verrou fait refuser deploy.sh. | Écrire : flock -w puis libérer ; fenêtre couverte par « refus avant changement ». |
| X9 | mineur | R5, R7, R8, R13 | Unités et chemins incomplets (UMask, Group, WorkingDirectory, After, Install, unités à activer ; chemins du verrou, essai, historique). | Worktree en 0600 ; doc ne peut citer. | Contenu des 3 unités ; umask 022 avant le worktree ; nommer les chemins. |
| X10 | mineur [extension] | Déploiement | Plus personne ne relance l'installation des unités ; divergence silencieuse. | Changement d'unité jamais appliqué. | cmp après un passage déployé ; journal, état, page. |
| X11 | mineur | Exploitation | Arrêter timer/path n'arrête pas un passage en cours. | Docker arrêté au milieu d'un déploiement. | Doc : attendre `is-active` inactive ; ligne Maintenance § 14. |
| X12 | mineur | Exploitation, CA18 | Pas de tableau de diagnostic. | Messages non interprétables. | Tableau message → cause → que faire dans deploy/README.md ; CA18. |
| X13 | mineur | R5, CA14 | Path après suppression/recréation du volume non vérifié. | Path muet. | CA14 : down, volume rm, up, demande déclenche. |
| X14 | mineur | Exploitation | Cache de construction non purgé. | Disque qui grossit. | Écrire le choix (non purgé, surveillé par verif-disque). |

### Déploiement et retour arrière

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D1 | majeur | R11, R14, CA5 | deploy.sh crée PAUSE si hash ≠ origin/main après son propre fetch ; main qui avance pendant les tests, ou le retour automatique, mettent en pause. « Remise comme avant » sans mécanisme. | Pause automatique fausse, merges suivants bloqués. | La pause est décidée par le demandeur : variable posée par auto-deploy.sh empêche deploy.sh de la créer, auto-deploy.sh la crée lui-même (hash ≠ origin/main lu à son fetch) ; retour automatique jamais. CA5. |
| D2 | majeur | R11, R15 | Le retour lance le deploy.sh du commit en échec, jamais testé. | Si deploy.sh est cassé, le retour échoue aussi. | Retour = `git checkout --detach <précédent>` puis son deploy.sh ; corriger le tableau ; CA3 deploy.sh en erreur de syntaxe → retour réussi. |
| D3 | majeur | R10, R11, CA3 | deploy.sh qui s'arrête avant de changer de commit rend le même code qu'un échec après. | Retour inutile (coupure de 15 s), commit noté en échec à tort. | Comparer HEAD après l'échec : inchangé → « arrêt avant changement », pas de retour ; noté en échec sauf verrou. CA3. |
| D4 | majeur | R5, R7, R8, R10, CA8 | TimeoutStartSec=1h < somme des durées ; passage tué pendant deploy/retour non traité. | Production à moitié déployée, page figée. | Timeout au-delà de la somme (calcul) ou tests plafonnés ; ne pas lancer deploy.sh s'il reste < 20 min ; « en cours » note l'étape ; passage interrompu enregistré, commande de retour affichée ; CA8 kill pendant deploy. |
| D5 | majeur | R10, P3, CA8 | « Dernier arrivé gagne » : un retour SSH pendant les tests est écrasé. | Retour d'urgence défait. | Après le verrou de deploy.sh, si HEAD ≠ commit du début ou PAUSE apparue (automatique) → « annulé », non noté en échec ; corriger verifications.md ; CA8. |
| D6 | majeur | R11, UX, CA3 | « Retour KO » sans suite ; retour lancé sans attendre le verrou. | Site peut-être hors service, page « en ligne », personne averti. | Le retour attend le verrou ; état `retour-ko` → alerte rouge dans l'en-tête jusqu'au prochain déploiement réussi, « Commit en ligne : incertain », commande SSH. CA3, CA13. |
| D7 | mineur | R8, R9, CA10 | Suppression des images d'essai non décrite ; même identifiant que la prod si commit en place. | `rmi` par ID ou `-f` retire les étiquettes de prod. | Par nom, jamais par ID ni -f ; CA10 essai du commit en place. |
| D8 | mineur | R14, CA5 | Moment de création de PAUSE par deploy.sh non dit. | Refus de deploy.sh qui met en pause sans rien déployer. | PAUSE après validation et checkout, reste en cas d'échec ; CA5. |
| D9 | mineur | R15 | Lignes manquantes : remontée depuis < 1.9 laisse PAUSE ; fin de passage avec compose/image du nouveau commit ; passages suivants par l'auto-deploy.sh d'un commit ancien. | Pause inattendue ; incompatibilités futures. | Lignes ajoutées + règle de compatibilité des formats et dossiers, reprise dans technique/. |
| D10 | mineur | R1, R13, UX | État absent après installation ; panne réseau → tests KO non retenté sans explication. | Page vide ; bon commit bloqué. | Écrire deploiement.json s'il est absent ; doc « une panne réseau donne aussi tests KO : Déployer maintenant ». |

### Testabilité

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T1 | majeur | R10, R11, R14, CA8 | Un `deploy.sh <hash>` en SSH pendant les tests d'un passage crée PAUSE et revient ; le passage attend le verrou puis déploie origin/main par-dessus ; en cas d'échec, R11 retire la pause et revient vers un « commit d'avant » périmé. | Le retour arrière manuel est défait sans bruit. | R10 : après le verrou de deploy.sh, relire PAUSE et HEAD ; s'ils ont changé (passage automatique), ne pas déployer (`annule`). R11 : retour vers HEAD relu, pause laissée telle quelle. CA avec ordre précis. |
| T2 | majeur | CA8, CA7 | CA8 : 5 acteurs, 6 attentes, sans ordre ; CA7 : fenêtre lecture/retrait non ouvrable. | Échec non diagnostiquable ; ordre fautif non joué. | Tableau de scénarios numérotés par ordre d'arrivée (2 passages, demande pendant les tests, deux demandes, deploy.sh manuel pendant tests / pendant deploy.sh, kill pendant tests / pendant deploy.sh) ; CA7 par enveloppe `docker` qui attend sur l'appel de lecture. Ajoutés à verifications.md. |
| T3 | majeur | R13, CA8 | Passage tué ou `ecrire_etat` en échec à la fin → « passage en cours » éternel ; passages vides ne réécrivent pas. | Page figée, relecture infinie. | R13 : au début de chaque passage, un « en cours » orphelin (verrou libre) est remplacé et enregistré `interrompu`. CA8 ; cas `ecrire_etat` KO à la fin puis relance. |
| T4 | majeur | Périmètre, CA17 | Banc non décrit : variable d'accord, faux / vrais outils, sortie. | Risque sur un vrai serveur ; mutations impraticables ou CA10 non prouvé. | `tools/test-auto-deploy.sh`, refus sans `AUTO_DEPLOY_JETABLE=oui` ; niveau (a) faux docker/deploy.sh + vrai git/flock ; niveau (b) banc systemd réel ; chaque CA rattaché ; `TOUT OK`/`ÉCHECS : n` ; `env -i`, `umask 022`. |
| T5 | majeur | CA2, CA3, CA6, CA11, CA15 | Comment provoquer test KO, build KO, deploy KO avant / après changement de commit, lenteur, sorties hostiles. | CA3 prouvé sur le seul cas facile. | Commits d'essai fabriqués par le banc ; CA3 en deux cas (KO avant / après le changement de commit). |
| T6 | majeur | R6, R7, R8, R10 | Attentes de 1 h / 15 min / 20 min non essayables ; issue de l'expiration de R7 non dite. | Chemins d'échec jamais exécutés ; mutations « bloque ». | Durées en variables (valeurs par défaut, réduites par le banc) ; issue de l'expiration écrite ; CA « chaque attente expire ». |
| T7 | majeur | Mutations | Aucune garde à muter nommée. | Mutations sans lien avec les écarts vérifiés. | Liste « Gardes à mettre à l'épreuve » avec le CA qui détecte chacune. |
| T8 | majeur | R15, CA | Aucun CA ne rejoue une ligne du tableau « script qui se remplace ». | Retour automatique par le deploy.sh du commit en échec, premier passage 1.8 → 1.9 jamais exercés. | CA : (1) 1.8 → 1.9 sans PAUSE ; (2) passage où auto-deploy.sh change ; (3) retour automatique depuis un commit dont deploy.sh change. |
| T9 | majeur | UX/UI, CA13 | CA13 sans outil ni données ; double clic pendant l'envoi non essayé. | Vérifié à l'œil ; double demande. | Exemples de deploiement.json par état servis par l'API de dev, vérifications dans `tools/e2e-serveur.py` (boutons, confirmation, étape KO ouverte, texte hostile, POST ralenti + double clic ⇒ une demande). |
| T10 | mineur | R12, R13, R16 | Noms des champs de deploiement.json non donnés. | Page et script divergent. | Exemple complet de deploiement.json dans la spec. |
| T11 | mineur | CA6 | Préfixe ambigu ≥ 7 caractères infabriquable simplement. | Branche jamais exercée. | Fabriquer par fast-import, ou noter « non observable » vérifié par lecture. |
| T12 | mineur | CA12 | Écriture par renommage non observable par inject. | Mutation survivante. | Lecture en boucle pendant 50 POST, ou « non observable ». |
| T13 | mineur | R1, R2 | Lancement à la main alors qu'une demande attend : un ou deux traitements ? | Comportement non jugeable. | Préciser dans R1 ; scénario. |
| T14 | mineur | CA17 | Lignes de verdict non recopiées. | Régression e2e masquée. | CA17 : recopier la ligne de verdict de chaque suite. |

### Utilisateur admin

#### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| U1 | majeur | UX / UI, en-tête d'état | Pas de conclusion en une phrase comme le verdict vert/rouge/neutre de `sauvegardes.html` ; l'en-tête aligne des hash ; le cas grave (déploiement KO + retour KO) n'apparaît que dans la liste. | Un admin non technicien ne sait pas si son merge est en ligne, en test, refusé ou bloqué ; il peut rater un site cassé. | Tableau « Verdict de l'en-tête » : vert à jour ; neutre main a avancé (≤ 10 min) ; neutre en pause ; rouge dernier de main KO aux tests ; rouge déploiement et retour ratés (journalctl). CA13 vérifie chaque cas. |
| U2 | majeur | R12, R13, UX | « Actif » = absence de PAUSE ; timer arrêté ou service qui échoue → la page affiche toujours « actif », aucune date de dernière vérification. | L'admin merge et attend sans savoir que le serveur ne vérifie plus. | Chaque passage, même sans rien à faire, enregistre `derniere_verification` ; la page affiche « Dernière vérification » ; au-delà de 25 min, verdict rouge. CA13, CA14. |
| U3 | majeur | R6, R13, UX | (a) « Demande en attente » infinie si path tombé / Docker muet ; (b) « Passage en cours » infini si passage tué ; relecture 10 s sans fin. | L'admin ne sait pas s'il doit attendre ou appeler. | (a) au-delà de 5 min, bandeau rouge « la demande n'a pas été prise en charge » ; (b) le passage suivant efface un « en cours » orphelin et l'enregistre « interrompu » ; arrêt de la relecture après les seuils. CA8, CA13. |
| U4 | majeur | UX boutons globaux | Aucune confirmation pour « Déployer maintenant » ni « Reprendre » ; Reprendre déclenche une mise en ligne ; Déployer maintenant en pause laisse la pause. | Surprises : pause qui reste, nouveau commit en production sans le savoir. | Textes exacts : « Déployer maintenant » (commit, déjà en ligne, déjà en échec, reste en pause, remplace la demande de) ; « Reprendre » (le dernier de main sera testé puis mis en ligne). CA13. |
| U5 | mineur | R3, R11, R12 | Valeurs techniques (`tests-ko`, `npm-test`, motifs de développeur) sans libellés affichés. | Codes bruts à l'écran. | Tableau des libellés affichés (résultats, étapes, motifs). |
| U6 | mineur | R13 | État écrit seulement au début et à la fin ; bandeau figé. | L'admin soupçonne un blocage. | Écrire l'état au début de chaque étape ; afficher l'étape (k/4). |
| U7 | mineur | UX par passage | « Déployer ce commit » sur un passage « déploiement KO » sans avertissement ; commits hors automatisme absents de la liste. | Relance d'un commit qui a cassé ; recherche vaine. | Confirmation ajoute « la dernière mise en ligne de ce commit a échoué » ; dire que seuls les commits passés par l'automatisme figurent (sinon deploy.sh en SSH). |
| U8 | mineur | UX, API | Pas de textes pour 202, 400, 503. | Messages génériques, pas d'accusé. | Textes pour 202, 400, 503 ; CA13. |

## Traitement
Décisions : S1 tranché par l'utilisateur (ligne principale, `deploy.sh` en SSH garde la règle large). Conflit D3/X6 : détection par `HEAD` inchangé (D3), commit noté en échec sauf « déjà en cours » (évite de retester toutes les 10 min un commit que `deploy.sh` refuse) ; `git fetch` en échec traité par R1 (X6). Conflit S2/X2 : référence = dernier commit déployé avec succès, gardé par l'hôte hors du volume et du dépôt (X2) ; `HEAD` différent → commit en place incertain ; `deploiement.json` n'est qu'une vue réécrite (S2).

| # | Traitement | Où |
|---|---|---|
| S1 | integre (décision de l'utilisateur) | R3, CA6, V16 |
| S2 | integre | R13, Sécurité, CA11 |
| S3 | integre | R6, CA6 |
| S5 | integre | R8, CA10 |
| S6 | integre (demande identique non réécrite ; journal = trace) | R17, R18 |
| S7 | integre | R17, CA12 |
| X1 | integre (plus de reboucle ; attentes bornées ; `TimeoutStartSec=4h` justifié) | R5, R6, R7 |
| X2 | integre | R1, R13, R20, CA8 SC6 |
| X3 | integre | R8, R9, CA8, CA10 |
| X4 | integre | R6, CA9, Exploitation |
| X6 | integre (fetch) ; partie refus : voir D3 | R1, R10 |
| X8 | integre | R10 |
| X9 | integre | R5, R7, R8, R13 |
| X11, X12, X14 | integre | Exploitation, R9, CA18 |
| X13 | integre | CA14 |
| D1 | integre (`RECRUTEMENT_PAR_AUTO=1`, pause créée par `auto-deploy.sh`) | R10, R11, R14, CA5 |
| D2 | integre | R11, tableau R15, CA3 |
| D3 | integre | R10, CA3 |
| D6 | integre | R11, verdict UX, CA3 |
| D7, D8 | integre | R9, R14, CA5, CA10 |
| D9 | integre | tableau R15, R15 (compatibilité), Déploiement |
| D10 | integre | R13, UX (état absent), Exploitation |
| T1 | integre | R19, CA8 SC3 |
| T2 | integre (scénarios numérotés ; déroulé aux tâches, P2) | CA7, CA8 |
| T3 | integre | R20, CA8 SC5–SC6 |
| T4 | integre en une phrase (détail aux tâches, P2) | CA (en-tête), niveaux A/B |
| T5 | integre (cas de CA3) ; fabrication des commits aux tâches | CA3 |
| T6 | integre | R7, CA14 |
| T7 | déplacé aux tâches (P2) | découpage |
| T8 | integre | CA19 |
| T9 | integre | CA13 |
| T10 | integre | exemple de `deploiement.json` |
| T11, T12 | integre (ou « non observable » noté) | CA6, CA12 |
| T13 | integre | R1, CA4 |
| T14 | integre | CA17 |
| U1 | integre | verdict UX |
| U2 | integre `[ajout]` | R13 `dernier_controle`, verdict |
| U3 | integre `[ajout]` (a) ; (b) par T3 | UX bandeau, R20 |
| U4, U5, U8 | integre | tableau des textes |
| U6 | integre | R13 `en_cours.etape`, UX |
| U7 | integre | confirmation, liste |

Mécanismes ajoutés et exécutions concurrentes (règle des étonnements 1.7) :
- `ExecStopPost` de nettoyage sous `flock -n` du verrou de passage : un `auto-deploy.sh` lancé à la main qui tient le verrou garde ses conteneurs et son dossier d'essai ; le nettoyage ne touche que l'étiquette `recrutement-essai` et `~/.recrutement-deploiement/essai`, jamais les conteneurs ni les images de production, ni le cache des sauvegardes. À tester avec un passage manuel ralenti pendant l'arrêt du service (CA8 SC5).
- Reprise d'un `en_cours` orphelin (R20) : faite sous le verrou de passage, donc jamais pendant un autre passage ; un `deploy.sh` manuel peut tourner (il ne touche pas `~/.recrutement-deploiement/`).
- Retour automatique (R11) : attend le verrou de `deploy.sh` comme R10 ; une sauvegarde ou un `deploy.sh` manuel passent avant (CA8 SC4).
- R19 : relecture de `HEAD` et `PAUSE` après le verrou de `deploy.sh` ; fenêtre entre libération et appel couverte par l'arrêt « déjà en cours » de R10.
Vérifications refaites : V16 ajoutée (S1) ; V13 reste valable ; scénarios SC1–SC6 écrits pour la tâche qui réalise R7, R9, R19, R20.
