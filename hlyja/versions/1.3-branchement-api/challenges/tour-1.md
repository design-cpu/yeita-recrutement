---
type: challenge
version: 1.3
tour: 1
spec: 1
score: 47
scores: Technique front=57; Intégrateur API=57; Sécurité réseau et proxy=69; Données personnelles=29; Exploitation Docker=29; Recruteur=43
bloquants: 6
recevables: 38
ecartes: 9
decision: nouveau-tour
date: 2026-10-26
---

# Challenge — tour 1 (spec v1)

> **Score global : 47/100** · Décision : nouveau tour
> Conditions : moyenne ≥ 80 ✗ · aucun challenger < 70 ✗ (tous) · aucun bloquant ✗ (6)
> Arbitre : 38 retours recevables (dont 2 à arbitrer), 9 écartés (6 doublons, 1 réalisation, 1 sans conséquence, 1 extension)
> Points clés : enregistrements qui se chevauchent dans un même onglet (A1) et pages qui gardent un ancien dossier (F4) → conflits avec soi-même ; l'hôte Linux joint l'API par son adresse sur `back` (S1, confirmé depuis : V30) ; écritures locales en mode « attente » ou « bloqué » (R1) ; retour arrière cassé par `deploy.sh` (E1) ; « Remplacer tout » efface la base commune (D1).

## Récapitulatif
Score = 100 − 25 × bloquants − 8 × majeurs − 2 × mineurs, sur les retours recevables ouverts (les retours `a-arbitrer` comptent).

| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Technique front | 1 | 2 | 1 | 4 | 57 |
| Intégrateur API | 1 | 2 | 1 | 2 | 57 |
| Sécurité réseau et proxy | 1 | 0 | 3 | 1 | 69 |
| Données personnelles | 1 | 5 | 3 | 1 | 29 |
| Exploitation Docker | 1 | 5 | 3 | 0 | 29 |
| Recruteur | 1 | 3 | 4 | 1 | 43 |
| **Global** | | | | | **47** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité | Constat | Proposition |
|---|---|---|---|---|
| A1 | Intégrateur API | bloquant | Requêtes qui se chevauchent sur un même dossier (enregistrement automatique, actions qui relisent) ; version qui recule | File par dossier ; version lue à l'envoi ; version la plus haute gardée |
| F4 | Technique front | bloquant | `ec1`, `ec2`, `decompte` écrivent le dossier entier depuis `cand` lu au chargement | Relire puis n'écrire que sa partie |
| S1 | Sécurité | bloquant | Hôte Linux → adresse de l'API sur `back` non essayé | Essai sur moteur Linux ; option du pont |
| D1 | Données | bloquant (à arbitrer) | « Remplacer tout » efface la base commune | Masquer en mode serveur |
| E1 | Exploitation | bloquant | `deploy.sh` lu avant `checkout` : retour à la 1.2 en échec | Attendre `api` seulement si le service existe après le changement de commit |
| R1 | Recruteur | bloquant | Écritures locales en mode « attente » ou « bloqué » | Adaptateur « en attente » qui refuse toute écriture |
| F5 | Technique front | majeur | `file://` et aperçus non vérifiés | Vérifier ; cas `file:` explicite |
| F6 | Technique front | majeur | Réponses d'erreur impossibles à produire avec la vraie API | `page.route` ; observation de CA1 |
| A2 | Intégrateur API | majeur | `fetch` sur `pagehide` peut être annulé | `keepalive` sous 60 000 octets |
| A3 | Intégrateur API | majeur | Motif d'identifiant non contrôlé sur `put` et `remove` | Contrôle sans requête, message nommant le dossier |
| D2 | Données | majeur | Texte qui invite à l'export ; import « Fusion » qui recrée un dossier effacé | Texte adapté ; risque écrit |
| D3 | Données | majeur (à arbitrer) | 404 d'un amont mal réglé en production → mode navigateur | Bloqué sur l'hôte de production |
| D5 | Données | majeur | Aucun CA de suppression en mode serveur | CA21 avec repère |
| D6 | Données | majeur | CA1 ne contrôle qu'une clé | Repère cherché dans tout le stockage du navigateur |
| D7 | Données | majeur | Copies locales sur la même origine | Hypothèse et consigne de mise en service |
| E2 | Exploitation | majeur | Premier déploiement par le script de la 1.2 | Consigne : vérifier `ps api` ou relancer |
| E3 | Exploitation | majeur | Nom du volume préfixé | Déclaration exacte |
| E4 | Exploitation | majeur | Sonde de santé qui accepterait un 503 | Sonde écrite en entier |
| E5 | Exploitation | majeur | Retour à la 1.2 : écriture locale | Consigne au README |
| E6 | Exploitation | majeur | Digest multi-architecture non démontré | `imagetools inspect` |
| R2 | Recruteur | majeur | Saisie refusée puis perdue sans le savoir | « Non enregistré », phrase dans le bandeau |
| R3 | Recruteur | majeur | Redessin à chaque retour sur l'onglet | Relire sans redessiner si rien n'a changé, gardes |
| R4 | Recruteur | majeur | Bandeau invisible sur une page défilée | Bandeau collant |

## Verdicts de l'arbitre
### Verdicts
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| F1 | Technique front | bloquant | ecarte (doublon) | — | Porté par A1, plus précis (couvre aussi `S.bilanRetour`, `S.undoLast`, `S2.setEtat` et la version qui recule) ; délais vérifiés (`candidat` l. 79, `ec1` l. 335, `ec2` l. 578, `decompte` l. 248) |
| F2 | Technique front | majeur | ecarte (doublon) | — | Porté par A2, plus précis (seuil de 60 000 octets, `pagehide` hors de la file) |
| F3 | Technique front | majeur | ecarte (doublon) | — | Porté par A1 (la file couvre les `get`) |
| F4 | Technique front | bloquant | recevable | bloquant | Vérifié : `ec1` (`saveCand` l. 337-344) et `decompte` (l. 249-252) écrivent le dossier entier depuis `cand` lu au chargement ; deux pages sur le même dossier se refusent l'une l'autre ; aucune règle |
| F5 | Technique front | majeur | recevable | majeur | H2 renvoie à la QA une vérification dont dépend R2 |
| F6 | Technique front | majeur | recevable | majeur | R38 ne peut produire ni 502, ni non JSON, ni 403 sans JSON, ni réseau coupé ; CA1 sans observation ; gardé plutôt que A6 (couvre CA1 et CA10) |
| F7 | Technique front | mineur | ecarte (realisation) | — | Câblage interne ; comportement déjà fixé (R12 à R14) |
| F8 | Technique front | mineur | recevable | mineur | R3 renvoie à R2 (404 → navigateur) après `DOSSIER.use` : état mixte possible |
| A1 | Intégrateur API | bloquant | recevable | bloquant | `saveNow` et `saveCand` n'attendent pas le `PUT` précédent (vérifié) ; conflit avec soi-même puis refus permanent ; gardé pour F1 et F3 |
| A2 | Intégrateur API | majeur | recevable | majeur | `pagehide` vérifiés ; rien sur un `fetch` pendant le déchargement ; gardé pour F2 |
| A3 | Intégrateur API | majeur | recevable | majeur | Point 4 de 1.2-3 traité pour `get` seulement |
| A4 | Intégrateur API | majeur `[extension]` | ecarte (doublon) | — | Porté par D1, plus précis |
| A5 | Intégrateur API | mineur | recevable | mineur | Contradiction R2 / tableau des textes (403 sans JSON, 503) |
| A6 | Intégrateur API | mineur | ecarte (doublon) | — | Porté par F6 ; sa liste précise F6 sans nouvelle décision |
| S1 | Sécurité réseau | bloquant | recevable | bloquant | V11 seulement sur Docker Desktop et vers `127.0.0.1:8000` ; R24 non démontré pour un hôte Linux |
| S2 | Sécurité réseau | mineur | recevable | mineur | CA13 ne reprend aucune forme de V6 |
| S3 | Sécurité réseau | mineur | recevable | mineur | V28 non essayé ; `SameSite=Lax` ne protège pas d'un autre sous-domaine |
| S4 | Sécurité réseau | mineur | recevable | mineur | R22 et R28 contrôlés seulement à la QA |
| S5 | Sécurité réseau | mineur | ecarte (sans-consequence) | — | R31 couvre `disable` ; V17 |
| D1 | Données personnelles | bloquant `[extension]` | a-arbitrer | bloquant | Indispensable : `importAll(…, "remplacement")` efface la base commune (`store.js` l. 283) ; gardé pour A4 |
| D2 | Données personnelles | majeur | recevable | majeur | Import « Fusion » d'un ancien export recrée un dossier effacé ; texte qui invite à l'export |
| D3 | Données personnelles | majeur | a-arbitrer | majeur | Revient sur la décision 1 avec un argument nouveau (404 d'un amont mal réglé en production) |
| D4 | Données personnelles | majeur | ecarte (doublon) | — | Porté par E5, plus précis |
| D5 | Données personnelles | majeur | recevable | majeur | Aucun CA de suppression en mode serveur (règle 4 du plan) |
| D6 | Données personnelles | majeur | recevable | majeur | CA1 ne contrôle que `yeita-dossiers` |
| D7 | Données personnelles | majeur | recevable | majeur | Rien sur le sort des copies locales sur la même origine |
| D8 | Données personnelles | mineur | recevable | mineur | Après `remove`, un `put` en attente envoie `null` et recrée le dossier |
| D9 | Données personnelles | mineur | recevable | mineur | `no-store` non vérifié au travers d'oauth2-proxy |
| D10 | Données personnelles | mineur | recevable | mineur | Durée de conservation des journaux non écrite |
| E1 | Exploitation Docker | bloquant | recevable | bloquant | `deploy.sh` lu en entier avant `checkout` (l. 20) ; R30 ferait échouer le retour à la 1.2 |
| E2 | Exploitation Docker | majeur | recevable | majeur | Premier déploiement de la 1.3 par le script de la 1.2 ; le 401 de CA15 vient d'oauth2-proxy |
| E3 | Exploitation Docker | majeur | recevable | majeur | `name: recrutement` : volume `recrutement_recrutement_data` ; commandes fausses |
| E4 | Exploitation Docker | majeur | recevable | majeur | `/api/sante` rend 503 (`app.js` l. 74) ; sonde non fixée |
| E5 | Exploitation Docker | majeur | recevable | majeur | Retour à la 1.2 : écriture locale sans le savoir ; gardé pour D4 |
| E6 | Exploitation Docker | majeur | recevable | majeur | Digest relevé sur Mac arm64 ; index multi-architecture non démontré |
| E7 | Exploitation Docker | mineur | recevable | mineur | Dossier de `npm ci` décide si `.npmrc` est lu |
| E8 | Exploitation Docker | mineur | recevable | mineur | Volume seule copie ; README emploie `down` sans mise en garde |
| E9 | Exploitation Docker | mineur | recevable | mineur | Coupure à chaque déploiement non écrite |
| R1 | Recruteur | bloquant | recevable | bloquant | En « attente » ou « bloqué », `LocalAdapter` reste actif et une création écrit dans `yeita-dossiers` |
| R2 | Recruteur | majeur | recevable | majeur | Après un 409, saisie refusée en boucle puis perdue, sans que l'indicateur ni le bandeau le disent |
| R3 | Recruteur | majeur | recevable | majeur | R15 redessine à chaque retour ; `render()` reconstruit le panneau |
| R4 | Recruteur | majeur | recevable | majeur | Bandeau invisible sur une fiche défilée |
| R5 | Recruteur | majeur `[extension]` | ecarte (extension) | — | Pas indispensable : exemples marqués `meta.demo`, retirables (`store.js` l. 364) ; H3 |
| R6 | Recruteur | mineur | recevable | mineur | Léa découvre son rôle au premier refus |
| R7 | Recruteur | mineur | recevable | mineur | « Recharger » ne résout rien en lecture seule |
| R8 | Recruteur | mineur | recevable | mineur | Régression de `QUI.ajouter` non notée |
| R9 | Recruteur | mineur | recevable | mineur | Aucun délai maximal pour `/api/moi` |

### Dérives et conflits
- **D3 `a-arbitrer`** : revient sur la décision 1 avec un argument nouveau ; F5 touche la même décision côté aperçus ; à traiter ensemble.
- **D1 `a-arbitrer`** : `[extension]` jugée indispensable, remonte à l'utilisateur.
- Lien sans conflit : A1, A2, F4, R3 portent sur le cycle lecture/écriture des pages, à concevoir d'un seul tenant ; E1, E2, E5 sur `deploy.sh` et le retour arrière.
- Aucune dérive (tour 1).

## Technique front — 57/100
### Analyse
| Critère | Analyse |
|---|---|
| Attente du démarrage sur chaque page | Solide sur le principe (R1, R4c, R4b, R4d, R13). Manque : l'interface par laquelle `qui.js` et `store.js` (chargés avant `demarrage.js`) apprennent le mode ; l'enregistrement automatique (300 à 400 ms) n'a jamais été pensé avec un `put` asynchrone (F1, F2, F3). |
| Fidélité à la logique métier | `store.js` intact (R14) ; `DOSSIER.save` rend le même objet, la table faible de R6 tient. Mais `ec1`, `ec2` et `decompte` gardent `cand` lu au chargement alors que les pages s'ouvrent ensemble : la fiche EC1 ne pourra plus être enregistrée dès que la feuille de décompte enregistre (F4). |
| Mode navigateur intact | Solide sur 404 (V22, R4, R16, R37) ; écoutes `storage` gardées. `file://` et aperçu en cadre non vérifiés (F5). |
| Testabilité | CA précis, mais R38 (vraie API) ne produit ni 502, ni non JSON, ni 404 sans `code`, ni réseau coupé ; CA1 sans méthode d'observation (F6). |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| F1 | bloquant | R6, R6d, R7 | Les pages enregistrent après une pause (`candidat` 400 ms, `ec1`/`ec2` 350 ms, `decompte` 300 ms) ; `saveNow` n'attend pas le `put` précédent ; avec R6, un second `PUT` parti pendant le premier envoie la version d'avant | Un recruteur seul se met en conflit avec lui-même (409), puis tous les enregistrements sont bloqués (R7) | R6f : `put`, `get`, `remove` sur un même identifiant passent en file ; `put` prend la version gardée au départ ; CA : `PUT` retardé de 1 s, trois saisies à 500 ms : aucun 409, la base garde la dernière valeur |
| F2 | majeur | R6d, Déploiement | Les enregistrements sur `pagehide` (`candidat` l. 416, `ec1`, `ec2` l. 878, `decompte` l. 442) étaient synchrones ; un `fetch` sur `pagehide` peut être annulé | Saisie perdue en silence en fermant l'onglet juste après | `PUT` avec `keepalive: true`, et ce qui se passe au-delà de 64 Ko (taille réelle d'un dossier à mesurer) ; CA : saisie puis navigation immédiate, valeur en base |
| F3 | majeur | R15b | La garde `!saveT` de `candidat.html` ne couvre pas un `PUT` en cours ; un `GET` au retour peut rendre l'état d'avant | L'écran revient en arrière ; 409 sur sa propre écriture | Réglé par la file de F1 si elle couvre les `get` ; sinon « ni enregistrement en attente, ni en cours » |
| F4 | bloquant | R15b, P2, CA5 | `ec1`, `ec2`, `decompte` gardent `cand` lu au chargement ; `renderFrom1` relit sans remplacer `cand` ; `decompte` écrit `fiches.decompte` sur le même dossier que la fiche EC1 ouverte à côté | En mode serveur, la fiche EC1 reçoit un 409 à chaque enregistrement dès que la feuille de décompte enregistre ; idem EC2 dès qu'on change l'état | Pour ces trois pages, `saveCand` relit le dossier puis n'écrit que sa partie (`fiches.ec1`/`ec1`, `fiches.ec2`/`ec2`, `fiches.decompte`), comme les actions de `store.js` ; au minimum `auRetour` remplace `cand` ; CA : EC1 et décompte du même dossier dans deux onglets, chaque enregistrement passe |
| F5 | majeur | H2, R16 | `file://` et aperçu en cadre renvoyés à la QA ; si l'hôte de l'aperçu rend autre chose que 404, la page est bloquée | Aperçus réduits à un bandeau réseau | Vérification maintenant ; si pas 404, question à l'utilisateur ; R2 : cas `file:` explicite |
| F6 | majeur | R38, CA1, CA2, CA10 | La vraie API ne rend ni 502, ni non JSON, ni 403 sans JSON, ni réseau coupé ; CA1 sans observation ; CA10 sans lieu de test | Cas tranchés par l'utilisateur testés à la main ou pas | R38 : erreurs simulées par `page.route` ; CA1 : `/api/moi` retardé de 2 s, aucune requête `/api/candidats` ni écriture locale avant ; CA10 : aucune requête pour un identifiant hors format |
| F7 | mineur | R12, R13, R14 | Seul `QUI.compte(...)` est nommé ; rien ne dit comment `monter` apprend le mode navigateur ni comment `STORE` reçoit la liste et l'envoi des options | Câblage disparate ou dépendance circulaire | Nommer `QUI.compte`, `QUI.local()`, `STORE.sourceDispos(liste, envoyer)` ; en mode bloqué rien n'est appelé |
| F8 | mineur | R3 | « L'échec de l'un d'eux suit R2 » : un 404 sur `/api/equipe` donnerait le mode navigateur après `DOSSIER.use` | État mixte | Tout statut autre que 200 ou 401 → bloqué, message réseau ; `DOSSIER.use` après les deux réponses |

## Intégrateur API — 57/100
### Analyse
| Critère | Analyse |
|---|---|
| Correspondance méthode → route et codes | Solide : le tableau « API et intégrations » suit `api/README.md` (vérifié dans `app.js`, `candidats.js`, `options.js`). Manque : l'ordre de priorité entre « non JSON → réseau » (R8b), « 403 sans JSON → hors équipe » et « 5xx → réseau » face à « 503 → texte de l'API » ; le 204 sans `Content-Type` ; le contrôle du format d'identifiant seulement pour `get`. |
| Versions gardées et conflits | La version par objet avec repli par identifiant (R6) règle `renderFrom1` (`ec2.html` l. 718 vérifié). Rien sur les enregistrements qui se chevauchent dans le même onglet, ni sur la version « dernière lue » qui peut reculer, ni sur `pagehide`. |
| Réponses d'oauth2-proxy | Bien couvert au démarrage (R2, R8, R8b, garde). Ces réponses ne peuvent pas être produites par le banc de R38 ; la spec ne dit pas comment CA2 et CA10 les obtiennent. |
| Cas de la fiche 1.2-3 | Points 1 à 3 traités (R8b, R6c, R6b). Point 4 (identifiant hors format d'un dossier importé) traité pour `get` seulement ; `STORE.importAll` et `DOSSIER.importCode` écrivent par `put`. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| A1 | bloquant | R6, R7 | Deux requêtes peuvent partir sur le même dossier avant la réponse de la première : enregistrement automatique (`candidat` l. 79, `ec1` l. 335, `ec2` l. 578, `decompte` l. 248) ; actions qui relisent puis écrivent sans attendre le PUT en cours (`S.bilanRetour`, `S.undoLast`, `S2.setEtat`) ; la version par identifiant peut reculer si un GET lancé avant la fin d'un PUT répond après | Conflit avec soi-même sur une connexion lente, puis tout refusé (R7) ; invisible en local | R6f — File par dossier : `get`, `put`, `remove` d'un même identifiant l'un après l'autre ; `put` lit la version à l'envoi ; la version par identifiant ne garde que la plus haute ; CA : PUT retardé de 1 s par `page.route`, saisie continue dans `candidat.html` puis `ec1.html`, aucun 409, dernier texte en base |
| A2 | majeur | R6d, Mode navigateur | Enregistrements sur `pagehide` (`candidat` l. 416, `ec1` l. 816, `ec2` l. 879, `decompte` l. 443) : un `fetch` pendant le déchargement peut être annulé | Fin de saisie perdue sans message | `keepalive: true` sous 60 000 octets (limite de 64 Kio), `fetch` normal au-delà, limite écrite ; l'enregistrement de `pagehide` ne passe pas par la file ; CA : saisie puis navigation sous 200 ms, texte en base ; vérification QA sur le navigateur du banc |
| A3 | majeur | R6c à R6e ; 1.2-3 point 4 | Motif d'identifiant contrôlé pour `get` seulement ; `STORE.importAll` (`store.js` l. 291) et `DOSSIER.importCode` écrivent par `put` ; l'API répond 400 « Identifiant invalide. » sans nommer le dossier ; `importAll` s'arrête au premier refus ; un identifiant avec `/`, `?`, `..` fabrique une autre adresse | Erreur incompréhensible, import à moitié fait | Même contrôle avant `put` et `remove`, rejet sans requête : « Identifiant invalide pour « <candidat.nom> » : ce dossier ne peut pas être enregistré dans la base. », `code: "identifiant"` ; `encodeURIComponent` ; écrire ce que fait `importAll` dans ce cas ; CA10 étendu |
| A4 | majeur `[extension]` | Mode serveur ; Sécurité | Import en « remplacement » (`store.js` l. 284) : un `DELETE` par dossier absent du fichier, sur les dossiers partagés, sans contrôle de version | Effacement silencieux des candidatures des collègues, sans sauvegarde | En mode serveur, « remplacement » non proposé ou refusé avec un message ; sinon, risque inscrit dans les hypothèses ; l'utilisateur tranche |
| A5 | mineur | Contenu ; R2, R7, R8b | 403 sans JSON : « réseau » (R8b) ou « hors équipe » (tableau) ; 503 JSON : « réseau » (R2) ou texte de l'API ; R7 met `code: "reseau"` sur 400, 413, 415, 503 ; 204 sans `Content-Type` tombe sous R8b | Message selon la personne qui réalise ; QA impossible à juger | Un seul tableau ordonné : (1) 401 → R8 ; (2) 204 → succès ; (3) non JSON, tout statut → réseau ; (4) JSON avec `code` → message du code ; (5) JSON sans `code` → texte `erreur`, `code: "api"` ; `/api/moi` 200 sans `prenom` → réseau ; un seul endroit pour le 403 sans JSON |
| A6 | mineur | R38 ; CA2, CA10 | Réponses d'oauth2-proxy et 404 sans `code` impossibles avec l'API en `DEV_STATIC` | Cas des décisions de l'utilisateur essayés à la main ou pas | R38 : `page.route` pour `/api/moi` en 401 `{}` deux fois sous 60 s, 403 JSON, 502 HTML, 200 `text/html` ; `GET /api/candidats/<id>` en 404 « Route inconnue. » ; PUT ralenti ; préciser ce qui reste au banc Docker |

## Sécurité réseau et proxy — 69/100
### Analyse
| Critère | Analyse |
|---|---|
| Joignabilité de l'API | Réseau bien conçu (R22, V11 avec témoins). Mais R24 affirme « ni depuis l'hôte » alors que V11 n'a essayé que `127.0.0.1:8000`, sur Docker Desktop (macOS) ; l'hôte Linux vers l'adresse du conteneur sur `back` n'est pas essayé (S1). |
| En-têtes et routes d'oauth2-proxy | R23 vérifié (V5) ; V7, V12 solides. V6 sans forme absolue ; CA13 ne reprend aucune forme (S2). L'argument CSRF (V28) n'est pas essayé et inexact pour `*.yeita.fr` (S3). |
| Mode local impossible en production | Solide : double verrou (V15, R25, R28), `environment` absent (V18). Contrôle des valeurs résolues seulement à la QA ; `deploy.sh` ne le refait pas (S4). |
| Rôles et accès | Correct (V8, R10). Retrait d'un membre en production non décrit (S5). |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S1 | bloquant | R24, CA13, Exploitation, Sécurité | V11 fait sur Docker Desktop (macOS) et seulement vers `127.0.0.1:8000` ; sur Linux, le pont d'un réseau `internal: true` a normalement une adresse de passerelle : l'hôte (et les conteneurs en `network_mode: host`) peut joindre `http://<IP de api sur back>:8000` | Tout processus de l'hôte partagé peut se faire passer pour n'importe quel membre | Vérification sur un moteur Linux (conteneur Debian avec dockerd) : depuis l'hôte, `curl http://<IP api sur back>:8000/api/moi -H 'X-Forwarded-Email: alice@yeita.fr'`, avec témoin ; si ça passe, option du pont (`com.docker.network.bridge.gateway_mode_ipv4: isolated` ou `inhibit_ipv4`) à vérifier ; rejouer front→api et hôte→IP ; version minimale du moteur au README ; R24, CA13 ; remplacer le contrôle `curl 127.0.0.1:8000` |
| S2 | mineur | CA13, R23 | V6 sans forme absolue ni formes partant d'une route publique (`/index.html/../api/moi`, `/telechargements/..%2Fapi%2Fmoi`, `/api%2Fmoi`) ; CA13 ne reprend aucune forme | Route atteignant l'API sans être reconnue non détectée (risque faible : l'API rend 401) | CA13 sans session : formes de V6 + forme absolue + les trois ci-dessus ; aucun corps de l'API, aucune requête au journal (témoin avec session) |
| S3 | mineur | Sécurité « Requêtes inter-sites », R10 | Argument non essayé (V28) ; `SameSite=Lax` n'empêche pas un autre sous-domaine de `yeita.fr` ; la vraie protection : 415 sans `application/json` et prévol CORS sans cookie refusé par oauth2-proxy | Protection mal documentée, non testée | Réécrire la ligne ; essai : formulaire `POST` `text/plain` → 415 sans écriture ; `fetch` `PUT`/`DELETE` avec `credentials: "include"` bloqué au prévol |
| S4 | mineur | R30, R28, R22 | R22 et R28 vérifiés seulement à la QA ; un `COMPOSE_FILE` ou un override sur le serveur passerait | Port publié par erreur au déploiement | `deploy.sh`, avant `up`, sur `docker compose config --format json` : arrêt si `services.api.ports` non vide, réseaux ≠ `{back}`, `back` non interne, ou `environment` avec `DEV_EMAIL`, `DEV_STATIC`, `NODE_ENV`, `HOST` ; essayé dans le banc |
| S5 | mineur | R31 | Retirer l'accès d'une personne n'est pas décrit ; la session oauth2-proxy survit | Accès laissé ouvert | R31 : `equipe.js disable <email>`, effet à la requête suivante ; la session ne donne plus que les pages, sans données |

## Données personnelles — 29/100
### Analyse
| Critère | Analyse |
|---|---|
| Ce qui reste dans le navigateur | Solide pour l'écriture courante (§ Sécurité, R4d, R12, R14). Manque : CA1 ne vérifie que `yeita-dossiers` ; les données locales déjà présentes sur l'origine restent sans délai ni moyen de les effacer. `Cache-Control: no-store` trouvé dans `api/src/app.js` l. 55, non vérifié dans `verifications.md`. |
| Ce qui est journalisé | Solide (« jamais le corps », R10). Manque : aucun CA ne reprend la règle 4 du plan ; durée de conservation des journaux d'oauth2-proxy non dite. |
| Repli silencieux | Solide au démarrage (R2, R4b, R11, R14). Trous : un 404 en production (amont `api` absent ou mal réglé) fait passer en mode navigateur sans rien dire ; le retour arrière vers la 1.2 remet l'équipe en écriture locale. |
| Effacement | `remove` → `DELETE` (R6e), effacement réel acquis en 1.2. Rien pour les nouveaux chemins : « Remplacer tout » vide la base partagée, l'export copie toute la base sur les postes, un import « Fusion » recrée des dossiers effacés ; aucun CA de suppression en mode serveur. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D1 | bloquant `[extension]` | Périmètre | `index.html` l. 84 propose « Remplacer tout » ; `STORE.importAll(text, "remplacement")` (`store.js` l. 283) appelle `D.remove` sur chaque dossier absent du fichier : en mode serveur, `DELETE` sur la base commune | Un ancien export local importé en « Remplacer tout » efface les dossiers de toute l'équipe, sans retour possible | En mode serveur, « Remplacer tout » n'est pas proposé (import en « Fusion » seulement) ; CA : aucun `input[value=remplacement]` ; à faire trancher par l'utilisateur ; au minimum, écrire le risque au README et au guide |
| D2 | majeur | Contenu, Sécurité | `tableau.sauvegarde.jamais` dit « Exporte la base de temps en temps : c'est ta sauvegarde. » ; un import « Fusion » d'un ancien export recrée par `put` (version `null`) un dossier effacé | Copies complètes sur les postes ; effacement annulé sans bruit | En mode serveur, texte qui n'invite pas à l'export ; § Sécurité : un export est une copie hors de l'effacement, un import « Fusion » peut recréer un dossier supprimé ; `MODELE.md` |
| D3 | majeur | R2, § Déploiement | Avec une session, une adresse sans amont d'API rend un 404 d'oauth2-proxy (V7 `/API/moi`) ; un `upstreams` sans l'API donnerait 404 sur `/api/moi` en production ; `check-site.sh` ne le voit pas | Toutes les pages en mode navigateur sans rien dire, en production | R2 : 404 → navigateur, sauf si la page est servie depuis l'hôte de `YEITA.SITE` : alors bloqué, message réseau ; CA2 correspondant |
| D4 | majeur | § Retour arrière | Pendant un retour à la 1.2, l'équipe écrit dans les navigateurs sans le savoir | Saisies disparues au redéploiement, copies impossibles à effacer | Revenir de préférence à un commit de la 1.3 ; un retour à la 1.2 : prévenir l'équipe de ne rien saisir (spec et README) |
| D5 | majeur | Critères d'acceptation | Aucun CA de suppression en mode serveur ; règle 4 du plan et étonnement 1.2 n° 1 non repris | Effacement de bout en bout vérifié en partie | CA21 : repère dans `identite.personne` et une note EC1 ; Alice supprime ; Bob revient : disparu ; un enregistrement depuis la page de Bob → 409, aucune recréation ; repère absent de `/data` (sans `VACUUM`), des localStorage/sessionStorage, et de `docker compose logs api front` |
| D6 | majeur | CA1, vérifications | CA1 ne contrôle que `yeita-dossiers` ; d'autres clés portent des données de candidat (`yeita-match-resultat` l. 401, `yeita-notice` l. 793) ; brouillons `yeita-fiche-ec1/ec2` supposés écrits seulement sans candidat, non vérifié | Copie locale oubliée non vue | CA1 : après un parcours complet en mode serveur, un repère n'apparaît dans aucune clé du localStorage ; sessionStorage : seulement `yeita-notice`, supprimée à la lecture ; `yeita-match-resultat` effacée après reprise ; exceptions listées au § Sécurité |
| D7 | majeur | § Données existantes, Hypothèses | Les dossiers locaux restent sur la même origine `recrutement.yeita.fr` sans limite ; leur caractère fictif n'est pas vérifié | Copies de vraies candidatures hors de toute demande d'effacement | H4 à confirmer : aucune vraie candidature dans les navigateurs ; consigne de mise en service : effacer les données du site dans le navigateur après avoir ressaisi ce qu'on garde |
| D8 | mineur | R6, R6e | « version oubliée » : si la table objet → version est vidée, un `put` du même objet après `remove` envoie `null` → 201 | Dossier effacé recréé par un enregistrement en attente | R6e : après `remove(id)`, `id` retenu comme supprimé pour la vie de la page ; un `put` est rejeté (message de conflit) sans requête |
| D9 | mineur | § Sécurité | `Cache-Control: no-store` non vérifié au travers d'oauth2-proxy | Dossiers dans le cache HTTP si l'en-tête était perdu | R39 : `curl -I` avec session sur `/api/candidats` → `no-store` |
| D10 | mineur | § Sécurité, § Exploitation | Durée de conservation des journaux non dite ; oauth2-proxy écrit l'email et `/api/candidats/<id>` ; rotation 10 Mo × 3 | Trace « qui a consulté quoi » sans durée connue | § Sécurité et README : rotation `json-file` 10 Mo × 3 ; l'identifiant opaque reste jusqu'à la rotation, jamais le nom ni le contenu |

## Exploitation Docker — 29/100
### Analyse
| Critère | Analyse |
|---|---|
| Image et Dockerfile | Solide : base figée par digest (R25, V13), `USER node`, `NODE_ENV=production`, étiquette (V26), binaires `better-sqlite3` `linux-x64` (`prebuilds/`). Manque : V13 ne dit pas si le digest est celui de l'index multi-architecture ou du manifeste arm64 du banc (Mac) ; R25 ne fixe pas l'emplacement de `npm ci` ni de `.npmrc`. |
| Volume et droits | Solide : `/data` en 700, base en 600 (R26, V14), échec en lecture seule puis relance (R29, V16). Manque : le nom réel du volume (clé `recrutement_data` sous le projet `recrutement` → `recrutement_recrutement_data`, alors que la spec écrit `docker volume inspect recrutement_data`) ; rien sur `down -v`. |
| Healthcheck et redémarrage | Solide : `node -e fetch` sans curl (V20), `restart: unless-stopped`, `front` sans dépendance à `api`. Manque : R27 ne dit pas ce qui fait échouer la sonde, alors que `/api/sante` peut rendre 503 et que `fetch` se résout sur un 503. |
| Gestion de l'équipe et contrôles | Solide : `equipe.js` par `exec` (V17, R31), 6e contrôle (R33). Manque : R30 ignore que `deploy.sh` est lu en entier avant `git pull`/`checkout` (l. 22) : c'est le script du commit en place qui tourne. |
| Retour arrière | Insuffisant : le `deploy.sh` de la 1.3 attendra une `api` saine sur une pile qui n'en a plus ; rien sur le travail saisi pendant le retour. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| E1 | bloquant | R30, § Retour arrière | `deploy.sh` est lu en entier avant le `checkout` (l. 22, 95) : lors d'un retour à la 1.2, le script de la 1.3 tourne ; `up --remove-orphans` (l. 109) retire `api`, puis R30 attend en vain 60 s | Le retour d'urgence finit en « ÉCHEC » sans `check-site.sh`, et conseille de redéployer la 1.3 | R30 : attente de la santé d'`api` seulement si `docker compose config --services`, lu **après** le changement de commit, contient `api` ; CA16 : retour 1.3 → 1.2 dans le banc, « Déploiement réussi », `api` retirée, volume présent |
| E2 | majeur | R30, P5, § Mise en service | Le premier déploiement de la 1.3 lance le `deploy.sh` de la 1.2, qui n'attend que `/ping` (l. 115-119) | Une `api` qui boucle donne « Déploiement réussi » (le 401 de `/api/moi` vient d'oauth2-proxy, V5) | « Mise en service » et `deploy/README.md` : au premier déploiement de la 1.3, vérifier `docker compose ps api` (`healthy`) ou relancer `deploy.sh` ; banc CA16 depuis un dépôt sur la 1.2 |
| E3 | majeur | R22, R31, § Exploitation, CA12 | Compose préfixe le nom du projet : clé `recrutement_data` → volume `recrutement_recrutement_data` ; le banc tournait sous `banc13` | `docker volume inspect recrutement_data` échoue ; ajouter `name:` après coup crée un volume neuf et vide | R22 : déclaration exacte (clé `data` ou `name: recrutement_data`) ; CA12 : nom résolu `recrutement_data` ; aligner R31 et § Exploitation |
| E4 | majeur | R27 | Sonde « `fetch(…)…` » : `/api/sante` rend 503 quand la base ne va pas, et `fetch` se résout sur un 503 | Une API en 503 reste `healthy` ; `deploy.sh` annonce une réussite | Sonde écrite en entier : `fetch(…, {signal: AbortSignal.timeout(4000)}).then(r => process.exit(r.status === 200 ? 0 : 1), () => process.exit(1))` ; CA14 : 503 → `unhealthy` |
| E5 | majeur | § Retour arrière, R31 | Après un retour à la 1.2, les pages écrivent dans le localStorage ; sans migration, ce travail n'arrivera jamais dans la base | Travail perdu sans le savoir | « Retour arrière » et `deploy/README.md` § 10 : prévenir l'équipe de ne pas saisir, ou revenir à un commit de la 1.3 |
| E6 | majeur | R25, V13 | Digest relevé sur Docker Desktop (Mac arm64) ; rien ne confirme que `sha256:de170b…` est l'index multi-architecture avec `linux/amd64` | Image arm64 sur le serveur OVH amd64 : `exec format error` | Vérification `docker buildx imagetools inspect node:22.23.4-slim@sha256:de170b…` (doit lister `linux/amd64`) ; R25 : digest de l'index |
| E7 | mineur | R25 | Dossier où tourne `npm ci` non dit ; `.npmrc` n'est lu que dans le dossier du `package.json` | Scripts d'installation lancés contre la règle de la 1.2 | `COPY api/package.json api/package-lock.json api/.npmrc /app/api/`, `RUN cd /app/api && npm ci --omit=dev`, `COPY api/ /app/api/` ; CA14 : aucun script d'installation lancé |
| E8 | mineur | R31, § Exploitation | Le volume est la seule copie des dossiers ; `deploy/README.md` emploie `docker compose down` (l. 255, 259) sans mise en garde contre `-v` ; volume orphelin exposé à `docker volume prune -a` | Une commande courante efface toutes les candidatures | README : ne jamais lancer `down -v` ni `volume prune -a` ; étiquette `fr.yeita.projet=recrutement` sur le volume |
| E9 | mineur | Déploiement, § Exploitation | `up -d --force-recreate` recrée `api` à chaque déploiement : ~15 s de 502 | Un déploiement pendant un entretien coupe les enregistrements | Déploiement et README § 9 : « chaque déploiement coupe l'API environ 15 s ; déployer hors des entretiens » |

## Recruteur — 43/100
### Analyse
| Critère | Analyse |
|---|---|
| Compréhension de l'identité | Solide : « Connecté·e : Alice » à la place de la liste (R13, CA7), `S.me()` jamais vide en mode serveur (R13b). Manque : le lecteur ne voit nulle part qu'il est en lecture seule avant d'essayer d'écrire ; R13 ne dit pas ce qu'affiche `#qui` en « attente » ou « bloqué », alors que `needMe()` (`index.html` l. 137) peut encore demander « Choisis ton prénom en haut de la page ». |
| Messages d'erreur et de conflit | Solide : textes exacts et sourcés, bandeau `role="alert"` sans déplacement du focus (R11). Manque : bandeau « en tête du `<body>` », invisible sur une fiche EC1/EC2 défilée ; « Recharger » proposé même en lecture seule ; rien ne dit que ce qui est tapé après le refus n'est pas enregistré (R7). |
| Retour sur l'onglet | Solide : fonction d'écoute actuelle gardée, garde « rien en attente » sur `candidat.html` (R15b). Manque : relecture et rendu à chaque `visibilitychange` même sans changement (`render()` de `candidat.html` reconstruit le panneau : focus et saisie non enregistrée perdus) ; « sans perdre le défilement » non vérifié. |
| Continuité du travail en cours | Point faible : après un conflit, la saisie est refusée en boucle puis effacée par « Recharger » ou par la relecture ; en « bloqué » ou « attente », les boutons écrivent dans le localStorage (repli silencieux écarté) ; avec H3, « Charger des exemples » remplit la base partagée. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| R1 | bloquant | R4b, R4c, R13 | En « attente » ou « bloqué », `DOSSIER` reste sur `LocalAdapter` et seule la première lecture attend ; les écouteurs restent actifs : « Nouvelle candidature » puis l'envoi appellent `S.createCandidate`, qui écrit dans `yeita-dossiers` | Candidature créée pendant une panne (502) partie en silence dans le navigateur ; contraire à la décision 1 et à CA1 | R4e : tant que le mode n'est pas « serveur » ou « navigateur », toute écriture de `DOSSIER` (et `STORE.addDispo`) est rejetée avec le message du bandeau (adaptateur « en attente » posé par `demarrage.js` dès son chargement) ; R13 : en « attente » et « bloqué », `QUI.moi()` rend `""` et `#qui` reste vide ; CA2 : en mode bloqué, « Nouvelle candidature » puis l'envoi n'écrivent rien dans `yeita-dossiers` |
| R2 | majeur | R7, R11, P2 | Après un 409, la saisie refusée reste dans l'objet ; chaque frappe relance un enregistrement refusé ; l'indicateur « Enregistré à HH:MM » garde l'heure du dernier succès ; « Recharger » efface ce qui a été tapé depuis | Notes d'entretien perdues sans que le recruteur l'ait compris | R11 : sur un rejet `conflit`, `lecture-seule` ou `reseau`, les pages qui ont un indicateur affichent « Non enregistré » ; le bandeau ajoute « Ce que tu as saisi depuis n'est pas enregistré : copie-le avant de recharger. » ; CA : conflit sur `ec2.html`, l'indicateur dit « Non enregistré » et le texte reste jusqu'au clic sur « Recharger » |
| R3 | majeur | R15, R15b, UX | Relecture et `render()` à chaque retour, même sans changement : `candidat.html` perd focus, commentaire de décision `dec-com`, formulaire de refus ouvert ; après un 409, le retour remplace la saisie refusée et le bandeau reste ; « sans perdre le défilement » non vérifié | Saisie effacée ou curseur perdu plusieurs fois par entretien | R15b : redessiner seulement si la version lue diffère de la version gardée ; sur `candidat.html`, ne pas relire si le formulaire de refus ou de décision est ouvert ou si un champ du panneau a le focus ; après un refus d'enregistrement, ne pas relire ; si la relecture réussit, retirer le bandeau ; retirer « sans perdre le défilement » ou le tester |
| R4 | majeur | R11, UX | Bandeau « en tête du `<body>` », sans position fixe, sur des fiches longues | Conflit inaperçu là où il arrive le plus | R11 : bandeau visible quel que soit le défilement (collant en haut de la fenêtre) ; CA4 sur `ec2.html` défilée |
| R5 | majeur `[extension]` | H3 | En mode serveur, « Charger des exemples » reste proposé sur le tableau vide ; les candidats fictifs arrivent dans la base partagée | Candidats fictifs mêlés aux vrais dossiers | Masquer les deux boutons d'exemples en mode serveur ; à faire trancher par l'utilisateur |
| R6 | mineur | P3, R13 | Léa voit tous les champs modifiables et découvre son rôle au premier refus | Bandeaux répétés, confusion | « Connecté·e : Léa · lecture seule » quand `role` vaut `lecture` |
| R7 | mineur | R11 | « Recharger » aussi pour `lecture-seule` | Rechargements inutiles | Pas de bouton pour `lecture-seule` |
| R8 | mineur | R12 | `QUI.ajouter` ne garde le nom que dans l'onglet ; avant, `yeita-equipe-ajouts` le gardait | Petite régression de saisie | Proposer aussi les noms des champs Recruteurs des dossiers lus, ou noter la régression dans `MODELE.md` |
| R9 | mineur | R2, UX « Attente » | Aucun délai maximal pour `/api/moi` | Page vide sans explication | Au-delà de 10 s, mode bloqué avec le message réseau, ou citer et vérifier l'expiration d'oauth2-proxy |

## Arbitrages de l'utilisateur
| Retour | Question | Décision |
|---|---|---|
| D1 | « Remplacer tout » en mode serveur | **Masqué en mode serveur** : seul « Fusion » est proposé ; `store.js` inchangé |
| D3 | 404 sur `/api/moi` en production | **Mode bloqué sur l'hôte de `YEITA.SITE`** (message réseau) ; ailleurs, 404 → mode navigateur |
| F5 | Pages ouvertes en `file://` ou dans l'artefact Claude | **`file:` → mode navigateur** sans appeler l'API ; artefact : comportement observé noté au guide de test |
