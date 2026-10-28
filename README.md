# Expérience collaborateur Yeita · recrutement

Le site du parcours de recrutement Yeita : le hub, les fiches d'entretien et les supports candidat.

Ce dépôt est la source du site : les pages, leurs fichiers partagés et une étape de publication qui permet d'imprimer et d'exporter en PDF.

## Les pages

| Page | Rôle | Pour qui |
|---|---|---|
| `index.html` | Le hub : la démarche, le guide du recruteur étape par étape, l'inventaire des supports, le glossaire. Liens directs : `#guide`, `#supports`, une étape (`#ec1`…), ou une page (`#fiche-ec1`, `#fiche-ec2`, `#carte`, `#decompte`, `#feuille-vierge`, `#kit`, `#one-pager`, `#candidatures`) | Interne |
| `candidatures/` | L'espace Candidatures (réservé à l'équipe une fois déployé) : le tableau (`index.html`), le parcours d'un candidat (`candidat.html?id=…`), les étapes EC1 et EC2 en pleine page (`ec1.html?id=…`, `ec2.html?id=…`), la carte d'identité (`carte.html?id=…`) et la feuille de décompte (`decompte.html?id=…`, ou `?vierge=1`). Modèle : `docs/backend/MODELE.md` ; textes : `assets/wording.fr.js` | Recruteurs |
| `one-pager.html` | Ton parcours chez Yeita : les étapes, les durées, les délais (A4) | Candidat |
| `yeita-match-kit.html` | Kit physique Yeita Match : 54 cartes sur 6 planches recto-verso (dont 4 cartes valeur) et plateau A3, sur le modèle du jeu en ligne | EC1 |

Les pages partagent `assets/` : la charte (`yeita.css`), les utilitaires et les icônes du jeu (`yeita.js`), les données de Yeita Match (`data-yeita-match.js`, reprises du dépôt `yeita-match`) la grille des 4 diamants (`data-diamants.js`), les critères d'employabilité et leurs phrases (`data-employabilite.js`) le dossier candidat (`dossier.js`), les règles du parcours (`store.js`) et ses textes (`data-parcours.js`).

Les anciennes pages `fiche-ec1.html`, `fiche-ec2.html`, `carte-identite.html`, `yeita-match-decompte.html` et `candidatures.html` sont des relais : elles redirigent vers l'espace Candidatures. La « passation » et le « débrief » s'appellent maintenant **Bilan EC1** et **Bilan EC2**.

## Comment les fiches se parlent

- Chaque page de l'espace porte l'identifiant du candidat (`?id=…`) : la fiche EC1, la fiche EC2, la feuille de décompte et la carte n'affichent que lui.
- Les fiches EC1 et EC2 enregistrent à chaque saisie sur la candidature ; la carte d'identité se compose toute seule à partir d'elles.
- Le résultat de Yeita Match arrive dans la fiche EC1 par la saisie à la main, l'import du fichier JSON du jeu en ligne (visio), ou la feuille de décompte du candidat (présentiel). Point d'entrée unique : `FICHE_EC1.setYeitaMatch`, décrit dans `docs/backend/MODELE.md`.
- Jusqu'au déploiement sécurisé, tout vit dans le navigateur (données fictives uniquement). Le stockage partagé (SQLite) et l'authentification se branchent derrière `assets/dossier.js` sans changer les pages : le contrat est décrit dans `docs/backend/MODELE.md`.

## Tests

| Commande | Ce qui est vérifié |
|---|---|
| `node tools/test-store.js` | Règles du parcours : migration, passages, refus, annulation, export et import, exemples |
| `python3 tools/e2e-candidatures.py` | Le tableau et l'appel : ajout, Qui es-tu, questions, one-pager, État, liste, export et import |
| `python3 tools/e2e-parcours.py` | EC1 et EC2 en pleine page, Bilans, EC3, Décision ; décompte → EC1, import JSON, refus au bilan, Vivier ; un lien par candidat, anciennes adresses, téléphone |
| `python3 tools/e2e-liens.py` | « Précédent », liens directs, feuille de décompte vierge |
| `python3 tools/e2e-pdf.py` | Exports PDF : carte d'une candidature, feuille vierge |
| `cd api && npm test` | L'API de stockage : autorisation, dossiers, conflits, effacement, `equipe.js`, `sauvegarde.js`, démarrage |
| `bash tools/test-auto-deploy.sh <dépôt>` | `deploy/auto-deploy.sh` et la pause de `deploy/deploy.sh` avec un faux docker et un dépôt nu : décisions, demandes refusées, tests KO, retour automatique, annulation, verrous, état de la page. En root, dans un conteneur jetable `ubuntu:26.04`, avec `AUTO_DEPLOY_JETABLE=oui` ; finit par `TOUT OK` |
| `bash tools/test-sauvegarde.sh <dépôt>` | `deploy/backup.sh` et `deploy/verif-disque.sh` avec de faux outils : réglage refusé, chaque échec écrit dans l'état des sauvegardes, aucun clair laissé, rétention, disques. En root, dans un conteneur jetable `ubuntu:26.04`, avec `BANC_JETABLE=oui` (utilisateur `deploy`, `/var/backups/recrutement`, docker, age) ; finit par `TOUT OK` |

Les tests de navigateur demandent le site construit et servi : `python3 tools/build.py _site && python3 -m http.server 8765 --directory _site`.

## L'API de stockage

Le serveur qui gardera les dossiers dans SQLite, derrière oauth2-proxy, est dans [`api/`](api/README.md) : installation, première mise en place, gestion de l'équipe (`node api/equipe.js`), mode local et contrat HTTP. Les pages ne l'utilisent pas encore.

## Publier

Le site est servi sur `https://recrutement.yeita.fr`, depuis le serveur OVH de Yeita, dans Docker : l'espace Candidatures y demande un compte Google @yeita.fr, les pages destinées aux candidats restent publiques. GitHub Pages n'est plus utilisé ; il n'y a pas de GitHub Actions : c'est le serveur qui vérifie `main`.

- **Merge sur `main` = en ligne sous 10 minutes, si les tests passent.** Toutes les 10 minutes, le serveur teste le dernier commit de `main` (`node tools/test-store.js`, `npm test` dans `api/`, `docker compose build`) à part, puis le met en ligne. Un test en échec : le commit n'est pas mis en ligne.
- **Suivre et déployer** : `https://recrutement.yeita.fr/admin/deploiement.html` (rôle admin) : ce qui est en ligne, les passages avec la sortie de chaque étape, « Déployer maintenant ». Détail sur le serveur : `sudo journalctl -u recrutement-deploy`.
- **Revenir en arrière** : « Déployer ce commit » sur la page (les tests sont relancés), ou `deploy/deploy.sh <hash>` en SSH : l'un comme l'autre **met l'automatisme en pause** ; une fois `main` corrigé, « Reprendre » sur la page.
- **Secours sans tests** : `deploy/deploy.sh` en SSH.

Installation des unités systemd, diagnostic et cas particuliers : [`deploy/README.md`](deploy/README.md), section 15 ; mise à jour pas à pas : [`deploy/METTRE-A-JOUR.md`](deploy/METTRE-A-JOUR.md).

Pour construire en local : `python3 tools/build.py` (le site sort dans `_site/`). Pour lancer le site comme sur le serveur : `cp .env.example .env && docker compose up -d --build`, puis `https://localhost`.

## Mettre à jour

Le dépôt est la seule source de vérité : on ne recopie plus rien depuis l'artefact Claude. Chaque changement se fait sur une branche, puis passe par une pull request vers `main` (détail dans `CONTRIBUER.md`). `index.html` reste un fragment (sans `<html>` ni `<head>`) : c'est voulu, l'étape de publication l'enveloppe.
