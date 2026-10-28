---
type: tache
version: 1.9
numero: 05
titre: Mise en ligne, retour, annulation, interruption
statut: ok
date: 2026-10-28
---

# Tâche 05 — Mise en ligne, retour, annulation, interruption

> **QA : réussie** · dans `deploy/auto-deploy.sh` · mutations A12, A13, A14, A19, R04, R06 détectées
> Une mise en ligne ratée revient seule au commit d'avant ; un déploiement fait à la main l'emporte ; un passage arrêté est enregistré.

## Ce que ça change
`deploy.sh` sous `RECRUTEMENT_PAR_AUTO=1` après attente de son verrou ; arrêt avant changement (pas de ligne `· Dépôt sur`) sans retour ; retour par le `deploy.sh` du commit d'avant, extrait sous le verrou, rejoué une fois si une sauvegarde a repris le verrou ; `annule` si `HEAD` ou la pause ont changé (R19) ; `interrompu` par `trap` ou au passage suivant (R20), avec marque `incertain` pendant `deploy` ou `retour`.

## Comment tester
Banc A (CA3, SC3, SC8, R10, R20) ; niveau B (retour réel, SC5, SC6).

## Critères d'acceptation
- [x] CA3 — (a) arrêt avant changement ; (b) retour par le `deploy.sh` du commit d'avant, même si celui du commit visé est en erreur de syntaxe ; (c) retour KO → `retour_ko`, `incertain` ; (d) redéploiement du commit en place raté ; (e) pas de boucle sur un commit en échec.

## Ce qui a été fait
`passage`, `retour`, `reprendre_interrompu`, `sur_arret` dans `deploy/auto-deploy.sh`.
Commits : `049f351`, `805b43c`.

## Résultat QA
| Vérification | Résultat |
|---|---|
| Banc A, CA3 (a)–(e), SC3, SC8, Q4, R10 | OK |
| Niveau B, retour réel (api jamais saine) | voir fiche 06 |

## Mutations
| Contrôle | Mutation | Obtenu |
|---|---|---|
| A12 | arrêt avant changement non détecté | détectée |
| A13 | retour sans checkout du commit d'avant | détectée |
| A14 | R19 retirée | détectée |
| A19 | `RECRUTEMENT_PAR_AUTO` non passé | détectée |
| R04 | retour non rejoué après « déjà en cours » | détectée |
| R06 | « déjà en cours » avant changement noté `deploiement-ko` | détectée |

## Spec couverte
R10, R11, R19, R20, CA3
