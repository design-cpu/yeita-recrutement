---
type: revue-doc
version: 1.3
pages: 8
erreurs: 13
corrigees: 13
vues: 7
date: 2026-10-26
---
# Revue de la documentation — version 1.3

> 8 pages relues contre le code de `bc30632` (aucun commit de code depuis le `commit: 6cd5776` des sources : `git log 6cd5776..HEAD` sur les `sources` est vide). Les sources sont justes sur l'essentiel (démarrage, adaptateur, classement des réponses, Compose, oauth2-proxy, image, scripts, textes, nombres de tests rejoués : `node tools/test-serveur.js` → `TOUT OK (81 vérifications)`). 13 erreurs, dont **1 majeure qui est un écart du code à la spec** : `ec2.html` n'affiche pas « Non enregistré » sur un refus (R11b), alors que `mode-serveur.md` l'affirme. Les autres sont des oublis de mise à jour v1.3 (`docker-local.md`, `conventions.md`, `.dockerignore` dans `architecture.md`), un frontmatter incomplet et des détails. 7 vues humaines écrites.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| `technique/mode-serveur.md` § Pages | **Majeur.** La ligne `ec1.html`, `ec2.html` dit « « Non enregistré » dans `renderExits` » pour les deux. Faux pour `ec2.html` : `renderExits` (l. 847-853) n'utilise pas `refuse` (posé l. 593) et affiche toujours l'heure ou « enregistrement automatique ». C'est un écart du code à R11b (« l'indicateur … des pages qui en ont un (`candidat`, `ec1`, `ec2`) affiche « Non enregistré » ») ; ni `test-serveur.js` ni `e2e-serveur.py` ne le vérifient sur `ec2` (seul `#saved` de `candidat.html`, l. 139). | Corriger le code de `ec2.html` comme `ec1.html` (l. 781 : `refuse ? UI.t("serveur.nonEnregistre") : …`) et ajouter la vérification ; à défaut, écrire l'écart dans la doc (`ec1` seul) et au bilan. | corrige |
| `technique/mode-serveur.md` § Vue d'ensemble | Ordre des scripts donné comme unique : « … `dossier.js`, `config.js`, `wording.fr.js`, `qui.js` … ». `index.html` et `candidat.html` chargent `config.js` et `wording.fr.js` **avant** `dossier.js` (`grep -o 'src=…' candidatures/*.html`) ; les `data-*.js` varient selon la page. | « `config.js` et `wording.fr.js` avant `qui.js` ; puis `dossier.js` … `qui.js`, `store.js`, `adapter-serveur.js`, `demarrage.js`, … `ui.js`, script de la page (l'ordre des `data-*.js` varie) ». | corrige |
| `technique/mode-serveur.md` § Stockage du navigateur en mode serveur | La liste « Restent » omet `yeita-dernier-export` : `STORE.exportAll` l'écrit aussi en mode serveur (`assets/store.js` l. 275 ; une date, pas de contenu). | Ajouter `yeita-dernier-export` (date du dernier export) à « Restent ». | corrige |
| `technique/mode-serveur.md` (couverture) | `wirePrint` (`assets/yeita.js`) préfixe désormais `candidatures/` au lien « Ouvrir sur le site » des pages de `candidatures/` ; non dit (seul `YEITA.SITE` l'est). | Une phrase dans § Textes : « `wirePrint` : lien `SITE + "candidatures/" + page` pour les pages de `candidatures/` ». | corrige |
| `technique/architecture.md` § Image `front` | Le contexte filtré par `.dockerignore` liste « `.git`, `hlyja`, `_site`, `.env*`, `*.swp`, `*~` » : manquent les ajouts v1.3 `api/node_modules`, `api/data`, `**/*.sqlite`, `**/*.sqlite-wal`, `**/*.sqlite-shm` (`.dockerignore`), qui valent pour les deux images. | Compléter la liste, ou la déplacer sous « Services Compose » en disant qu'elle vaut pour `front` et `api` (v1.3 pour les ajouts). | corrige |
| `technique/conventions.md` § Tests | `test-serveur.js` : « 81 vérifications, 5 s par vérification ». `ECHEANCE = 5000` (l. 5) est le délai **maximal** d'une vérification asynchrone ; la suite dure ~4 s au total (3,6 s au rapport QA). | « 81 vérifications (~4 s ; chaque vérification asynchrone échoue au-delà de 5 s) ». | corrige |
| `technique/conventions.md` § Tests | La ligne `tools/check-site.sh` dit encore « pages publiques en 200, pages protégées en 302 vers Google, `/ping` (v1.1) » : manque le 6e contrôle `/api/moi` → 401 (v1.3, `tools/check-site.sh` l. 44). | Ajouter « `/api/moi` en 401 (v1.3) ; 6 contrôles ». | corrige |
| `technique/conventions.md` § Tests | Le filtre de console de `e2e-candidatures.py` et `e2e-parcours.py`, modifié en v1.3 (B1, `03975ab` : erreur dont l'adresse finit par `/api/moi` écartée), n'est pas documenté ; c'est un écart à R37 (« sans modification »). Le verdict à lire (code de sortie 0 même en échec pour les 4 e2e historiques, `sys.exit` seulement dans `e2e-serveur.py` l. 253) ne l'est pas non plus. | Une phrase : « Les e2e en mode navigateur écartent la seule erreur de console `/api/moi` (404 attendu, v1.3) ; lire la dernière ligne (`ALL OK`), le code de sortie des 4 e2e historiques vaut 0 même en échec. » | corrige |
| `technique/docker-local.md` § Cas A | « `docker compose up -d` (seul `front` démarre) » : faux depuis v1.3, `front` et `api` démarrent (`compose.yaml`, `api` sans profil). | « `front` et `api` démarrent (pas `caddy`) ». | corrige |
| `technique/docker-local.md` § Tout arrêter | Ligne « Site » : « conteneurs `front` et `caddy` arrêtés et supprimés, réseau `recrutement_edge` supprimé » : manquent le conteneur `api` et le réseau `recrutement_back`. | « conteneurs `front`, `api` et `caddy` … réseaux `recrutement_edge` et `recrutement_back` supprimés ; volumes gardés (base comprise) ». | corrige |
| `technique/decisions.md` | Frontmatter `sources` : `assets/dossier.js` cité deux fois. Tableau : les 6 lignes v1.3 sont insérées avant la ligne v1.2 « Dépendances de moins de 14 jours » (ordre chronologique rompu). | Retirer le doublon ; déplacer les lignes 1.3 après la dernière ligne 1.2. | corrige |
| `doc/produit/stockage-partage.md` | Frontmatter sans `sources` ni `commit` (`documentation.md` : chaque page cite ses fichiers sources et son commit ; sans eux, le test de péremption ne peut pas jouer). Règle « Conflit » : « l'indicateur passe à « Non enregistré » » présenté comme général, vrai seulement sur la fiche candidat et la fiche EC1 (voir première ligne). | Ajouter `sources: assets/demarrage.js, assets/adapter-serveur.js, assets/dossier.js, assets/qui.js, assets/store.js, assets/wording.fr.js, assets/yeita.js, candidatures/index.html, candidatures/candidat.html, candidatures/ec1.html, candidatures/ec2.html, candidatures/decompte.html, candidatures/carte.html` et `commit` ; garder « Non enregistré » général seulement une fois `ec2.html` corrigé. | corrige |
| `glossaire.md` § Mode serveur | « Aussi : mode serveur. » répète le titre (la détection ignore déjà la casse) : ligne inutile. | Retirer la ligne, ou mettre une vraie variante (« base partagée » si elle est voulue). | corrige |

Non vérifiable ici : « Poids : ~418 Mo » de l'image `api` (`architecture.md`), pas de Docker sur le poste de relecture ; à relever sur le banc.

Vérifié conforme (échantillon) : classement des réponses de `/api/moi` et `AdaptateurServeur.lire` (ordre, 404 avant le corps, `hoteDeProduction`, garde 401 de 60 s, `DEMARRAGE_DELAI` 10 000 ms) ; état interne et méthodes de l'adaptateur (`MOTIF_ID`, `partir`, `enVol`, file par id) ; `ecrirePartie`, `partir`, `partirPartie` ; états de `QUI` ; `STORE.sourceDispos` ; textes `WORDING.serveur` et `qui` ; `YEITA.SITE` ; pages (`DEMARRAGE.pret`, `auRetour`, « Remplacer tout » retiré, `exportTexte`, `migrateCodes` hors mode serveur) ; `compose.yaml` (réseau `back`, volume `recrutement_data`, `api` sans `ports` ni `environment`) ; `docker/api.Dockerfile` (digest, `USER node`, `/data` 700, sonde) ; `oauth2-proxy.cfg` (`upstreams`, `api_routes`) ; `deploy.sh` (attente de `api` après le changement de commit) ; `check-site.sh` (6 contrôles) ; `equipe.js add|list|disable|role` ; `deploy/README.md` § 9b ; versions de `api/package.json` ; port 18765 et `DEV_EMAIL` de `e2e-serveur.py` ; aucun fichier de `api/src/` modifié.

## Couverture
| Élément (règle, composant…) | Page | Statut |
|---|---|---|
| R1, R2, R4, R4b (choix du mode, `file:`, 404 hors production, 10 s) | stockage-partage (Mode serveur, Mode navigateur, Jamais de repli silencieux) | couvert |
| R3 (équipe et options de l'API) | stockage-partage (Mode serveur) | couvert |
| R4c, R4e (attente, aucun enregistrement avant la réponse) | stockage-partage (Comment ça marche, Jamais de repli silencieux) | couvert |
| R4d (codes de l'ancienne carte non importés) | stockage-partage (Cas particuliers) | couvert |
| R6, R6f (pas de conflit avec soi-même) | stockage-partage | couvert |
| R6d (message « Identifiant invalide … ») | — | **manquant** (cas rare ; une ligne en Cas particuliers suffit) |
| R6e, CA21 (dossier supprimé : aucune recréation, bandeau) | stockage-partage (Chaque fiche écrit sa partie) | partiel : dit pour les fiches, pas pour la fiche candidat (refus « conflit ») |
| R6g, H5 (départ de la page, perte possible) | stockage-partage (Départ de la page) | couvert |
| R6h, R6i (fiches par partie, conflit, deux modes) | stockage-partage | couvert |
| R8 (session expirée, garde) | stockage-partage (Session expirée) | couvert |
| R11 (bandeau collant, « Recharger », aucun bouton pour un lecteur, focus gardé) | — | **partiel** : la doc produit cite les messages, pas le bandeau lui-même ; ajouter une règle « Bandeau d'erreur » |
| R11b (saisie non enregistrée, « Non enregistré ») | stockage-partage (Conflit) | couvert (voir l'erreur sur `ec2`) |
| R12, R13 (prénom du compte, « · lecture seule ») | stockage-partage (Identité, Lecture seule) | couvert |
| R12 (régression de `QUI.ajouter`) | stockage-partage (Recruteurs hors équipe) | couvert |
| R14 (options partagées) | stockage-partage | couvert ; échec d'ajout (bandeau, option gardée dans la page) **manquant**, mineur |
| R15, R15b (retour sur l'onglet, pas pendant une saisie) | stockage-partage | couvert |
| R16 (mode navigateur inchangé) | stockage-partage | couvert |
| R17, R18 (fusion seule, texte d'export) | stockage-partage (Import en mode serveur) | couvert |
| R31 (comment un compte entre dans l'équipe) | — | partiel : rien côté utilisateur (« demander à un admin ») ; détail au README et dans `api.md` |
| R32 (coupure de ~15 s, données des navigateurs H4) | stockage-partage (Cas particuliers) | couvert |
| R35, R36 (notes d'impression, lien vers le site) | stockage-partage (Impression) | couvert |
| H3 (exemples fictifs en base) | stockage-partage (Cas particuliers) | couvert |
| R22-R30, R33, R34 (Docker, oauth2-proxy, déploiement) | architecture, decisions, docker-local | couvert (exploitant, hors doc produit) |
| R37, R38 (tests) | conventions | couvert, sauf le filtre de console (voir erreurs) |
| R40 (`MODELE.md`) | mode-serveur, stockage-partage (Voir aussi) | couvert par renvoi |
| Composant `assets/demarrage.js` | mode-serveur | couvert |
| Composant `assets/adapter-serveur.js` | mode-serveur | couvert |
| `assets/dossier.js` (`ecrirePartie`, `partir`, `partirPartie`, `onRefus`) | mode-serveur | couvert |
| `assets/qui.js` (`attente`, `local`, `compte`), `assets/store.js` (`sourceDispos`) | mode-serveur | couvert |
| `assets/wording.fr.js` (`serveur`, `qui.connecte`, `qui.lectureSeule`) | mode-serveur | couvert |
| `assets/yeita.js` (`SITE`, `wirePrint`) | mode-serveur | partiel (`wirePrint`) |
| Fichier `docker/api.Dockerfile` | architecture, conventions | couvert |
| Fichier `.dockerignore` (ajouts v1.3) | architecture | **partiel** (voir erreurs) |
| `compose.yaml` (service `api`, réseau `back`, volume) | architecture, docker-local | couvert |
| `deploy/oauth2-proxy.cfg` (`upstreams`, `api_routes`) | architecture | couvert |
| `deploy/deploy.sh` (attente de l'api) | architecture | couvert |
| `tools/check-site.sh` (6e contrôle) | architecture, docker-local | couvert ; conventions **non à jour** |
| `tools/test-serveur.js`, `tools/e2e-serveur.py` | conventions, mode-serveur | couvert |
| `tools/e2e-candidatures.py`, `tools/e2e-parcours.py` (filtre `/api/moi`) | — | **manquant** |
| Routes consommées (`/api/moi`, `/api/equipe`, `/api/options-disponibilite` GET et POST, `/api/candidats`, `/api/sante`) | api (Consommateurs) | couvert |
| Image `node:22.23.4-slim@sha256:de170b…` | architecture (Stack), decisions | couvert |
| `deploy/README.md` § 9b (mise en service, contrôle réseau) | decisions, architecture | couvert par renvoi |

## Vues humaines écrites
- `hlyja/technique/mode-serveur.humain.md` (créée) : choix du mode, bandeau, adaptateur, fiches par partie, départ de la page, identité, pages.
- `hlyja/doc/produit/stockage-partage.humain.md` (créée) : travail à plusieurs, conflit, règles en clair, cas particuliers. « Non enregistré » écrit pour la fiche candidat et la fiche EC1 (état du code) : à élargir quand `ec2.html` sera corrigé.
- `hlyja/technique/architecture.humain.md` (réécrite) : deux images, trois conteneurs et deux réseaux, volume, scripts, environnements.
- `hlyja/technique/api.humain.md` (réécrite) : l'API en service, qui l'appelle, droits, versions, équipe par `docker compose exec`.
- `hlyja/technique/conventions.humain.md` (réécrite) : deux nouveaux tests, erreur de console attendue, verdict à lire.
- `hlyja/technique/decisions.humain.md` (réécrite) : tableau complet, les six décisions v1.3 expliquées.
- `hlyja/technique/docker-local.humain.md` (réécrite) : API dans la pile, 6 contrôles, `--volumes` qui efface la base, s'ajouter à l'équipe pour une vraie connexion.
Les vues décrivent le code actuel ; elles évitent les points en erreur ci-dessus (ordre des scripts, `ec2`, cas A), donc aucune reprise n'est nécessaire après la correction des sources, sauf l'élargissement de « Non enregistré ».

## Glossaire
Les six termes ajoutés (Bandeau d'erreur, Mode serveur, Mode navigateur, Mode bloqué, Réseau interne, Volume) sont justes et simples, et conformes au code (`compose.yaml` : `internal: true`, `inhibit_ipv4` ; volume `recrutement_data`, seule copie). Seule remarque : « Aussi : mode serveur. » en double (voir erreurs). Aucun terme nouveau à ajouter : les vues humaines n'emploient que des termes déjà définis (API, oauth2-proxy, Caddy, conflit d'écriture, volume, réseau interne…) ou expliqués sur place.

## Corrections (orchestrateur)
Les 13 erreurs sont corrigées : l'erreur 1 dans le code (`ec2.html`, « Non enregistré » sur refus, `3b314a9` précédé de son commit ; vérification ajoutée à `tools/e2e-serveur.py`, mutation détectée), les erreurs 2 à 13 dans les sources (`mode-serveur`, `architecture`, `conventions`, `docker-local`, `decisions`, `stockage-partage`, glossaire). Couverture complétée dans `doc/produit/stockage-partage.md` : bandeau d'erreur (R11), « Identifiant invalide » (R6d), échec d'ajout d'une option (R14), dossier supprimé (R6e), entrée dans l'équipe (R31). Vue humaine produit : « Non enregistré » élargi à la fiche EC2. Champs `commit` des pages : `3b314a9`.
