---
type: revue-spec
version: 1.4
bloquants: 0
majeurs: 2
integres: 5
escalade: non
date: 2026-10-27
---

# Revue de la spec — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> 2 majeurs et 3 mineurs, tous intégrés ; aucun bloquant, pas d'escalade. Le plus utile : un clic sur « Charger des exemples » pendant l'attente du démarrage aurait écrit les exemples dans la base partagée.

## Revue technique et produit
| # | Regard | Sévérité | Section | Constat | Proposition |
|---|---|---|---|---|---|
| 1 | T + P | Majeur | R4, R3, CA7 | `#demo-load` est dans la page dès le départ, retiré seulement au `pret` ; un clic pendant l'attente (jusqu'à 10 s) lance `clearDemo().then(loadDemo)`, mis en file par l'adaptateur d'attente puis exécuté en mode serveur : les exemples arrivent dans la base | Le gestionnaire de `#demo-load` / `#empty-demo` ne fait rien si `DEMARRAGE.mode() !== "navigateur"` ; cas e2e avec `/api/equipe` ralenti ; mutation dans CA7 |
| 2 | T | Majeur | R1, CA2 | Le procédé de R1 n'est pas fixé ; le faux document de `test-serveur.js` rend `[]` pour `querySelectorAll` : CA2 ne peut rien observer | Dans `serveur()`, chaque `[data-t="commun.fictif"]` reçoit `data-t="commun.serveur"` et le texte ; `page()` étendu pour rendre un faux élément ; vérifier `textContent` et `data-t` |
| 3 | T | Mineur | R1, V2 | Rien n'empêche formellement l'analyseur de rendre la main entre `demarrage.js` et le script de la page | Le changement de `data-t` (point 2) règle ce cas ; reformuler V2 |
| 4 | T | Mineur | CA1 | Sans `?id=`, les pages peuvent être en état « introuvable » : contrôle fragile | Ouvrir les pages sur un dossier existant (`?id=<cid>`) |
| 5 | P | Mineur | R6 | La rangée `.save-row` vide n'est pas décrite | Écrire qu'elle reste vide, sans autre texte |

### Escalade
Aucune.

## Traitement
| # | Statut | Justification / modification |
|---|---|---|
| 1 | integre | R4 (garde du clic hors mode navigateur) ; R6 (`#demo-clear` caché avant le premier affichage, même raison) ; CA3, CA7 |
| 2 | integre | R1 (procédé), CA2 |
| 3 | integre | R1, V2 reformulée |
| 4 | integre | CA1 |
| 5 | integre | R6 |
