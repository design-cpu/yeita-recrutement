---
type: revue-backlog
version: 1.4
candidats: 7
nouvelles: 3
occurrences: 1
rejetes: 3
---

# Revue du backlog — version 1.4

> La 1.4 laisse deux textes du mode serveur qui parlent encore du stockage local ou d'une « sauvegarde » (1.4-1, 1.4-2), un guide de contribution qui contredit le mode serveur (1.4-3, une décision de l'utilisateur à prendre) et une duplication de texte de plus dans le code du mode serveur (1.3-8).

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| C1 — `commun.introuvable` et `tableau.lienAide` parlent du stockage local en mode serveur | cadrage (Hors périmètre) ; orchestrateur, lecture de `assets/wording.fr.js` l. 21 et 104 | nouvelle | [1.4-1](../../../backlog/1.4-1-textes-stockage-local-en-mode-serveur.md) — bug mineur, constaté : affiché par `candidat.html` l. 94, `ec1.html` l. 809, `ec2.html` l. 877, `decompte.html` l. 450, `carte.html` l. 591 quand l'adaptateur serveur rend `null` (404 `introuvable`) ; aide `#aide-lien` lue via `aria-describedby` ; aucune variante selon le mode |
| C2 — titre « Sauvegarde et exemples » en mode serveur | cadrage (Hors périmètre) ; spec (Exclu) | nouvelle | [1.4-2](../../../backlog/1.4-2-titre-sauvegarde-en-mode-serveur.md) — évolution basse : `index.html` l. 78 garde le titre alors que l. 324 retire le chargement d'exemples et que l. 218 dit qu'un export est une copie à supprimer |
| C3 — en mode bloqué et en attente, « Charger des exemples » et le bouton du tableau vide restent affichés, inertes, sans message | revue de code (Hors diff) ; rapport QA (À vérifier à la main) | rejete | **non fondé en partie** : le tableau vide (`#empty`, donc `#empty-demo`) est `hidden` au départ (`index.html` l. 94) et n'est montré que par `renderBoard` après `DEMARRAGE.pret`, que le mode bloqué ne résout pas (`assets/demarrage.js` : `resoudre()` l. 57 et 101 seulement ; R6 et QA S4 le confirment). **Déjà tranché** pour le reste : seul `#demo-load` reste visible, dans la section repliée, inerte comme tous les boutons de la page (export, import, ajout), sous le bandeau rouge qui dit pourquoi ; c'est la règle « Jamais de repli silencieux » (« bloquent la page avec un message ») et la règle 1.4 « avant la réponse de la base, ces boutons ne font rien » de `doc/produit/stockage-partage.md` |
| C4 — repli de `texteServeur()` recopiant `commun.serveur` | revue de code, constat 2 (mineur non traité) | occurrence | [1.3-8](../../../backlog/1.3-8-mode-serveur-duplications-et-styles.md) — même sujet (textes du mode serveur recopiés au lieu d'une seule source `wording.fr.js`) ; nouvelle observation de la revue 1.4 sur `assets/demarrage.js` l. 20 ; priorité gardée basse (aucun effet) |
| C5 — en mode bloqué, le bandeau jaune garde « Tout reste dans ce navigateur » | spec R2 ; cadrage (Hors périmètre) | rejete | **déjà tranché** : règle « Bandeau jaune » (1.4) de `doc/produit/stockage-partage.md` : « ailleurs (mode navigateur, mode bloqué, attente de la réponse de la base) il garde « Données fictives uniquement… Tout reste dans ce navigateur. » ». Pour le rouvrir, l'utilisateur change cette règle ; aucun constat nouveau (en mode bloqué rien n'est lu ni écrit, le bandeau rouge dit pourquoi) |
| C6 — lisibilité du bandeau plus long à côté de « Connecté·e » sur écran étroit | rapport QA (À vérifier à la main) ; guide, parcours 2 | rejete | **non fondé** : aucun défaut observé, seulement un point à vérifier ; `.fict` est en `flex-wrap:wrap` (`candidatures/style.css` l. 3). **Dans le périmètre** s'il échoue : le texte vient de R1, ce serait un défaut de la version à corriger avant le bilan, pas une entrée du backlog |
| C7 — `CONTRIBUER.md` l. 7 : « Données fictives uniquement, tant que le stockage partagé n'est pas branché […] les données restent dans le navigateur de chacun » | rédacteur-relecteur (`revue/revue-doc.md`, Hors périmètre) | nouvelle | [1.4-3](../../../backlog/1.4-3-contribuer-donnees-dans-le-navigateur.md) — dette moyenne, constatée : contredit les règles « Mode serveur » (1.3) et « Bandeau jaune » (1.4). Pas un doublon de 1.4-1 (textes de l'interface dans `wording.fr.js`) ni de 1.1-9 (publication du fichier). Lever « données fictives uniquement » reste une décision de l'utilisateur |

## Doublons fusionnés
Aucun. Fiches relues : les 28 fiches de `hlyja/backlog/` (1.0-1 à 1.3-8) ; 1.3-1, 1.3-2 et 1.0-1 laissées à l'orchestrateur. C1 et C2 ne doublonnent pas 1.3-1 (bandeau jaune seul, `fait`) ni 1.3-2 (boutons d'exemples, `fait`) ; C7 ne doublonne pas 1.1-9 (publication de `CONTRIBUER.md`, pas son contenu).
