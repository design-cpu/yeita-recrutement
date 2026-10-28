---
type: tache
version: 1.10
numero: 04
titre: Pages : création
statut: ok
date: 2026-10-28
---

# Tâche 04 — Pages : création

> **QA : réussie** · 2 fichiers (`candidatures/menu-candidat.js`, `assets/wording.fr.js`) · 0 correction
> « Ajouter un candidat » ne crée jamais deux fois la même personne, même si l'envoi du CV échoue ou si on clique deux fois.

## Ce que ça change
Au premier clic sur une action du pied, les deux actions et la fermeture sont bloquées jusqu'à la fin. Une fois le candidat créé, la fenêtre travaille sur lui : un CV en échec reste en attente avec « Réessaie, ou retire-le pour continuer sans. », un nouveau clic enregistre les champs modifiés et renvoie les seuls fichiers restants. Fermer après la création revient à « Enregistrer et revenir à la liste » ; un échec s'affiche alors dans un bandeau de la liste.

## Comment tester
Liste des candidatures en mode serveur : « Ajouter un candidat », nom, CV en PDF, « Enregistrer et revenir à la liste ». Pour l'échec, voir les contrôles « création (1.10 …) » de `tools/e2e-serveur.py`.

## Critères d'acceptation
- [x] CA4 (a) — envoi en échec, nom modifié, second clic → un seul candidat, nom modifié, un seul CV référencé.
- [x] CA4 (b) — pendant la création : actions et fermeture désactivées, Échap ne ferme pas, clic sur l'autre action → un seul candidat.
- [x] CA4 (c) — CV toujours en échec, « Retirer », « Passer à l'appel » → appel ouvert, sans fichier.
- [x] CA4 (d) — fermeture après la création, CV en échec → bandeau annoncé « CV de … non enregistré », candidat présent sans CV.

## Ce qui a été fait
`menu-candidat.js` : `cree` (garde en mémoire), `creation` (opération en cours), `piedActif`, `enregistrerCreation` (création ou enregistrement, puis fichiers en attente un par un), `valider` réécrite, `fermerApresCreation`, `bandeau` ; `retirer` en création retire aussi un fichier déjà envoyé. `wording.fr.js` : `relance`, `bandeau`.
Commits : `931081e` feat(fiche-candidat-harmonisation): tâches 03 et 04 – …

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA4 a, b, c, d | ok (`e2e-serveur`, 5 contrôles « création (1.10 …) ») |
| Non-régression | `e2e-candidatures` : `ALL OK` (création en mode navigateur, Léo) |

## Mutations
Même méthode que la tâche 03.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| R3 garde | blocage du pied retiré | échec | détectée (CA4 b) |
| R3 relance | toujours recréer | échec | détectée (CA4 a, c, d) |
| R3 fermeture | fermeture non bloquée pendant la création | échec | détectée (CA4 b, d) |

## Spec couverte
R3, R7 (bandeau), CA4
