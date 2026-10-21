# Modèle de données · le dossier candidat

Ce document prépare l'arrivée de l'ATS. Il décrit ce que les entretiens produisent, où chaque information s'affiche, et comment le passage à une base de données se fera sans réécrire les pages.

## Aujourd'hui, demain

**Aujourd'hui.** Aucune donnée candidat ne quitte l'ordinateur. Les fiches #1 et #2 reportent leur lecture dans un **dossier candidat** rangé dans le navigateur (`assets/dossier.js`, adaptateur « navigateur »). La carte d'identité lit ce dossier. Pour passer d'un ordinateur à l'autre, on colle un code `YEITA-EC1` ou `YEITA-EC2` dans la page Notion du candidat.

**Demain, avec l'ATS.** On remplace l'adaptateur de stockage par un adaptateur qui parle à la base, avec la même interface en promesses :

| Méthode | Rôle |
|---|---|
| `list()` | Les dossiers, du plus récent au plus ancien |
| `get(id)` | Un dossier |
| `put(dossier)` | Crée ou met à jour un dossier, le rend tel qu'enregistré |
| `remove(id)` | Supprime un dossier |

Un appel suffit dans chaque page : `DOSSIER.use(adaptateurATS)`. Les codes disparaissent alors, ainsi que la zone « Coller un code » de la carte.

## Le dossier en un coup d'œil

```
Dossier candidat
├── candidat          nom, rôle (PM ou PrD)
├── ec1               lecture de l'EC1 (fiche #1)
│   ├── match         dominante, seconde, lecture partielle
│   ├── percu         la phrase « ce qu'on a perçu de toi »
│   ├── valeurs       notes sous chacune des quatre valeurs (interne)
│   ├── employabilite démarrage pressenti, critères évalués
│   ├── diamants      hypothèses sur les quatre diamants (interne)
│   ├── vigilance     un signal, cité et factuel (interne)
│   └── questionsEC2  ce que l'EC2 doit aller chercher (interne)
├── ec2               lecture de l'EC2 (fiche #2)
│   ├── notes         douze notes d'étape, de 0 à 4
│   ├── exemples      un fait rapporté par étape (interne)
│   ├── palier        palier discuté
│   ├── aspirations   (interne)
│   └── suspens       points en suspens pour l'EC3 (interne)
└── restitution       état de la carte : arrêt après EC1, après EC2, embauche
```

Le schéma complet est dans `dossier-candidat.schema.json`.

## Ce qui va sur la carte, ce qui reste interne

| Champ | Sur la carte | Interne |
|---|---|---|
| `candidat.nom`, dates des entretiens | ✓ | |
| `ec1.match` (dominante, seconde) | ✓, en petit bloc | |
| `ec1.percu` | ✓, au cœur de l'argumentaire | |
| `ec1.employabilite.criteres[*]` | ✓ seulement si `afficher` est coché, avec `phrase` | `note` |
| `ec1.employabilite.demarrage`, `note` | | ✓ |
| `ec1.valeurs` | | ✓ |
| `ec1.diamants`, `vigilance`, `questionsEC2` | | ✓, section interne de la carte |
| `ec2.notes`, `palier` | ✓, radar et paliers | |
| `ec2.exemples`, `lecture`, `aspirations` | | ✓ |
| `ec2.suspens` | | ✓, section interne de la carte |

La section interne de la carte ne s'imprime jamais et ne part jamais avec le candidat.

## Proposition de tables pour l'ATS

| Table | Colonnes | Notes |
|---|---|---|
| `candidats` | id, nom, role, cree_le, modifie_le | Une ligne par personne |
| `entretiens` | id, candidat_id, type (EC1, EC2, EC3), date, mene_par, observe_par, format, reporte_le | L'EC1 a toujours un observateur |
| `lectures_match` | entretien_id, dominante, seconde, partielle, pourquoi, source | source : feuille de décompte, jeu en ligne ou saisie |
| `notes_valeurs` | entretien_id, valeur_id, texte | Interne |
| `evaluations_employabilite` | entretien_id, critere_id, statut, note_interne, phrase_candidat, afficher | statut : aligne, a-discuter, pas-aujourdhui |
| `hypotheses_diamants` | entretien_id, diamant (1 à 4), niveau | Fort, À creuser, Absent, Non vu |
| `notes_etapes` | entretien_id, etape (1 à 12), note (0 à 4 ou vide), exemple | EC2 |
| `points_ouverts` | entretien_id, nature, texte | nature : vigilance, question_ec2, suspens_palier, suspens_solides, suspens_creux, suspens_questions, suspens_contestation, suspens_conditions |
| `restitutions` | candidat_id, etat, envoyee_le | La carte envoyée, et quand |

Les référentiels ne dépendent pas du candidat et restent des fichiers de configuration : les quatre valeurs et le jeu (`data-yeita-match.js`), les diamants et les paliers (`data-diamants.js`), les critères d'employabilité et leurs phrases (`data-employabilite.js`).

## À cadrer avant l'ATS (RGPD)

- **Minimisation.** Les règles d'écriture s'appliquent déjà : rien qui ne soit relié au travail (ni âge, ni origine, ni santé, ni vie personnelle).
- **Durée de conservation.** À fixer pour les candidats non retenus. La CNIL recommande en général deux ans au plus après le dernier contact : à confirmer avec la personne en charge des données chez Yeita.
- **Information des candidats.** Le one-pager peut porter la mention : quelles données, pour quoi, combien de temps.
- **Droit d'accès et d'effacement.** La carte d'identité est déjà une restitution. En local, « Effacer ce dossier » supprime tout ; l'ATS devra offrir la même chose.
- **Accès par rôle.** Le recruteur et l'observateur écrivent l'EC1, le pair écrit l'EC2, le fondateur lit la carte et sa section interne.
