/* L'adaptateur Supabase, préparé mais non branché, testé contre une fausse base : node tools/test-adapter.js
   La fausse base reproduit ce que fait schema.sql : une ligne par candidature, une version, le refus en cas de conflit. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const mem = {};
const ctx = {console, Date, JSON, Math, Promise, Object, Array, String, Error, RegExp, Number, setTimeout,
  localStorage: {getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }}};
ctx.window = ctx; vm.createContext(ctx);
for (const f of ["assets/yeita.js", "assets/config.js", "assets/data-yeita-match.js", "assets/dossier.js", "assets/qui.js", "assets/store.js", "assets/adapter-supabase.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, {filename: f});
const {STORE: S, DOSSIER: D, SupabaseAdapter} = ctx;

/* Fausse base partagée entre deux « navigateurs » */
const rows = new Map(); let tick = 0;
function fakeClient(){
  const res = (data, error) => Promise.resolve({data, error: error || null});
  return {
    from(){ return {
      select(){ return {
        order(){ return res([...rows.values()].sort((a, b) => b.modifie_le - a.modifie_le).map(r => ({id: r.id, data: JSON.parse(r.data), version: r.version}))); },
        eq(_, id){ return {maybeSingle(){ const r = rows.get(id); return res(r ? {id: r.id, data: JSON.parse(r.data), version: r.version} : null); }}; }
      }; },
      delete(){ return {eq(_, id){ rows.delete(id); return res(null); }}; }
    }; },
    rpc(name, {p_id, p_data, p_version}){
      const r = rows.get(p_id);
      if(p_version === null){ if(r) return res(null, {code: "23505", message: "duplicate key"}); rows.set(p_id, {id: p_id, data: JSON.stringify(p_data), version: 1, modifie_le: ++tick}); return res([{nouvelle_version: 1}]); }
      if(!r || r.version !== p_version) return res(null, {code: "P0001", message: "conflit"});
      r.version++; r.data = JSON.stringify(p_data); r.modifie_le = ++tick; return res([{nouvelle_version: r.version}]);
    }
  };
}
let fails = 0;
const ok = (c, m, x) => { console.log((c ? "OK  " : "FAIL") + " " + m + (x !== undefined ? "  " + x : "")); if(!c) fails++; };
(async () => {
  const A = SupabaseAdapter(fakeClient()), B = SupabaseAdapter(fakeClient());
  D.use(A); S.setMe("Thélo");
  ok(D.adapter().name === "supabase" && !S.volatile(), "adaptateur branché, pas de repli en mémoire");
  let c = await S.createCandidate({personne: "Léna Garnier", email: "lena@example.com", provenances: ["WTTJ"]});
  ok(rows.size === 1 && rows.get(c.id).version === 1, "ajout : une ligne, version 1");
  c = await S.startStep(c.id);
  c.appel.onePager = {envoyeLe: D.now(), par: "Thélo"}; c = await S.saveCandidate(c);
  c = await S.moveStep(c.id, {par: "Thélo"});
  ok(c.parcours.etape === "ec1" && rows.get(c.id).version === 4, "passages : chaque enregistrement monte la version", rows.get(c.id).version);
  const list = await S.listCandidates();
  ok(list.length === 1 && list[0].candidat.nom === "Léna Garnier", "liste depuis la base");
  // Deux recruteurs sur la même candidature
  D.use(B); const vb = await S.getCandidate(c.id); vb.ec1 = Object.assign(D.emptyEC1(), {percu: "Version de Peter"}); await S.saveCandidate(vb);
  D.use(A); let err = null; try { await S.moveStep(c.id, {par: "Thélo"}); } catch(e){ err = e.message; }
  ok(err === null, "un passage relit la ligne avant d'écrire : pas de conflit");
  D.use(B); const stale = await S.getCandidate(c.id);
  D.use(A); const fresh = await S.getCandidate(c.id); fresh.ec3.notes = "Thélo"; await S.saveCandidate(fresh);
  D.use(B); err = null; stale.ec3.notes = "Peter"; try { await S.saveCandidate(stale); } catch(e){ err = e.message; }
  ok(err && /quelqu'un d'autre/.test(err), "deux saisies en même temps : la seconde est refusée, rien n'est écrasé", err);
  ok(JSON.parse(rows.get(c.id).data).ec3.notes === "Thélo", "la base garde la première saisie");
  // Export, import, suppression
  D.use(A); const txt = await S.exportAll();
  ok(JSON.parse(txt).candidats.length === 1, "export JSON depuis la base");
  await S.removeCandidate(c.id); ok(rows.size === 0, "suppression");
  const r = await S.importAll(txt, "fusion"); ok(r.ajoutes === 1 && rows.size === 1, "import vers la base");
  console.log(fails ? fails + " ÉCHEC(S)" : "TOUT OK"); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
