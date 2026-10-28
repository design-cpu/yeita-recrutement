---
type: tache
version: 1.7
numero: 01
titre: api/sauvegarde.js et ses tests
statut: faite
date: 2026-10-27
---

# Tâche 01 — `api/sauvegarde.js` et ses tests

## Objectif
Copie cohérente et contrôlée de la base (R1-R4), dernière ligne = chemin (contrat de `backup.sh`).

## Ce que ça change
- `api/sauvegarde.js` (nouveau) : connexion en lecture seule (`fileMustExist`), `db.backup()` vers `recrutement-AAAA-MM-JJ.db.tmp-<pid>`, `integrity_check`, `journal_mode = DELETE`, renommage ; `--nettoyer` (motifs exacts, date de modification > 48 h, jamais la copie faite) ; masque 077 ; messages en français, code 0/1. Réutilise `cheminBase`, `ErreurConfig`, `estOccupee`, `ATTENTE_MS`. Aucun autre fichier de `api/` touché hors tests.
- `api/test/equipe.test.js` : en-tête « commandes en ligne » ; 3 tests (CA1, CA2, CA3). `api/test` reste à 7 fichiers.

## Tests
`cd api && npm test` → `ℹ tests 55`, `ℹ pass 55`, `ℹ fail 0` (52 avant + 3). Échéance : 15 s par processus fils, 20 s pour CA1.
Ligne de verdict : `ℹ fail 0` (node:test, code de sortie non nul en échec).

## Mutations
Copie de `api/` dans le scratchpad, `node --test --test-timeout=30000 test/equipe.test.js`.
| Mutation | Classement | Message obtenu |
|---|---|---|
| M1 contrôle `integrity_check` ignoré | détectée | CA2 : `Expected values to be strictly equal` (code 0 au lieu de 1) |
| M2 `journal_mode = DELETE` retiré | détectée | CA1 : `Expected values to be strictly equal` (`wal` ≠ `delete`) |
| M3 écriture directe sous le nom final | détectée (après renfort) | CA2 : `ni temporaire ni copie abîmée` — au premier passage survivante : le test ne posait pas de bonne copie du jour à préserver ; ajoutée |
| M4 motif de `--nettoyer` élargi | détectée | CA3 : `Copies de plus de 2 jours supprimées : 2.` non trouvé |
| M5 48 h → 24 h | détectée | CA3 : idem |
| M6 masque 077 retiré | détectée (après renfort) | CA1 : `'644' !== '600'` — au premier passage survivante : le fils héritait du masque 077 pris par le processus de test ; les tests lancent désormais `sauvegarde.js` sous `umask 022` |
| M7 garde « jamais la copie faite » retirée | équivalente | la copie qui vient d'être faite a toujours moins de 48 h ; garde défensive (horloge reculée), gardée |
Retour à l'état d'origine : 55/55.
