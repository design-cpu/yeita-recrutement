/* « Qui es-tu ? » : le prénom de la personne qui agit, noté dans l'historique à chaque action.
   Mode navigateur : la liste vient de assets/config.js (equipe) ; un nom ajouté depuis l'interface est gardé dans ce
   navigateur et proposé partout (« Qui es-tu ? » et champ Recruteurs).
   Mode serveur (assets/demarrage.js, QUI.compte) : QUI.moi() rend le prénom du compte Google, QUI.equipe() l'équipe de
   l'API, QUI.monter() affiche « Connecté·e : <prénom> » sans liste ; un nom ajouté ne vaut que pour la page.
   Tant que le démarrage n'a pas choisi (QUI.attente), moi() est vide et monter() n'affiche rien. */
(function(){
"use strict";
var MOI = "yeita-recruteur", AJOUTS = "yeita-equipe-ajouts";
function get(k, d){ return window.YEITA ? YEITA.store.get(k, d) : d; }
function set(k, v){ if(window.YEITA) YEITA.store.set(k, v); }
function propre(n){ return String(n || "").trim().replace(/\s+/g, " "); }

/* etat : "local" (par défaut, comme avant), "attente" ou "compte". */
var etat = "local", compteMoi = null, compteEquipe = [], ajoutsPage = [];

function equipe(){
  var base = etat === "local" ? ((window.YEITA_CONFIG && YEITA_CONFIG.equipe) || []).concat(get(AJOUTS, [])) : compteEquipe.concat(ajoutsPage);
  var out = [];
  base.forEach(function(n){ n = propre(n); if(n && out.indexOf(n) < 0) out.push(n); });
  return out;
}
function ajouter(nom){
  nom = propre(nom); if(!nom) return equipe();
  if(equipe().indexOf(nom) < 0){
    if(etat === "local"){ var a = get(AJOUTS, []); a.push(nom); set(AJOUTS, a); } else ajoutsPage.push(nom);
  }
  return equipe();
}
function moi(){ return etat === "compte" ? propre(compteMoi.prenom) : (etat === "attente" ? "" : propre(get(MOI, ""))); }
function choisir(nom){ if(etat !== "local") return moi(); nom = propre(nom); if(nom) ajouter(nom); set(MOI, nom); emit(); return nom; }
function attente(){ etat = "attente"; emit(); }
function local(){ etat = "local"; emit(); }
function compte(m, liste){ compteMoi = m || {}; compteEquipe = (liste || []).slice(); etat = "compte"; emit(); }

var abonnes = [];
function onChange(fn){ abonnes.push(fn); }
function emit(){ abonnes.forEach(function(f){ try{ f(moi()); }catch(e){} }); }

/* Affiche le sélecteur dans el : la liste de l'équipe, et « Un autre nom… » qui ouvre un champ libre. */
function monter(el, W){
  W = W || (window.WORDING && WORDING.qui) || {};
  var E = YEITA.esc;
  function rendu(){
    if(etat === "attente"){ el.innerHTML = ""; return; }
    if(etat === "compte"){
      el.innerHTML = '<span class="qui-compte">' + E((W.connecte || "Connecté·e : ") + moi())
        + (compteMoi.role === "lecture" ? E(W.lectureSeule || " · lecture seule") : "") + '</span>';
      return;
    }
    var m = moi(), liste = equipe();
    el.innerHTML = '<label for="qui-sel">' + E(W.label || "Qui es-tu ?") + '</label>'
      + '<select id="qui-sel"><option value="">' + E(W.choisir || "Choisis ton prénom") + '</option>'
      + liste.map(function(n){ return '<option' + (n === m ? ' selected' : '') + '>' + E(n) + '</option>'; }).join("")
      + '<option value="__autre">' + E(W.autre || "Un autre nom…") + '</option></select>'
      + '<span class="qui-autre" hidden><label for="qui-nouveau" class="sr-only">' + E(W.nouveauLabel || "Ton prénom") + '</label>'
      + '<input type="text" id="qui-nouveau" autocomplete="off" placeholder="' + E(W.nouveauPlaceholder || "Ton prénom") + '">'
      + '<button type="button" class="btn small" id="qui-ok">' + E(W.valider || "OK") + '</button></span>';
  }
  rendu();
  el.addEventListener("change", function(e){
    if(e.target.id !== "qui-sel") return;
    if(e.target.value === "__autre"){ el.querySelector(".qui-autre").hidden = false; el.querySelector("#qui-nouveau").focus(); return; }
    choisir(e.target.value); YEITA.flash(null, e.target.value ? (W.note || "C'est noté : ") + e.target.value : (W.retire || "Prénom retiré"));
  });
  function valider(){ var v = el.querySelector("#qui-nouveau").value; if(!propre(v)) return; choisir(v); rendu(); el.querySelector("#qui-sel").focus(); YEITA.flash(null, (W.note || "C'est noté : ") + propre(v)); }
  el.addEventListener("click", function(e){ if(e.target.id === "qui-ok") valider(); });
  el.addEventListener("keydown", function(e){ if(e.target.id === "qui-nouveau" && e.key === "Enter"){ e.preventDefault(); valider(); } if(e.target.id === "qui-nouveau" && e.key === "Escape"){ rendu(); el.querySelector("#qui-sel").focus(); } });
  onChange(function(){ if(!el.contains(document.activeElement)) rendu(); });
  return {focus: function(){ var s = el.querySelector("#qui-sel"); if(s) s.focus(); }};
}

/* Vrai pour un compte en lecture seule (mode serveur) : les pages n'offrent alors aucune action d'écriture sur les documents. */
function lectureSeule(){ return etat === "compte" && compteMoi.role === "lecture"; }
window.QUI = {lectureSeule: lectureSeule, equipe: equipe, ajouter: ajouter, moi: moi, choisir: choisir, onChange: onChange, monter: monter,
  attente: attente, local: local, compte: compte};
})();
