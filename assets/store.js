/* Le module Candidatures : la couche de stockage et la machine à états du parcours.
   S'appuie sur assets/dossier.js (un candidat = un dossier v2) et ne parle jamais au stockage directement :
   le jour où une base partagée est validée, on remplace l'adaptateur du dossier, pas ce fichier.

   Données fictives uniquement tant que le stockage n'est pas validé (voir STORAGE.md). */
(function(){
"use strict";
var D = window.DOSSIER;
var ETAPES = D.ETAPES;                    /* appel → ec1 → passation-ec1 → ec2 → passation-ec2 → ec3 → decision → onboarding */
var CLOS = "clos";
/* Les seuls passages possibles. Tout le reste est refusé : on ne saute pas un débrief. */
var SUIVANTE = {"appel":"ec1", "ec1":"passation-ec1", "passation-ec1":"ec2", "ec2":"passation-ec2", "passation-ec2":"ec3", "ec3":"decision", "decision":"onboarding"};
var REFUS_DEPUIS = ["appel", "ec1", "ec2", "decision"];
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
var PROVENANCES = [["linkedin", "LinkedIn"], ["wttj", "Welcome to the Jungle"], ["autre", "Autre"]];
var EXPORT_SCHEMA = "yeita-candidatures";
var ME_KEY = "yeita-recruteur", EXPORT_KEY = "yeita-dernier-export";

function err(msg){ return Promise.reject(new Error(msg)); }
function idx(e){ return ETAPES.indexOf(e); }
function motifLabel(id){ var m = MOTIFS.filter(function(x){ return x[0] === id; })[0]; return m ? m[1] : (id || ""); }
function provLabel(id){ var p = PROVENANCES.filter(function(x){ return x[0] === id; })[0]; return p ? p[1] : (id || "Autre"); }
function validEmail(s){ return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

/* Qui fait l'action : un simple prénom, mémorisé dans ce navigateur (pas de comptes dans le MVP). */
function me(){ return (window.YEITA && YEITA.store.get(ME_KEY, "")) || ""; }
function setMe(n){ if(window.YEITA) YEITA.store.set(ME_KEY, String(n || "").trim()); }

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

/* ---------- Écriture ---------- */
function createCandidate(identite, par){
  identite = identite || {};
  var prenom = String(identite.prenom || "").trim(), nom = String(identite.nom || "").trim();
  if(!prenom || !nom) return err("Indique le prénom et le nom.");
  if(!validEmail(identite.email)) return err("L'adresse e-mail doit contenir un @ et un domaine.");
  var c = D.blank(prenom + " " + nom);
  c.identite = Object.assign(D.emptyIdentite(), identite, {prenom: prenom, nom: nom, email: String(identite.email || "").trim(), telephone: String(identite.telephone || "").trim()});
  c.meta.origine = "module";
  c.historique.push({de: null, vers: "appel", le: D.now(), par: par || me(), motif: "Candidature ajoutée"});
  return D.save(c);
}
function saveCandidate(c){ return D.save(c); }
function removeCandidate(id){ return D.remove(id); }

/* « Démarrer » : la première ouverture de l'étape en cours. Ensuite, la carte dit « Reprendre ». */
function startStep(id, par){
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var e = c.parcours.etape; if(e === CLOS) return c;
    var s = c.parcours.etapes[e] = c.parcours.etapes[e] || {};
    if(!s.debuteLe){ s.debuteLe = D.now(); s.par = par || me(); }
    if(e === "appel"){ if(!c.appel.date) c.appel.date = D.now().slice(0,10); if(!c.appel.par) c.appel.par = par || me(); }
    return D.save(c);
  });
}
function started(c){ var s = c.parcours.etapes[c.parcours.etape]; return !!(s && s.debuteLe); }

/* Ce qui manque pour passer à l'étape suivante, ou null si c'est possible. */
function blocker(c){
  var e = c.parcours.etape;
  if(e === CLOS || e === "onboarding") return "Le parcours est terminé.";
  if(e === "appel" && !(c.appel.onePager && c.appel.onePager.envoyeLe)) return "Coche « One-pager envoyé » avant de passer à l'EC1.";
  return null;
}
function moveStep(id, opts){
  opts = opts || {};
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var de = c.parcours.etape, vers = opts.vers || SUIVANTE[de];
    if(SUIVANTE[de] !== vers) return err("Ce passage n'est pas possible : on avance d'une étape à la fois.");
    var b = blocker(c); if(b) return err(b);
    var s = c.parcours.etapes[de] = c.parcours.etapes[de] || {};
    s.termineLe = D.now(); if(!s.debuteLe) s.debuteLe = s.termineLe;
    c.parcours.etape = vers;
    c.parcours.etapes[vers] = c.parcours.etapes[vers] || {};
    if(de === "passation-ec1" || de === "passation-ec2"){
      var k = de === "passation-ec1" ? "ec1" : "ec2";
      var p = c.passations[k] = Object.assign({}, c.passations[k] || {}, {faiteLe: D.now(), par: opts.par || me()});
      if(opts.mode) p.mode = opts.mode; if(!p.mode) p.mode = "appel";
    }
    if(vers === "passation-ec2" || vers === "ec3" || vers === "decision") c.restitution.etat = c.restitution.etat === "hire" ? "hire" : "ec2";
    if(vers === "onboarding") c.restitution.etat = "hire";
    c.historique.push({de: de, vers: vers, le: D.now(), par: opts.par || me(), motif: opts.motif || ""});
    return D.save(c);
  });
}
/* « Non retenu » se confirme dans l'écran Appel de refus : motif obligatoire, la carte passe dans « Pas aujourd'hui ». */
function closeCandidate(id, opts){
  opts = opts || {};
  if(!opts.motif) return err("Choisis le motif de clôture.");
  if(opts.motif === "autre" && !String(opts.detail || "").trim()) return err("Précise la raison en une phrase.");
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var de = c.parcours.etape;
    if(REFUS_DEPUIS.indexOf(de) < 0) return err(de === "ec3" ? "Pas de refus en EC3 : on envoie en décision, et c'est la décision qui tranche." : "On ne peut pas clore le parcours à cette étape.");
    var s = c.parcours.etapes[de] = c.parcours.etapes[de] || {};
    s.termineLe = D.now(); if(!s.debuteLe) s.debuteLe = s.termineLe;
    c.parcours.cloture = {depuis: de, motif: opts.motif, detail: String(opts.detail || "").trim(), carteEnvoyee: !!opts.carteEnvoyee, le: D.now(), par: opts.par || me()};
    c.parcours.etape = CLOS;
    c.restitution.etat = (de === "appel" || de === "ec1") ? "ec1" : "ec2";
    c.historique.push({de: de, vers: CLOS, le: D.now(), par: opts.par || me(), motif: motifLabel(opts.motif) + (opts.detail ? " : " + String(opts.detail).trim() : "")});
    return D.save(c);
  });
}
/* Annuler le dernier passage (un clic de trop). La correction reste dans l'historique. */
function undoLast(id, par){
  return D.get(id).then(function(c){
    if(!c) return err("Candidat introuvable.");
    var h = c.historique, last = h[h.length - 1];
    if(!last || last.de === null || last.annulation) return err("Il n'y a pas de passage à annuler.");
    var cur = c.parcours.etape;
    if(cur !== last.vers) return err("Le dernier passage ne correspond plus à l'étape en cours.");
    c.parcours.etape = last.de;
    if(cur === CLOS) c.parcours.cloture = null;
    var s = c.parcours.etapes[last.de]; if(s) delete s.termineLe;
    h.push({de: cur, vers: last.de, le: D.now(), par: par || me(), motif: "Annulation du dernier passage", annulation: true});
    return D.save(c);
  });
}

/* ---------- Ce que le tableau affiche ---------- */
var PROCHAINE = {
  "appel": function(c){ return started(c) ? (c.appel.onePager.envoyeLe ? "Passer à l'EC1" : "Envoyer le one-pager") : "Mener l'appel de découverte"; },
  "ec1": function(c){ return c.ec1 ? "Passer à la passation EC1" : "Mener l'EC1 et remplir la fiche #1"; },
  "passation-ec1": function(){ return "Caler le débrief de 15 min"; },
  "ec2": function(c){ return c.ec2 ? "Passer à la passation EC2" : "Mener l'EC2 et remplir la fiche #2"; },
  "passation-ec2": function(){ return "Caler le débrief, imprimer la carte"; },
  "ec3": function(){ return "Mener l'EC3, puis envoyer en décision"; },
  "decision": function(){ return "Appeler la personne"; },
  "onboarding": function(){ return "Remettre la carte à la Nanny"; },
  "clos": function(c){ return c.parcours.cloture && c.parcours.cloture.carteEnvoyee ? "Carte envoyée" : "Envoyer la carte si besoin"; }
};
function nextAction(c){ return (PROCHAINE[c.parcours.etape] || function(){ return ""; })(c); }
/* Dernière action : le dernier passage ou la dernière modification. */
function lastAction(c){ return (c.meta && c.meta.modifieLe) || ""; }
/* Jours ouvrés écoulés depuis l'entrée dans l'étape : au-delà de 5, on a dépassé notre promesse au candidat. */
function joursOuvres(fromIso, toDate){
  if(!fromIso) return 0;
  var d = new Date(fromIso), end = toDate || new Date(), n = 0;
  d.setHours(12,0,0,0); var e = new Date(end); e.setHours(12,0,0,0);
  while(d < e){ d.setDate(d.getDate() + 1); var wd = d.getDay(); if(wd !== 0 && wd !== 6) n++; }
  return n;
}
function enteredStepAt(c){
  for(var i = c.historique.length - 1; i >= 0; i--){ if(c.historique[i].vers === c.parcours.etape) return c.historique[i].le; }
  return c.meta.creeLe;
}
function waiting(c){ return (c.parcours.etape === CLOS || c.parcours.etape === "onboarding") ? 0 : joursOuvres(enteredStepAt(c)); }

/* ---------- Export, import ---------- */
function exportAll(){
  return D.list().then(function(all){
    var out = {schema: EXPORT_SCHEMA, version: D.VERSION, exporteLe: D.now(), candidats: all};
    if(window.YEITA) YEITA.store.set(EXPORT_KEY, out.exporteLe);
    return JSON.stringify(out, null, 2);
  });
}
function lastExport(){ return (window.YEITA && YEITA.store.get(EXPORT_KEY, null)) || null; }
/* mode « fusion » : on garde, pour chaque candidat, la version la plus récente. « remplacement » : la base importée remplace tout. */
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

/* ---------- Exemples fictifs, pour les démos ---------- */
function daysAgo(n){ var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function loadDemo(){
  var P = me() || "Thélo";
  var specs = [
    {p:"Inès", n:"Bernard", prov:"linkedin", poste:"PM", etape:"appel", started:false, age:1},
    {p:"Hugo", n:"Petit", prov:"wttj", poste:"PM", etape:"appel", started:true, age:3, onePager:true,
     blocs:{parcours:"Deux ans PM dans une néobanque, une équipe de six. A porté seul la refonte de l'onboarding.", recherche:"Veut sortir du produit unique. Ouvert à la banque et à l'énergie.", cadre:"Jamais travaillé en ESN, curieux du modèle. Habite Paris 11e.", conditions:"Vise 55 k€. Disponible dans deux mois."}},
    {p:"Maëlle", n:"Durand", prov:"autre", provD:"Cooptation", poste:"PrD", etape:"ec1", started:true, age:2, onePager:true},
    {p:"Yanis", n:"Morel", prov:"linkedin", poste:"PM", etape:"passation-ec1", started:false, age:9, onePager:true, ec1:true},
    {p:"Chloé", n:"Lemaire", prov:"wttj", poste:"PM", etape:"clos", from:"appel", motif:"localisation", detail:"Ne peut pas venir à Paris trois jours par semaine.", age:4}
  ];
  return Promise.all(specs.map(function(s, i){
    var c = D.blank(s.p + " " + s.n);
    c.identite = Object.assign(D.emptyIdentite(), {prenom: s.p, nom: s.n, email: (s.p + "." + s.n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@example.com",
      telephone: "01 99 00 0" + (i+1) + " " + (10 + i*7), provenance: s.prov, provenanceDetail: s.provD || "", poste: s.poste});
    c.meta.demo = true; c.meta.creeLe = daysAgo(s.age + 2);
    c.historique.push({de: null, vers: "appel", le: daysAgo(s.age + 2), par: P, motif: "Candidature ajoutée (exemple)"});
    if(s.blocs){ c.appel.blocs = s.blocs; c.appel.date = daysAgo(s.age).slice(0,10); c.appel.par = P; }
    if(s.onePager) c.appel.onePager = {envoyeLe: daysAgo(s.age), par: P};
    var path = ETAPES.slice(0, Math.max(0, idx(s.etape === "clos" ? s.from : s.etape)) + 1);
    path.forEach(function(e, k){
      c.parcours.etapes[e] = {debuteLe: daysAgo(s.age + 2 - k)};
      if(k < path.length - 1){ c.parcours.etapes[e].termineLe = daysAgo(s.age + 1 - k); c.historique.push({de: e, vers: path[k+1], le: daysAgo(s.age), par: P, motif: ""}); }
    });
    var cur = s.etape === "clos" ? s.from : s.etape;
    if(!s.started && s.etape !== "clos") delete c.parcours.etapes[cur].debuteLe;
    c.parcours.etape = s.etape;
    if(s.ec1){
      c.ec1 = Object.assign(D.emptyEC1(), {date: daysAgo(s.age).slice(0,10), recruteur: P, observateur: "Peter",
        match: {dominante: "collectif", seconde: "sans-chichi", partielle: false, pourquoi: "", source: "decompte"},
        percu: "Tu poses les questions avant de proposer, et tu cites l'équipe avant toi.",
        questionsEC2: "Ce qu'il a mesuré après la mise en production.\nSa façon de dire non à un sponsor.", reporteLe: daysAgo(s.age)});
    }
    if(s.etape === "clos"){
      c.parcours.cloture = {depuis: s.from, motif: s.motif, detail: s.detail, carteEnvoyee: false, le: daysAgo(s.age), par: P};
      c.historique.push({de: s.from, vers: CLOS, le: daysAgo(s.age), par: P, motif: motifLabel(s.motif) + " : " + s.detail});
    }
    c.meta.modifieLe = daysAgo(s.age);
    return D.adapter().put(c);
  }));
}
function clearDemo(){
  return D.list().then(function(all){ return Promise.all(all.filter(function(c){ return c.meta && c.meta.demo; }).map(function(c){ return D.remove(c.id); })); });
}

window.STORE = {
  ETAPES: ETAPES, CLOS: CLOS, SUIVANTE: SUIVANTE, REFUS_DEPUIS: REFUS_DEPUIS, MOTIFS: MOTIFS, PROVENANCES: PROVENANCES,
  motifLabel: motifLabel, provLabel: provLabel, validEmail: validEmail, me: me, setMe: setMe,
  listCandidates: listCandidates, getCandidate: getCandidate, createCandidate: createCandidate, saveCandidate: saveCandidate, removeCandidate: removeCandidate,
  startStep: startStep, started: started, blocker: blocker, moveStep: moveStep, closeCandidate: closeCandidate, undoLast: undoLast,
  nextAction: nextAction, lastAction: lastAction, waiting: waiting, joursOuvres: joursOuvres,
  exportAll: exportAll, importAll: importAll, lastExport: lastExport, loadDemo: loadDemo, clearDemo: clearDemo,
  volatile: function(){ return !!D.adapter().volatile; }
};
})();
