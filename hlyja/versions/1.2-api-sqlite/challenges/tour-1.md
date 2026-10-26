---
type: challenge
version: 1.2
tour: 1
spec: 1
score: 74
scores: Technique Node/SQLite=64; Développeur intégrateur=72; Sécurité=90; Données personnelles=74; Exploitation=68
bloquants: 0
recevables: 36
ecartes: 10
decision: nouveau-tour
date: 2026-10-26
---

# Challenge — tour 1 (spec v1)

> **Score global : 74/100** · Décision : nouveau tour
> Conditions : moyenne ≥ 80 ✗ · aucun challenger < 70 ✗ (Technique 64, Exploitation 68) · aucun bloquant ✓ (D1 requalifié en majeur)
> Arbitre : 36 retours recevables (dont 2 à arbitrer : T13, E5), 10 écartés (3 réalisation, 6 doublons, 1 hors périmètre)
> Points clés : effacement réel sur le disque (D1, V18) ; transactions d'écriture immédiates et échec provoqué du schéma (T2, T3) ; collision `version` / `data.version` et 409 du pitch (I1, I2) ; valeurs résolues et utilisateur système (E1, E2, E4).

## Récapitulatif
Score = 100 − 25 × bloquants − 8 × majeurs − 2 × mineurs, sur les retours recevables ouverts (les retours `a-arbitrer` comptent comme mineurs).

| Challenger | Bloquants | Majeurs | Mineurs | Écartés | Score |
|---|---|---|---|---|---|
| Technique Node/SQLite | 0 | 3 | 6 | 4 | 64 |
| Développeur intégrateur | 0 | 2 | 6 | 1 | 72 |
| Sécurité | 0 | 0 | 5 | 1 | 90 |
| Données personnelles | 0 | 2 | 5 | 1 | 74 |
| Exploitation | 0 | 3 | 4 | 3 | 68 |
| **Global** | | | | | **74** |

## Retours recevables bloquants et majeurs
| # | Challenger | Sévérité retenue | Constat | Proposition |
|---|---|---|---|---|
| T1 | Technique | majeur | Fastify accepte `text/plain` et l'absence de `Content-Type` : pas de 415 | Seul l'analyseur JSON ; 415 sinon ; vérification |
| T2 | Technique | majeur | Transactions différées : `SQLITE_BUSY` immédiat, délai ignoré | Toute écriture en `BEGIN IMMEDIATE` |
| T3 | Technique | majeur | « Vide ou complète » sans échec provoqué | CA d'échec provoqué puis relance (schéma, `equipe.js`) |
| I1 | Intégrateur | majeur | `version` de l'enveloppe ≠ `data.version` (3) | Le dire ; CA5 avec `version: 3` |
| I2 | Intégrateur | majeur | 404 sur PUT `version: n` d'un id absent, le pitch dit 409 | 409 conflit |
| D1 | Données | majeur (requalifié) | DELETE laisse le contenu dans le fichier | `secure_delete`, point de contrôle `TRUNCATE`, CA7 sans `VACUUM` |
| D2 | Données | majeur | Le journal garde le parcours après effacement | Purge des lignes du dossier, une ligne `suppression` |
| E1 | Exploitation | majeur | Valeurs résolues non journalisées ; `equipe.js` peut viser une autre base | Ligne de démarrage complète ; « Base : <chemin> » |
| E2 | Exploitation | majeur | Utilisateur système de `equipe.js` non dit | Refus si l'utilisateur n'est pas propriétaire ; README |
| E4 | Exploitation | majeur | `DB_PATH` absurde accepté, `DEV_EMAIL` invalide non tranché | Refus de forme ; CA12 étendu |

## Arbitrages de l'utilisateur
- D2 (signalé par l'arbitre comme un changement de finalité du journal) : **purger les lignes du dossier supprimé, garder une ligne `suppression`** sans étape.
- T13 / E5 (conflit) : tranché par l'orchestrateur, voir Traitement.

## Verdicts de l'arbitre
| # | Verdict | Sévérité retenue | Motif |
|---|---|---|---|
| T1 | recevable | majeur | 415 non tenu (text/plain), gardé face à S4 |
| T2 | recevable | majeur | mode des transactions |
| T3 | recevable | majeur | aucun CA d'échec provoqué ; gardé face à E3 |
| T4 | recevable | mineur | ordre WAL / user_version / transaction |
| T5 | recevable | mineur | IF NOT EXISTS masque une table différente |
| T6 | ecarte (realisation) | mineur | RETURNING/SELECT relève du code |
| T7 | recevable | mineur | CA10 non provocable, gel non écrit |
| T8 | ecarte (realisation) | mineur | organisation du code |
| T9 | recevable | mineur | méthode de mutation |
| T10 | recevable | mineur | .npmrc seul non vérifié |
| T11 | ecarte (doublon de I8) | mineur | |
| T12 | ecarte (doublon de I7) | mineur | |
| T13 | a-arbitrer (conflit E5) | mineur | base de résolution des chemins |
| I1 | recevable | majeur | collision version / data.version |
| I2 | recevable | majeur | pitch « sinon 409 » |
| I3 | recevable | mineur | correspondance incomplète |
| I4 | ecarte (hors-perimetre) | mineur | adaptateur : version suivante |
| I5 | recevable | mineur | textes 401/403/415 ; R26 vs R27 |
| I6 | recevable | mineur | modifieLe / modifiePar ; gardé face à D5 |
| I7 | recevable | mineur | corps du POST, libellé de base |
| I8 | recevable | mineur | DELETE avec Content-Type JSON vide ; ordre : doublon de S3 |
| I9 | recevable | mineur | référence stable du contrat HTTP ; volet MODELE.md hors accord |
| S1 | recevable | mineur | NODE_ENV exact ; DEV_STATIC non lié à HOST |
| S2 | recevable | mineur | DEV_STATIC=.. |
| S3 | recevable | mineur | onRequest avant analyse du corps |
| S4 | ecarte (doublon de T1) | mineur | |
| S5 | recevable | mineur | CA2 exact |
| S6 | recevable | mineur | avertissement HOST |
| D1 | recevable | majeur (requalifié du bloquant) | effacement réel non tenu ; accès au fichier nécessaire |
| D2 | recevable | majeur | conservation du journal (à confirmer par l'utilisateur) |
| D3 | recevable | mineur (baissé) | id nominatif fabriqué par un membre |
| D4 | recevable | mineur | chemin 500 non vérifié |
| D5 | ecarte (doublon de I6) | mineur | |
| D6 | recevable | mineur | ajoute_par sans usage |
| D7 | recevable | mineur | droits des fichiers |
| D8 | recevable | mineur | hôte et adresse |
| E1 | recevable | majeur | valeurs résolues au démarrage |
| E2 | recevable | majeur | utilisateur système |
| E3 | ecarte (doublon de T3) | majeur | |
| E4 | recevable | majeur | DB_PATH absurdes, DEV_EMAIL invalide, CA12 |
| E5 | a-arbitrer (conflit T13) | mineur | |
| E6 | recevable | mineur | code de sortie, port pris |
| E7 | ecarte (realisation) | mineur | |
| E8 | recevable | mineur | sortie de list, rôle en position de prénom |
| E9 | recevable | mineur | première mise en place |
| E10 | ecarte (doublon de T10, T4, T3) | mineur | |
Dérives et conflits : T13/E5 ; écart R19 404 vs pitch (I2) ; D2 change la finalité du journal ; I4/I9 hors accord MODELE.md.

## Technique Node/SQLite — 64/100
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| T1 | majeur | R16, CA6 | Fastify parse aussi `text/plain` par défaut : un PUT/POST en text/plain atteint la route (400 via R17), pas 415 ; V5 n'a testé ni ce cas ni l'absence de Content-Type | CA6 échoue ; l'argument anti-formulaire repose sur R17 par accident (formulaire enctype=text/plain atteint le gestionnaire) | R16 : seul le parseur application/json actif (removeContentTypeParser('text/plain')) ; tout autre type ou absence → 415 ; CA6 + vérification |
| T2 | majeur | R11, R12, R19, R32 | Mode des transactions non dit ; better-sqlite3 db.transaction() = BEGIN différé ; en WAL, lecture puis écriture alors qu'un autre a écrit → SQLITE_BUSY immédiat, busy_timeout ne s'applique pas ; V7 n'a testé que BEGIN IMMEDIATE | equipe.js concurrent de l'API ou deux démarrages qui appliquent le schéma échouent sans attendre ; contredit R11 et CA10 | R11 : toute transaction d'écriture (API, equipe.js, schéma) en BEGIN IMMEDIATE (.immediate()) |
| T3 | majeur | R12, CA9 | « Arrêt au milieu puis relance » affirmé mais CA9 ne le teste pas ; règle 2 du plan sans critère | Propriété transactionnelle non démontrée | CA9 : échec provoqué pendant le schéma → refus, code 1, user_version 0, aucune table ; relance saine → succès ; idem CA10 pour equipe.js |
| T4 | mineur | R10, R12 | Ordre WAL/transaction non fixé ; PRAGMA journal_mode échoue dans une transaction ; lecture de user_version non située | Erreur au premier démarrage | R12 : WAL, busy_timeout, lecture user_version (>1 refus), puis transaction immédiate CREATE + user_version=1 |
| T5 | mineur | R12, Données | IF NOT EXISTS + user_version se doublent ; IF NOT EXISTS masque une table préexistante différente | Mauvais schéma accepté | user_version 0 → création sans IF NOT EXISTS ; 1 → rien ; >1 → refus |
| T6 | mineur | R19, R20 | UPDATE sans ligne modifiée = 404 ou 409 ? SELECT nécessaire dans la même transaction | 409/404 inversés si hors transaction | R19 : transaction immédiate, UPDATE … RETURNING, sinon SELECT décide 404/409 ; journal ; R18 INSERT ON CONFLICT DO NOTHING |
| T7 | mineur | R10, R11, CA10 | better-sqlite3 synchrone : attente de verrou bloque la boucle 5 s ; « écriture longue de l'API » non provocable en test | CA10 non testable ; gel non documenté | CA10 : connexion de test garde BEGIN IMMEDIATE ; equipe.js attend puis réussit ou code 1 sans ligne ; API → 503 ; R11 : pendant l'attente l'API ne répond pas |
| T8 | mineur | R8, R9, R30, R34, CA11, CA12 | Refus de démarrer et écoute non testables par inject ; R34 parle de DB_PATH dans l'env alors que l'app reçoit sa configuration | Tests qui mutent process.env | lireConfig(env) pure ; construireApp(config) ; un test en processus fils pour code 1 et adresse ; R34 « via la configuration » |
| T9 | mineur | CA17, R2 | Mutation sans outil (pas de dépendance de dev) | Critère non vérifiable | CA17 : mutation manuelle, condition inversée, npm test échoue, restaurée, consigné |
| T10 | mineur | R3, CA1 | V3 n'a pas vérifié api/.npmrc ni npm test/npm start avec ce réglage | Hypothèse non vérifiée | Vérification sous node:22 avec .npmrc seul |
| T11 | mineur | R16, R27 | Fastify 400 FST_ERR_CTP_EMPTY_JSON_BODY si Content-Type json sans corps ; DELETE par fetch avec en-têtes communs | DELETE légitime refusé | DELETE/GET ignorent corps et Content-Type, ou contrat documenté ; CA7 |
| T12 | mineur | R23 | Ordre d'ajout sur ajoute_le (égalités) ; libellé égal à une option de base possible | Ordre instable, doublon affiché | Tri par rowid ; libellé de DISPOS → 200 sans insertion |
| T13 | mineur | R9, R10 | DB_PATH relatif : résolution non dite ; comparaison DEV_STATIC/base (relatif, lien, -wal, -shm) | Contrôle R9 contournable | DB_PATH relatif résolu par rapport au dossier courant ; path.resolve + realpath ; refus si dossier de la base = DEV_STATIC ou sous-dossier |

## Développeur intégrateur — 72/100
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| I1 | majeur | R17, R19, API | `version` de l'enveloppe (optimiste) a le même nom que `data.version` (schéma du dossier, toujours 3) ; collision non signalée | Adaptateur naïf envoie 3 : 409/404 partout, ou écriture acceptée par hasard quand la base est en 3 (écrasement sans détection) | Garder le nom (pitch) ; écrire que version d'enveloppe ≠ data.version, l'adaptateur garde la version par id ; CA5 : PUT version 3 quand base en 1 → 409 |
| I2 | majeur | R19, API | Le pitch dit « sinon 409 » ; R19 répond 404 quand l'id est absent avec version n ; 404 sans code, confondu avec route inconnue | Écart à la lettre du pitch ; deux chemins d'échec pour la même situation | Version différente ou id absent → 409 conflit ; retirer 404 du PUT ; CA5 |
| I3 | mineur | API correspondance | put doit rendre .data et mémoriser version ; get avec id invalide reçoit 400 alors que l'id vient de l'adresse ; remove d'un id déjà supprimé reçoit 404 alors que LocalAdapter réussit | Page en échec au lieu de « aucun candidat » ; second recruteur voit une erreur | Correspondance complète : get 404 ou 400 → null ; remove 204 ou 404 → résolue ; autres erreurs → rejet avec erreur |
| I4 | mineur | API, R36 | MODELE.md « l'adaptateur rend tels quels » mais LocalAdapter appelle upgrade() dans list/get ; report, importCode… lisent l'adaptateur sans mise à niveau | Dossier ancien casse ces fonctions | Correspondance : l'adaptateur applique DOSSIER.upgrade comme LocalAdapter ; corriger la phrase de MODELE.md |
| I5 | mineur | R27, R26 | Messages de 401, 403 équipe, 403 rôle, 415, 400 JSON non écrits ; R26 {ok:false} contredit R27 ; distinguer réponses d'oauth2-proxy | Messages instables ; 403 API et 403 oauth2-proxy confondus | Fixer les textes ; R27 « sauf /api/sante » ; toute erreur API en application/json avec erreur ; éventuellement code hors-equipe / lecture-seule |
| I6 | mineur | R13, R20, R25 | Enveloppe modifieLe (serveur) à côté de data.meta.modifieLe (client) ; modifiePar (email) contredit R25 | Confusion ; emails exposés à tous | Enveloppe {id, version, data} ; ou renommer et justifier |
| I7 | mineur | R23 | Corps de la réponse du POST options non défini ; options de base (DISPOS) comptent-elles ? addDispo rend la liste complète et refuse un libellé de base | Second GET nécessaire ; libellé de base stocké comme ajout | POST → corps = tableau des ajouts ; libellé de DISPOS → 200 sans insertion |
| I8 | mineur | Ordre des contrôles, R16 | Ordre ne place pas 413, 415, 400 JSON ; avec Fastify le corps est analysé avant preHandler ; DELETE avec Content-Type json et corps vide → 400 FST_ERR_CTP_EMPTY_JSON_BODY | Lecture qui envoie 2 Mo : 413 ou 403 selon la réalisation ; suppressions refusées | Autorisation dans onRequest (401/403 avant 413/415/400) ; GET/DELETE : Content-Type JSON avec corps vide accepté ; vérifications |
| I9 | mineur | R35, R36 | Aucun document de référence stable du contrat HTTP (routes, enveloppe, codes, correspondance) ; MODELE.md garde « Je recommande une colonne version » | Intégrateur sans référence hors spec | README ou page API décrit routes, enveloppe, codes, messages, correspondance ; MODELE.md renvoie |

## Sécurité — 90/100
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| S1 | mineur | R8, R9, CA11 | Mode local refusé seulement si NODE_ENV vaut exactement production ; DEV_STATIC non lié à HOST | DEV_EMAIL resté dans l'environnement avec HOST local dans le même espace réseau qu'oauth2-proxy donne une identité aux requêtes sans en-tête (routes publiques, V9) | DEV_EMAIL et DEV_STATIC acceptées seulement si HOST de bouclage ET NODE_ENV ≠ production (insensible à la casse) ; CA11 |
| S2 | mineur | R9 | « contient le fichier de la base » ambigu ; DEV_STATIC=.. (racine) passe le contrôle index.html et publie .env, .git, la base | Secrets et base servis | Refus si realpath de DB_PATH ou d'api/ est sous DEV_STATIC, ou si DEV_STATIC contient .git ou .env ; CA11 DEV_STATIC=.. refusé |
| S3 | mineur | Ordre des contrôles, R16 | Moment de l'autorisation non dit ; Fastify analyse le corps avant preValidation/preHandler | Inconnu ou lecture reçoit 413/415/400 au lieu de 401/403 ; 1 Mo analysé pour un inconnu | Contrôles dans onRequest sauf /api/sante ; CA3 : PUT de lecture avec corps invalide ou > 1 Mo → 403 |
| S4 | mineur | R16, CA6 | 415 non vérifié ; Fastify accepte text/plain par défaut ; l'argument anti-site tiers repose dessus | Argument non tenu | Seul l'analyseur JSON ; CA6 : text/plain, x-www-form-urlencoded, absence → 415 ; vérification |
| S5 | mineur | CA2 | CA2 vague, ne reprend pas V8/V9 | Test laxiste (repli sur X-Forwarded-User, email mal formé) | CA2 exact : sans en-tête ou seulement X-Forwarded-User → 401 ; doublon → 401 ; a@yeita.fr.evil.com → 401 ; @gmail.com → 401 ; A@Yeita.FR d'un membre → 200 ; hors équipe, inactif → 403 |
| S6 | mineur | R4, R35 | Rien ne rappelle le danger de HOST non local | Port publié ou conteneur voisin forge l'identité (V10) | Avertissement au démarrage si HOST non de bouclage ; section « Exposition » du README citant V10 |

## Données personnelles — 74/100
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| D1 | bloquant | R21, Données (Rétention), CA7 | DELETE SQLite n'efface pas sur le disque : pages libres du .sqlite, trames du -wal réutilisées sans remise à zéro ; anciennes versions après PUT idem ; CA7 cherche après VACUUM (jamais en prod) ; aucune vérification | Promesse d'effacement fausse ; nom, notes, motif lisibles ; test passe quand même | R10 : PRAGMA secure_delete = ON ; R21 : wal_checkpoint(TRUNCATE) après suppression ou journal_size_limit=0 ; retirer « WAL intégré… » ; CA7 sans VACUUM, chercher nom et ancien contenu dans .sqlite, -wal, -shm ; V18 |
| D2 | majeur | R22, Rétention | Journal survit à la suppression avec étapes (dont non-retenu), auteur, date ; candidat_id ré-identifiable (toCode met id et nom dans les codes collés dans Notion) ; le pitch fixe les colonnes, pas la conservation | Parcours d'un candidat nommé reconstituable après effacement | Dans la transaction du DELETE, supprimer les lignes de journal de cet id et n'écrire que « suppression » (etape null) ; CA7 : une seule ligne |
| D3 | majeur | R15 | Motif accepte « jean-dupont » alors que MODELE.md impose un id opaque ; importCode reprend un id fabriquable ; l'id va au journal et dans l'URL des journaux du serveur | Un nom peut entrer dans journal et journaux serveur | R15 restreint à la forme de uid() (^cand-[a-z0-9]{1,20}-[a-z0-9]{1,10}$) après vérification des formats en usage (V15) ; sinon 400 |
| D4 | mineur | R27, CA15 | Sur 500, message et pile journalisés tels quels ; une erreur peut citer du contenu (JSON.parse d'un data abîmé cite un extrait) ; CA15 ne capture qu'un PUT réussi | Fuite possible dans le chemin d'erreur | R27 : pas de err.message de traitement de dossier, ou aucun message ne contient de valeur de data ; CA15 : capturer sur 400, 409, 413 et 500 provoqué |
| D5 | mineur | R13, R14 | modifiePar (email) dans chaque dossier renvoyé : hors contrat, contredit R25 | Emails vers tous les rôles sans usage | Retirer modifiePar des réponses ou rendre le prénom ; CA14 |
| D6 | mineur | Données options | ajoute_par (email) hors pitch, sans usage | Donnée personnelle sans usage | Supprimer ou justifier |
| D7 | mineur | R10 | Mode 700 seulement sur dossier créé ; fichiers créés avec le masque par défaut (644) | Lisibles par d'autres comptes | umask 077 avant ouverture (API et equipe.js) ou chmod 600 ; CA9 vérifie |
| D8 | mineur | R28 | R28 omet hôte et adresse relevés par V16 ; URL contient l'id | README moins exact | Liste exacte de V16 ; id opaque |

## Exploitation — 68/100
### Retours ouverts
| # | Sévérité | Section | Constat | Conséquence | Proposition |
|---|---|---|---|---|---|
| E1 | majeur | R10, R32, R4 | equipe.js sans le DB_PATH du service crée en silence une autre base ; au démarrage seule l'adresse est journalisée | Admin voit « fait » mais l'API répond 403 ; règle 3 (valeurs résolues) non tenue | Démarrage : une ligne avec host, port, chemin absolu de la base, user_version, NODE_ENV, DEV_EMAIL/DEV_STATIC actifs ; equipe.js commence par « Base : <chemin absolu> » + « (créée) » ; CA10, CA12 |
| E2 | majeur | R10, R32, README | Utilisateur système de equipe.js non dit ; root avant démarrage → fichiers à root, l'API ne peut ouvrir ; -wal/-shm changent de propriétaire | L'API refuse de démarrer ; cas classique du premier admin | equipe.js refuse (code 1) si l'utilisateur courant n'est pas propriétaire du dossier de la base ; README : même utilisateur, même DB_PATH ; CA10 |
| E3 | majeur | R12, CA9, CA10 | Règle 2 au plan mais aucun CA ne provoque d'échec puis relance | Promesse de R12 non démontrée | CA18 : schéma interrompu puis relance ; equipe.js add en échec puis relance, membre ajouté une seule fois ; noté dans la fiche |
| E4 | majeur | R30, CA12 | DB_PATH « non vide » seulement : « /srv/x.sqlite # base » ou « :memory: » acceptés ; DEV_EMAIL invalide refus ou ignoré ? NODE_ENV « production  » / « Production » ? CA12 ne teste ni DB_PATH, ni DEV_STATIC, ni DEV_EMAIL | :memory: perd tout au redémarrage ; base créée sous un nom absurde ; variante de NODE_ENV laisse passer DEV_EMAIL | DB_PATH refusé si :memory:, #, guillemets, dossier existant ; DEV_EMAIL invalide → refus ; NODE_ENV trim + minuscules ; DEV_STATIC mêmes refus de forme ; CA12 étendu (commentaire, « # x », guillemets, exportée) |
| E5 | mineur | R10, R9 | DB_PATH relatif fourni par l'admin, DEV_STATIC relatif : résolution non dite ; equipe.js lancé depuis la racine, npm start depuis api/ | Deux bases différentes selon le dossier courant | Tout chemin relatif résolu par rapport à api/, pour l'API et equipe.js ; chemin résolu journalisé |
| E6 | mineur | R30, R31 | Échec d'écoute (port pris), dossier non créable, code de sortie après SIGTERM non spécifiés | Trace Node au lieu d'un message ; arrêt demandé non distingué d'un plantage | Toute erreur au démarrage → code 1 + une ligne en français ; SIGTERM → code 0 ; CA12 port pris |
| E7 | mineur | R1 | npm start / npm test utilisés mais scripts et fichier d'entrée non définis | Commande du README différente du code | R1 : scripts start (node server.js) et test (node --test) |
| E8 | mineur | R32 | Sortie de list non décrite ; role sur désactivé non tranché ; `add a@yeita.fr admin` crée un recruteur prénommé « admin » | Premier admin avec mauvais rôle sans signal | list : email, prénom, rôle, actif, ajouté le, désactivés compris ; role ne réactive pas ; commandes affichent la ligne obtenue |
| E9 | mineur | R35 | README sans ordre de première mise en place | Pièges E1, E2, HOST exposé non documentés | Section « Première mise en place », tableau des variables, NODE_ENV=production, avertissement oauth2-proxy seul, arrêt et codes de sortie |
| E10 | mineur | R3, R12 | Non vérifiés : api/.npmrc seul (pas l'option) ; WAL hors transaction ; user_version annulé avec la transaction | Recompilation à l'installation ou promesse « vide ou complète » fausse | Vérifications : npm ci avec .npmrc seul ; user_version dans transaction annulée relit 0 ; R12 ordre WAL puis transaction |


## Traitement
| # | Statut | Justification / modification |
|---|---|---|
| T1 | integre | R16 : seul l'analyseur JSON, 415 pour `text/plain`, formulaire, absence (V19) ; CA6 |
| T2 | integre | R11 : `BEGIN IMMEDIATE` pour toute écriture (V23) |
| T3 | integre | R12 ; CA18 (échec provoqué puis relance, schéma et `equipe.js`) |
| T4 | integre | R12 : ordre d'ouverture (V22) |
| T5 | integre | R12 : création sans `IF NOT EXISTS`, table préexistante → refus |
| T7 | integre | R11 (gel pendant l'attente) ; CA10 réécrit (connexion de test en `BEGIN IMMEDIATE`) |
| T9 | integre | CA17 : mise à l'épreuve manuelle consignée dans la fiche |
| T10 | integre | V21 ; CA1 avec `api/.npmrc` seul |
| T13 | integre en partie | Comparaison sur les chemins réels (R9) ; base de résolution : `api/` (conflit avec E5 tranché par l'orchestrateur, cohérent avec le défaut) |
| I1 | integre | R13 : `version` d'enveloppe distincte de `data.version` ; CA5 (`version: 3`) |
| I2 | integre | R19 : 409 aussi pour un dossier absent ; 404 retiré du PUT |
| I3 | integre | Correspondance complète sous le tableau API ; détail dans `api/README.md` (R35) |
| I5 | integre | Textes et codes dans R5, R6, R7, R16 ; R26 exception explicite de R27 |
| I6 | integre | R13 : enveloppe `{id, version, data}` ; `modifie_le`, `modifie_par` en base seulement |
| I7 | integre | R23 : corps du POST, options de base sans insertion |
| I8 | integre | R16 : corps vide accepté sur GET et DELETE ; CA6 |
| I9 | integre | R35 : contrat HTTP dans `api/README.md` ; R36 : renvoi depuis la section des tables de `MODELE.md` (dans l'accord de l'utilisateur) |
| S1 | integre | R8 : `HOST` local **et** `NODE_ENV` ≠ `production` (casse et espaces ignorés), pour `DEV_EMAIL` et `DEV_STATIC` ; CA11 |
| S2 | integre en partie | R9 : refus si la base ou `api/` sont dans `DEV_STATIC` ; refus de `.git` et `.env` → backlog (P2 : mode local, bouclage seulement) |
| S3 | integre | R6, ordre des contrôles : `onRequest` (V20) ; CA3 |
| S5 | integre | CA2 détaillé |
| S6 | integre | R4 : avertissement d'exposition ; R35 : section exposition |
| D1 | integre | R10 `secure_delete`, R21 `wal_checkpoint(TRUNCATE)` (V18) ; CA7 sans `VACUUM` |
| D2 | integre | R21, R22 : purge du journal du dossier supprimé, une ligne `suppression` (arbitrage de l'utilisateur) |
| D3 | integre | R15 : motif de `uid()` (V24) ; H4 |
| D4 | integre | R27 : ni message brut ni première ligne de pile au journal ; CA15 (400, 409, 413, 500) |
| D6 | integre | `ajoute_par` retiré de `options_disponibilite` |
| D7 | integre | R10 : masque `0o077` ; CA9 (600 / 700) |
| D8 | integre | R28 : liste exacte de V16 |
| E1 | integre | R4 : ligne de démarrage avec les valeurs résolues ; R32 : « Base : … (créée) » ; CA10, CA12 |
| E2 | integre en partie | Parcours, R35 : même utilisateur et même `DB_PATH`, base affichée ; refus selon le propriétaire → backlog (P2) |
| E4 | integre | R30 : refus de forme pour `DB_PATH` et `DEV_STATIC` ; R8 : `DEV_EMAIL` invalide → refus ; CA11, CA12 |
| E5 | integre | R10 : chemins relatifs résolus par rapport à `api/` |
| E6 | integre | R30 (toute erreur de démarrage → code 1, une ligne), R31 (code 0) ; CA12 |
| E8 | integre | R32 : affichages, `role` ne réactive pas, rôle en position de prénom refusé |
| E9 | integre | R35 : première mise en place, variables, exposition, arrêt |
