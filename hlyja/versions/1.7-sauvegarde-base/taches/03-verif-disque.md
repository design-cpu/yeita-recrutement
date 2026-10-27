---
type: tache
version: 1.7
numero: 03
titre: deploy/verif-disque.sh
statut: faite
date: 2026-10-27
---

# Tâche 03 — `deploy/verif-disque.sh`

## Ce que ça change
`deploy/verif-disque.sh` (nouveau) : corps dans `main`, refus de root, `umask 077`, adresse `HEALTHCHECK_DISQUE_URL` validée par `adresse_hc` (différente de celle de la sauvegarde) ; dossier Docker par `docker info -f '{{.DockerRootDir}}'` ; `df --output=pcent` sur `/` et ce dossier ; `> 80` → `/fail` « Disque presque plein. … », code 1 ; mesure impossible → `/fail` « Mesure impossible … », code 1 ; sinon ping de succès avec les deux valeurs.
Défaut trouvé par le lanceur et corrigé : `racine=$(occupation /)` sortait par `set -e` quand `df` échouait, sans `/fail`.

## Tests
Section CA9 de `tools/test-sauvegarde.sh` (vrai `df`, faux `df` 80/81 sur `/` et sur un dossier Docker distinct, `df` et `docker info` en échec, adresses égales, `not found`, rien ne fuit, root) : dans les 111 vérifications, `TOUT OK`.

## Mutations
| # | Garde cassée | Classement | Assertion |
|---|---|---|---|
| B9 | `-gt` → `-ge` | détectée | `CA9 df 80,80 : code 0` |
| B15 | repli quand `df` échoue retiré | détectée | `CA9 df en échec : /fail` |
