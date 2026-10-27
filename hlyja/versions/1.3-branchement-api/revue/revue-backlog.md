---
type: revue-backlog
version: 1.3
candidats: 19
nouvelles: 8
occurrences: 2
rejetes: 3
fusionnes: 3
faits: 4
date: 2026-10-26
---

# Revue du backlog — version 1.3

> La 1.3 laisse surtout un texte à trancher avant les vraies candidatures (bandeau « Données fictives », 1.3-1, haute), deux garde-fous d'exploitation (1.3-3, 1.3-5) et de la dette de tests ; elle solde 1.2-1, 1.2-2, 1.2-3 et, au passage, 1.2-4. Deux mineurs de la revue (Q2, Q6) sont des défauts de la version, renvoyés pour correction.

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| « Charger des exemples » remplit la base partagée de candidats fictifs | arbitre tour 1 (R5, écarté extension), spec H3 | nouvelle | [1.3-2](../../../backlog/1.3-2-exemples-fictifs-dans-la-base-partagee.md) — moyenne |
| Contrôle de la configuration résolue de `api` dans `deploy.sh` avant `up` | tour 1 (S4), chef d'équipe P2 | nouvelle | [1.3-3](../../../backlog/1.3-3-deploy-controle-configuration-api.md) — moyenne ; lien vers 1.1-6 (sujet voisin, pas un doublon : contrôles dupliqués entre scripts) |
| Proposer les noms hors équipe lus dans les dossiers (champ Recruteurs) | tour 1 (R8), chef d'équipe P2, `MODELE.md` | nouvelle | [1.3-4](../../../backlog/1.3-4-recruteurs-hors-equipe-proposes.md) — basse ; la règle « Recruteurs hors équipe » de la doc produit décrit l'état actuel, l'évolution la changerait (pas contraire à une décision) |
| Q2 — bandeau de conflit resté après une nouvelle tentative réussie | revue de code | rejete | **défaut de la version** (bug introduit par la 1.3, règle 5) : renvoyé à l'orchestrateur, à corriger maintenant |
| Q5 — options de `fetch` et texte de conflit dupliqués | revue de code | nouvelle | [1.3-8](../../../backlog/1.3-8-mode-serveur-duplications-et-styles.md) — basse |
| Q6 — gardes du retour sur l'onglet de `candidat.html` évaluées avant la lecture seulement | revue de code | rejete | **défaut de la version** (bug introduit par la 1.3, contraire à la règle « rien n'est relu pendant une saisie ») : renvoyé, à corriger maintenant |
| Q8 — `e2e-serveur.py` : port fixe, `lancer_api` hors du `try`, journal non fermé | revue de code | nouvelle | [1.3-6](../../../backlog/1.3-6-suites-mode-serveur-robustesse.md) — basse |
| Q9 — style du bandeau en ligne, `.qui-compte` sans règle | revue de code | fusion | dans [1.3-8](../../../backlog/1.3-8-mode-serveur-duplications-et-styles.md) (même sujet : une seule source pour textes, requêtes et styles du mode serveur) |
| Bandeau « Données fictives » faux en mode serveur | QA (S43, Points notés) | nouvelle | [1.3-1](../../../backlog/1.3-1-bandeau-donnees-fictives-faux-en-mode-serveur.md) — **haute** (majeur, reproduit sur les captures du mode serveur, toutes les pages) ; hors périmètre par le pitch |
| Mutation survivante de `check-site.sh` (`^/api/` dans `skip_auth_routes`) | QA (S24) | nouvelle | [1.3-5](../../../backlog/1.3-5-check-site-401-origine.md) — basse |
| `npm test` sans durée maximale globale | QA (Points notés) | nouvelle | [1.3-7](../../../backlog/1.3-7-npm-test-sans-duree-maximale.md) — basse ; `api/` hors périmètre |
| `test-serveur.js` / `e2e-serveur.py` s'arrêtent à la première exception | QA (S38, Points notés) | fusion | dans [1.3-6](../../../backlog/1.3-6-suites-mode-serveur-robustesse.md) (mêmes suites, même sujet : robustesse) |
| H5 — envoi de départ refusé non affichable ; 300 à 400 ms perdues après une écriture d'une autre page | spec finale (H5), tâche 09 | rejete | **déjà tranché** : règle métier « Départ de la page » de `doc/produit/stockage-partage.md` (« risque accepté ») ; le constat de la tâche 09 (EC1 après le décompte) est ce même risque. À rouvrir seulement sur décision de l'utilisateur (demanderait une fusion côté API, hors périmètre) |
| Écart à R38 : `DEV_EMAIL` pour l'envoi de départ, départ de Bob/Léa non exercé par l'e2e | tâche 09, revue (Q8) | fusion | dans [1.3-6](../../../backlog/1.3-6-suites-mode-serveur-robustesse.md) ; couvert à la main par la QA (S30, banc Dex), donc pas de fiche à part |
| 1.1-1 — reste le libellé « GitHub Pages » (`index.html` l. 431) | vérifications V25, R36 | occurrence | [1.1-1](../../../backlog/1.1-1-liens-ancien-site-github-pages.md) : liens corrigés (`YEITA.SITE`), libellé vérifié l. 431 ; titre recentré, sévérité mineur, priorité moyenne → **basse** ; reste `ouvert` |
| 1.2-1 — port non publié, contrôle ; essai Google réel | fiche rattachée | fait | [1.2-1](../../../backlog/1.2-1-mise-en-service-api-derriere-oauth2-proxy.md) → `fait` (1.3) : `api` sans `ports`, `back` interne, README § 9b, QA ; essai avec un vrai compte Google : manuel, guide de test § 2 (S44) |
| 1.2-2 — `.dockerignore` | fiche rattachée | fait | [1.2-2](../../../backlog/1.2-2-contexte-docker-embarque-api.md) → `fait` (1.3) |
| 1.2-3 — points 1 à 4, sans la migration | fiche rattachée | fait | [1.2-3](../../../backlog/1.2-3-adaptateur-navigateur-cas-a-traiter.md) → `fait` (1.3) pour l'adaptateur ; migration non faite (exclue par l'utilisateur), dit dans la fiche |
| 1.2-8 — `@fastify/static` maintenant dans l'image de production | curateur (hors diff) | occurrence | [1.2-8](../../../backlog/1.2-8-fastify-static-importe-en-production.md) : `npm ci --omit=dev` installe le module (dépendance de production) ; piste complétée (`devDependencies`) ; reste basse (aucun effet identifié) |

Hors liste des candidats, constat du curateur : [1.2-4](../../../backlog/1.2-4-modele-phrases-perimees.md) → `fait` (1.3) : les deux phrases de `docs/backend/MODELE.md` ont été remplacées par la réécriture de R40.

## Défauts renvoyés à la version
- **Q2** : `assets/dossier.js` (`ecrirePartie`, l. 276-282) : le premier `save(frais)` refusé (409) passe par `echec(…, true)` de `assets/adapter-serveur.js`, qui affiche le bandeau « … modifiée par quelqu'un d'autre » et « Ce que tu as saisi depuis n'est pas enregistré », puis `essai(0)` réussit : le bandeau reste et contredit l'indicateur. Piste de la revue : nouvelle tentative silencieuse, ou `DEMARRAGE.effacer()` à la réussite.
- **Q6** : `candidatures/candidat.html` l. 424-428 : à la réponse de `S.getCandidate`, seuls `saveT` et `enCours` sont revérifiés ; un formulaire de refus ouvert (`refusOpen`), un refus d'enregistrement (`refuse`) ou un champ pris pendant la requête est effacé par `render()`. Piste : réévaluer la garde complète à la réponse.

## Doublons fusionnés
Aucun entre fiches existantes. Fusions de candidats : Q9 dans 1.3-8 (avec Q5) ; arrêt à la première exception et écart R38 dans 1.3-6 (avec Q8).
