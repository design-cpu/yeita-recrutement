---
type: technique
vue: humaine
page: decisions
titre: Décisions techniques
---

# Décisions techniques

> Trois choix orientent le dépôt : le stockage passe par SQLite chez Yeita, le code Supabase est retiré, et le dépôt devient la seule source de vérité.

## Où vivront les données

Les candidatures seront rangées dans une base SQLite, sur le serveur OVH de Yeita. La connexion passera par le compte Google de l'entreprise, réservé aux adresses @yeita.fr. Sacha s'en occupe sur sa branche.

Les pages n'auront pas à changer : elles parlent à un seul point d'entrée, le dossier candidat, qui saura où ranger les données. En attendant, tout reste dans le navigateur, avec des données inventées.

## Pourquoi le code Supabase a disparu

Supabase était une autre piste de stockage. Elle a été abandonnée le 23 octobre 2026. Son code n'était chargé par aucune page : il a été retiré en v1.0.

> Rien n'est perdu. L'historique git garde tout. Pour relire l'ancien adaptateur : `git show a86b6f4:assets/adapter-supabase.js`.

## D'où partent les changements

| Avant | Maintenant |
|---|---|
| On modifiait l'artefact Claude, puis on recopiait ses fichiers ici | On modifie le dépôt directement |
| Pas de règle de relecture | Une branche par sujet, puis une pull request vers `main` |

Le détail est dans la version complète.
