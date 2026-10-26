---
type: technique
page: mode-serveur
titre: Mode serveur des pages (démarrage, adaptateur, identité)
maj: 1.3
commit: e59d120
sources: assets/demarrage.js, assets/adapter-serveur.js, assets/dossier.js, assets/qui.js, assets/store.js, assets/wording.fr.js, assets/yeita.js, candidatures/index.html, candidatures/candidat.html, candidatures/ec1.html, candidatures/ec2.html, candidatures/decompte.html, candidatures/carte.html, tools/test-serveur.js, tools/e2e-serveur.py
date: 2026-10-26
---

# Mode serveur des pages (démarrage, adaptateur, identité)

> Comment les 6 pages de `candidatures/` choisissent où vivent les dossiers (API ou navigateur), avant toute lecture, et comment elles lisent et écrivent dans l'API sans écraser le travail des autres. Composants créés en v1.3 : `assets/demarrage.js`, `assets/adapter-serveur.js` ; étendus : `assets/qui.js`, `assets/store.js`, `assets/dossier.js`.

## Vue d'ensemble
```mermaid
flowchart LR
  P[Page] --> DM[demarrage.js : GET ../api/moi]
  DM -->|200 + prenom| S[mode serveur : AdaptateurServeur, QUI.compte, options de l'API]
  DM -->|404 hors production, file:| N[mode navigateur : LocalAdapter, QUI local]
  DM -->|401| R[rechargement, une fois]
  DM -->|reste| B[mode bloqué : bandeau, rien n'est lu ni écrit]
```
Ordre des scripts dans chaque page : … `dossier.js`, `config.js`, `wording.fr.js`, `qui.js`, `store.js`, `adapter-serveur.js`, `demarrage.js`, … `ui.js`, script de la page.

## `assets/demarrage.js` — `window.DEMARRAGE`
| Membre | Rôle |
|---|---|
| `pret` | promesse résolue au choix du mode serveur ou navigateur ; jamais résolue en mode bloqué |
| `mode()` | `"attente"`, `"serveur"`, `"navigateur"`, `"bloque"` |
| `auRetour(fn)` | `fn()` à chaque `visibilitychange` vers `visible`, en mode serveur seulement |
| `erreur(message, cas)` | bandeau `.notice.err.demarrage-bandeau`, `role="alert"`, collant (`position:sticky`), inséré en tête du `<body>` ; bouton « Recharger » (`location.reload()`) sauf `cas.code === "lecture-seule"` ; phrase « saisie non enregistrée » si `cas.ecriture` ; remplace le précédent |
| `effacer()` | retire le bandeau |

Au chargement : `D.use(adaptateur d'attente)` (chaque méthode attend `pret` puis délègue), `QUI.attente()`, `STORE.sourceDispos(mémoire)`.

| Réponse de `/api/moi` (dans cet ordre) | Effet |
|---|---|
| `location.protocol === "file:"` | navigateur, sans requête |
| rien en `window.DEMARRAGE_DELAI` (10 000 ms) | bloqué, message réseau |
| `fetch` rejeté | bloqué, réseau |
| 404 (corps non lu) | navigateur, sauf si `hoteDeProduction()` → bloqué, réseau |
| 401 | `sur401()` |
| 200 JSON avec `prenom` non vide | `serveur(moi)` |
| 200 sans `prenom` | bloqué, réseau |
| erreur `hors-equipe` | bloqué, « Tu ne fais pas partie de l'équipe. » |
| autre (non JSON, 5xx, JSON sans `code`) | bloqué, message de `AdaptateurServeur.lire` |

| Fonction | Règle |
|---|---|
| `hoteDeProduction()` | `nom(new URL(YEITA.SITE).hostname) === nom(location.hostname)`, `nom` = minuscules, points finaux retirés ; exception → `true` |
| `sur401()` | `sessionStorage` `yeita-rechargement-401` : horodatage de moins de 60 s → bloqué, message de session ; sinon horodatage écrit puis `location.reload()` ; écriture impossible → bloqué, session ; rend une promesse jamais résolue |
| `serveur(moi)` | `GET ../api/equipe` et `../api/options-disponibilite` ; un 401 → `sur401` ; autre que 200 avec un tableau → bloqué ; sinon `D.use(AdaptateurServeur({sur401, surErreur}))`, `D.onRefus`, `QUI.compte(moi, prénoms)`, `STORE.sourceDispos({ajouts, ajouter})` (POST, la réponse remplace la liste), mode `serveur`, `pret` résolue |
| `navigateur()` | `D.use(LocalAdapter)`, `D.onRefus` (bandeau), `QUI.local()`, `STORE.sourceDispos(null)`, `pret` résolue |

## `assets/adapter-serveur.js` — `window.AdaptateurServeur(opts)`
`opts` : `base` (`"../api/"`), `sur401()`, `surErreur(erreur)`, `fetch` (tests). Rend `{name: "serveur", volatile: false, list, get, put, remove, partir, enVol, version}`.

| État interne | Contenu |
|---|---|
| `parObjet` (`WeakMap`) | objet dossier → version lue ou écrite |
| `parId` | id → plus haute version reçue |
| `supprimes` | id supprimés depuis cette page |
| `enCours` | id → `{objet, version}` du PUT en cours |
| `files` | id → dernière requête de la file (les requêtes d'un même id partent l'une après l'autre) |

| Méthode | Comportement |
|---|---|
| `list()` | `GET ../api/candidats` (hors file) ; chaque `data` passe par `DOSSIER.upgrade` ; versions retenues |
| `get(id)` | id hors `MOTIF_ID` (`^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$`) → `null` sans requête ; 200 → `upgrade(data)` ; `introuvable` ou 400 → `null` ; autre → rejet |
| `put(d)` | id hors motif → rejet `identifiant` (« Identifiant invalide pour « {nom} » … ») sans requête ; id supprimé → rejet `conflit` sans requête ; version = `parObjet(d)`, sinon `parId[id]`, sinon `null`, lue au départ de la requête ; 200/201 → version retenue, rend `d` |
| `remove(id)` | hors motif → `null` ; 204 ou `introuvable` → id retenu comme supprimé |
| `partir(d, base)` | `keepalive`, hors file ; version = celle du PUT en cours + 1 si `base` est son objet, sinon `parObjet(base)`, sinon `null` ; jamais la plus haute par id (revue v1.3, Q1) |
| `enVol(id)` | objet du PUT en cours, ou `null` |
| `AdaptateurServeur.lire(res)` | classement : 401 → `{type: "401"}` ; 204 → ok ; `Content-Type` sans `application/json` → `reseau` ; JSON illisible → `reseau` ; ok → `{type: "ok", json}` ; JSON avec `code` → erreur de ce code (texte de `wording` pour `conflit`, `hors-equipe`, `lecture-seule`) ; sans `code` → `api`, texte `erreur` |
| `AdaptateurServeur.texte(cle, vars)` | texte de `WORDING.serveur`, repli interne |
Tout rejet (hors 401) appelle `surErreur(e)` puis rejette ; `e.ecriture` vaut `true` pour `put` et `remove` ; un 401 appelle `sur401()` et ne se résout pas. Aucune nouvelle tentative.

## `assets/dossier.js` (étendu)
| Fonction | Rôle |
|---|---|
| `DOSSIER.ecrirePartie(d, {lire, poser})` | relit `d.id` ; vide → refus `conflit` ; `JSON.stringify(lire(relu))` ≠ celui de `lire(d)` → refus ; sinon `poser(relu)`, `save(relu)` ; sur 409, une seule nouvelle tentative avec le même contrôle ; refus : `e.code = "conflit"`, `e.ecriture`, `DOSSIER.onRefus(e)` |
| `DOSSIER.partir(d)` | `touch(upgrade(d))`, `adapter.partir(d, d)` ou `put` |
| `DOSSIER.partirPartie(base, poser)` | socle = `adapter.enVol(base.id)` ou `base` ; copie, `poser`, `adapter.partir(copie, socle)` |
| `DOSSIER.onRefus` | posé par le démarrage (bandeau), dans les deux modes |

## `assets/qui.js` (étendu)
| État | `moi()` | `equipe()` | `ajouter(nom)` | `monter(el)` |
|---|---|---|---|---|
| `local` (défaut) | `yeita-recruteur` | `YEITA_CONFIG.equipe` + `yeita-equipe-ajouts` | localStorage | liste « Qui es-tu ? » |
| `attente` (`QUI.attente()`) | `""` | — | mémoire de la page | vide |
| `compte` (`QUI.compte(moi, prenoms)`) | `moi.prenom` | prénoms de `/api/equipe` + ajouts de la page | mémoire de la page | `<span class="qui-compte">` « Connecté·e : {prénom} » + « · lecture seule » si `role === "lecture"` |
`choisir()` ne fait rien hors de l'état `local`. `monter` se redessine à chaque changement d'état (`emit`).

## `assets/store.js` (étendu)
`STORE.sourceDispos(src)` : `src = {ajouts(), ajouter(libelle)}` ou `null` (localStorage `yeita-options-disponibilite`). `dispos()` et `addDispo()` gardent leurs règles (base `D.DISPOS` + ajouts, sans doublon, synchrones).

## Pages
| Page | Première lecture | Retour sur l'onglet | Écriture |
|---|---|---|---|
| `index.html` | `DEMARRAGE.pret.then(load)` ; en mode serveur, `label` de « Remplacer tout » retiré | relit la liste, redessine si `id@modifieLe` change | `store.js` (inchangé) |
| `candidat.html` | `DEMARRAGE.pret.then(load)` | relit si ni enregistrement en attente, en cours ou refusé, ni formulaire de refus ouvert, ni champ actif dans `#body` ; redessine si `meta.modifieLe` change ; retire le bandeau | dossier entier ; « Non enregistré » dans `#saved` sur refus ; `pagehide` → `D.partir(cur)` |
| `ec1.html`, `ec2.html` | `DEMARRAGE.pret.then(get)` | `ec2` : `renderFrom1()` | `ecrirePartie` : `{fiches.ec1, ec1}` / `{fiches.ec2, ec2}` ; « Non enregistré » dans `renderExits` ; `pagehide` → `partirPartie(cand, …)` |
| `decompte.html` | `DEMARRAGE.pret.then(get)` (avec `?id=`) | — | `ecrirePartie` : `fiches.decompte` ; `pagehide` → `partirPartie` |
| `carte.html` | `pret`, puis `migrateCodes()` seulement hors mode serveur, puis `refresh` | relit, redessine si `meta.modifieLe` change | `store.js`, `setRestitution` |
Les écoutes `storage` existantes restent (mode navigateur).

## Textes (`assets/wording.fr.js`)
`qui.connecte` « Connecté·e : », `qui.lectureSeule` « · lecture seule » ; `serveur` : `conflit`, `horsEquipe`, `lectureSeule`, `reseau`, `session`, `identifiant`, `saisie`, `nonEnregistre`, `recharger`, `exportTexte`. `YEITA.SITE` = `https://recrutement.yeita.fr/` (`assets/yeita.js`).

## Stockage du navigateur en mode serveur
Rien n'est écrit dans `yeita-dossiers`, `yeita-equipe-ajouts`, `yeita-recruteur`, `yeita-options-disponibilite`. Restent : `yeita-dossier-courant` (un identifiant), `yeita-candidatures-ui`, `yeita-carte-identite`, `yeita-match-resultat` (relais hors périmètre), `sessionStorage` `yeita-notice`, `yeita-rechargement-401`.

## Tests
`node tools/test-serveur.js` (81 vérifications, fausse API, contexte `vm` comme `tools/test-store.js`) ; `tools/e2e-serveur.py` (37 vérifications, API réelle) : voir [Conventions](conventions.md#tests).

## Voir aussi
- [API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Décisions](decisions.md)
- Contrat : `docs/backend/MODELE.md`

## Historique
| Version | Changement |
|---|---|
| 1.3 | Création : démarrage, adaptateur serveur, identité et options en mode serveur, écriture des fiches par partie |
