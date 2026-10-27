---
type: tache
version: 1.7
numero: 06
titre: deploy/RESTAURER.md et sa répétition sur le banc
statut: faite
date: 2026-10-27
---

# Tâche 06 — `deploy/RESTAURER.md`

## Ce que ça change
`deploy/RESTAURER.md` (nouveau) : tableau des cas ; « Avant de commencer » (outils du poste, `umask 077`, `mktemp -d`, clé contrôlée par `age-keygen -y`, identifiants « restauration » en variables d'environnement par `read -s`) ; trois programmes `node` créés sur le poste et envoyés par l'entrée standard au conteneur (`controle.mjs`, `suppressions.mjs`, `remplacer.mjs` : empreinte SHA-256 et `integrity_check`/`user_version` vérifiés avant de remplacer, sinon le temporaire est retiré) ; étapes 1 à 9 et 1 bis (volume intact) ; « Serveur perdu » avec sa limite ; « Ouvrir une copie ». Aucun code ajouté à `api/`.

## Répétition (CA12)
Banc `banc-1.7-systemd`, `scratchpad/banc/banc-restaurer.sh` : les trois programmes sont **extraits tels quels** de `RESTAURER.md` ; « poste » = dossier `mktemp -d` de root, remote `restau` par variables d'environnement (alias local) ; `ssh deploy@SERVEUR '…'` remplacé par `runuser -u deploy -- bash -c "cd /opt/recrutement && …"`, entrées standard gardées.
| Cas | Résultat |
|---|---|
| A — base existante : copie, puis dossier supprimé par l'API et dossier créé | étape 4 réussie ; étape 5 liste `cand-a-1` ; transfert tronqué (5 000 octets) → `REFUS : empreinte …`, base d'origine identique (SHA-256), volume propre ; vrai transfert → `Base remplacée.` ; api `healthy` ; `/data` = base, `-wal`, `-shm`, `sauvegardes` ; base `node:600` ; comptes = ceux de la copie (502) ; `À SUPPRIMER https://recrutement.yeita.fr/candidatures/candidat.html?id=cand-a-1` ; supprimé par l'API (= interface), puis `rien à faire : cand-a-1` |
| B — volume intact, copie de `/data/sauvegardes` (1 bis) | copie mise de côté et contrôlée, puis étape 4 (qui remplace la copie du jour), puis remplacement → comptes de la copie mise de côté (501), pas de l'état présent (506) ; volume propre |
| C — volume neuf (`docker volume rm recrutement_data`, api relancée sur base vide) | copie récupérée par le remote du poste, déchiffrée, remplacée → comptes de la copie ; volume propre |
| Étape 9 | dossier du poste effacé |
Un contrôle « repère absent hors du volume » a échoué au passage : le dossier « poste » du banc était sous `/tmp` du même conteneur et contenait la copie déchiffrée. Après l'étape 9, le repère n'est plus nulle part dans `/var/backups`, `/tmp`, `/home/deploy`, `/opt/recrutement` (vérifié).
`readonly` sur la base arrêtée (`suppressions.mjs`) : fonctionne (V5 confirmé).
