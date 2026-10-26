---
type: tache
version: 1.2
numero: 02
titre: Configuration
statut: ok
date: 2026-10-26
---

# Tâche 02 — Configuration

> **QA : réussie** · 4 fichiers créés · 1 correction (test renforcé après mutation)
> Les variables sont lues et contrôlées en un seul endroit, avec un message clair pour chaque valeur refusée.

## Ce que ça change
`lireConfig(env)` rend la configuration de l'API ou lance une erreur qui nomme la variable en faute. Tout chemin relatif part de `api/`. Le mode local (`DEV_EMAIL`, `DEV_STATIC`) n'est accepté que sur une adresse de bouclage, hors production. `cheminBase(env)` sert aussi à `equipe.js`.

## Comment tester
`cd api && node --test test/config.test.js`
Résultat attendu : 7 tests réussis.

## Critères d'acceptation
- [x] CA11 (configuration) — refus de `DEV_EMAIL` et `DEV_STATIC` avec `HOST=0.0.0.0`, `NODE_ENV=production` ou `" Production "` ; `DEV_EMAIL` invalide ; `DEV_STATIC` absent, sans `index.html`, égal à `..`, contenant la base, lien symbolique vers la racine.
- [x] CA12 (configuration) — `PORT` absent ou vide → 8000 ; `abc`, `0`, `70000`, `8000 # x`, `# x` refusés ; `DB_PATH` `:memory:`, avec commentaire, guillemets, dossier existant refusés ; `DB_PATH` relatif résolu depuis `api/`.

## Ce qui a été fait
- `api/src/valeurs.js` : valeurs recopiées (schéma, motif d'`id`, étapes, `DISPOS`), motif d'email, rôles, message de conflit.
- `api/src/config.js` : `lireConfig`, `cheminBase`, `ErreurConfig` ; comparaison des chemins réels pour `DEV_STATIC`.
- `api/test/aide.js`, `api/test/config.test.js` ; script `test` limité à `test/*.test.js`.
Commits : `830e5c8` feat(api-sqlite): tâche 02 – configuration

## Résultat QA
| Vérification | Résultat |
|---|---|
| `node --test test/config.test.js` | 7/7 |
Corrections : la mutation M3 survivait (le cas `DEV_STATIC=..` était attrapé par le contrôle de la base) ; cas ajouté avec la base hors du site.

## Mutations
Copie hors du dépôt (`muter.py` du scratchpad), `node --test test/config.test.js`.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| NODE_ENV production | refus retiré | échec « refus attendu : DEV_EMAIL refusé : interdit quand NODE_ENV » | échec, message attendu |
| Bouclage | refus retiré | échec « interdit quand HOST » (DEV_EMAIL, DEV_STATIC) | échec, messages attendus |
| `api/` sous DEV_STATIC | contrôle retiré | échec « contient la base ou le dossier api » | 1er essai : **survit** ; après ajout du cas : échec attendu |
| Base sous DEV_STATIC | contrôle retiré | échec « contient la base » | échec, message attendu |
| `index.html` | contrôle retiré | échec « ne contient pas index.html » | échec, message attendu |
| PORT | motif remplacé par `parseInt` | échec « PORT refusé » | échec, message attendu |
| Casse de NODE_ENV | comparaison exacte | échec « interdit quand NODE_ENV » | échec, message attendu |
| `:memory:` | contrôle retiré | échec « DB_PATH refusé » | échec, message attendu |
| DEV_EMAIL invalide | contrôle retiré | échec « DEV_EMAIL refusé : « » | échec, message attendu |
Formes permises : `" Moi@Yeita.FR "` accepté (mis en forme), `HOST=::1` accepté pour le mode local, chemin absolu de `DB_PATH` accepté.

## Spec couverte
R8, R9, R10 (chemins), R30 ; CA11, CA12 (configuration)
