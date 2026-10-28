---
type: technique
page: cle-sauvegarde
titre: La clé des sauvegardes
maj: 1.7
commit: 287c215
sources: deploy/CLE-SAUVEGARDE.md, deploy/backup.sh, deploy/commun.sh, .env.example
date: 2026-10-28
---

# La clé des sauvegardes

> Les copies de la base sont chiffrées avec age pour la clé publique `AGE_RECIPIENT` (`.env`). La clé privée n'est jamais sur le serveur : pour l'instant un fichier `.txt` gardé sur un Mac et partagé en main propre (décision de l'utilisateur, coffre plus tard : fiche 1.7-9). Référence projet : `deploy/CLE-SAUVEGARDE.md`.

## Gestes
| Geste | Commande | Contrôle |
|---|---|---|
| Installer (Mac) | `brew install age` ; `age --version` | un numéro de version |
| Créer (Mac) | `mkdir -p ~/cles-yeita && chmod 700 ~/cles-yeita && age-keygen -o ~/cles-yeita/cle-sauvegarde-recrutement.txt && chmod 600 …` | `age-keygen` refuse d'écraser un fichier existant (vérifié) |
| Clé publique | `age-keygen -y ~/cles-yeita/cle-sauvegarde-recrutement.txt` | ligne `age1…` |
| Mettre sur le serveur (`deploy`) | `read -r -p "Colle ta clé publique (age1…) puis appuie sur Entrée : " CLE` (ligne seule : un `read` dans un collage de plusieurs lignes lirait la ligne suivante), puis un bloc `if` : contrôle `^age1[a-z0-9]+$`, copie de `.env` dans `~/env-avant-cle` (hors du dépôt), suppression de l'ancienne ligne, saut de ligne garanti, ajout | « C'EST FAIT. Clé enregistrée : » et la ligne `AGE_RECIPIENT=` ; sinon « RIEN N'A ÉTÉ CHANGÉ » (essayé : clé valide, clé mal collée, `.env` sans saut de ligne final) |
| Vérifier (Mac) | `scp` de la dernière copie, `age -d -i …`, `sqlite3 -readonly … "SELECT 'Copie lisible : ' || count(*) …"`, dossier temporaire effacé | « Copie lisible : N candidature(s). » ; sinon `no identity matched any of the recipients` |
| Perdre / changer | nouvelle clé, nouvelle clé publique dans `.env`, sauvegarde, vérification ; ancien fichier gardé 30 jours | — |

## Refus de `backup.sh`
`AGE_RECIPIENT` vide, réduite à un commentaire, égale à l'exemple (`age1exemplearemplacer`), autre chose qu'une seule clé `age1…` (une clé SSH serait acceptée par age), ou refusée par `age -r … -o /dev/null` : état `echec` « réglages », code 1.

## Voir aussi
- [Mettre à jour le site en production](mise-a-jour-production.md)
- [Décisions](decisions.md) (chiffrement et clé)

## Historique
| Version | Changement |
|---|---|
| 1.7 | Création |
