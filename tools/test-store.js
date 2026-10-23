/* Le dossier v3 et les règles du parcours, hors navigateur : node tools/test-store.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const mem = {};
let refuse = false;
const ctx = {console, Date, JSON, Math, Promise, Object, Array, String, Error, RegExp, Number, setTimeout,
  localStorage: {getItem: k => mem[k] ?? null, setItem: (k, v) => { if(refuse) throw new Error("quota"); mem[k] = String(v); }, removeItem: k => { delete mem[k]; }}};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["assets/yeita.js", "assets/config.js", "assets/data-yeita-match.js", "assets/dossier.js", "assets/qui.js", "assets/store.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, {filename: f});
const {STORE: S, DOSSIER: D, QUI} = ctx;
let fails = 0;
const ok = (c, m, x) => { console.log((c ? "OK  " : "FAIL") + " " + m + (x !== undefined ? "  " + x : "")); if(!c) fails++; };
const rejects = async (p, m, re) => { try{ await p; ok(false, m, "(n'a pas échoué)"); }catch(e){ ok(!re || re.test(e.message), m, e.message); } };
(async () => {
  /* Qui es-tu */
  ok(QUI.equipe().indexOf("Peter") >= 0, "Qui es-tu : l'équipe vient de la config");
  QUI.choisir("Samia"); ok(S.me() === "Samia" && QUI.equipe().indexOf("Samia") >= 0, "Qui es-tu : un nom libre est ajouté et réutilisable");
  QUI.choisir("Thélo");

  /* Migration v2 → v3 */
  const v2 = {schema: "yeita-dossier-candidat", version: 2, id: "cand-v2", candidat: {nom: "Léna Garnier", role: "PrD"},
    identite: {prenom: "Léna", nom: "Garnier", email: "lena@example.com", telephone: "01 99", provenance: "autre", provenanceDetail: "Cooptation par Hugo", poste: "PrD"},
    parcours: {etape: "passation-ec1", etapes: {"appel": {debuteLe: "2026-10-01T09:00:00Z", termineLe: "2026-10-02T09:00:00Z"}, "ec1": {debuteLe: "2026-10-03T09:00:00Z", termineLe: "2026-10-04T09:00:00Z"}, "passation-ec1": {debuteLe: "2026-10-05T09:00:00Z"}}, cloture: null},
    appel: {date: "2026-10-01", par: "Peter", blocs: {parcours: "Trois ans PO", recherche: "", cadre: "", conditions: "52 k€"}, onePager: {envoyeLe: "2026-10-01T10:00:00Z", par: "Peter"}},
    ec1: {percu: "x"}, ec2: null, fiches: {}, passations: {ec1: {faiteLe: null, mode: "asynchrone"}, ec2: null},
    ec3: {notes: "", par: "", le: null}, decision: {appelFaitLe: null, par: ""}, restitution: {etat: "ec1"},
    historique: [{de: null, vers: "appel", le: "2026-10-01T09:00:00Z", par: "Peter"}, {de: "appel", vers: "ec1", le: "2026-10-02T09:00:00Z", par: "Andrea"}, {de: "ec1", vers: "passation-ec1", le: "2026-10-04T09:00:00Z", par: "Andrea"}],
    notesLibres: {}, meta: {creeLe: "2026-10-01T09:00:00Z", modifieLe: "2026-10-05T09:00:00Z", demo: false, origine: "module"}};
  mem["yeita-dossiers"] = JSON.stringify({"cand-v2": v2});
  const m = await S.getCandidate("cand-v2");
  ok(m.version === 3 && m.identite.personne === "Léna Garnier" && m.candidat.nom === "Léna Garnier", "v2 → v3 : un seul champ Nom Prénom");
  ok(m.identite.job === "PrD" && m.candidat.role === "PrD", "v2 → v3 : le poste devient le Job");
  ok(JSON.stringify(m.identite.provenances) === '["Cooptation"]' && m.identite.dateDebutProcess === "2026-10-01", "v2 → v3 : provenance « autre » reconnue, date de début du process");
  ok(m.parcours.etape === "bilan-ec1" && m.parcours.etapes["bilan-ec1"] && !m.parcours.etapes["passation-ec1"], "v2 → v3 : Passation devient Bilan");
  ok(m.historique.every(h => !/passation/.test(h.vers || "")), "v2 → v3 : l'historique suit les nouveaux noms");
  ok(m.bilans.ec1 && m.bilans.ec1.mode === "asynchrone" && !m.passations, "v2 → v3 : passations → bilans");
  ok(m.appel.ancien && m.appel.ancien.conditions === "52 k€" && m.appel.reponses && m.appel.reponses.recherche === "", "v2 → v3 : les 4 anciens blocs restent lisibles");
  ok(JSON.stringify(m.identite.recruteurs) === '["Peter","Andrea"]', "v2 → v3 : recruteurs repris des auteurs");
  ok(m.etat === "planifie", "v2 → v3 : État déduit (étape démarrée → Planifié)");
  /* v1 → v3 */
  mem["yeita-dossiers"] = JSON.stringify({"cand-v1": {schema: "yeita-dossier-candidat", version: 1, id: "cand-v1", candidat: {nom: "Ancien Dossier", role: "PM"}, ec1: {percu: "x"}, ec2: null, restitution: {etat: "ec1"}, meta: {creeLe: "2026-10-01T10:00:00Z", modifieLe: "2026-10-01T10:00:00Z"}}});
  const v1 = await S.getCandidate("cand-v1");
  ok(v1.version === 3 && v1.parcours.etape === "bilan-ec1" && v1.identite.job === "PM / PO", "v1 → v3 : étape et job déduits");
  delete mem["yeita-dossiers"];

  /* NOM Prénom */
  ok(D.decoupe("GARNIER Léna").prenom === "Léna" && D.decoupe("Léna Garnier").prenom === "Léna" && D.decoupe("Jean-Pierre DUPONT").prenom === "Jean-Pierre", "Nom Prénom : le prénom est retrouvé dans les deux ordres");

  /* Ajout */
  await rejects(S.createCandidate({personne: ""}), "ajout sans nom refusé", /nom/);
  await rejects(S.createCandidate({personne: "A B", email: "pas-un-mail"}), "e-mail invalide refusé", /@/);
  await rejects(S.createCandidate({personne: "A B", xp: "-2"}), "XP négative refusée", /années/);
  let c = await S.createCandidate({personne: "GARNIER Léna", job: "PrD", xp: "4", provenances: ["WTTJ", "WTTJ", "LinkedIn"], telephone: "06 xx"});
  ok(c.parcours.etape === "appel" && c.etat === "a-planifier" && c.identite.xp === 4 && c.identite.provenances.length === 2, "ajout : appel, À planifier, XP en nombre, provenances sans doublon");
  ok(JSON.stringify(c.identite.recruteurs) === '["Thélo"]' && c.identite.dateDebutProcess.length === 10, "ajout : recruteur par défaut et date de début");
  c = await S.updateFiche(c.id, {disponibilite: "1 mois", adresse: "Lyon"});
  ok(c.identite.disponibilite === "1 mois" && c.identite.adresse === "Lyon", "fiche : modification");
  await rejects(S.updateFiche(c.id, {email: "x"}), "fiche : e-mail invalide refusé", /@/);
  ok(S.addDispo("Janvier").indexOf("Janvier") >= 0, "disponibilité : option ajoutée");

  /* État à la main */
  c = await S.setEtat(c.id, "planifie", "Peter");
  ok(c.etat === "planifie" && c.historique.slice(-1)[0].type === "etat" && c.historique.slice(-1)[0].par === "Peter", "État : changé à la main, noté dans l'historique");
  await rejects(S.setEtat(c.id, "nimporte"), "État : valeur inconnue refusée", /inconnu/);

  /* Parcours */
  await rejects(S.moveStep(c.id), "appel → EC1 bloqué sans one-pager", /one-pager/);
  c.appel.onePager = {envoyeLe: D.now(), par: "Thélo"}; await S.saveCandidate(c);
  c = await S.moveStep(c.id, {par: "Thélo"});
  ok(c.parcours.etape === "ec1" && c.etat === "a-planifier", "appel → EC1, l'État repart à « À planifier »");
  await rejects(S.closeCandidate(c.id, {motif: "posture"}), "pas de Non retenu en EC1 : ça se décide au bilan", /bilan/);
  c = await S.moveStep(c.id, {par: "Thélo"});
  ok(c.parcours.etape === "bilan-ec1", "EC1 → Bilan EC1");
  c = await S.bilanRetour(c.id, {par: "Thélo", mode: "appel"});
  ok(c.parcours.etape === "bilan-ec1" && c.etat === "retour-a-faire" && c.bilans.ec1.issue === "retour-a-faire", "Bilan : En réflexion → Retour à faire, la carte reste");
  c = await S.moveStep(c.id, {par: "Thélo", mode: "asynchrone"});
  ok(c.parcours.etape === "ec2" && c.bilans.ec1.issue === "continuer" && c.bilans.ec1.mode === "asynchrone", "Bilan : Continuer → EC2");
  c = await S.undoLast(c.id, "Thélo");
  ok(c.parcours.etape === "bilan-ec1" && c.etat === "retour-a-faire", "Annuler : retour au bilan, l'État d'avant revient");
  c = await S.moveStep(c.id, {par: "Thélo"}); c = await S.moveStep(c.id, {par: "Thélo"}); c = await S.moveStep(c.id, {par: "Thélo"}); c = await S.moveStep(c.id, {par: "Thélo"});
  ok(c.parcours.etape === "decision", "EC2 → Bilan EC2 → EC3 → Décision");
  await rejects(S.moveStep(c.id), "Décision : pas de passage sans choix", /décision/i);
  await rejects(S.decide(c.id, {choix: "proposition", commentaire: ""}), "Décision : commentaire obligatoire", /commentaire/);
  c = await S.decide(c.id, {choix: "proposition", commentaire: "Coup de cœur de l'équipe.", par: "Pauline"});
  ok(c.parcours.etape === "proposition" && c.decision.choix === "proposition" && c.decision.par === "Pauline", "Décision → Proposition, avec commentaire et auteur");
  c = await S.moveStep(c.id, {par: "Thélo"});
  ok(c.parcours.etape === "onboarding" && c.etat === "valide" && c.arrivee.confirmeeLe && c.restitution.etat === "hire", "Arrivée confirmée → Onboarding, Validé");

  /* Vivier, Go sur mission, refus */
  let v = await S.createCandidate({personne: "Nora Haddad", job: "PrD"});
  v.parcours.etape = "decision"; await S.saveCandidate(v);
  v = await S.decide(v.id, {choix: "vivier", commentaire: "Pas tout de suite."});
  ok(v.parcours.etape === "vivier" && S.COLONNES_MASQUEES.indexOf("vivier") >= 0, "Décision → Vivier, colonne masquée par défaut");
  let g = await S.createCandidate({personne: "Paul Martin"}); g.parcours.etape = "decision"; await S.saveCandidate(g);
  g = await S.decide(g.id, {choix: "go-mission", commentaire: "Embauche dès qu'une mission PM s'ouvre."});
  ok(g.parcours.etape === "go-mission", "Décision → Go sur mission");
  g = await S.moveStep(g.id, {par: "Thélo"}); ok(g.parcours.etape === "onboarding", "Go sur mission → Arrivée confirmée → Onboarding");
  let r = await S.createCandidate({personne: "Inès Bernard"}); r.parcours.etape = "bilan-ec1"; await S.saveCandidate(r);
  await rejects(S.closeCandidate(r.id, {}), "refus : motif obligatoire", /motif/);
  r = await S.closeCandidate(r.id, {motif: "niveau", detail: "Pas assez de discovery.", par: "Peter"});
  ok(r.parcours.etape === "non-retenu" && r.etat === "non-retenu" && r.bilans.ec1.issue === "non-retenu" && r.restitution.etat === "ec1", "refus au Bilan EC1 → Non retenu");
  let d2 = await S.createCandidate({personne: "Marc Dupuis"}); d2.parcours.etape = "decision"; await S.saveCandidate(d2);
  d2 = await S.decide(d2.id, {choix: "non-retenu", commentaire: "Prétentions trop loin de la grille.", motif: "salaire"});
  ok(d2.parcours.etape === "non-retenu" && d2.decision.choix === "non-retenu" && /grille/.test(d2.decision.commentaire), "Décision → Non retenu passe par l'appel de refus");

  /* Export, import, exemples, repli mémoire */
  const txt = await S.exportAll(); const all = JSON.parse(txt);
  ok(all.schema === "yeita-candidatures" && all.version === 3 && all.candidats.length === 5, "export JSON v3");
  for (const x of all.candidats) await S.removeCandidate(x.id);
  const res = await S.importAll(txt, "fusion"); ok(res.ajoutes === 5, "import");
  await S.loadDemo(); const demo = (await S.listCandidates()).filter(x => x.meta.demo);
  ok(demo.length === 6 && new Set(demo.map(x => x.parcours.etape)).size >= 6, "6 exemples fictifs à des étapes différentes");
  ok(demo.some(x => x.parcours.etape === "vivier") && demo.some(x => x.etat === "retour-a-faire"), "exemples : un vivier, un retour à faire");
  ok(demo.every(x => /@example\.com$/.test(x.identite.email)), "exemples : adresses fictives");
  await S.clearDemo(); ok((await S.listCandidates()).every(x => !x.meta.demo), "retirer les exemples");
  refuse = true; await S.createCandidate({personne: "Test Mémoire"}); ok(S.volatile(), "navigateur qui refuse : repli en mémoire signalé"); refuse = false;
  console.log(fails ? fails + " ÉCHEC(S)" : "TOUT OK"); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
