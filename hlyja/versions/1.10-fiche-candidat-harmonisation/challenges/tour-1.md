---
type: challenge
version: 1.10
tour: 1
spec: 1
score: 69
scores: Lead dev=86; Sécurité et données personnelles=82; Ops et déploiement=70; Testabilité et concurrence=33; Utilisateur recruteur=72
bloquants: 1
recevables: 27
ecartes: 9
decision: nouveau-tour
date: 2026-10-28
---

# Challenge — tour 1 (spec v1)

> **Score global : 69/100** · Décision : nouveau tour
> Conditions : moyenne ≥ 80 ✗ · aucun challenger < 70 ✗ (Testabilité et concurrence 33) · aucun bloquant ✗ (C1)
> Arbitre : 27 retours recevables, 9 écartés (4 doublons, 2 réalisation, 2 extensions, 1 hors périmètre) ; 1 conflit (C4 × U4) et 1 tension (S2) tranchés par l'utilisateur.
> Points clés : l'objet de la page est modifié avant l'enregistrement (C1, bloquant) ; un lien collé `javascript:` devient cliquable (S1) ; la restauration casse sur les copies d'avant la 1.10 (O2).

## Récapitulatif
Score = 100 − 25 × bloquants − 8 × majeurs − 2 × mineurs, sur les retours recevables ouverts.

| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Lead dev | 0 | 1 | 3 | 5 | 86 |
| Sécurité et données personnelles | 0 | 2 | 1 | 0 | 82 |
| Ops et déploiement | 0 | 3 | 3 | 3 | 70 |
| Testabilité et concurrence | 1 | 4 | 4 | 0 | 33 |
| Utilisateur recruteur | 0 | 3 | 2 | 1 | 72 |
| **Global** | | | | | **69** |

## Arbitrages de l'utilisateur (2026-10-28)
| Point | Décision |
|---|---|
| S2 (tension avec R6) | Nettoyage automatique : à chaque enregistrement du dossier, l'API efface les fichiers du candidat qu'il ne référence plus, déposés il y a plus d'une heure |
| Conflit C4 × U4 | Pendant un envoi, la fenêtre ne se ferme pas ; une fois le candidat créé, fermer = « Enregistrer et revenir à la liste » (fichiers en attente envoyés, échec en bandeau sur la page) |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité | Constat | Proposition |
|---|---|---|---|---|
| C1 | Concurrence | bloquant | Objet de la page modifié avant le PUT ; un enregistrement différé ultérieur annule R4/R5 | Changements sur une copie, objet de la page remplacé après succès seulement |
| T2 | Lead dev | majeur | Refus et issue inconnue confondus dans R4 | Refus → retrait ; issue inconnue → rien retiré |
| S1 | Sécurité | majeur | Lien collé rendu en `href` sans contrôle de schéma | Cliquable seulement en `http(s)://` ; CA e2e `javascript:` |
| S2 | Sécurité | majeur | P7 non corrigé | Arbitrage : nettoyage automatique |
| O1 | Ops | majeur | Pages 1.9 et lignes `type: "fichier"` | Décrire la dégradation, CA avec le front de `main`, guide de retour |
| O2 | Ops | majeur | R15 casse sur copie 1.9 | `fichiers=absente` |
| O3 | Ops | majeur | Étape nginx non exécutable | Guide `METTRE-A-JOUR.md` § 5, preuve `curl`, `bash -n` |
| C3 | Concurrence | majeur | R6 incomplète | Liste des cas, invariant, « au mieux » |
| C4 / U4 | Concurrence, Utilisateur | majeur | Fermeture pendant ou après l'envoi | Arbitrage de l'utilisateur |
| C5 | Concurrence | majeur | Autre bouton du pied actif | Deux actions désactivées + garde en mémoire |
| C6 | Concurrence | majeur | Relance après création non définie | Objet = dossier créé, PUT des champs, fichiers restants |
| U1 | Utilisateur | majeur | Pas de « remplacer » dans l'interface | Remplacer = Retirer puis Déposer |
| U2 | Utilisateur | majeur | Échec répété bloque le pied | « Retirer » sort le fichier de l'attente |

## Arbitre

Contrôles dans le code : `menu-candidat.js` l. 34 (`href` du lien, absent de `main`), l. 193 (seul le bouton cliqué désactivé), l. 136-140 (`fermer()` : `attente` vidé en création, `apres` sans attendre le dépôt), l. 148 (`plusTard` différé), l. 324 (glisser sur champ vide seulement) ; `RESTAURER.md` l. 42 et 95 ; `base.js` l. 8 (`VERSION_SCHEMA = 2`) ; `auto-deploy.sh` ne sauvegarde pas avant de déployer ; Caddy = cas B seul ; 1.10-2 = purge à 22 mois.

### Verdicts
| # | Challenger | Sévérité proposée | Verdict | Sévérité retenue | Motif / justification |
|---|---|---|---|---|---|
| T1 | Lead dev | majeur | ecarte | — | `doublon` de C1 (plus précis) |
| T2 | Lead dev | majeur | recevable | majeur | R4 traite tout échec comme un refus ; PUT appliqué et réponse perdue → fichier retiré mais référencé |
| T3 | Lead dev | majeur | ecarte | — | `doublon` de O2 (plus précis) |
| T4 | Lead dev | majeur | ecarte | — | `realisation` (méthode de CA2, CA8) ; « fermer pendant l'envoi » couvert par C4 |
| T5 | Lead dev | mineur | recevable | mineur | Critère manquant pour « sûr si deux processus » et doc du précédent ; sort de `MIGRATIONS` = réalisation |
| T6 | Lead dev | mineur | ecarte | — | `doublon` de O1 |
| T7 | Lead dev | mineur | recevable | mineur | R7 vise tout 413 non JSON, `lire` sert aussi aux PUT |
| T8 | Lead dev | mineur | recevable | mineur | CA17 intenable (V3, 1.10-3) |
| T9 | Lead dev | mineur | ecarte | — | `realisation` |
| S1 | Sécurité | majeur | recevable | majeur | Défaut introduit par la branche (`href` sans schéma), « cassé » donc à corriger |
| S2 | Sécurité | majeur | recevable | majeur | Spec dit corriger P1-P8 mais R6 renonce à P7 ; plan : « pas d'orphelin durable » |
| S3 | Sécurité | mineur | recevable | mineur | Restauration remet un CV retiré seul ; R15 muet |
| O1 | Ops | majeur | recevable | majeur | « Fichiers ignorés » par la 1.9 faux ; retour arrière dans le pitch |
| O2 | Ops | majeur | recevable | majeur | R15 bloque la restauration des copies d'avant la 1.10 |
| O3 | Ops | majeur | recevable | majeur | Étape nginx sans guide, bloc, preuve ; `zsh -n` pour un bloc bash |
| O4 | Ops | mineur | ecarte | — | `doublon` de S3 ; option journal = `extension` |
| O5 | Ops | mineur | ecarte | — | `extension` (extraction d'un CV d'une copie) |
| O6 | Ops | mineur | recevable | mineur | Volume des copies sous-estimé (30 jours) |
| O7 | Ops | mineur | recevable | mineur | « Caddy ne limite pas » non prouvé |
| O8 | Ops | mineur | ecarte | — | `extension` (`proxy_request_buffering`) ; comportement déjà présent pour les dossiers |
| O9 | Ops | mineur | recevable | mineur | Aucune sauvegarde avant déploiement ; relève du guide |
| C1 | Concurrence | bloquant | recevable | bloquant | Objet de la page modifié avant le PUT (vérifié) ; annule R4/R5 |
| C2 | Concurrence | majeur | recevable | mineur | Ordre déjà dans R5 ; reste CA7 dans les deux contextes |
| C3 | Concurrence | majeur | recevable | majeur | R6 fausse (départ pendant POST, réponse perdue) ; « au mieux » manquant dans R4 |
| C4 | Concurrence | majeur | recevable | majeur | `fermer()` vide `attente` en création ; `apres` avant la fin du dépôt |
| C5 | Concurrence | majeur | recevable | majeur | L'autre bouton reste actif → second candidat |
| C6 | Concurrence | majeur | recevable | majeur | Objet enregistré à la relance et champs modifiés non définis |
| C7 | Concurrence | majeur | recevable | mineur | CA17 doublon de T8 ; reste échec du DELETE de l'ancien et ordre observé |
| C8 | Concurrence | majeur | recevable | mineur | Tableau déjà écrit ; manque un CA |
| C9 | Concurrence | mineur | recevable | mineur | Deux acteurs demandés par le plan ; version lue non écrite |
| U1 | Utilisateur | majeur | recevable | majeur | Pas de commande « remplacer » dans l'interface de Léo ; R4, CA6, CA7 décrivent un chemin absent |
| U2 | Utilisateur | majeur | recevable | majeur | Échec répété → pied bloqué sans issue |
| U3 | Utilisateur | majeur | ecarte | — | `hors-perimetre` : choix d'interface de Léo non cassé ; état après échec couvert par R3 |
| U4 | Utilisateur | majeur | recevable | majeur | Même constat que C4 côté utilisateur, proposition divergente (conflit 1) |
| U5 | Utilisateur | majeur | recevable | mineur | Message faux pour 2 Mo ; ne se produit que si R13 oublié |
| U6 | Utilisateur | mineur | recevable | mineur | Message de conflit ne dit pas que le CV n'est pas gardé |

### Dérives et conflits
1. Conflit C4 × U4 (`a-arbitrer`) : fermeture en création après création du candidat — « Fermer vaut Enregistrer et revenir » contre « abandon signalé ».
2. Tension S2 × hors périmètre : nettoyage des orphelins (a) ou acceptation (b), à l'utilisateur.
3. Interdépendance U1 × R4/CA6 : sans remplacement direct, le cas fichier → fichier disparaît ; C3 et T2 restent valables pour la création et le retrait suivi d'un lien.
4. Dérive légère d'O8 et O5, écartés comme extensions.
Aucun bloquant écarté. Sévérités baissées : C2, C7, C8, U5.

## Lead dev — tour 1

### Analyse
| Critère | Analyse |
|---|---|
| Faisabilité avec l'existant | Solide (réutilise `fichiers.js`, `secure_delete`, `pointDeControle`, file par candidat `enFile`). Manque : R1 ne dit pas quoi faire de `VERSION_SCHEMA = 2` et `MIGRATIONS[2]` ; R4/R5 règlent l'ordre des requêtes, pas l'état en mémoire (`deposer()` modifie `c` avant l'enregistrement, `plusTard` renverra cet objet). |
| Données et migration | Solide (table inchangée, cascade V17, `fill` de `main` garde `identite.fichiers`). Manque : R15 casse le contrôle sur une copie 1.9 (table absente) ; le retour 1.9 n'est décrit que côté API (le client 1.9 lit les lignes `type: "fichier"`). |
| Contrat de l'API | Conforme au code. Manque : R4 ne distingue pas un refus (4xx) d'une panne réseau à l'issue inconnue ; R7 ne limite pas le 413 non JSON à l'envoi de fichier (`lire` sert aussi aux PUT). |
| Testabilité | CA4-CA7, CA9, CA10, CA12 solides. Manque : méthode de CA2 (code de `main`) et CA8 (nginx) ; « Fermer pendant l'envoi » sans critère ; CA17 exige 5 e2e alors qu'un contrôle échoue déjà (1.10-3) ; concurrence de R1 sans critère. |
| Maintenabilité | Précédent « table sans changer `user_version` » non documenté ; constantes en double (`ROUTE_FICHIERS`/`ROUTE_ENVOI`, `TYPES`/`MAX` client et `valeurs.js`). |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T1 | majeur | R4, R5, R11 | L'état du dossier en mémoire est modifié avant l'enregistrement (`deposer`, `retirer`, `validerLien`) | Après un échec, l'enregistrement différé suivant envoie un dossier qui pointe vers un fichier retiré, avec une ligne « dépôt » fausse | En cas d'échec, le dossier en mémoire revient exactement à l'état d'avant avant tout autre enregistrement ; CA5 et CA7 : saisie ailleurs puis enregistrement réussi → aucune référence au fichier retiré |
| T2 | majeur | R4, API | « Enregistrement en échec → retrait » ne distingue pas refus (4xx/5xx JSON) et issue inconnue (réseau) | PUT appliqué, réponse perdue : fichier retiré alors que le dossier le référence | Refus explicite → retrait ; issue inconnue → rien retiré, message réseau (R6) ; critère « PUT appliqué puis réponse coupée » |
| T3 | majeur | R15, CA14 | `SELECT count(*) FROM fichiers` échoue sur une copie d'avant la 1.10 (`RESTAURER.md` l. 42 et l. 95) | Restauration de toute copie 1.7-1.9 refusée | `fichiers=<n>` si la table existe, sinon `fichiers=absente`, copie acceptée ; CA14 sur copie 1.9 et 1.10, lignes 42 et 95 |
| T4 | majeur | CA2, CA8, tableau des commandes | Aucune méthode fixée pour CA2 et CA8 ; « fermer pendant l'envoi » sans critère alors que `fermer()` enregistre `copie` pendant que `deposer()` enregistre encore | Critères vérifiés différemment ou pas du tout ; dossier périmé ou 409 invisible | CA2 : test `node:test` avec le `base.js` de `b727ded` ; CA8 : interception Playwright 413 `text/html` ; critère « fermer pendant un envoi » |
| T5 | mineur | R1, Maintenabilité | Sort de `VERSION_SCHEMA`/`MIGRATIONS` non dit ; règle non documentée ; l'ajout doit passer avant le retour anticipé de `appliquerSchema` | Prochaine migration fragile | `VERSION_SCHEMA` = 1, `MIGRATIONS` retiré, ajout idempotent à chaque ouverture ; documenter dans `technique/api.md` ; critère deux connexions simultanées |
| T6 | mineur | Déploiement (retour 1.9) | Le client 1.9 prend une ligne `fichier` pour un passage (`store.js` de `main` l. 242, 266) | Pendant un retour 1.9, « Annuler le dernier passage » échoue pour ces candidats | Le dire dans le tableau et le guide (accepté, temporaire) |
| T7 | mineur | R7 | Le 413 non JSON n'est pas limité à l'envoi de fichier | Un PUT de dossier refusé par nginx afficherait le message des fichiers | R7 seulement pour `deposer` |
| T8 | mineur | CA17 | « Les 5 e2e » alors qu'un contrôle échoue déjà (1.10-3) | Critère intenable ou échec masqué | Sauf « départ de la page, PUT précédent lent » (1.10-3), constaté aussi sur `main`, noté au bilan |
| T9 | mineur | Maintenabilité | Constantes en double (route ; types et taille client/API) | Divergence silencieuse | Route déclarée une fois ; un test compare `TYPES`/`MAX` à `TYPES_FICHIER`/`LIMITE_FICHIER` |

## Sécurité et données personnelles — tour 1

### Analyse
| Critère | Analyse |
|---|---|
| Contrôle des entrées (type, taille, nom) | Solide et prouvé pour les fichiers (R9, V5, V6 ; `SIGNATURES`, `nomPropre`). Point faible : « Coller un lien ». La branche affiche désormais `identite.cv` et `identite.portfolio` comme `href` cliquable (`menu-candidat.js` l. 34), ce que `main` ne faisait jamais ; le schéma n'est contrôlé que dans `validerLien` côté client ; ni la spec ni les vérifications n'en parlent (S1). |
| Accès par rôle | R8 clair, décision sur la route reconnue (V6), CA9 couvre `%66ichiers`. Pas de lacune. |
| Effacement réel et rétention | R10 et CA10 prouvés (V7). Rétention des sauvegardes annoncée honnêtement. Trous : R6 renonce à corriger P7 (« majeur (RGPD) ») alors que la spec dit corriger P1 à P8 ; R5 laisse un retrait raté sans signal (S2) ; un CV retiré seul revient après une restauration (S3). |
| Exposition | R12 solide (PDF, PNG, JPEG seulement, `nosniff`, `inline`, nom nettoyé, `no-store` par `onSend`, `app.js` l. 64) ; fichiers seulement sous `/api/`. Le risque sur l'origine vient du lien collé (S1). |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S1 | majeur | R16, R17, Sécurité, CA | Lien sans contrôle de schéma : `<a href="' + E(lien) + '">` (`menu-candidat.js` l. 34) ; `E()` n'échappe pas le schéma ; seul `validerLien` exige `https?://` ; dossiers existants, import JSON (`importAll`) et `PUT` direct passent sans contrôle | Un `javascript:…` stocké s'exécute dans l'origine au clic d'un recruteur, avec sa session : lecture et exfiltration de tous les dossiers et CV ; défaut introduit par la branche | Règle : lien cliquable seulement s'il commence par `http://` ou `https://`, sinon texte simple avec « Modifier » et « Retirer » ; CA : dossier importé avec `cv: "javascript:alert(1)"` → aucun lien cliquable, aucun script (e2e) ; optionnel côté API |
| S2 | majeur | R5, R6, Données, CA | P7 (« majeur (RGPD) ») écarté par R6 avec un renvoi faux à 1.10-2 (purge à 22 mois) ; R5 laisse un retrait raté silencieux ; R6 dit « jamais servi » et « lisible par son adresse », la liste le renvoie | Un CV dont le candidat demande le retrait peut rester stocké toute la vie du dossier sans que personne le sache | (a) message sur échec de retrait ; à l'ouverture de la fiche par un recruteur, retirer les fichiers non référencés de plus d'une heure ; CA ; ou (b) faire trancher P7 par l'utilisateur, corriger le renvoi, rendre R6 cohérente |
| S3 | mineur | R15, Sécurité | Une restauration remet un CV retiré seul ; `RESTAURER.md` ne refait que les suppressions de candidats (journal) ; le journal ne trace pas les retraits de fichiers | Un CV effacé à la demande réapparaît sans signal | `RESTAURER.md` signale qu'un retrait de fichier fait depuis la copie revient et doit être refait ; noter hors application les retraits demandés par un candidat |

## Ops et déploiement — tour 1

### Analyse
| Critère | Analyse |
|---|---|
| Aller-retour de versions | Solide côté base (R1, R2, tableau à 7 lignes, `auto-deploy.sh`/`deploy.sh` inchangés). Manque : les pages 1.9 lisent les lignes `type: "fichier"` comme des passages (`store.js` l. 242, `histHTML`) ; « fichiers ignorés » non vérifié. |
| Sauvegarde et restauration | Solide (V8, R14, rétention 30 j). Manque : R15 sur une copie 1.9 (table absente) ; retrait de fichier non rejouable (R11) ; récupérer un CV depuis une copie. |
| Prérequis nginx | Solide (V10, R13 avant le merge, R7). Manque : guide non nommé, bloc `server` non précisé, aucune preuve sur le serveur ; « Caddy ne limite pas » non vérifié. |
| Guide exécutable | CA13 : `zsh -n` alors que nginx tourne en bash sur le serveur ; fichier du guide non fixé ; pas de « Tu dois voir / Sinon » ; rien pour le retour 1.9. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| O1 | majeur | R2, Déploiement, CA2 | Les pages 1.9 lisent `{type: "fichier"}` comme un passage : `histHTML` affiche `undefined → undefined`, `undoLast` refuse ; les fichiers sont invisibles en 1.9 | Après un retour vers la 1.9 : historique illisible, annulation bloquée, recruteurs qui recollent le CV en lien | Décrire la dégradation acceptée (ou une forme lisible par la 1.9) ; CA2 bis avec le front de `main` ; ligne au guide de retour (`METTRE-A-JOUR.md` § 5) |
| O2 | majeur | R15, CA14 | `n("fichiers")` (étapes 1 bis et 8) et `sqlite3` (étape 3) échouent sur une copie 1.9 | Procédure d'urgence bloquée pendant 30 jours | Compter seulement si la table existe, sinon `fichiers=absente` ; CA14 : 3 commandes sur copie 1.9 et 1.10 |
| O3 | majeur | R13, CA13 | Étape nginx non exécutable : fichier du guide, bloc `server` 443, gestes prudents du § 7, preuve d'activation ; `zsh -n` inadapté | Réglage mal posé non vu, premier CV > 1 Mo refusé en production | Guide `deploy/METTRE-A-JOUR.md` § 5 « 1.10 — avant le merge », format case / Tu dois voir / Sinon, étapes relevé, copie, directive, `nginx -t`, reload, preuve `curl` 2 Mo ≠ 413, relevé des autres sites ; `bash -n` serveur, `zsh -n` Mac ; tableau de `mise-a-jour-production.md` |
| O4 | mineur | R11, R15 | Retrait de fichier absent du journal, non rejoué par `RESTAURER.md` | CV retiré qui revient après restauration | Phrase à l'étape 8 ; option [extension] journal `retrait-fichier` |
| O5 | mineur | R15 | Un CV ne se ressaisit pas ; aucun moyen de l'extraire d'une copie | CV d'un dossier abîmé irrécupérable | Commande `sqlite3 -readonly … writefile` dans « Ouvrir une copie sur un Mac », effacement à l'étape 9 |
| O6 | mineur | R14, Hypothèses | « De l'ordre du Go » par copie ; 33 copies gardées ; `secure_delete` ne réduit pas le fichier | Ordre de grandeur sous-estimé ×30 | Total (copie × 33) ; mesure par la QA |
| O7 | mineur | R13 | « Caddy ne limite pas » non prouvé (V10 : oauth2-proxy seulement) | Affirmation non prouvée | Limiter à oauth2-proxy, ou vérifier Caddy |
| O8 | mineur | R13, Sécurité | nginx écrit sur disque tout corps > 16 Ko | CV en clair dans les blocs libres du disque de l'hôte | `proxy_request_buffering off;` dans l'exemple et le guide, vérifié au banc ; sinon limite écrite |
| O9 | mineur | Mise en production | Dernière copie avant la 1.10 jusqu'à 24 h d'âge | Jusqu'à une journée perdue en cas de restauration | `deploy/backup.sh` juste avant le merge, « Tu dois voir : Sauvegarde réussie » |

## Testabilité et concurrence — tour 1

### Analyse
| Critère | Analyse |
|---|---|
| Ordre dépôt / enregistrement | Ordre correct (R4, R5). Non dit : l'état en mémoire après un échec (`copie`/`cur` modifiés avant le PUT, l. 228-232, 253, 269-272) ; l'enregistrement différé (`plusTard`, 400 ms, non attendu) ; le départ de la page (`pagehide` → `D.partir`, l. 349 ; `candidat.html` l. 382). |
| Échecs partiels et relance | Seul le 409 est couvert. Rien sur l'échec réseau du PUT, l'échec du DELETE de l'ancien fichier (pas « au mieux » dans R4), la réponse perdue au POST, les champs modifiés entre l'échec et le second clic. |
| Absence d'orphelins et de doublons | R6 incomplète (départ, fermeture, réponse perdue en laissent aussi). R3 ne désactive que le bouton cliqué. Deux recruteurs : repose sur la version optimiste, sans le dire ni le prouver. |
| Preuves automatisées | Une panne par cas, sans méthode ; ni l'ordre des requêtes, ni le tableau des commandes, ni le départ, ni la fermeture ne sont vérifiés ; CA17 intenable (1.10-3). |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| C1 | bloquant | R4, R5, UX/UI (Erreur) | L'objet de la page (`copie`, `cur`) est modifié avant le PUT ; après un échec réseau, l'enregistrement suivant (`plusTard`, `schedule`, `partir`) repart avec l'objet modifié | P5/P6 reviennent : référence vers un fichier retiré, ou orphelin hors R6 ; CA5 (409) ne le voit pas | Changements posés sur une copie, l'objet de la page remplacé seulement après un PUT réussi ; CA : PUT en panne réseau puis saisie enregistrée → aucune référence au fichier retiré ; retrait en échec → fichier toujours référencé |
| C2 | majeur | R5 | `validerLien` enregistre par `plusTard` (différé, non attendu) | R5 non tenu, P6 | Enregistrement immédiat (différé en attente compris), retrait seulement après 2xx ; CA7 dans la fenêtre ⋯ et dans le bloc Infos de `candidat.html` |
| C3 | majeur | R6 | Cas d'orphelins oubliés : départ ou navigation pendant le POST, réponse perdue puis relance, départ entre PUT et DELETE ; R4 sans « au mieux » pour l'ancien | Affirmation fausse ; QA mal orientée | Réécrire R6 avec ces cas ; invariant « le dossier ne référence jamais un fichier absent » ; « au mieux » dans R4 ; CA départ pendant un envoi ralenti (lecture de la base, hors 1.10-3) |
| C4 | majeur | Tableau (Fermer), R3 | `fermer()` en création vide `attente` : fichiers abandonnés sans message ; en consultation `opts.apres` est appelé avant la fin du dépôt, l'erreur va sur un champ disparu | CV perdu sans alerte ; code et spec se contredisent | `apres` après la fin ; échec en bandeau sur la page ; en création après le candidat créé, Fermer vaut « Enregistrer et revenir » ; CA fermeture pendant un envoi ralenti, deux modes |
| C5 | majeur | R3, CA4 | Seul le bouton cliqué est désactivé ; l'autre action relance `createCandidate` | Doublon par l'autre bouton | Les deux actions désactivées dès le premier clic + garde en mémoire ; CA : clic sur l'autre action pendant une création ralentie → un seul candidat |
| C6 | majeur | R3, CA4 | Relance non définie : objet édité, champs modifiés entre deux clics, fichier déjà envoyé qui reste en attente | Modifications perdues, CV renvoyé (orphelin) ou doublon | Après création, l'objet édité est le dossier créé ; un fichier réussi sort de l'attente ; second clic : PUT des champs, fichiers restants, action ; CA : nom modifié en base, un seul `cv` |
| C7 | majeur | CA4 à CA7, CA17 | Une panne par cas, sans méthode ; ni ordre des requêtes ni échecs réseau / DELETE vérifiés ; CA17 intenable | R4/R5 violables sans test rouge | CA « matrice des pannes » (POST, PUT 409, PUT réseau, DELETE) × (dépôt, remplacement, retrait, lien) par `page.route` ; ordre observé et état en base ; CA17 sauf 1.10-3 |
| C8 | majeur | Tableau « pendant l'envoi », CA | Le code ne fait que griser le champ (`.doc.busy`), les boutons restent actifs ; aucun CA | Deux séquences sur le même champ | CA : envoi ralenti, second dépôt / Retirer / Modifier sans requête, boutons `disabled`, réactivés après |
| C9 | mineur | R4, R5, CA5 | Cohérence entre deux recruteurs par la version optimiste non écrite ; CA5 force un 409 au lieu de deux acteurs | Régression de version non vue | R4/R5 : l'enregistrement porte la version lue, périmé → 409, rien retiré ; CA à deux acteurs réels |

## Utilisateur recruteur — tour 1

### Analyse
| Critère | Analyse |
|---|---|
| Compréhension | Solide : les états du champ (Vide, Envoi en cours, Fichier, Lien, Erreur, Lecture seule) et le message de suppression (« ses fichiers partent avec lui ») sont clairs. Manque : la spec parle de « remplacer » un document (titre du parcours, R4, CA6, R5 « remplacement par un lien », CA7) alors que l'état « Fichier » n'offre que « Ouvrir » et « Retirer » ; le glisser-déposer n'est accepté que sur un champ vide (`zone()` exige le bouton « Déposer un fichier », `menu-candidat.js` l. 324). |
| Parcours de création et de dépôt | R3 garantit un seul candidat, mais ne dit pas comment terminer la création quand un fichier échoue à chaque fois : un CV refusé à chaque essai empêche de passer à l'appel. L'état « fichier choisi, pas encore envoyé » de la création manque au tableau UX. |
| Erreurs et cas réels | R7 traite le 413 de nginx, mais « 10 Mo maximum » est faux pour un fichier de 2 Mo (CA8). Un 409 pendant un dépôt affiche le message de conflit existant, qui ne dit pas que le CV n'est pas gardé. « Fermer la fenêtre : permis » pendant un envoi ne dit pas où un échec s'affiche une fois la fenêtre fermée. |
| Confiance (mon CV est-il bien là ?) | Bon : R4 et R5 garantissent un dossier qui ne pointe que vers un fichier présent. Deux cas trompeurs restent : en création, un fichier choisi s'affiche comme déposé (seul « Ouvrir » manque) ; un échec après la fermeture de la fenêtre ne s'affiche nulle part. |

### Retours précédents
Sans objet.

### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| U1 | majeur | Parcours, R4, R5, tableau des commandes, CA6, CA7 | La spec décrit un remplacement fichier → fichier et fichier → lien, mais l'interface de Léo n'a aucune commande pour le faire (« Ouvrir », « Retirer » seulement ; glisser-déposer sur champ vide seulement) : on remplace par « Retirer » puis « Déposer » ou « Coller un lien » | CA6 et CA7 testeraient des chemins impossibles ; risque d'ajouter un « glisser pour remplacer » souris seule | « Remplacer = Retirer (R5) puis Déposer ou Coller un lien » ; garder R4 pour un champ vide ; réécrire CA6, CA7 sur le parcours réel ; tableau : « Retirer d'abord » |
| U2 | majeur | R3, tableau des commandes | Un fichier en échec est renvoyé à chaque clic ; un échec qui se répète (nginx, 415, panne) bloque l'appel et le retour à la liste ; libellés « Réessaie » / « Réessayer » flous | Recruteur bloqué, tenté de fermer et recommencer (doublon) | Le fichier en échec garde « Retirer » (sort de l'attente, l'action continue sans lui) ; libellés du pied inchangés ; message « Réessaie, ou retire-le pour continuer sans. » dans `wording.fr.js` ; ajouter à CA4 |
| U3 | majeur | UX / UI, tableau des états | Manquent : « Choisi (création), envoyé à l'enregistrement » (aujourd'hui identique à un fichier déposé) et « Pas envoyé (après création) » | Le recruteur croit son CV enregistré dès qu'il l'a choisi | Deux lignes au tableau, textes dans `wording.fr.js` ; CA : mention avant le clic, « Ouvrir » après |
| U4 | majeur | Tableau des commandes (Fermer), R3 | Après fermeture, un échec d'envoi n'a plus de champ où s'afficher ; en création, fermer (Échap, clic à côté) pendant l'envoi ou après un échec vide l'attente sans rien dire | Échec silencieux ; recréation (doublon par un autre chemin) | Pendant la création, Échap et le clic à côté ne ferment pas ; après fermeture, échec → message dans la page « <Champ> de <nom> non enregistré : <raison> » ; fermer avec un fichier en attente → « <nom> ajouté·e sans son <champ> » ; CA dédié |
| U5 | majeur | R7, CA8 | 413 de nginx → « Fichier trop volumineux (10 Mo maximum). » : faux pour 2 Mo ; deux textes existent pour la même limite (`docs.erreurTaille`) | Le recruteur compresse en vain ; la mise en production oubliée passe inaperçue | `fichier-trop-gros` → `docs.erreurTaille` ; 413 sans JSON → « Le serveur refuse ce fichier. Colle plutôt un lien et préviens Sofiane ou Léo. » ; `type-fichier` → `docs.erreurType` ; réécrire CA8 |
| U6 | mineur | R4, R7 | Un 409 pendant un dépôt affiche le message de conflit existant, qui ne dit pas que le CV n'est pas gardé | Le recruteur cherche son CV après rechargement | « <Champ> non enregistré : la candidature a été modifiée par quelqu'un d'autre. Recharge la page, puis dépose-le à nouveau. » ; à CA5 |

## Traitement
| # | Statut | Justification / modification |
|---|---|---|
| C1 | integre | R19 (état d'avant), rappelée dans R3, R4, R5, R11 ; CA5, CA7 |
| T2 | integre | R4 : refus explicite → retrait au mieux ; issue inconnue → rien retiré, R6 ; CA6 (a) |
| S1 | integre | R20 ; CA15 |
| S2 | integre | Arbitrage de l'utilisateur : R6 réécrite (nettoyage à l'enregistrement, > 1 h) ; CA6 (b), CA10 |
| O1 | integre | R2 (dégradation des pages 1.9 décrite, guide de retour) ; V19 ; CA2 |
| O2 | integre | R15 (`fichiers=absente`) ; CA14 |
| O3 | integre | R13 (guide `METTRE-A-JOUR.md` § 5, bloc `server` 443, preuve `curl`) ; CA13 (`bash -n` serveur, `zsh -n` Mac) |
| C3 | integre | R6 (invariant), « au mieux » dans R4 et R5 |
| C4 | integre | Arbitrage de l'utilisateur : R3 (fermeture), tableau des commandes ; CA4 (d) |
| U4 | integre | Idem C4 (arbitrage) |
| C5 | integre | R3 (deux actions et fermeture bloquées) ; CA4 (b) |
| C6 | integre | R3 (relance : champs enregistrés, fichiers restants) ; CA4 (a) ; détail aux tâches (P2) |
| U1 | integre | Remplacer = Retirer puis déposer ; chemin fichier → fichier retiré de R4, CA6, CA7 et du tableau |
| U2 | integre | R3 (« Retirer » sort le fichier de l'attente, message) ; CA4 (c) |
| T5 | integre | R1 (règle écrite dans `technique/api.md`) ; CA1 (deux ouvertures) |
| T7 | integre | R7 limitée à l'envoi d'un fichier ; CA8 |
| T8 | integre | CA17 |
| S3 | integre | R15 (retrait de fichier à refaire après restauration) |
| O6 | integre | R14 (copie × 33, mesure QA) |
| O7 | integre | V18 (Caddy vérifié) ; R13 |
| O9 | integre | R13 (sauvegarde avant le merge), sans modifier `auto-deploy.sh` (P2) |
| C2 | integre | R5 (enregistrement immédiat) ; CA7 dans les deux contextes |
| C7 | integre | CA6 (deux cas d'issue inconnue), CA7 (ordre PUT puis DELETE) ; le reste de la matrice va en scénarios QA (P2) |
| C8 | integre | CA7 (commandes désactivées pendant un envoi) |
| C9 | integre | R4, R5 (version lue) ; CA5 à deux acteurs réels |
| U5 | integre | R7 (message nginx distinct, messages existants pour la taille et le type) ; CA8 |
| U6 | integre | R7 (message du 409) ; CA5 |
