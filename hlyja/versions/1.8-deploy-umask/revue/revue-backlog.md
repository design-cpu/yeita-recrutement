---
type: revue-backlog
version: 1.8
candidats: 5
nouvelles: 1
occurrences: 0
rejetes: 4
---

# Revue du backlog — version 1.8

> La 1.8 laisse un seul sujet : un dépôt serveur déjà abîmé par un ancien déploiement à `umask 077` n'est pas réparé, et les images dépendent encore des droits du dépôt (fiche 1.8-1, qui réunit les candidats 1 et 2).

| Candidat | Source | Verdict | Fiche / raison |
|---|---|---|---|
| Réparer un dépôt serveur déjà abîmé (fichiers 600 non réécrits par git) | `spec/cadrage.md` Hors périmètre ; `qa/guide-test-humain.md` (contrôle `find`) ; `qa/rapport-qa.md` (témoin et son complément) | nouvelle | [1.8-1](../../../backlog/1.8-1-depot-serveur-deja-abime.md) |
| `chmod` / `COPY --chmod` dans `docker/api.Dockerfile` et `docker/front.Dockerfile` | `version.md` Plan d'équipe, Pas fait ; `spec/cadrage.md` Hors périmètre | nouvelle (même fiche) | [1.8-1](../../../backlog/1.8-1-depot-serveur-deja-abime.md) : même problème que le candidat 1 (images illisibles quand le dépôt a des fichiers fermés) ; piste 1 de la fiche |
| Verrou `~/.recrutement-deploy.lock` en 644 ou 600 selon le premier script | `revue/revue-code.md`, constat 4 | rejete | pas concret, rien à corriger : fichier vide, `/home/deploy` en 750, la revue conclut « sans effet pratique » et « Rien à faire » |
| `deploy/METTRE-A-JOUR.md` § 4 : exception du retour vers une version d'avant la 1.8 | `qa/rapport-qa.md`, À vérifier à la main ; `revue/revue-code.md`, constat 1 | rejete | dans le périmètre et déjà traité : `adb4587`, `METTRE-A-JOUR.md` l. 43 porte « Seule exception : si la commande qui vient d'échouer était déjà un retour vers une version d'avant la 1.8, ajouter `umask 022 &&` devant » (vérifié), source `mise-a-jour-production.md` alignée |
| Numéros de ligne de `assets/wording.fr.js` décalés dans `hlyja/technique/deploiement-ovh.md` | `revue/revue-doc.md` | rejete | déjà corrigé dans la version : la page cite l. 39 et 45, et `grep -n` donne `39: connecte: "Connecté·e : "` et `45: horsEquipe: "Tu ne fais pas partie de l'équipe."` |

Fiches existantes vérifiées : aucune ne traite la réparation d'un dépôt abîmé ni les droits dans les Dockerfiles. 1.7-1 (planifiée en 1.8) porte la prévention (`umask 022` dans `deploy.sh`), pas la réparation de l'état laissé par les anciens déploiements : sujet distinct, pas d'occurrence. Doc produit (`stockage-partage.md`) : aucune règle sur les droits des fichiers.

## Doublons fusionnés
Aucun.
