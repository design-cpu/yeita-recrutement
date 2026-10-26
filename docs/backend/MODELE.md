# Modèle de données · dossier candidat v3

Pour Sacha : ce que l'espace Candidatures enregistre, et comment le passer en SQLite. Ce fichier fait foi pour les tables. Le code de référence est `assets/dossier.js` (modèle et migration) et `assets/store.js` (règles du parcours).

## Le contrat avec le stockage

- **Interface inchangée.** Les pages passent toutes par un adaptateur à quatre méthodes, en promesses :

  | Méthode | Rôle |
  |---|---|
  | `list()` | Tous les dossiers, du plus récent au plus ancien (`meta.modifieLe`) |
  | `get(id)` | Un dossier, ou `null` |
  | `put(dossier)` | Crée ou remplace le dossier entier, le rend tel qu'enregistré |
  | `remove(id)` | Supprime le dossier (demande d'effacement comprise) |

- **Le branchement** (v1.3) se fait en un point : `assets/demarrage.js`, chargé par chaque page après `dossier.js`, `qui.js`, `store.js` et `assets/adapter-serveur.js`, appelle `/api/moi` :
  - 200 : `DOSSIER.use(AdaptateurServeur())` (mode serveur) ;
  - 404 hors du site de production, ou page ouverte en `file://` : l'adaptateur du navigateur reste (mode navigateur) ;
  - tout le reste (401 deux fois de suite, 403, 5xx, réponse non JSON, pas de réponse en 10 s, 404 sur `recrutement.yeita.fr`) : rien n'est lu ni écrit, un bandeau dit pourquoi.
  Chaque page attend `DEMARRAGE.pret` avant sa première lecture ; jusque-là, un adaptateur d'attente retient les appels.
- **La migration à la lecture** est faite par `DOSSIER.upgrade()`, appliquée par les deux adaptateurs dans `list()` et `get()`.
- **Les conflits.** Version optimiste (colonne `version` de l'API). L'adaptateur serveur retient la version lue de chaque dossier (par objet, et par identifiant la plus haute reçue) et fait partir l'une après l'autre les requêtes d'un même dossier. Un enregistrement fait sur une version dépassée est refusé (409) ; il n'est jamais retenté seul.
- **Les fiches** (EC1, EC2, feuille de décompte) n'écrivent que leur partie, sur le dossier relu (`DOSSIER.ecrirePartie`) : la fiche EC1 et la feuille de décompte d'un même candidat peuvent être ouvertes ensemble. Si la même partie a changé ailleurs, ou si le dossier a été supprimé, rien n'est écrit.
- **Les messages** (`assets/wording.fr.js`, clé `serveur`) :

  | Cas | Message |
  |---|---|
  | Conflit (409) | La candidature a été modifiée par quelqu'un d'autre. Recharge la page. |
  | Hors équipe (403) | Tu ne fais pas partie de l'équipe. |
  | Lecture seule (403) | Lecture seule : tu ne peux pas modifier. |
  | Réseau (5xx, réponse non JSON, pas de réponse) | La base ne répond pas. Vérifie ta connexion, puis réessaie. |
  | Session (401 juste après un rechargement dû à un 401) | Ta session n'a pas pu être vérifiée. Ferme l'onglet, puis rouvre le site. |

  Un 401 recharge la page (oauth2-proxy renvoie vers Google), une fois.
- **Le départ de la page** (`pagehide`) envoie la dernière saisie aussitôt, sans relire, avec `keepalive`. Risque accepté : si quelqu'un (ou une autre page) a enregistré le même dossier juste avant, ou si cet envoi arrive à l'API avant un enregistrement encore en cours, il est refusé et la page n'est plus là pour le dire : les 300 à 400 dernières millisecondes de saisie sont alors perdues.
- **L'identité.** Elle passe par `assets/qui.js` :
  - `QUI.moi()` rend le prénom de la personne qui agit : en mode serveur, celui du compte connecté (table `equipe`) ;
  - `QUI.monter()` affiche, en mode serveur, « Connecté·e : <prénom> » (« · lecture seule » pour le rôle `lecture`), sans liste ;
  - `QUI.equipe()` rend, en mode serveur, les prénoms de `/api/equipe`. Un nom ajouté dans le champ Recruteurs ne vaut plus que pour la page (avant : gardé dans le navigateur) ; il reste dans le dossier.
- **Les copies.** En mode serveur, un export est une copie hors de l'effacement : la supprimer après usage. Un import « Fusion » d'un ancien export peut recréer un dossier supprimé depuis. « Remplacer tout » n'est pas proposé en mode serveur (il supprimerait les dossiers de toute l'équipe absents du fichier).

## Les adresses de l'espace

- **Tout est dans `candidatures/` :**
  - `index.html` : le tableau ;
  - `candidat.html?id=<id>&etape=<étape>` : le parcours (appel, bilans, EC3, décision, proposition, onboarding, sorties) ;
  - `ec1.html?id=<id>` et `ec2.html?id=<id>` : les étapes EC1 et EC2, la fiche en pleine page ;
  - `carte.html?id=<id>` : la carte d'identité de ce candidat, `&imprimer=1` lance l'impression ou le PDF ; sans identifiant, l'exemple fictif (`?exemple=ec1|ec2|embauche`) ;
  - `decompte.html?id=<id>` : la feuille de décompte de ce candidat ; `?vierge=1` : la feuille vierge à imprimer, qui ne garde rien.
- **Les anciennes adresses** à la racine (`fiche-ec1.html#c-…`, `fiche-ec2.html#c-…`, `carte-identite.html#c-…` ou `#p-…`, `yeita-match-decompte.html`, `candidatures.html#c-…`) sont des pages relais qui redirigent vers ces adresses.
- **Aucune page ne montre « le dernier candidat ouvert »** : sans identifiant, rien (ou l'exemple fictif pour la carte). Un lien partagé ouvre une seule personne.
- **Des paramètres d'adresse (`?id=…`), pas des ancres (`#…`).** Une ancre n'est jamais envoyée au serveur, donc elle se perd pendant l'aller-retour de connexion d'oauth2-proxy. Les paramètres, eux, sont conservés.
- **L'identifiant est opaque** (`cand-…`) : jamais le nom dans une adresse. Une page de l'espace sans identifiant n'affiche aucun candidat.
- **Les pages publiques** restent hors de l'espace : le guide, `one-pager.html` et le kit. Leurs adresses sont dans `assets/config.js`.

## Le dossier v3

### En-tête
| Champ | Type | Règle |
|---|---|---|
| `schema` | texte | `"yeita-dossier-candidat"` |
| `version` | entier | `3` |
| `id` | texte | `cand-<horodatage base 36>-<5 caractères>`, opaque |
| `candidat.nom` | texte | calculé : égal à `identite.personne` |
| `candidat.role` | `PM` \| `PrD` | calculé depuis le Job (PrD → PrD, le reste → PM), lu par les fiches EC2 et la carte |

### La fiche (`identite`), alignée sur la base Notion « Candidats »
| Champ | Type | Valeurs, règle | Notion |
|---|---|---|---|
| `personne` | texte, **obligatoire** | « Nom Prénom » libre, sans contrainte de format (« NOM Prénom » accepté) | Personne |
| `job` | liste | `PrD`, `PM / PO`, `Ops`, `SM`, `PMM`, `UXR`, `Bizdev`, `RH`, `Recruteur·se` | Job (« Recruteur.se ») |
| `xp` | nombre ou `null` | années d'expérience, 0 à 59, au demi près | XP (texte dans Notion) |
| `disponibilite` | texte | `Intercontrat`, `Immédiatement`, `1 mois`, `2 mois`, `3 mois`, `Septembre`, plus les options ajoutées | Disponibilité (« 1mois ») |
| `dateDisponibilite` | date `AAAA-MM-JJ` ou `""` | facultative | Date de disponibilité |
| `dateDebutProcess` | date `AAAA-MM-JJ` | pré-remplie à la création, modifiable | Date début process |
| `provenances` | liste de textes | `Cooptation`, `WTTJ`, `LinkedIn`, `Chasse`, `Candidature spontanée` (plusieurs possibles) | Provenance (« Linkedin ») |
| `provenanceDetail` | texte | précision reprise de la v2 quand elle ne correspond à aucune provenance | — |
| `recruteurs` | liste de textes | prénoms, liste libre « à la Notion » : un nom tapé est créé et réutilisable | Recruteurs (personnes Notion) |
| `email` | texte | vide, ou `x@y.z` | Email Address |
| `telephone` | texte | aucun format imposé | Phone Number |
| `adresse` | texte | en pratique la ville | Adresse |
| `linkedin`, `portfolio`, `cv` | URL ou `""` | facultatives ; `cv` est un lien en attendant le dépôt de fichier | Linkedin, Portfolio, CV |
| `references` | texte | facultatif | Références |
| `syntheseEC` | texte | facultatif | Synthese EC |
| `prenom`, `nom`, `poste` | texte | **calculés** (ne pas stocker en colonnes) : prénom pour saluer, nom, rôle | — |

Les options de disponibilité ajoutées sont gardées aujourd'hui dans le navigateur (`yeita-options-disponibilite`). En SQLite, une table `options_disponibilite` suffit.

### Le parcours
| Champ | Type | Valeurs, règle |
|---|---|---|
| `parcours.etape` | texte | `appel`, `ec1`, `bilan-ec1`, `ec2`, `bilan-ec2`, `ec3`, `decision`, `proposition`, `go-mission`, `onboarding`, `vivier`, `non-retenu` |
| `parcours.etapes.<étape>` | objet | `debuteLe`, `termineLe` (ISO 8601), `par` (prénom) |
| `parcours.cloture` | objet ou `null` | quand `non-retenu` : `depuis` (étape), `motif` (`salaire`, `localisation`, `poste`, `projets`, `niveau`, `posture`, `anglais`, `desistement`, `autre`), `detail`, `carteEnvoyee`, `le`, `par` |
| `etat` | texte, **changé à la main** | `a-planifier`, `planifie`, `fait`, `retour-a-faire`, `non-retenu`, `valide`, `plus-dispo` |

Les règles de passage sont dans `assets/store.js` :

- **Les étapes s'enchaînent dans l'ordre :** `appel` → `ec1` → `bilan-ec1` → `ec2` → `bilan-ec2` → `ec3` → `decision`.
- **La décision** mène à `proposition`, `go-mission`, `vivier` ou `non-retenu`.
- **Depuis `proposition` ou `go-mission`**, « Arrivée confirmée » mène à `onboarding`.
- **Le refus** (`non-retenu`) est possible depuis `appel`, `bilan-ec1`, `bilan-ec2`, `decision`, `proposition` et `go-mission`. Jamais en EC1, EC2 ou EC3 : le non se décide au bilan.
- **Passer à l'EC1** demande le one-pager envoyé (`appel.onePager.envoyeLe`).
- **En entrant dans une étape**, `etat` repart à `a-planifier`. Exceptions : `onboarding` met `valide`, `non-retenu` met `non-retenu`.
- **Le tableau masque par défaut** les colonnes `go-mission`, `vivier` et `non-retenu`. Une colonne `sourcing`, avant l'appel, est prévue mais pas construite.

### Les étapes
| Champ | Type | Contenu |
|---|---|---|
| `appel` | objet | `date`, `par`, `reponses` (`recherche`, `pourquoi`, `role`, `ia`, `yeita`, `motivations`, `disponibilite`, `pistes`, `remuneration` : textes), `onePager` (`envoyeLe`, `par`), `ancien` (les 4 blocs v2, en lecture, ou `null`). La disponibilité (liste) et le lieu d'habitation s'écrivent dans la fiche |
| `ec1`, `ec2` | objet ou `null` | la lecture des fiches EC1 et EC2 (voir `docs/dossier-candidat.schema.json`). `ec1.match.source` vaut `saisie`, `decompte`, `jeu-en-ligne` ou `externe` ; `ec2.notesLibres` (texte) est nouveau en v3 |
| `fiches` | objet | brouillons d'écran : `ec1`, `ec2` (pour rouvrir les fiches telles qu'on les a laissées) et `decompte` (la feuille de décompte du candidat : `answers`, `notes`, `tb`, `f`, `fmt`) |
| `bilans.ec1`, `bilans.ec2` | objet ou `null` | `faitLe`, `par`, `mode` (`appel` \| `asynchrone`), `issue` (`continuer`, `retour-a-faire`, `non-retenu`) |
| `ec3` | objet | `notes`, `par`, `le` |
| `decision` | objet | `choix` (`proposition`, `go-mission`, `vivier`, `non-retenu` ou `null`), `commentaire` (obligatoire pour décider), `le`, `par`, `appelFaitLe` |
| `arrivee` | objet | `confirmeeLe`, `par` |
| `restitution.etat` | texte | état de la carte d'identité : `ec1`, `ec2`, `hire` |
| `historique` | liste | `{type, de, vers, le, par, motif, etatAvant, annulation}`. `type` vaut `passage`, `etat`, `decision` ou `refus`. `de` est `null` à l'entrée. Une annulation ajoute une ligne, elle n'efface rien |
| `notesLibres` | objet | hors MVP, désactivé |
| `meta` | objet | `creeLe`, `modifieLe`, `demo` (exemple fictif), `origine` (`module` \| `fiche`), `migreV3Le` |

## Le résultat de Yeita Match : le point d'entrée pour la session en ligne

La fiche EC1 reçoit le résultat par une seule fonction, quelle que soit la source :

```js
FICHE_EC1.setYeitaMatch({dominante: "explorateur", seconde: "collectif", source: "jeu-en-ligne", format: "visio", observateur: "Pauline", date: "2026-10-23"})
```

- **Aujourd'hui** : la saisie à la main, l'import du fichier JSON exporté par le jeu, et la feuille de décompte du candidat. La feuille dépose `{candId, dominant, second, fmt, obs, date}` sous la clé `yeita-match-resultat`, puis ouvre `ec1.html?id=<candId>` ; la fiche ne reprend que le résultat de son propre candidat.
- **Demain** (session Yeita Match liée au candidat) : le serveur écrit `ec1.match` et `fiches.ec1` (`dom`, `sec`, `source`), ou la page appelle `FICHE_EC1.setYeitaMatch` quand la session se termine. Rien d'autre à changer dans la fiche.

## Migration v2 → v3 (faite à la lecture, rien n'est supprimé)
| v2 | v3 |
|---|---|
| `identite.prenom` + `identite.nom` | `identite.personne` (« Prénom Nom ») |
| `identite.poste` `PM` / `PrD` | `identite.job` `PM / PO` / `PrD` |
| `identite.provenance` `linkedin` / `wttj` / `autre` + `provenanceDetail` | `provenances` : `["LinkedIn"]`, `["WTTJ"]`, ou d'après le détail (`coopt…` → Cooptation, `chasse` → Chasse, `spontan…` → Candidature spontanée). Sinon `[]`, et le détail est gardé |
| — | `dateDebutProcess` = date de `meta.creeLe` ; `recruteurs` = auteurs de l'appel et de l'historique |
| `parcours.etape` `passation-ec1` / `passation-ec2` / `clos` | `bilan-ec1` / `bilan-ec2` / `non-retenu` (clés de `parcours.etapes` et historique renommés) |
| `passations.ec1` / `ec2` (`faiteLe`, `par`, `mode`) | `bilans.ec1` / `ec2` (`faitLe`, `par`, `mode`, `issue: "continuer"`) |
| `appel.blocs` (parcours, recherche, cadre, conditions) | `appel.ancien` (lecture seule) ; `appel.reponses` vides |
| `decision` (`appelFaitLe`, `par`) | `decision` (`choix`, `commentaire`, `le`, `par`, `appelFaitLe`). Un dossier en onboarding reçoit `choix: "proposition"` |
| — | `arrivee`, `etat` : `non-retenu` si clos, `valide` en onboarding, `planifie` si l'étape en cours est démarrée, sinon `a-planifier` |

Un dossier v1 (fiches seules, avant le module) passe d'abord en v2, puis en v3. Tests : `node tools/test-store.js`.

## Correspondance avec Notion
| Espace Candidatures (`parcours.etape`) | Notion « Etapes » |
|---|---|
| `appel` | 1er call |
| `ec1`, `bilan-ec1` | EC1 |
| `ec2`, `bilan-ec2` | EC2 |
| `ec3`, `decision` | EC3 |
| `proposition` | Propal |
| `go-mission` | Go sur mission |
| `onboarding` | Arrivée |
| `vivier` | Vivier (et, à l'import : A garder, Recontacter en septembre) |
| `non-retenu` | NoGo |
| — | « Retour à faire » : dans l'espace, c'est un **État**, pas une étape |

| Espace (`etat`) | Notion « État » |
|---|---|
| `a-planifier` | A planifier |
| `planifie` | Planifé (orthographe Notion) |
| `fait` | Fait |
| `retour-a-faire` | Retour à faire |
| `non-retenu` | No go |
| `valide` | Validé |
| `plus-dispo` | Plus dispo |

## Ce qui vit encore dans le navigateur

| Clé | Contenu | Demain |
|---|---|---|
| `localStorage` `yeita-dossiers` | les dossiers, via l'adaptateur du navigateur | mode serveur (v1.3) : la base SQLite (`assets/adapter-serveur.js`) ; plus rien n'est écrit dans le navigateur |
| `yeita-recruteur`, `yeita-equipe-ajouts` | « Qui es-tu ? » et les prénoms ajoutés (`assets/qui.js`) | mode serveur : l'identité Google transmise par oauth2-proxy, la table `equipe` ; rien n'est écrit |
| `yeita-options-disponibilite` | les options de disponibilité ajoutées | mode serveur : la table `options_disponibilite` ; rien n'est écrit |
| `yeita-match-resultat` | le passage de relais feuille de décompte → fiche EC1 (`candId`, résultat, sans nom) | inutile si le serveur écrit le résultat |
| `sessionStorage` `yeita-notice` | le message « Étape terminée » d'une page à l'autre (nom du candidat), effacé à la lecture | inchangé |
| `sessionStorage` `yeita-rechargement-401` | (v1.3) l'heure du dernier rechargement dû à un 401, contre une boucle de rechargements | — |
| `yeita-fiche-ec1`, `yeita-fiche-ec2`, `yeita-carte-identite` | brouillons des anciennes fiches autonomes, plus lus par l'espace | à purger |

## Tables SQLite
L'API (`api/`, v1.2) garde le dossier entier en JSON, sans colonne tirée du JSON ; le schéma est appliqué par l'API et par `api/equipe.js` (`PRAGMA user_version = 1`). Le contrat HTTP (routes, enveloppe `{id, version, data}`, codes d'erreur, correspondance avec `list`/`get`/`put`/`remove`) est décrit dans [`api/README.md`](../../api/README.md).

```sql
CREATE TABLE equipe (
  email     TEXT PRIMARY KEY CHECK (email = lower(email) AND email LIKE '%@yeita.fr'),
  prenom    TEXT NOT NULL CHECK (length(trim(prenom)) > 0),
  role      TEXT NOT NULL CHECK (role IN ('recruteur','admin','lecture')),
  actif     INTEGER NOT NULL DEFAULT 1 CHECK (actif IN (0,1)),
  ajoute_le TEXT NOT NULL
);
CREATE TABLE candidats (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL,          -- le dossier v3 complet, en JSON
  version     INTEGER NOT NULL CHECK (version >= 1),   -- conflit si la version lue n'est plus la bonne
  modifie_le  TEXT NOT NULL,
  modifie_par TEXT NOT NULL
);
CREATE TABLE journal (                -- qui a fait quoi, sans le contenu ; purgé à la suppression du dossier
  id          INTEGER PRIMARY KEY,
  candidat_id TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('creation','modification','suppression')),
  etape       TEXT,
  par         TEXT NOT NULL,
  le          TEXT NOT NULL
);
CREATE TABLE options_disponibilite (  -- seulement les options ajoutées ; celles de base restent dans assets/dossier.js
  libelle   TEXT PRIMARY KEY,
  ajoute_le TEXT NOT NULL
);
```
