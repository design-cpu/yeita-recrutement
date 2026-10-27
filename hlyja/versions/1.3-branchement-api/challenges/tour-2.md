---
type: challenge
version: 1.3
tour: 2
spec: 2
score: 88
scores: Technique front=92; Intégrateur API=67; Sécurité réseau et proxy=90; Données personnelles=92; Exploitation Docker=92; Recruteur=92
bloquants: 1
recevables: 8
ecartes: 2
decision: nouveau-tour
date: 2026-10-26
---

# Challenge — tour 2 (spec v2)

> **Score global : 88/100** (47 au tour 1) · Décision : nouveau tour (3e et dernier)
> Conditions : moyenne ≥ 80 ✓ · aucun challenger < 70 ✗ (Intégrateur API 67) · aucun bloquant ✗ (A7)
> Arbitre : 8 retours recevables, 2 écartés (doublons) ; aucune dérive, aucun conflit
> Points clés : un 404 en HTML bloquerait les pages hors production (A7) ; l'enregistrement de départ des fiches part trop tard ou en conflit avec soi-même (F9, A2) ; la nouvelle tentative de R6h peut écraser la même partie (R10) ou recréer un dossier supprimé (D11) ; IPv6 sur `back` (S6, confirmé par V39).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Technique front | 0 | 1 | 0 | 1 | 92 |
| Intégrateur API | 1 | 1 | 0 | 1 | 67 |
| Sécurité réseau et proxy | 0 | 1 | 1 | 0 | 90 |
| Données personnelles | 0 | 1 | 0 | 0 | 92 |
| Exploitation Docker | 0 | 1 | 0 | 0 | 92 |
| Recruteur | 0 | 1 | 0 | 0 | 92 |
| **Global** | | | | | **88** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité | Constat | Proposition |
|---|---|---|---|---|
| A7 | Intégrateur API | bloquant | Ligne « non JSON » avant ligne « 404 » : le 404 HTML des serveurs statiques bloque les pages | 404 au démarrage classé avant la lecture du corps |
| A2 | Intégrateur API | majeur | Envoi de départ avec la version d'avant si un `PUT` est en cours | Version la plus haute connue, ou version que le `PUT` en cours produira |
| F9 | Technique front | majeur | Fiches : relecture avant l'envoi de départ, `PUT` trop tard | Pas de relecture sur `pagehide` |
| R10 | Recruteur | majeur | Réessai qui écrase la même partie modifiée ailleurs | Réessai seulement si la partie de la fiche n'a pas changé |
| D11 | Données personnelles | majeur | Relecture `null` (dossier supprimé) non traitée | Aucune écriture, bandeau |
| S6 | Sécurité | majeur | IPv6 sur `back` | `enable_ipv6: false` explicite |
| E10 | Exploitation | majeur | Moteur du serveur et contrôle de mise en service | Relever le moteur, contrôle avant le premier admin, conduite à tenir |

## Verdicts de l'arbitre
### Verdicts
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| F9 | Technique front | bloquant | recevable | majeur | Vérifié : `ec1` l. 816, `ec2` l. 879, `decompte` l. 443 appellent `saveCand()` sur `pagehide` ; avec R6h, le `PUT` part après la réponse du `GET`, page déchargée, sans `keepalive` ; gardé pour A8 ; ramené à majeur comme A2 au tour 1 (seule la dernière pause est perdue) |
| F10 | Technique front | majeur | ecarte (doublon) | — | Porté par A2 (même conflit R6g/R6f, scénario plus détaillé) |
| A2 | Intégrateur API | majeur (partiel) | recevable | majeur | R6g contredit R6f ; CA8 ne retarde aucun `PUT` ; gardé pour F10 ; renvoi à un « H5 » inexistant (forme) |
| A7 | Intégrateur API | bloquant | recevable | bloquant | Ligne 4 (non JSON) avant ligne 5 (404) alors que le 404 de `http.server` est en `text/html` (V22) : pages bloquées hors production ; R2, R16, R37, P4, CA15 intenables ; défaut introduit par A5 |
| A8 | Intégrateur API | majeur | ecarte (doublon) | — | Porté par F9, plus précis |
| S6 | Sécurité réseau | majeur | recevable | majeur | Confirmé par V39 ; R22b et CA16 muets sur IPv6 |
| S7 | Sécurité réseau | majeur | recevable | mineur | V38 : route par `edge`, DNS, Google répond ; reste à l'inscrire dans CA17 |
| D11 | Données personnelles | majeur | recevable | majeur | Relecture `null` non traitée ; `PUT` `null` sur dossier supprimé → 201 (`candidats.js` l. 76-88) ; seul le cas serveur est nouveau |
| E10 | Exploitation Docker | majeur | recevable | majeur | Moteur du serveur non relevé (argument nouveau) ; contrôle hôte → `back` hors de l'ordre de mise en service, sans `--network host` ni conduite à tenir ; « R30b » (forme) |
| R10 | Recruteur | majeur | recevable | majeur | `fiches.ec2` copie complète (V37) ; réessai sans comparer la partie relue : écrasement silencieux ; CA7 ne teste que des parties différentes |

### Dérives et conflits
- Aucune dérive : tous les retours portent sur des retours ouverts ou des règles nouvelles ou modifiées en v2 (R6g, R6h : F9, F10, A2, A8, D11, R10 ; tableau : A7 ; R22b, R32 : S6, S7, E10). Aucune nouvelle `[extension]`.
- Aucun conflit : F9, A2, R10, D11 visent R6g et R6h avec des propositions compatibles, à concevoir d'un seul tenant ; A2 propose aussi « pas de second `PUT` concurrent » : choix de l'orchestrateur.
- Lien : S6 et E10 portent sur l'efficacité de R22b sur le moteur du serveur.
- Statuts « resolu » vérifiés : cohérents (F4, A5, S1, D5 avec leurs suites portées à part ; A2 « partiel » cohérent).

## Technique front — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Attente du démarrage sur chaque page | Solide (R4c, R4e, R3, CA1, CA3). Trou au départ de la page : R6h (« en relisant ») incompatible avec R6g sur `pagehide` (F9) ; R6g (« sans attendre la file ») incompatible avec R6f (F10). |
| Fidélité à la logique métier | R6h écrit les mêmes champs qu'aujourd'hui (V37) ; `store.js` intact ; R6 : la table faible tient. |
| Mode navigateur intact | Solide (R2, R16, R37) ; avec R6h, `LocalAdapter.get` rend `Promise.resolve` (`dossier.js` l. 209) : aucun effet visible, même sur `pagehide`. |
| Testabilité | Gros progrès (R38, CA1, CA2, CA6, CA7, CA13) ; CA8 ne dit ni la page ni le cas d'un `PUT` en cours. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| F4 | resolu | R6h, CA7 |
| F5 | resolu | R2 `file:` ; H2 (arbitrage) |
| F6 | resolu | R38, CA1, CA13, CA2 |
| F8 | resolu | R3 : jamais d'état mixte |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| F9 | bloquant | R6h, R6g, CA8 | `ec1` (l. 816), `ec2` (l. 879), `decompte` (l. 443) appellent `saveCand()` sur `pagehide` ; avec R6h, `GET` puis `PUT` : le `PUT` part après le déchargement, le `keepalive` ne s'applique jamais | Dernière saisie des trois fiches perdue sans message en changeant de page | R6h : sur `pagehide`, pas de relecture : la partie est posée sur le dernier dossier lu ou enregistré et envoyée avec `keepalive` ; CA8 sur `candidat.html` et `ec1.html` |
| F10 | majeur | R6g, R6f, CA8 | L'envoi de départ « sans attendre la file » porte la même version qu'un `PUT` en cours : l'un des deux reçoit 409 | Conflit avec soi-même en quittant la page, dernières frappes perdues | R6g : si un `put` du même identifiant est en cours, l'envoi de départ porte la version que ce `put` produira (+1) ; CA8 avec `PUT` précédent retardé de 1 s |

## Intégrateur API — 67/100
### Analyse
| Critère | Analyse |
|---|---|
| Correspondance méthode → route et codes | Solide : le tableau suit `api/README.md` l. 99-140, classement ordonné. Faille : la ligne 4 (« corps non JSON […] quel que soit le statut ») passe avant la ligne 5 (« 404 au démarrage ») ; le 404 du serveur statique est en `text/html` (V22) : le mode navigateur ne peut jamais être choisi par un 404 (A7). |
| Versions gardées et conflits | R6f et CA6 règlent le conflit avec soi-même. Mais R6g fait partir l'enregistrement de `pagehide` « sans attendre la file », avec la version de l'objet : périmée si un `PUT` est en cours. R6h (« en relisant ») est incompatible avec un départ de page. |
| Réponses d'oauth2-proxy | Couvertes (lignes 2 et 4, R8, V29) ; simulées par interception réseau (R38) ; CA2 complet. |
| Cas de la fiche 1.2-3 | Points 1 à 4 couverts (ligne 4, R6c, CA13, R6b, R6c à R6e). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| A1 | resolu | R6f et CA6 |
| A2 | partiel | `keepalive` posé, sans seuil (V33) ; mais « sans attendre la file » contredit R6f |
| A3 | resolu | R6c à R6e, message, `encodeURIComponent`, CA13 ; « Remplacer tout » masqué |
| A5 | resolu | Un seul tableau ; l'ordre introduit cependant A7 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| A2 | majeur | R6g, R6f ; CA8 | On tape, une pause envoie un `PUT`, on tape encore, on quitte avant sa réponse : le `PUT` de `pagehide` part avec la version d'avant → 409 que la page ne peut plus afficher | Perte silencieuse de la dernière saisie sur connexion lente ; CA8 ne le voit pas | R6g : si un `PUT` est en cours, l'enregistrement de départ part quand même avec la version la plus haute connue ; perte possible en cas de 409 = risque accepté (H5, `MODELE.md`) ; ou bien pas de second `PUT` concurrent. CA8 avec `PUT` précédent retardé de 1 s |
| A7 | bloquant | § API et intégrations (lignes 4 et 5) ; R2 ; P4 | La ligne 4 l'emporte sur la ligne 5 ; le 404 de `python3 -m http.server` est en `text/html` (V22) | Hors production, les pages ne montrent rien ; les 4 e2e échouent ; R16, R37, CA15 intenables | Placer « 404 au démarrage, quel que soit le corps » avant la ligne des corps non JSON ; CA2 : 404 `text/html` → navigateur |
| A8 | majeur | R6h, R6g ; CA7, CA8 | R6h fait un `GET` puis un `PUT` ; lancé sur `pagehide`, le `PUT` ne part qu'à la réponse du `GET`, page déjà déchargée | Dernière saisie des trois fiches perdue à chaque départ | R6g : sur `pagehide`, pas de relecture ; la fiche pose sa partie sur le dernier dossier lu et envoie aussitôt ; CA8 étendu à `ec1.html` et `decompte.html` |

## Sécurité réseau et proxy — 90/100
### Analyse
| Critère | Analyse |
|---|---|
| Joignabilité de l'API | Faille du tour 1 démontrée et corrigée (V30, V31, R22b, R24, CA17). Deux trous : la parade ne vaut que pour IPv4 (S6) ; la sortie de `front`, relié aussi à `back`, n'est vérifiée nulle part (S7). |
| En-têtes et routes d'oauth2-proxy | R23 vérifié (V5, V7, V12) ; CA17 reprend V6 ; `skip_auth_routes` ancré par `$` ; § inter-sites réécrit (V35). |
| Mode local impossible en production | Solide (R28, V15, CA16, CA18). |
| Rôles et accès | Correct (V8, R31, CA22). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S1 | resolu | V30, V31, R22b, R24, CA16, CA17, R32 ; V31 renvoie à un « R30b » inexistant (forme) ; IPv6 en S6 |
| S2 | resolu | CA17, détail au plan de QA ; ancrage `$` |
| S3 | resolu | V35, § réécrit |
| S4 | resolu | Rejet recevable, backlog |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S6 | majeur | R22b, R24, CA16, CA17 | `inhibit_ipv4` ne retire que l'adresse IPv4 ; V30, V31 n'ont essayé qu'IPv4 ; si le `daemon.json` du serveur partagé active IPv6 par défaut, `back` reçoit une passerelle IPv6 sur l'hôte | Même risque que S1, par IPv6 | R22b : `enable_ipv6: false` explicite sur `back` ; CA16 : `docker network inspect` → `EnableIPv6: false` ; CA17 rejoué avec IPv6 activé par défaut ; R32 : contrôle IPv6 |
| S7 | majeur | R22, R22b, CA17, V31 | `front` sur `edge` et `back` : oauth2-proxy doit joindre Google ; aucune vérification de sa route par défaut ni de son DNS ; un conteneur du seul `back` n'a aucune sortie (V11) | Plus aucune connexion en production si la sortie passe par `back` ; invisible pour `check-site.sh` | Vérification sur moteur Linux : depuis `front` (ou un témoin relié aux mêmes réseaux), résolution et HTTPS vers `oauth2.googleapis.com`, route par défaut par `edge` ; CA17 ; sinon `gw_priority` sur `edge` |

## Données personnelles — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Ce qui reste dans le navigateur | Solide : CA1 couvre toutes les clés ; deux exceptions listées. Nuance non remontée : `yeita-match-resultat` porte l'identifiant, le résultat et les noms des recruteurs (`host`, `obs`), effacé seulement si EC1 le reprend ; relais hors périmètre. H4 et R32 règlent les copies locales. |
| Ce qui est journalisé | Solide : jamais le corps ; rotation et durée écrites ; CA21 cherche le repère dans les journaux. |
| Repli silencieux | Solide : R2 (hôte de production), R4e, R3, CA2, CA3 ; retour vers la 1.2 traité. |
| Effacement | R6e, CA21, R17, R18, « Copies ». Trou nouveau : R6h ne dit pas quoi faire quand le dossier relu a été supprimé ; CA21 ne précise pas la page ouverte de Bob. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| D1 | resolu | R17, CA14 (arbitrage) |
| D2 | resolu | R18, « Copies », R40 |
| D3 | resolu | R2, tableau cas 5, CA2 (arbitrage) |
| D5 | resolu | CA21 |
| D6 | resolu | CA1 ; exceptions au § Sécurité |
| D7 | resolu | H4, consigne R32 ; aucun code |
| D8 | resolu | R6e ; CA13 |
| D9 | resolu | V34 |
| D10 | resolu | § Sécurité « Journaux », R32 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D11 | majeur | R6h, CA21 | Rien ne dit quoi faire si la relecture de R6h rend `null` (dossier supprimé) ; une réalisation qui repart de l'objet de la page ou d'un `{id}` neuf réécrit : avec une version → 409, avec `null` → 201 ; en mode navigateur, `LocalAdapter` recrée le dossier ; la nouvelle tentative double le risque | Un dossier effacé à la demande du candidat revient, en tout ou en partie | R6h : relecture `null` → la fiche n'écrit rien, ne retente pas, garde la saisie, bandeau conflit et saisie non enregistrée, aussi en mode navigateur ; CA21 : `ec1.html` et `decompte.html` ouvertes chez Bob, saisie après la suppression : aucun `PUT` qui aboutit, aucune recréation, bandeau |

## Exploitation Docker — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Image et Dockerfile | Solide : digest de l'index avec `linux/amd64` (R25, V32) ; `npm ci` dans le dossier de `api/package.json`, `.npmrc` compris ; CA18 ; structure détaillée renvoyée à la tâche. |
| Volume et droits | Solide : `name: recrutement_data` et étiquette (R22, V36), CA16, R26, R32 ; au retour à la 1.2, le volume reste. |
| Healthcheck et redémarrage | Solide : 200 en moins de 4 s (R27), CA18 (503 → `unhealthy`), R29. |
| Gestion de l'équipe et contrôles | Solide (R31, V17, CA22, R33). Manque : le seul contrôle de R22b et R24 sur le vrai serveur est manuel, hors de l'ordre de mise en service, sans conduite à tenir s'il réussit (E10). |
| Retour arrière | Solide : R30 après le changement de commit, CA20, R32 et § Déploiement. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| E1 | resolu | R30 ; CA20 |
| E2 | resolu | § Mise en service et R32 |
| E3 | resolu | V36, R22, CA16 |
| E4 | resolu | R27, CA18 |
| E5 | resolu | § Retour arrière, R32 |
| E6 | resolu | V32, R25 |
| E7 | resolu | R25, CA18, tâche |
| E8 | resolu | R32, étiquette |
| E9 | resolu | R32 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| E10 | majeur | R22b, R32, § Mise en service, § Exploitation | `inhibit_ipv4` essayé seulement sur `docker:29-dind` 29.9.2 ; version du moteur du serveur non relevée (version minimale demandée par S1 non reprise) ; le contrôle de R24 sur le serveur n'est pas dans l'ordre de mise en service, ne couvre pas `--network host`, et ne dit pas quoi faire s'il réussit ; V31 renvoie à un « R30b » inexistant | Option sans effet sur le moteur du serveur → usurpation par l'hôte, sans que rien n'oblige à s'en apercevoir avant des données réelles | Relever `docker version` du serveur au README § 1 (refaire V31 si plus ancien) ; § Mise en service, entre le premier `deploy.sh` et le premier admin : pont sans adresse, `curl` hôte → IP de l'api sur `back` et depuis `--network host` : échec ; si l'un répond : `docker compose stop api`, pas d'admin, retour à la 1.2 ; même procédure au README ; corriger le renvoi de V31 |

## Recruteur — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Compréhension de l'identité | Solide : « Connecté·e : Alice », « · lecture seule » (R13, CA9, CA10) ; en attente, `#qui` vide et `QUI.moi()` rend `""` (R4e) ; `S.me()` jamais vide en mode serveur. Rien à redire. |
| Messages d'erreur et de conflit | Solide : bandeau collant (R11, CA5), « Non enregistré » et consigne (R11b), pas de bouton en lecture seule. Manque : le réessai automatique de R6h ne laisse aucun message quand il écrase le travail d'un autre. |
| Retour sur l'onglet | Solide (R15b, CA12). Manque : sur `ec2.html`, le retour ne relit que `renderFrom1()` ; les notes EC2 affichées ne sont jamais mises à jour. |
| Continuité du travail en cours | Nettement mieux (R4e, CA3, R11b). Nouveau trou : le réessai de R6h repose la partie entière ; une fiche EC2 ouverte et périmée écrase en silence les notes enregistrées ailleurs. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| R1 | resolu | R4e ; CA3 |
| R2 | resolu | R11b ; CA5 |
| R3 | resolu | R15b ; « sans perdre le défilement » retiré ; CA12 |
| R4 | resolu | R11 collant ; CA5 |
| R6 | resolu | R13 ; CA9 |
| R7 | resolu | R11 : aucun bouton en lecture seule |
| R8 | resolu | Rejet recevable : régression notée dans `MODELE.md`, évolution au backlog |
| R9 | resolu | R2, ligne 1 du tableau ; CA2 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| R10 | majeur | R6h, R15b, CA7 | Sur conflit, la fiche relit et repose sa partie entière sans vérifier si quelqu'un d'autre a changé cette même partie (`fiches.ec2` est la copie complète de l'écran, V37) ; `ec2.html` ne relit que `renderFrom1()` au retour. Onglet EC2 d'hier rouvert, ou deux recruteurs sur le même entretien : la première frappe donne un 409, le réessai passe et remplace les notes enregistrées entre-temps, sans bandeau ni « Non enregistré ». Même risque sur `ec1` et `decompte` ; CA7 ne teste que des parties différentes | Notes d'un collègue effacées en silence | R6h : avant le réessai, comparer la partie relue avec celle que la page a lue ou écrite en dernier ; si elle a changé, pas de réessai : rejet `conflit`, bandeau, « Non enregistré » ; réessai seulement si une autre partie a changé. CA7 : `ec2.html` dans deux onglets, notes modifiées dans l'un puis frappe dans l'autre : refus avec bandeau, notes du premier gardées |

## Traitement
Retours recevables seulement (spec v3). Chef d'équipe P2 (tour 2) appliqué.
| # | Statut | Justification / modification |
|---|---|---|
| A7 | integre | Tableau § API et intégrations : le 404 de `/api/moi` au démarrage (ligne 4) passe avant les corps non JSON (ligne 5), corps non lu ; CA2 : 404 `text/html` → navigateur |
| A2 | integre | R6g : si un `put` est en cours, l'envoi de départ porte la version que ce `put` produira, sinon la plus haute connue ; refus non affichable : H5, `MODELE.md` (R40) ; CA8 avec `PUT` précédent retardé de 1 s |
| F9 | integre | R6g et R6h : sur `pagehide`, pas de relecture, partie posée sur le dernier dossier lu ou enregistré ; CA8 sur `candidat.html` et `ec1.html` |
| R10 | integre | R6i : nouvelle tentative seulement si la partie de la fiche est identique à la dernière lue ou écrite par la page, sinon rejet `conflit` ; CA7 (deux onglets `ec2.html`) |
| D11 | integre | R6i : relecture vide → aucune écriture ni nouvelle tentative, bandeau, dans les deux modes ; CA21 étendu aux trois pages ouvertes chez Bob |
| S6 | integre | V39 ; R22b : `enable_ipv6: false` ; CA16 : `EnableIPv6: false` |
| S7 | integre | V38 ; CA17 : `front` sort par `edge` |
| E10 | integre | R32 : moteur du serveur relevé aux prérequis (refaire V31 s'il est plus ancien), contrôle réseau avant le premier admin, sinon pas de mise en service ; commande et conduite à tenir au README (chef d'équipe P2) ; § Mise en service ; renvoi « R30b » de V31 corrigé |
