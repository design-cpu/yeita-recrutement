---
type: tache
version: 1.1
numero: 05
titre: Déploiement
statut: ok
date: 2026-10-26
---

# Tâche 05 — Déploiement

> **QA : réussie** · 2 fichiers (1 créé, 1 modifié) · 1 correction (message du refus de port)
> `deploy/deploy.sh` met à jour ou revient en arrière, refuse tout ce qui est douteux, ne nettoie que les images du projet et contrôle le site à la fin.

## Ce que ça change
Le compte `deploy` lance `deploy/deploy.sh` (dernier `main`) ou `deploy/deploy.sh <commit>` (retour arrière). Les réglages, le dépôt, les ports et le nom du projet sont vérifiés avant toute action ; la configuration est toujours rechargée ; le site est contrôlé, avec plusieurs essais en cas B le temps du certificat. En cas d'échec, le script donne la commande exacte pour revenir.

## Comment tester
Banc d'essai R23 (fiche 04), préparation faite, puis en `deploy` : `.env` copié de l'exemple avec `DOMAIN=recrutement.localhost`, URL de retour, cookie secret et identifiant client changés ; `sudo -u deploy -H ./deploy/deploy.sh`.
Résultat attendu : « Déploiement réussi », code 0.

## Critères d'acceptation
- [x] CA9 — déploie (code 0) ; refuse : second lancement, root, `.env` absent, `DOMAIN=localhost`, URL de retour incohérente, cookie secret et identifiant d'exemple, commit inconnu, commit antérieur à la 1.1, dépôt modifié, port 80 pris en cas B, conteneur `recrutement` d'un autre dossier ; revient à un commit ; `caddy` arrêté quand le profil est retiré ; configuration modifiée active ; aucune image non étiquetée supprimée ; interrompu pendant `build` puis relancé → code 0

## Ce qui a été fait
- `deploy/deploy.sh` : corps dans `main` (lu en entier), verrou `flock` sur `~/.recrutement-deploy.lock`, contrôles du `.env` (domaine, URL de retour, valeurs d'exemple comparées à `.env.example`), dépôt propre, conteneurs étrangers, ports 80/443 en cas B, validation du commit (existe, ancêtre de `origin/main`, contient `compose.yaml` et `deploy/deploy.sh`), `caddy` retiré sans profil, `build --pull`, `up -d --remove-orphans --force-recreate`, `image prune` filtré, attente de `/ping` (60 s), `check-site.sh` (6 essais en cas B), message de retour arrière.
- `tools/check-site.sh` : certificat non vérifié aussi pour `*.localhost` `[ajout]`, nom réservé à la machine locale, nécessaire au banc (un `DOMAIN` de test autre que `localhost`, refusé par `deploy.sh`).
Fichiers : `deploy/deploy.sh`, `tools/check-site.sh`
Commits : `ec7334a` feat(deploiement-ovh): tâche 05 – deploy/deploy.sh ; check-site accepte *.localhost ; `657a219` fix(deploiement-ovh): tâche 05 – repérage des ports publiés

## Résultat QA
| Vérification | Résultat |
|---|---|
| Root | ok : arrêt, code 1 |
| `.env` absent / `DOMAIN=localhost` / URL de retour incohérente / cookie secret d'exemple / identifiant d'exemple | ok : 5 arrêts, messages précis, code 1 |
| Commit `deadbeef` / `401c081` (avant 1.1) | ok : arrêts |
| Port 80 publié par un autre conteneur (cas B) | ok : « publié par un autre conteneur » (après correction) |
| Conteneur `recrutement` d'un autre dossier | ok : arrêt |
| Dépôt modifié | ok : arrêt |
| Déploiement cas B (`recrutement.localhost`) | ok : 1er contrôle en échec (certificat en cours), 2e essai OK, code 0, 15 s |
| Second lancement pendant un déploiement | ok : « un déploiement est déjà en cours », le premier réussit |
| Images | ok : seule l'ancienne `recrutement-front` (étiquetée) disparaît ; `busybox`, `caddy` gardées |
| Interruption (SIGINT après 3 s, pendant `build`) puis relance | ok : relance code 0, même commit |
| Commit de test (route publique ajoutée) | ok : `/candidatures.html` 200 → configuration rechargée |
| Retour à `657a219` | ok : 302, HEAD détachée, message « reprend main » |
| Sans argument ensuite | ok : retour sur `main` |
| Profil `caddy` retiré | ok : « Caddy du projet arrêté et supprimé », `front` seul ; contrôle en échec (pas de proxy dans le banc), commande de retour affichée |
| `shellcheck` 0.10.0 | ok |
Corrections : `publient()` utilisait `[:\]]`, qui ne reconnaît pas `:80->` ; un port publié par un autre conteneur donnait le message « déjà utilisé sur ce serveur » (arrêt correct, message faux). Corrigé en `[]:]` ; revérifié.

## Spec couverte
R14, R15, R23 ; CA9
