# Modèle de données · le dossier candidat

Ce document prépare l'arrivée de l'ATS. Il décrit ce que les entretiens produisent, où chaque information s'affiche, et comment le passage à une base de données se fera sans réécrire les pages.

## Aujourd'hui, demain

**Aujourd'hui.** Une candidature est un **dossier candidat v2**, créé dans le module Candidatures (`candidatures.html`) ou repris d'une fiche d'avant le module. Il est rangé dans le navigateur (`assets/dossier.js`, adaptateur « navigateur », repli en mémoire si le navigateur refuse d'enregistrer). Les fiches #1 et #2 ouvertes depuis une candidature (`fiche-ec1.html#c-<id>`) écrivent directement dessus ; la carte d'identité le lit. On passe d'un ordinateur à l'autre par l'export et l'import JSON du module. Les codes `YEITA-EC1` et `YEITA-EC2` restent en secours. **Données fictives uniquement** tant que le stockage n'est pas décidé : voir `STORAGE.md`.

**Demain, avec une base partagée.** On remplace l'adaptateur, avec la même interface en promesses :

| Méthode | Rôle |
|---|---|
| `list()` | Les dossiers, du plus récent au plus ancien |
| `get(id)` | Un dossier |
| `put(dossier)` | Crée ou met à jour un dossier, le rend tel qu'enregistré |
| `remove(id)` | Supprime un dossier |

`DOSSIER.use(adaptateur)` suffit côté pages. L'adaptateur Supabase est prêt, non branché : `assets/adapter-supabase.js`, avec le schéma et la mise en place dans `docs/backend/`.

## Le dossier en un coup d'œil

```
Dossier candidat v2
├── candidat          nom affiché, rôle (suit l'identité)
├── identite          prénom, nom, e-mail, téléphone, provenance (LinkedIn, Welcome to the Jungle, autre), poste (PM ou PrD)
├── parcours          étape en cours (appel → ec1 → passation-ec1 → ec2 → passation-ec2 → ec3 → decision → onboarding, ou clos)
│   ├── etapes        par étape : démarrée le, terminée le, par qui
│   └── cloture       depuis quelle étape, motif, détail, carte envoyée, le, par
├── appel             date, mené par, notes sur les quatre blocs, one-pager envoyé le
├── ec1               lecture de l'EC1 (fiche #1)
│   ├── match         dominante, seconde, lecture partielle
│   ├── percu         la phrase « ce qu'on a perçu de toi »
│   ├── valeurs       notes sous chacune des quatre valeurs (interne)
│   ├── employabilite démarrage pressenti, critères évalués
│   ├── diamants      hypothèses sur les quatre diamants (interne)
│   ├── vigilance     un signal, cité et factuel (interne)
│   └── questionsEC2  ce que l'EC2 doit aller chercher (interne)
├── passations        EC1 et EC2 : faite le, par, en appel ou en asynchrone
├── ec2               lecture de l'EC2 (fiche #2)
│   ├── notes         douze notes d'étape, de 0 à 4
│   ├── exemples      un fait rapporté par étape (interne)
│   ├── palier        palier discuté
│   ├── aspirations   (interne)
│   └── suspens       points en suspens pour l'EC3 (interne)
├── ec3               bloc-notes, mené par, date (interne)
├── decision          appel au candidat fait le, par
├── fiches            brouillons d'écran des fiches #1 et #2, pour les rouvrir telles quelles
├── restitution       état de la carte : arrêt après EC1, après EC2, embauche
├── historique        chaque passage : de, vers, le, par, motif ; une annulation ajoute une ligne
├── notesLibres       hors MVP, désactivé
└── meta              créé le, modifié le, exemple fictif, origine
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

## Tables cibles, pour les bilans

La base préparée range le dossier tel quel, en JSONB, une ligne par candidature (`docs/backend/schema.sql`) : rien à changer dans les pages. Les tables ci-dessous restent la cible pour les bilans ; elles se dérivent du JSON par des vues SQL, le jour où on en a besoin.

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

## RGPD

Le détail, les options de stockage et les décisions à prendre sont dans `STORAGE.md`. En bref :

- **Minimisation.** Les règles d'écriture s'appliquent à tous les champs libres, y compris les notes de l'appel et de l'EC3 : rien qui ne soit relié au travail (ni âge, ni origine, ni santé, ni vie personnelle).
- **Durée de conservation.** La purge est prête dans `schema.sql`, la durée reste à fixer. Le référentiel de la CNIL d'avril 2026 donne le cadre : en base active jusqu'à la réponse ; pour une personne non retenue, le CV sort au plus tard 2 ans après le dernier contact, sauf accord de sa part.
- **Information des candidats.** Le one-pager ou le mail d'après l'appel porte la mention : quelles données, pour quoi, combien de temps, à qui écrire.
- **Droit d'accès et d'effacement.** La carte d'identité est déjà une restitution. « Supprimer la candidature », dans « Coordonnées et suppression », efface tout ; la base journalise la suppression sans garder le contenu.
- **Accès par rôle.** Recruteur et fondateur écrivent ; le rôle « lecture » consulte. Le journal dit qui a fait quoi.
