/* Le panneau Notes : les notes libres de l'entretien en cours, une par étape (dossier.notesLibres[étape]).
   Un bouton fixe l'ouvre à tout moment, sur la droite, sans changer de page ni perdre le défilement. Non communiqué au candidat.
   Branchement : NOTES.monter({etape: () => id, cand: () => dossier, ecrire: (etape, texte) => …, relu: dossier => …}).
   Sans « ecrire », le panneau enregistre seul sa partie (DOSSIER.ecrirePartie) et rend le dossier à jour par « relu ». */
(function(){
"use strict";
var E = YEITA.esc, t = UI.t, D = DOSSIER;
var o = null, base = null, saveT = null, el = null, btn = null, refus = false;

function etape(){ return o.etape(); }
function texte(c, e){ var n = c && c.notesLibres; return (n && typeof n[e] === "string") ? n[e] : ""; }
function partie(e, v){
  return {lire: function(x){ var n = x.notesLibres || {}; return n[e] === undefined ? null : n[e]; },
    poser: function(x){ if(!x.notesLibres || typeof x.notesLibres !== "object") x.notesLibres = {}; x.notesLibres[e] = v; }};
}
function statut(m){ var s = document.getElementById("np-saved"); if(s) s.textContent = m; }
function enregistrer(){
  clearTimeout(saveT); saveT = null;
  var e = etape(), v = document.getElementById("np-text").value;
  if(o.ecrire){ o.ecrire(e, v); return Promise.resolve(); }
  var p = partie(e, v);
  return D.ecrirePartie(base, p).then(function(c){ base = c; refus = false; statut(t("commun.enregistreA", {heure: UI.heure()})); if(o.relu) o.relu(c); },
    function(x){ refus = true; statut(x.message || t("serveur.nonEnregistre")); });
}
function autres(c){
  var n = (c && c.notesLibres) || {}, cur = etape();
  var l = (window.PU ? PU.chemin(c) : D.ETAPES).filter(function(e){ return e !== cur && typeof n[e] === "string" && n[e].trim(); });
  if(!l.length) return "";
  return '<details class="other np-autres"><summary>' + E(t("notes.autres")) + ' (' + l.length + ')</summary><div class="in">'
    + l.map(function(e){ return '<section><h3>' + E(UI.etapeLabel(e)) + '</h3><p>' + E(n[e]) + '</p></section>'; }).join("") + '</div></details>';
}
function rendre(){
  var c = o.cand(); if(!c) return;
  if(!saveT) base = c;
  var e = etape();
  document.getElementById("np-t").textContent = t("notes.etape", {etape: UI.etapeLabel(e)});
  var ta = document.getElementById("np-text");
  if(document.activeElement !== ta && !saveT) ta.value = texte(c, e);
  document.getElementById("np-autres").innerHTML = autres(c);
  majBouton();
}
function majBouton(){
  var c = o.cand(), on = !!(c && texte(c, etape()).trim()) || !!(document.getElementById("np-text") && document.getElementById("np-text").value.trim());
  btn.classList.toggle("has", on);
  /* Le point jaune ne suffit pas : le nom du bouton le dit aussi. */
  btn.setAttribute("aria-label", t("notes.bouton") + (on ? " (" + t("notes.ecrites") + ")" : ""));
}
function ouvert(){ return !el.hidden; }
function ouvrir(){
  rendre(); el.hidden = false; document.body.classList.add("np-on"); btn.setAttribute("aria-expanded", "true");
  var ta = document.getElementById("np-text"); YEITA.autogrow && ta.value && YEITA.autogrow(ta); ta.focus({preventScroll: true});
}
function fermer(focus){
  if(saveT) enregistrer();
  el.hidden = true; document.body.classList.remove("np-on"); btn.setAttribute("aria-expanded", "false");
  if(focus) btn.focus({preventScroll: true});
}
function monter(opts){
  o = opts;
  btn = document.createElement("button");
  btn.type = "button"; btn.className = "np-toggle"; btn.id = "np-toggle";
  btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "np");
  btn.innerHTML = '<span>' + E(t("notes.bouton")) + '</span>';
  el = document.createElement("aside");
  el.className = "np"; el.id = "np"; el.hidden = true; el.setAttribute("aria-labelledby", "np-t");
  el.innerHTML = '<div class="np-h"><div><h2 id="np-t"></h2><p class="np-sub">' + E(t("commun.nonCommunique")) + '</p></div>'
    + '<button type="button" class="iconbtn np-x" id="np-x" aria-label="' + E(t("notes.fermer")) + '"><span aria-hidden="true">×</span></button></div>'
    + '<label for="np-text" class="sr-only">' + E(t("notes.titre")) + '</label><textarea id="np-text" placeholder="' + E(t("notes.placeholder")) + '"></textarea>'
    + '<span class="saved" id="np-saved" aria-live="polite"></span><div id="np-autres"></div>';
  document.body.appendChild(btn); document.body.appendChild(el);
  btn.addEventListener("click", function(){ if(ouvert()) fermer(true); else ouvrir(); });
  document.getElementById("np-x").addEventListener("click", function(){ fermer(true); });
  el.addEventListener("keydown", function(e){ if(e.key === "Escape"){ e.stopPropagation(); fermer(true); } });
  document.getElementById("np-text").addEventListener("input", function(e){
    e.stopPropagation(); majBouton();
    if(o.ecrire){ o.ecrire(etape(), e.target.value); return; }
    clearTimeout(saveT); saveT = setTimeout(enregistrer, 500);
  });
  window.addEventListener("pagehide", function(){
    if(!saveT || o.ecrire) return;
    clearTimeout(saveT); saveT = null;
    D.partirPartie(base, partie(etape(), document.getElementById("np-text").value).poser);
  });
}
/* La page a relu ou changé de dossier, ou d'étape : le panneau suit. */
function maj(){ if(!o) return; if(ouvert()) rendre(); else { if(!saveT) base = o.cand(); majBouton(); } }
function attente(){ return saveT ? enregistrer() : Promise.resolve(); }

window.NOTES = {monter: monter, maj: maj, ouvrir: ouvrir, fermer: fermer, attente: attente, texte: texte};
})();
