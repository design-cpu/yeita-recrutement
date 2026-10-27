---
type: guide-test
version: 1.3
parcours: 6
date: 2026-10-26
---

# Guide de test — Pages de candidatures branchées sur l'API, API dans Docker derrière oauth2-proxy

> 6 parcours, ~40 min, dont deux **sur le serveur OVH** (on ne peut pas les faire ailleurs) : commence par les parcours 1 et 2, dans cet ordre, avant d'ajouter qui que ce soit à l'équipe.
> Avant de merger : lire aussi « Points d'attention » (deux défauts trouvés par la QA, à trancher).

## Préparer
Sur le poste, pour les parcours 3 à 6 (mode serveur en local, sans Google) :
```bash
git switch version/1.3-branchement-api
python3 tools/build.py _site
cd api && npm ci
export DB_PATH=/tmp/essai-13/recrutement.sqlite
node equipe.js add moi@yeita.fr Moi admin
node equipe.js add bob@yeita.fr Bob recruteur
node equipe.js add lea@yeita.fr Léa lecture
DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
Ouvre `http://127.0.0.1:8000/candidatures/`. Tout est dans `/tmp/essai-13` ; pour effacer à la fin : `rm -rf /tmp/essai-13`. En local, l'identité vient de `DEV_EMAIL` : pour jouer Bob ou Léa, relance l'API avec `DEV_EMAIL=bob@yeita.fr` (ou utilise une extension qui ajoute l'en-tête `X-Forwarded-Email`).

Sur le serveur, pour les parcours 1 et 2 : accès SSH en `deploy`, `/opt/recrutement`, et un compte Google @yeita.fr.

## Parcours essentiels
### 1. Contrôle réseau de la mise en service — priorité haute, sur le serveur
**Pourquoi** : l'API fait confiance à l'identité que lui transmet oauth2-proxy. Si un autre programme du serveur pouvait lui parler directement, il pourrait se faire passer pour n'importe quel membre de l'équipe. Ce contrôle vérifie que ce n'est pas possible. On le fait **après le premier déploiement de la 1.3 et avant d'ajouter le premier admin** : tant que l'équipe est vide, personne ne peut lire de dossier, même en cas de problème.
- [ ] Connecté au serveur en `deploy`, relever la version de Docker : `docker version --format '{{.Server.Version}}'`. L'écrire dans `deploy/README.md` § 1. Si elle est inférieure à 29.9.2, le signaler (la protection n'a été essayée que sur 29.9.2), et faire quand même le contrôle.
- [ ] Copier **tout** le bloc de `deploy/README.md` § 9b, étape 2, dans le terminal, puis Entrée. Il ne change rien, il lit et il essaie.
- [ ] Lire le résultat. **C'est bon** si les sept lignes commencent par `OK` et que la dernière dit « VERDICT : tout est bon » : passer au parcours 2.
- [ ] **Ce n'est pas bon** si une ligne commence par `PROBLÈME` : le verdict dit « NE PAS CONTINUER ». Faire ce qu'il dit (`docker compose stop api`, n'ajouter personne, revenir à la version précédente avec `deploy/deploy.sh <commit>`, section 10), copier l'affichage et l'envoyer.

Ce que veulent dire les lignes, si besoin :
| Ligne | Ce qu'elle vérifie |
|---|---|
| l'API tourne et va bien | le conteneur `api` est démarré et sa sonde de santé répond |
| le réseau de l'API est fermé | le réseau `back` est interne, sans IPv6, et n'a pas d'adresse sur le serveur |
| l'API n'a pas d'adresse IPv6 | aucune porte d'entrée par IPv6 |
| témoin | un conteneur placé exprès sur le réseau de l'API la joint : l'essai sait reconnaître une API joignable (sans ce témoin, les `OK` suivants ne prouveraient rien) |
| le serveur, par l'adresse de l'API / par 127.0.0.1:8000 | un programme du serveur ne peut pas parler à l'API |
| un conteneur en réseau hôte | un autre service Docker du serveur ne peut pas non plus |

### 2. H1 : l'email du vrai compte Google arrive à l'API — priorité haute, sur le serveur
- [ ] `docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin` (ton compte).
- [ ] Dans un navigateur, ouvre `https://recrutement.yeita.fr/candidatures/` : connexion Google, puis la page.
- [ ] Ouvre `https://recrutement.yeita.fr/api/moi` dans le même navigateur.
- [ ] Vérifier : `{"email":"prenom.nom@yeita.fr","prenom":"Prénom","role":"admin"}` (ton email, pas un autre). Un 401 ici : `docker compose stop api` et le signaler.
- [ ] Vérifier : en haut du tableau, à droite, « Connecté·e : Prénom » à la place de « Qui es-tu ? ».
- [ ] Dans une fenêtre privée (sans session), ouvre `https://recrutement.yeita.fr/api/moi` : 401, pas de page Google.

### 3. Deux recruteurs sur le même dossier — priorité haute
- [ ] Crée une candidature « Essai Conflit ». Ouvre-la dans deux onglets (ou deux navigateurs, un par compte sur le serveur).
- [ ] Onglet 2 : change l'e-mail, attends une seconde. Onglet 1 : fais défiler la page tout en bas, puis tape un téléphone.
- [ ] Vérifier : un bandeau rose reste collé en haut de l'écran : « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. Ce que tu as saisi depuis n'est pas enregistré : copie-le avant de recharger. Recharger » ; l'indicateur en haut du bloc dit « Non enregistré » ; ton téléphone est toujours dans le champ, et tu peux continuer à taper (le curseur n'a pas bougé).
- [ ] « Recharger » : la page revient avec l'e-mail de l'onglet 2, sans ton téléphone.
- [ ] Le texte du bandeau te paraît-il clair pour un recruteur ? (capture de référence : `/private/tmp/claude-501/-Users-sderrouazi-Documents-Yeita-Projects-Github-yeita-recrutement/d97386d7-da7f-4b43-bc26-6c29f916ac88/scratchpad/qa/captures/conflit-bas-de-page.png`, version téléphone : `conflit-mobile-defile.png` dans le même dossier)

### 4. Lecteur et compte retiré — priorité moyenne
- [ ] Avec le compte de Léa (`lecture`) : « Connecté·e : Léa · lecture seule » en haut ; le tableau et les dossiers sont visibles.
- [ ] Modifie un champ : bandeau « Lecture seule : tu ne peux pas modifier. », **sans** bouton.
- [ ] `node equipe.js disable bob@yeita.fr` (sur le serveur : `docker compose exec api node api/equipe.js disable …`) pendant que Bob a une page ouverte ; Bob recharge : « Tu ne fais pas partie de l'équipe. », aucun dossier. `add` le réactive.

### 5. Quitter la page juste après une frappe — priorité moyenne
- [ ] Dans `ec1.html` d'un candidat, tape une phrase dans « Ce qu'on a perçu » et clique **aussitôt** sur « Toutes les candidatures » (moins d'une demi-seconde).
- [ ] Rouvre la fiche : la phrase est là. Même essai dans `candidat.html` (un champ, puis retour au tableau).
- [ ] Sur le serveur, faire l'essai avec un **autre compte que le tien** (la QA l'a fait avec Bob sur le banc ; l'envoi de départ porte le cookie de session).

### 6. Hors du site de production — priorité basse
- [ ] `python3 -m http.server 8765 --directory _site`, puis `http://127.0.0.1:8765/candidatures/` : la liste « Qui es-tu ? » est là, tout marche comme avant (mode navigateur). Une erreur 404 sur `/api/moi` dans la console est normale.
- [ ] Ouvre `_site/candidatures/index.html` directement (fichier) : idem, sans erreur réseau.
- [ ] H2 : si tu as un aperçu de la page dans un artefact Claude, elle doit se comporter comme ci-dessus (mode navigateur si l'hôte rend 404). Note ce que tu observes.

## Points d'attention
- Les suites `tools/e2e-*.py` : lire leur **dernière ligne** (`ALL OK` ou `TOUT OK`) ; deux d'entre elles sortent avec le code 0 même en échec. Le défaut B1 de la QA (« SOMETHING FAILED » dû au 404 attendu de `/api/moi`) est corrigé.
- Le défaut B2 de la QA (volume en lecture seule, API restée « saine ») est corrigé : la sonde de santé passe en échec ; si l'équipe signale « Erreur interne. » à chaque enregistrement, regarder `docker compose ps api` et `docker compose logs api | grep SQLITE_READONLY`.
- Le bandeau jaune « Données fictives uniquement, jusqu'au déploiement sécurisé. Tout reste dans ce navigateur. » reste affiché en mode serveur, où il devient faux (hors périmètre de la spec : à décider avant d'y mettre de vraies candidatures).
- H4 : après la mise en service, chacun efface les données du site dans son navigateur (README § 9b, point 5). Confirmer qu'aucune vraie candidature n'était dans les navigateurs.
- Chaque déploiement coupe l'API ~15 s : déployer hors des entretiens.

## Inutile de tester
- Le démarrage dans tous ses cas (404, 401 et sa garde, 403, 502, non JSON, délai), l'adaptateur (versions, file, identifiants, 409), les options, la relecture au retour sur l'onglet, les fiches écrites par partie, la suppression vue d'un autre navigateur : `tools/test-serveur.js` (83) et `tools/e2e-serveur.py` (38), mis à l'épreuve par mutation.
- L'isolement réseau de l'API (hôte, réseau hôte, caddy, IPv6), l'en-tête d'identité forgé avec et sans session, les formes d'adresse, l'image (utilisateur, droits, sonde, mode local refusé), `.dockerignore`, `deploy.sh` (attente, échec, retour arrière) : banc Linux et banc Dex de la QA. Seul le contrôle du parcours 1 est à refaire, parce qu'il dépend du moteur du serveur.
- L'effacement d'un dossier supprimé ou rectifié (fichiers de la base, journaux, navigateurs) : vérifié sur la pile Docker.
- Les textes : comparés mot pour mot à la spec.
