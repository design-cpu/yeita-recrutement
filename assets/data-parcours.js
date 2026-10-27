/* Le parcours de l'espace Candidatures : l'ordre des étapes, leur ancre dans le guide du recruteur et leurs liens utiles.
   Les textes (libellés, objectifs) sont dans assets/wording.fr.js ; les adresses dans assets/config.js.
   Les chemins sont relatifs aux pages de l'espace (dossier candidatures/). */
(function(){
"use strict";
var C = (window.YEITA_CONFIG && YEITA_CONFIG.liens) || {};
var W = window.WORDING || {etapes: {}};
var GAME = (window.YEITA_MATCH && YEITA_MATCH.GAME_URL) || "";

/* n : numéro de l'étape dans le guide du recruteur. liens : [libellé, adresse, nouvel onglet ?] */
var ETAPES = [
  {id: "appel", guide: "appel", n: 3, liens: [["Critères d'employabilité", C.employabilite, true]]},
  {id: "ec1", guide: "ec1", n: 5, liens: [["Feuille de décompte", "decompte.html"], ["Yeita Match en ligne", GAME, true], ["Critères d'employabilité", C.employabilite, true]]},
  {id: "bilan-ec1", guide: "bilan-ec1", n: 6, liens: []},
  {id: "ec2", guide: "ec2", n: 7, liens: [["Grille de salaire", C.grilleSalaire, true], ["Référentiel des compétences", C.referentiel, true]]},
  {id: "bilan-ec2", guide: "bilan-ec2", n: 8, liens: []},
  {id: "ec3", guide: "ec3", n: 9, liens: []},
  {id: "decision", guide: "decision", n: 10, liens: [["Grille de salaire", C.grilleSalaire, true]]},
  {id: "proposition", guide: "decision", n: 10, liens: [["Grille de salaire", C.grilleSalaire, true]]},
  {id: "go-mission", guide: "decision", n: 10, liens: []},
  {id: "onboarding", guide: "onboarding", n: 11, liens: []}
];
var SORTIES = [{id: "vivier", guide: "decision", n: 10, liens: []}, {id: "non-retenu", guide: "decision", n: 10, liens: []}];

/* Yeita Match à l'EC1 : deux formats, deux trousses. */
var YM = {
  presentiel: [["Kit Yeita Match à imprimer", "../yeita-match-kit.html"], ["Feuille de décompte vierge", "decompte.html?vierge=1"]],
  visio: [["Yeita Match en ligne", GAME, true], ["Feuille de décompte vierge", "decompte.html?vierge=1"]]
};

/* Hors MVP : emplacements prêts, désactivés. */
var FEATURES = {notesLibres: true, reeditionProfil: false, sourcing: false};

function etape(id){
  var e = ETAPES.concat(SORTIES).filter(function(x){ return x.id === id; })[0];
  if(!e) return null;
  var w = (W.etapes && W.etapes[id]) || {};
  return Object.assign({label: w.label || id, court: w.court || w.label || id, objectif: w.objectif || ""}, e,
    {liens: e.liens.filter(function(l){ return l[1]; })});
}
window.PARCOURS = {ETAPES: ETAPES.map(function(e){ return etape(e.id); }), SORTIES: SORTIES.map(function(e){ return etape(e.id); }), YM: YM, FEATURES: FEATURES, etape: etape,
  guideHref: function(id){ var e = etape(id); return (C.guide || "../index.html") + "#" + (e ? e.guide : "guide"); }};
})();
