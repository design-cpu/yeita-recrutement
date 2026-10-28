---
type: revue-spec
version: 1.8
bloquants: 0
majeurs: 3
integres: 5
escalade: non
date: 2026-10-28
---

# Revue de la spec — deploy.sh fixe lui-même le masque des fichiers qu'il écrit

> 3 retours majeurs et 2 mineurs, tous intégrés ; aucun bloquant, pas d'escalade.

## Revue technique et produit
| # | Regard | Sévérité | Section | Constat | Proposition |
|---|---|---|---|---|---|
| T1 | T | majeur | Critères d'acceptation (CA1, CA2) | bash lit le script présent sur le disque au lancement (V6) : si la QA part d'un commit sans la correction, elle teste l'ancien script ; rien ne dit comment provoquer l'échec de CA2. | Dépôt de départ sur un commit qui contient la correction ; commit visé = correction + `api/server.js` et un fichier du site modifiés (CA1), ou API cassée pour un échec après le `git pull` (CA2) ; lanceur `bash -c 'umask 077; deploy/deploy.sh …'`. |
| T2 | T | majeur | R3 / CA5 | Après un retour vers un commit d'avant la 1.8, le `deploy.sh` du disque redevient l'ancien ; la raison « premier passage » seule pousserait à retirer le préfixe plus tard. | R3 : le préfixe protège toute exécution où le `deploy.sh` du disque est antérieur à la 1.8 (premier passage, et après un retour vers un commit d'avant la 1.8). |
| P1 | P | majeur | Périmètre / Règles | La fiche nomme exposés les retours de `METTRE-A-JOUR.md` § 4 (l. 43, 47) et le message d'`echec` ; la spec n'en dit rien. | R5 : ils restent sans préfixe, couverts par R1 (le script du disque est alors ≥ 1.8) ; vérifié dans CA2. |
| T3 | T | mineur | Périmètre (Inclus) | Les vues humaines des deux pages portent le préfixe et sa raison. | Les ajouter à Inclus, raison alignée sur R3. |
| T4 | T | mineur | R4 / V7 | Les numéros cités sont déjà imprécis (« l. 100-111 » pour des messages aux l. 100 et 111). | Chaque numéro pointe sur la ligne du message ou du contrôle cité, vérifié par `grep -n`. |
### Escalade
Aucune.

## Traitement
| # | Statut | Justification / modification |
|---|---|---|
| T1 | integre | CA1, CA2 |
| T2 | integre | R3 |
| P1 | integre | R5, CA2 |
| T3 | integre | Périmètre Inclus, CA5 |
| T4 | integre | R4 |
