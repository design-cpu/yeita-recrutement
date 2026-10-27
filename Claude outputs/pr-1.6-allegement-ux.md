# 1.6 — Allègement de l'interface de Candidatures après le test avec Lise

Branche `feat/allegement-ux-test-lise` → `main`. **Ne pas merger avant relecture.**

## Ce qui change
**Principe :** le recruteur ne voit que l'endroit où il est, ce qu'il remplit et l'action suivante. La méthode est rangée dans le guide de l'étape.

- **Lot 1 (toutes les étapes)**
  - Plus d'aides dépliantes, de rappels de méthode ni d'« À remplir / Rempli ». Les exemples restent en placeholder.
  - « Guide de l'étape » sans numéro. Un seul dépliant, avec un chevron.
  - Plus de badge dans les étapes.
  - Le menu ⋯ réunit Fiche du candidat, Historique, Copier le lien et Supprimer, chacun dans une fenêtre.
  - Le passage d'étape est confirmé (« EC1 validé → Bilan EC1 »), avec Annuler.
  - Un écran de fin suit « Arrivée confirmée ».
  - « No go » devient « Non retenu ».
- **Lot 2 (tableau)**
  - Toute la carte est cliquable. Les recruteurs apparaissent par leur prénom.
  - Le menu ⋯ est sur les cartes et sur les lignes de la liste.
  - « Démarrer l'appel maintenant » remplace l'ancien libellé.
- **Lot 3 (notes)**
  - Un panneau Notes, à droite, ouvert à tout moment sans perdre le défilement. Une note par étape (`notesLibres[étape]`).
  - L'EC1 commence par « Échange libre ».
  - `ec2.notesLibres` et `ec3.notes` sont repris à la lecture, sans rien supprimer.
- **Lot 4 (fiches)**
  - EC1 :
    - « Non communiqué au candidat » et « Visible sur la carte du candidat » remplacent les anciennes étiquettes.
    - Employabilité : un critère devient visible dès qu'un état est choisi, avec l'interrupteur « Masquer sur la carte ».
  - Bilans et EC3 : la carte s'affiche en pleine largeur, avec le bouton Imprimer.
  - « Mettre en attente (retour à faire) » remplace l'ancien libellé.
  - EC2 :
    - Le rôle est en lecture seule, repris du Job.
    - Le palier est suggéré à partir du souhait de rémunération (grille Figma 2026). Il est marqué « suggéré » et reste modifiable.
    - Le « point d'appui » est supprimé.
    - La trame, le barème et l'attendu par palier sont rangés dans le guide.
  - L'appel au candidat passe de Décision à Proposition.
  - Le mail contient deux liens, lus dans la config.
- **Lot 5 :** mention RGPD sur la carte (écran et PDF) et sur la page des étapes. La durée et le contact se règlent dans `config.rgpd`.

## Également corrigé
- Les fiches EC1 et EC2 modifiaient le dossier lu, qui sert de base de comparaison. À la réouverture d'une fiche partielle, cela pouvait déclencher à tort « modifiée par quelqu'un d'autre ».
- Un test API était instable (la ligne « Mode local » était lue trop tôt). Seul le test change, pas le code de l'API.

**Non touché :** authentification, SQLite et API (le dossier reste un JSON opaque), Docker, déploiement, règles de sécurité.

## Tests
- `node tools/test-store.js` : TOUT OK. Nouveaux contrôles : palier suggéré, reprise des notes, RGPD identique entre la page publique et la config.
- `node tools/test-serveur.js` : TOUT OK (87).
- `cd api && npm test` : 52/52.
- `e2e-candidatures`, `e2e-parcours`, `e2e-liens`, `e2e-pdf` : ALL OK.
- `e2e-serveur` : TOUT OK.
- Candidats fictifs :
  - un parcours complet jusqu'à l'écran de fin ;
  - un refus au Bilan EC1 ;
  - une mise en attente ;
  - un palier suggéré (64 k€ → palier 3).
- Vérifié aussi : Notes, menu ⋯ au clavier, PDF avec la mention RGPD, téléphone sans défilement horizontal.
- **À lancer par Léo :** `docker compose up -d --build`, puis `tools/check-site.sh https://localhost`.

## Points ouverts
1. **Titre de la page parcours et objet du mail.** En place : « Les étapes de ton recrutement chez Yeita » et « Yeita : la suite de ton recrutement ». Autres propositions :
   - titre : « Ton recrutement chez Yeita, étape par étape » ou « Ce qui t'attend chez Yeita, de l'appel à l'arrivée » ;
   - objet : « Suite à notre appel : les étapes chez Yeita » ou « Ton recrutement chez Yeita, ce qui t'attend ».
2. **RGPD (backlog 1.6-2).** La durée (6 mois) et le contact (provisoire) sont à valider avant tout envoi réel. La page publique ne peut pas lire la config : les valeurs y sont recopiées, et un test vérifie qu'elles restent identiques.
3. **Noms des paliers (backlog 1.6-1).** La scorecard et la grille Figma ne nomment pas les paliers 2 et 3 de la même façon.
4. **One-pager hébergé (backlog 1.6-3).** Il suffira de remplacer l'adresse Notion dans `config.pagesCandidat.pourNousDecouvrir`.
5. **Palier vide (backlog 1.6-4).** Si le souhait de rémunération est illisible, le palier reste vide. Piste : un champ de montant structuré.
6. **Critères de la scorecard EC2.** Les 48 critères restent repliables (avec un chevron) sous chaque étape, comme aide pour noter. On peut les retirer aussi si tu préfères.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01XFYeE8HtJYdcNPML1S2ton
