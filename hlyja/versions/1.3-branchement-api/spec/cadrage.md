---
type: cadrage
version: 1.3
mode: complexe
type_version: livrable
sujet: integration-stockage-et-deploiement
modules: UX/UI, Contenu et textes, API et intégrations, Architecture technique, Sécurité et conformité, Déploiement et compatibilité, Exploitation
challengers: Technique front, Intégrateur API, Sécurité réseau et proxy, Données personnelles, Exploitation Docker, Recruteur
date: 2026-10-26
---

# Cadrage — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> Mode complexe, version livrable. La spec couvre 7 modules en plus du socle ; 6 challengers + l'arbitre.
> Inventaire : 6 pages, chacune lit le stockage dès la fin de son script ; 5 écoutes `storage` (dont une hors périmètre) ; les options de disponibilité et la liste de l'équipe sont lues de façon synchrone.
> 4 décisions de l'utilisateur avant la spec v1 : démarrage (mode navigateur sur 404 seul), messages, image Node figée, note d'impression des deux pages.

## Nature du sujet
Faire passer les six pages de `candidatures/` du stockage du navigateur à l'API de la v1.2, en un seul point (`DOSSIER.use`) et sans toucher à la logique métier. Puis mettre l'API en service dans la pile Docker, joignable par oauth2-proxy seulement. Ce qui compte : qu'aucune page ne lise avant que le mode soit choisi, qu'en production aucune donnée ne parte en silence dans le navigateur, qu'un conflit ou une session expirée soient compris par le recruteur, et que l'API ne soit jamais joignable autrement que par oauth2-proxy.

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | complexe | Recommandé et confirmé par l'utilisateur : sécurité (confiance dans `X-Forwarded-Email`), données personnelles, nouveau service Docker, nouvel adaptateur |
| Type | livrable | Destinée à être mergée puis déployée |

## Inventaire imposé par le pitch
Relevé par `grep` sur `main` (`0186993`), détail dans `verifications.md` V1.

### Points d'entrée au chargement
| Page | Scripts chargés (stockage, identité) | Ce qui s'exécute à la fin du script | Première lecture du stockage |
|---|---|---|---|
| `index.html` | `dossier.js`, `qui.js`, `store.js`, `ui.js` | `QUI.monter(#qui)` (l. 136), `UI.init(...)` (l. 140), `load()` (l. 309) | `load()` → `S.listCandidates()` (l. 217) |
| `candidat.html` | idem + `parcours-ui.js` | `QUI.monter(#qui)` (l. 69), `load()` (l. 419) | `load()` → `S.getCandidate(ID)` (l. 90) |
| `ec1.html` | idem + `parcours-ui.js` | `QUI.monter(#qui)` (l. 716), `DOSSIER.get(candId)` puis `boot()` (l. 799-813) | `DOSSIER.get(candId)` (l. 799) |
| `ec2.html` | idem + `parcours-ui.js` | `QUI.monter(#qui)` (l. 830), `DOSSIER.get(candId)` puis `boot()` (l. 868-878) | `DOSSIER.get(candId)` (l. 868) |
| `decompte.html` | `dossier.js`, `qui.js`, `store.js`, `ui.js` (pas de `QUI.monter`) | `DOSSIER.get(candId)` (l. 445), sinon feuille sans candidat | `DOSSIER.get(candId)` (l. 445) |
| `carte.html` | `dossier.js`, `qui.js`, `store.js`, `ui.js` (pas de `QUI.monter`) | `migrateCodes().then(refresh(qId))` (l. 585) | `migrateCodes()` → `DOSSIER.importCode` (l. 562), puis `DOSSIER.get` (l. 503) |
Synchrones au rendu : `QUI.equipe()` (`ui.js` l. 113, 172 : liste du champ Recruteurs), `QUI.ajouter` (`ui.js` l. 119), `S.dispos()` (`ui.js` l. 128), `S.addDispo()` (`ui.js` l. 182), `S.me()` → `QUI.moi()` (toutes les actions).

### Écoutes `storage`
| Page | Ligne | Clé | Effet | Dans le périmètre |
|---|---|---|---|---|
| `index.html` | 307 | `D.KEY` (`yeita-dossiers`) | `load()` | oui |
| `candidat.html` | 418 | `D.KEY`, si un dossier est ouvert et rien en attente d'enregistrement | relit le dossier, `render()` | oui |
| `ec2.html` | 881 | `yeita-dossiers` | `renderFrom1()` | oui |
| `carte.html` | 547 | `yeita-dossiers` ou `null` | `refresh(id)` | oui |
| `ec1.html` | 766 | `yeita-match-resultat` | `resultatDecompte()` | **non** (relais hors périmètre) |

### Accès au localStorage hors de `dossier.js` et `qui.js`
| Fichier | Clé | Usage | Décision |
|---|---|---|---|
| `store.js` l. 37, 109-116 | `yeita-options-disponibilite` | options ajoutées, lues et écrites de façon synchrone | passe par l'API en mode serveur (pitch) |
| `store.js` l. 270, 274 | `yeita-dernier-export` | date du dernier export | reste dans le navigateur (préférence de poste) |
| `index.html` l. 126-128 | `yeita-candidatures-ui` | vue tableau ou liste, tri | reste |
| `ec1.html` l. 329-334 | `yeita-fiche-ec1` | brouillon de la fiche sans candidat | reste (fiche sans dossier) |
| `ec1.html` l. 376, `ec2.html` l. 625 | `yeita-fiche-passation` | ancienne passation, lue une fois | reste |
| `ec1.html` l. 457-763, `decompte.html` l. 401 | `yeita-match-resultat` | relais feuille de décompte → fiche EC1 | reste (hors périmètre) |
| `ec2.html` l. 577-815 | `yeita-fiche-ec2` | brouillon de la fiche sans candidat | reste |
| `decompte.html` l. 247 | `yeita-match-decompte` | effacée au chargement | reste |
| `carte.html` l. 317-557 | `yeita-carte-identite` | état d'affichage, codes de l'ancienne carte | reste |
| `dossier.js` (`setCurrent`) | `yeita-dossier-courant` | dernier dossier ouvert | reste (préférence de poste) |
| `sessionStorage` (`candidat`, `ec1`, `ec2`) | `yeita-notice` | message d'une page à l'autre | reste |

## Périmètre
### Ce que le pitch demande
- L'inventaire ci-dessus, avant toute réalisation.
- `assets/adapter-serveur.js` : `list`, `get`, `put`, `remove` en `fetch` vers `/api/candidats`, version lue gardée par dossier ; messages de conflit, d'accès et de réseau ; un 401 recharge la page.
- `assets/demarrage.js` : `/api/moi` choisit le mode ; chaque page attend le démarrage avant sa première lecture.
- Mode serveur : `QUI.moi()` = prénom du compte, plus de liste « Qui es-tu ? », `QUI.equipe()` depuis `/api/equipe`, options de disponibilité par l'API, écoutes `storage` remplacées par une relecture au retour sur l'onglet (`visibilitychange`).
- Docker : `docker/api.Dockerfile`, service `api` sur un réseau `back` interne partagé avec `front` seulement, volume `recrutement_data` sur `/data`, caddy sans accès à l'api, jamais `DEV_EMAIL` ni `DEV_STATIC` ; oauth2-proxy : upstream `http://api:8000/api/`, `api_routes = ["^/api/"]`.
- `tools/check-site.sh` : `/api/moi` sans cookie → 401. `deploy/README.md` : gérer l'équipe avec `docker compose exec api node api/equipe.js`.
- La note d'impression qui renvoie vers « le site GitHub » : `carte.html` et, sur décision de l'utilisateur, `decompte.html`.
- Tests : les tests existants passent en mode navigateur ; un test de bout en bout du mode serveur (création puis rechargement, conflit entre deux navigateurs, rôle lecture, prénom sans liste).
- Fiches rattachées par l'utilisateur : 1.2-1 (port jamais publié, email dans l'en-tête ; l'essai avec un vrai compte Google reste manuel), 1.2-2 (`.dockerignore`), 1.2-3 (réponses non JSON, 404 sans `code`, `upgrade()` à la lecture, identifiant hors format ; sans la migration).

### Hors périmètre
- Le bandeau « Données fictives » ; le relais `yeita-match-resultat` ; les règles de `store.js` ; le temps réel ; les sauvegardes (1.2-5) ; toute évolution de l'API au-delà de ce que le branchement exige.
- La migration des dossiers du localStorage vers l'API (exclue par l'utilisateur) : les données du navigateur restent où elles sont.
- Les autres liens vers l'ancien site GitHub Pages (carte de l'inventaire du guide, `index.html` l. 431) : 1.1-1.
- 1.2-6 (propriétaire de la base pour `equipe.js`), 1.2-8 (`@fastify/static` importé en production), 1.2-9 (ligne abîmée → 500), 1.1-5 (durée de session), 1.1-8 (images sans digest pour front et caddy).
- L'essai avec un vrai compte Google (H1) : manuel, au guide de test.

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Point de branchement du stockage | `DOSSIER.use(a)`, `DOSSIER.adapter()` (`assets/dossier.js`) | réutiliser | [API](../../../technique/api.md) |
| Mise à niveau des dossiers lus | `DOSSIER.upgrade` (appliqué par `LocalAdapter.list/get`) | réutiliser | — |
| Forme de l'adaptateur, versions gardées, messages | `git show a86b6f4:assets/adapter-supabase.js` | s'inspirer | [Décisions](../../../technique/decisions.md) |
| Contrat HTTP | `api/README.md` § Contrat HTTP, § Correspondance avec l'adaptateur | réutiliser | [API](../../../technique/api.md#routes) |
| Identité | `assets/qui.js` (`moi`, `equipe`, `ajouter`, `monter`, `onChange`) | étendre | — |
| Options de disponibilité | `STORE.dispos`, `STORE.addDispo` ; `GET`/`POST /api/options-disponibilite` | étendre (source des ajouts) | [API](../../../technique/api.md#routes) |
| Messages éphémères | `YEITA.flash` | réutiliser | — |
| Image et pile | `docker/front.Dockerfile`, `compose.yaml`, `deploy/oauth2-proxy.cfg`, `.dockerignore`, étiquette `fr.yeita.projet=recrutement` | étendre | [Architecture](../../../technique/architecture.md) |
| Contrôle du site | `tools/check-site.sh` (`controle <chemin> <code>`) | étendre | [Architecture](../../../technique/architecture.md#scripts) |
| Tests de bout en bout | `tools/e2e-*.py` (Playwright Python, conteneur `playwright/python:v1.63.0-noble`) | réutiliser l'outillage | [Conventions](../../../technique/conventions.md#tests) |
| Mode local de l'API | `DEV_STATIC` (sert le site), en-tête `X-Forwarded-Email` | réutiliser pour le test du mode serveur | [API](../../../technique/api.md#configuration-apisrcconfigjs) |

## Modules de la spec
| Module | Retenu | Raison |
|---|---|---|
| Socle | oui | Toujours présent |
| Valeur et business | non | Pas d'enjeu commercial ; le gain (stockage partagé) est l'objet du pitch |
| Mesure du succès | non | Rien à mesurer au-delà des critères d'acceptation |
| UX / UI | oui | Prénom sans liste, attente du démarrage, messages d'accès, de réseau et de conflit, relecture au retour sur l'onglet |
| Design system | non | Aucun composant visuel nouveau ; classes existantes |
| Accessibilité | non | Pas de nouvel écran ; les messages réutilisent `role="status"` / `alert` existants (vérifiés au module UX/UI) |
| Contenu et textes | oui | Textes exacts des messages (décision de l'utilisateur), note d'impression |
| Données | non | Aucun modèle ni table nouveaux ; le dossier passe tel quel |
| API et intégrations | oui | Usage du contrat HTTP de l'API par l'adaptateur, le démarrage, `QUI` et les options |
| Architecture technique | oui | Démarrage, adaptateur, nouveau service Docker, réseaux |
| Sécurité et conformité | oui | Seul oauth2-proxy joint l'API, en-tête d'identité, rôles, données personnelles dans le navigateur et les journaux |
| Performance et fiabilité | non | Volume faible (une équipe) ; la seule attente ajoutée est le démarrage, couverte par UX/UI |
| Déploiement et compatibilité | oui | Mode navigateur conservé, ordre de mise en service, retour arrière |
| Exploitation | oui | Healthcheck, volume, `equipe.js` dans le conteneur, `check-site.sh`, journaux |

## Jury
| Challenger | Initiale | Pourquoi | Grille (3 à 5 critères) |
|---|---|---|---|
| Technique front JS | F | Profil technique obligatoire : chargement asynchrone de pages sans framework | Attente du démarrage sur chaque page · Fidélité à la logique métier (aucune règle touchée) · Mode navigateur intact · Testabilité |
| Intégrateur API | A | Utilisateur du contrat HTTP de l'API | Correspondance méthode → route et codes · Versions gardées et conflits · Réponses d'oauth2-proxy (non JSON, 401, 502) · Cas de 1.2-3 |
| Sécurité réseau et proxy | S | Module Sécurité : confiance dans l'en-tête, réseaux Docker | Joignabilité de l'API · En-têtes et routes d'oauth2-proxy · Mode local impossible en production · Rôles et accès |
| Données personnelles | D | Dossiers de candidats en transit, en cache, dans les journaux | Ce qui reste dans le navigateur · Ce qui est journalisé · Repli silencieux · Effacement |
| Exploitation Docker | E | Modules Déploiement et Exploitation | Image et Dockerfile · Volume et droits · Healthcheck et redémarrage · Gestion de l'équipe et contrôles · Retour arrière |
| Recruteur | R | Profil utilisateur obligatoire (interface) | Compréhension de l'identité · Messages d'erreur et de conflit · Retour sur l'onglet · Continuité du travail en cours |
| Arbitre | — | Toujours présent | Juge la recevabilité des retours |

## Décisions demandées à l'utilisateur
Posées après les vérifications, avant la spec v1 (règle 1 des étonnements de la 1.1 : un essai contredisait le pitch).
1. **Démarrage quand `/api/moi` ne rend pas 200** (V10, V9 : 502 si l'API est arrêtée, 401 si la session a expiré ; à la lettre du pitch, les pages écriraient en silence dans le navigateur, en production). Réponse : **mode navigateur sur 404 seul** ; 401 → rechargement ; 403 → message d'accès ; 5xx, réseau ou réponse non JSON → message réseau ; dans ces trois cas, aucune donnée affichée ni écrite.
2. **Messages d'accès et de réseau** (V3 : absents de `MODELE.md`). Réponse : **texte `erreur` de l'API pour l'accès, message réseau de l'ancien adaptateur, les trois ajoutés à `MODELE.md`**.
3. **Image de l'API** (V13 : `node:22-slim` = Node 22.23.4, correctif de sécurité du 2026-10-20, moins de 14 jours). Réponse : **`node:22.23.4-slim` figée par son digest**, exception à la règle des 14 jours notée (comme Fastify en 1.2).
4. **Note d'impression de `decompte.html`** (V25 : même renvoi vers « le site GitHub »). Réponse : **corrigée aussi**.
