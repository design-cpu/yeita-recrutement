# Où ranger les candidatures

> **Obsolète (23 octobre 2026).** La piste Supabase est abandonnée : l'authentification (oauth2-proxy, SSO Google réservé aux @yeita.fr) et le stockage (SQLite, sur le serveur OVH de Yeita) sont pris en charge par Sacha, sur sa branche. Ce fichier est gardé pour mémoire ; ne pas le brancher. Le modèle de données qui fait foi : `docs/backend/MODELE.md`.

Ce document compare quatre façons de partager les candidatures entre Peter, Thélo, Andrea et le reste de l'équipe. Il sert de base à la réunion de jeudi avec Mattéo. **Aucune option n'est branchée.** Jusqu'à la décision, le module Candidatures ne contient que des données fictives.

## Aujourd'hui

- Chaque candidature est un **dossier candidat v2** (`assets/dossier.js`), rangé dans le navigateur de la personne qui l'a saisi (localStorage, clé `yeita-dossiers`).
- Si le navigateur refuse d'enregistrer (navigation privée, stockage bloqué), le module garde les données en mémoire et l'affiche en haut de page : tout disparaît à la fermeture de l'onglet.
- Pour passer d'un ordinateur à l'autre : **Exporter la base (JSON)** puis **Importer**, depuis « Sauvegarde et exemples » sur le tableau des candidatures.
- Les pages ne parlent jamais au stockage directement. Elles passent par un **adaptateur** à quatre méthodes en promesses : `list()`, `get(id)`, `put(dossier)`, `remove(id)`. Changer de stockage, c'est changer d'adaptateur : `DOSSIER.use(nouvelAdaptateur)`.

## Ce qu'on attend d'une base partagée

1. **Accès restreint aux personnes Yeita**, et parmi elles à celles qui recrutent. Une personne qui part perd l'accès le jour même.
2. **RGPD** :
   - hébergement dans l'Union européenne ;
   - un contrat de sous-traitance (DPA) signé avec l'hébergeur ;
   - des durées de conservation tenues, sans dépendre de la mémoire de quelqu'un ;
   - effacer une candidature sur demande ;
   - savoir qui a modifié quoi, et quand.
3. **Plusieurs recruteurs en même temps**, sans qu'une saisie écrase celle d'un autre sans le dire.
4. **Effort raisonnable** : un adaptateur, quelques réglages, pas de serveur à maintenir.
5. **Coût** proche de zéro au volume actuel : quelques dizaines de candidatures par mois.
6. **Marcher là où on imprime.** Les exports de carte en PDF et la feuille vierge passent par le site GitHub Pages, parce que le cadre d'un artefact Claude bloque l'impression.

## Les quatre options

| | Base partagée de l'artefact Claude | **Supabase** | Firebase (Firestore) | API Notion |
|---|---|---|---|---|
| **Où vivent les données** | Chez Anthropic, rattachées à l'artefact du hub | Postgres chez Supabase, région **Paris** (`eu-west-3`) au choix | Firestore chez Google, région **Paris** (`europe-west9`) au choix | Dans l'espace Notion de Yeita |
| **Qui y accède** | Les personnes connectées à qui l'artefact est partagé ; des règles par chemin (lecture, contribution, édition) | Connexion par lien e-mail ou Google, puis règles de sécurité en base (RLS) : adresse en **@yeita.fr** et présence dans une liste d'équipe | Connexion Google, puis règles Firestore sur l'adresse en **@yeita.fr** | Les droits Notion de l'espace |
| **RGPD** | Dépend du contrat de Yeita avec Anthropic. Pas de purge automatique : elle serait à écrire dans la page | DPA proposé par Supabase ; région UE au choix. Responsabilité partagée : l'hébergeur sécurise l'infrastructure, Yeita répond de ses accès et de ses durées | DPA via les conditions Google Cloud ; région UE au choix | DPA Notion ; localisation des données à vérifier pour le plan de Yeita |
| **Plusieurs recruteurs** | Oui, avec mises à jour en direct | Oui ; conflit détecté par numéro de version, prévu dans le schéma | Oui, avec mises à jour en direct | Oui, mais l'API limite le débit (quelques requêtes par seconde) |
| **Marche sur le site GitHub Pages** | **Non** : la base n'existe que dans l'artefact. Le site, qui sert à imprimer, ne la voit pas | Oui | Oui | **Non** sans serveur : l'API Notion n'accepte pas les appels du navigateur, et la clé doit rester secrète |
| **Marche dans l'artefact Claude** | Oui (à vérifier pour les sous-pages d'un artefact à plusieurs fichiers) | Non : l'artefact bloque les appels vers d'autres sites | Non, même raison | Non, même raison |
| **Effort** | Moyen : un adaptateur `db`, l'identité via `user`. Les exports PDF seraient à refaire dans l'artefact | **Moyen : schéma, adaptateur et page de connexion déjà préparés** (`docs/backend/`) | Moyen : même travail que Supabase, règles à écrire dans le langage Firestore | Élevé : un petit serveur intermédiaire (fonction hébergée) pour garder la clé, et le dossier à découper en propriétés Notion |
| **Coût** | Inclus dans l'abonnement Claude | Gratuit : 500 Mo, mais le projet se met en pause après une semaine sans activité. Pro : à partir de 25 $ par mois | Gratuit (Spark) : 1 Gio stocké, 50 000 lectures et 20 000 écritures par jour | Inclus dans Notion ; le serveur intermédiaire, souvent gratuit à ce volume |
| **Bonus** | Claude peut lire et préparer les données | SQL pour les bilans : délais par étape, motifs d'arrêt, provenance | Mises à jour en direct sans réglage | L'équipe vit déjà dans Notion |

**Recommandation : Supabase, région Paris.** C'est la seule option qui coche à la fois l'accès restreint à l'équipe, l'hébergement à Paris et le site GitHub Pages où l'on imprime. Le Free suffit pour démarrer. Sa mise en pause après une semaine sans activité gêne peu un outil utilisé chaque semaine. Le Pro, à 25 $ par mois, l'évite et ajoute des sauvegardes.

La base partagée de l'artefact reste une bonne option si l'équipe décide de tout faire dans Claude. Il faudrait alors refaire les exports PDF dans l'artefact. Elle n'a **pas** été activée.

## Ce que permet GitHub Pages

- **Un site statique, rien de plus** : pas de serveur, pas de secret. Toute clé posée dans le code est lisible par tous. La clé « anon » de Supabase est faite pour ça : la sécurité vient des règles en base, pas de la clé.
- **Le site est public sur Internet**, même si le dépôt est privé. Restreindre l'accès au site lui-même demande **GitHub Enterprise Cloud**.
- **Un dépôt privé ne publie un site** qu'avec GitHub Pro, Team ou Enterprise. Le dépôt `leofuster-story/yeita-recrutement` est privé aujourd'hui. Deux choix :
  - le rendre public : le code ne contient aucune donnée candidat, les liens Notion demandent un compte Yeita ;
  - prendre un plan payant.
- **La conséquence** : avec GitHub Pages, la restriction d'accès se fait dans la base (connexion et RLS), jamais sur le site. C'est ce que prévoit le schéma Supabase.

## Ce qui est prêt pour Supabase (non branché)

| Fichier | Rôle |
|---|---|
| `docs/backend/schema.sql` | Tables `equipe`, `candidats`, `journal`, avec les règles d'accès (RLS) et l'enregistrement avec détection de conflit. Elle contient aussi une purge des candidatures closes au-delà d'une durée, à fixer avec Mattéo |
| `docs/backend/README.md` | La mise en place pas à pas, le jour du GO |
| `docs/backend/config.example.js` | L'adresse du projet et la clé publique, à copier en `assets/backend-config.js` |
| `assets/adapter-supabase.js` | L'adaptateur `list`, `get`, `put`, `remove` pour `assets/dossier.js` |
| `assets/backend.js` | La connexion par lien e-mail et le branchement de l'adaptateur. Aucune page ne le charge encore |

## À trancher jeudi avec Mattéo

1. **La base** : Supabase en région Paris, ou une autre option du tableau. Plan Free ou Pro. Le compte est ouvert au nom de Yeita, pas d'une personne.
2. **Qui accède** :
   - la liste des personnes de l'équipe ;
   - leur rôle : recruteur, fondateur, lecture seule ;
   - qui ajoute ou retire une personne.
3. **Durées de conservation**, à partir du référentiel de la CNIL (avril 2026) :
   - en base active, le temps du recrutement, jusqu'à la réponse ;
   - pour une personne non retenue, le CV sort de la base active au plus tard 2 ans après le dernier contact, sauf accord de sa part ;
   - un archivage de preuve de 5 ans est possible, avec un accès limité ;
   - pour une personne recrutée, le dossier passe à la gestion du personnel.

   Il faut choisir la durée appliquée par la purge.
4. **Information des candidats** : une mention dans le one-pager ou le mail d'après l'appel. Quelles données, pour quoi, combien de temps, à qui écrire pour y accéder ou les effacer.
5. **Le registre des traitements** et le **DPA** signé avec l'hébergeur.
6. **Le site** : rendre le dépôt public, prendre un plan GitHub payant ou passer le dépôt sous l'organisation Yeita. Il faut aussi choisir qui pousse les mises à jour.
7. **Les notes libres** : rappeler la règle d'écriture, rien qui ne soit relié au travail (ni santé, ni origine, ni vie personnelle). Les champs de notes sont des textes libres.

Tant que ces points ne sont pas tranchés : **données fictives uniquement**.

## Sources

- [Supabase, régions](https://supabase.com/docs/guides/platform/regions) et [Supabase, RGPD](https://supabase.com/docs/guides/security/gdpr-compliance)
- [Supabase, offres et limites 2026](https://www.jetadmin.io/blog/supabase-review/) (relevé du 26 septembre 2026, à confirmer sur la page tarifs de Supabase)
- [Firestore, tarifs et emplacements](https://cloud.google.com/firestore/pricing)
- [Notion, appels depuis le navigateur (CORS)](https://github.com/makenotion/notion-sdk-js/issues/38)
- [GitHub Pages, dépôts privés](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) et [visibilité d'un site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- [CNIL, durées de conservation en recrutement](https://www.legisocial.fr/actualites-sociales/7875-recrutement-duree-conservation-donnees-personnelles-candidat.html) et [le référentiel de la CNIL](https://www.cnil.fr/sites/default/files/2026-04/referentiel_durees_de_conservation_gestion_des_ressources_humaines.pdf)
