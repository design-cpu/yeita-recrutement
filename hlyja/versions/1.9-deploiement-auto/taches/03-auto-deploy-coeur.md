---
type: tache
version: 1.9
numero: 03
titre: Cœur de auto-deploy.sh
statut: ok
date: 2026-10-28
---

# Tâche 03 — Cœur de auto-deploy.sh

> **QA : réussie** · `deploy/auto-deploy.sh` et `tools/test-auto-deploy.sh` créés · banc A 95/95 · mutations détectées (voir ci-dessous)
> Le serveur sait prendre une demande, la valider, décider quoi faire et tenir l'historique de la page.

## Ce que ça change
`deploy/auto-deploy.sh` retire la demande déposée par la page (conteneur jetable), la lit strictement, valide le commit (ligne principale de `main`, ≥ 1.9), applique l'ordre de R1 (demande, lancement à la main, automatisme : pause, échec, incertain, à jour), gère la pause, garde ses décisions dans `~/.recrutement-deploiement` et réécrit la vue de la page par `ecrire_etat`.

## Comment tester
`docker run --rm -e AUTO_DEPLOY_JETABLE=oui -v "$PWD:/depot:ro" banc-1.7 bash /depot/tools/test-auto-deploy.sh /depot` → dernière ligne `TOUT OK` (code 0). Sans `AUTO_DEPLOY_JETABLE=oui` : refus, code 2 (vérifié par le banc lui-même).

## Critères d'acceptation
- [x] CA2 — test KO : étapes suivantes « non lancée », commit en échec, passage suivant sans rien enregistrer, `dernier_controle` mis à jour.
- [x] CA4 — pause, demande traitée en pause, « reprendre », lancement à la main avec demande en attente (deux passages).
- [x] CA6 — refus : branche fusionnée, antérieur à la 1.9, introuvable, mal formé, clé en double, doublon + manquante, action inconnue, clé manquante, `par` invalide, > 1 024 octets, NUL, lien, dossier. Préfixe ambigu : **non observable** sur ce banc (~16 000 commits), vérifié par lecture (`git rev-parse --verify`, V13).
- [x] CA7 — demande déposée entre retrait et lecture : gardée pour le passage suivant, traitée une fois ; deux demandes : la plus récente.
- [x] CA11 — JSON valide avec sorties et messages hostiles, 300 lignes, 30 passages, vue falsifiée ou supprimée sans effet.

## Ce qui a été fait
`deploy/auto-deploy.sh` (fonctions `prendre_demande`, `valider_commit`, `ecrire_vue`, `json_texte`, `fin_passage`, ordre de `main`) ; `tools/test-auto-deploy.sh` (faux docker, `deploy.sh` factice dans les commits d'essai, dépôt nu fabriqué).
Commits : `049f351`, `46689d2`, `805b43c`, `d305a95`.

## Résultat QA
| Vérification | Résultat |
|---|---|
| Banc A | 95 vérifications, ligne finale **`TOUT OK`** |
| shellcheck | code 0 |
Corrections pendant la tâche : `git rev-list | grep -q` sous `pipefail` (SIGPIPE → faux refus) remplacé par `grep >/dev/null` ; octets UTF-8 invalides (JSON invalide pour un lecteur strict) retirés par `iconv -c` ; code de sortie de la prise de demande (c'était celui de `echo`) ; identifiants de passage à la nanoseconde (deux passages dans la même seconde se triaient au hasard).

## Mutations
Copie hors du dépôt, banc complet avec échéance de 15 min, classement par la ligne finale.
| Contrôle | Mutation | Obtenu |
|---|---|---|
| A01 verrou de passage | `flock` retiré | détectée (SC1 A) |
| A02 retrait avant traitement | `cp` au lieu de `mv` | détectée |
| A03 / R02 liens | lien suivi ; lien à la place du dossier | détectées |
| A04 / R01 clés | refus des doublons retiré | **survivante** d'abord (deux contrôles se recouvraient), puis détectée après ajout du cas « doublon + clé manquante » |
| A04b | contrôle des quatre clés retiré | détectée |
| A05 taille | contrôle retiré | détectée |
| R03 NUL | contrôle retiré | détectée (après une première mutation non appliquée : échappement) |
| A06 ligne principale | `--is-ancestor` au lieu de `--first-parent` | détectée |
| A07 1.9 | présence de `auto-deploy.sh` non vérifiée | détectée |
| A08 pause | ignorée par l'automatisme | détectée |
| A09 ordre R1 | « en échec » après « incertain » | détectée |
| A15 R20 | reprise des passages interrompus retirée | détectée |
| A16, A17, A18 | 300 lignes, 30 passages, échappement des guillemets | détectées |
| R05 non retirée | enregistrée comme refus | **survivante** d'abord (le nombre de passages était figé à 30), détectée après vérification par identifiant |
Ligne de verdict de chaque suite : banc `TOUT OK`.

## Spec couverte
R1–R4, R6, R7, R12–R14, R18, R20, CA2, CA4, CA6, CA7, CA11
