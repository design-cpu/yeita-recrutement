/* Les 4 diamants, leurs 12 étapes et l'attendu Yeita par palier.
   Partagé par la fiche d'entretien candidat #2, la fiche de passation et la carte d'identité Yeita.
   Les 48 critères et les use cases restent dans la fiche #2 : ils ne servent qu'à l'entretien. */
(function(){
"use strict";
var D = [
  {n:"01", name:"Stratégie", jalon:"Stratégie", goal:"Expliciter la stratégie et clarifier les arbitrages.", hint:"Vision, roadmap, lien avec les objectifs business", steps:["Expliciter","Opérationnaliser","Prioriser"]},
  {n:"02", name:"Problème",  jalon:"Vision",    goal:"Explorer et structurer le problème avant de parler solution.", hint:"Interviews utilisateurs, data, cadrage du besoin", steps:["Découvrir","Qualifier","Industrialiser"]},
  {n:"03", name:"Solution",  jalon:"Go Dev",    goal:"Choisir une solution, l'organiser, la préparer.", hint:"Idéation, priorisation, co-construction avec le design et la tech", steps:["Décider","Co-construire","Valider"]},
  {n:"04", name:"Produit",   jalon:"Impact",    goal:"Délivrer la valeur et vérifier l'impact réel.", hint:"Backlog, delivery, rituels, mise en production", steps:["Produire","Standardiser","Impacter"]}
];
var TIERS = ["Je fais","J'apporte de l'impact","Je structure et j'accompagne","Je transforme"];
var TIER_XP = ["1-3 ans","4-7 ans","8-10 ans","10 ans et +"];
/* Ordre des 12 étapes : 01 Expliciter/Opérationnaliser/Prioriser · 02 Découvrir/Qualifier/Industrialiser
                         03 Décider/Co-construire/Valider · 04 Produire/Standardiser/Impacter */
var TIER_EXP = [
  [1,1,2,  2,2,1,  2,3,2,  3,3,2],
  [2,2,3,  3,3,3,  3,3,3,  3,3,3],
  [3,3,3,  3,4,3,  4,4,3,  4,4,3],
  [4,4,4,  4,4,4,  4,4,4,  3,4,4]
];
/* Version interne (fiche #2) */
var TIER_WHY = [
  "On attend surtout les diamants 03 et 04 : la personne tient le delivery, on l'accompagne sur l'amont.",
  "Les diamants 02, 03 et 04 sont attendus en autonomie. La stratégie reste partagée avec un plus senior.",
  "Les quatre diamants sont attendus, la stratégie passe en autonomie, et on attend de la transmission là où la personne est forte.",
  "Les quatre diamants au niveau le plus haut, stratégie comprise. Seul Produire reste à 3 : à dix ans et plus, on n'attend plus qu'elle tienne le backlog au quotidien, mais qu'elle tienne le système."
];
/* Version candidat (carte d'identité, tutoiement) */
var TIER_WHY_YOU = [
  "ce sont surtout les diamants Solution et Produit qui sont attendus : le delivery tenu, l'amont accompagné",
  "les diamants Problème, Solution et Produit sont attendus en autonomie, la stratégie reste partagée avec un plus senior",
  "les quatre diamants sont attendus, la stratégie passe en autonomie, et on attend de la transmission là où tu es fort",
  "les quatre diamants au niveau le plus haut, stratégie comprise"
];
var SCALE = [
  ["0","Pas vu ensemble, pas abordé."],
  ["1","Connaît la théorie."],
  ["2","L'a déjà fait, pas en totale autonomie."],
  ["3","En totale autonomie et maîtrise."],
  ["4","Sait le transmettre : management, formation, mentorat."]
];
function expAt(tier, i){ return TIER_EXP[tier-1][i]; }
function expDiamond(tier, di){ var r = TIER_EXP[tier-1].slice(di*3, di*3+3); return (r[0]+r[1]+r[2])/3; }
function avgDiamond(steps, di){ var r = steps.slice(di*3, di*3+3).map(function(v){ return v==null ? 0 : v; }); return (r[0]+r[1]+r[2])/3; }
function stepNames(){ var out = []; D.forEach(function(d){ d.steps.forEach(function(s){ out.push(s); }); }); return out; }

window.DIAMANTS = {D:D, TIERS:TIERS, TIER_XP:TIER_XP, TIER_EXP:TIER_EXP, TIER_WHY:TIER_WHY, TIER_WHY_YOU:TIER_WHY_YOU, SCALE:SCALE,
  expAt:expAt, expDiamond:expDiamond, avgDiamond:avgDiamond, stepNames:stepNames};
})();
