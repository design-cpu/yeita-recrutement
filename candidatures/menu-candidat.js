/* La fiche d'un candidat, partout où elle apparaît, et le menu ⋯ (carte du kanban, ligne de la liste, en-tête du parcours).
   - Un seul composant « Infos candidat » (infosHTML) : en haut de l'appel en cours, dans la fenêtre Fiche du candidat (menu ⋯)
     et dans la fenêtre de création (« Ajouter un candidat ») ; mêmes champs, même ordre, mêmes groupes, même grille.
   - CV et Portfolio : un fichier déposé (PDF, PNG, JPG, 10 Mo, gardé par l'API avec le dossier) ou un lien.
   - Menu ⋯ : Fiche du candidat, Historique, Copier le lien, Supprimer, chacun dans une fenêtre (dialog natif).
   Branchement, une fois par page : MC.init({avant, apres, supprime, etape, page, avantCreer}). Textes : assets/wording.fr.js. */
(function(){
"use strict";
var S = STORE, D = DOSSIER, E = YEITA.esc, t = UI.t;
var opts = {}, menuEl = null, menuBtn = null, dlg = null, retour = null, copie = null, saveT = null, enCours = null;
var mode = "fiche", attente = {};               /* création : fichiers choisis avant que le candidat existe */
var TYPES = ["application/pdf", "image/png", "image/jpeg"], MAX = 10 * 1048576, CHAMPS = ["cv", "portfolio"];

function bouton(c){
  return '<button type="button" class="iconbtn morebtn" data-mc-for="' + E(c.id) + '" aria-haspopup="menu" aria-expanded="false" aria-label="'
    + E(t("menu.bouton", {nom: c.candidat.nom})) + '" title="' + E(t("menu.bouton", {nom: c.candidat.nom})) + '"><span aria-hidden="true">⋯</span></button>';
}

/* ---------- Le dépôt de fichiers : l'API du site de l'équipe (mode serveur), sinon des liens seulement ---------- */
function depot(){ var a = D.adapter(); return a && a.deposer ? a : null; }
function taille(o){ return o < 1048576 ? Math.max(1, Math.round(o / 1024)) + " Ko" : (Math.round(o / 104857.6) / 10).toString().replace(".", ",") + " Mo"; }
function lienCourt(u){ try{ var x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/$/, ""); }catch(e){ return u; } }

/* Un champ CV ou Portfolio. ctx : "page" (bloc de l'appel) ou "modal" ; p : préfixe des identifiants. */
function docHTML(c, champ, ro, p, ctx){
  var i = c.identite, f = (i.fichiers || {})[champ], lien = String(i[champ] || "").trim(), att = ctx === "modal" && mode === "creation" ? attente[champ] : null;
  var label = t("ajout." + champ), id = p.id + champ, d = depot(), h;
  if(f || att){
    var nom = f ? f.nom : att.name, o = f ? f.taille : att.size;
    h = '<span class="docnom">' + YEITA.icon("Paperclip", 16, 2) + '<span>' + E(nom) + '</span></span><span class="doctaille">' + E(taille(o)) + '</span>'
      + '<span class="docacts">' + (f && d ? '<a class="btn small" href="' + E(d.fichierUrl(c.id, f.id)) + '" target="_blank" rel="noopener">' + E(t("docs.ouvrir")) + '<span class="sr-only"> ' + E(nom) + ', ' + E(t("docs.nouvelOnglet")) + '</span></a>' : '')
      + (ro ? '' : '<button type="button" class="btn small quiet" data-doc-act="retirer">' + E(t("docs.retirer")) + '<span class="sr-only"> ' + E(nom) + '</span></button>') + '</span>';
  } else if(lien){
    h = '<a class="doclien" href="' + E(lien) + '" target="_blank" rel="noopener">' + YEITA.icon("Link", 15, 2.2) + '<span>' + E(lienCourt(lien)) + '</span><span class="sr-only"> (' + E(t("docs.nouvelOnglet")) + ')</span></a>'
      + (ro ? '' : '<span class="docacts"><button type="button" class="btn small quiet" data-doc-act="lien">' + E(t("docs.modifier")) + '</button><button type="button" class="btn small quiet" data-doc-act="retirer">' + E(t("docs.retirer")) + '</button></span>');
  } else if(ro){
    h = '<span class="docvide">' + E(t("bilan.nonRenseigne")) + '</span>';
  } else {
    h = (d ? '<button type="button" class="docbtn" data-doc-act="fichier">' + YEITA.icon("Paperclip", 16, 2) + '<span>' + E(t("docs.fichier")) + '</span></button>' : '')
      + '<button type="button" class="docbtn" data-doc-act="lien">' + YEITA.icon("Link", 15, 2.2) + '<span>' + E(t("docs.lien")) + '</span></button>'
      + (d ? '<span class="dochint">' + E(t("docs.glisser")) + '</span>' : '');
  }
  return '<div class="field doc" data-doc="' + champ + '" data-doc-ctx="' + ctx + '"><span class="lab" id="' + id + '-l">' + E(label) + '</span>'
    + '<div class="docbox" role="group" aria-labelledby="' + id + '-l">' + h + '</div>'
    + '<input type="file" class="sr-only" tabindex="-1" aria-hidden="true" data-doc-file accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg">'
    + '<p class="docmsg" aria-live="polite"></p></div>';
}

/* ---------- Infos candidat : p.id préfixe les identifiants, p.a nomme l'attribut des champs (data-fiche, data-mfiche) ---------- */
function infosHTML(c, ro, p, ctx){
  p = p || {id: "i-", a: "fiche"}; ctx = ctx || "page";
  var i = c.identite, dis = ro ? ' disabled' : '';
  function inp(k, label, type, extra){ return '<div class="field"><label for="' + p.id + k + '">' + E(label) + '</label><input type="' + (type || "text") + '" id="' + p.id + k + '" data-' + p.a + '="' + k + '" value="' + E(i[k] === null || i[k] === undefined ? "" : i[k]) + '" autocomplete="off"' + (extra || "") + dis + '></div>'; }
  function grp(titre, corps){ return '<fieldset class="igroup"><legend>' + E(t("infos.groupes." + titre)) + '</legend><div class="igrid">' + corps + '</div></fieldset>'; }
  return grp("identite", inp("personne", t("ajout.personne"), "text", ' aria-required="true"')
      + '<div class="field"><label for="' + p.id + 'job">' + E(t("ajout.job")) + '</label><select id="' + p.id + 'job" data-' + p.a + '="job"' + dis + '>' + D.JOBS.map(function(j){ return '<option' + (j === i.job ? ' selected' : '') + '>' + E(j) + '</option>'; }).join("") + '</select></div>'
      + inp("xp", t("ajout.xp"), "number", ' min="0" max="59" step="0.5" inputmode="decimal"')
      + '<div class="field"><label for="' + p.id + 'disponibilite">' + E(t("ajout.dispo")) + '</label>' + UI.dispoHTML(p.id + "disponibilite", i.disponibilite).replace("<select ", '<select data-' + p.a + '="disponibilite"' + dis + ' ') + '</div>'
      + inp("dateDisponibilite", t("ajout.dateDispo"), "date")
      + inp("dateDebutProcess", t("infos.debutProcess"), "date"))
    + grp("contact", inp("email", t("ajout.email"), "text", ' inputmode="email"')
      + inp("telephone", t("ajout.telephone"), "text", ' inputmode="tel"')
      + inp("adresse", t("ajout.ville"))
      + inp("linkedin", t("ajout.linkedin"), "url"))
    + grp("documents", docHTML(c, "cv", ro, p, ctx) + docHTML(c, "portfolio", ro, p, ctx) + inp("references", t("ajout.references")))
    + grp("suivi", '<fieldset class="plain span-all"><legend class="leg">' + E(t("ajout.provenance")) + '</legend><div class="chips-check">'
      + D.PROVENANCES.map(function(v){ return '<label><input type="checkbox" data-' + p.a + '-prov value="' + E(v) + '"' + ((i.provenances || []).indexOf(v) >= 0 ? ' checked' : '') + dis + '>' + E(v) + '</label>'; }).join("") + '</div></fieldset>'
      + '<div class="field span-all"><label for="' + p.id + 'rec">' + E(t("ajout.recruteurs")) + '</label>' + (ro ? UI.recruteursHTML(i.recruteurs, true) : UI.tagsHTML(p.id + "rec", i.recruteurs)) + '</div>')
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
      : x.type === "fichier" ? t("docs.histo." + x.action, {champ: t("ajout." + x.champ), nom: x.nom || ""})
      : (x.de === null ? t("fiche.entree", {etape: UI.etapeLabel(x.vers)}) : UI.etapeLabel(x.de) + " → " + UI.etapeLabel(x.vers));
    return '<li><span class="d">' + E(UI.fmtWhen(x.le)) + '</span><span><b>' + E(what) + '</b>' + (x.par ? ', ' + E(UI.nomComplet(x.par)) : '') + (x.motif ? '<span class="m"> · ' + E(x.motif) + '</span>' : '') + '</span></li>';
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
function fenetre(titre, corps, actions, large){
  fermerFenetre(true);
  dlg = document.createElement("dialog");
  dlg.className = "mdlg" + (large ? " large" : ""); dlg.setAttribute("aria-labelledby", "mdlg-t");
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
/* Fermer : en consultation, la fiche enregistre ce qui reste puis rend le dossier à la page ; en création, rien n'est gardé. */
function fermer(){
  var c = copie;
  if(!c || mode === "creation"){ copie = null; attente = {}; mode = "fiche"; fermerFenetre(); return; }
  copie = null;
  enregistrer().then(function(x){ fermerFenetre(); if(opts.apres) opts.apres(x || c); }, function(){ fermerFenetre(); });
}
function enregistrer(){
  clearTimeout(saveT); saveT = null;
  var c = copie || enCours; if(!c || mode === "creation") return Promise.resolve(null);
  return S.saveCandidate(c).then(function(x){ enCours = x; if(copie) copie = x; var s = document.getElementById("mf-saved"); if(s) s.textContent = t("commun.enregistreA", {heure: UI.heure()}); return x; },
    function(e){ var s = document.getElementById("mf-saved"); if(s) s.textContent = t("serveur.nonEnregistre"); throw e; });
}
function plusTard(){ if(mode === "creation") return; clearTimeout(saveT); saveT = setTimeout(function(){ enregistrer().catch(function(){}); }, 400); }

function ficheHTML(c){ return '<div class="infos plain">' + infosHTML(c, false, {id: "mf-", a: "mfiche"}, "modal") + '</div>'; }
function lire(id){ return Promise.resolve(opts.avant ? opts.avant() : null).then(function(){ return S.getCandidate(id); }); }
function action(quoi, id, btn){
  retour = btn;
  if(quoi === "lien"){ UI.copier(btn, UI.urlCandidat(id, opts.etape ? opts.etape(id) : undefined)); return; }
  lire(id).then(function(c){
    if(!c) return;
    if(quoi === "historique"){ fenetre(t("menu.historique") + " · " + c.candidat.nom, histHTML(c)); dlg.querySelector("[data-mc-close]").focus(); return; }
    if(quoi === "supprimer"){
      var n = (c.identite.fichiers && (c.identite.fichiers.cv || c.identite.fichiers.portfolio)) ? " " + t("infos.supprimerFichiers") : "";
      fenetre(t("infos.supprimerTitre", {nom: c.candidat.nom}), '<p>' + E(t("infos.supprimerConfirme") + n) + '</p>',
        '<button type="button" class="btn stop fill" data-mc-del="' + E(c.id) + '">' + E(t("infos.supprimerOui")) + '</button><button type="button" class="btn quiet" data-mc-close>' + E(t("infos.supprimerNon")) + '</button>');
      dlg.querySelector(".mdlg-a [data-mc-close]").focus(); return;
    }
    if(quoi === "fiche"){
      mode = "fiche"; copie = c; enCours = c;
      fenetre(t("menu.fiche") + " · " + c.candidat.nom, ficheHTML(c),
        '<span class="saved" id="mf-saved" aria-live="polite"></span><button type="button" class="btn primary" data-mc-close>' + E(t("menu.fermer")) + '</button>', true);
      dlg.querySelector("#mf-personne").focus();
    }
  });
}
/* « Ajouter un candidat » : la même fenêtre, en création. Rien n'est enregistré avant l'une des deux actions du pied. */
function creer(btn){
  if(opts.avantCreer && opts.avantCreer() === false) return;
  retour = btn || document.activeElement;
  mode = "creation"; attente = {};
  var c = D.blank(""); c.identite.recruteurs = S.me() ? [S.me()] : []; c.identite.dateDebutProcess = new Date().toISOString().slice(0, 10);
  copie = c;
  fenetre(t("ajout.titre"), ficheHTML(c),
    '<button type="button" class="btn" data-mc-creer="liste">' + E(t("ajout.enregistrer")) + '</button><button type="button" class="btn primary" data-mc-creer="appel">' + E(t("ajout.ouvrirAppel")) + '</button>', true);
  dlg.querySelector("#mf-personne").focus();
}
function valider(quoi, btn){
  var c = copie, err = document.getElementById("mf-err");
  var box = dlg.querySelector('[data-tags="mf-rec"]'), pending = box && box.querySelector("input").value;
  if(pending && pending.trim()){ UI.tagsAdd(box, pending); box.querySelector("input").value = ""; c.identite.recruteurs = UI.tagsValues(box); }
  var e = S.checkFiche(c.identite);
  if(e){
    err.textContent = e; err.hidden = false;
    var bad = dlg.querySelector(!String(c.identite.personne || "").trim() ? "#mf-personne" : (/e-mail/.test(e) ? "#mf-email" : (/années/.test(e) ? "#mf-xp" : "#mf-personne")));
    bad.setAttribute("aria-invalid", "true"); bad.setAttribute("aria-describedby", "mf-err"); bad.focus(); return;
  }
  btn.disabled = true;
  var f = Object.assign({}, c.identite); delete f.fichiers;
  S.createCandidate(f, S.me()).then(function(n){
    /* Les fichiers choisis pendant la création partent une fois le candidat créé. */
    return CHAMPS.reduce(function(p, champ){ return p.then(function(x){ return attente[champ] ? deposer(x, champ, attente[champ]) : x; }); }, Promise.resolve(n));
  }).then(function(n){
    copie = null; attente = {}; mode = "fiche";
    if(quoi === "appel") return S.startStep(n.id, S.me()).then(function(){ location.href = UI.urlCandidat(n.id, "appel"); });
    fermerFenetre(true);
    if(opts.cree) opts.cree(n);
  }).catch(function(x){ btn.disabled = false; err.textContent = x.message; err.hidden = false; });
}

/* ---------- CV et Portfolio : déposer, coller un lien, retirer ---------- */
function hote(el){
  var ctx = el.closest("[data-doc-ctx]").dataset.docCtx;
  if(ctx === "modal") return {get: function(){ return copie; }, changer: plusTard, redessiner: redessinerModal};
  return opts.page;
}
function redessinerModal(){
  if(!dlg || !copie) return;
  CHAMPS.forEach(function(ch){ var el = dlg.querySelector('[data-doc="' + ch + '"]'); if(el) el.outerHTML = docHTML(copie, ch, false, {id: "mf-", a: "mfiche"}, "modal"); });
}
function message(champEl, m){ var x = champEl.querySelector(".docmsg"); if(x) x.textContent = m || ""; }
function controle(file){
  if(TYPES.indexOf(file.type) < 0) return t("docs.erreurType");
  if(file.size > MAX) return t("docs.erreurTaille");
  if(!file.size) return t("docs.erreurVide");
  return "";
}
function trace(c, action, champ, nom){ c.historique = c.historique || []; c.historique.push({type: "fichier", action: action, champ: champ, nom: nom, le: D.now(), par: S.me() || ""}); }
/* Dépose le fichier, retire l'ancien s'il y en avait un, garde ses informations sur le dossier et le trace dans l'historique. */
function deposer(c, champ, file){
  var d = depot(); if(!d) return Promise.reject(new Error(t("docs.indispo")));
  var ancien = (c.identite.fichiers || {})[champ];
  return d.deposer(c.id, champ, file).then(function(m){
    c.identite.fichiers = Object.assign({cv: null, portfolio: null}, c.identite.fichiers);
    c.identite.fichiers[champ] = {id: m.id, nom: m.nom, type: m.type, taille: m.taille, le: m.deposeLe, par: S.me() || ""};
    c.identite[champ] = "";
    trace(c, "depot", champ, m.nom);
    return (ancien ? d.retirerFichier(c.id, ancien.id).catch(function(){}) : Promise.resolve()).then(function(){ return S.saveCandidate(c); });
  });
}
function choisir(champEl, file){
  var h = hote(champEl), c = h && h.get(), champ = champEl.dataset.doc, m = controle(file);
  if(!c) return;
  if(m){ message(champEl, m); return; }
  if(mode === "creation" && champEl.dataset.docCtx === "modal"){ attente[champ] = file; c.identite[champ] = ""; redessinerModal(); return; }
  message(champEl, t("docs.envoi", {nom: file.name}));
  champEl.classList.add("busy");
  Promise.resolve(h.avant ? h.avant() : null).then(function(){ return deposer(c, champ, file); }).then(function(x){
    if(h.relu) h.relu(x); h.redessiner(); YEITA.flash(null, t("docs.depose", {champ: t("ajout." + champ)}));
  }, function(e){ champEl.classList.remove("busy"); message(champEl, e.message); });
}
function retirer(champEl){
  var h = hote(champEl), c = h && h.get(), champ = champEl.dataset.doc; if(!c) return;
  var f = (c.identite.fichiers || {})[champ];
  if(mode === "creation" && champEl.dataset.docCtx === "modal"){ delete attente[champ]; c.identite[champ] = ""; redessinerModal(); return; }
  if(!f){ c.identite[champ] = ""; trace(c, "retraitLien", champ, ""); h.changer(); h.redessiner(); return; }
  Promise.resolve(h.avant ? h.avant() : null).then(function(){ return depot().retirerFichier(c.id, f.id); }).then(function(){
    c.identite.fichiers[champ] = null; trace(c, "retrait", champ, f.nom);
    return S.saveCandidate(c);
  }).then(function(x){ if(h.relu) h.relu(x); h.redessiner(); YEITA.flash(null, t("docs.retire", {champ: t("ajout." + champ)})); },
    function(e){ message(champEl, e.message); });
}
function editerLien(champEl){
  var h = hote(champEl), c = h && h.get(), champ = champEl.dataset.doc; if(!c) return;
  var box = champEl.querySelector(".docbox"), id = champEl.querySelector(".lab").id.replace(/-l$/, "-url");
  box.innerHTML = '<label for="' + id + '" class="sr-only">' + E(t("docs.lienDe", {champ: t("ajout." + champ)})) + '</label><input type="url" id="' + id + '" data-doc-url placeholder="https://" value="' + E(c.identite[champ] || "") + '" autocomplete="off">'
    + '<span class="docacts"><button type="button" class="btn small" data-doc-act="ok">' + E(t("docs.ok")) + '</button><button type="button" class="btn small quiet" data-doc-act="annuler">' + E(t("commun.annuler")) + '</button></span>';
  box.querySelector("input").focus();
}
function validerLien(champEl){
  var h = hote(champEl), c = h.get(), champ = champEl.dataset.doc, v = champEl.querySelector("[data-doc-url]").value.trim();
  if(v && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v)){ message(champEl, t("docs.erreurLien")); champEl.querySelector("[data-doc-url]").focus(); return; }
  var f = (c.identite.fichiers || {})[champ];
  c.identite[champ] = v;
  if(v && mode !== "creation") trace(c, "lien", champ, lienCourt(v));
  if(v && mode === "creation") delete attente[champ];
  var suite = (v && f && depot()) ? depot().retirerFichier(c.id, f.id).then(function(){ c.identite.fichiers[champ] = null; trace(c, "retrait", champ, f.nom); }, function(){}) : Promise.resolve();
  suite.then(function(){ h.changer(); h.redessiner(); var n = document.querySelector('[data-doc-ctx="' + champEl.dataset.docCtx + '"][data-doc="' + champ + '"] .docbox a, [data-doc-ctx="' + champEl.dataset.docCtx + '"][data-doc="' + champ + '"] .docbtn'); if(n) n.focus(); });
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
    var cr = e.target.closest("[data-mc-creer]"); if(cr && dlg){ valider(cr.dataset.mcCreer, cr); return; }
    var da = e.target.closest("[data-doc-act]");
    if(da){
      var ch = da.closest("[data-doc]"), a = da.dataset.docAct;
      if(a === "fichier") ch.querySelector("[data-doc-file]").click();
      else if(a === "lien") editerLien(ch);
      else if(a === "ok") validerLien(ch);
      else if(a === "annuler") hote(ch).redessiner();
      else if(a === "retirer") retirer(ch);
      return;
    }
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
    var u = e.target.closest && e.target.closest("[data-doc-url]");
    if(u && e.key === "Enter"){ e.preventDefault(); validerLien(u.closest("[data-doc]")); return; }
    if(u && e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); hote(u).redessiner(); return; }
    if(!menuEl || !menuEl.contains(document.activeElement)) return;
    var items = Array.prototype.slice.call(menuEl.querySelectorAll("[role=menuitem]")), i = items.indexOf(document.activeElement);
    if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); fermerMenu(true); }
    else if(e.key === "ArrowDown"){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if(e.key === "Home"){ e.preventDefault(); items[0].focus(); }
    else if(e.key === "End"){ e.preventDefault(); items[items.length - 1].focus(); }
    else if(e.key === "Tab"){ fermerMenu(false); }
  }, true);
  /* Fichier choisi, ou glissé sur le champ */
  document.addEventListener("change", function(e){
    if(!e.target.matches || !e.target.matches("[data-doc-file]")) return;
    var file = e.target.files && e.target.files[0]; if(file) choisir(e.target.closest("[data-doc]"), file); e.target.value = "";
  });
  /* Glisser un fichier sur un champ vide qui propose le dépôt */
  function zone(e){ var z = e.target.closest && e.target.closest("[data-doc] .docbox"); return z && z.querySelector('[data-doc-act="fichier"]') ? z : null; }
  ["dragenter", "dragover"].forEach(function(ev){ document.addEventListener(ev, function(e){ var z = zone(e); if(z){ e.preventDefault(); z.classList.add("drop"); } }); });
  document.addEventListener("dragleave", function(e){ var z = zone(e); if(z) z.classList.remove("drop"); });
  document.addEventListener("drop", function(e){
    var z = zone(e); if(!z) return;
    e.preventDefault(); z.classList.remove("drop");
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(file) choisir(z.closest("[data-doc]"), file);
  });
  /* Les champs de la fenêtre (consultation : contrôlés et enregistrés au fil de la saisie ; création : gardés jusqu'au pied) */
  function champ(e){
    if(!copie || !dlg || !dlg.contains(e.target)) return;
    var k = e.target.dataset && e.target.dataset.mfiche, err = document.getElementById("mf-err");
    if(k){
      if(e.type === "input" && (e.target.tagName !== "INPUT" || e.target.type === "date" || e.target.type === "number")) return;
      if(e.type === "change" && e.target.tagName === "INPUT" && e.target.type !== "date" && e.target.type !== "number") return;
      if(e.target.value === "__autre") return;
      if(mode === "creation"){ copie.identite[k] = e.target.value; if(e.target.getAttribute("aria-invalid")){ e.target.removeAttribute("aria-invalid"); e.target.removeAttribute("aria-describedby"); err.hidden = true; } return; }
      if(appliquer(copie, k, e.target.value, e.target, err)) plusTard();
      return;
    }
    if(e.type === "change" && e.target.matches("[data-mfiche-prov]")){ copie.identite.provenances = Array.prototype.map.call(dlg.querySelectorAll("[data-mfiche-prov]:checked"), function(x){ return x.value; }); plusTard(); }
  }
  document.addEventListener("input", champ);
  document.addEventListener("change", champ);
  document.addEventListener("tagschange", function(e){ if(copie && dlg && e.target.closest('[data-tags="mf-rec"]')){ copie.identite.recruteurs = UI.tagsValues(e.target.closest(".tags")); plusTard(); } });
  window.addEventListener("pagehide", function(){ if(saveT && copie && mode !== "creation"){ clearTimeout(saveT); saveT = null; D.partir(copie); } });
}

window.MC = {bouton: bouton, init: init, creer: creer, infosHTML: infosHTML, appliquer: appliquer, histHTML: histHTML, docHTML: docHTML, fermerMenu: fermerMenu};
})();
