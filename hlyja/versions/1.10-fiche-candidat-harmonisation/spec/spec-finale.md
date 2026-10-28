---
type: spec
version: 1.10
n: 2
statut: validee
score: 93
tour: 2
modules: UX/UI, Accessibilité, Données, API et intégrations, Sécurité et conformité, Déploiement et compatibilité
date: 2026-10-28
---

# Spec finale — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> La branche de Léo, rejouée sur `main`, telle qu'elle doit fonctionner en production : création dans la fenêtre « Fiche du candidat », CV et portfolio en fichier ou en lien, étapes harmonisées.
> Validée au tour 2 (93/100). Changements depuis v1 : un échec laisse la page dans son état d'avant (R19) ; nettoyage des fichiers non référencés (R6) ; création et fermeture verrouillées (R3) ; liens collés filtrés (R20) ; restauration des copies d'avant la 1.10 ; étape nginx exécutable (voir `challenges/tour-1.md`).

## Changements depuis la version précédente
Spec finale (retours recevables du tour 2) : T10 (R6 : l'API refuse une référence à un fichier absent ; R21 import) ; C10 et C1 (R19 précisée, CA7) ; O10 (R13 : `METTRE-A-JOUR.md` dit de faire « avant le merge » avant de cliquer Merge) ; C6 (R3) ; U4 (R7, CA4 d).

Spec v2 :
- C1 : R19 (état d'avant après un échec). T2, C9 : R4 distingue refus et issue inconnue, version lue. C2 : R5 enregistre tout de suite.
- S2, C3, arbitrage de l'utilisateur : R6 réécrite (nettoyage à l'enregistrement du dossier). C3 : « au mieux » partout.
- C4, U4 (arbitrage), C5, C6, U2 : R3 réécrite ; tableau des commandes. C8 : CA7. U1 : plus de chemin « remplacer » direct (R4, R5, tableau).
- S1 : R20. O1 : R2 (pages 1.9). O2, S3 : R15. O3, O7, O9 : R13. O6 : R14. T7, U5, U6 : R7. T5 : CA1. T8 : CA17.

## Contexte et objectif
Les recruteurs de Yeita (Peter, Thélo, Andrea, Pauline, Léo) suivent les candidats dans l'espace Candidatures. Léo a préparé une branche qui unifie la fiche du candidat, permet de déposer un CV ou un portfolio en fichier et harmonise les pages d'étapes, écrite avant les versions 1.7 (sauvegardes), 1.8 et 1.9 (déploiement automatique). Objectif : la mettre en production sans casser le déploiement automatique, le retour arrière ni les sauvegardes, avec des fichiers toujours cohérents avec le dossier.

## Utilisateurs et parcours
Recruteur (`recruteur`, `admin`), lecteur (`lecture`), administrateur du serveur.

### Créer un candidat
1. « Ajouter un candidat » ouvre la fenêtre « Fiche du candidat » en création (Identité, Contact, Documents, Suivi).
2. Le recruteur remplit au moins le nom ; il peut choisir un CV et un portfolio (fichier ou lien).
3. « Passer à l'appel de découverte » : candidat créé, fichiers envoyés, appel ouvert. « Enregistrer et revenir à la liste » : idem, fenêtre fermée.
Cas limites : nom absent ou e-mail invalide (rien n'est créé) ; envoi refusé ou en panne (R3) ; double clic ou clic sur l'autre action (un seul candidat) ; fermeture (R3).

### Déposer, retirer un document
Bloc Infos de l'appel ou fenêtre du menu ⋯ : « Déposer un fichier » (bouton ou glisser-déposer sur un champ vide) ou « Coller un lien ». Rempli : nom, taille, « Ouvrir », « Retirer » (fichier) ; lien, « Modifier », « Retirer » (lien). Remplacer un fichier = « Retirer » puis déposer ou coller un lien.
Cas limites : type ou taille refusés avant l'envoi ; refus par nginx ou l'API ; conflit (409) ; réseau ; lecteur (aucune action).

### Supprimer un candidat
Menu ⋯ → Supprimer : le message signale que ses fichiers partent avec lui ; tout est effacé, y compris des fichiers bruts de la base.

### Mettre en production (administrateur)
Avant le merge : réglage nginx et sauvegarde (R13). Le déploiement automatique de la 1.9 fait le reste ; un retour vers la 1.9 reste possible (R2).

## Périmètre
### Inclus
Tout ce que décrit la branche (liste du pitch, `version.md`), tel qu'il est codé, après correction des défauts P1 à P8 du cadrage ; les tests qui prouvent les règles ; la doc hlyja ; le guide nginx. `[ajout]` R6 (nettoyage des fichiers non référencés) : décision de l'utilisateur après le tour 1.

### Exclu
« Hors périmètre » du cadrage : choix d'interface de Léo non rediscutés (pas de commande « remplacer », glisser-déposer sur champ vide seulement) ; 1.10-1, 1.10-2, 1.10-3, 1.6-2 ; stockage hors SQLite, antivirus, aperçu ; fichiers en mode navigateur ; changement de `user_version` ; action sur le serveur réel ; `Claude outputs/` ; modification de `auto-deploy.sh` ou `deploy.sh`.

## Existant réutilisé
| Besoin | Décision | Élément | Référentiel |
|---|---|---|---|
| Table des fichiers | étendre | `appliquerSchema` (`api/src/base.js`) | [API](../../../technique/api.md) |
| Routes, contrôles, effacement | réutiliser, étendre (R6) | `api/src/fichiers.js`, `api/src/candidats.js` (PUT), `secure_delete`, `pointDeControle` | [API](../../../technique/api.md) |
| Erreurs côté pages | étendre | `lire`, `MESSAGE_CODE` (`assets/adapter-serveur.js`) | [Mode serveur](../../../technique/mode-serveur.md) |
| Ordre dépôt / enregistrement | étendre | `candidatures/menu-candidat.js` ; `S.saveCandidate`, `S.createCandidate` | [Mode serveur](../../../technique/mode-serveur.md) |
| Tests | étendre | `api/test/fichiers.test.js`, `base.test.js` ; `tools/e2e-serveur.py`, `e2e-candidatures.py`, `e2e-parcours.py` | [Conventions](../../../technique/conventions.md) |
| Sauvegarde, déploiement | réutiliser sans modification | `api/sauvegarde.js`, `deploy/backup.sh`, `deploy/auto-deploy.sh`, `deploy/deploy.sh` | [Architecture](../../../technique/architecture.md) |

## Règles et comportements
| # | Règle | Détail / valeurs |
|---|---|---|
| R1 | La table `fichiers` s'ajoute sans changer la version de la base | Ajout idempotent à chaque ouverture (base neuve ou existante), sûr si deux processus ouvrent la base en même temps ; `user_version` reste 1 ; aucune donnée modifiée ; la règle « ajout de table sans changer de version » est écrite dans `technique/api.md` (V4, décision de l'utilisateur) |
| R1b | Base de test en `user_version` 2 | Refusée comme toute version plus récente ; le guide de test dit de recréer sa base locale (décision de l'utilisateur, P1) |
| R2 | Retour vers la 1.9 | API de `main` : démarre sur une base de la 1.10, lit les candidats, une suppression efface les fichiers (V17). Pages de `main` (dégradation acceptée, temporaire) : fichiers invisibles, lignes de dépôt affichées comme des passages sans étape, « Annuler le dernier passage » refusé tant qu'une ligne de dépôt est la dernière ; rien n'est perdu, tout revient avec la 1.10. Le guide de retour le dit et demande de ne pas recoller les CV en lien (V19) |
| R3 | Création : un seul candidat | Au premier clic sur une action du pied : les deux actions et la fermeture de la fenêtre sont bloquées jusqu'à la fin. Une fois le candidat créé, la fenêtre travaille sur lui : un nouveau clic enregistre les champs modifiés, envoie seulement les fichiers non encore envoyés, puis fait l'action ; un fichier dont le dépôt n'a pas abouti (envoi ou enregistrement du dossier) reste en attente et est renvoyé à la relance, ou « Retirer » le sort de l'attente ; libellés du pied inchangés ; message du champ : raison (R7) puis « Réessaie, ou retire-le pour continuer sans. ». Fermer une fois le candidat créé = « Enregistrer et revenir à la liste » (fichiers en attente envoyés ; un échec s'affiche dans un bandeau de la page) (arbitrage de l'utilisateur) |
| R4 | Dépôt sur un champ vide | Ordre : envoi du fichier → enregistrement du dossier qui le référence, sur la version lue. Refus explicite de l'API (réponse JSON d'erreur, dont 409) : le fichier est retiré de l'API au mieux, message (R7). Issue inconnue (réseau, réponse perdue) : rien n'est retiré, message réseau ; R6 fait le ménage. Dans les deux cas : R19 |
| R5 | Retrait d'un fichier (puis, éventuellement, lien) | Ordre : enregistrement immédiat du dossier sans le fichier (un enregistrement différé en attente est compris dedans), sur la version lue → seulement après sa réussite, retrait du fichier de l'API, au mieux. Enregistrement en échec : rien n'est retiré, message, R19. Retrait de l'API en échec : R6 |
| R6 | `[ajout]` Fichiers non référencés | À chaque enregistrement réussi d'un dossier, l'API efface les fichiers de ce candidat que le dossier enregistré ne référence pas et qui ont été déposés il y a plus d'une heure (le délai protège un dépôt en cours). Effacement réel (R10). Invariant, garanti par l'API : dans la transaction de l'enregistrement, chaque fichier référencé par `identite.fichiers` doit exister sous ce candidat pour ce champ, sinon 409 `fichier-introuvable` et rien n'est écrit ; le nettoyage a lieu dans la même transaction. Un fichier non référencé n'est jamais affiché par les pages |
| R7 | Messages du dépôt | Pour l'envoi d'un fichier seulement : 413 sans corps JSON (nginx) → « Le serveur refuse ce fichier. Colle plutôt un lien et préviens Sofiane ou Léo. » ; `fichier-trop-gros` → message existant de taille (« Ce fichier dépasse 10 Mo… ») ; `type-fichier` → message existant de type ; 409 → « <Champ> non enregistré : la candidature a été modifiée par quelqu'un d'autre. Recharge la page, puis dépose-le à nouveau. » ; échec après la fermeture de la fenêtre (R3) → bandeau de la page « <Champ> de <nom> non enregistré : <raison>. Ouvre sa fiche pour le déposer à nouveau. » ; 409 `fichier-introuvable` sur un enregistrement → « Le CV ou le portfolio de cette fiche n'existe plus. Recharge la page. ». Ailleurs, les messages ne changent pas (V9, V13) |
| R8 | Accès | GET, HEAD : membres actifs ; POST, DELETE : `recruteur`, `admin` ; décision sur la route reconnue (V6) ; hors équipe : 403 |
| R9 | Contenu accepté | PDF (`%PDF-`), PNG (8 octets), JPEG (`FF D8 FF`) vérifiés aux premiers octets, type annoncé = type reconnu ; 1 à 10 485 760 octets ; vide → 400 ; nom nettoyé (sans chemin, 120 caractères au plus, extension du type réel) (V5) |
| R10 | Effacement réel | Après retrait, nettoyage (R6) ou suppression du candidat : contenu absent de la base, du WAL et des temporaires, sans maintenance (V7) |
| R11 | Trace | Dépôt, retrait, lien posé, lien retiré : ligne `type: "fichier"` dans l'historique du dossier (`depot`, `retrait`, `lien`, `retraitLien`), nom et auteur ; seulement après l'enregistrement réussi (R19). Le journal du serveur n'en garde rien (V15) |
| R12 | Lecture d'un fichier | Type enregistré, `nosniff`, `Content-Disposition: inline` (nom nettoyé), `no-store` ; un fichier ne se lit que sous son candidat |
| R13 | Mise en production (cas A) | `deploy/METTRE-A-JOUR.md` § 5, « 1.10 — avant le merge (compte `ubuntu`) », au format case à cocher / « Tu dois voir » / « Sinon » : sauvegarde (`deploy/backup.sh`, compte `deploy`) ; relevé de `client_max_body_size` ; copie du fichier du site ; `client_max_body_size 10m;` dans le `server` 443 du site ; `nginx -t`, `reload` ; preuve (envoi de 2 Mo, code autre que 413) ; relevé des autres sites inchangé. Même directive dans l'exemple de `deploy/README.md` § 7. L'introduction et la première case du § 1 de `METTRE-A-JOUR.md` disent qu'une section « avant le merge » du § 5 se fait avant de cliquer Merge ; l'introduction du § 5 distingue « avant le merge » et « après la section 2 ». oauth2-proxy (V10) et Caddy (V18) ne limitent pas |
| R14 | Sauvegardes | Fichiers dans chaque copie (V8). La doc donne la taille totale : taille d'une copie × 33 (30 chiffrées + 3 dans le volume), mesurée par la QA avec des fichiers réalistes |
| R15 | Restauration | `deploy/RESTAURER.md` : les commandes de contrôle affichent `fichiers=<n>`, ou `fichiers=absente` pour une copie d'avant la 1.10, acceptée ; `user_version` doit valoir 1. La procédure dit qu'un fichier retiré depuis la date de la copie revient avec elle et doit être retiré à nouveau |
| R16 | Mode navigateur (sans API) | CV et Portfolio en lien seulement |
| R17 | Interface de Léo | Fenêtre de création (2 actions), composant unique (4 groupes ; 3, 2 puis 1 colonnes), largeur 1120 px, Notes à côté dès 1360 px et par-dessus en dessous, appel sans liens utiles, EC1 (« Yeita Match », jeu en ligne en visio, feuille de décompte en présentiel, plus de « Liens et outils »), EC2 (icône de grille, palier sur une ligne, mention de séniorité, plus de « Liens et outils »), Bilans (partie interne sous la carte), plus de sélecteur d'État dans les étapes, noms tels que saisis, initiales sur le kanban, RGPD 22 mois (config, carte, page des étapes, one-pager) |
| R18 | Déploiement automatique | Le commit de la 1.10 passe les tests de `auto-deploy.sh` (`test-store`, `npm test` dans `node:22.23.4-slim`, `docker compose build`), sans les modifier |
| R19 | Un échec laisse le champ dans son état d'avant | R19 porte sur le changement du fichier : quand un envoi ou un enregistrement de R3, R4 ou R5 échoue, la référence, le lien et la ligne d'historique de ce champ restent ceux d'avant l'action ; aucun enregistrement ultérieur (différé, départ de la page, fermeture) ne renvoie le changement qui a échoué. Une saisie faite ailleurs pendant l'action est gardée et enregistrée après elle, sans 409 provoqué par la page elle-même ; un départ de la page pendant l'action n'enregistre jamais un dossier qui défait l'action |
| R21 | Import d'un export | Avant d'enregistrer un dossier importé, la page remet à `null` toute référence `identite.fichiers` qui n'existe pas dans l'API pour ce candidat (l'export ne contient jamais le contenu des fichiers) |
| R20 | Lien CV ou Portfolio | Cliquable seulement s'il commence par `http://` ou `https://` (quelle que soit sa source : saisie, import, dossier existant) ; sinon affiché en texte simple, avec « Modifier » et « Retirer » |

## UX / UI
| État du champ | Affichage | Actions |
|---|---|---|
| Vide (mode serveur) | « Déposer un fichier », « Coller un lien », aide « ou glisse-le ici » | fichier, lien |
| Vide (mode navigateur) | « Coller un lien » | lien |
| Envoi en cours | « Envoi de <nom>… », champ occupé | aucune : boutons désactivés |
| Fichier | trombone, nom, taille, « Ouvrir » (nouvel onglet), « Retirer » | ouvrir, retirer |
| Lien | lien court (cliquable selon R20), « Modifier », « Retirer » | modifier, retirer |
| Erreur | message (R7), l'état d'avant reste affiché (R19) | celles de l'état d'avant |
| Lecture seule | fichier ou lien sans action ; vide : « Non renseigné » | ouvrir |

| Commande | Pendant un envoi | Après un échec | Après un succès |
|---|---|---|---|
| Déposer, glisser, Retirer, Modifier (même champ) | désactivées, aucune requête | permises | permises (un fichier : « Retirer » d'abord) |
| Actions du pied (création) | désactivées | permises (R3) | — |
| Fermer la fenêtre (Échap, clic à côté, croix) | impossible | permis (création : R3) | permis |

## Accessibilité
- « Déposer un fichier » est un vrai bouton ; le glisser-déposer n'est jamais le seul moyen.
- Messages du champ et bandeau de la page annoncés (zone `aria-live` présente dès l'affichage, non masquée par `display:none`).
- Après un dépôt ou un retrait, le focus revient sur le champ ; « Ouvrir » annonce le nom et « nouvel onglet », « Retirer » le nom.

## Données
Table `fichiers` (Léo, inchangée) : `id` (`fic-` + 18 hex), `candidat_id` → `candidats(id)` `ON DELETE CASCADE`, `champ`, `nom` (1 à 120), `type`, `taille` (> 0), `contenu` (BLOB), `depose_le`, `depose_par` ; index sur `candidat_id`. Dossier : `identite.fichiers = {cv, portfolio}`, chaque entrée `null` ou `{id, nom, type, taille, le, par}` ; `identite.cv` et `identite.portfolio` gardent un lien. Rétention : celle du dossier ; non référencés : R6.

## API et intégrations
| Route | Entrée | Sortie | Erreurs |
|---|---|---|---|
| `POST /api/candidats/:id/fichiers?champ=cv\|portfolio` | corps brut, `Content-Type` du fichier, nom dans `X-Nom-Fichier` | 201 `{id, champ, nom, type, taille, deposeLe, deposePar}` | 400, 401, 403, 404 `introuvable`, 413 `fichier-trop-gros`, 415 `type-fichier`, 503 |
| `GET /api/candidats/:id/fichiers` | — | 200 métadonnées | 400, 401, 403, 404 |
| `GET /api/candidats/:id/fichiers/:fid` | — | 200 le fichier (R12) | 400, 401, 403, 404 `fichier-introuvable` |
| `DELETE /api/candidats/:id/fichiers/:fid` | — | 204 | 400, 401, 403, 404 `fichier-introuvable`, 503 |
| `PUT /api/candidats/:id` (existante) | inchangée | inchangée ; en plus, R6 (vérification des références, nettoyage) | en plus : 409 `fichier-introuvable` |

## Sécurité et conformité
- Entrées non fiables : contenu (R9), nom (jamais un chemin), identifiants (motifs), `champ` (liste fermée), liens (R20).
- Exposition : fichiers servis seulement sous `/api/`, derrière oauth2-proxy.
- Données personnelles : même accès, rétention et effacement que le dossier (R6, R10) ; copies chiffrées gardées 30 jours (un CV effacé y reste jusqu'à 30 jours, comme un dossier) ; R15 pour la restauration.

## Déploiement et compatibilité
| Commande | Code | Base avant | Résultat attendu |
|---|---|---|---|
| Déploiement automatique de la 1.10 | 1.10 | 1.9 | table créée, `user_version` 1, dossiers intacts (R1, R18) |
| Retour automatique, ou « Déployer ce commit » vers la 1.9 | 1.9 | 1.10 | API saine, candidats lisibles ; pages : R2 |
| Redéploiement de la 1.10 après un retour | 1.10 | 1.10 relue par 1.9 | rien ne change |
| Restauration d'une copie d'avant la 1.10 | 1.10 | copie 1.9 | `fichiers=absente`, acceptée ; table créée à l'ouverture (R15) |
| Restauration d'une copie 1.10 | 1.9 ou 1.10 | copie 1.10 | `fichiers=<n>` (R15) |
| Base de test de Léo | 1.10 | `user_version` 2 | refusée ; base à recréer (R1b) |

## Critères d'acceptation
- [ ] CA1 — Base de `main` ouverte par la 1.10 : table `fichiers`, `user_version` 1, dossiers intacts ; deux ouvertures simultanées d'une base 1.9 réussissent toutes les deux (R1).
- [ ] CA2 — API de `main` sur une base de la 1.10 : démarre, lit, une suppression efface les fichiers ; pages de `main` sur un dossier avec une ligne de dépôt : historique ouvert sans erreur de script, comportement de R2 constaté (R2).
- [ ] CA3 — Base `user_version` 2 refusée avec le message existant ; guide de test à jour (R1b).
- [ ] CA4 — Création : (a) envoi du CV forcé en échec, nom modifié, second clic → un seul candidat, nom modifié en base, un seul fichier `cv` ; (b) clic sur l'autre action pendant une création ralentie → un seul candidat ; (c) fichier en échec retiré puis clic → appel ouvert, sans fichier ; (d) fermeture impossible pendant l'envoi, fermeture après création → fichiers envoyés ; même fermeture avec l'envoi forcé en échec → bandeau de R7 visible et annoncé sur la liste, candidat présent sans CV (R3, R7).
- [ ] CA5 — Deux recruteurs réels sur le même candidat : B, avec une version périmée, dépose un CV → 409, message de R7, fichier de B retiré, page de B dans son état d'avant ; une saisie suivante de B, après rechargement, ne référence aucun fichier absent (R4, R19).
- [ ] CA6 — Issue inconnue : (a) PUT appliqué puis réponse coupée → le dossier référence un fichier présent ; (b) réponse du POST perdue → fichier non référencé, effacé par R6 à un enregistrement au-delà d'une heure (horloge simulée), conservé avant ; (c) PUT qui référence un fichier absent ou d'un autre candidat → 409 `fichier-introuvable`, dossier inchangé, y compris par un départ de page sur une version prédite après le retrait du fichier par un autre recruteur ; (d) import d'un export qui référence un fichier effacé → dossier sans référence, aucun « Ouvrir » vers un 404 (R4, R6, R21).
- [ ] CA7 — Retrait et lien à la place d'un fichier, dans la fenêtre ⋯ et dans le bloc Infos : enregistrement refusé → fichier présent et référencé, page dans son état d'avant ; réussi → requêtes dans l'ordre PUT puis DELETE ; pendant un envoi ralenti, Retirer, Modifier et un second dépôt n'envoient rien et sont `disabled` ; (b) retrait forcé en échec réseau, puis saisie dans un autre champ (enregistrement différé), puis départ de la page → en base, fichier présent et référencé, saisie enregistrée ; dépôt forcé en échec, même suite → aucune référence au fichier ; (c) pendant un dépôt ralenti, saisie dans un autre champ, avec ou sans départ de la page → fichier référencé et saisie en base, aucun 409 (R5, R19, UX).
- [ ] CA8 — 413 HTML sur l'envoi d'un fichier (interception) → message nginx de R7 ; 413 HTML sur un PUT de dossier → message inchangé (R7).
- [ ] CA9 — 10 485 760 octets acceptés, + 1 refusé ; type faux → 415 ; lecture : GET et HEAD 200, POST et DELETE 403, y compris par `%66ichiers` (R8, R9).
- [ ] CA10 — Repère dans un fichier : absent de la base, du WAL et des temporaires après retrait, après nettoyage (R6) et après suppression du candidat (R10).
- [ ] CA11 — Dépôt, retrait, lien, retrait de lien tracés dans l'historique, et seulement après un enregistrement réussi (R11).
- [ ] CA12 — Lecture : type, `nosniff`, `inline`, `no-store` ; sous un autre candidat → 404 (R12).
- [ ] CA13 — `METTRE-A-JOUR.md` § 5 et `README.md` § 7 contiennent l'étape et la directive ; l'introduction et le § 1 de `METTRE-A-JOUR.md` renvoient à « avant le merge » ; blocs du serveur `bash -n`, blocs du Mac `zsh -n` ; bloc nginx accepté par `nginx -t` sur le banc ; preuve `curl` jouée sur le banc (R13).
- [ ] CA14 — Les commandes de contrôle de `RESTAURER.md` passent sur une copie 1.9 (`fichiers=absente`) et une copie 1.10 (`fichiers=<n>`), sorties recopiées (R15).
- [ ] CA15 — Mode navigateur : aucun bouton de fichier ; dossier importé avec `cv: "javascript:alert(1)"` : aucun lien cliquable, aucun script exécuté (R16, R20).
- [ ] CA16 — Chaque point de R17 vérifié par un e2e ; ceux déjà couverts par les e2e de Léo ne demandent pas de nouveau test ; téléphone sans défilement horizontal et Notes à côté à 1360 px couverts (R17).
- [ ] CA17 — `npm test` (Node 22), `test-store`, `test-serveur`, les 5 e2e : verdicts recopiés ; seul le contrôle « départ de la page, PUT précédent lent » (1.10-3) peut échouer, et seulement s'il échoue aussi sur `main` ; `docker compose build` réussit (R18).
- [ ] CA18 — Messages du champ et bandeau annoncés, dépôt au clavier, focus rendu au champ (Accessibilité).

## Hypothèses et questions ouvertes
- Volume : quelques dizaines de candidats par an, 1 à 2 fichiers chacun ; la QA mesure la taille d'une copie (R14).
