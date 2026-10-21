/* Le parcours du module Candidatures : une entrée par étape, dans l'ordre du stepper.
   Les objectifs reprennent le guide du recruteur (index.html), en une phrase. Les liens pointent vers les supports existants.
   « guide » est l'ancre de l'étape dans le guide du recruteur. */
(function(){
"use strict";
var NOTION_EMP = "https://app.notion.com/p/Employabilit-3e64bfab7816801592f4cfdf068968b6";
var NOTION_REF = "https://app.notion.com/p/3f94bfab781681289c7ccea584e7e7e1";
var NOTION_GRILLE = "https://app.notion.com/p/2564bfab78168099a8f0de61754e3242";
var GAME = (window.YEITA_MATCH && YEITA_MATCH.GAME_URL) || "";

var ETAPES = [
  {id:"appel", label:"Appel de découverte", court:"Appel", guide:"appel", n:3,
   objectif:"Décider s'il y a un EC1, avec les réponses aux quatre blocs : le parcours, la recherche, le cadre, les conditions.",
   liens:[["Critères d'employabilité", NOTION_EMP, true], ["Le one-pager", "one-pager.html"]]},
  {id:"ec1", label:"EC1", court:"EC1", guide:"ec1", n:5,
   objectif:"Lire comment la personne fonctionne dans nos quatre valeurs, avec Yeita Match, et décider s'il y a un EC2.",
   liens:[["Critères d'employabilité", NOTION_EMP, true]]},
  {id:"passation-ec1", label:"Passation EC1", court:"Passation EC1", guide:"debrief-ec1", n:6,
   objectif:"Croiser les lectures du recruteur et de l'observateur, et dire à l'EC2 ce qu'il doit aller chercher.",
   liens:[]},
  {id:"ec2", label:"EC2", court:"EC2", guide:"ec2", n:7,
   objectif:"Lire le métier sur les quatre diamants, avec des faits, et placer le palier.",
   liens:[["Grille de salaire", NOTION_GRILLE, true], ["Référentiel des compétences", NOTION_REF, true]]},
  {id:"passation-ec2", label:"Passation EC2", court:"Passation EC2", guide:"debrief-ec2", n:8,
   objectif:"Réunir ce qui reste ouvert pour l'EC3 et préparer la carte pour le fondateur.",
   liens:[]},
  {id:"ec3", label:"EC3", court:"EC3", guide:"ec3", n:9,
   objectif:"Lever les dernières zones d'ombre et corriger la carte d'identité avec la personne.",
   liens:[]},
  {id:"decision", label:"Décision", court:"Décision", guide:"decision", n:10,
   objectif:"Une proposition juste, placée dans la grille, ou un non expliqué. Toujours au téléphone d'abord.",
   liens:[["Grille de salaire", NOTION_GRILLE, true]]},
  {id:"onboarding", label:"Onboarding", court:"Onboarding", guide:"onboarding", n:11,
   objectif:"La carte d'identité devient le point de départ de la personne, avec sa Nanny.",
   liens:[]}
];
var CLOS = {id:"clos", label:"Pas aujourd'hui", court:"Pas aujourd'hui"};

/* Les quatre blocs de l'appel de découverte : mêmes questions que dans le guide (étape 3). */
var BLOCS = [
  {id:"parcours", label:"Le parcours", q:["Son dernier projet : contexte, équipe, rôle exact, résultat", "Pourquoi elle a quitté les précédents", "Avec qui elle travaille au quotidien"]},
  {id:"recherche", label:"La recherche", q:["Pourquoi maintenant", "Ce qu'elle ne veut plus faire", "Secteurs ouverts, no-go argumentés"]},
  {id:"cadre", label:"Le cadre", q:["Le modèle ESN : déjà vécu, ce qu'elle en attend", "Présentiel et pied-à-terre à Paris", "Anglais lu, parlé, écrit"]},
  {id:"conditions", label:"Les conditions", q:["Prétentions et marge de discussion", "Autres pistes et leur timing", "Disponibilité"]}
];

/* Yeita Match à l'EC1 : deux formats, deux trousses. */
var YM = {
  presentiel: [["Kit Yeita Match à imprimer", "yeita-match-kit.html"], ["Feuille de décompte vierge", "yeita-match-decompte.html#vierge"]],
  visio: [["Yeita Match en ligne", GAME, true], ["Feuille de décompte vierge", "yeita-match-decompte.html#vierge"]]
};

/* Hors MVP : emplacements prêts, désactivés. Passer à true pour les activer. */
var FEATURES = {notesLibres: false, reeditionProfil: false};

function etape(id){ return id === "clos" ? CLOS : ETAPES.filter(function(e){ return e.id === id; })[0] || null; }
window.PARCOURS = {ETAPES:ETAPES, CLOS:CLOS, BLOCS:BLOCS, YM:YM, FEATURES:FEATURES, etape:etape, NOTION_EMP:NOTION_EMP, NOTION_GRILLE:NOTION_GRILLE, NOTION_REF:NOTION_REF};
})();
