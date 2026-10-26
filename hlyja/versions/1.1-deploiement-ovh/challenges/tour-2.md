---
type: challenge
version: 1.1
tour: 2
spec: 2
score: 94
scores: Docker/Compose=100; Sécurité et authentification=100; Exploitation serveur partagé=90; Testabilité et mode d'emploi=84
bloquants: 0
recevables: 4
ecartes: 1
decision: valide
date: 2026-10-26
---

# Challenge — tour 2 (spec v2)

> **Score global : 94/100** · Décision : validé
> Conditions : moyenne ≥ 80 ✓ · aucun challenger < 70 ✓ · aucun bloquant ✓
> Arbitre : 4 retours recevables, 1 écarté (doublon) ; aucune dérive.
> Points clés : homonymie du projet Compose `recrutement` sur le serveur (E13) ; protocole de test contredit par le contrôle d'`origin` (L14) ; `.env` resté sur `localhost` validé à tort (L15). Intégrés dans la spec finale.

## Récapitulatif
Score = 100 − 25 × bloquants − 8 × majeurs − 2 × mineurs, sur les retours recevables ouverts.

| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Docker/Compose | 0 | 0 | 0 | 0 | 100 |
| Sécurité et authentification | 0 | 0 | 0 | 0 | 100 |
| Exploitation serveur partagé | 0 | 1 | 1 | 0 | 90 |
| Testabilité et mode d'emploi | 0 | 2 | 0 | 1 | 84 |
| **Global** | | | | | **94** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité retenue | Constat | Proposition |
|---|---|---|---|---|
| E13 | Exploitation | majeur | Projet reconnu par son seul nom Compose | Arrêt si une ressource `recrutement` vient d'un autre dossier |
| L14 | Testabilité | majeur | R23 contredit le contrôle d'`origin` de R16 ; `sudo` manque | URL du dépôt réglable pour le test ; ordre des essais |
| L15 | Testabilité | majeur | `.env` resté sur `localhost` validé à tort | `deploy.sh` exige `REDIRECT_URL = https://$DOMAIN/oauth2/callback` et refuse `localhost` |

## Verdicts de l'arbitre

### Verdicts
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| E8 | Exploitation | mineur | recevable | mineur | Reste ouvert (statut `partiel`). R15 dit que « relancer après une interruption est sûr », mais CA9 ne contient aucun cas d'interruption. La proposition est celle du tour 1 : pas de nouvelle exigence. |
| E13 | Exploitation | majeur | recevable | majeur | Vrai oubli, alourdi par la v2 : R15 et R16 reconnaissent le projet par le seul `name: recrutement` de R20. Si ce nom est déjà pris, les scripts suppriment ou arrêtent des conteneurs d'un autre service. Le moyen de détection relève de la réalisation. |
| L1 | Testabilité | majeur | ecarte (doublon) | — | Doublon de L14, plus précis. Le protocole demandé au tour 1 existe (R23). |
| L14 | Testabilité | majeur | recevable | majeur | Porte sur ce qui a changé : R16 compare l'`origin` à l'URL GitHub figée, R23 le remplace par un dépôt nu local sans dire quand ; CA8 ne peut pas passer tel qu'écrit ; `sudo` manque. Le nom de la variable, V20 et le `.env` de test relèvent de la réalisation. |
| L15 | Testabilité | majeur | recevable | majeur | Cause introduite en v2 : `.env.example` prêt pour `localhost`, R15 ne refuse que deux valeurs ; avec `DOMAIN=localhost` conservé, `deploy.sh` annonce un succès à tort. Compatible avec l'arbitrage S5/L8. |

### Dérives et conflits
- Dérives : aucune. E13 porte sur R20, inchangé depuis la v1, mais c'est un vrai oubli à effet de bord sur le serveur partagé. Les précisions de réalisation de L14 ne doivent pas revenir comme exigences.
- Conflits : aucun. E13 et L15 ajoutent des arrêts compatibles dans R15.
- Remarque hors verdict : R21 enchaîne le cas B puis la variante cas A sans arrêter `caddy` (V16) ; CA13 (« seul `front` démarre ») paraît faux. À reprendre par l'orchestrateur.

## Docker/Compose — 100/100
### Analyse
| Critère | Analyse |
|---|---|
| Fidélité au pitch (images, tags, étapes) | Solide. R1 garde les deux étapes (`python:3.12-slim` lance `python3 tools/build.py /site`, puis `quay.io/oauth2-proxy/oauth2-proxy:v7.15.5`, V1) et fixe maintenant le lancement (`--config=/etc/oauth2-proxy/oauth2-proxy.cfg`, monté en lecture seule). R3 garde les upstreams `file:///srv/site/#/` et `#/index.html` (V4, V5). R11 donne `caddy:2.11.7` (V2). Les écarts au pitch viennent tous d'un arbitrage de l'utilisateur et sont tracés en `[ajout]` : `reverse_proxy = false` (V15) et le second upstream. |
| Compose (réseau, profils, ports, journaux, nom de projet) | Solide. R8 (`127.0.0.1:4180:4180`, `edge` 172.30.0.0/24) et R5 (`http_address = "0.0.0.0:4180"`, V19) se complètent, ce qui rend le port publié joignable. R10 et V11 couvrent le profil `caddy`. R15 et V16 traitent explicitement le passage du cas B au cas A. R11 ajoute 443/udp, R12 limite les journaux, R20 fixe `name: recrutement`, R22 ajoute `restart: unless-stopped`. CA5, CA6 et CA13 contrôlent le tout. |
| Contenu de l'image | Conforme à R2, R17 et CA1, sans changement depuis v1. Les exclusions de `build.py` et de `.dockerignore` suivent le pitch. La configuration reste hors de l'image : elle est montée, et la recréation forcée de R15 la recharge. |
| Reproductibilité | Les tags sont figés (V1, V2). R15 recharge la configuration à chaque déploiement (`--force-recreate`, vérifié par CA9). Un retour arrière remonte aussi le cfg du commit choisi, puisque le fichier monté vient de l'arbre de travail. R6 fait échouer Compose si une variable manque. R14 nettoie par étiquette (V12) et la spec dit de contrôler le stockage effectif. R23 fixe un protocole de test des scripts reproductible (V18). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| D1 | resolu | R5 fixe `http_address = "0.0.0.0:4180"`, vérifié par V19 (défaut `127.0.0.1:4180` confirmé). R1 donne le chemin de montage et l'option `--config`. |
| D3 | resolu | R22 met `restart: unless-stopped` sur chaque service, CA6 le contrôle avec `docker inspect`. E4 traite le risque lié sur 80/443 en cas B (R15). |
| D4 | resolu | R15 lance `up -d --remove-orphans --force-recreate`. CA9 exige qu'une modification de `deploy/oauth2-proxy.cfg` soit active après déploiement. La section Exploitation dit que la configuration est reprise à chaque déploiement. |
| D6 | resolu | R6 : « une variable absente fait échouer Compose avec un message ». R6 limite aussi les variables passées à chaque service (4 `OAUTH2_PROXY_*` pour `front`, `DOMAIN` pour `caddy`). Le moyen (`${VAR:?…}`) relève de la réalisation. |
| D9 | resolu | R11 publie 443/udp en plus de 80 et 443, sur le port 443 du pitch. |

D2, D5, D7, D8 et D10 ont été écartés par l'arbitre. Je ne les reprends pas : je n'ai pas d'argument nouveau. Le fond de D5 est traité par E1 (R16, CA8), celui de D10 par E10 (R15, V16).

### Retours ouverts
Aucun retour bloquant ou majeur nouveau. Les changements de la v2 (R5, R6, R11, R15, R22, R23) ne posent aucun nouveau problème de Docker ou de Compose qui changerait le résultat.

## Sécurité et authentification — 100/100
### Analyse
| Critère | Analyse |
|---|---|
| Liste publique exacte et sans contournement | Solide. R4 n'a pas changé (regex ancrées, `telechargements/` sans point initial, V6, V14). Le contournement par `X-Forwarded-Uri` est confirmé (V15 : 200 sans connexion avec `reverse_proxy = true`) puis fermé : R7 passe à `reverse_proxy = false`, et V15 donne 302 avec ce réglage. CA3 rejoue l'en-tête forgé « via Caddy et directement sur 127.0.0.1:4180 ». Un compte local du serveur subit la même authentification (« Sécurité et conformité »). Le commentaire de R7 empêche de revenir à `true` sans précaution. |
| Configuration oauth2-proxy (domaine, proxys de confiance, cookies) | Solide. R5 écrit explicitement `cookie_secure`, `cookie_httponly` et `cookie_samesite = "lax"`, ce que V17 prouve et CA4 contrôle. R5 fixe aussi `http_address = "0.0.0.0:4180"` (V19), et seule la publication sur 127.0.0.1 (R8, CA5) limite l'exposition. `email_domains = ["yeita.fr"]` s'accompagne maintenant d'un client « Interne » (parcours étape 3, R19). `trusted_proxy_ips` reste écrit mais n'a plus d'effet (R7). Ce point est confirmé par V15 : avec `false`, la réponse est 302 depuis une adresse de confiance. La durée de session reste celle par défaut, comme choix produit renvoyé au backlog. |
| Secrets | Solide. R6 met les secrets dans `.env` (600, propriétaire `deploy`), exclu du contexte Docker (R17) et de git (CA11), avec une variable absente qui fait échouer Compose. R15 refuse le cookie secret et l'identifiant client d'exemple, ce qui permet à `.env.example` de rester utilisable en local (arbitrage S5/L8). CA9 couvre ce refus. |
| En-têtes HTTP | Solide. R9 reprend les 4 en-têtes en cas B, et l'exemple nginx du cas A utilise `add_header … always`. CA4 les vérifie via Caddy, CA12 vérifie la syntaxe des exemples. Le risque HSTS sur `localhost` est documenté (R19). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| S1 | resolu | Le problème est vérifié (V15). `reverse_proxy = false` est un arbitrage définitif de l'utilisateur (R7). CA3 rejoue l'en-tête forgé via Caddy et en direct. Le risque d'accès local à 4180 disparaît (« Sécurité et conformité »). |
| S2 | resolu | Le client OAuth de type « Interne » est exigé à l'étape 3 du parcours et dans R19. |
| S3 | resolu | Les attributs sont écrits explicitement dans R5, prouvés par V17 et contrôlés par CA4. La durée de session reste celle par défaut : la justification « choix produit », renvoyée en Améliorations possibles, est recevable (l'arbitre en avait laissé le choix à l'orchestrateur). |
| S4 | resolu | R9 impose `add_header … always` dans l'exemple nginx. |
| S5 | resolu | R15 refuse le cookie secret et l'identifiant client de `.env.example`, et CA9 couvre ce refus. Le `.env.example` valide en local relève de l'arbitrage S5/L8. |
| S6 | resolu | R19 documente le risque HSTS sur `localhost` et la façon de le purger. |

### Retours ouverts
Aucun. Rien de bloquant ou de majeur dans ce qui a changé. Le passage à `reverse_proxy = false` est sans effet de bord sur l'authentification : l'URL de retour vient de `OAUTH2_PROXY_REDIRECT_URL`, qui est absolue ; `cookie_secure = true` s'applique quel que soit le schéma vu par oauth2-proxy ; la seule perte, l'adresse réelle du visiteur dans les journaux, est déjà écrite dans « Sécurité et conformité ».

## Exploitation serveur partagé — 90/100
### Analyse
| Critère | Analyse |
|---|---|
| Aucun effet de bord sur les autres services | Nettement mieux : un `deploy` existant hors du groupe `docker` arrête le script (R16), 80/443 sont vérifiés avant `build` en cas B (R15), on ne modifie jamais un proxy conteneurisé (R19), 4180 est contrôlé sur toute adresse et parmi les ports publiés par Docker (R16). Il reste un oubli : tous les contrôles « tenu par le projet » et `--remove-orphans` reposent sur le seul nom de projet `recrutement` (R20), et rien ne vérifie que ce nom n'est pas déjà pris sur le serveur (E13). |
| Idempotence et arrêts propres | Solide : toutes les vérifications passent avant la première modification, et une seconde exécution ne change rien (R16). Côté R15 : verrou hors du dépôt, script lu en entier, valeurs d'exemple refusées, « relancer après une interruption est sûr », `restart: unless-stopped` (R22). CA8 et CA9 se rejouent selon R23. Seule l'interruption n'a pas de critère. |
| Retour arrière | Solide : le commit doit exister, être un ancêtre de `origin/main` et contenir `compose.yaml` et `deploy/deploy.sh`. Le commit en place est affiché et la commande de retour donnée en cas d'échec (R15). La HEAD détachée est expliquée (R19). CA9 couvre ces cas. |
| Nettoyage limité au projet | Solide : `prune` filtré par étiquette, rien de global (R14). Le stockage d'images est une hypothèse à contrôler avec `docker info`. Le profil `caddy` inactif arrête et supprime le `caddy` du projet (R15, V16). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| E1 | resolu | R16 : clone fait par `deploy`, propriétaire `deploy` exigé, arrêt sinon ; CA8 vérifie `sudo -u deploy git status`. Il faudra créer `/opt/recrutement` (propriétaire `deploy`) avant le clone, puisque `deploy` ne peut pas écrire dans `/opt` : c'est un point de réalisation. |
| E2 | resolu | R16 : un `deploy` existant hors du groupe `docker` arrête le script sans rien changer ; s'il est dans le groupe, seule la clé est ajoutée. Cas couvert par CA8. |
| E3 | resolu | Arbitrage E3/L4 appliqué dans R19 : la consigne `network_mode: host` est retirée ; on s'arrête et on fait valider, avec une solution réversible. |
| E4 | resolu | R15 : 80 et 443 doivent être libres ou tenus par le `caddy` du projet, vérifié avant `build` ; cas couvert par CA9. |
| E5 | resolu | Écarté comme doublon de D3, traité par R22. |
| E6 | resolu | Écarté (réalisation), mais R15 place quand même le verrou hors du dépôt. |
| E7 | resolu | R15 valide le commit avant `checkout`, affiche le commit en place et donne la commande de retour. Cas couvert par CA9. |
| E8 | partiel | R15 affirme « relancer après une interruption est sûr » et R19 conseille `tmux`, mais aucun critère ne le vérifie (CA9 ne couvre pas d'interruption). Exemple : un `.git/index.lock` laissé par un `checkout` interrompu bloque la relance. |
| E9 | resolu | R16 : port 4180 contrôlé sur toute adresse et parmi les ports publiés par Docker, ou tenu par un conteneur du projet. |
| E10 | resolu | Vérifié (V16) ; R15 arrête et supprime `caddy` quand le profil est inactif ; cas couvert par CA9. |
| E11 | resolu | Écarté (extension), pas d'argument nouveau. |
| E12 | resolu | Hypothèse ajoutée (contrôle par `docker info`) ; la surveillance du disque est renvoyée au backlog, justification recevable. |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| E8 | mineur | R15, CA9 | « Relancer après une interruption est sûr » est affirmé mais jamais vérifié. | L'admin fait confiance à une affirmation non testée. Il peut tomber sur un échec git (verrou d'index laissé en place) au pire moment. | Ajouter à CA9 : « `deploy.sh` interrompu (signal) pendant `build`, puis relancé : il sort avec 0 et le site est sur le commit voulu ». |
| E13 | majeur | R20, R15, R16 | Plusieurs choses ne reconnaissent le projet que par son nom Compose `recrutement` : la portée de `--remove-orphans`, « 80/443 tenus par le `caddy` du projet », « 4180 tenu par un conteneur du projet » et « réseau hors projet ». Aucun script ne vérifie que ce nom n'est pas déjà utilisé sur le serveur partagé (un autre service ou un essai antérieur lancé depuis un autre dossier). C'est un oubli qui existait en v1, et les nouveaux contrôles de v2 en dépendent encore plus. | Si un projet Compose `recrutement` existe déjà, `up -d --remove-orphans` supprime ses conteneurs, et R15 peut arrêter un conteneur `caddy` étranger. Les contrôles de port et de sous-réseau tiennent aussi pour « à nous » des ressources d'un autre service. C'est exactement l'effet de bord que le pitch interdit. | Dans R16 et R15, avant toute modification ou tout `up` : si un conteneur, un réseau ou un volume porte `com.docker.compose.project=recrutement` sans `com.docker.compose.project.working_dir=/opt/recrutement` (ou, pour une image, sans l'étiquette `fr.yeita.projet=recrutement`), le script s'arrête avec un message et ne change rien. « Tenu par le projet » se définit par ces deux étiquettes, pas par le nom seul. Ajouter à CA8 et CA9 : « un conteneur d'un autre dossier lancé avec `-p recrutement` → arrêt sans modification ». |

## Testabilité et mode d'emploi — 84/100
### Analyse
| Critère | Analyse |
|---|---|
| Critères d'acceptation vérifiables en local | Nettement mieux. R23 fixe enfin un cadre pour CA8 et CA9 (« conteneur `ubuntu:24.04` privilégié … son propre `dockerd` ; `origin` remplacé par un dépôt nu local »). Le cas A a son critère (CA13, variante de R21), et CA12 s'appuie sur un certificat auto-signé. Il reste un problème : R23 contredit R16, qui clone une URL GitHub figée et « s'arrête » si l'`origin` diffère, alors que CA8 exige qu'« une seconde exécution ne change rien » (L14). Le paquet `sudo`, dont CA8 a besoin (`sudo -u deploy …`), manque à la liste de R23, et le lancement d'un `dockerd` dans `ubuntu:24.04` n'est pas vérifié (V18 ne contrôle que les paquets). Remarque sans retour : R21 enchaîne cas B puis variante A sans `docker compose --profile caddy down`, donc `caddy` reste en marche (V16) et « seul `front` démarre » (CA13) paraît faux. |
| `tools/check-site.sh` | Solide : R13 fixe `--max-time 10`, « connexion impossible = `FAIL` » et les codes 0, 1 et 2 ; R15 prévoit 6 essais en cas B ; R16 vérifie `curl`. Il reste une limite, devenue concrète avec le `.env.example` réglé pour `localhost` : le contrôle ne voit pas un `DOMAIN` ou une `OAUTH2_PROXY_REDIRECT_URL` incohérents. Il valide « 302 vers `https://accounts.google.com/` » même quand la connexion ne peut pas aboutir (L15). |
| Clarté du mode d'emploi (cas A, cas B, procédure prudente) | Bien meilleure. Le parcours est dans l'ordre : DNS, puis client OAuth « Interne » (étape 3), puis `.env`. R19 ajoute l'arbre de choix du cas par `ss -ltnp`, avec arrêt si `docker-proxy`. La procédure prudente relève les sites avant et après la modification et revient à la copie au premier écart. La HEAD détachée est expliquée, et un tableau « contrôle en échec → cause → commande » est prévu. Il reste un manque : l'étape 4 dit seulement « le remplit », sans dire quelles valeurs d'exemple il faut absolument changer, alors que `.env.example` est maintenant valide pour `localhost` (L15). |

### Retours précédents
| # | Statut | Justification |
|---|---|---|
| L1 | partiel | R23 donne le protocole demandé (Ubuntu 24.04, `dockerd`, dépôt nu local). Mais il entre en conflit avec le contrôle d'`origin` de R16 et ne précise pas l'ordre des essais. CA8 « seconde exécution » ne peut donc pas passer tel qu'écrit (voir L14). |
| L3 | resolu | Le DNS est vérifié par `dig +short` avant tout. Le certificat est obtenu « par l'outil déjà en place (sinon s'arrêter) ». CA12 s'appuie sur un certificat auto-signé. |
| L5 | resolu | R19 : « relevé des sites et de leur code HTTP … nouveau relevé, retour à la copie au premier écart ». Les commandes exactes relèvent de la rédaction du README. |
| L6 | resolu | R15 : en cas B, jusqu'à 6 essais espacés de 10 s. |
| L7 | resolu | CA13 et la variante cas A de R21 (`tools/check-site.sh http://127.0.0.1:4180`). |
| L8 | resolu | R6 : `.env.example` prêt pour le test local (cookie secret de 32 caractères, `DOMAIN=localhost`), refus des valeurs d'exemple en déploiement (arbitrage S5/L8). |
| L9 | resolu | R15 valide le commit (ancêtre d'`origin/main`, contient `compose.yaml` et `deploy/deploy.sh`) ; R19 explique la HEAD détachée et la reprise de `main`. |
| L10 | resolu | `curl --max-time 10` et connexion impossible = `FAIL`. La partie sur l'en-tête `Accept` reste couverte de fait par V7 et CA3. |
| L11 | resolu | R16 vérifie `curl`. |
| L12 | resolu | R19 : tableau « contrôle en échec → cause probable → commande ». |
| L13 | resolu | Le parcours place le client OAuth à l'étape 3, avant `.env` (étape 4). |

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| L14 | majeur | R23, R16, CA8 (suite de L1) | R16 clone `https://github.com/design-cpu/yeita-recrutement.git`, puis, s'il trouve le dépôt « avec un autre `origin` », il s'arrête. R23 remplace `origin` par un dépôt nu local sans dire à quel moment. Le `main` de GitHub ne contient pas encore `deploy/deploy.sh`. Le conteneur `ubuntu:24.04` ne contient pas `sudo`, que CA8 utilise et absent de la liste de R23. Le lancement de `dockerd` dans ce conteneur n'est pas vérifié (V18 ne contrôle que les paquets). R15 refuse aussi le cookie secret et l'identifiant client d'exemple, et R23 ne dit pas quel `.env` utiliser pour CA9. | Selon l'ordre choisi, la seconde exécution de `prepare-serveur.sh` s'arrête (`origin` différent), et CA8 « une seconde exécution ne change rien » échoue. Ou alors le clone vient de GitHub, sans les scripts, et le testeur bricole. | Dans R23, écrire l'ordre : 1) `prepare-serveur.sh` lancé deux fois avec une clé de test, l'URL du dépôt étant fournie par une variable d'environnement de test (par exemple `RECRUTEMENT_REPO`, valeur par défaut : l'URL GitHub de R16), qui pointe vers le dépôt nu local. Le contrôle d'`origin` de R16 compare à cette même valeur. 2) `deploy.sh` est lancé avec un `.env` dérivé de l'exemple, où seuls le cookie secret (`openssl rand …`) et l'identifiant client sont changés. Ajouter `sudo` à la liste des paquets de R23. Ajouter une vérification V20 : un `dockerd` démarré à la main dans `ubuntu:24.04` privilégié fait tourner `docker run hello-world`. |
| L15 | majeur | R6, R15, R19, parcours étape 4 | Depuis la v2, `.env.example` est réglé pour `localhost` (`DOMAIN=localhost`, `COMPOSE_PROFILES=caddy`, `OAUTH2_PROXY_REDIRECT_URL` vers `localhost`). R15 ne refuse que le cookie secret et l'identifiant client d'exemple. Le parcours dit seulement « le remplit ». R13 contrôle « 302 vers `https://accounts.google.com/` », pas la cohérence entre `OAUTH2_PROXY_REDIRECT_URL` et `DOMAIN`. | Un admin non expert copie l'exemple et change les deux valeurs refusées. Il oublie `DOMAIN` ou l'URL de redirection. En cas B, avec `DOMAIN=localhost`, `check-site.sh https://localhost` passe : `deploy.sh` annonce un succès alors que `recrutement.yeita.fr` n'est pas servi. Avec une URL de redirection fausse, le contrôle est vert mais Google refuse chaque connexion (`redirect_uri_mismatch`). | Dans R15 : `deploy.sh` s'arrête avant `build` si `OAUTH2_PROXY_REDIRECT_URL` n'est pas exactement `https://$DOMAIN/oauth2/callback`. Il affiche `DOMAIN` et `COMPOSE_PROFILES` au début, avec le commit en place. Dans le parcours (étape 4) et R19 : lister les valeurs à changer obligatoirement. Ajouter à CA9 : refus d'un `.env` où l'URL de redirection ne correspond pas à `DOMAIN`. |

## Traitement
Spec validée ; les retours ouverts sont intégrés dans la spec finale, ainsi que la remarque hors verdict de l'arbitre.
| # | Statut | Justification / modification |
|---|---|---|
| E13 | integre | R16, R15 : « du projet » = étiquette `com.docker.compose.project=recrutement` **et** `com.docker.compose.project.working_dir=/opt/recrutement` ; une ressource `recrutement` d'un autre dossier arrête le script ; CA8, CA9 |
| L14 | integre | R16 : URL du dépôt réglable par `RECRUTEMENT_REPO` (défaut GitHub), contrôle d'`origin` sur cette valeur ; R23 : ordre des essais, `sudo`, volume `/var/lib/docker` (V20), `.env` de test |
| L15 | integre | R15 : arrêt si `OAUTH2_PROXY_REDIRECT_URL` ≠ `https://$DOMAIN/oauth2/callback` ou si `DOMAIN=localhost` ; affichage de `DOMAIN` et `COMPOSE_PROFILES` ; parcours étape 4 et R19 : valeurs à changer ; CA9 |
| E8 | integre | CA9 : interruption pendant `build` puis relance |
| Remarque R21/CA13 | integre | R21 : `docker compose --profile caddy down` avant la variante cas A |
