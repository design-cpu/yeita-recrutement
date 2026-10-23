/* L'en-tête commun d'un candidat, sur toutes les pages de son parcours (candidat.html, ec1.html, ec2.html) :
   nom, Job · XP, disponibilité, État, recruteurs, Copier le lien, puis les étapes.
   Les étapes EC1 et EC2 sont des pages à part (la fiche en pleine page) ; les autres vivent dans candidat.html. */
(function(){
"use strict";
var S = STORE, E = YEITA.esc, t = UI.t;
var PAGES = {"ec1": "ec1.html", "ec2": "ec2.html"};

function chemin(c){
  var d = c.decision || {};
  var x = (d.choix === "go-mission" || d.choix === "proposition") ? d.choix : (c.parcours.etape === "go-mission" ? "go-mission" : "proposition");
  return ["appel", "ec1", "bilan-ec1", "ec2", "bilan-ec2", "ec3", "decision", x, "onboarding"];
}
/* L'étape où le parcours s'est arrêté (Vivier, Non retenu), ou null. */
function arret(c){
  var e = c.parcours.etape;
  if(e === S.NON_RETENU){ var d = c.parcours.cloture && c.parcours.cloture.depuis; return d || "appel"; }
  if(e === S.VIVIER) return "decision";
  return null;
}
function stepState(c, sid){
  var p = chemin(c), stop = arret(c), ci = p.indexOf(stop || c.parcours.etape), i = p.indexOf(sid);
  if(stop) return i < ci ? "done" : (i === ci ? "stop" : "future");
  return i < ci ? "done" : (i === ci ? "cur" : "future");
}
function current(c){ return arret(c) || c.parcours.etape; }
/* L'adresse d'une étape : la page de la fiche pour EC1 et EC2, sinon candidat.html. */
function href(id, etape){ return UI.urlCandidat(id, etape); }

function headHTML(){
  return '<a href="index.html" class="back" id="back">← <span>' + E(t("commun.retourTableau")) + '</span></a>'
    + '<div class="chead"><div><h1 id="c-name" tabindex="-1"></h1><div class="cmeta" id="c-meta"></div></div><div class="side" id="c-side"></div></div>'
    + '<nav class="stepper" aria-label="Étapes du parcours"><ol class="steps" id="steps"></ol><a class="guide-link" id="c-guide" href="../index.html#guide"></a></nav>'
    + '<div id="notice"></div>';
}
function renderHead(c){
  var i = c.identite;
  document.getElementById("c-name").textContent = c.candidat.nom;
  document.getElementById("c-meta").innerHTML = '<span class="chip jx">' + E(UI.jobXp(c)) + '</span>'
    + (i.disponibilite ? '<span class="chip">' + E(i.disponibilite) + '</span>' : '')
    + (i.provenances || []).map(function(p){ return '<span class="chip">' + E(p) + '</span>'; }).join("")
    + (c.meta.demo ? '<span class="chip demo">' + E(t("commun.exemple")) + '</span>' : '');
}
function renderSide(c, viewing){
  document.getElementById("c-side").innerHTML = UI.etatHTML(c, true) + UI.recruteursHTML(c.identite.recruteurs) + UI.lienHTML(c.id, viewing);
}
/* inPage(etape) : vrai si l'étape s'affiche sans changer de page (candidat.html). */
function renderSteps(c, viewing){
  var p = chemin(c);
  document.getElementById("steps").innerHTML = p.map(function(id, n){
    var s = stepState(c, id), v = viewing === id;
    var tip = s === "future" ? t("fiche.futur") : (s === "done" ? t("fiche.passee") : (s === "stop" ? t("fiche.arrete") : t("fiche.enCours")));
    return '<li class="' + s + (v ? ' viewing' : '') + '"><button type="button" data-step="' + id + '"' + (s === "cur" ? ' aria-current="step"' : '') + ' aria-pressed="' + v + '"' + (s === "future" ? ' disabled aria-disabled="true"' : '') + ' title="' + E(tip) + '">'
      + '<span class="num" aria-hidden="true">' + (s === "done" ? "✓" : (n + 1)) + '</span>' + E(UI.etapeLabel(id, true)) + '<span class="sr-only">, ' + E(tip) + '</span></button></li>';
  }).join("") + (arret(c) ? '<li class="endchip"><span>' + E(UI.etapeLabel(c.parcours.etape)) + '</span></li>' : '');
  var ol = document.getElementById("steps"), vb = ol.querySelector("li.viewing");
  if(vb && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, vb.offsetLeft - (ol.clientWidth - vb.offsetWidth) / 2);
  var g = document.getElementById("c-guide"), e = PARCOURS.etape(viewing);
  g.href = PARCOURS.guideHref(viewing); g.textContent = t("commun.guideEtape") + (e ? ", " + e.n : "");
}
function render(c, viewing){ document.title = c.candidat.nom + " · " + UI.etapeLabel(viewing) + " · Yeita"; renderHead(c); renderSide(c, viewing); renderSteps(c, viewing); }
/* Un clic sur une étape : sur la même page si elle y vit, sinon on change de page. */
function wire(getCand, onInPage){
  document.addEventListener("click", function(e){
    var st = e.target.closest && e.target.closest("[data-step]"); if(!st) return;
    var c = getCand(); if(!c) return;
    e.preventDefault(); if(st.disabled) return;
    var id = st.dataset.step;
    if(onInPage && !PAGES[id]) onInPage(id); else location.href = href(c.id, id);
  });
}
window.PU = {PAGES: PAGES, chemin: chemin, arret: arret, stepState: stepState, current: current, href: href, headHTML: headHTML,
  renderHead: renderHead, renderSide: renderSide, renderSteps: renderSteps, render: render, wire: wire};
})();
