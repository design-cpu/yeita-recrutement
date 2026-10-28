---
type: challenge
version: 1.7
tour: 2
spec: spec-v2.md
score: 87
valide: oui
date: 2026-10-27
---

# Tour 2 — spec v2

> Score 87 (Exploitation 92, Sécurité et RGPD 84, Restauration 90, Testabilité 80) : **validé** (moyenne ≥ 80, aucun challenger < 70, aucun bloquant).
> Tout le tour 1 est résolu, sauf T7 (reste mineur). 5 majeurs nouveaux, tous sur des mécanismes ajoutés en v2 ou des oublis de preuve, intégrés dans la spec finale sans nouveau CA.

## Récapitulatif
| Challenger | Bloquants | Majeurs | Mineurs | Score |
|---|---|---|---|---|
| Exploitation système (E) | 0 | 1 | 0 | 92 |
| Sécurité et RGPD (S) | 0 | 2 | 0 | 84 |
| Restauration (Rs) | 0 | 1 | 1 | 90 |
| Testabilité (T) | 0 | 2 | 2 | 80 |
| **Global** | 0 | 6 | 3 | **87** |
(Arrondi : 86,5 → 87. Le majeur restant de Testabilité compte deux fois : T19 et T20.)

## Statut des retours du tour 1
Exploitation : E1 à E13 résolus. Sécurité : S1 à S4, S7 à S9, S11, S12 résolus ; S5 partiel (écarté par l'arbitre : sans conséquence, contrôle tenu par `prepare-serveur.sh`). Restauration : Rs1 à Rs3, Rs5 à Rs8, Rs10 résolus ; Rs4 et Rs9 partiels (écartés : doublons de Rs11). Testabilité : tous résolus sauf T7 (reste mineur).

## Retours recevables bloquants et majeurs
| # | Constat (résumé) |
|---|---|
| E14 | Le nettoyage après arrêt de l'unité effacerait les fichiers d'une sauvegarde manuelle en cours ; le nettoyage au démarrage doit suivre la prise du verrou |
| S13 | Rien ne garantit que la copie transférée dans le volume disparaît si la restauration échoue |
| S14 | Les identifiants S3 « administrateur » n'ont pas d'emplacement ; le guide pousserait à les poser sur le serveur |
| Rs11 | Cas « volume intact » : sauvegarder l'état actuel remplacerait la copie du jour qu'on veut restaurer ; pas de repli si la base est illisible |
| T19 | Aucun critère ne prouve le ping de `verif-disque.sh` |
| T20 | L'arrêt forcé (et `ExecStopPost`) n'est jamais exercé, faute de banc systemd désigné |

## Verdicts de l'arbitre
Recevables : Rs11 (majeur), Rs12 (ramené à mineur), S13, S14, E14, T19, T20 (majeurs), T7 reste et T21 (mineurs). Écartés : T22 (sans conséquence : verrou et durée d'une exécution), S5 partiel (sans conséquence), Rs4 et Rs9 partiels (doublons de Rs11).
Dérives : propositions qui décrivent un mécanisme (chemin, format de sortie, options) : seule l'exigence entre dans la spec. Aucun nouveau CA nécessaire. Conflit S14 / CA19 (utilisateur administrateur « au coffre ou désactivé ») : tranché par l'orchestrateur — au coffre, utilisé seulement depuis un poste (recommandation de l'arbitre). Point de méthode signalé : des brouillons de code existent avant la spec finale ; ils sont alignés sur elle à la réalisation.

## Traitement
| # | Statut | Où dans la spec finale |
|---|---|---|
| E14 | integre | R8 (nettoyage après prise du verrou ; après arrêt seulement si le verrou est libre) ; CA11 |
| S13 | integre | R16 (volume propre après restauration, réussie ou non) ; CA12 |
| S14 | integre | R18 (administrateur jamais sur le serveur, au coffre, depuis un poste) ; CA19 |
| Rs11 | integre | R16 (copie choisie mise de côté avant toute sauvegarde ; repli si base illisible) ; CA12 |
| Rs12 | integre | R16 (de quoi ouvrir chaque dossier ; aucun id listé ne reste) ; CA12 |
| T19 | integre | CA9 |
| T20 | integre | CA11 (banc systemd : SIGKILL, durée dépassée) |
| T7 | integre | CA19 (`verif-disque.sh`, lieu et utilisateur des relectures) |
| T21 | integre | CA19, H3 |
