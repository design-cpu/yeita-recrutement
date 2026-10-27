---
type: spec
version: 1.4
n: 1
statut: validee
modules: aucun
date: 2026-10-27
---

# Spec — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> Validée après une revue technique et produit (2 majeurs et 3 mineurs intégrés, challenges/revue-spec.md).
> En mode serveur, le bandeau jaune dit que les candidatures sont sur le serveur de l'équipe, et le tableau ne propose plus de charger des exemples fictifs dans la base partagée. L'ancien modèle de données v2 est supprimé. Le mode navigateur ne change pas.

## Contexte et objectif
Depuis la 1.3, sur `recrutement.yeita.fr`, les candidatures sont dans la base partagée de l'équipe (mode serveur), mais le bandeau jaune des six pages dit encore « Tout reste dans ce navigateur » (1.3-1, bug), et « Charger des exemples » écrit des candidats fictifs dans cette base, que « Retirer les exemples » retire pour tout le monde (1.3-2). `docs/modele-de-donnees.md` décrit l'ancien modèle v2 avec des liens morts (1.0-1). Après cette version, un recruteur lit un texte juste sur l'endroit où vivent les données, et la base partagée ne reçoit plus d'exemples.

## Périmètre
### Inclus
Fiches 1.3-1, 1.3-2, 1.0-1 ; revérification de 1.2-1, 1.2-2, 1.2-4 (V7 à V9).
### Exclu
Reprend le « Hors périmètre » du cadrage : autres textes qui parlent du stockage local (`commun.introuvable`, `commun.lienAide`, titre de la section Sauvegarde), bandeau en mode bloqué et en attente, essai manuel Google de 1.2-1, autres fiches du backlog.

## Existant réutilisé
| Besoin | Décision | Élément | Référentiel |
|---|---|---|---|
| Savoir le mode | réutiliser | `DEMARRAGE.mode()`, entrée en mode serveur dans `assets/demarrage.js` (V2) | [Mode serveur](../../../technique/mode-serveur.md) |
| Retirer une offre en mode serveur | réutiliser | procédé de « Remplacer tout » dans `candidatures/index.html` (V4) | idem |
| Textes | étendre | `assets/wording.fr.js` : `commun.serveur`, `tableau.vide.texteServeur` | idem |
| Retirer les exemples | réutiliser | `STORE.clearDemo` | — |
| Tests | étendre | `tools/test-serveur.js`, `tools/e2e-serveur.py` | [Conventions](../../../technique/conventions.md#tests) |

## Règles et comportements
| # | Règle | Détail / valeurs |
|---|---|---|
| R1 | Bandeau en mode serveur | À l'entrée en mode serveur (dans `serveur()` de `assets/demarrage.js`, avant que `pret` soit résolue), chaque élément `[data-t="commun.fictif"]` reçoit `data-t="commun.serveur"` et le texte `commun.serveur` : « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. » Sur les six pages (V1) ; « Connecté·e : prénom » reste à côté. Changer aussi `data-t` garantit le bon texte même si la passe `data-t` de la page venait après (revue, 2 et 3) |
| R2 | Bandeau ailleurs | Mode navigateur, mode bloqué et attente du démarrage : texte `commun.fictif` inchangé |
| R3 | Décision sur le mode retenu | R1, R4 et R6 se décident sur le mode choisi par le démarrage (`DEMARRAGE.mode()` ou l'entrée en mode serveur), jamais sur le nom d'hôte ou une réponse brute (règle 2 de la 1.2) |
| R4 | Pas de chargement d'exemples hors du mode navigateur | En mode serveur, « Charger des exemples » (section Sauvegarde et tableau vide) n'est plus dans la page. Le clic sur ces boutons ne fait rien tant que le mode n'est pas `navigateur` (attente du démarrage, bloqué, serveur) : sinon un clic pendant l'attente serait mis en file par l'adaptateur d'attente et écrirait dans la base (revue, 1) |
| R5 | Tableau vide en mode serveur | Texte `tableau.vide.texteServeur` : « Ajoute la première personne avec qui tu as un appel de découverte. » |
| R6 | Retirer les exemples en mode serveur | Le bouton n'est visible que si la liste lue contient au moins un dossier `meta.demo` ; réévalué à chaque affichage du tableau (chargement, retour sur l'onglet, après retrait). Il est caché tant que le tableau n'a pas été affiché une première fois (attente du démarrage, mode bloqué). Sans exemples, la rangée reste vide, sans autre texte (revue, 5) |
| R7 | Mode navigateur inchangé | Les deux boutons d'exemples et le texte du tableau vide restent comme en 1.3 |
| R8 | Ancien modèle | `docs/modele-de-donnees.md` supprimé ; aucun renvoi ne reste hors des traces de versions et du backlog |
| R9 | Doc produit | `stockage-partage.md` : règle du bandeau, cas particulier des exemples réécrit |

Accepté : pendant l'attente du démarrage (au plus la réponse de `/api/moi`, `/api/equipe` et `/api/options-disponibilite`), le bandeau montre encore `commun.fictif` en mode serveur.

## Critères d'acceptation
- [ ] CA1 — `tools/e2e-serveur.py` : sur `index.html`, puis `candidat.html`, `ec1.html`, `ec2.html`, `decompte.html` et `carte.html` ouverts par Alice sur un dossier existant (`?id=<cid>`), le bandeau `.fict` contient le texte de R1 et pas « Tout reste dans ce navigateur » ; sur `index.html`, « Connecté·e : Alice » est toujours dans le bandeau (R1)
- [ ] CA2 — `tools/test-serveur.js` (faux document de `page()` étendu pour rendre un faux élément sur `[data-t="commun.fictif"]`) : le `textContent` et le `data-t` du bandeau deviennent `commun.serveur` en mode serveur, et reste `commun.fictif` en mode navigateur et en mode bloqué (R1, R2, R3)
- [ ] CA3 — `tools/e2e-serveur.py` : base vide en mode serveur : ni `#demo-load` ni `#empty-demo` dans la page, texte du tableau vide de R5, `#demo-clear` caché ; un clic sur `#demo-load` pendant un `/api/equipe` ralenti n'écrit rien dans la base (R4, R5, R6)
- [ ] CA4 — `tools/e2e-serveur.py` : avec un dossier `meta.demo` dans la base, `#demo-clear` est visible ; un clic le retire de l'API, puis le bouton est caché (R6)
- [ ] CA5 — non-régression : `node tools/test-store.js`, `node tools/test-serveur.js`, `cd api && npm test`, `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` (qui cliquent `#demo-load` et `#empty-demo` en mode navigateur, V5) et `e2e-serveur` concluent tous par leur ligne de réussite, recopiée (R7)
- [ ] CA6 — `test ! -e docs/modele-de-donnees.md` et `git grep -n "modele-de-donnees" -- ':!hlyja/versions' ':!hlyja/backlog'` ne renvoie rien (R8)
- [ ] CA7 — les contrôles ajoutés pour CA1 à CA4 sont mis à l'épreuve par mutations (mode serveur ignoré pour le bandeau, bouton de retrait toujours visible, chargement laissé en mode serveur, garde du clic retirée), chacune classée détectée / survivante / bloque / plantage
