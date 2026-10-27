# 1.7 — Fiche du candidat, dépôt de fichiers et harmonisation des étapes

Branche `feat/fiche-candidat-harmonisation` → `main`. **À tester en local avant merge.**

## Ce qui change
- **Création = la fenêtre « Fiche du candidat ».**
  - « Ajouter un candidat » ouvre la même fenêtre que le menu ⋯, en création.
  - Deux actions en pied : « Passer à l'appel de découverte » (principale) et « Enregistrer et revenir à la liste ».
  - Le bloc de l'appel et la fenêtre utilisent un seul composant : 4 groupes (Identité, Contact, Documents, Suivi), même ordre, grille de 3 colonnes (2 puis 1 sur petit écran).
- **CV et Portfolio :** « Déposer un fichier » (trombone, glisser-déposer) ou « Coller un lien ».
  - Un fichier rempli affiche son nom, sa taille, « Ouvrir » et « Retirer ».
  - Un lien rempli affiche le lien cliquable, « Modifier » et « Retirer ».
- **Stockage des fichiers :**
  - table `fichiers` dans la base SQLite existante (schéma v2, migré au démarrage, rien n'est perdu) ;
  - 4 routes sous `/api/candidats/:id/fichiers`, sans nouvelle dépendance ;
  - PDF, PNG, JPG vérifiés sur leur contenu, 10 Mo au plus, noms nettoyés ;
  - fichiers effacés avec le candidat, y compris sur le disque ;
  - dépôt et retrait tracés dans l'historique.
- **Largeur commune : 1120 px** pour toutes les étapes. La scorecard EC2 (palier sur une ligne, 4 tuiles, radar) et la carte d'identité y tiennent, et dès 1360 px d'écran le panneau Notes s'ouvre à côté en laissant au moins 900 px de contenu. En dessous, il passe par-dessus. C'est documenté dans hlyja (Conventions).
- **Étapes :**
  - Appel : les liens utiles sont retirés.
  - EC1 :
    - « Liens et outils » est retiré, avec Tout déplier, Copier pour Notion et Vider la fiche ;
    - la section s'appelle « Yeita Match » ;
    - en visio, un bouton « Ouvrir Yeita Match en ligne » s'affiche à côté du choix.
  - EC2 :
    - la grille de salaire devient une icône de lien externe (aria-label, infobulle) ;
    - le sélecteur de palier ne passe jamais à la ligne ;
    - la ligne « Junior 0 à 1 · Intermédiaire 2 à 3 · Senior 3 à 4 » est remise sous le barème ;
    - « Liens et outils » est aussi retiré, par cohérence avec l'EC1.
  - Bilans EC1 et EC2 : la partie interne Yeita est dans la page, en lecture, sous la carte.
- **Règles communes :**
  - le sélecteur d'État est retiré des étapes (il reste sur le kanban et la liste) ;
  - les noms complets s'affichent partout, sauf sur la carte du kanban, qui garde les initiales.
- **RGPD :** durée de conservation de 22 mois, dans la config et sur la page des étapes.

**Non touché :** authentification, Docker, déploiement.

## Tests
- `cd api && npm test` : 60/60. Nouveaux tests : `fichiers.test.js` et la migration v1 → v2.
- `node tools/test-store.js` : TOUT OK.
- `node tools/test-serveur.js` : TOUT OK (87).
- `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` : ALL OK.
- `e2e-serveur` : TOUT OK, hors les contrôles « départ de la page ». Ils échouent par intermittence aussi sur `main` (backlog 1.7-3).
- Scénarios fictifs vérifiés :
  - une création puis « Passer à l'appel », avec un CV PDF déposé dès la création ;
  - une création puis « Enregistrer et revenir à la liste » ;
  - un CV en fichier (ouvert, en PDF, avec `nosniff`) et un portfolio en lien ;
  - la suppression d'un candidat avec ses fichiers (absents de l'API et des fichiers de la base) ;
  - un EC1 en visio ;
  - un EC2 sur les 4 paliers ;
  - les deux bilans avec leur partie interne ;
  - le téléphone, sans défilement horizontal.
- **À faire par Léo :** Docker en local.

## Pour tester en local
```
python3 tools/build.py _site
cd api && node equipe.js add moi@yeita.fr Moi recruteur
DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
Ouvre ensuite http://127.0.0.1:8000/candidatures/. Au premier démarrage, la base passe d'elle-même en version 2.

## Points ouverts
1. **Noms complets de l'équipe (backlog 1.7-5).** Ils sont lus dans `config.equipeNoms` ; seul « Léo Fuster » est renseigné.
2. **Feuille de décompte (backlog 1.7-4).** Elle n'a plus d'accès depuis l'EC1. Proposition : un bouton en présentiel, symétrique de celui du visio.
3. **Purge à 22 mois (backlog 1.7-2, à discuter).** Aucune purge automatique n'existe aujourd'hui ; la suppression reste manuelle.
4. **Onboarding hors du funnel de candidature (backlog 1.7-1, à discuter).**
5. **Contact RGPD.** Il est toujours provisoire (backlog 1.6-2).
6. **Déploiement.** Si un nginx existant est devant le site (cas A), il faut régler `client_max_body_size 10m`, sinon les fichiers de plus de 1 Mo sont refusés.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01XFYeE8HtJYdcNPML1S2ton
