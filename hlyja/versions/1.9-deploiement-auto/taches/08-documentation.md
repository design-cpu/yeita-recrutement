---
type: tache
version: 1.9
numero: 08
titre: Documentation du projet
statut: ok
date: 2026-10-28
---

# Tâche 08 — Documentation du projet

> **QA : réussie** · 4 fichiers modifiés · bloc d'installation identique à celui essayé sur le banc systemd
> Le mode d'emploi dit comment le site part en ligne, comment le suivre, revenir en arrière et reprendre.

## Ce que ça change
`README.md` « Publier » : merge = en ligne sous 10 minutes si les tests passent ; suivre et déployer sur `/admin/deploiement.html` (détail : `journalctl -u recrutement-deploy`) ; revenir en arrière par « Déployer ce commit » ou `deploy.sh <hash>` (met en pause), puis « Reprendre » ; secours sans tests : `deploy.sh`. `deploy/README.md` : section 15 (fonctionnement, mise en service, quotidien, tableau de diagnostic, risque résiduel, retrait), sections 9, 10 et 14 ajustées (maintenance de Docker). `deploy/METTRE-A-JOUR.md` : introduction, avant, section 4, « 1.9 — déploiement automatique », « Revenir avant la 1.9 ». `api/README.md` : les deux routes.

## Comment tester
Lire `README.md` § Publier et `deploy/README.md` § 15 ; `bash -n` et `zsh -n` sur les blocs.

## Critères d'acceptation
- [x] CA18 — ce que le pitch demande est écrit ; blocs shell vérifiés : `bash -n` et `zsh -n` sur tous les blocs de `README.md`, `deploy/README.md`, `deploy/METTRE-A-JOUR.md` (seul échec : le bloc existant `deploy/deploy.sh <commit>`, un gabarit) ; bloc d'installation de § 15 extrait du README et comparé (`diff`) au script essayé sur le banc systemd : identique ; essayé dans les 4 cas (copiée, identique, différente, point de montage faux).

## Ce qui a été fait
Commits : `339265b` (docs), ajout du risque résiduel (S8) avec la revue.

## Résultat QA
| Vérification | Résultat |
|---|---|
| `diff` bloc README / script essayé | identique |
| Banc systemd : installation | `copiée` ×3, puis `identique` ×3, `DIFFÉRENTE` (code 1, rien d'écrasé), `ARRÊT : le volume …` (code 1) ; `systemd-analyze verify` code 0 |

## Spec couverte
CA18, Exploitation, Déploiement et compatibilité
