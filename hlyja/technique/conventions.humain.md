---
type: technique
vue: humaine
page: conventions
titre: Conventions et tests
maj: 1.7
commit: 8db372f
sources: api/package.json, api/test/aide.js, README.md, CONTRIBUER.md, tools/build.py, tools/check-site.sh, compose.yaml, .dockerignore, .gitignore, tools/test-store.js, tools/test-serveur.js, tools/e2e-serveur.py, tools/e2e-candidatures.py, tools/e2e-parcours.py, tools/e2e-liens.py, tools/e2e-pdf.py, tools/test-sauvegarde.sh, deploy/backup.sh, deploy/verif-disque.sh
date: 2026-10-28
---

# Conventions et tests

> Comment le dépôt est rangé, publié et testé. Le site est publié à la main sur le serveur OVH, avec Docker. En v1.7 arrivent les fichiers des sauvegardes (unités systemd, pages de la clé, de la mise à jour et de la restauration), une page d'administration, et un banc de test pour les scripts de sauvegarde.

## Où se trouve quoi

| Dossier | Ce qu'on y trouve |
|---|---|
| racine | les pages du site ; quelques anciennes adresses renvoient vers `candidatures/` |
| `candidatures/` | l'espace Candidatures des recruteurs |
| `admin/` (v1.7) | les pages d'administration : pour l'instant, la page d'état des sauvegardes ; protégées par la connexion Google, sans lien depuis Candidatures |
| `assets/` | ce que les pages partagent : dossier candidat, règles du parcours, textes, démarrage et adaptateur du mode serveur |
| `docs/` | le modèle de données qui fait foi (`docs/backend/MODELE.md`) et son schéma |
| `tools/` | la construction du site, les tests, le contrôle du site déployé |
| `docker/` | les recettes des images du site (v1.1) et de l'API (v1.3) |
| `deploy/` | la configuration et les scripts du serveur, et leur mode d'emploi ; depuis la v1.7, les unités systemd (`deploy/systemd/`) et trois pages : la clé (`CLE-SAUVEGARDE.md`), la mise à jour (`METTRE-A-JOUR.md`), la restauration (`RESTAURER.md`) |
| `api/` | l'API de stockage, ses commandes (équipe, et sauvegarde depuis la v1.7), ses tests et son mode d'emploi |

Ne sont jamais commités : le fichier `.env` (les secrets), et dans `api/`, les bibliothèques installées et la base de données.

## Publier

```mermaid
flowchart LR
  A[Construction du site] --> B[Déploiement à la main]
  B --> C[Contrôle du site]
```

Le script de construction copie le dépôt sans ce qui ne doit pas être servi : outils, docs, fichiers Docker et de déploiement, trace Hlýja, fichiers `.env`, dossier `api/`. Le dossier `admin/` est publié, mais protégé. Le site est ensuite déployé à la main sur le serveur OVH.

## Tester

| Test | Ce qu'il vérifie | Ce qu'il demande |
|---|---|---|
| Règles du parcours | le dossier candidat et ses étapes | Node |
| Mode serveur sans navigateur | démarrage, adaptateur, bandeaux, identité, options, fiches, contre une fausse API ; 87 vérifications | Node 22 |
| Quatre tests de navigateur | tableau, parcours, liens, exports PDF, en mode navigateur | le site servi sur le port 8765, Playwright pour Python |
| Mode serveur de bout en bout | trois navigateurs (deux recruteurs, une lectrice) sur l'API réelle ; 51 vérifications | le site construit, l'API installée, Playwright |
| Tests de l'API | réglages, base, droits, dossiers, options, commande d'équipe, et depuis la v1.7 la commande de sauvegarde et la route de l'état ; 58 tests | Node 22, `npm ci` dans `api/` |
| Scripts de sauvegarde (v1.7) | sauvegarde et contrôle du disque : réglages refusés, chaque échec écrit dans l'état, aucune copie en clair laissée, ménage des vieilles copies, disques ; 102 vérifications | un conteneur jetable Ubuntu 26.04, en root, avec Docker, age, et `BANC_JETABLE=oui` |
| Contrôle du site | pages publiques ouvertes, pages protégées (dont la page d'état) renvoyées vers Google, API refusée sans connexion ; 7 contrôles | `curl`, un site déployé ou la pile locale |

Chaque test affiche `OK` ou `FAIL` ligne par ligne, puis un verdict. **Lis le verdict** : deux tests de navigateur (tableau et parcours) se terminent sans code d'erreur même en cas d'échec. Celui des scripts de sauvegarde finit par `TOUT OK`, ou par `ÉCHECS :` suivi du nombre d'échecs.

### Tester les scripts de sauvegarde
Le banc remplace Docker et la mesure du disque par de faux outils ; le chiffrement est le vrai. Chaque panne se provoque ainsi à la demande : API malade, copie ratée, chiffrement raté, disque plein, clé refusée. Le faux Docker écrit l'état dans un faux volume, pour vérifier ce que la page affichera.

> Le banc **vide** `/var/backups/recrutement`. Il refuse de démarrer sans `BANC_JETABLE=oui`, et sur une machine où les unités sont installées hors conteneur. Ne le lance jamais sur le serveur.

```bash
docker run --rm -e BANC_JETABLE=oui -v "$PWD:/depot:ro" <image du banc> bash /depot/tools/test-sauvegarde.sh /depot
```

L'essai réel, avec les vraies unités systemd, se fait sur une variante du banc qui fait tourner systemd, puis une fois à la mise en service sur le serveur.

## Les règles du serveur partagé

| Règle | En clair |
|---|---|
| Versions figées | les images servies (oauth2-proxy, Caddy) sont fixées à une version précise |
| Secrets dans `.env` seulement | rien de secret dans le dépôt ; la clé publique de sauvegarde n'est pas un secret, la clé privée ne va jamais sur le serveur |
| Jamais de commande Docker globale | le nettoyage ne vise que ce qui porte l'étiquette du projet |
| Réglages dans `compose.yaml` | journaux et redémarrage se règlent dans le projet, jamais dans la configuration globale de Docker |

> Les scripts du serveur ne s'essaient jamais sur le serveur : on les rejoue dans un conteneur qui imite un serveur neuf, sous Ubuntu 26.04 comme le serveur. Une variante fait tourner systemd pour essayer les timers.

Les scripts du serveur passent aussi `shellcheck` sans remarque. Il faut lui donner une langue qui accepte les accents, sinon il s'arrête ; la commande exacte est dans la version complète.

## Écrire du code

- Le code de l'API, ses noms et ses messages sont en français.
- Les textes affichés par les pages vivent dans `assets/wording.fr.js`.
- L'API n'emprunte rien aux pages : les valeurs partagées sont recopiées dans un seul fichier, avec leur source.
- Chaque test de l'API travaille sur une base jetable et arrête ce qu'il a lancé.
- Les scripts du serveur ont leur corps dans une fonction `main`, refusent root, et s'arrêtent avec un message clair.

## Branches

Une branche par sujet, puis une pull request vers `main`.

## Voir aussi
- [Comment les pages choisissent où ranger les dossiers](mode-serveur.md)
- [L'API de stockage](api.md)
- [Architecture et déploiement](architecture.md)
- [Décisions techniques](decisions.md)
- [Lancer le site avec Docker sur ton poste](docker-local.md)
- Les commandes exactes et les versions des outils de test sont dans la version complète.
