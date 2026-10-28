---
type: plan-de-test
version: 1.7
iteration: reprise
scenarios: 24
date: 2026-10-28
---

# Plan de test — Reprise 1.7 : sauvegarde chiffrée sur le serveur, avec page d'état

> 24 scénarios couvrant les critères actifs de la spec finale réécrite (CA1-CA16, CA19, CA22-CA27) · 7 couches couvertes, 3 écartées · 3 restaurations de bout en bout suivies à la lettre (`deploy/RESTAURER.md`) · partie A du guide de test jouée telle quelle · remplace le plan d'avant la reprise (rclone, healthchecks.io, OVH Object Storage).

QA indépendante, plan écrit à partir de la spec finale (2026-10-28), du guide de test humain et des pages `deploy/` (README § 14, RESTAURER, CLE-SAUVEGARDE, METTRE-A-JOUR), sans lire les fiches `taches/`. Les suites existantes sont la **non-régression** : elles ne comptent pas comme scénarios.

Environnements :
- **Mac** (zsh 5.9) : suites Node, partie A du guide, page rendue dans le navigateur de test (`mcp__Claude_Browser`) contre l'API locale (`DEV_EMAIL`, `DEV_STATIC=../_site`, base et `etat/` temporaires), un serveur par identité.
- **Banc** `banc17s` (Ubuntu 26.04.1, systemd PID 1, docker.io, `age`, utilisateur `deploy`, clone `/opt/recrutement` sur la branche) : vrais scripts, vraies unités, vraie image api. Le « Mac » des procédures est simulé par `root` du banc (`/root/poste/cle.txt`) : `ssh deploy@SERVEUR '<cmd>'` → `runuser -l deploy -c '<cmd>'` (entrée standard transmise), `scp deploy@SERVEUR:<f> <d>` → `cp`. Les blocs « Mac » sont en plus passés à `zsh -n` sur le vrai Mac.
- Appel de l'API « comme oauth2-proxy » : `docker compose exec -T api node` + `fetch` avec `X-Forwarded-Email`.

## Matrice critères × couches

| Critère | Unitaire | Intégration | Bout en bout | Non-régression | Sécurité | UI | Manuel |
|---|---|---|---|---|---|---|---|
| CA1-CA3 `sauvegarde.js` | `npm test` | — | S15 | `npm test` | — | — | — |
| CA4 sauvegarde réussie, état `reussie` | — | lanceur | S15, S17 | lanceur | S15 (repère) | — | B7 |
| CA5 échecs par étape, état `echec` | — | lanceur | S16 | lanceur | lanceur (rien ne fuit) | — | — |
| CA6 refus de `AGE_RECIPIENT` | — | lanceur | S23 (écriture de la clé) | lanceur | — | — | B4 |
| CA7 verrous, root, attentes | — | lanceur | S17 | lanceur | — | — | — |
| CA8 rétention 30 j | — | lanceur | — | lanceur | — | — | — |
| CA9 `verif-disque.sh` | — | lanceur | S15, S17 | lanceur | — | — | — |
| CA10 banc de bout en bout, repère | — | — | S15 | — | S15 | — | B9 |
| CA11 pannes sur le banc | — | lanceur (SIGTERM) | S16, S17 | — | — | — | — |
| CA12 `RESTAURER.md` à la lettre | — | — | S19, S20, S21 | — | S19 (tronqué) | — | — |
| CA13 unités, installation à trois issues | — | — | S18 | — | — | — | B5 |
| CA14 `prepare-serveur.sh` sans `age` | — | lanceur | — | lanceur | — | — | — |
| CA15 shellcheck, suites inchangées | — | — | — | 4 suites + shellcheck | — | — | — |
| CA16 doc à jour, plus de rclone/healthchecks | — | — | — | — | — | — | S24 |
| CA19 guide de test humain | — | — | S22 (partie A) | — | — | S22 | partie B |
| CA22 route admin, seuils, illisible | `npm test` | S14 | S15 | `npm test` | S14 | — | — |
| CA23 lanceur : état écrit, ni rclone ni curl | — | lanceur | — | lanceur | — | — | — |
| CA24 vrais scripts écrivent l'état | — | — | S15, S16, S17 | — | S15 (droits) | — | — |
| CA25 page : vert, rouge, rôles, 401, API absente | — | — | — | — | S7-S9, S12 | S1-S13 | B8 |
| CA26 7 contrôles, page publiée | — | S22 (build) | — | — | S24 (aucun lien) | — | B1 |
| CA27 blocs Mac sous `zsh -n`, lignes interactives | — | — | — | — | — | — | S23 |

« lanceur » = `tools/test-sauvegarde.sh` (faux outils), « B… » = étapes de la partie B du guide (serveur réel).

### Couches écartées
| Couche | Raison |
|---|---|
| Performance / charge | Base de quelques Ko à quelques Mo, une sauvegarde par nuit, une page lue à la main : aucune exigence de durée hors `TimeoutStartSec`. |
| Multi-navigateurs | Page de 140 lignes, sans dépendance, lue par 1 à 3 admins ; un navigateur de test (Chromium du volet) en largeur téléphone suffit. |
| Mutation ajoutée | Les mutations de la tâche 08 existent ; la QA rejoue les comportements sur les vrais composants plutôt que d'en ajouter. |

## Scénarios

### Page d'état dans le navigateur (CA25, UI)
| # | Scénario | Attendu |
|---|---|---|
| S1 | Admin, état frais, disque Docker à 80 % (borne) | Encadré vert « Tout va bien… », dernière réussite en heure de Paris, 32 Ko, 3 copies, disques |
| S2 | Admin, aucun fichier d'état | Rouge : « Aucune sauvegarde réussie… », « Aucune mesure des disques… » |
| S3 | Admin, réussite à 27 h, mesure à 3 h | Rouge : motifs « plus de 26 heures » et « plus de 2 heures » |
| S4 | Admin, dernière tentative `echec` (« api non saine »), disque `plein` 81 % | Rouge : les deux motifs, étape nommée |
| S5 | Admin, les 3 fichiers illisibles (`[1,2]`, texte, `null`) | Rouge : trois motifs « illisible » |
| S6 | Admin, disque `mesure-impossible` | Rouge : « La mesure des disques a échoué. » |
| S7 | Recruteur, puis rôle `lecture` | « Réservé aux admins de l'équipe. », aucun détail affiché |
| S8 | Hors équipe : adresse inconnue, membre désactivé | « Tu ne fais pas partie de l'équipe. » |
| S9 | Sans identité (session expirée) | « Session expirée : recharge la page pour te reconnecter. » |
| S10 | Site statique sans API (404) | « État indisponible ici : ce site n'a pas l'API. » |
| S11 | Serveur arrêté puis « Actualiser » | « Le serveur ne répond pas. Réessaie dans un instant. » |
| S12 | Étape d'état contenant `<img onerror=…>` (sécurité) | Affiché comme texte, aucune image, aucun script exécuté |
| S13 | Date de réussite dans le futur | Rouge, motif qui ne dit pas « plus de 26 heures » |

### Banc systemd (CA10, CA11, CA13, CA22, CA24)
| # | Scénario | Attendu |
|---|---|---|
| S14 | Route « comme oauth2-proxy » : admin, recruteur, inconnu | 200 ; 403 `admin-requis` ; 403 `hors-equipe` |
| S15 | `systemctl start` des deux services réels | `.db.age` 600 chiffré, `/data/etat` 700 et fichiers 600 `node`, route qui rend l'état ; copie déchiffrée `ok` avec les repères ; repère absent du `.db.age` et du disque hors volume |
| S16 | `backup.sh` réel, api arrêtée | Code 1, état `echec` « api non saine » écrit api arrêtée, `sauvegarde-reussie.json` inchangé, aucune copie ajoutée |
| S17 | `verif-disque.sh` et une 2e `backup.sh` pendant une sauvegarde ; root | Disque mesuré sans gêner ; 2e : verrou, code 1, aucun état écrit ; root refusé |
| S18 | Installation des unités (`deploy/README.md` § 14) après un commit qui les change | « DIFFÉRENTE » sans rien écraser ; mise à jour documentée ; « identique » ; unité absente « copiée » ; `systemd-analyze verify` muet |

### Restauration (CA12), `RESTAURER.md` à la lettre
| # | Scénario | Attendu |
|---|---|---|
| S19 | Base existante, copie plus ancienne (étapes 1 à 9), avec un dossier supprimé après la copie, plus un transfert tronqué à l'étape 6 | Tronqué : `REFUS : empreinte…`, base intacte ; puis « Base remplacée. », `healthy`, volume propre, `À SUPPRIMER` puis `rien à faire` après suppression, poste effacé |
| S20 | Volume intact : 1 bis puis 4 à 8 | Copie de `/data/sauvegardes` contrôlée, base remplacée, suppression d'après la copie listée |
| S21 | Volume neuf (volume supprimé), étapes 1 à 9 + transfert tronqué | Base remplacée, `etat/` présent, comptes de l'étape 3 |

### Guide, documentation
| # | Scénario | Attendu |
|---|---|---|
| S22 | Partie A du guide telle quelle sous zsh (A1, A2, A3 + navigateur) | `ℹ tests 58` / `ℹ fail 0` ; `TOUT OK` ; page verte décrite en A3 |
| S23 | Blocs de CLE-SAUVEGARDE, METTRE-A-JOUR, RESTAURER, guide, README § 14 : `zsh -n` et `bash -n` ; commande d'écriture de la clé (bonne clé, vide, clé SSH, `.env` sans fin de ligne) puis `git status` du dépôt du serveur | Aucun bloc refusé ; refus sans rien changer ; une seule ligne `AGE_RECIPIENT` ; dépôt du serveur toujours propre pour `deploy.sh` |
| S24 | Plus aucune mention de rclone / healthchecks / OVH Object Storage dans le code et la doc du projet (grep de CA16 + `hlyja/` hors `versions/`) ; aucun lien vers `/admin/` depuis les pages | Rien, sauf le serveur OVH lui-même ; aucun lien |
