---
type: cadrage
version: 1.4
mode: standard
type_version: livrable
sujet: correction-et-finitions
modules: aucun
challengers: relecteur technique et produit
date: 2026-10-27
---

# Cadrage — Textes justes en mode serveur, exemples hors de la base partagée, ancien modèle retiré

> Mode standard, version livrable. Trois fiches traitées (1.3-1, 1.3-2, 1.0-1), trois revérifiées sans être rouvertes (1.2-1, 1.2-2, 1.2-4).

## Mode et type
| | Choix | Raison |
|---|---|---|
| Mode | standard | Recommandé et confirmé : comportement qui dépend du mode (logique de page, test e2e), sans modèle, dépendance, API ni parcours nouveau |
| Type | livrable | Corrections destinées à être mergées |

## Périmètre
### Ce que le pitch demande
- 1.3-1 : en mode serveur, le bandeau jaune des 6 pages dit « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. » (texte décidé par l'utilisateur) ; texte actuel inchangé en mode navigateur.
- 1.3-2 : en mode serveur, plus de « Charger des exemples » (section Sauvegarde et tableau vide), texte du tableau vide sans la phrase sur les exemples, « Retirer les exemples » seulement si la base contient des exemples ; doc produit mise à jour.
- 1.0-1 : suppression de `docs/modele-de-donnees.md` (décision de l'utilisateur) et de ses renvois.
- 1.2-1, 1.2-2, 1.2-4 : revérification seulement (déjà `fait` en 1.3).

### Hors périmètre
- Les autres textes qui parlent encore du stockage local en mode serveur (`commun.introuvable`, `commun.lienAide`, titre « Sauvegarde et exemples ») : pas demandés ; candidats au backlog.
- Le texte du bandeau en mode bloqué et pendant l'attente du démarrage : inchangé.
- L'essai manuel avec un vrai compte Google (1.2-1) : reste au guide de test de la 1.3.
- 1.2-3, 1.3-3 à 1.3-8 et les autres fiches ouvertes.

## Existant réutilisé
| Besoin | Existant | Décision | Référentiel |
|---|---|---|---|
| Savoir le mode | `DEMARRAGE.mode()`, `serveur()` de `assets/demarrage.js` | réutiliser | [Mode serveur](../../../technique/mode-serveur.md) |
| Retirer une offre en mode serveur | retrait de « Remplacer tout » dans `DEMARRAGE.pret.then` de `candidatures/index.html` | réutiliser le même procédé | idem |
| Textes | `assets/wording.fr.js` (`commun`, `tableau.vide`) | étendre | idem, § Textes |
| Retirer les exemples | `STORE.clearDemo` (`meta.demo`) | réutiliser | — |
| Tests | `tools/test-serveur.js`, `tools/e2e-serveur.py` | étendre | [Conventions](../../../technique/conventions.md#tests) |

## Décisions demandées à l'utilisateur
Posées au démarrage (2026-10-27) : niveau → standard ; texte du bandeau → « Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés. » ; `docs/modele-de-donnees.md` → supprimé.
