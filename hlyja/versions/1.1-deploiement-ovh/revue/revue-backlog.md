---
type: revue-backlog
version: 1.1
candidats: 17
nouvelles: 12
fiches: 9
occurrences: 0
rejetes: 5
date: 2026-10-26
---

# Revue du backlog — version 1.1

> La v1.1 laisse un lien mort vers l'ancien site GitHub Pages dans les pages (le seul point à effet visible), et des compléments d'exploitation et de sécurité sur le serveur partagé, tous de faible urgence ; un défaut de la version est renvoyé à l'orchestrateur (`CONTRIBUER.md`).

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| `SITE` de `assets/yeita.js` et carte « Site du recrutement — GitHub Pages » de `index.html` | cadrage (Hors périmètre), pilote P1/P3/P4 | nouvelle | [1.1-1](../../../backlog/1.1-1-liens-ancien-site-github-pages.md) — bug majeur reproduit (`curl` → 404), moyenne |
| `$id` de `docs/dossier-candidat.schema.json` sur yeichati.github.io | cadrage | nouvelle | [1.1-2](../../../backlog/1.1-2-schema-id-github-io.md) — dette basse ; gardée à part de 1.1-1 : aucun effet, autre dossier |
| Procédure de retrait du projet | arbitre tour 1, E11 (extension) ; pilote P2 | nouvelle | [1.1-3](../../../backlog/1.1-3-retrait-du-projet.md) — évolution basse |
| Place disque prise par Docker | tour 1 E12 ; pilote P2 ; QA (images orphelines du banc) | nouvelle | [1.1-4](../../../backlog/1.1-4-disque-images-de-construction.md) — réduite à ce qui manque : `deploy/README.md` l. 247 conseille déjà `docker system df` ; restent l'ancienne `python:3.12-slim` et le cache de construction ; la supervision automatique reste hors sujet |
| Durée de session plus courte (168 h par défaut) | tour 1 S3 ; spec-finale « Améliorations possibles » | nouvelle | [1.1-5](../../../backlog/1.1-5-duree-de-session.md) — évolution basse tant que les données restent dans le navigateur |
| S4 — sous-réseau et port non revérifiés par `deploy.sh` | revue de code | nouvelle | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) — même piste que Q2 (contrôles communs) |
| Q2 — logique dupliquée entre les deux scripts | revue de code | nouvelle | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) |
| Q3 — `4180` et `172.30.0.0/24` en dur | revue de code | nouvelle | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) |
| Q9 — `exit` final superflu | revue de code | nouvelle | [1.1-6](../../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md) — une ligne du même fichier, ne mérite pas sa propre fiche |
| Message trompeur si Compose ne connaît pas `config --environment` | revue de code (Revérification) | nouvelle | [1.1-7](../../../backlog/1.1-7-compose-ancien-message-trompeur.md) — bug mineur, basse ; non rejoué (Compose ancien absent du banc) |
| Q8 — pas de digest d'image | revue de code | nouvelle | [1.1-8](../../../backlog/1.1-8-images-sans-digest.md) — dette basse ; complète le tag figé du pitch sans le contredire |
| Fichiers inutiles publiés (`CONTRIBUER.md`, `.gitattributes`, `.nojekyll`) | tour 1 D7 (arbitre : sans-conséquence) ; QA S2 et remarques | nouvelle | [1.1-9](../../../backlog/1.1-9-fichiers-sans-usage-publies.md) — dette basse ; le verdict de l'arbitre portait sur la spec, pas sur le backlog ; piste commune avec 1.0-2 (même ligne `SKIP`) |
| S5 — le commit de retour accepte toute référence git | revue de code | rejete | condition 3 (concret) : ni risque ni correction ; la référence est résolue puis contrôlée (commit de `main`, postérieur au déploiement Docker : QA S24), `HEAD~3` désigne un commit valable |
| S6 — liens symboliques sous `~deploy/.ssh` | revue de code | rejete | condition 3 (concret) : aucun effet, `deploy` est déjà équivalent root (groupe `docker`), selon la revue elle-même ; aucune correction proposée |
| `CONTRIBUER.md` l. 7-8 : « jusqu'au déploiement sécurisé de Sacha », « Ne pas toucher à l'authentification, au déploiement… c'est la branche de Sacha » | orchestrateur, étape documentation | rejete | condition 2 (hors périmètre) : défaut introduit par la version — `deploy/`, `compose.yaml` et l'authentification arrivent sur `main` avec la v1.1, ce qui rend ces deux lignes fausses ; la même ambiguïté a été corrigée dans `technique/decisions.md` (revue-doc). **Renvoyé à l'orchestrateur** : reformuler comme `decisions.md` (authentification en place depuis 1.1, stockage partagé pas encore fait, donc données fictives uniquement) et dire à qui s'adresser pour `deploy/` ; la règle « ne pas toucher » elle-même est à confirmer avec l'utilisateur. **Corrigé** par l'orchestrateur (`f2091b9`) ; la règle est gardée, élargie à « sans l'équipe technique » : à confirmer par l'utilisateur au bilan |
| Vraie connexion Google non testable sans le vrai client | QA « À vérifier à la main » (S35) | rejete | condition 3 (concret) : rien à changer dans le code ; c'est une vérification déjà écrite dans le rapport QA et le guide de test humain, à faire au premier déploiement réel |
| 1.0-2 — `STORAGE.md` dans `SKIP` (revue) | `tools/build.py` | rejete (pas d'occurrence) | Toujours vrai : `grep -n STORAGE tools/build.py` → l. 8. Mais aucune trace de la v1.1 ne l'observe : la seule mention est « Hors périmètre : 1.0-1, 1.0-2 » du cadrage et des specs, qui n'est pas une occurrence. Fiche inchangée ; piste liée à 1.1-9 |

## Doublons fusionnés
Aucun. 1.1-9 et 1.0-2 touchent la même ligne mais pas le même problème (fichiers à ajouter contre fichier disparu) : gardées séparées, liées par leur piste.

## Reproductions
1.1-1 reproduite par le curateur (lecture seule) : `curl -s -o /dev/null -w '%{http_code}'` sur `https://leofuster-story.github.io/yeita-recrutement/`, `/candidatures/`, `/assets/data-diamants.js` et sur l'adresse du `$id` → `404` partout. Aucune autre reproduction demandée : pas d'autre bug bloquant ou majeur.
