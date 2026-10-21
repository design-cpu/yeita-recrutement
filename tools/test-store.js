/* Test du store candidats hors navigateur : node tools/test-store.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const mem = {};
let refuse = false;
const ctx = {console, Date, JSON, Math, Promise, Object, Array, String, Error, setTimeout,
  localStorage: {getItem: k => mem[k] ?? null, setItem: (k, v) => { if(refuse) throw new Error("quota"); mem[k] = String(v); }, removeItem: k => { delete mem[k]; }}};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["assets/yeita.js", "assets/data-yeita-match.js", "assets/dossier.js", "assets/store.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, {filename: f});
const {STORE: S, DOSSIER: D} = ctx;
let fails = 0;
const ok = (c, m, x) => { console.log((c ? "OK  " : "FAIL") + " " + m + (x !== undefined ? "  " + x : "")); if(!c) fails++; };
const rejects = async (p, m, re) => { try{ await p; ok(false, m, "(n'a pas échoué)"); }catch(e){ ok(!re || re.test(e.message), m, e.message); } };
(async () => {
  S.setMe("Thélo");
  // migration v1
  mem["yeita-dossiers"] = JSON.stringify({"cand-v1": {schema:"yeita-dossier-candidat", version:1, id:"cand-v1", candidat:{nom:"Ancien Dossier", role:"PM"}, ec1:{percu:"x"}, ec2:null, restitution:{etat:"ec1"}, meta:{creeLe:"2026-10-01T10:00:00Z", modifieLe:"2026-10-01T10:00:00Z"}}});
  const v1 = await S.getCandidate("cand-v1");
  ok(v1.version === 2 && v1.parcours.etape === "passation-ec1" && v1.identite.prenom === "Ancien" && v1.meta.origine === "fiche", "migration v1 → v2 (étape déduite, identité)");
  await rejects(S.createCandidate({prenom:"", nom:"X"}), "ajout sans prénom refusé", /prénom/);
  await rejects(S.createCandidate({prenom:"A", nom:"B", email:"pas-un-mail"}), "e-mail invalide refusé", /@/);
  let c = await S.createCandidate({prenom:"Camille", nom:"Test", email:"camille.test@example.com", telephone:"01 99 00 00 00", provenance:"wttj"});
  ok(c.parcours.etape === "appel" && c.candidat.nom === "Camille Test" && c.historique.length === 1 && c.historique[0].par === "Thélo", "ajout : étape appel, nom, historique, auteur");
  ok(!S.started(c), "carte : Démarrer avant le premier passage");
  c = await S.startStep(c.id); ok(S.started(c), "Démarrer → Reprendre");
  await rejects(S.moveStep(c.id), "EC1 bloquée tant que le one-pager n'est pas coché", /One-pager/);
  await rejects(S.moveStep(c.id, {vers:"ec2"}), "saut d'étape refusé", /une étape à la fois/);
  c.appel.onePager = {envoyeLe: D.now(), par:"Thélo"}; await S.saveCandidate(c);
  c = await S.moveStep(c.id); ok(c.parcours.etape === "ec1" && c.parcours.etapes.appel.termineLe, "appel → EC1");
  c = await S.undoLast(c.id); ok(c.parcours.etape === "appel" && c.historique[c.historique.length-1].annulation, "annuler le dernier passage");
  await rejects(S.undoLast(c.id), "pas de double annulation", /pas de passage/);
  for (const e of ["ec1","passation-ec1","ec2","passation-ec2","ec3"]) { c = await S.moveStep(c.id); }
  ok(c.parcours.etape === "ec3" && c.passations.ec1 && c.passations.ec1.faiteLe && c.passations.ec2, "jusqu'à l'EC3, passations datées");
  await rejects(S.closeCandidate(c.id, {motif:"salaire"}), "pas de refus en EC3", /EC3/);
  c = await S.moveStep(c.id); c = await S.moveStep(c.id);
  ok(c.parcours.etape === "onboarding" && c.restitution.etat === "hire", "décision → onboarding, carte en embauche");
  await rejects(S.moveStep(c.id), "rien après l'onboarding", /terminé/);
  let r = await S.createCandidate({prenom:"Refus", nom:"Ec1"});
  r.appel.onePager.envoyeLe = D.now(); await S.saveCandidate(r); r = await S.moveStep(r.id);
  await rejects(S.closeCandidate(r.id, {}), "clôture sans motif refusée", /motif/);
  await rejects(S.closeCandidate(r.id, {motif:"autre"}), "motif « autre » sans précision refusé", /Précise/);
  r = await S.closeCandidate(r.id, {motif:"poste", carteEnvoyee:true});
  ok(r.parcours.etape === "clos" && r.parcours.cloture.depuis === "ec1" && r.restitution.etat === "ec1" && /Type de poste/.test(r.historique.at(-1).motif), "refus en EC1 : colonne de clôture, motif, carte EC1");
  r = await S.undoLast(r.id); ok(r.parcours.etape === "ec1" && r.parcours.cloture === null, "annuler un refus");
  // export / import
  const json = await S.exportAll(); const n = JSON.parse(json).candidats.length;
  ok(n === 3 && S.lastExport(), "export JSON (" + n + " candidats)");
  await S.removeCandidate(c.id);
  let res = await S.importAll(json, "fusion"); ok(res.ajoutes === 1 && res.ignores === 2, "import fusion : le candidat supprimé revient", JSON.stringify(res));
  await rejects(S.importAll("{nope", "fusion"), "import illisible refusé", /lisible/);
  await rejects(S.importAll('{"schema":"autre"}', "fusion"), "mauvais export refusé", /Candidatures/);
  await S.createCandidate({prenom:"En", nom:"Trop"});
  res = await S.importAll(json, "remplacement"); ok((await S.listCandidates()).length === 3, "import remplacement");
  // report d'une fiche : ne change jamais l'étape
  const before = (await S.getCandidate(r.id)).parcours.etape;
  await D.report("ec1", "Refus Ec1", D.emptyEC1(), r.id);
  ok((await S.getCandidate(r.id)).parcours.etape === before, "le report d'une fiche ne fait pas avancer le parcours");
  // exemples
  await S.loadDemo(); const demo = (await S.listCandidates()).filter(x => x.meta.demo);
  ok(demo.length === 5 && new Set(demo.map(x => x.parcours.etape)).size >= 4, "5 exemples fictifs à des étapes différentes");
  ok(demo.some(x => S.waiting(x) > 5), "un exemple dépasse 5 jours ouvrés");
  await S.clearDemo(); ok((await S.listCandidates()).every(x => !x.meta.demo), "retirer les exemples");
  // repli mémoire
  refuse = true; await S.createCandidate({prenom:"Sans", nom:"Stockage"}); ok(S.volatile() && (await S.listCandidates()).some(x => x.candidat.nom === "Sans Stockage"), "navigateur qui refuse : repli en mémoire signalé");
  console.log(fails ? fails + " échec(s)" : "TOUT OK"); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
