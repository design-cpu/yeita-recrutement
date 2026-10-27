---
type: revue-doc
version: 1.4
pages: 3
erreurs: 5
corrigees: 5
vues: 3
date: 2026-10-27
---

# Revue de la documentation — version 1.4

> 3 pages relues contre le code de `c51ed2c` (dernier commit qui touche `tools`, `assets`, `candidatures`, `docs`). Le contenu ajouté en 1.4 est juste : textes, garde du clic, visibilité de « Retirer les exemples », suppression de l'ancien modèle et nombres de vérifications (87, 51, 42 recomptés). 5 erreurs, toutes de frontmatter ou de détail : le `commit: 30e0977` de `mode-serveur.md` et `conventions.md` est antérieur aux contrôles de test ajoutés par la QA (`c51ed2c`), donc ces deux pages sortent « À revérifier ». 3 vues humaines réécrites. Les 5 erreurs ont été corrigées par l'orchestrateur (les trois pages passent à `commit: c51ed2c`, `date: 2026-10-27`) ; « Bandeau jaune » ajouté au glossaire.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| `technique/mode-serveur.md` l. 6 | `commit: 30e0977` : `tools/e2e-serveur.py`, cité dans `sources`, a changé après (`git log --oneline 30e0977..HEAD -- <sources>` → `c51ed2c`, +2 contrôles). Le « 51 vérifications » de la l. 116 décrit `c51ed2c` (49 à `30e0977`). La page sort « À revérifier ». | `commit: c51ed2c` | corrige |
| `technique/conventions.md` l. 6 | `commit: 30e0977` : `tools/e2e-serveur.py` et `tools/e2e-candidatures.py`, cités dans `sources`, ont changé dans `c51ed2c`. La couverture v1.4 de `e2e-candidatures` (l. 39) et le « 51 vérifications » (l. 43) n'existent qu'à partir de `c51ed2c`. Même test de péremption → `c51ed2c`. | `commit: c51ed2c` | corrige |
| `doc/produit/stockage-partage.md`, `technique/mode-serveur.md`, `technique/conventions.md` l. 8 | `date: 2026-10-26` alors que `maj: 1.4` et la mise à jour date du 2026-10-27 (`c95aca2`). | `date: 2026-10-27` | corrige |
| `technique/conventions.md` l. 71 (Historique) | La ligne 1.4 cite « compteurs de `test-serveur` et `e2e-serveur` » mais pas l'ajout de couverture de `e2e-candidatures` (bandeau et boutons d'exemples du mode navigateur, l. 39). | « Ancien modèle v2 de `docs/` supprimé ; compteurs de `test-serveur` et `e2e-serveur` ; `e2e-candidatures` couvre le bandeau et les exemples du mode navigateur » | corrige |
| `doc/produit/stockage-partage.md` l. 49 | Mineur. « avant la réponse de la base, ces boutons ne font rien » : la garde vaut aussi en mode bloqué, où les deux boutons restent dans la page sans effet (`candidatures/index.html` l. 301 : `if(DEMARRAGE.mode() !== "navigateur") return;` ; spec R4). | « avant la réponse de la base, ou si la page est bloquée, ces boutons ne font rien » | corrige |

`doc/produit/stockage-partage.md` garde `commit: 30e0977` : aucune de ses `sources` n'a changé depuis (`git log 30e0977..HEAD -- <sources>` vide), ce n'est pas une erreur. Mettre `c51ed2c` comme les deux autres pages serait plus cohérent, sans obligation.

Vérifié conforme (par commande) :
- Bandeau jaune : `data-t="commun.fictif"` présent une fois sur chacune des six pages de `candidatures/` (`grep -c`) ; remplacé seulement dans `serveur()` de `assets/demarrage.js` (l. 99-100), avant `mode = "serveur"` ; `data-t` passé à `commun.serveur` ; textes `commun.serveur` et `commun.fictif` identiques à ceux des sources (`assets/wording.fr.js` l. 9-10).
- Tableau : `#demo-load` et `#empty-demo` retirés et texte `tableau.vide.texteServeur` (« Ajoute la première personne avec qui tu as un appel de découverte. ») posé en mode serveur (`index.html` l. 323-327) ; garde du clic hors mode `navigateur` (l. 301) ; `#demo-clear` `hidden` dans le HTML (l. 89), puis à chaque `renderBoard` : visible en navigateur, en serveur si un dossier lu a `meta.demo`, caché sinon (l. 183) ; `STORE.clearDemo` supprime tous les dossiers `meta.demo` de la liste (`assets/store.js` l. 368-370), donc pour toute l'équipe en mode serveur.
- `docs/` ne contient plus que `backend/MODELE.md` et `dossier-candidat.schema.json` ; `git grep "modele-de-donnees" -- ':!hlyja/versions' ':!hlyja/backlog'` ne renvoie rien.
- Nombres de vérifications : `node tools/test-serveur.js` → `TOUT OK (87 vérifications)`, 3,75 s (rejoué). `e2e-serveur.py` : 44 appels de `check(` hors définition, dont un dans une boucle de 5 pages (+4) et un dans une boucle de 4 réponses simulées (+3), les deux appels sous `if nom == "502 HTML"` ne jouant qu'une fois → 51. `e2e-candidatures.py` : 43 lignes `check(` hors définition, dont `pg.check("#op-sent")` (case à cocher Playwright, pas une vérification) → 42, sans boucle. Conforme au rapport QA (87, 51, 42). Les e2e n'ont pas été rejoués ici (Playwright absent du poste).

## Couverture
| Élément | Page | Statut |
|---|---|---|
| Bandeau jaune selon le mode (R1, R2, R3) | stockage-partage (Bandeau jaune) ; mode-serveur (`serveur(moi)`, Textes) | couvert |
| Exemples hors de la base partagée, garde du clic, tableau vide (R4, R5) | stockage-partage (Pas d'exemples…) ; mode-serveur (Pages, `index.html`) | couvert |
| « Retirer les exemples » (R6) | stockage-partage (même règle, Cas particuliers) ; mode-serveur (Pages) | couvert |
| Ancien modèle supprimé (R8) | conventions (Organisation, Historique) | couvert |
| Contrôles de test ajoutés | conventions (Tests) ; mode-serveur (Tests) | couvert |

## Vues humaines écrites
- doc/produit/stockage-partage.humain.md
- technique/mode-serveur.humain.md
- technique/conventions.humain.md

Les deux vues techniques portent `commit: c51ed2c` (code contre lequel elles ont été relues).

## Glossaire
Aucun terme ajouté (hors de ce qui m'était permis d'écrire). Proposé : **Bandeau jaune** — « Le bandeau en haut de chaque page de l'espace Candidatures qui dit où sont enregistrées les candidatures : sur le serveur de l'équipe en mode serveur, dans ce navigateur sinon. À ne pas confondre avec le bandeau d'erreur, rouge. »

Hors périmètre, à signaler au backlog : `CONTRIBUER.md` l. 7 dit encore « les données restent dans le navigateur de chacun », faux en mode serveur depuis la v1.3 (même message que l'ancien bandeau jaune).
