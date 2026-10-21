/* Le dossier candidat : une seule structure pour tout ce que le recrutement produit.
   Le module Candidatures y range l'identité et le parcours ; les fiches #1 et #2 y reportent leur lecture ;
   la carte d'identité la lit.

   Version 2 (octobre 2026) : le dossier v1 (lecture EC1, EC2, restitution) devient un candidat complet
   (identité, parcours, appel, passations, EC3, décision, historique). Un dossier v1 est migré à la lecture.

   Aujourd'hui, le dossier vit dans le navigateur (stockage local, avec repli en mémoire si le navigateur refuse).
   Demain, une base partagée prendra le relais : il suffira de remplacer l'adaptateur de stockage
   (DOSSIER.use(adaptateur)) par un adaptateur qui parle à la base, avec la même interface en promesses :
   list(), get(id), put(dossier), remove(id). Voir STORAGE.md, docs/modele-de-donnees.md et docs/backend/.

   En attendant, les codes YEITA-EC1 / YEITA-EC2 et l'export JSON du module Candidatures
   restent les moyens de passer d'un ordinateur à l'autre. */
(function(){
"use strict";
var SCHEMA = "yeita-dossier-candidat", VERSION = 2;
var KEY = "yeita-dossiers", CUR = "yeita-dossier-courant";
var DIAM_LEVELS = ["Fort", "À creuser", "Absent", "Non vu"];
var ETAPES = ["appel", "ec1", "passation-ec1", "ec2", "passation-ec2", "ec3", "decision", "onboarding"];

function now(){ return new Date().toISOString(); }
function uid(){ return "cand-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7); }
/* Nom normalisé pour retrouver un dossier : minuscules, sans accents ni espaces en trop. */
function norm(s){ return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

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
function emptyIdentite(){ return {prenom: "", nom: "", email: "", telephone: "", provenance: "autre", provenanceDetail: "", poste: "PM"}; }
function emptyAppel(){ return {date: "", par: "", blocs: {parcours: "", recherche: "", cadre: "", conditions: ""}, onePager: {envoyeLe: null, par: ""}}; }
/* Le modèle v2 complet. ec1 et ec2 restent à null tant que les fiches n'ont rien reporté. */
function model(){
  return {schema: SCHEMA, version: VERSION, id: "",
    candidat: {nom: "", role: "PM"},
    identite: emptyIdentite(),
    parcours: {etape: "appel", etapes: {}, cloture: null},
    appel: emptyAppel(),
    ec1: null, ec2: null,
    fiches: {},
    passations: {ec1: null, ec2: null},
    ec3: {notes: "", par: "", le: null},
    decision: {appelFaitLe: null, par: ""},
    restitution: {etat: "ec1"},
    historique: [],
    notesLibres: {},
    meta: {creeLe: "", modifieLe: "", demo: false, origine: "module"}};
}
function blank(nom){
  var d = model();
  d.id = uid(); d.meta.creeLe = d.meta.modifieLe = now();
  setNom(d, nom || "");
  return d;
}
/* Complète un objet avec les clés manquantes d'un modèle (reprise de données anciennes). */
function fill(obj, mdl){
  if(!obj || typeof obj !== "object") return mdl;
  Object.keys(mdl).forEach(function(k){
    if(obj[k] === undefined) obj[k] = mdl[k];
    else if(mdl[k] && typeof mdl[k] === "object" && !Array.isArray(mdl[k]) && obj[k] && typeof obj[k] === "object") fill(obj[k], mdl[k]);
  });
  return obj;
}
/* Le nom affiché (candidat.nom) suit toujours le prénom et le nom de l'identité. */
function setNom(d, full){
  var parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  d.identite.prenom = parts.shift() || "";
  d.identite.nom = parts.join(" ");
  d.candidat.nom = String(full || "").trim();
}
function syncNom(d){
  var full = [d.identite.prenom, d.identite.nom].map(function(x){ return String(x || "").trim(); }).filter(Boolean).join(" ");
  if(full) d.candidat.nom = full;
  d.candidat.role = d.identite.poste || d.candidat.role || "PM";
}
/* Migration v1 → v2 : on garde tout, on déduit l'étape de ce qui a été reporté. */
function upgrade(d){
  if(!d || typeof d !== "object") return d;
  if(d.version === VERSION && d.identite && d.parcours) return fill(d, model());
  var v1 = !d.identite;
  fill(d, model());
  d.schema = SCHEMA; d.version = VERSION;
  if(v1){
    var nom = d.candidat && d.candidat.nom || "";
    var parts = nom.trim().split(/\s+/).filter(Boolean);
    d.identite.prenom = parts.shift() || ""; d.identite.nom = parts.join(" ");
    d.identite.poste = (d.candidat && d.candidat.role) || "PM";
    var etape = d.ec2 ? "passation-ec2" : (d.ec1 ? "passation-ec1" : "appel");
    d.parcours.etape = etape;
    d.meta.origine = "fiche";
    d.historique.push({de: null, vers: etape, le: (d.meta && d.meta.creeLe) || now(), par: "", motif: "Repris d'une fiche, avant le module Candidatures"});
  }
  return d;
}

/* ---------- Adaptateur de stockage : le navigateur, avec repli en mémoire ---------- */
var memory = null;   /* copie de secours quand le navigateur refuse d'enregistrer */
var LocalAdapter = {
  name: "navigateur",
  volatile: false,   /* vrai si les données ne survivront pas à la fermeture de l'onglet */
  _all: function(){
    if(memory) return memory;
    return (window.YEITA && YEITA.store.get(KEY, {})) || {};
  },
  _save: function(all){
    var ok = window.YEITA ? YEITA.store.set(KEY, all) : false;
    if(!ok){ memory = all; this.volatile = true; } else if(memory){ memory = null; this.volatile = false; }
    return true;
  },
  list: function(){
    var a = this._all();
    return Promise.resolve(Object.keys(a).map(function(k){ return upgrade(a[k]); })
      .sort(function(x, y){ return (y.meta && y.meta.modifieLe || "").localeCompare(x.meta && x.meta.modifieLe || ""); }));
  },
  get: function(id){ var d = this._all()[id]; return Promise.resolve(d ? upgrade(d) : null); },
  put: function(d){ var a = this._all(); a[d.id] = d; this._save(a); return Promise.resolve(d); },
  remove: function(id){ var a = this._all(); delete a[id]; this._save(a); return Promise.resolve(); }
};
var adapter = LocalAdapter;

/* ---------- Dossier ---------- */
function touch(d){ d.meta = d.meta || {}; d.meta.modifieLe = now(); syncNom(d); return d; }
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
/* Reporte une partie (ec1 ou ec2) dans le dossier du candidat : retrouvé par son identifiant ou son nom, créé sinon.
   Le report ne change jamais l'étape du parcours : seul le module Candidatures fait avancer un candidat. */
function report(part, nom, data, id){
  if(part !== "ec1" && part !== "ec2") return Promise.reject(new Error("Partie inconnue : " + part));
  if(!norm(nom)) return Promise.reject(new Error("Indique le nom du candidat avant de reporter."));
  return (id ? adapter.get(id) : Promise.resolve(null))
    .then(function(d){ return d || findByName(nom); })
    .then(function(d){
      if(!d){
        d = blank(nom); d.meta.origine = "fiche";
        d.parcours.etape = part === "ec2" ? "passation-ec2" : "passation-ec1";
        d.historique.push({de: null, vers: d.parcours.etape, le: now(), par: "", motif: "Créé par le report de la fiche " + (part === "ec1" ? "#1" : "#2")});
      }
      if(!d.identite.prenom && !d.identite.nom) setNom(d, nom);
      if(part === "ec2" && data.role) d.identite.poste = data.role;
      d[part] = fill(clone(data), part === "ec1" ? emptyEC1() : emptyEC2());
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
/* Enregistre un dossier entier (utilisé par le module Candidatures et le mode candidat des fiches). */
function save(d){ return adapter.put(touch(upgrade(d))); }

/* ---------- Codes : le passage d'un ordinateur à l'autre, en attendant une base partagée ---------- */
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
      if(!d){
        d = blank(nom); if(c.id) d.id = c.id; d.meta.origine = "fiche";
        d.parcours.etape = c.part === "ec2" ? "passation-ec2" : "passation-ec1";
        d.historique.push({de: null, vers: d.parcours.etape, le: now(), par: "", motif: "Créé depuis un code " + c.part.toUpperCase()});
      }
      d[c.part] = c.data;
      if(c.part === "ec2"){ d.identite.poste = c.role; if(d.restitution.etat === "ec1") d.restitution.etat = "ec2"; }
      return adapter.put(touch(d));
    })
    .then(function(d){ setCurrent(d.id); return {dossier: d, part: c.part}; });
}

window.DOSSIER = {
  SCHEMA: SCHEMA, VERSION: VERSION, DIAM_LEVELS: DIAM_LEVELS, ETAPES: ETAPES, KEY: KEY,
  use: function(a){ adapter = a; },
  adapter: function(){ return adapter; },
  emptyEC1: emptyEC1, emptyEC2: emptyEC2, emptyIdentite: emptyIdentite, emptyAppel: emptyAppel, model: model, blank: blank, upgrade: upgrade,
  norm: norm, now: now, touch: touch,
  list: function(){ return adapter.list(); },
  get: function(id){ return adapter.get(id); },
  save: save,
  remove: function(id){ if(currentId() === id && window.YEITA) YEITA.store.del(CUR); return adapter.remove(id); },
  current: current, setCurrent: setCurrent, findByName: findByName,
  report: report, setRestitution: setRestitution,
  toCode: toCode, fromCode: fromCode, importCode: importCode
};
})();
