/* Le dossier candidat : une seule structure pour tout ce que le recrutement produit.
   Le module Candidatures y range la fiche du candidat (champs alignés sur la base Notion « Candidats ») et le parcours ;
   les fiches EC1 et EC2 y écrivent leur lecture ; la carte d'identité la lit.

   Version 3 (octobre 2026) : champs Notion (Personne, Job, XP, Disponibilité, Provenance multiple, Recruteurs…),
   État changé à la main, Bilans (ex-passations), Décision à quatre issues, Proposition, Go sur mission, Vivier.
   Un dossier v1 ou v2 est migré à la lecture : rien n'est supprimé. Détail des champs et de la migration : docs/backend/MODELE.md.

   Le stockage passe par un adaptateur à quatre méthodes en promesses : list(), get(id), put(dossier), remove(id).
   Aujourd'hui, le navigateur (avec repli en mémoire). Demain, SQLite côté serveur : DOSSIER.use(adaptateur), sans toucher aux pages. */
(function(){
"use strict";
var SCHEMA = "yeita-dossier-candidat", VERSION = 3;
var KEY = "yeita-dossiers", CUR = "yeita-dossier-courant";
var DIAM_LEVELS = ["Fort", "À creuser", "Absent", "Non vu"];
/* Les étapes du parcours, dans l'ordre. Vivier et Non retenu sont des sorties, hors du fil. */
var ETAPES = ["appel", "ec1", "bilan-ec1", "ec2", "bilan-ec2", "ec3", "decision", "proposition", "go-mission", "onboarding"];
var SORTIES = ["vivier", "non-retenu"];
/* Valeurs des listes, alignées sur la base Notion « Candidats » (libellés affichés : assets/wording.fr.js). */
var JOBS = ["PrD", "PM / PO", "Ops", "SM", "PMM", "UXR", "Bizdev", "RH", "Recruteur·se"];
var DISPOS = ["Intercontrat", "Immédiatement", "1 mois", "2 mois", "3 mois", "Septembre"];
var PROVENANCES = ["Cooptation", "WTTJ", "LinkedIn", "Chasse", "Candidature spontanée"];
var ETATS = ["a-planifier", "planifie", "fait", "retour-a-faire", "non-retenu", "valide", "plus-dispo"];
/* Les noms d'étapes de la v2, et leur équivalent v3. */
var RENOMMAGE = {"passation-ec1": "bilan-ec1", "passation-ec2": "bilan-ec2", "clos": "non-retenu"};

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
    date: "", pair: "", role: "PM", palier: 2, notesLibres: "",
    notes: [null,null,null, null,null,null, null,null,null, null,null,null],
    exemples: ["","","", "","","", "","","", "","",""],
    lecture: "", aspirations: "",
    suspens: {palier: "", solides: "", creux: "", questions: "", contestation: "", conditions: ""},
    reporteLe: null
  };
}
/* La fiche du candidat, champ pour champ comme dans Notion. prenom, nom et poste sont calculés (syncNom) : ne pas les saisir. */
function emptyIdentite(){
  return {personne: "", job: "PM / PO", xp: null, disponibilite: "", dateDisponibilite: "", dateDebutProcess: "",
    provenances: [], provenanceDetail: "", recruteurs: [],
    email: "", telephone: "", adresse: "", linkedin: "", portfolio: "", cv: "", references: "", syntheseEC: "",
    prenom: "", nom: "", poste: "PM"};
}
/* Les questions de l'appel de découverte (base Notion, section « Appel de Découverte »).
   La disponibilité et le lieu d'habitation s'écrivent directement dans la fiche (identite.disponibilite, identite.adresse). */
var QUESTIONS_APPEL = ["recherche", "pourquoi", "role", "ia", "yeita", "motivations", "disponibilite", "pistes", "remuneration"];
function emptyAppel(){
  var r = {}; QUESTIONS_APPEL.forEach(function(k){ r[k] = ""; });
  return {date: "", par: "", reponses: r, ancien: null, onePager: {envoyeLe: null, par: ""}};
}
/* Le modèle v3 complet. ec1 et ec2 restent à null tant que les fiches n'ont rien écrit. */
function model(){
  return {schema: SCHEMA, version: VERSION, id: "",
    candidat: {nom: "", role: "PM"},
    identite: emptyIdentite(),
    etat: "a-planifier",
    parcours: {etape: "appel", etapes: {}, cloture: null},
    appel: emptyAppel(),
    ec1: null, ec2: null,
    fiches: {},
    bilans: {ec1: null, ec2: null},
    ec3: {notes: "", par: "", le: null},
    decision: {choix: null, commentaire: "", le: null, par: "", appelFaitLe: null},
    arrivee: {confirmeeLe: null, par: ""},
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
/* « Nom Prénom » est un seul champ libre : on colle souvent « NOM Prénom ».
   Le prénom sert seulement à saluer (mail du one-pager) : les mots tout en capitales sont pris pour le nom,
   sinon le premier mot est le prénom. « GARNIER Léna » → Léna ; « Léna Garnier » → Léna. */
function decoupe(personne){
  var mots = String(personne || "").trim().split(/\s+/).filter(Boolean);
  var caps = function(m){ return m.length > 1 && /\p{L}/u.test(m) && m === m.toUpperCase() && m !== m.toLowerCase(); };
  var nomMots = mots.filter(caps), autres = mots.filter(function(m){ return !caps(m); });
  if(nomMots.length && autres.length) return {prenom: autres.join(" "), nom: nomMots.join(" ")};
  return {prenom: mots[0] || "", nom: mots.slice(1).join(" ")};
}
/* Le rôle des fiches EC2 et de la carte : Product Designer pour PrD, Product Manager pour le reste. */
function roleDe(job){ return job === "PrD" ? "PrD" : "PM"; }
function setNom(d, full){ d.identite.personne = String(full || "").trim(); syncNom(d); }
/* Les champs calculés suivent toujours la fiche : nom affiché, prénom, rôle. */
function syncNom(d){
  var i = d.identite, p = String(i.personne || "").trim();
  if(!p) p = [i.prenom, i.nom].map(function(x){ return String(x || "").trim(); }).filter(Boolean).join(" ");
  i.personne = p;
  var dn = decoupe(p); i.prenom = dn.prenom; i.nom = dn.nom;
  i.poste = roleDe(i.job);
  d.candidat.nom = p || d.candidat.nom || "";
  d.candidat.role = i.poste;
}
/* Migration à la lecture : v1 → v2 (identité, parcours), puis v2 → v3 (champs Notion, bilans, décision). Rien n'est supprimé. */
function upgrade(d){
  if(!d || typeof d !== "object") return d;
  if(d.version === VERSION && d.identite && d.parcours){ fill(d, model()); syncNom(d); return d; }
  var v1 = !d.identite, v2 = d.version === 2 && !v1;
  if(v1 || v2) versV3(d, v1);
  fill(d, model());
  d.schema = SCHEMA; d.version = VERSION;
  syncNom(d);
  return d;
}
function renomme(e){ return RENOMMAGE[e] || e; }
function versV3(d, v1){
  if(v1){
    var nomV1 = d.candidat && d.candidat.nom || "";
    d.identite = {personne: nomV1, job: d.candidat && d.candidat.role === "PrD" ? "PrD" : "PM / PO"};
    var etape = d.ec2 ? "bilan-ec2" : (d.ec1 ? "bilan-ec1" : "appel");
    d.parcours = {etape: etape, etapes: {}, cloture: null};
    d.meta = d.meta || {}; d.meta.origine = "fiche";
    d.historique = [{de: null, vers: etape, le: d.meta.creeLe || now(), par: "", motif: "Repris d'une fiche, avant le module Candidatures"}];
    return;
  }
  /* v2 → v3 */
  var i = d.identite || {};
  var personne = [i.prenom, i.nom].map(function(x){ return String(x || "").trim(); }).filter(Boolean).join(" ") || (d.candidat && d.candidat.nom) || "";
  var prov = [], det = String(i.provenanceDetail || "").trim(), nd = norm(det);
  if(i.provenance === "linkedin") prov = ["LinkedIn"];
  else if(i.provenance === "wttj") prov = ["WTTJ"];
  else if(/coopt/.test(nd)) prov = ["Cooptation"];
  else if(/chasse/.test(nd)) prov = ["Chasse"];
  else if(/spontan/.test(nd)) prov = ["Candidature spontanée"];
  var recruteurs = [];
  function ajoute(n){ n = String(n || "").trim(); if(n && recruteurs.indexOf(n) < 0) recruteurs.push(n); }
  ajoute(d.appel && d.appel.par); (d.historique || []).forEach(function(h){ ajoute(h.par); });
  d.identite = {personne: personne, job: i.poste === "PrD" ? "PrD" : "PM / PO", provenances: prov,
    provenanceDetail: prov.length ? "" : det, recruteurs: recruteurs,
    email: i.email || "", telephone: i.telephone || "",
    dateDebutProcess: String((d.meta && d.meta.creeLe) || now()).slice(0, 10)};
  var p = d.parcours || {etape: "appel", etapes: {}, cloture: null};
  p.etape = renomme(p.etape);
  var et = {}; Object.keys(p.etapes || {}).forEach(function(k){ et[renomme(k)] = p.etapes[k]; }); p.etapes = et;
  d.parcours = p;
  (d.historique || []).forEach(function(h){ if(h.de) h.de = renomme(h.de); if(h.vers) h.vers = renomme(h.vers); });
  var pa = d.passations || {};
  d.bilans = {ec1: pa.ec1 ? {faitLe: pa.ec1.faiteLe || null, par: pa.ec1.par || "", mode: pa.ec1.mode || "appel", issue: "continuer"} : null,
              ec2: pa.ec2 ? {faitLe: pa.ec2.faiteLe || null, par: pa.ec2.par || "", mode: pa.ec2.mode || "appel", issue: "continuer"} : null};
  delete d.passations;
  var a = d.appel || {}, blocs = a.blocs || {};
  var anc = Object.keys(blocs).some(function(k){ return String(blocs[k] || "").trim(); }) ? blocs : null;
  d.appel = {date: a.date || "", par: a.par || "", reponses: emptyAppel().reponses, ancien: anc, onePager: a.onePager || {envoyeLe: null, par: ""}};
  var dc = d.decision || {};
  d.decision = {choix: null, commentaire: "", le: null, par: dc.par || "", appelFaitLe: dc.appelFaitLe || null};
  d.arrivee = {confirmeeLe: null, par: ""};
  if(p.etape === "onboarding"){
    var dec = p.etapes.decision || {};
    d.decision.choix = "proposition"; d.decision.le = dec.termineLe || null;
    d.arrivee.confirmeeLe = dec.termineLe || null;
  }
  var s = p.etapes[p.etape] || {};
  d.etat = p.etape === "non-retenu" ? "non-retenu" : (p.etape === "onboarding" ? "valide" : (s.debuteLe ? "planifie" : "a-planifier"));
  d.meta = d.meta || {}; d.meta.migreV3Le = now();
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
        d.parcours.etape = part === "ec2" ? "bilan-ec2" : "bilan-ec1";
        d.historique.push({de: null, vers: d.parcours.etape, le: now(), par: "", motif: "Créé par le report de la fiche " + (part === "ec1" ? "#1" : "#2")});
      }
      if(!d.identite.personne) setNom(d, nom);
      if(part === "ec2" && data.role && roleDe(d.identite.job) !== data.role) d.identite.job = data.role === "PrD" ? "PrD" : "PM / PO";
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
        d.parcours.etape = c.part === "ec2" ? "bilan-ec2" : "bilan-ec1";
        d.historique.push({de: null, vers: d.parcours.etape, le: now(), par: "", motif: "Créé depuis un code " + c.part.toUpperCase()});
      }
      d[c.part] = c.data;
      if(c.part === "ec2"){ if(roleDe(d.identite.job) !== c.role) d.identite.job = c.role === "PrD" ? "PrD" : "PM / PO"; if(d.restitution.etat === "ec1") d.restitution.etat = "ec2"; }
      return adapter.put(touch(d));
    })
    .then(function(d){ setCurrent(d.id); return {dossier: d, part: c.part}; });
}

window.DOSSIER = {
  SCHEMA: SCHEMA, VERSION: VERSION, DIAM_LEVELS: DIAM_LEVELS, ETAPES: ETAPES, SORTIES: SORTIES, KEY: KEY,
  JOBS: JOBS, DISPOS: DISPOS, PROVENANCES: PROVENANCES, ETATS: ETATS, QUESTIONS_APPEL: QUESTIONS_APPEL,
  decoupe: decoupe, roleDe: roleDe, setNom: setNom,
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
