---
type: bilan
vue: humaine
version: 1.3
statut: terminee
---

# Toute l'équipe partage maintenant les mêmes candidatures, sur le serveur de Yeita

> Terminée. Avant de merger : un essai avec un vrai compte Google, puis le contrôle réseau du README sur le serveur avant d'ajouter le premier admin.

## Ce qui a été fait
Sur `recrutement.yeita.fr`, les pages de candidatures lisent et écrivent désormais dans la base partagée. Chacun agit sous son compte Google : « Connecté·e : Alice » remplace la liste « Qui es-tu ? ».

Si deux personnes modifient le même dossier, la seconde voit un bandeau rouge et sa saisie reste à l'écran pour être copiée. Rien n'est jamais écrasé sans le dire.

En cas de panne ou de compte hors de l'équipe, la page le dit et n'enregistre rien. Elle ne repasse jamais en silence dans le navigateur. Sur un poste sans base, tout marche comme avant.

L'API tourne dans Docker, sur un réseau que seul oauth2-proxy peut joindre. Un essai sur un serveur Linux a montré une faille possible (la machine elle-même pouvait parler à l'API) ; elle est fermée et vérifiée.

## Comment ça s'est passé
| Étape | Statut |
|---|---|
| Spec | validée à 97/100, en 3 tours (47, puis 88) ; 7 décisions prises par toi |
| Tâches | 10 sur 10 |
| Revue de code | 1 défaut important corrigé (un départ de page pouvait écraser le travail d'une autre page), 9 petits corrigés |
| Tests | 100 % après correction de 3 défauts trouvés par la QA ; deux nouvelles suites de tests du mode serveur |
| Doc | une page produit et une page technique créées, cinq mises à jour, le mode d'emploi du serveur complété |

## À faire avant de merger
- [ ] Suivre le guide de test : `qa/guide-test-humain.md`.
- [ ] Avec un vrai compte Google, ouvrir `https://recrutement.yeita.fr/api/moi` : ton email doit s'afficher.
- [ ] Au déploiement, relever la version de Docker du serveur et faire le contrôle réseau du README (§ 9b) avant d'ajouter le premier admin.
- [ ] Confirmer qu'aucune vraie candidature n'est restée dans les navigateurs de l'équipe.
- [ ] Prévoir rapidement la fiche 1.3-1 : le bandeau « Données fictives » dit encore « Tout reste dans ce navigateur ».

## Ce qui n'a pas marché
Rien de bloquant. Quelques écarts assumés avec la spec, tous expliqués dans la version complète. Les deux principaux :
- deux anciens tests ignorent maintenant une seule erreur attendue ;
- le test du mode serveur garde une identité de secours pour l'envoi au départ d'une page.

## Pour tester
```bash
git switch version/1.3-branchement-api
python3 tools/build.py _site && cd api && npm ci && node equipe.js add moi@yeita.fr Moi admin && DEV_EMAIL=moi@yeita.fr DEV_STATIC=../_site npm start
```
Puis ouvrir `http://127.0.0.1:8000/candidatures/` et suivre le guide de test.
