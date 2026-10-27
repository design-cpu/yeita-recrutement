/* Le module Candidatures : les règles du parcours, au-dessus du dossier candidat (assets/dossier.js, v3).
   Ce fichier ne parle jamais au stockage directement : il passe par l'adaptateur du dossier (list, get, put, remove).
   Le jour où SQLite est branché, on change l'adaptateur, pas ce fichier.

   Règles :
   - une carte avance seulement par les actions de son étape (jamais par glisser-déposer) ;
   - l'État (À planifier, Planifié, Fait…) se change à la main ; en entrant dans une étape, il repart à « À planifier » ;
   - « Non retenu » passe par l'appel de refus : motif obligatoire.

   Données fictives uniquement tant que le déploiement sécurisé n'est pas en place. */
(function(){
"use strict";
var D = window.DOSSIER;
var ETAPES = D.ETAPES;           /* appel → ec1 → bilan-ec1 → ec2 → bilan-ec2 → ec3 → decision → proposition | go-mission → onboarding */
var NON_RETENU = "non-retenu", VIVIER = "vivier";
/* Les colonnes du tableau. Les trois dernières sont masquées par défaut (« Afficher plus »).
   Emplacement prévu, non construit : une colonne « sourcing » avant l'appel (candidatures LinkedIn, WTTJ, cooptations). */
var COLONNES = ["appel", "ec1", "bilan-ec1", "ec2", "bilan-ec2", "ec3", "decision", "proposition", "onboarding"];
var COLONNES_MASQUEES = ["go-mission", VIVIER, NON_RETENU];
/* Les seuls passages par l'action principale de l'étape. La décision et l'arrivée ont leurs propres actions. */
var SUIVANTE = {"appel": "ec1", "ec1": "bilan-ec1", "bilan-ec1": "ec2", "ec2": "bilan-ec2", "bilan-ec2": "ec3", "ec3": "decision",
  "proposition": "onboarding", "go-mission": "onboarding"};
var REFUS_DEPUIS = ["appel", "bilan-ec1", "bilan-ec2", "decision", "proposition", "go-mission"];
var DECISIONS = ["proposition", "go-mission", VIVIER, NON_RETENU];
var MOTIFS = [
  ["salaire", "Salaire hors grille"],
  ["localisation", "Localisation ou présentiel"],
  ["poste", "Type de poste"],
  ["projets", "Projets disponibles"],
  ["niveau", "Niveau ou expérience"],
  ["posture", "Posture"],
  ["anglais", "Anglais"],
  ["desistement", "La personne se retire"],
  ["autre", "Autre raison"]
];
var EXPORT_SCHEMA = "yeita-candidatures";
var EXPORT_KEY = "yeita-dernier-export", DISPO_KEY = "yeita-options-disponibilite";

function err(msg){ return Promise.reject(new Error(msg)); }
function motifLabel(id){ var m = MOTIFS.filter(function(x){ return x[0] === id; })[0]; return m ? m[1] : (id || ""); }
function validEmail(s){ return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim()); }
function today(){ return D.now().slice(0, 10); }
function uniq(a){ var o = []; (a || []).forEach(function(x){ x = String(x || "").trim(); if(x && o.indexOf(x) < 0) o.push(x); }); return o; }

/* Qui fait l'action : délégué à assets/qui.js (remplacé plus tard par l'identité Google). */
function me(){ return window.QUI ? QUI.moi() : ""; }
function setMe(n){ if(window.QUI) QUI.choisir(n); }

/* ---------- Lecture ---------- */
function listCandidates(filtre){
  return D.list().then(function(all){
    if(!filtre) return all;
    var q = D.norm(filtre.q || "");
    return all.filter(function(c){
      if(filtre.etape && c.parcours.etape !== filtre.etape) return false;
      if(q && D.norm(c.candidat.nom + " " + c.identite.email).indexOf(q) < 0) return false;
      return true;
    });
  });
}
function getCandidate(id){ return D.get(id); }

/* ---------- La fiche ---------- */
/* Contrôle commun à l'ajout et à la modification. Rend un message, ou null si tout va bien. */
function checkFiche(f){
  if(!String(f.personne || "").trim()) return "Indique le nom et le prénom.";
  if(!validEmail(f.email)) return "L'adresse e-mail doit contenir un @ et un domaine.";
  if(f.xp !== null && f.xp !== undefined && f.xp !== "" && !(Number(f.xp) >= 0 && Number(f.xp) < 60)) return "L'expérience se compte en années : un nombre entre 0 et 59.";
  return null;
}
function normFiche(f){
  var o = Object.assign({}, f);
  o.personne = String(o.personne || "").trim();
  o.email = String(o.email || "").trim();
  o.telephone = String(o.telephone || "").trim();
  o.xp = (o.xp === "" || o.xp === null || o.xp === undefined) ? null : Math.round(Number(o.xp) * 10) / 10;
  o.provenances = uniq(o.provenances);
  o.recruteurs = uniq(o.recruteurs);
  if(o.job && D.JOBS.indexOf(o.job) < 0) o.job = "PM / PO";
  return o;
}
function createCandidate(fiche, par){
  fiche = fiche || {};
  var e = checkFiche(fiche); if(e) return err(e);
  var f = normFiche(fiche);
  var c = D.blank(f.personne);
  c.identite = Object.assign(D.emptyIdentite(), f);
  if(!c.identite.dateDebutProcess) c.identite.dateDebutProcess = today();
  if(!c.identite.recruteurs.length && (par || me())) c.identite.recruteurs = [par || me()];
  c.meta.origine = "module";
  c.historique.push({de: null, vers: "appel", le: D.now(), par: par || me(), motif: "Candidature ajoutée"});
  return D.save(c);
}
/* Enregistre une fiche modifiée (bloc « Infos candidat »). */
function updateFiche(id, patch){
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var f = Object.assign({}, c.identite, patch);
    var e = checkFiche(f); if(e) return err(e);
    c.identite = Object.assign(c.identite, normFiche(f));
    return D.save(c);
  });
}
function saveCandidate(c){ return D.save(c); }
function removeCandidate(id){ return D.remove(id); }

/* Les options de disponibilité : la liste Notion, plus celles ajoutées. Les ajouts viennent de ce navigateur, ou d'une
   autre source posée par assets/demarrage.js (l'API en mode serveur, la mémoire de la page pendant le démarrage). */
var sourceAjouts = null;
function ajoutsLocaux(){ return (window.YEITA && YEITA.store.get(DISPO_KEY, [])) || []; }
function dispos(){
  return uniq(D.DISPOS.concat(sourceAjouts ? sourceAjouts.ajouts() : ajoutsLocaux()));
}
function addDispo(label){
  label = String(label || "").trim(); if(!label) return dispos();
  if(dispos().indexOf(label) < 0){
    if(sourceAjouts) sourceAjouts.ajouter(label);
    else if(window.YEITA){ var ajout = ajoutsLocaux(); ajout.push(label); YEITA.store.set(DISPO_KEY, ajout); }
  }
  return dispos();
}
function sourceDispos(src){ sourceAjouts = src || null; }

/* ---------- L'État, changé à la main ---------- */
function setEtat(id, etat, par){
  if(D.ETATS.indexOf(etat) < 0) return err("État inconnu.");
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    if(c.etat === etat) return c;
    c.historique.push({type: "etat", de: c.etat, vers: etat, le: D.now(), par: par || me(), motif: ""});
    c.etat = etat;
    return D.save(c);
  });
}

/* ---------- Le parcours ---------- */
/* « Démarrer » : la première ouverture de l'étape en cours. */
function startStep(id, par){
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var e = c.parcours.etape; if(e === NON_RETENU) return c;
    var s = c.parcours.etapes[e] = c.parcours.etapes[e] || {};
    if(!s.debuteLe){ s.debuteLe = D.now(); s.par = par || me(); }
    if(e === "appel"){ if(!c.appel.date) c.appel.date = today(); if(!c.appel.par) c.appel.par = par || me(); }
    return D.save(c);
  });
}
function started(c){ var s = c.parcours.etapes[c.parcours.etape]; return !!(s && s.debuteLe); }

/* Ce qui manque pour l'action principale de l'étape, ou null. */
function blocker(c){
  var e = c.parcours.etape;
  if(e === NON_RETENU || e === "onboarding") return "Le parcours est terminé.";
  if(e === VIVIER) return "La personne est au vivier.";
  if(e === "decision") return "Choisis une décision.";
  if(e === "appel" && !(c.appel.onePager && c.appel.onePager.envoyeLe)) return "Envoie le one-pager avant de passer à l'EC1.";
  return null;
}
function entre(c, de, vers, par, motif, type){
  var s = c.parcours.etapes[de] = c.parcours.etapes[de] || {};
  s.termineLe = D.now(); if(!s.debuteLe) s.debuteLe = s.termineLe;
  c.parcours.etape = vers;
  c.parcours.etapes[vers] = c.parcours.etapes[vers] || {};
  var avant = c.etat;
  c.etat = vers === "onboarding" ? "valide" : (vers === NON_RETENU ? "non-retenu" : "a-planifier");
  if(vers === "bilan-ec2" || vers === "ec3" || vers === "decision") c.restitution.etat = c.restitution.etat === "hire" ? "hire" : "ec2";
  if(vers === "onboarding"){ c.restitution.etat = "hire"; c.arrivee = {confirmeeLe: D.now(), par: par || me()}; }
  c.historique.push({type: type || "passage", de: de, vers: vers, le: D.now(), par: par || me(), motif: motif || "", etatAvant: avant});
}
/* L'action principale de l'étape : EC1 → Bilan EC1, « Continuer », « Envoyer en décision », « Arrivée confirmée »… */
function moveStep(id, opts){
  opts = opts || {};
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var de = c.parcours.etape, vers = opts.vers || SUIVANTE[de];
    var b = blocker(c); if(b) return err(b);
    if(!vers || SUIVANTE[de] !== vers) return err("Ce passage n'est pas possible : on avance d'une étape à la fois.");
    if(de === "bilan-ec1" || de === "bilan-ec2"){
      var k = de === "bilan-ec1" ? "ec1" : "ec2";
      var bl = c.bilans[k] = Object.assign({}, c.bilans[k] || {}, {faitLe: D.now(), par: opts.par || me(), issue: "continuer"});
      if(opts.mode) bl.mode = opts.mode; if(!bl.mode) bl.mode = "appel";
    }
    entre(c, de, vers, opts.par, opts.motif);
    return D.save(c);
  });
}
/* Bilan : « Mettre en attente (retour à faire) ». La carte reste dans sa colonne, l'État passe à « Retour à faire ». */
function bilanRetour(id, opts){
  opts = opts || {};
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var e = c.parcours.etape;
    if(e !== "bilan-ec1" && e !== "bilan-ec2") return err("« Retour à faire » se décide au bilan.");
    var k = e === "bilan-ec1" ? "ec1" : "ec2";
    c.bilans[k] = Object.assign({}, c.bilans[k] || {}, {issue: "retour-a-faire", par: opts.par || me(), le: D.now()});
    if(opts.mode) c.bilans[k].mode = opts.mode;
    c.historique.push({type: "etat", de: c.etat, vers: "retour-a-faire", le: D.now(), par: opts.par || me(), motif: "Mis en attente au bilan"});
    c.etat = "retour-a-faire";
    return D.save(c);
  });
}
/* La décision : proposition d'embauche, go sur mission, vivier ou non retenu, avec un commentaire court (le « CR final » de Notion).
   « Non retenu » passe par closeCandidate : c'est l'appel de refus qui confirme, avec son motif. */
function decide(id, opts){
  opts = opts || {};
  var choix = opts.choix, com = String(opts.commentaire || "").trim();
  if(DECISIONS.indexOf(choix) < 0) return err("Choisis une décision.");
  if(!com) return err("Ajoute un commentaire court : il reste dans le dossier.");
  if(choix === NON_RETENU) return closeCandidate(id, Object.assign({}, opts, {decision: com}));
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    if(c.parcours.etape !== "decision") return err("La décision se prend à l'étape Décision.");
    c.decision = Object.assign({}, c.decision, {choix: choix, commentaire: com, le: D.now(), par: opts.par || me()});
    entre(c, "decision", choix, opts.par, com, "decision");
    return D.save(c);
  });
}
/* « Non retenu » se confirme dans l'appel de refus : motif obligatoire, la carte passe dans la colonne Non retenu. */
function closeCandidate(id, opts){
  opts = opts || {};
  if(!opts.motif) return err("Choisis le motif de clôture.");
  if(opts.motif === "autre" && !String(opts.detail || "").trim()) return err("Précise la raison en une phrase.");
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var de = c.parcours.etape;
    if(REFUS_DEPUIS.indexOf(de) < 0) return err(de === "ec3" ? "Pas de refus en EC3 : on envoie en décision, et c'est la décision qui tranche."
      : (de === "ec1" || de === "ec2" ? "Le non se décide au bilan : passe d'abord au bilan." : "On ne peut pas clore le parcours à cette étape."));
    var detail = String(opts.detail || "").trim();
    if(de === "decision") c.decision = Object.assign({}, c.decision, {choix: NON_RETENU, commentaire: opts.decision || detail, le: D.now(), par: opts.par || me()});
    if(de === "bilan-ec1" || de === "bilan-ec2"){ var k = de === "bilan-ec1" ? "ec1" : "ec2"; c.bilans[k] = Object.assign({}, c.bilans[k] || {}, {issue: "non-retenu", faitLe: D.now(), par: opts.par || me()}); }
    c.parcours.cloture = {depuis: de, motif: opts.motif, detail: detail, carteEnvoyee: !!opts.carteEnvoyee, le: D.now(), par: opts.par || me()};
    c.restitution.etat = (de === "appel" || de === "bilan-ec1") ? "ec1" : "ec2";
    entre(c, de, NON_RETENU, opts.par, motifLabel(opts.motif) + (detail ? " : " + detail : ""), "refus");
    return D.save(c);
  });
}
/* Annuler le dernier passage (un clic de trop). La correction reste dans l'historique. Les changements d'État ne s'annulent pas ici. */
function undoLast(id, par){
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var h = c.historique, last = null;
    for(var i = h.length - 1; i >= 0; i--){ if(h[i].type !== "etat"){ last = h[i]; break; } }
    if(!last || last.de === null || last.annulation) return err("Il n'y a pas de passage à annuler.");
    var cur = c.parcours.etape;
    if(cur !== last.vers) return err("Le dernier passage ne correspond plus à l'étape en cours.");
    c.parcours.etape = last.de;
    if(cur === NON_RETENU) c.parcours.cloture = null;
    if(cur === "onboarding"){ c.arrivee = {confirmeeLe: null, par: ""}; if(c.restitution.etat === "hire") c.restitution.etat = "ec2"; }
    if(last.type === "decision" || (cur === NON_RETENU && last.de === "decision")) c.decision = Object.assign({}, c.decision, {choix: null, commentaire: "", le: null});
    var s = c.parcours.etapes[last.de]; if(s) delete s.termineLe;
    c.etat = last.etatAvant || "a-planifier";
    h.push({de: cur, vers: last.de, le: D.now(), par: par || me(), motif: "Annulation du dernier passage", annulation: true});
    return D.save(c);
  });
}

/* Jours ouvrés écoulés depuis l'entrée dans l'étape. */
function joursOuvres(fromIso, toDate){
  if(!fromIso) return 0;
  var d = new Date(fromIso), end = toDate || new Date(), n = 0;
  d.setHours(12,0,0,0); var e = new Date(end); e.setHours(12,0,0,0);
  while(d < e){ d.setDate(d.getDate() + 1); var wd = d.getDay(); if(wd !== 0 && wd !== 6) n++; }
  return n;
}
function enteredStepAt(c){
  for(var i = c.historique.length - 1; i >= 0; i--){ if(c.historique[i].type !== "etat" && c.historique[i].vers === c.parcours.etape) return c.historique[i].le; }
  return c.meta.creeLe;
}
function waiting(c){ var e = c.parcours.etape; return (e === NON_RETENU || e === "onboarding" || e === VIVIER) ? 0 : joursOuvres(enteredStepAt(c)); }

/* ---------- Export, import ---------- */
function exportAll(){
  return D.list().then(function(all){
    var out = {schema: EXPORT_SCHEMA, version: D.VERSION, exporteLe: D.now(), candidats: all};
    if(window.YEITA) YEITA.store.set(EXPORT_KEY, out.exporteLe);
    return JSON.stringify(out, null, 2);
  });
}
function lastExport(){ return (window.YEITA && YEITA.store.get(EXPORT_KEY, null)) || null; }
/* « fusion » : on garde, pour chaque candidat, la version la plus récente. « remplacement » : la base importée remplace tout. */
function importAll(text, mode){
  var o;
  try{ o = typeof text === "string" ? JSON.parse(text) : text; }catch(e){ return err("Ce fichier n'est pas un export JSON lisible."); }
  if(!o || o.schema !== EXPORT_SCHEMA || !Array.isArray(o.candidats)) return err("Ce fichier n'est pas un export du module Candidatures.");
  var res = {ajoutes: 0, misAJour: 0, ignores: 0};
  return D.list().then(function(all){
    var byId = {}; all.forEach(function(c){ byId[c.id] = c; });
    var removals = mode === "remplacement" ? all.filter(function(c){ return !o.candidats.some(function(n){ return n.id === c.id; }); }).map(function(c){ return D.remove(c.id); }) : [];
    return Promise.all(removals).then(function(){
      return o.candidats.reduce(function(p, raw){
        return p.then(function(){
          if(!raw || !raw.id) { res.ignores++; return; }
          var c = D.upgrade(raw), old = byId[c.id];
          if(old && mode !== "remplacement" && (old.meta.modifieLe || "") >= (c.meta.modifieLe || "")){ res.ignores++; return; }
          if(old) res.misAJour++; else res.ajoutes++;
          return D.adapter().put(c);
        });
      }, Promise.resolve());
    });
  }).then(function(){ return res; });
}

/* ---------- Exemples fictifs, pour les démos ----------
   Noms inventés, adresses en @example.com, numéros de la plage fictive 01 99 00. */
function daysAgo(n){ var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function loadDemo(){
  var P = me() || "Thélo";
  var specs = [
    {n:"BERNARD Inès", job:"PM / PO", xp:6, dispo:"Immédiatement", prov:["LinkedIn"], rec:["Peter"], etape:"appel", etat:"planifie", age:1},
    {n:"Hugo Petit", job:"PM / PO", xp:8, dispo:"2 mois", prov:["WTTJ"], rec:["Thélo", "Pauline"], etape:"ec3", etat:"planifie", age:1, onePager:true, ec1:true, ec2:true, ville:"Paris 11e",
     rep:{recherche:"Un rôle de PM avec de la stratégie, en B2C.", pourquoi:"Fin de mission dans une néobanque, veut changer de secteur.", role:"PM d'une équipe de six : discovery, priorisation, suivi des indicateurs.", ia:"Tous les jours depuis un an : synthèses d'entretiens, rédaction de user stories.", remuneration:"Vise 55 k€."}},
    {n:"Maëlle DURAND", job:"PrD", xp:4, dispo:"1 mois", prov:["Cooptation"], rec:["Andrea"], etape:"ec1", etat:"planifie", age:2, onePager:true},
    {n:"Yanis Morel", job:"PM / PO", xp:3, dispo:"Intercontrat", prov:["LinkedIn"], rec:["Peter"], etape:"bilan-ec1", etat:"retour-a-faire", age:9, onePager:true, ec1:true},
    {n:"Chloé Lemaire", job:"Ops", xp:5, dispo:"3 mois", prov:["WTTJ"], rec:["Thélo"], etape:NON_RETENU, from:"appel", motif:"localisation", detail:"Ne peut pas venir à Paris trois jours par semaine.", age:4},
    {n:"Nora Haddad", job:"PrD", xp:7, dispo:"Septembre", prov:["Chasse"], rec:["Andrea", "Pauline"], etape:VIVIER, age:12, onePager:true, ec1:true, ec2:true, decision:"On s'entend bien, pas tout de suite : à recontacter en septembre."}
  ];
  return Promise.all(specs.map(function(s, i){
    var c = D.blank(s.n);
    var em = D.decoupe(s.n);
    c.identite = Object.assign(D.emptyIdentite(), {personne: s.n, job: s.job, xp: s.xp, disponibilite: s.dispo, provenances: s.prov, recruteurs: s.rec,
      email: (em.prenom + "." + em.nom).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-") + "@example.com",
      telephone: "01 99 00 0" + (i + 1) + " " + (10 + i * 7), adresse: s.ville || "", dateDebutProcess: daysAgo(s.age + 2).slice(0, 10)});
    D.setNom(c, s.n);
    c.meta.demo = true; c.meta.creeLe = daysAgo(s.age + 2);
    c.historique.push({de: null, vers: "appel", le: daysAgo(s.age + 2), par: P, motif: "Candidature ajoutée (exemple)"});
    if(s.rep){ Object.assign(c.appel.reponses, s.rep); c.appel.date = daysAgo(s.age + 2).slice(0, 10); c.appel.par = P; }
    if(s.onePager) c.appel.onePager = {envoyeLe: daysAgo(s.age + 1), par: P};
    var fin = s.etape === NON_RETENU ? s.from : (s.etape === VIVIER ? "decision" : s.etape);
    var path = ETAPES.slice(0, ETAPES.indexOf(fin) + 1);
    path.forEach(function(e, k){
      c.parcours.etapes[e] = {debuteLe: daysAgo(s.age + 2 - k * 0.2), par: P};
      if(k < path.length - 1){ c.parcours.etapes[e].termineLe = daysAgo(s.age + 1); c.historique.push({type: "passage", de: e, vers: path[k + 1], le: daysAgo(s.age + 1), par: P, motif: ""}); }
    });
    c.parcours.etape = fin;
    if(s.ec1){
      c.ec1 = Object.assign(D.emptyEC1(), {date: daysAgo(s.age + 1).slice(0, 10), recruteur: P, observateur: "Peter",
        match: {dominante: "collectif", seconde: "sans-chichi", partielle: false, pourquoi: "", source: "decompte"},
        percu: "Tu poses les questions avant de proposer, et tu cites l'équipe avant toi.",
        questionsEC2: "Ce qu'il a mesuré après la mise en production.\nSa façon de dire non à un sponsor.", reporteLe: daysAgo(s.age + 1)});
      c.bilans.ec1 = c.parcours.etape === "bilan-ec1" ? {faitLe: null, par: P, mode: "appel", issue: "retour-a-faire", le: daysAgo(s.age)} : {faitLe: daysAgo(s.age + 1), par: P, mode: "appel", issue: "continuer"};
    }
    if(s.ec2){
      c.ec2 = Object.assign(D.emptyEC2(), {date: daysAgo(s.age + 1).slice(0, 10), pair: "Andrea", role: D.roleDe(s.job), palier: 2,
        notes: [3,3,2, 3,2,2, 2,3,2, 2,1,null],
        exemples: ["A chiffré le coût de l'abandon à l'onboarding avant de proposer quoi que ce soit.", "", "", "A recruté des testeurs via le support quand l'accès direct était bloqué.", "", "", "", "A tenu une revue de lancement avec la conformité.", "", "", "", ""],
        lecture: "", aspirations: "Veut apprendre à cadrer une stratégie produit. Préfère un binôme les premières semaines.",
        suspens: {palier: "J'apporte de l'impact, " + (s.job === "PrD" ? "Product Designer." : "Product Manager."), solides: "Problème et Solution : des exemples précis, chiffrés.", creux: "Stratégie : peu d'occasions de la pratiquer jusqu'ici.",
          questions: "Son envie réelle de cadrer la stratégie, ou de rester près de l'équipe\nCe qu'il attend du binôme les premières semaines", contestation: "Se voit plus avancé sur la stratégie que ce que la fiche #2 montre.", conditions: "Prétentions à placer dans la grille. Disponible dans deux mois."},
        reporteLe: daysAgo(s.age + 1)});
      c.bilans.ec2 = {faitLe: daysAgo(s.age), par: "Andrea", mode: "asynchrone", issue: "continuer"};
      c.restitution.etat = "ec2";
    }
    c.etat = s.etat || "a-planifier";
    if(s.etape === NON_RETENU){
      c.parcours.cloture = {depuis: s.from, motif: s.motif, detail: s.detail, carteEnvoyee: false, le: daysAgo(s.age), par: P};
      c.historique.push({type: "refus", de: s.from, vers: NON_RETENU, le: daysAgo(s.age), par: P, motif: motifLabel(s.motif) + " : " + s.detail});
      c.parcours.etape = NON_RETENU; c.etat = "non-retenu";
    }
    if(s.etape === VIVIER){
      c.decision = {choix: VIVIER, commentaire: s.decision, le: daysAgo(s.age), par: "Pauline", appelFaitLe: daysAgo(s.age)};
      c.historique.push({type: "decision", de: "decision", vers: VIVIER, le: daysAgo(s.age), par: "Pauline", motif: s.decision});
      c.parcours.etape = VIVIER; c.etat = "fait";
    }
    c.meta.modifieLe = daysAgo(s.age);
    return D.adapter().put(c);
  }));
}
function clearDemo(){
  return D.list().then(function(all){ return Promise.all(all.filter(function(c){ return c.meta && c.meta.demo; }).map(function(c){ return D.remove(c.id); })); });
}

/* ---------- Palier suggéré en EC2, depuis le souhait de rémunération noté à l'appel (texte libre) ----------
   « 55 k€ », « 55 000 € », « entre 50 et 55k » (milieu de la fourchette), « 4 500 €/mois » (× 12). Le montant est placé dans la
   fourchette d'un palier (config.paliersSalaire) ; entre deux fourchettes, le palier le plus proche. Illisible : null. */
function montantSouhaite(texte){
  var s = String(texte || "").toLowerCase().replace(/(\d)[\s\u00a0\u202f.](?=\d{3}(?!\d))/g, "$1");
  var mois = /mois|mensuel|\/m\b/.test(s), k = /\d\s*k/.test(s), vals = [], re = /(\d+(?:,\d+)?)\s*(k)?/g, m;
  while((m = re.exec(s))){
    var v = parseFloat(m[1].replace(",", "."));
    if(m[2] || (k && v < 1000) || (!mois && v >= 20 && v < 1000)) v *= 1000;
    if(mois && v < 15000) v *= 12;
    if(v >= 15000 && v <= 300000) vals.push(v);
  }
  if(!vals.length) return null;
  return vals.length > 1 ? Math.round((vals[0] + vals[1]) / 2) : vals[0];
}
function palierSuggere(texte){
  var montant = montantSouhaite(texte), P = (window.YEITA_CONFIG && YEITA_CONFIG.paliersSalaire) || [];
  if(montant === null || !P.length) return null;
  var best = null, dist = Infinity;
  P.forEach(function(p){ var d = montant < p.min ? p.min - montant : (montant > p.max ? montant - p.max : 0); if(d < dist){ dist = d; best = p; } });
  return {palier: best.palier, montant: montant};
}

window.STORE = {
  ETAPES: ETAPES, NON_RETENU: NON_RETENU, VIVIER: VIVIER, COLONNES: COLONNES, COLONNES_MASQUEES: COLONNES_MASQUEES,
  SUIVANTE: SUIVANTE, REFUS_DEPUIS: REFUS_DEPUIS, DECISIONS: DECISIONS, MOTIFS: MOTIFS,
  motifLabel: motifLabel, validEmail: validEmail, checkFiche: checkFiche, normFiche: normFiche, me: me, setMe: setMe,
  listCandidates: listCandidates, getCandidate: getCandidate, createCandidate: createCandidate, updateFiche: updateFiche,
  saveCandidate: saveCandidate, removeCandidate: removeCandidate, dispos: dispos, addDispo: addDispo, sourceDispos: sourceDispos, setEtat: setEtat,
  startStep: startStep, started: started, blocker: blocker, moveStep: moveStep, bilanRetour: bilanRetour, decide: decide,
  closeCandidate: closeCandidate, undoLast: undoLast, waiting: waiting, joursOuvres: joursOuvres,
  exportAll: exportAll, importAll: importAll, lastExport: lastExport, loadDemo: loadDemo, clearDemo: clearDemo,
  palierSuggere: palierSuggere, montantSouhaite: montantSouhaite,
  volatile: function(){ return !!D.adapter().volatile; }
};
})();
