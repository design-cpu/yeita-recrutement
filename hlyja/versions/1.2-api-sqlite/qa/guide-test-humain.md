---
type: guide-test
version: 1.2
parcours: 5
date: 2026-10-26
---

# Guide de test — API Node.js sur SQLite pour les dossiers candidat

> 5 parcours, ~15 min, dans un terminal (pas de page à ouvrir : l'API n'est pas encore branchée au site). Commence par les parcours 1 et 2.

## Préparer
```bash
git switch version/1.2-api-sqlite
cd api
npm ci
export DB_PATH=/tmp/essai-api/recrutement.sqlite
```
Node 22 ou plus récent. Tout se passe dans `/tmp/essai-api` : rien n'est écrit dans le dépôt. Pour tout effacer à la fin : `rm -rf /tmp/essai-api`.

## Parcours essentiels
### 1. Mettre en place l'équipe — priorité haute
- [ ] `node equipe.js add moi@yeita.fr Moi admin`
- [ ] Vérifier : la première ligne dit `Base : /tmp/essai-api/recrutement.sqlite (créée)`, la seconde `Ajouté : moi@yeita.fr · Moi · admin · actif · …`.
- [ ] `node equipe.js add lecteur@yeita.fr Lou lecture`, puis `node equipe.js list` : deux membres.
- [ ] `node equipe.js add x@yeita.fr admin` : refusé (« admin » est un rôle, pas un prénom), code 1.

### 2. Enregistrer un dossier et provoquer un conflit — priorité haute
Dans un second terminal : `cd api && DB_PATH=/tmp/essai-api/recrutement.sqlite DEV_EMAIL=moi@yeita.fr npm start`.
- [ ] Vérifier : la ligne « API démarrée » donne l'hôte `127.0.0.1`, le port 8000, la base, et l'avertissement « Mode local : DEV_EMAIL=moi@yeita.fr ».
- [ ] Créer un dossier :
  ```bash
  curl -s -X PUT http://127.0.0.1:8000/api/candidats/cand-essai-00001 -H 'content-type: application/json' \
    -d '{"version":null,"data":{"schema":"yeita-dossier-candidat","version":3,"id":"cand-essai-00001","meta":{"modifieLe":"2026-10-26"}}}'
  ```
  Vérifier : `"version":1`.
- [ ] Relancer exactement la même commande : 409 « La candidature a été modifiée par quelqu'un d'autre. Recharge la page. ».
- [ ] Remplacer `"version":null` par `"version":1` : `"version":2`. Rejouer avec `"version":1` : 409 de nouveau.

### 3. Vérifier les refus d'accès
- [ ] `curl -s http://127.0.0.1:8000/api/candidats -H 'X-Forwarded-Email: lecteur@yeita.fr'` : la liste.
- [ ] Même chose en `-X DELETE …/api/candidats/cand-essai-00001` : 403 « Lecture seule : tu ne peux pas modifier. ».
- [ ] `-H 'X-Forwarded-Email: inconnu@yeita.fr'` : 403 « Tu ne fais pas partie de l'équipe. ».
- [ ] `node equipe.js disable lecteur@yeita.fr`, puis la première commande : 403 aussitôt.
- [ ] `curl -s http://127.0.0.1:8000/api/sante` : `{"ok":true}`, sans en-tête.

### 4. Supprimer vraiment
- [ ] `curl -s -X DELETE http://127.0.0.1:8000/api/candidats/cand-essai-00001 -o /dev/null -w '%{http_code}\n'` : 204.
- [ ] `grep -a -c yeita-dossier-candidat /tmp/essai-api/recrutement.sqlite*` : 0 pour chaque fichier (le contenu du dossier a disparu du disque).
- [ ] `sqlite3 /tmp/essai-api/recrutement.sqlite "select action, etape from journal"` (si `sqlite3` est installé) : une seule ligne `suppression|`.

### 5. Réglages refusés
Arrêter l'API (`Ctrl+C`, elle sort proprement), puis :
- [ ] `PORT="8000 # commentaire" npm start` : « PORT refusé … », code 1.
- [ ] `HOST=0.0.0.0 DEV_EMAIL=moi@yeita.fr npm start` : « DEV_EMAIL refusé : interdit quand HOST … ».
- [ ] `NODE_ENV=production DEV_EMAIL=moi@yeita.fr npm start` : « DEV_EMAIL refusé : interdit quand NODE_ENV vaut production. ».
- [ ] `HOST=0.0.0.0 npm start` : démarre, avec l'avertissement « L'API croit X-Forwarded-Email : elle ne doit être joignable que par oauth2-proxy. ».

## Points d'attention
- L'API n'est pas encore derrière oauth2-proxy ni dans Docker : dans ces essais, c'est `curl` qui joue le rôle d'oauth2-proxy en posant `X-Forwarded-Email`. C'est exactement pourquoi l'API ne doit jamais être joignable autrement que par oauth2-proxy.
- Non vérifiable ici : qu'oauth2-proxy avec Google pose bien l'email du compte (version suivante) ; le lancement de `equipe.js` sous le même utilisateur système que l'API, sur le serveur.

## Inutile de tester
Couvert par les 52 tests automatiques (`cd api && npm test`, ~20 s) : chaque variante d'en-tête et d'adresse piégée, les 400, 413, 415, 503, l'effacement dans les fichiers de la base, l'échec provoqué puis la relance du schéma et de `equipe.js`, chaque valeur de variable refusée, le site servi en mode local. CA1 a été rejoué dans `node:22-bookworm-slim` sans Python par la QA.
