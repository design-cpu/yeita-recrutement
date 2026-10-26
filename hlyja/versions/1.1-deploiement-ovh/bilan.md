---
type: bilan
version: 1.1
statut: terminee
mode: complexe
type_version: livrable
score: 94
tours: 2
taches_ok: 7
taches_echec: 0
qa_taux: 100
date: 2026-10-26
---

# Bilan — Version 1.1

> **Terminée** · Spec validée à 94/100 en 2 tours · 7/7 tâches ok · QA 100 % (34/34 après correction d'un défaut, 2 parcours manuels)
> Deux décisions du pitch ajustées avec l'accord de l'utilisateur : second upstream pour `/index.html`, et `reverse_proxy = false` (faille de contournement vérifiée et fermée).
> Avant de merger : suivre le guide de test (parcours 1 à 4, ~25 min) ; la vraie connexion Google se vérifie sur le serveur (parcours 5).

## Résultat
| Étape | Résultat |
|---|---|
| Spec | validée, 94/100, 2 tours (52 → 94) ; 2 arbitrages de l'utilisateur |
| Tâches | 7 ok, 0 échec ; 3 corrections pendant les tâches |
| Revue de code | 0 bloquant ; 3 majeurs corrigés (lecture de `.env` par Compose, clone de préparation en dossier privé, copies de `.env` exclues) ; 12 mineurs (4 corrigés, 1 abandonné, 7 notés) ; revérifiée |
| QA | 100 % (34/34), 1 défaut trouvé et corrigé (B1), 0 régression, 2 parcours manuels ; non-régression : `test-store.js` 48 OK, 4 tests de navigateur 111 OK |
| Doc | 1 page technique créée (`architecture`), 2 mises à jour (`decisions`, `conventions`), 3 vues humaines, glossaire créé (11 termes) ; 4 erreurs de source corrigées et revérifiées |
| Backlog | 9 fiches (1 moyenne, 8 basses) |
| Fichiers du projet | 16 (10 créés, 5 modifiés, 1 supprimé), +768 / −44, 16 commits de code |

## Tester en local
```bash
git switch version/1.1-deploiement-ovh
cp .env.example .env
docker compose up -d --build
tools/check-site.sh https://localhost
```
Puis suivre qa/guide-test-humain.md.

## Reste à faire avant de merger
- Suivre le guide de test (parcours 1 à 4).
- Confirmer la nouvelle formulation de `CONTRIBUER.md` (« ne pas toucher à l'authentification ni au déploiement sans l'équipe technique »).
- Après le merge, sur le serveur (hors de cette version) : suivre `deploy/README.md`, puis vérifier la connexion Google réelle (compte @yeita.fr accepté, compte extérieur refusé) — parcours 5 du guide.

## Réserves
Aucune (spec validée sans réserve).

## Écarts avec la spec
| Écart | Raison |
|---|---|
| `reverse_proxy = false` au lieu de `true` (pitch) | V15 : un `X-Forwarded-Uri` forgé depuis une adresse de confiance ouvrait `/candidatures/` sans connexion ; arbitrage de l'utilisateur ; tracé en R7 |
| Second upstream `file:///srv/site/#/index.html` | V4 : `/index.html` était redirigé vers `/` ; choix de l'utilisateur ; tracé en R3 |
| R15/R16 « ressource du projet d'un autre dossier » vérifiée sur les conteneurs seulement | Compose ne pose pas l'étiquette de dossier sur les réseaux ni les volumes (vérifié) ; un réseau gênant est arrêté par le contrôle du sous-réseau (fiche 04) |
| R13 : certificat non vérifié aussi pour `*.localhost` | Nécessaire au banc, `deploy.sh` refusant `DOMAIN=localhost` (fiche 05) |
| `deploy.sh` refuse aussi les fichiers non suivis, les valeurs vides suivies d'un commentaire et le secret client d'exemple | Corrections de la revue de code, de la QA et du rédacteur-relecteur |

## Tâches en échec
Aucune.

## Changelog
- Ajouté : l'espace Candidatures se déploie sur le serveur OVH de Yeita, à l'adresse `https://recrutement.yeita.fr`, réservé aux comptes Google @yeita.fr ; le guide, le one-pager, le kit Yeita Match et les téléchargements restent publics.
- Ajouté : un mode d'emploi du serveur (`deploy/README.md`) et deux scripts prudents, l'un pour préparer le serveur une fois, l'autre pour déployer et revenir en arrière.
- Ajouté : `tools/check-site.sh`, qui vérifie en quelques secondes qu'un site déployé ouvre ses pages publiques et protège les autres.
- Modifié : le lien « Ton parcours chez Yeita » du mail aux candidats pointe vers `https://recrutement.yeita.fr/one-pager.html`.
- Retiré : la publication automatique sur GitHub Pages.
- Technique : image Docker `front` (oauth2-proxy 7.15.5 qui sert le site), Compose avec Caddy 2.11.7 en option, configuration sans secret, secrets dans `.env` ; oauth2-proxy ne fait pas confiance aux en-têtes de proxy.

## Backlog
- Ajoutées : [1.1-1](../../backlog/1.1-1-liens-ancien-site-github-pages.md) lien vers l'ancien site GitHub Pages en 404 (moyenne), [1.1-2](../../backlog/1.1-2-schema-id-github-io.md), [1.1-3](../../backlog/1.1-3-retrait-du-projet.md), [1.1-4](../../backlog/1.1-4-disque-images-de-construction.md), [1.1-5](../../backlog/1.1-5-duree-de-session.md), [1.1-6](../../backlog/1.1-6-scripts-deploiement-controles-dupliques.md), [1.1-7](../../backlog/1.1-7-compose-ancien-message-trompeur.md), [1.1-8](../../backlog/1.1-8-images-sans-digest.md), [1.1-9](../../backlog/1.1-9-fichiers-sans-usage-publies.md) (basses)
- Nouvelles occurrences : aucune
- Traitées par cette version : aucune (1.0-1 et 1.0-2 restent ouvertes, hors périmètre)

## Couverture de la doc
| Élément | Page |
|---|---|
| Image `front`, services Compose, cas A et B (R1–R12, R20–R22) | [Architecture](../../technique/architecture.md) |
| Liste publique, authentification, `reverse_proxy = false` (R4, R5, R7) | [Architecture](../../technique/architecture.md#oauth2-proxy-deployoauth2-proxycfg), [Décisions](../../technique/decisions.md) |
| Scripts `prepare-serveur.sh`, `deploy.sh`, `check-site.sh` (R13–R16) | [Architecture](../../technique/architecture.md#scripts) |
| Publication, `SKIP`, règles du déploiement, banc de test (R17, R23) | [Conventions](../../technique/conventions.md) |
| Fin de GitHub Pages (R18) | [Conventions](../../technique/conventions.md#publication), [Décisions](../../technique/decisions.md) |
| Mode d'emploi (R19), test local (R21) | `deploy/README.md`, [Architecture](../../technique/architecture.md#environnements) |
| Vocabulaire (oauth2-proxy, cas A / cas B, profil Compose…) | [Glossaire](../../glossaire.md) |
Pas de doc produit : aucun écran ni règle métier ne change pour les recruteurs (plan d'équipe).
