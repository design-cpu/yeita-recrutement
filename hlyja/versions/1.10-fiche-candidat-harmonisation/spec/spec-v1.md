---
type: spec
version: 1.10
n: 1
statut: brouillon
modules: UX/UI, Accessibilité, Données, API et intégrations, Sécurité et conformité, Déploiement et compatibilité
date: 2026-10-28
---

# Spec v1 — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

> La branche de Léo, rejouée sur `main`, telle qu'elle doit fonctionner en production : création dans la fenêtre « Fiche du candidat », CV et portfolio en fichier ou en lien, étapes harmonisées.
> Ce que la spec ajoute à la branche : un CV n'est jamais orphelin ni dédoublé, la base reste lisible par la 1.9, le 413 de nginx est compris, le guide règle nginx.

## Contexte et objectif
Les recruteurs de Yeita (Peter, Thélo, Andrea, Pauline, Léo) suivent les candidats dans l'espace Candidatures. Léo a préparé une branche qui unifie la fiche du candidat, permet de déposer un CV ou un portfolio en fichier et harmonise les pages d'étapes. Elle a été écrite avant les versions 1.7 (sauvegardes), 1.8 et 1.9 (déploiement automatique). Objectif : la mettre en production sans casser le déploiement automatique, le retour arrière ni les sauvegardes, avec des fichiers toujours cohérents avec le dossier.

## Utilisateurs et parcours
Recruteur (rôle `recruteur` ou `admin`), lecteur (rôle `lecture`), administrateur du serveur.

### Créer un candidat
1. « Ajouter un candidat » ouvre la fenêtre « Fiche du candidat » en création (4 groupes : Identité, Contact, Documents, Suivi).
2. Le recruteur remplit au moins le nom ; il peut choisir un CV et un portfolio (fichier ou lien).
3. « Passer à l'appel de découverte » (principale) : le candidat est créé, ses fichiers envoyés, l'appel s'ouvre. « Enregistrer et revenir à la liste » : idem, la fenêtre se ferme.
Cas limites : nom absent ou e-mail invalide (message, champ marqué, rien n'est créé) ; envoi d'un fichier refusé ou en panne après la création (R3) ; double clic (un seul candidat).

### Déposer, remplacer, retirer un document
Depuis le bloc Infos de l'appel ou la fenêtre du menu ⋯ : « Déposer un fichier » (bouton ou glisser-déposer) ou « Coller un lien ». Rempli : nom, taille, « Ouvrir », « Retirer » (fichier) ; lien cliquable, « Modifier », « Retirer » (lien).
Cas limites : type ou taille refusés avant l'envoi ; refus par nginx ou par l'API ; conflit d'enregistrement (409) ; perte du réseau ; lecteur (aucune action).

### Supprimer un candidat
Menu ⋯ → Supprimer : le message signale que ses fichiers partent avec lui ; tout est effacé, y compris des fichiers bruts de la base.

### Mettre en production (administrateur)
Régler `client_max_body_size 10m` sur le nginx du serveur (cas A) avant le merge, puis le déploiement automatique de la 1.9 fait le reste ; un retour vers la 1.9 reste possible.

## Périmètre
### Inclus
- Tout ce que décrit la branche (liste du pitch, `version.md`), tel qu'il est codé, après correction des défauts P1 à P8 du cadrage.
- Les tests qui prouvent les règles ci-dessous ; la doc hlyja ; le guide nginx.

### Exclu
Reprend le « Hors périmètre » du cadrage : choix d'interface de Léo non rediscutés ; 1.10-1, 1.10-2, 1.10-3, 1.6-2 ; stockage hors SQLite, antivirus, aperçu ; fichiers en mode navigateur ; changement de `user_version` ; action sur le serveur réel ; `Claude outputs/`.

## Existant réutilisé
| Besoin | Décision | Élément | Référentiel |
|---|---|---|---|
| Table des fichiers | étendre | `appliquerSchema` (`api/src/base.js`) : ajout idempotent, `VERSION_SCHEMA` reste 1 | [API](../../../technique/api.md) |
| Routes, contrôles, effacement | réutiliser | `api/src/fichiers.js` (Léo), `secure_delete`, `pointDeControle` | [API](../../../technique/api.md) |
| Erreurs côté pages | étendre | `lire` et `MESSAGE_CODE` (`assets/adapter-serveur.js`) | [Mode serveur](../../../technique/mode-serveur.md) |
| Ordre dépôt / enregistrement | étendre | `deposer`, `retirer`, `validerLien`, `valider` (`candidatures/menu-candidat.js`) ; `S.saveCandidate`, `S.createCandidate` | [Mode serveur](../../../technique/mode-serveur.md) |
| Tests | étendre | `api/test/fichiers.test.js`, `base.test.js` ; `tools/e2e-serveur.py`, `e2e-candidatures.py`, `e2e-parcours.py` | [Conventions](../../../technique/conventions.md) |
| Sauvegarde, déploiement | réutiliser sans modification | `api/sauvegarde.js`, `deploy/backup.sh`, `deploy/auto-deploy.sh`, `deploy/deploy.sh` | [Architecture](../../../technique/architecture.md) |

## Règles et comportements
| # | Règle | Détail / valeurs |
|---|---|---|
| R1 | La table `fichiers` s'ajoute sans changer la version de la base | Ajout idempotent à l'ouverture de la base (neuve ou existante), sûr si deux processus ouvrent la base en même temps ; `user_version` reste 1 ; aucune donnée existante modifiée (V4, décision de l'utilisateur) |
| R1b | Base de test en `user_version` 2 (branche de Léo d'avant la reprise) | Refusée comme toute version plus récente ; le guide de test dit de supprimer ou recréer la base locale (décision de l'utilisateur, P1) |
| R2 | La 1.9 relit une base de la 1.10 | L'API de `main` (`b727ded`) démarre sur une base ouverte par la 1.10 ; la suppression d'un candidat par la 1.9 efface ses fichiers (`ON DELETE CASCADE`, clés étrangères actives, V17) |
| R3 | Création : un seul candidat, quoi qu'il arrive aux fichiers | Une fois le candidat créé, la fenêtre passe sur ce candidat : un nouveau clic sur une action du pied ne crée rien, il renvoie seulement les fichiers encore en attente puis fait l'action ; un fichier en échec est signalé sur son champ (raison et « Réessaie »), le candidat est déjà dans la liste ; le bouton est désactivé pendant l'envoi (V14) |
| R4 | Dépôt : le dossier ne pointe que vers un fichier présent | Ordre : envoi du nouveau fichier → enregistrement du dossier qui le référence → seulement alors retrait de l'ancien. Enregistrement en échec : le nouveau fichier est retiré de l'API (au mieux), le dossier garde l'ancien, message sur le champ (V14) |
| R5 | Retrait et remplacement par un lien : le fichier part après le dossier | Ordre : enregistrement du dossier sans le fichier (ou avec le lien) → retrait du fichier de l'API. Enregistrement en échec : rien n'est retiré, message. Retrait de l'API en échec : le fichier reste en base, non référencé (R6) |
| R6 | Fichier non référencé | Seuls les échecs du « au mieux » de R4 et R5 en laissent ; il n'est jamais affiché ni servi par les pages, reste lisible par son adresse pour l'équipe, et part avec le candidat (même rétention que le dossier). Aucun nettoyage automatique (hors périmètre, 1.10-2) |
| R7 | Messages d'erreur du dépôt | 413 sans corps JSON (nginx) → « Fichier trop volumineux (10 Mo maximum). » ; `fichier-trop-gros`, `type-fichier`, `introuvable` → message français fixe de `wording.fr.js` ; panne réseau → message réseau existant (V9, V13) |
| R8 | Accès | GET et HEAD (liste, fichier) : tous les membres actifs ; POST et DELETE : `recruteur`, `admin` ; décision sur la route reconnue par le routeur (V6) ; hors équipe : 403 |
| R9 | Contenu accepté | PDF (`%PDF-`), PNG (signature 8 octets), JPEG (`FF D8 FF`) vérifiés aux premiers octets, type annoncé égal au type reconnu ; 1 octet à 10 485 760 octets ; vide → 400 ; nom nettoyé (sans chemin, 120 caractères au plus, extension du type réel) (V5) |
| R10 | Effacement réel | Après retrait d'un fichier ou suppression du candidat, le contenu est absent de la base, du WAL et des fichiers temporaires, sans maintenance (V7) |
| R11 | Trace | Dépôt, retrait, lien posé, lien retiré : une ligne `type: "fichier"` dans l'historique du dossier (`action` `depot`, `retrait`, `lien`, `retraitLien`), avec le nom et l'auteur. Le journal du serveur n'en garde rien (V15) |
| R12 | Lecture d'un fichier | Type enregistré, `X-Content-Type-Options: nosniff`, `Content-Disposition: inline` avec le nom nettoyé, `Cache-Control: no-store` ; un fichier ne se lit que sous son candidat |
| R13 | nginx (cas A) | `client_max_body_size 10m;` dans le `server` du site : exemple de `deploy/README.md` § 7 et guide de mise en production ; étape « avant le merge » ; oauth2-proxy et Caddy ne limitent pas (V10, V11) |
| R14 | Sauvegardes | Les fichiers sont dans chaque copie (V8) ; la doc dit que la taille des copies croît avec eux et que la vérification du disque de la 1.7 couvre ce risque |
| R15 | Restauration | `deploy/RESTAURER.md` : la ligne de contrôle compte aussi `fichiers` ; le contrôle `user_version` reste 1 |
| R16 | Mode navigateur (sans API) | CV et Portfolio en lien seulement (aucun bouton de fichier) |
| R17 | Interface de Léo | Tel que décrit : fenêtre de création (2 actions), composant unique de la fiche (4 groupes ; 3, 2 puis 1 colonnes), largeur 1120 px, Notes à côté dès 1360 px et par-dessus en dessous, appel sans liens utiles, EC1 (section « Yeita Match », bouton du jeu en ligne en visio, feuille de décompte en présentiel, plus de « Liens et outils »), EC2 (icône de grille, palier sur une ligne, mention de séniorité, plus de « Liens et outils »), Bilans (partie interne en lecture sous la carte), plus de sélecteur d'État dans les étapes, noms tels que saisis (`equipeNoms` vide), initiales sur la carte du kanban, RGPD 22 mois (config, carte, page des étapes, one-pager) |
| R18 | Déploiement automatique | Le commit de la 1.10 passe les étapes de test de `auto-deploy.sh` (`test-store`, `npm test` dans l'image `node:22.23.4-slim`, `docker compose build`) sans modifier `auto-deploy.sh` ni `deploy.sh` |

## UX / UI
Écrans et états du champ CV / Portfolio :
| État | Affichage | Actions |
|---|---|---|
| Vide (mode serveur) | « Déposer un fichier », « Coller un lien », aide « ou glisse-le ici » | fichier, lien |
| Vide (mode navigateur) | « Coller un lien » | lien |
| Envoi en cours | message « Envoi de <nom>… », champ occupé | aucune (boutons désactivés) |
| Fichier | trombone, nom, taille (Ko / Mo), « Ouvrir » (nouvel onglet), « Retirer » | ouvrir, retirer |
| Lien | lien court cliquable, « Modifier », « Retirer » | modifier, retirer |
| Erreur | message sur le champ (R7), l'état d'avant reste affiché | celles de l'état d'avant |
| Lecture seule | fichier ou lien sans action ; vide : « Non renseigné » | ouvrir |

Ce que fait chaque commande pendant un envoi en cours (une seule opération par champ à la fois) :
| Commande | Pendant l'envoi | Après un échec | Après un succès |
|---|---|---|---|
| Déposer / glisser un autre fichier sur le même champ | ignoré | permis | permis (remplace, R4) |
| Retirer, Modifier le lien | indisponibles | permis | permis |
| Action du pied (création) | désactivée | « Réessayer » sans recréer (R3) | — |
| Fermer la fenêtre | permis ; l'envoi en cours se termine, le dossier est enregistré par R4 | permis | permis |

## Accessibilité
- « Déposer un fichier » est un vrai bouton qui ouvre le sélecteur ; le glisser-déposer n'est jamais le seul moyen.
- Les messages du champ (envoi, erreur, succès) sont annoncés (zone `aria-live` présente dans la page dès l'affichage du champ, pas masquée par `display:none`).
- Après un dépôt ou un retrait, le focus revient sur le champ (lien « Ouvrir » ou bouton « Déposer un fichier »).
- « Ouvrir » annonce le nom et « nouvel onglet » ; « Retirer » annonce le nom.

## Données
Table `fichiers` (Léo, inchangée) : `id` (`fic-` + 18 hex), `candidat_id` → `candidats(id)` `ON DELETE CASCADE`, `champ` (`cv`, `portfolio`), `nom` (1 à 120), `type` (3 valeurs), `taille` (> 0), `contenu` (BLOB), `depose_le`, `depose_par` ; index sur `candidat_id`. Dossier : `identite.fichiers = {cv, portfolio}`, chaque entrée `null` ou `{id, nom, type, taille, le, par}` ; `identite.cv` et `identite.portfolio` gardent un lien. Migration : R1, R1b ; aucune donnée existante modifiée. Rétention : celle du dossier (suppression manuelle ; 22 mois annoncés, purge : 1.10-2).

## API et intégrations
| Route | Entrée | Sortie | Erreurs |
|---|---|---|---|
| `POST /api/candidats/:id/fichiers?champ=cv\|portfolio` | corps brut du fichier, `Content-Type` du fichier, nom dans `X-Nom-Fichier` (`encodeURIComponent`) | 201 `{id, champ, nom, type, taille, deposeLe, deposePar}` | 400, 401, 403, 404 `introuvable`, 413 `fichier-trop-gros`, 415 `type-fichier`, 503 |
| `GET /api/candidats/:id/fichiers` | — | 200 liste des métadonnées | 400, 401, 403, 404 |
| `GET /api/candidats/:id/fichiers/:fid` | — | 200 le fichier (R12) | 400, 401, 403, 404 `fichier-introuvable` |
| `DELETE /api/candidats/:id/fichiers/:fid` | — | 204 | 400, 401, 403, 404 `fichier-introuvable`, 503 |
Les dossiers restent en JSON seul (1 Mo) ; un corps non JSON sur une autre route : 415.

## Sécurité et conformité
- Entrées non fiables : contenu (R9), nom (nettoyé, jamais utilisé comme chemin), identifiants (motifs), `champ` (liste fermée).
- Exposition : fichiers servis seulement par `/api/`, derrière oauth2-proxy ; jamais publiés avec le site.
- Données personnelles : même accès, même rétention et même effacement que le dossier (R6, R10) ; copies de sauvegarde chiffrées (1.7), gardées 30 jours sur le serveur (un CV effacé y reste jusqu'à 30 jours, comme un dossier effacé).

## Déploiement et compatibilité
| Commande | Code qui tourne | Base avant | Résultat attendu |
|---|---|---|---|
| Déploiement automatique de la 1.10 (`auto-deploy.sh`) | 1.10 | 1.9 (`user_version` 1, sans `fichiers`) | table créée, `user_version` 1, dossiers intacts (R1, R18) |
| Retour automatique (échec après la mise en ligne) | 1.9 | 1.10 | l'API démarre, candidats lisibles, fichiers ignorés (R2) |
| « Déployer ce commit » vers un commit 1.9 depuis la page | 1.9 | 1.10 | idem ; suppression d'un candidat → ses fichiers partent (R2) |
| Redéploiement de la 1.10 après un retour | 1.10 | 1.10 relue par 1.9 | table déjà là, rien ne change |
| Restauration d'une copie d'avant la 1.10 (`RESTAURER.md`) | 1.10 | copie 1.9 | contrôle `user_version=1` passe, table créée à l'ouverture |
| Restauration d'une copie 1.10 | 1.9 ou 1.10 | copie 1.10 | contrôle passe, `fichiers=<n>` affiché (R15) |
| Base de test de Léo (`user_version` 2) | 1.10 | v2 | refusée ; base locale à recréer (R1b) |
Prérequis avant le merge : R13 appliqué sur le serveur.

## Critères d'acceptation
- [ ] CA1 — Une base créée par `main` puis ouverte par la 1.10 a la table `fichiers` et `user_version` 1 ; ses dossiers sont intacts (R1).
- [ ] CA2 — L'API de `main` démarre sur une base ouverte par la 1.10, lit les candidats ; une suppression par `main` efface les fichiers du candidat (R2).
- [ ] CA3 — Une base `user_version` 2 est refusée avec le message existant ; le guide de test dit de recréer sa base locale (R1b).
- [ ] CA4 — Création avec un CV dont l'envoi échoue, puis second clic : un seul candidat, le CV envoyé au second essai, référencé par le dossier (R3).
- [ ] CA5 — Dépôt d'un CV pendant un enregistrement du dossier refusé (409) : le dossier garde l'ancien CV, qui existe toujours ; le nouveau n'est plus en base (R4).
- [ ] CA6 — Remplacement réussi d'un CV : l'ancien n'est plus en base, le nouveau est référencé (R4).
- [ ] CA7 — Retrait ou remplacement par un lien avec un enregistrement refusé : le fichier existe toujours et reste référencé (R5).
- [ ] CA8 — Fichier de 2 Mo derrière nginx sans réglage : message « Fichier trop volumineux (10 Mo maximum). » (R7).
- [ ] CA9 — Routes : 10 485 760 octets acceptés, + 1 refusé (413) ; type faux, contenu d'un autre type → 415 ; lecture : GET et HEAD 200, POST et DELETE 403, y compris par `%66ichiers` (R8, R9).
- [ ] CA10 — Repère dans un fichier : absent de la base, du WAL et des temporaires après retrait, et après suppression du candidat (R10).
- [ ] CA11 — Dépôt, retrait, lien, retrait de lien tracés dans l'historique du dossier (R11).
- [ ] CA12 — Lecture d'un fichier : type, `nosniff`, `inline`, `no-store` ; sous un autre candidat → 404 (R12).
- [ ] CA13 — `deploy/README.md` § 7 et le guide de mise en production contiennent `client_max_body_size 10m;` ; les blocs du guide passent `zsh -n` (poste) et `nginx -t` (banc) (R13).
- [ ] CA14 — `deploy/RESTAURER.md` affiche `fichiers=<n>` et accepte une copie 1.9 et une copie 1.10 (R15).
- [ ] CA15 — Mode navigateur : aucun bouton de fichier (R16).
- [ ] CA16 — Chaque point de R17 est vérifié par un e2e ; ceux que les e2e de Léo couvrent déjà ne demandent pas de nouveau test ; le téléphone sans défilement horizontal et Notes à côté à 1360 px sont couverts (R17).
- [ ] CA17 — Suites complètes : `npm test` (Node 22), `test-store`, `test-serveur`, les 5 e2e, verdicts recopiés ; `docker compose build` réussit (R18).
- [ ] CA18 — Messages du champ annoncés, dépôt au clavier, focus rendu au champ (Accessibilité).

## Hypothèses et questions ouvertes
- Volume : quelques dizaines de candidats par an, 1 à 2 fichiers chacun (hypothèse) ; même à 10 Mo par fichier, les copies restent de l'ordre du Go.
- Le contrôle e2e « départ de la page » instable (1.10-3) est supposé préexistant sur `main` : la QA le confirme.
