# Base partagée Supabase · mise en place le jour du GO

**État : préparé, non branché.** Aucune page ne charge ces fichiers. Rien ne part d'un navigateur tant que les étapes ci-dessous n'ont pas été faites. Le choix de la base et les durées de conservation se décident avec Mattéo : voir `STORAGE.md`, à la racine du dépôt.

## Ce qui est prêt

| Fichier | Rôle | Vérifié par |
|---|---|---|
| `docs/backend/schema.sql` | Tables `equipe`, `candidats`, `journal` ; règles d'accès (RLS) ; enregistrement avec détection de conflit ; purge des candidatures closes | `docs/backend/test-schema.mjs`, sur un Postgres embarqué : 15 vérifications |
| `assets/adapter-supabase.js` | L'adaptateur `list`, `get`, `put`, `remove` pour `assets/dossier.js` | `tools/test-adapter.js`, contre une fausse base : 10 vérifications |
| `assets/backend.js` | Écran de connexion par lien e-mail, contrôle d'appartenance à l'équipe, branchement de l'adaptateur, mises à jour en direct | `tools/e2e-backend.py`, avec un faux client : 8 vérifications. À refaire sur le vrai projet |
| `docs/backend/config.example.js` | L'adresse du projet et la clé publique | — |

Ce que les règles garantissent, et que le test vérifie :

- sans connexion, on ne lit rien ;
- avec une adresse hors **@yeita.fr**, ou absente de la table `equipe`, on ne lit rien ;
- un rôle « lecture » voit mais n'écrit pas ;
- une personne passée à `actif = false` perd l'accès aussitôt ;
- deux saisies en même temps : la seconde est refusée avec un message, rien n'est écrasé ;
- chaque création, modification et suppression est notée dans `journal` (qui, quand, quelle étape), sans le contenu ;
- la purge supprime les candidatures closes au-delà de la durée choisie, et les exemples fictifs de plus de 7 jours.

## Mise en place (environ une heure)

1. **Créer le projet** sur supabase.com, au nom de Yeita :
   - région **West EU (Paris)**, `eu-west-3` : pas la région générale « Europe », qui peut tomber hors de l'UE ;
   - plan Free ou Pro, selon la décision de jeudi.
2. **Signer le DPA** de Supabase, et ajouter le traitement « Recrutement » au registre.
3. **Exécuter `schema.sql`** dans l'éditeur SQL du projet, puis remplir la table `equipe` avec la liste décidée (l'exemple est en commentaire dans le fichier).
4. **Régler la connexion** dans Authentication :
   - désactiver « Allow new users to sign up » ;
   - **inviter** chaque personne de l'équipe depuis le tableau de bord, avec son adresse @yeita.fr ;
   - dans URL Configuration, mettre l'adresse du site GitHub Pages en Site URL et en Redirect URL.
5. **Configurer le site** :
   - copier `docs/backend/config.example.js` en `assets/backend-config.js` ;
   - remplir `url` et `anonKey` (Project Settings → API) ;
   - ne jamais y mettre la clé `service_role`.
6. **Brancher les pages** (le seul changement de code, à faire sur une branche) :
   - dans `candidatures.html`, `fiche-ec1.html`, `fiche-ec2.html`, `carte-identite.html`, charger après `dossier.js` (et `store.js`) :
     ```html
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
     <script src="assets/backend-config.js"></script>
     <script src="assets/adapter-supabase.js"></script>
     <script src="assets/backend.js"></script>
     ```
   - faire attendre la première lecture : `YEITA_BACKEND.ready.then(route)` au lieu de `route()`, et de même pour le `boot()` des fiches et de la carte ;
   - remplacer l'écoute `storage` (entre onglets) par `YEITA_BACKEND.onChange(...)`, et activer la ligne `supabase_realtime` en bas de `schema.sql` ;
   - quand `YEITA_BACKEND.moi` existe, masquer le choix « Tu es » : le prénom vient du compte ;
   - afficher les refus d'enregistrement (conflit, accès) dans la zone de messages du module ;
   - retirer le bandeau « Données fictives uniquement » et la zone « Coller un code » de la carte.
7. **Planifier la purge** : activer l'extension `pg_cron`, puis décommenter la ligne `cron.schedule` de `schema.sql` avec la durée décidée.
8. **Reprendre les données** :
   - les données fictives restent en local, on ne les importe pas ;
   - à partir de là, les vraies candidatures se saisissent directement dans le module branché.

## Points d'attention

- **Le site reste public** : c'est la base qui filtre. Vérifier, avant d'ouvrir, avec un compte hors de l'équipe : la liste doit rester vide.
- **Une page restée ouverte longtemps** peut se voir refuser un enregistrement si quelqu'un a modifié la même candidature : le message invite à recharger. C'est voulu.
- **L'artefact Claude** ne peut pas joindre Supabase : son cadre bloque les appels vers d'autres sites. Le hub dans Claude reste le guide ; le suivi des candidatures se fait sur le site.
- **Sauvegardes** : le plan Pro en fait chaque jour. En Free, garder l'« Exporter la base (JSON) » du module comme filet, une fois par semaine.

## Vérifier le schéma sans compte Supabase

```sh
mkdir -p /tmp/pg && cd /tmp/pg && npm i @electric-sql/pglite@0.2.17
cp <dépôt>/docs/backend/test-schema.mjs . && node test-schema.mjs <dépôt>/docs/backend/schema.sql
```
