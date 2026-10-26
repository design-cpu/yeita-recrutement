---
type: technique
vue: humaine
page: docker-local
titre: Lancer le site avec Docker sur un poste
---

# Lancer le site avec Docker sur ton poste

> Trois commandes suffisent pour faire tourner le site comme sur le serveur, connexion Google comprise. Cette page dit aussi quels avertissements sont normaux, et comment tester une vraie connexion avec un compte @yeita.fr.

## En un coup d'œil
```mermaid
flowchart LR
  A[cp .env.example .env] --> B[docker compose up -d --build]
  B --> C[tools/check-site.sh https://localhost]
  C --> D[Ouvrir https://localhost]
```
Il faut que Docker Desktop soit lancé. Le site s'ouvre sur `https://localhost`. Les pages publiques s'affichent ; l'espace Candidatures renvoie vers Google.

## Démarrer
```bash
cp .env.example .env
docker compose up -d --build
tools/check-site.sh https://localhost
```
Le fichier `.env` contient des réglages de test, prêts à l'emploi. Il n'est jamais envoyé sur GitHub.

Après un changement de `.env` : `docker compose up -d --force-recreate`. Après un changement des pages : `docker compose up -d --build`.

## Tout arrêter
Depuis le dossier du dépôt, du plus léger au plus complet :

| Je veux… | Commande |
|---|---|
| Arrêter le site (conteneurs et réseau supprimés, certificat local gardé) | `docker compose --profile caddy down` |
| Vérifier que plus rien ne tourne | `docker compose ps -a` (liste vide) |
| Effacer aussi le certificat local de Caddy | `docker compose --profile caddy down --volumes` |
| Supprimer l'image construite | `docker image rm recrutement-front` |
| Supprimer les réglages de test | `rm .env` |
| Arrêter Docker lui-même | menu de la baleine, « Quit Docker Desktop », ou `osascript -e 'quit app "Docker"'` |

> Écris bien `--profile caddy` : un `docker compose down` sans lui laisse Caddy tourner, et il garde les ports 80 et 443.

Si tu as fait confiance au certificat local et que tu effaces le volume, retire aussi l'ancien certificat du Trousseau d'accès : Caddy en créera un nouveau au prochain démarrage.

## Les avertissements normaux
| Ce que tu vois | Pourquoi | Que faire |
|---|---|---|
| « Non sécurisé » sur `https://localhost` | Le certificat est fabriqué par Caddy sur ton poste, ton Mac ne le connaît pas | Rien ; ou lui faire confiance (ci-dessous). Sur le serveur, le certificat sera reconnu |
| « Not secure » sur `http://127.0.0.1:4180` | Test sans Caddy, sans chiffrement | Normal en local |
| Google : `Erreur 401 : invalid_client` | Le `.env` de test contient un faux identifiant Google | Normal : la redirection prouve que la page est protégée |

### Faire confiance au certificat local (facultatif, Mac)
```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./caddy-root.crt
```
Supprime ensuite `caddy-root.crt` du dossier. Pour revenir en arrière : Trousseau d'accès, « Caddy Local Authority - <année> ECC Root », supprimer.

## Tester une vraie connexion Google
```mermaid
flowchart LR
  A[Créer un client Google d'essai] --> B[Mettre ses identifiants dans .env]
  B --> C[Recréer les conteneurs]
  C --> D[Se connecter sur https://localhost/candidatures/]
```
1. Dans la console Google Cloud de Yeita : écran de consentement de type **Interne**, puis un identifiant OAuth « Application Web », avec l'adresse de retour `https://localhost/oauth2/callback`.
2. Dans ton `.env`, remplace l'identifiant et le secret du client. Garde le reste tel quel.
3. Lance `docker compose up -d --force-recreate`.
4. Ouvre `https://localhost/candidatures/` : un compte @yeita.fr revient sur l'espace Candidatures, un compte extérieur est refusé.

> Teste avec Caddy (`https://localhost`), pas sur `http://127.0.0.1:4180` : sans HTTPS, le navigateur ne renvoie pas le cookie de session.

Si Google répond `redirect_uri_mismatch`, l'adresse de retour du client n'est pas exactement `https://localhost/oauth2/callback`.

## À savoir
- Les vrais identifiants Google ne vont que dans `.env`, jamais ailleurs dans le dépôt.
- Un client Google d'essai, séparé de celui du serveur, évite de mélanger les deux.
- Le mode d'emploi du serveur est dans `deploy/README.md`.

## Voir aussi
- [Architecture et déploiement](architecture.md)
- [Conventions et tests](conventions.md)
