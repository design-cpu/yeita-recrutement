---
type: challenge
version: 1.3
tour: 3
spec: 3
score: 97
scores: Technique front=100; Intégrateur API=92; Sécurité réseau et proxy=98; Données personnelles=100; Exploitation Docker=100; Recruteur=92
bloquants: 0
recevables: 3
ecartes: 2
decision: valide
date: 2026-10-26
---

# Challenge — tour 3 (spec v3)

> **Score global : 97/100** (88 au tour 2, 47 au tour 1) · Décision : **validée**
> Conditions : moyenne ≥ 80 ✓ · aucun challenger < 70 ✓ · aucun bloquant ✓
> Arbitre : 3 retours recevables (2 majeurs, 1 mineur), 2 écartés (doublons) ; aucune dérive, aucun conflit
> Intégrés dans la spec finale : comparaison de la partie de la fiche à chaque écriture relue (R10) ; ordre d'arrivée de l'envoi de départ dans H5 et CA8 (A9) ; contrôle IPv6 à la mise en service (S8, V40).

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Technique front | 0 | 0 | 0 | 1 | 100 |
| Intégrateur API | 0 | 1 | 0 | 1 | 92 |
| Sécurité réseau et proxy | 0 | 0 | 1 | 0 | 98 |
| Données personnelles | 0 | 0 | 0 | 0 | 100 |
| Exploitation Docker | 0 | 0 | 0 | 0 | 100 |
| Recruteur | 0 | 1 | 0 | 0 | 92 |
| **Global** | | | | | **97** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité | Constat | Proposition |
|---|---|---|---|---|
| R10 | Recruteur | majeur | La comparaison de la partie de la fiche ne joue qu'après un 409, qui n'arrive presque jamais puisque la fiche relit avant d'écrire | Comparer à chaque écriture relue |
| A9 | Intégrateur API | majeur | L'envoi de départ peut arriver avant le `PUT` en cours ; CA8 inverse l'ordre | Retarder la réponse du `PUT` dans CA8 ; risque dans H5 |

## Verdicts de l'arbitre
### Verdicts
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| R10 | Recruteur | majeur (partiel) | recevable | majeur | Vérifié dans la spec v3 : R6h relit avant chaque écriture, le `PUT` part avec la version fraîche, la comparaison de R6i n'est demandée que « sur conflit » ; `fiches.ec2` est une copie complète de l'écran (V37, `ec2.html` l. 581, 879) ; le troisième cas de CA7 contredit R6h et R6i : contradiction interne, pas un ajout ; gardé pour F11 |
| F11 | Technique front | majeur | ecarte (doublon) | — | Même défaut et même proposition que R10 ; ses précisions (`DOSSIER.upgrade` des deux côtés, sans effet sur R16) peuvent être reprises au traitement |
| A9 | Intégrateur API | majeur | recevable | majeur | Vérifié : `candidats.js` l. 44, 84 (`UPDATE … WHERE id = ? AND version = ?`) ; deux requêtes indépendantes, ordre d'arrivée non garanti ; CA8 échoue par construction si l'interception retient le `PUT` avant son envoi ; H5 muette ; argument nouveau ; gardé pour A2 |
| A2 | Intégrateur API | majeur (partiel) | ecarte (doublon) | — | Porté par A9, plus précis |
| S8 | Sécurité réseau | majeur | recevable | mineur | Scénario principal réfuté par V40 ; reste : le contrôle sur le serveur n'essaie que l'IPv4 et ne vérifie pas `EnableIPv6` ; commandes au README |

### Dérives et conflits
- Aucune dérive : les cinq retours portent sur des règles réécrites en v3 (R6g, R6h, R6i, CA7, CA8, H5, R22b, R32) ; aucune nouvelle `[extension]` ; A2 → A9 et S6 → S8 reviennent chaque fois sur la règle réécrite avec un argument nouveau.
- Aucun conflit : R10/F11 et A9 touchent des chemins différents (relecture normale, `pagehide` sans relecture), propositions compatibles.
- Statuts « resolu » cohérents : F9, A7, S6, S7, E10 (IPv4 ; IPv6 porté par S8) ; D11 cohérent, avec la réserve signalée par D (mode navigateur, `pagehide` dans un autre onglet, comme sur `main`, hors production).
- Statuts « partiel » cohérents : R10, A2.

## Technique front — 100/100
### Analyse
| Critère | Analyse |
|---|---|
| Attente du démarrage sur chaque page | Solide (R4c, R4e, R3, CA1, CA3) ; 404 classé avant le corps (ligne 4, CA2). |
| Fidélité à la logique métier | R6h écrit les mêmes champs (V37) ; `store.js` intact. Trou : R6h relit avant chaque écriture mais R6i ne compare la partie que « sur conflit » : presque jamais de 409, le cas R10 n'est pas couvert (F11). |
| Mode navigateur intact | Solide (R2, R16, R37) ; R6i empêche `LocalAdapter` de recréer un dossier supprimé. |
| Testabilité | CA8 précis ; CA21 étendu ; le troisième cas de CA7 ne peut pas passer si R6h et R6i sont appliquées à la lettre (F11). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| F9 | resolu | R6g, R6h : `pagehide` sans relecture, `keepalive` ; CA8 sur `candidat.html` et `ec1.html` |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| F11 | majeur | R6h, R6i, CA7 | Si un autre onglet a changé `fiches.ec2`, la relecture le voit, la page pose sa partie par-dessus, le `PUT` part avec la version fraîche et passe ; la comparaison de R6i ne joue que sur 409 | Scénario R10 : notes écrasées en silence ; CA7 échoue ou chacun le réalise à sa façon | R6h : à chaque enregistrement relu, comparer d'abord la partie relue (`fiches.ec1`/`ec1`, `fiches.ec2`, `fiches.decompte`) avec celle que la page a lue ou écrite en dernier, après `DOSSIER.upgrade` des deux côtés ; si elle a changé : aucune écriture, rejet `conflit`, bandeau, R11b ; R6i garde la tentative unique sur 409 avec la même comparaison ; valable en mode navigateur (sans effet sur R16 et les 4 e2e) ; CA7 inchangé |

## Intégrateur API — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Correspondance méthode → route et codes | Solide : tableau conforme à `api/README.md` l. 102-123 ; ligne 4 (404 de `/api/moi`, corps non lu) avant ligne 5 (non JSON), cohérent avec V22 ; 404 de `/api/equipe` bloqué (R3, CA2). |
| Versions gardées et conflits | R6f règle le conflit avec soi-même ; R6g « version envoyée + 1 » conforme au code (`candidats.js` l. 43, 84) ; R6i cohérent avec R7. Faille : l'envoi de départ suppose que le `PUT` en cours est traité avant lui ; CA8 tel qu'écrit produit l'ordre inverse (A9). |
| Réponses d'oauth2-proxy | Couvertes (lignes 2, 5, 6 ; R8, V29 ; R38, CA2). |
| Cas de la fiche 1.2-3 | Points 1 à 4 couverts (ligne 5, CA13, R6c, R6b, R6c à R6e, R10). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| A2 | partiel | R6g ne contredit plus R6f ; H5 créée ; CA8 retarde le `PUT` précédent ; mais l'ordre d'arrivée n'est pas garanti et CA8 le renverse (A9) |
| A7 | resolu | Ligne 4 avant les corps non JSON ; CA2 : 404 `text/html` → navigateur |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| A9 | majeur | R6g, H5, CA8 | L'envoi de départ (N+1) et le `PUT` en cours (N) sont indépendants ; l'API ne met à jour que si la version en base vaut celle envoyée (`candidats.js` l. 44) ; si l'envoi de départ arrive le premier → 409 non affichable ; CA8 retarde le `PUT` par interception dans le navigateur, avant l'envoi : l'envoi de départ arrive toujours le premier ; H5 ne parle que de conflit avec quelqu'un d'autre et de réseau | CA8 échoue par construction ou ne prouve rien ; la perte sur connexion lente n'est ni essayée ni écrite comme risque | CA8 : retarder la **réponse** du `PUT` précédent (transmis à l'API, réponse renvoyée 1 s plus tard), puis vérifier le texte en base ; H5 : ajouter « ou arrivé à l'API avant le `PUT` en cours (ordre non garanti) : refus pour conflit, saisie de départ perdue ; risque accepté » |

## Sécurité réseau et proxy — 98/100
### Analyse
| Critère | Analyse |
|---|---|
| Joignabilité de l'API | Solide pour IPv4 (R22b, R24, CA17, V30, V31) ; v3 : `enable_ipv6: false` (V39), sortie de `front` par `edge` (V38, CA17). Trou : le contrôle sur le serveur (R32, § Exploitation) n'essaie que l'IPv4 (S8). |
| En-têtes et routes d'oauth2-proxy | Inchangé (R23, V5, V7, V12, CA17, V35). |
| Mode local impossible en production | Inchangé (R28, V15, CA16, CA18). |
| Rôles et accès | Inchangé (V8, R31, CA22). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S6 | resolu | R22b `enable_ipv6: false`, CA16, V39 ; le cas « IPv6 activé par défaut sur le moteur » est porté par S8 |
| S7 | resolu | V38, CA17 |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S8 | majeur | R22b, R32, § Exploitation, § Mise en service | Le contrôle avant le premier admin n'essaie que l'IPv4, que `inhibit_ipv4` coupe toujours ; R22b affirme qu'un IPv6 activé par défaut sur le moteur ne s'applique pas avec `enable_ipv6: false`, mais V39 ne l'a pas essayé ; un `false` peut être pris pour « non renseigné » | Moteur avec IPv6 par défaut et `false` non transmis : l'hôte joint l'API en IPv6, contrôle au vert, mise en service à tort | README (R32) et § Exploitation : `docker network inspect <projet>_back` → `EnableIPv6: false` et aucune `IPv6Address` pour `api` ; hôte → IPv4 : échec ; si une IPv6 existe, hôte → `[IPv6]` : échec ; sinon pas de mise en service, `docker compose down` (jamais `-v`) ; V39 : retirer la parenthèse ou l'essayer (`daemon.json` IPv6 par défaut, `compose up` avec `enable_ipv6: false`) |

## Données personnelles — 100/100
### Analyse
| Critère | Analyse |
|---|---|
| Ce qui reste dans le navigateur | Inchangé en v3 : CA1 toutes les clés, deux exceptions listées ; H4 et R32. Solide. |
| Ce qui est journalisé | Inchangé : jamais le corps, rotation 10 Mo × 3, CA21 dans les journaux. Solide. |
| Repli silencieux | 404 classé avant le corps (cas 4) ; sur l'hôte de production, bloqué (R2, CA2). Aucun nouveau chemin silencieux. Solide. |
| Effacement | R6i : relecture vide → aucune écriture ni tentative, dans les deux modes ; CA21 sur les trois pages. En mode serveur, l'envoi de `pagehide` part avec une version connue → 409 sans recréation. Nuance sans gravité : en mode navigateur, l'envoi de `pagehide` peut réécrire un dossier supprimé dans un autre onglet, comme sur `main`, et seulement hors production (H4). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| D11 | resolu | R6i, R11b ; CA21 étendu à `candidat.html`, `ec1.html`, `decompte.html` |

### Retours ouverts
Aucun nouveau bloquant ni majeur sur les changements v3.

## Exploitation Docker — 100/100
### Analyse
| Critère | Analyse |
|---|---|
| Image et Dockerfile | Solide et inchangé en v3 : digest de l'index avec `linux/amd64` (R25, V32) ; `npm ci` dans le dossier de `api/package.json`, `.npmrc` compris ; `USER node`, `LABEL` ; CA18. |
| Volume et droits | Solide : `name: recrutement_data` avec étiquette (R22, V36), CA16, R32 (`down -v`, `volume prune`), volume gardé au retour à la 1.2. |
| Healthcheck et redémarrage | Solide : 200 en moins de 4 s (R27), CA18 (503 → `unhealthy`), relance saine après lecture seule. |
| Gestion de l'équipe et contrôles | Solide : moteur relevé aux prérequis, parade à refaire s'il est plus ancien que 29.9.2 (R32) ; contrôle réseau avant le premier admin, « sinon pas de mise en service » ; ordre dans § Mise en service ; commandes au README (chef d'équipe). |
| Retour arrière | Solide et inchangé (R30, CA20, R32). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| E10 | resolu | R32 : moteur relevé, V31 à refaire s'il est plus ancien ; contrôle avant le premier admin avec conduite à tenir ; § Mise en service ; `--network host` couvert (même pile réseau que l'hôte) ; IPv6 coupé (R22b, V39, CA16) ; renvoi « R30b » corrigé ; commandes au README |

### Retours ouverts
Aucun nouveau bloquant ni majeur sur les changements v3.

## Recruteur — 92/100
### Analyse
| Critère | Analyse |
|---|---|
| Compréhension de l'identité | Solide et inchangé (R13, CA9, CA10, R4e). |
| Messages d'erreur et de conflit | Solide (R11, R11b ; R6i ajoute le bandeau sur relecture vide). Manque : le refus de R6i ne se produit que « sur conflit » (R10). |
| Retour sur l'onglet | Solide (R15b, CA12) ; sur `ec2.html`, le retour ne relit que `renderFrom1()`, acceptable seulement si l'écriture suivante refuse une partie changée ailleurs (R10). |
| Continuité du travail en cours | Meilleure (R6i, CA21, R6g, CA8, H5). Le trou reste sur le chemin normal : R6h relit avant chaque écriture, la version est fraîche, aucun 409, la comparaison de R6i ne s'exécute jamais. |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| R10 | partiel | R6i compare seulement « sur conflit » ; R6h relit avant chaque écriture : le `PUT` part avec la version relue, sans 409 ; dans CA7 (deux onglets `ec2.html`), le second onglet pose sa copie périmée de `fiches.ec2` (V37) et l'écrit avec succès ; CA7 échouerait, ou la spec se contredit |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| R10 | majeur | R6h, R6i, CA7 | La comparaison n'est demandée qu'après un 409 ; la relecture de R6h fournit une version à jour : pas de 409, la partie modifiée ailleurs est remplacée ; vaut aussi pour `ec1` et `decompte` | Notes d'un collègue effacées en silence, scénario que CA7 promet d'empêcher | R6h : à chaque relecture (normale et après 409), si la partie relue diffère de celle que la page a lue ou écrite en dernier : aucune écriture, rejet `conflit`, bandeau, « Non enregistré », saisie gardée ; R6i : sur 409, une seule nouvelle tentative avec le même contrôle ; CA7 : aucun `PUT` du second onglet n'aboutit ; préciser le mode navigateur (R16) |

## Traitement
Spec validée ; les retours recevables, simples, sont intégrés dans la spec finale.
| # | Statut | Justification / modification |
|---|---|---|
| R10 | integre | R6i : comparaison à chaque écriture relue (et à la nouvelle tentative), après `DOSSIER.upgrade` des deux côtés (reprise de F11) ; CA7 : aucun `PUT` du second onglet n'aboutit |
| A9 | integre | H5 : envoi de départ arrivé avant le `PUT` en cours ; CA8 : réponse du `PUT` précédent retardée de 1 s, le `PUT` atteignant l'API |
| S8 | integre | V40 ; R32 : `EnableIPv6: false` et aucune adresse IPv6 pour `api` vérifiés avant le premier admin ; commandes au README |
