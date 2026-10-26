---
type: revue-doc
version: 1.1
pages: 3
erreurs: 4
corrigees: 4
vues: 3
date: 2026-10-26
---

# Revue de la documentation — version 1.1

> Les trois pages du référentiel technique sont conformes au code au commit `78dcc37` (dernier commit de code) : valeurs, chemins, versions d'images, options oauth2-proxy, garde-fous des scripts et commandes vérifiés un par un. 4 écarts mineurs, corrigés dans les sources (commit `3909b8d`, revérifiés après `e11c386` et `3909b8d`) : une décision de v1.0 devenue ambiguë, une règle de figement des images trop large, une source manquante, un changement de la version non relevé (lien candidat). Aucun n'invalide les vues humaines, écrites selon le code.

Vérifié par commande : `docker/front.Dockerfile`, `compose.yaml`, `deploy/oauth2-proxy.cfg`, `deploy/Caddyfile`, `.env.example`, `.dockerignore`, `.gitignore`, `deploy/deploy.sh`, `deploy/prepare-serveur.sh`, `tools/check-site.sh`, `tools/build.py` (`SKIP` et filtre `.env*`), `tools/e2e-pdf.py` (`pdftotext`), `deploy/README.md` (§ 2, test sur un poste), absence de `.github/` ; affirmations « vérifié » recoupées avec `spec/verifications.md` (V8, V15, V19), `spec/spec-finale.md` (arbitrages de l'utilisateur, alternatives écartées par le pitch), `version.md` (pitch : `reverse_proxy = true`), `qa/rapport-qa.md` et `taches/07-fin-github-pages.md` (Playwright 1.63.0, `shellcheck` 0.10.0). Commits postérieurs à `78dcc37` : uniquement `hlyja/`. Liens `architecture.md`, `decisions.md`, `conventions.md` valides ; pas d'ancre.

## Vérification des sources
| Page | Problème | Correction attendue | Statut |
|---|---|---|---|
| `decisions.md` | Ligne « Stockage et authentification » (v1.0) : « Jusqu'au déploiement, tout vit dans le navigateur » et « portés par Sacha sur sa branche » sont devenus ambigus. Le site est déployé en v1.1, l'authentification oauth2-proxy est livrée par cette version, et les données restent pourtant dans le navigateur. Seul l'historique le dit, pas la ligne. | Annoter la ligne : « authentification en place depuis 1.1 (voir Hébergement et authentification) ; stockage SQLite pas encore fait ; jusqu'au branchement d'un adaptateur, tout vit dans le navigateur ». | corrige |
| `conventions.md` | « Règles du déploiement : images figées par tag (`oauth2-proxy:v7.15.5`, `caddy:2.11.7`) » se lit comme une règle générale, alors que l'image de construction `python:3.12-slim` est flottante (`docker/front.Dockerfile`, décision du pitch, notée dans `architecture.md`). | Préciser : « images servies figées par tag (…) ; l'image de construction `python:3.12-slim` suit 3.12 (décision du pitch) ». | corrige |
| `architecture.md` | `sources` ne cite pas `deploy/README.md`, alors que la page s'y appuie (exemples du cas A, § 2 pour un proxy conteneurisé, commandes du tableau Environnements). | Ajouter `deploy/README.md` à `sources`. | corrige |
| `architecture.md` | Incomplet pour ce que la version change : `assets/config.js` (`pagesCandidat.tonParcours`) pointe désormais vers `https://recrutement.yeita.fr/one-pager.html`. Le lien envoyé aux candidats dépend donc de `^/one-pager\.html$` dans `skip_auth_routes`, dépendance non écrite. | Ajouter, sous la liste publique : « `/one-pager.html` est le lien « Ton parcours » des mails aux candidats (`assets/config.js`, `pagesCandidat`) : il doit rester dans `skip_auth_routes` ». | corrige |

## Vues humaines écrites
| Vue | Action | Contenu |
|---|---|---|
| `hlyja/technique/architecture.humain.md` | créée | Le chemin d'une visite (schéma), les deux façons d'installer (cas A / cas B), les pièces (image, oauth2-proxy, Caddy, scripts), ce qui est public, les environnements, les précautions. Inclut la dépendance du lien candidat. |
| `hlyja/technique/decisions.humain.md` | réécrite | Ajout des trois décisions de v1.1 (hébergement chez Yeita, pas de confiance dans les en-têtes de proxy, `/index.html` servi directement) ; la décision de stockage dit maintenant que la connexion est en place et que le stockage reste à faire. |
| `hlyja/technique/conventions.humain.md` | réécrite | Nouveaux dossiers `docker/` et `deploy/`, publication par Docker à la main (fin de GitHub Pages), règles du serveur partagé (image de construction flottante dite), contrôle du site déployé, essais des scripts hors serveur. |

## Glossaire
Nouveau fichier `hlyja/glossaire.md` (aucun glossaire n'existait) : Caddy, Cas A / cas B, Conteneur, Docker Compose, HTTPS, Image Docker, oauth2-proxy, Page publique, Profil Compose, Proxy (reverse proxy), Serveur partagé. Les vues humaines emploient ces termes sous ces formes.
