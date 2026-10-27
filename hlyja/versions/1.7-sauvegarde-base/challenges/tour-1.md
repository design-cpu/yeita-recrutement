---
type: challenge
version: 1.7
tour: 1
spec: spec-v1.md
score: 44
valide: non
date: 2026-10-27
---

# Tour 1 — spec v1

> Score 44 (Exploitation 44, Sécurité et RGPD 68, Restauration 32, Testabilité 30) : non validé. 21 majeurs recevables, aucun bloquant.
> Les manques portent sur trois points : la restauration n'est pas exécutable telle qu'écrite (identifiants S3, clé, transfert tronqué, ré-effacement, perte du serveur) ; les alertes peuvent se taire (deux adresses égales, arrêt par systemd, démarrage avant Docker) ; plusieurs promesses n'ont pas de critère qui les prouve (signal, contenu des pings, essai sur le serveur).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Score |
|---|---|---|---|---|
| Exploitation système (E) | 0 | 5 | 8 | 44 |
| Sécurité et RGPD (S) | 0 | 2 | 8 | 68 |
| Restauration (Rs) | 0 | 8 | 2 | 32 |
| Testabilité (T) | 0 | 6 | 11 | 30 |
| **Global** | 0 | 21 | 29 | **44** |
Retours écartés par l'arbitre : S6 (doublon de E5), S10 (doublon de Rs1), T9 (réalisation) ; Rs6 en partie (réécrire la suppression en SQL hors de l'API : hors périmètre).

## Retours recevables bloquants et majeurs
| # | Constat (résumé) |
|---|---|
| E1 | `backup.sh` ne s'exclut pas d'un `deploy.sh` (recréation de l'api, `git pull` du script en cours) |
| E2 | Deux adresses de ping égales : la sauvegarde resterait verte grâce aux pings du disque |
| E3 | Lancement au démarrage avant Docker ou avant que l'api soit saine : fausse alerte |
| E4 | Arrêt par systemd (durée dépassée) : ni `/fail` ni nettoyage garantis |
| E5 | Adresse de ping lisible dans les arguments de `curl` par tout compte du serveur |
| S1 | « Pas le droit d'effacer à distance » doit être un droit retiré à l'utilisateur S3, pas un comportement |
| S2 | Déchiffrement sur le poste sans dossier, droits ni emplacement de la clé |
| Rs1 | Identifiants du bucket perdus avec le serveur |
| Rs2 | Rien ne vérifie que la clé du coffre correspond à `AGE_RECIPIENT` |
| Rs3 | Une relance le même jour écrase la copie de la nuit, en local et sur OVH |
| Rs4 | La restauration écrase la base actuelle sans en garder l'état |
| Rs5 | Transfert tronqué accepté (`cat` sort en 0) |
| Rs6 | Pas de commande pour lister les suppressions ; pas de `sqlite3` dans l'image |
| Rs7 | Contrôles de la copie et de la restauration sans valeurs attendues |
| Rs8 | Perte du serveur non décrite |
| T2 | Faux `docker` qui imiterait `compose config` : les pièges de Compose non prouvés |
| T3 | `https://` exigé alors que le faux healthchecks est local |
| T4 | Contrôle abîmé « simulé » : risque de crochet de test en production |
| T5 | Signal et clair laissé par une coupure sans critère |
| T7 | Essai sur le serveur sans critère ni gestes |
| T8 | Aucune preuve qu'aucune donnée, adresse ou clé ne fuit dans journaux et pings |

## Verdicts de l'arbitre
Tous recevables avec la sévérité proposée, sauf : S6 écarté (doublon de E5) ; S10 écarté (doublon de Rs1) ; T9 écarté (réalisation) ; Rs6 recevable en partie (lister après l'arrêt, sans filtre de date, par `node` ; écarté : rejouer la suppression en SQL, hors périmètre — le ré-effacement passe par l'interface) ; T1 et T6 ramenés à mineur.
Conflits signalés : Rs1 / S10 / S1 (quels identifiants au coffre) ; Rs4 dépend de Rs3 ; E10 / T17 (tester la règle finale). Recoupements à rédiger ensemble : E4-S4-T5, S7-T8, S3-E9-T14, S11-Rs2, E7-T12. Effet de bord de E1 : pendant une sauvegarde, `deploy.sh` dira « un déploiement est déjà en cours ».

## Arbitrages de l'orchestrateur
| Conflit | Décision | Raison |
|---|---|---|
| Rs1 / S10 / S1 | Deux utilisateurs S3 : celui du serveur (écriture sans effacement, S1) ; un second en **lecture seule**, rangé au coffre avec la clé privée, pour restaurer depuis un poste | Moindre privilège, cohérent avec la décision de l'utilisateur ; recommandation de l'arbitre |
| Rs4 / Rs3 | Rs3 retenu : nom du `.db.age` horodaté par exécution ; Rs4 devient sûr | Le pitch ne fixe que le nom de la copie dans le conteneur |

## Traitement
| # | Statut | Où dans la spec v2 |
|---|---|---|
| E1 | integre | R5 : attente bornée du verrou de `deploy.sh` ; corps dans `main` ; CA7 ; effet de bord écrit (§ Exploitation) |
| E2 | integre | R6 : deux adresses différentes, `https://` pour les deux ; CA6, CA9 |
| E3 | integre | R14 : `Wants`/`After` ; R7 (3) : attente de l'api saine 120 s ; CA11 |
| E4 | integre | R8 : sur signal, clair supprimé puis `/fail` ; R14 : `TimeoutStopSec=90` ; CA17 |
| E5 | integre | R10 : adresse par `curl -K` sur un descripteur (V19) ; CA7, CA18 |
| E6 | integre | R7 (1) : adresse lue et validée en premier |
| E7, T12 | integre | R7 (3) : nom pris dans la dernière ligne, aucun calcul de date ; motif ; H2 retirée |
| E8 | integre | R2, R8 : noms des temporaires fixés |
| E9 | integre | R14 `RandomizedDelaySec=15min` ; R15 grâce justifiée |
| E10, T17 | integre | R14 : `cmp` à trois issues ; § « Mettre à jour les unités » ; CA13 |
| E11 | integre | § Déploiement : retour arrière avant 1.7 |
| E12 | integre | § Exploitation : `sudo journalctl` ; `deploy` relance à la main |
| E13 | integre | R10 : message « rate limited » ; P1 étape 5 : une minute entre deux essais |
| S1 | integre | R18 : utilisateur du serveur sans `s3:DeleteObject`, bucket d'un autre propriétaire (V20) ; limite de l'écrasement écrite ; H3 + CA19 |
| S2 | integre | R16 : dossier `mktemp -d` hors synchronisation, `umask 077`, disque chiffré, clé dans ce dossier, `trap rm -rf` ; CA12 |
| S3, T14 | integre | R4, R9 : âge = date de modification, en minutes ; R12 : maxima exacts, prolongés tant que l'alerte est rouge |
| S4 | integre | R14 : `ExecStopPost` qui supprime le clair ; CA17 |
| S5 | integre | R5 : `umask 077`, dossier `deploy` 700 vérifié ; R14 `UMask=0077` |
| S7, T8 | integre | R10 : corps fait d'un texte fixe par étape ; CA18 |
| S8 | integre | R7 (5) : en-tête `age-encryption.org/v1` contrôlé avant l'envoi ; CA5 |
| S9, Rs8 | integre | R16 « Serveur perdu » et limite RGPD écrite (R12, `api/README.md`) |
| S11, Rs2 | integre | R6 : une seule clé `age1…` (V18) ; R17 : contrôle `age-keygen -y` ; essai de bout en bout à la mise en service |
| S12 | integre | R18 : région UE (GRA ou SBG) ; § Sécurité : sous-traitants |
| Rs1 | integre | R17, R18 : utilisateur S3 en lecture seule au coffre ; R16 (a) remote créé sur le poste |
| Rs3 | integre | R7 (5) : `recrutement-AAAA-MM-JJTHHMMSSZ.db.age` ; CA20 |
| Rs4 | integre | R16 (d) : `deploy/backup.sh` avant de remplacer, si l'api est saine |
| Rs5 | integre | R16 (f) : empreinte SHA-256 et `integrity_check` dans le conteneur avant le remplacement ; CA12 |
| Rs6 | integre (partie recevable) | R16 (e) : liste de toutes les suppressions par `node`, après l'arrêt ; ré-effacement par l'interface (h) ; V17 |
| Rs7 | integre | R16 (c), (h) : `user_version`, comptes, dernière date du journal, règle de choix |
| Rs9 | integre | R16 : tableau « cas → procédure » |
| Rs10 | integre | R16 : « Avant de commencer » ; (i) efface aussi la clé |
| T1 | integre | § Tests : tests de `sauvegarde.js` dans `api/test/equipe.test.js` (commandes en ligne) |
| T2 | integre | CA6 : `docker compose config` réel, seuls `exec`, `cp`, `info`, `inspect` simulés |
| T3 | integre | CA10 : faux healthchecks HTTPS, `CURL_CA_BUNDLE`, aucun `-k` |
| T4 | integre | CA2 : base source abîmée comme V3, aucun crochet de test |
| T5 | integre | CA17 |
| T6 | integre | CA21 : liste des mutations |
| T7 | integre | CA19 : gestes du guide humain sur le serveur |
| T10 | integre | CA1 reformulé |
| T11 | integre | R10 : 3 tentatives, 10 s par tentative ; CA7 |
| T13 | integre | CA9 : vrai `df`, `df` en échec, dossier Docker distinct |
| T15 | integre | CA15 |
| T16 | integre | CA12 |
| T18 | integre | V18 |
