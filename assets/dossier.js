/* Le dossier candidat : une seule structure pour tout ce que les entretiens produisent.
   Les fiches #1 et #2 y reportent leur lecture, la carte d'identité la lit.

   Aujourd'hui, le dossier vit dans le navigateur (stockage local) : rien ne quitte l'ordinateur.
   Demain, l'ATS prendra le relais : il suffira de remplacer l'adaptateur de stockage
   (Dossier.use(adaptateurATS)) par un adaptateur qui parle à la base, avec la même interface
   en promesses : list(), get(id), put(dossier), remove(id). Le modèle est décrit dans
   docs/modele-de-donnees.md et docs/dossier-candidat.schema.json.

   En attendant l'ATS, les codes YEITA-EC1 / YEITA-EC2 restent le moyen de passer un dossier
   d'un ordinateur à l'autre (collés dans la page Notion du candidat). Ils disparaîtront avec l'ATS. */
(function(){
"use strict";
var SCHEMA = "yeita-dossier-candidat", VERSION = 1;
var KEY = "yeita-dossiers", CUR = "yeita-dossier-courant";
var DIAM_LEVELS = ["Fort", "À creuser", "Absent", "Non vu"];

function now(){ return new Date().toISOString(); }
function uid(){ return "cand-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7); }
/* Nom normalisé pour retrouver un dossier : minuscules, sans accents ni espaces en trop. */
function norm(s){ return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); }

/* ---------- Formes vides ---------- */
function emptyEC1(){
  return {
    date: "", recruteur: "", observateur: "", format: "presentiel",
    match: {dominante: null, seconde: null, partielle: false, pourquoi: "", source: "saisie"},
    percu: "",
    valeurs: {},
    employabilite: {demarrage: null, note: "", criteres: {}},
    diamants: [null, null, null, null],
    vigilance: "",
    questionsEC2: "",
    reporteLe: null
  };
}
function emptyEC2(){
  return {
    date: "", pair: "", role: "PM", palier: 2,
    notes: [null,null,null, null,null,null, null,null,null, null,null,null],
    exemples: ["","","", "","","", "","","", "","",""],
    lecture: "", aspirations: "",
    suspens: {palier: "", solides: "", creux: "", questions: "", contestation: "", conditions: ""},
    reporteLe: null
  };
}
function blank(nom){
  return {schema: SCHEMA, version: VERSION, id: uid(),
    candidat: {nom: nom || "", role: "PM"},
    ec1: null, ec2: null,
    restitution: {etat: "ec1"},
    meta: {creeLe: now(), modifieLe: now()}};
}
/* Complète un objet avec les clés manquantes d'un modèle (reprise de données anciennes). */
function fill(obj, model){
  if(!obj || typeof obj !== "object") return model;
  Object.keys(model).forEach(function(k){
    if(obj[k] === undefined) obj[k] = model[k];
    else if(model[k] && typeof model[k] === "object" && !Array.isArray(model[k])) fill(obj[k], model[k]);
  });
  return obj;
}

/* ---------- Adaptateur de stockage : le navigateur ---------- */
var LocalAdapter = {
  name: "navigateur",
  _all: function(){ return (window.YEITA && YEITA.store.get(KEY, {})) || {}; },
  _save: function(all){ return window.YEITA ? YEITA.store.set(KEY, all) : false; },
  list: function(){
    var a = this._all();
    return Promise.resolve(Object.keys(a).map(function(k){ return a[k]; })
      .sort(function(x, y){ return (y.meta && y.meta.modifieLe || "").localeCompare(x.meta && x.meta.modifieLe || ""); }));
  },
  get: function(id){ return Promise.resolve(this._all()[id] || null); },
  put: function(d){ var a = this._all(); a[d.id] = d; return this._save(a) ? Promise.resolve(d) : Promise.reject(new Error("Le navigateur refuse d'enregistrer (navigation privée ?).")); },
  remove: function(id){ var a = this._all(); delete a[id]; this._save(a); return Promise.resolve(); }
};
var adapter = LocalAdapter;

/* ---------- Dossier ---------- */
function touch(d){ d.meta = d.meta || {}; d.meta.modifieLe = now(); return d; }
function setCurrent(id){ if(window.YEITA) YEITA.store.set(CUR, id); }
function currentId(){ return window.YEITA ? YEITA.store.get(CUR, null) : null; }

function findByName(nom){
  var n = norm(nom);
  if(!n) return Promise.resolve(null);
  return adapter.list().then(function(all){ return all.filter(function(d){ return norm(d.candidat && d.candidat.nom) === n; })[0] || null; });
}
/* Le dossier ouvert en dernier, sinon le plus récent. */
function current(){
  var id = currentId();
  return (id ? adapter.get(id) : Promise.resolve(null)).then(function(d){
    return d || adapter.list().then(function(all){ return all[0] || null; });
  });
}
/* Reporte une partie (ec1 ou ec2) dans le dossier du candidat : retrouvé par son identifiant ou son nom, créé sinon. */
function report(part, nom, data, id){
  if(part !== "ec1" && part !== "ec2") return Promise.reject(new Error("Partie inconnue : " + part));
  if(!norm(nom)) return Promise.reject(new Error("Indique le nom du candidat avant de reporter."));
  return (id ? adapter.get(id) : Promise.resolve(null))
    .then(function(d){ return d || findByName(nom); })
    .then(function(d){
      d = d || blank(nom);
      d.candidat.nom = nom.trim();
      if(part === "ec2" && data.role) d.candidat.role = data.role;
      d[part] = fill(JSON.parse(JSON.stringify(data)), part === "ec1" ? emptyEC1() : emptyEC2());
      d[part].reporteLe = now();
      if(part === "ec2" && d.restitution && d.restitution.etat === "ec1") d.restitution.etat = "ec2";
      return adapter.put(touch(d));
    })
    .then(function(d){ setCurrent(d.id); return d; });
}
function setRestitution(id, patch){
  return adapter.get(id).then(function(d){
    if(!d) return null;
    d.restitution = Object.assign({}, d.restitution || {}, patch);
    return adapter.put(touch(d));
  });
}

/* ---------- Codes : le passage d'un ordinateur à l'autre, en attendant l'ATS ---------- */
function toCode(d, part){
  if(!d || !d[part]) return "";
  var o = {v: 2, id: d.id, nom: d.candidat.nom, role: d.candidat.role};
  o[part] = d[part];
  return "YEITA-" + part.toUpperCase() + "." + YEITA.b64e(o);
}
/* Lit un code, nouveau ou ancien format. Rend {part, id, nom, role, data} ou lance une erreur lisible. */
function fromCode(raw){
  var s = String(raw || "").trim();
  var m = s.match(/YEITA-(EC1|EC2)\.([A-Za-z0-9\-_]+)/);
  if(!m) throw new Error("Ce n'est pas un code EC1 ou EC2.");
  var part = m[1].toLowerCase(), o;
  try{ o = YEITA.b64d(m[2]); }catch(e){ throw new Error("Code incomplet : recopie-le en entier depuis la page Notion du candidat."); }
  if(o && o.v === 2 && o[part]) return {part: part, id: o.id || null, nom: o.nom || "", role: o.role || "PM", data: fill(o[part], part === "ec1" ? emptyEC1() : emptyEC2())};
  /* Anciens codes (octobre 2026) : seulement ce qui allait sur la carte. */
  if(part === "ec1"){
    var L = YEITA.readEC1(s); if(!L) throw new Error("Code EC1 illisible.");
    var e1 = emptyEC1(), k = (L.p && L.p !== "partial") ? L.p.split("|") : [null, null];
    e1.date = L.d || ""; e1.recruteur = L.par || ""; e1.percu = L.def || "";
    e1.match = {dominante: k[0], seconde: k[1], partielle: L.p === "partial", pourquoi: L.why || "", source: "code"};
    var ids = window.YEITA_MATCH ? YEITA_MATCH.VALUES.map(function(v){ return v.id; }) : [];
    (L.v || []).forEach(function(t, i){ if(ids[i] && t) e1.valeurs[ids[i]] = t; });
    return {part: "ec1", id: null, nom: L.n || "", role: "PM", data: e1};
  }
  var R = YEITA.readEC2(s); if(!R) throw new Error("Code EC2 illisible.");
  var e2 = emptyEC2(); e2.date = R.d || ""; e2.pair = R.par || ""; e2.role = R.role || "PM"; e2.palier = R.tier; e2.notes = R.steps;
  return {part: "ec2", id: null, nom: R.n || "", role: e2.role, data: e2};
}
/* Range le contenu d'un code dans le dossier correspondant (même identifiant, sinon même nom, sinon nouveau). */
function importCode(raw){
  var c;
  try{ c = fromCode(raw); }catch(e){ return Promise.reject(e); }
  var nom = c.nom || "Candidat sans nom";
  return (c.id ? adapter.get(c.id) : Promise.resolve(null))
    .then(function(d){ return d || findByName(nom); })
    .then(function(d){
      if(!d){ d = blank(nom); if(c.id) d.id = c.id; }
      d[c.part] = c.data;
      if(c.part === "ec2"){ d.candidat.role = c.role; if(d.restitution.etat === "ec1") d.restitution.etat = "ec2"; }
      return adapter.put(touch(d));
    })
    .then(function(d){ setCurrent(d.id); return {dossier: d, part: c.part}; });
}

window.DOSSIER = {
  SCHEMA: SCHEMA, VERSION: VERSION, DIAM_LEVELS: DIAM_LEVELS,
  use: function(a){ adapter = a; },
  adapter: function(){ return adapter; },
  emptyEC1: emptyEC1, emptyEC2: emptyEC2, norm: norm,
  list: function(){ return adapter.list(); },
  get: function(id){ return adapter.get(id); },
  remove: function(id){ if(currentId() === id && window.YEITA) YEITA.store.del(CUR); return adapter.remove(id); },
  current: current, setCurrent: setCurrent, findByName: findByName,
  report: report, setRestitution: setRestitution,
  toCode: toCode, fromCode: fromCode, importCode: importCode
};
})();
