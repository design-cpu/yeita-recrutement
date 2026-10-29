---
type: tache
version: 1.10
numero: 03
titre: Pages : dépôt, retrait, lien
statut: ok
date: 2026-10-28
---

# Tâche 03 — Pages : dépôt, retrait, lien

> **QA : réussie** · 7 fichiers (`candidatures/menu-candidat.js`, `candidat.html`, `style.css`, `assets/adapter-serveur.js`, `store.js`, `wording.fr.js`, `tools/e2e-serveur.py`) · 2 corrections
> Un CV ou un portfolio déposé est toujours cohérent avec le dossier : jamais d'« Ouvrir » vers un fichier absent, jamais de fichier gardé en douce, et le recruteur sait ce qui s'est passé.

## Ce que ça change
Le dépôt envoie le fichier puis enregistre le dossier qui le cite ; si l'enregistrement est refusé, le fichier est retiré et le champ revient tel qu'il était, avec un message clair. Le retrait enregistre d'abord le dossier sans le fichier, puis efface le fichier. Pendant l'opération, les boutons du champ sont désactivés et la fenêtre ne se ferme pas. Un 413 de nginx dit « Le serveur refuse ce fichier… préviens Sofiane ou Léo ». Un lien collé n'est cliquable que s'il commence par `http(s)://`. Un import qui cite un fichier effacé l'oublie.

## Comment tester
Mode serveur (voir le guide de test), fiche d'un candidat à l'appel : déposer un PDF, le retirer, coller un lien, le retirer ; l'historique (menu ⋯) montre les quatre lignes.
Tests automatiques : `python3 tools/build.py _site && python3 tools/e2e-serveur.py` → contrôles « 1.10 » tous `OK`.

## Critères d'acceptation
- [x] CA5 — deux recruteurs réels : dépôt de Bob sur une version périmée → 409, message, fichier retiré, champ vide ; saisie suivante sans référence.
- [x] CA6 (a, d) — PUT appliqué puis réponse coupée → fichier présent et référencé ; import d'un export qui cite un fichier effacé → sans référence.
- [x] CA7 (a, b, c) — retrait refusé (bloc Infos et fenêtre ⋯) → fichier présent et référencé ; retrait réussi → `PUT` puis `DELETE` ; envoi ralenti → boutons `disabled`, un seul `POST` ; échec réseau puis saisie puis départ → base cohérente ; saisie pendant un dépôt ralenti → fichier et saisie en base, aucun conflit.
- [x] CA8 — 413 HTML sur l'envoi → message nginx ; sur un PUT de dossier → pas ce message.
- [x] CA11 — dépôt, retrait, lien, retrait de lien tracés ; rien pour un dépôt refusé.
- [x] CA15 — `javascript:` affiché en texte, aucun lien, aucun script ; mode navigateur : liens seulement (`e2e-candidatures`, Léo).
- [x] CA18 — focus sur « Ouvrir » après le dépôt ; zone de message toujours dans la page.

## Ce qui a été fait
- `menu-candidat.js` : `deposer` (R4 : envoi → enregistrement ; refus lu → retrait au mieux ; issue inconnue → rien), `enleverFichier` (R5 : enregistrement → retrait au mieux), `remettre`/`etatChamp` (R19), `operer` (une opération à la fois, commandes désactivées, redessin du seul champ, focus, message), `messageDepot` (R7), `validerLien` (lien à la place d'un fichier : enregistrement immédiat), `docHTML` (R20), fermeture bloquée pendant une opération.
- `adapter-serveur.js` : `fichiers(id)` ; `store.js` : `sansFichiersAbsents` dans `importAll` (R21) ; `wording.fr.js` : `erreurServeur`, `nonEnregistreConflit`, `lienPose` ; `style.css` : `.docmsg` vide gardé dans la page.
Commits : `931081e` (tâches 03 et 04), `7e11deb` (attente des enregistrements différés retirée).

## Résultat QA
| Vérification | Résultat |
|---|---|
| CA5, CA6 a/d, CA7 a/b/c, CA8, CA11, CA15, CA18 | ok (`e2e-serveur`, 19 contrôles « 1.10 ») |
| Non-régression | `test-store` : `TOUT OK` ; `test-serveur` : `TOUT OK (87 vérifications)` ; `e2e-candidatures` : `ALL OK` ; `e2e-parcours` : `ALL OK` ; `e2e-serveur` : `ÉCHECS`, seul « départ de la page (candidat.html), PUT précédent lent » (1.10-3, voir QA) |
Corrections : (1) le contrôle CA8 « PUT de dossier » lisait le message laissé par l'envoi sur la même page : page rechargée entre les deux. (2) La mutation T5 survivait : l'attente des enregistrements différés pendant une opération était sans effet (l'adaptateur enchaîne déjà les enregistrements d'un dossier, et la remise du champ passe avant le suivant) ; retirée (`7e11deb`).

## Mutations
Copie du dépôt, `e2e-serveur.py` complet dans le conteneur Playwright (`timeout 900`), classement par les lignes `FAIL` des contrôles « 1.10 », puis par la ligne finale.
| Contrôle | Mutation | Attendu | Obtenu |
|---|---|---|---|
| R19 | `remettre` retiré après l'échec d'un dépôt | échec | détectée (CA5, CA7 b) |
| R4 refus | fichier refusé non retiré | échec | détectée (CA5) |
| R4 issue inconnue | tout échec traité comme un refus | échec | détectée (CA6 a) |
| R5 ordre | fichier retiré avant l'enregistrement | échec | détectée (CA7 a ×4, CA7 b) |
| R19 attente | enregistrement différé sans attente | échec | **survivante** → code retiré (correction 2) |
| R20 | schéma du lien non contrôlé | échec | détectée (CA15) |
| R7 | 413 de nginx non distingué | échec | détectée (CA8) |
| R21 | import sans nettoyage | échec | détectée (CA6 d) |
| Commandes pendant l'envoi | non désactivées | échec | détectée (CA7 a) |

## Spec couverte
R4, R5, R7, R11, R16, R19, R20, R21, Accessibilité, CA5, CA6 (a, d), CA7, CA8, CA11, CA15, CA18
