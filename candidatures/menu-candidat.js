/* Le menu ⋯ d'un candidat, partout où il apparaît (carte du kanban, ligne de la liste, en-tête du parcours) :
   Fiche du candidat, Historique, Copier le lien, Supprimer. Chaque entrée ouvre une fenêtre (dialog natif) sur la page en cours.
   Le bloc « Infos candidat » (champs de la fiche) vit ici aussi : en haut de l'appel en cours, et dans la fenêtre Fiche du candidat.
   Branchement, une fois par page : MC.init({avant, apres, supprime, etape}). Textes : assets/wording.fr.js (menu, infos). */
(function(){
"use strict";
var S = STORE, D = DOSSIER, E = YEITA.esc, t = UI.t;
var opts = {}, menuEl = null, menuBtn = null, dlg = null, retour = null, copie = null, saveT = null;

function bouton(c){
  return '<button type="button" class="iconbtn morebtn" data-mc-for="' + E(c.id) + '" aria-haspopup="menu" aria-expanded="false" aria-label="'
    + E(t("menu.bouton", {nom: c.candidat.nom})) + '" title="' + E(t("menu.bouton", {nom: c.candidat.nom})) + '"><span aria-hidden="true">⋯</span></button>';
}

/* ---------- Infos candidat : p.id préfixe les identifiants, p.a nomme l'attribut des champs (data-fiche, data-mfiche) ---------- */
function infosHTML(c, ro, p){
  p = p || {id: "i-", a: "fiche"};
  var i = c.identite, dis = ro ? ' disabled' : '';
  function inp(k, label, type, extra){ return '<div class="field"><label for="' + p.id + k + '">' + E(label) + '</label><input type="' + (type || "text") + '" id="' + p.id + k + '" data-' + p.a + '="' + k + '" value="' + E(i[k] === null || i[k] === undefined ? "" : i[k]) + '" autocomplete="off"' + (extra || "") + dis + '></div>'; }
  return '<div class="igrid">'
    + inp("personne", t("ajout.personne"))
    + '<div class="field"><label for="' + p.id + 'job">' + E(t("ajout.job")) + '</label><select id="' + p.id + 'job" data-' + p.a + '="job"' + dis + '>' + D.JOBS.map(function(j){ return '<option' + (j === i.job ? ' selected' : '') + '>' + E(j) + '</option>'; }).join("") + '</select></div>'
    + inp("xp", t("ajout.xp"), "number", ' min="0" max="59" step="0.5" inputmode="decimal"')
    + '<div class="field"><label for="' + p.id + 'disponibilite">' + E(t("ajout.dispo")) + '</label>' + UI.dispoHTML(p.id + "disponibilite", i.disponibilite).replace("<select ", '<select data-' + p.a + '="disponibilite"' + dis + ' ') + '</div>'
    + inp("email", t("ajout.email"), "text", ' inputmode="email"')
    + inp("telephone", t("ajout.telephone"), "text", ' inputmode="tel"')
    + inp("adresse", t("ajout.ville"))
    + inp("dateDisponibilite", t("ajout.dateDispo"), "date")
    + inp("dateDebutProcess", t("infos.debutProcess"), "date")
    + inp("linkedin", t("ajout.linkedin"), "url")
    + inp("portfolio", t("ajout.portfolio"), "url")
    + inp("cv", t("ajout.cv"), "url")
    + inp("references", t("ajout.references"))
    + '</div>'
    + '<fieldset class="plain"><legend class="leg">' + E(t("ajout.provenance")) + '</legend><div class="chips-check">'
    + D.PROVENANCES.map(function(v){ return '<label><input type="checkbox" data-' + p.a + '-prov value="' + E(v) + '"' + ((i.provenances || []).indexOf(v) >= 0 ? ' checked' : '') + dis + '>' + E(v) + '</label>'; }).join("") + '</div></fieldset>'
    + '<div class="field"><label for="' + p.id + 'rec">' + E(t("ajout.recruteurs")) + '</label>' + (ro ? UI.recruteursHTML(i.recruteurs) : UI.tagsHTML(p.id + "rec", i.recruteurs)) + '</div>'
    + '<p class="form-err" id="' + p.id + 'err" role="alert" hidden></p>';
}
/* Applique un champ de la fiche au dossier c, après contrôle. Rend false (et affiche l'erreur) si la valeur est refusée. */
function appliquer(c, k, v, el, err){
  var patch = {}; patch[k] = v;
  var f = Object.assign({}, c.identite, patch), e = S.checkFiche(f);
  if(e){ err.textContent = e; err.hidden = false; el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", err.id); return false; }
  err.hidden = true; el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
  Object.assign(c.identite, S.normFiche(f));
  D.setNom(c, c.identite.personne);
  return true;
}

/* ---------- Historique ---------- */
function histHTML(c){
  var h = (c.historique || []).slice().reverse();
  if(!h.length) return '<p class="note">—</p>';
  return '<ol class="histlist">' + h.map(function(x){
    var what = x.type === "etat" ? t("fiche.etatChange", {etat: UI.etatLabel(x.vers)})
      : (x.de === null ? t("fiche.entree", {etape: UI.etapeLabel(x.vers)}) : UI.etapeLabel(x.de) + " → " + UI.etapeLabel(x.vers));
    return '<li><span class="d">' + E(UI.fmtWhen(x.le)) + '</span><span><b>' + E(what) + '</b>' + (x.par ? ', ' + E(x.par) : '') + (x.motif ? '<span class="m"> · ' + E(x.motif) + '</span>' : '') + '</span></li>';
  }).join("") + '</ol>';
}

/* ---------- Le menu ---------- */
function fermerMenu(focus){
  if(!menuEl) return;
  menuEl.remove(); menuEl = null;
  if(menuBtn){ menuBtn.setAttribute("aria-expanded", "false"); if(focus) menuBtn.focus(); }
  menuBtn = null;
}
function ouvrirMenu(btn){
  fermerMenu(false); UI.closeMenu(false);
  menuBtn = btn; btn.setAttribute("aria-expanded", "true");
  menuEl = document.createElement("div");
  menuEl.className = "menu mcmenu"; menuEl.setAttribute("role", "menu"); menuEl.setAttribute("aria-label", btn.getAttribute("aria-label"));
  menuEl.dataset.for = btn.dataset.mcFor;
  menuEl.innerHTML = [["fiche", "menu.fiche"], ["historique", "menu.historique"], ["lien", "menu.copierLien"], ["supprimer", "menu.supprimer"]].map(function(x){
    return '<button type="button" role="menuitem" tabindex="-1" data-mc="' + x[0] + '"' + (x[0] === "supprimer" ? ' class="danger"' : '') + '>' + E(t(x[1])) + '</button>';
  }).join("");
  document.body.appendChild(menuEl);
  var r = btn.getBoundingClientRect(), mh = menuEl.offsetHeight, mw = menuEl.offsetWidth;
  var top = r.bottom + 6 + scrollY; if(r.bottom + mh + 12 > innerHeight && r.top > mh + 12) top = r.top - mh - 6 + scrollY;
  menuEl.style.top = top + "px"; menuEl.style.left = Math.max(8, Math.min(r.right - mw + scrollX, scrollX + innerWidth - mw - 8)) + "px";
  menuEl.firstChild.focus();
}

/* ---------- Les fenêtres ---------- */
function fenetre(titre, corps, actions){
  fermerFenetre(true);
  dlg = document.createElement("dialog");
  dlg.className = "mdlg"; dlg.setAttribute("aria-labelledby", "mdlg-t");
  dlg.innerHTML = '<div class="mdlg-h"><h2 id="mdlg-t">' + E(titre) + '</h2><button type="button" class="iconbtn mdlg-x" data-mc-close aria-label="' + E(t("menu.fermer")) + '"><span aria-hidden="true">×</span></button></div>'
    + '<div class="mdlg-b">' + corps + '</div>' + (actions ? '<div class="mdlg-a">' + actions + '</div>' : '');
  document.body.appendChild(dlg);
  dlg.addEventListener("cancel", function(e){ e.preventDefault(); fermer(); });
  dlg.addEventListener("click", function(e){ if(e.target === dlg) fermer(); });
  dlg.showModal();
  return dlg;
}
function fermerFenetre(silencieux){
  if(!dlg) return;
  var d = dlg; dlg = null; d.close(); d.remove();
  if(!silencieux && retour && document.contains(retour)) retour.focus();
}
/* Fermer la fiche enregistre ce qui reste, puis rend le dossier à jour à la page. */
function fermer(){
  var c = copie;
  if(!c){ fermerFenetre(); return; }
  copie = null;
  enregistrer().then(function(x){ fermerFenetre(); if(opts.apres) opts.apres(x || c); }, function(){ fermerFenetre(); });
}
function enregistrer(){
  clearTimeout(saveT); saveT = null;
  var c = copie || enCours; if(!c) return Promise.resolve(null);
  return S.saveCandidate(c).then(function(x){ enCours = x; if(copie) copie = x; var s = document.getElementById("mf-saved"); if(s) s.textContent = t("commun.enregistreA", {heure: UI.heure()}); return x; },
    function(e){ var s = document.getElementById("mf-saved"); if(s) s.textContent = t("serveur.nonEnregistre"); throw e; });
}
var enCours = null;
function plusTard(){ clearTimeout(saveT); saveT = setTimeout(function(){ enregistrer().catch(function(){}); }, 400); }

function lire(id){ return Promise.resolve(opts.avant ? opts.avant() : null).then(function(){ return S.getCandidate(id); }); }
function action(quoi, id, btn){
  retour = btn;
  if(quoi === "lien"){ UI.copier(btn, UI.urlCandidat(id, opts.etape ? opts.etape(id) : undefined)); return; }
  lire(id).then(function(c){
    if(!c) return;
    if(quoi === "historique"){ fenetre(t("menu.historique") + " · " + c.candidat.nom, histHTML(c)); dlg.querySelector("[data-mc-close]").focus(); return; }
    if(quoi === "supprimer"){
      fenetre(t("infos.supprimerTitre", {nom: c.candidat.nom}), '<p>' + E(t("infos.supprimerConfirme")) + '</p>',
        '<button type="button" class="btn stop fill" data-mc-del="' + E(c.id) + '">' + E(t("infos.supprimerOui")) + '</button><button type="button" class="btn quiet" data-mc-close>' + E(t("infos.supprimerNon")) + '</button>');
      dlg.querySelector(".mdlg-a [data-mc-close]").focus(); return;
    }
    if(quoi === "fiche"){
      copie = c; enCours = c;
      fenetre(t("menu.fiche") + " · " + c.candidat.nom, '<div class="infos plain">' + infosHTML(c, false, {id: "mf-", a: "mfiche"}) + '</div>',
        '<span class="saved" id="mf-saved" aria-live="polite"></span><button type="button" class="btn primary" data-mc-close>' + E(t("menu.fermer")) + '</button>');
      dlg.querySelector("#mf-personne").focus();
    }
  });
}

function init(o){
  opts = o || {};
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-mc-for]");
    if(b){ e.preventDefault(); e.stopPropagation(); if(menuBtn === b) fermerMenu(true); else ouvrirMenu(b); return; }
    var it = e.target.closest("[data-mc]");
    if(it && menuEl){ var id = menuEl.dataset.for, src = menuBtn; fermerMenu(false); action(it.dataset.mc, id, src); return; }
    if(menuEl && !e.target.closest(".mcmenu")) fermerMenu(false);
    if(e.target.closest("[data-mc-close]")){ fermer(); return; }
    var del = e.target.closest("[data-mc-del]");
    if(del){
      var did = del.dataset.mcDel; del.disabled = true;
      Promise.resolve(opts.avant ? opts.avant() : null).then(function(){ return S.getCandidate(did); }).then(function(c){
        var nom = c ? c.candidat.nom : "";
        return S.removeCandidate(did).then(function(){ fermerFenetre(true); if(opts.supprime) opts.supprime(did, nom); });
      }).catch(function(x){ del.disabled = false; YEITA.flash(null, x.message); });
    }
  }, true);
  document.addEventListener("keydown", function(e){
    if(!menuEl || !menuEl.contains(document.activeElement)) return;
    var items = Array.prototype.slice.call(menuEl.querySelectorAll("[role=menuitem]")), i = items.indexOf(document.activeElement);
    if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); fermerMenu(true); }
    else if(e.key === "ArrowDown"){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if(e.key === "Home"){ e.preventDefault(); items[0].focus(); }
    else if(e.key === "End"){ e.preventDefault(); items[items.length - 1].focus(); }
    else if(e.key === "Tab"){ fermerMenu(false); }
  }, true);
  /* Les champs de la fenêtre Fiche du candidat */
  function champ(e){
    if(!copie || !dlg || !dlg.contains(e.target)) return;
    var k = e.target.dataset && e.target.dataset.mfiche, err = document.getElementById("mf-err");
    if(k){
      if(e.type === "input" && (e.target.tagName !== "INPUT" || e.target.type === "date" || e.target.type === "number")) return;
      if(e.type === "change" && e.target.tagName === "INPUT" && e.target.type !== "date" && e.target.type !== "number") return;
      if(e.target.value === "__autre") return;
      if(appliquer(copie, k, e.target.value, e.target, err)) plusTard();
      return;
    }
    if(e.type === "change" && e.target.matches("[data-mfiche-prov]")){ copie.identite.provenances = Array.prototype.map.call(dlg.querySelectorAll("[data-mfiche-prov]:checked"), function(x){ return x.value; }); plusTard(); }
  }
  document.addEventListener("input", champ);
  document.addEventListener("change", champ);
  document.addEventListener("tagschange", function(e){ if(copie && dlg && e.target.closest('[data-tags="mf-rec"]')){ copie.identite.recruteurs = UI.tagsValues(e.target.closest(".tags")); plusTard(); } });
  window.addEventListener("pagehide", function(){ if(saveT && copie){ clearTimeout(saveT); saveT = null; D.partir(copie); } });
}

window.MC = {bouton: bouton, init: init, infosHTML: infosHTML, appliquer: appliquer, histHTML: histHTML, fermerMenu: fermerMenu};
})();
