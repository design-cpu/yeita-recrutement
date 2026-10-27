---
type: guide-test
version: 1.3
parcours: 10
date: 2026-10-27
---

# Guide de test — Candidatures partagées par l'équipe, API dans Docker

> Partie A : sur ton poste, **avant de merger** (7 parcours, ~30 min).
> Partie B : sur le serveur, **après le merge et le premier déploiement, avant d'ajouter qui que ce soit à l'équipe** (3 parcours, ~15 min).
> Tout est ici : tu lances les commandes, tu coches chaque case au fur et à mesure, tu compares avec « Tu dois voir », et « Sinon » dit quoi faire.

---

# Partie A — Sur ton poste, avant de merger

## Préparer (une fois)
Il te faut Node 22 ou plus récent, Python 3, et un navigateur (Chrome ou Firefox).

- [ ] **Terminal 1** — copie tout le bloc, puis Entrée. Il prépare une base d'essai à part (dans `/tmp/essai-13`, rien d'autre n'est touché) et lance l'API avec le site :
```bash
cd ~/Documents/Yeita/Projects/Github/yeita-recrutement
git switch version/1.3-branchement-api
python3 tools/build.py _site
cd api && npm ci
export DB_PATH=/tmp/essai-13/recrutement.sqlite
node equipe.js add moi@yeita.fr Moi admin
DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
- [ ] Tu dois voir, à la fin : une ligne qui contient `"msg":"API démarrée"`. Laisse ce terminal ouvert pendant toute la partie A.
Sinon : si un message dit que le port 8000 est déjà utilisé, ferme le programme qui l'occupe, ou relance la dernière ligne précédée de `PORT=8001` et remplace `8000` par `8001` dans toutes les adresses de ce guide.

- [ ] **Terminal 2** — il servira à changer ton rôle pendant les essais. Copie ces deux lignes :
```bash
cd ~/Documents/Yeita/Projects/Github/yeita-recrutement/api
export DB_PATH=/tmp/essai-13/recrutement.sqlite
```

---

## A1. Ton prénom à la place de « Qui es-tu ? »
- [ ] Ouvre `http://127.0.0.1:8000/candidatures/`.

- [ ] Tu dois voir : en haut à droite, « Connecté·e : Moi ». Aucune liste « Qui es-tu ? ».
Sinon : note ce qui est affiché et arrête-toi là (le reste du guide en dépend).

## A2. Créer une candidature, puis recharger
- [ ] Clique « Ajouter un candidat ».
- [ ] Dans « Nom Prénom », tape `Essai Conflit`.
- [ ] Clique « Enregistrer et revenir à la liste ».
- [ ] Recharge la page (Cmd+R ou F5).

- [ ] Tu dois voir : la carte « Essai Conflit » est toujours là après le rechargement.
Sinon : note-le, c'est un défaut.

## A3. Deux onglets sur la même candidature (conflit)
- [ ] Clique la carte « Essai Conflit ». Copie l'adresse de la page et ouvre-la dans un **second onglet**.
- [ ] **Onglet 2** : dans « Infos candidat », champ « E-mail », tape `deux@example.com`. Attends 2 secondes.
- [ ] **Onglet 1** : fais défiler la page **tout en bas**. Puis remonte au champ « Téléphone » et tape `0611111111`. Attends 2 secondes.

- [ ] Tu dois voir, dans l'onglet 1 :
  - [ ] un bandeau rose collé en haut de l'écran, même si la page est défilée, qui dit « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. » puis « Ce que tu as saisi depuis n'est pas enregistré : copie-le avant de recharger. », avec un bouton « Recharger » ;
  - [ ] à côté du titre « Infos candidat », « Non enregistré » ;
  - [ ] ton téléphone toujours dans le champ, et le curseur toujours dedans.

- [ ] Clique « Recharger ».

- [ ] Tu dois voir : l'e-mail `deux@example.com` est là, le téléphone est vide.
Sinon : note ce qui manque. Le texte du bandeau te paraît-il clair pour un recruteur ? Note ton avis.

## A4. Compte en lecture seule
- [ ] **Terminal 2** :
```bash
node equipe.js role moi@yeita.fr lecture
```
- [ ] Dans le navigateur, recharge la page de « Essai Conflit ».

- [ ] Tu dois voir : en haut, « Connecté·e : Moi · lecture seule ».

- [ ] Tape quelque chose dans le champ « Téléphone ». Attends 2 secondes.

- [ ] Tu dois voir : un bandeau « Lecture seule : tu ne peux pas modifier. », **sans** bouton.

- [ ] **Terminal 2**, remets ton rôle :
```bash
node equipe.js role moi@yeita.fr admin
```
Sinon : note ce qui est affiché.

## A5. Compte retiré de l'équipe
- [ ] **Terminal 2** :
```bash
node equipe.js disable moi@yeita.fr
```
- [ ] Recharge `http://127.0.0.1:8000/candidatures/`.

- [ ] Tu dois voir : un bandeau « Tu ne fais pas partie de l'équipe. » et aucune candidature.

- [ ] **Terminal 2**, remets ton accès :
```bash
node equipe.js add moi@yeita.fr Moi admin
```
- [ ] Recharge : tout est revenu.
Sinon : note ce qui est affiché.

## A6. Fermer la page juste après avoir tapé
- [ ] Sur la page de « Essai Conflit », tape `0699999999` dans « Téléphone », puis **ferme l'onglet tout de suite** (Cmd+W ou Ctrl+W), sans attendre.
- [ ] Rouvre `http://127.0.0.1:8000/candidatures/` et clique « Essai Conflit ».

- [ ] Tu dois voir : `0699999999` dans « Téléphone ».

- [ ] Même essai dans la fiche EC1 : sur la page de « Essai Conflit », ouvre l'étape EC1 (si elle n'est pas encore accessible, ouvre dans la barre d'adresse la même adresse en remplaçant `candidat.html` par `ec1.html`). Ouvre la section « Ce qu'on a perçu de toi », tape une phrase, ferme l'onglet tout de suite, puis rouvre la fiche EC1.

- [ ] Tu dois voir : la phrase est là.
Sinon : note-le.

## A7. Sans base, tout marche comme avant
- [ ] Dans le **terminal 1**, arrête l'API : Ctrl+C.
- [ ] Toujours dans le terminal 1 :
```bash
cd .. && python3 -m http.server 8765 --directory _site
```
- [ ] Ouvre `http://127.0.0.1:8765/candidatures/`.

- [ ] Tu dois voir : la liste « Qui es-tu ? » en haut, et tu peux ajouter une candidature comme avant. (Si tu ouvres la console du navigateur, une erreur 404 sur `/api/moi` est normale.)
Sinon : note-le.

- [ ] Arrête le serveur : Ctrl+C.

## Nettoyer
```bash
rm -rf /tmp/essai-13
```

---

# Partie B — Sur le serveur, après le premier déploiement

À faire **dans cet ordre**, juste après avoir mergé puis déployé cette version, et **avant d'ajouter qui que ce soit à l'équipe**. Connecte-toi au serveur en `deploy` (SSH), puis :
```bash
cd /opt/recrutement
```

## B1. Contrôle réseau (personne d'autre ne doit pouvoir parler à l'API)
**Pourquoi** : l'API croit l'identité que lui transmet la connexion Google. Si un autre programme du serveur pouvait lui parler directement, il pourrait se faire passer pour n'importe quel membre de l'équipe. Tant que l'équipe est vide, personne ne peut lire de candidature : c'est pour cela qu'on vérifie maintenant.

- [ ] Note la version de Docker du serveur :
```bash
docker version --format '{{.Server.Version}}'
```
- [ ] Tu dois voir : un numéro, par exemple `29.9.2`. Note-le. S'il est plus petit que `29.9.2`, signale-le à l'équipe technique (la protection a été essayée sur 29.9.2), et continue quand même.

- [ ] Copie **tout** ce bloc, puis Entrée. Il ne modifie rien : il lit et il essaie.
```bash
cd /opt/recrutement && (
pb=0
ok() { echo "  OK        $*"; }
ko() { echo "  PROBLÈME  $*"; pb=1; }
echo "Contrôle réseau de l'API :"
etat=$(docker inspect -f '{{.State.Health.Status}}' recrutement-api-1 2>/dev/null)
if [ "$etat" = healthy ]; then ok "l'API tourne et va bien"; else ko "l'API ne va pas bien (état : ${etat:-introuvable}) : docker compose logs --tail 50 api"; fi
reseau=$(docker network inspect recrutement_back --format '{{.Internal}} {{.EnableIPv6}} {{index .Options "com.docker.network.bridge.inhibit_ipv4"}}' 2>/dev/null)
if [ "$reseau" = "true false true" ]; then ok "le réseau de l'API est fermé (interne, sans IPv6, sans adresse sur le serveur)"; else ko "le réseau de l'API n'est pas réglé comme prévu (lu : ${reseau:-introuvable})"; fi
ip4=$(docker inspect -f '{{(index .NetworkSettings.Networks "recrutement_back").IPAddress}}' recrutement-api-1 2>/dev/null)
ip6=$(docker inspect -f '{{json (index .NetworkSettings.Networks "recrutement_back").GlobalIPv6Address}}' recrutement-api-1 2>/dev/null)
if [ "$ip6" = '""' ]; then ok "l'API n'a pas d'adresse IPv6"; else ko "l'API a une adresse IPv6 : $ip6"; fi
temoin=$(docker run --rm --network recrutement_back curlimages/curl:8.11.1 -s -m 5 -o /dev/null -w '%{http_code}' http://api:8000/api/sante 2>/dev/null)
if [ "$temoin" = 200 ]; then ok "témoin : un conteneur placé exprès sur le réseau de l'API la joint (l'essai sait voir une API joignable)"; else ko "témoin : même un conteneur du réseau de l'API ne la joint pas (réponse : ${temoin:-aucune}) ; les essais suivants ne prouvent rien"; fi
essai() {
  if [ "$2" = 200 ]; then ko "$1 JOINT l'API : n'importe quel programme de ce serveur pourrait se faire passer pour un membre de l'équipe"; else ok "$1 ne joint pas l'API"; fi
}
essai "le serveur, par l'adresse de l'API ($ip4)" "$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://$ip4:8000/api/sante" 2>/dev/null)"
essai "le serveur, par 127.0.0.1:8000" "$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/sante 2>/dev/null)"
essai "un conteneur en réseau hôte" "$(docker run --rm --network host curlimages/curl:8.11.1 -s -m 5 -o /dev/null -w '%{http_code}' "http://$ip4:8000/api/sante" 2>/dev/null)"
echo
if [ "$pb" = 0 ]; then
  echo "VERDICT : tout est bon. Tu peux ajouter le premier admin."
else
  echo "VERDICT : NE PAS CONTINUER. Arrête l'API (docker compose stop api), n'ajoute personne à l'équipe,"
  echo "          et envoie tout ce qui est affiché ci-dessus à l'équipe technique."
fi
)
```
- [ ] Tu dois voir : sept lignes qui commencent par `OK`, puis `VERDICT : tout est bon.` Passe à B2.

Sinon (au moins une ligne `PROBLÈME`) : ne va pas plus loin.
- Arrête l'API :
```bash
docker compose stop api
```
- N'ajoute personne à l'équipe.
- Copie tout ce que le bloc a affiché et envoie-le à l'équipe technique. Elle décidera du retour à la version précédente.

## B2. Ton vrai compte Google arrive bien jusqu'à l'API
- [ ] Ajoute-toi comme premier admin (remplace l'email et le prénom par les tiens) :
```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom admin
```
- [ ] Tu dois voir : une ligne `Ajouté : prenom.nom@yeita.fr · Prénom · admin · actif …`.

- [ ] Dans ton navigateur, ouvre `https://recrutement.yeita.fr/candidatures/` et connecte-toi avec ce compte Google.

- [ ] Tu dois voir : en haut à droite, « Connecté·e : Prénom ».

- [ ] Dans le même navigateur, ouvre `https://recrutement.yeita.fr/api/moi`.

- [ ] Tu dois voir : `{"email":"prenom.nom@yeita.fr","prenom":"Prénom","role":"admin"}`, avec **ton** email.

- [ ] Dans une fenêtre de navigation privée (sans connexion), ouvre `https://recrutement.yeita.fr/api/moi`.

- [ ] Tu dois voir : une page d'erreur 401 (ou `{}`), **pas** la page de connexion Google, et aucune donnée.

Sinon (si `/api/moi` ne montre pas **ton** email, ou si la fenêtre privée montre des données ou la page Google) :
```bash
docker compose stop api
```
puis envoie à l'équipe technique ce que tu as vu, sans ajouter personne d'autre.

## B3. L'équipe, et les données des navigateurs
- [ ] Ajoute les autres membres, un par un (rôle `recruteur`, ou `lecture` pour quelqu'un qui doit seulement voir) :
```bash
docker compose exec api node api/equipe.js add prenom.nom@yeita.fr Prénom recruteur
```
- [ ] Vérifie la liste :
```bash
docker compose exec api node api/equipe.js list
```
- [ ] Tu dois voir : une ligne par membre, avec `actif`.

- [ ] Demande à chacun, après sa première connexion qui affiche « Connecté·e : son prénom », d'effacer les données du site dans son navigateur. Les candidatures saisies avant cette version restaient dans chaque navigateur et ne sont pas reprises.
- Chrome : cadenas à gauche de l'adresse › Paramètres du site › Supprimer les données.
- Avant d'effacer, chacun ressaisit à la main ce qu'il veut garder.
- Confirme qu'il ne s'agissait que de données fictives.

- [ ] À savoir pour la suite :
- Pour retirer quelqu'un : `docker compose exec api node api/equipe.js disable prenom.nom@yeita.fr`. Effet immédiat.
- Chaque déploiement coupe l'API une quinzaine de secondes : déploie en dehors des entretiens.
- Ne lance jamais `docker compose down -v` ni `docker volume prune` sur ce serveur : la base des candidatures serait effacée.

---

## Ce qui n'est pas à tester à la main
Tout le reste a été vérifié par des tests automatiques et par la QA sur des serveurs d'essai : tous les cas de démarrage (session expirée, panne, réponse inattendue), les versions et les conflits, les fiches ouvertes ensemble, la suppression vue d'un autre navigateur, l'isolement réseau sous Linux, l'en-tête d'identité forgé, l'image Docker et le script de déploiement (attente, échec, retour arrière).
