/* Briques d'interface communes aux pages de l'espace Candidatures :
   textes (WORDING), liens directs, pastille d'État et son menu, aides en infobulle, recruteurs, copie de lien. */
(function(){
"use strict";
var E = YEITA.esc, S = window.STORE, D = window.DOSSIER;

/* ---------- Textes ---------- */
/* t("tableau.ajouter") ou t("fiche.passageFait", {de: …}) : lit assets/wording.fr.js et remplace les {variables}. */
function t(path, vars){
  var v = path.split(".").reduce(function(o, k){ return o && o[k] !== undefined ? o[k] : undefined; }, window.WORDING || {});
  if(typeof v !== "string") v = path;
  return v.replace(/\{(\w+)\}/g, function(m, k){ return vars && vars[k] !== undefined ? vars[k] : m; });
}
function etapeLabel(id, court){ var e = window.PARCOURS && PARCOURS.etape(id); return e ? (court ? e.court : e.label) : id; }
function etatLabel(id){ return t("etats." + id); }

/* ---------- Dates ---------- */
function fmtDay(iso){ if(!iso) return ""; var d = new Date(String(iso).length === 10 ? iso + "T12:00:00" : iso); return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", {day: "numeric", month: "short"}); }
function fmtWhen(iso){ if(!iso) return ""; try{ return new Date(iso).toLocaleString("fr-FR", {day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"}); }catch(e){ return ""; } }
function heure(){ return new Date().toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"}); }

/* ---------- Liens directs : un candidat, une étape. L'identifiant est opaque : jamais le nom dans l'adresse. ---------- */
/* EC1 et EC2 ont leur page (la fiche en pleine page) ; les autres étapes vivent dans candidat.html. */
function urlCandidat(id, etape){
  if(etape === "ec1" || etape === "ec2") return etape + ".html?id=" + encodeURIComponent(id);
  return "candidat.html?id=" + encodeURIComponent(id) + (etape ? "&etape=" + encodeURIComponent(etape) : "");
}
function absolu(rel){ try{ return new URL(rel, location.href).href; }catch(e){ return rel; } }
function param(k){ try{ return new URLSearchParams(location.search).get(k); }catch(e){ return null; } }
function copier(btn, rel){
  var url = absolu(rel);
  YEITA.copy(url, function(ok){ YEITA.flash(btn, ok ? t("tableau.lienCopie") : url); });
}
function lienHTML(id, etape, label){
  return '<button type="button" class="iconbtn" data-copy="' + E(urlCandidat(id, etape)) + '" aria-describedby="aide-lien">'
    + YEITA.icon("Link", 15, 2.2) + E(label || t("tableau.copierLien")) + '</button>';
}

/* ---------- Résumés ---------- */
function jobXp(c){
  var i = c.identite, x = i.xp;
  var xp = x === null || x === undefined || x === "" ? t("tableau.xpVide") : (Number(x) === 1 ? t("tableau.xpUn") : t("tableau.xp", {n: String(x).replace(".", ",")}));
  return (i.job || "") + " · " + xp;
}
function initiales(nom){
  var m = D.decoupe(nom); var a = (m.prenom || "").charAt(0), b = (m.nom || "").charAt(0);
  return ((a + b) || String(nom || "?").slice(0, 2)).toUpperCase();
}
/* Le nom complet d'un membre de l'équipe, d'après config.equipeNoms (« Pauline » → « Pauline … ») ; sinon le nom tel quel. */
function nomComplet(n){ n = String(n || "").trim(); var M = (window.YEITA_CONFIG && YEITA_CONFIG.equipeNoms) || {}; return Object.prototype.hasOwnProperty.call(M, n) && M[n] ? M[n] : n; }
function prenom(n){ var m = D.decoupe(n); return m.prenom || String(n || ""); }
/* Les recruteurs : par leurs initiales sur la carte du kanban (initiales = true), par leur nom complet partout ailleurs. */
function recruteursHTML(list, initiales_){
  list = list || [];
  if(!list.length) return '<span class="ini none">' + E(t("tableau.recruteursVide")) + '</span>';
  var noms = list.map(nomComplet);
  if(initiales_ === true) return '<span class="ini pastilles" title="' + E(noms.join(", ")) + '">' + list.map(function(n){ return '<span aria-hidden="true">' + E(initiales(nomComplet(n))) + '</span>'; }).join("")
    + '<span class="sr-only">' + E(t("tableau.colonnes.recruteurs") + " : " + noms.join(", ")) + '</span></span>';
  return '<span class="ini"><span class="sr-only">' + E(t("tableau.colonnes.recruteurs")) + ' : </span>' + E(noms.join(", ")) + '</span>';
}
function etatHTML(c, interactive){
  var e = c.etat || "a-planifier";
  if(!interactive) return '<span class="etat" data-e="' + E(e) + '">' + E(etatLabel(e)) + '</span>';
  return '<button type="button" class="etat" data-e="' + E(e) + '" data-etat-for="' + E(c.id) + '" aria-haspopup="menu" aria-expanded="false" aria-label="'
    + E(t("tableau.changerEtat", {nom: c.candidat.nom}) + " : " + etatLabel(e)) + '">' + E(etatLabel(e)) + '</button>';
}

/* ---------- Aide en infobulle : une icône « ? » ; la bulle s'ouvre au survol, au focus ou au clic, Échap la ferme ---------- */
var tipN = 0;
function tip(text){
  var id = "tip-" + (++tipN) + "-" + Math.random().toString(36).slice(2, 6);
  return '<span class="tipw"><button type="button" class="tip" aria-describedby="' + id + '" aria-expanded="false" aria-label="' + E(t("commun.aide")) + '">?</button>'
    + '<span class="bubble" role="tooltip" id="' + id + '" hidden>' + E(text) + '</span></span>';
}
function tipShow(btn, on){
  var b = document.getElementById(btn.getAttribute("aria-describedby")); if(!b) return;
  b.hidden = !on; btn.setAttribute("aria-expanded", String(on));
  if(on){ b.style.left = ""; b.style.transform = ""; var r = b.getBoundingClientRect(); if(r.left < 8){ b.style.left = "0"; b.style.transform = "none"; } else if(r.right > innerWidth - 8){ b.style.left = "auto"; b.style.right = "0"; b.style.transform = "none"; } }
}
function closeTips(except){ document.querySelectorAll('.tip[aria-expanded="true"]').forEach(function(b){ if(b !== except) tipShow(b, false); }); }

/* Une bulle flottante, pour expliquer un geste refusé (glisser une carte). */
function floatTip(text, x, y){
  var f = document.getElementById("floattip");
  if(!f){ f = document.createElement("div"); f.id = "floattip"; f.className = "floattip"; f.setAttribute("role", "status"); document.body.appendChild(f); }
  f.textContent = text; f.hidden = false;
  f.style.left = Math.max(8, Math.min(x + 12, innerWidth - 300)) + "px"; f.style.top = Math.max(8, y + 14) + "px";
  clearTimeout(floatTip.t); floatTip.t = setTimeout(function(){ f.hidden = true; }, 3600);
}

/* ---------- Menu de l'État ---------- */
var menuEl = null, menuBtn = null, onEtat = null;
function closeMenu(focusBack){
  if(!menuEl) return;
  menuEl.remove(); menuEl = null;
  if(menuBtn){ menuBtn.setAttribute("aria-expanded", "false"); if(focusBack) menuBtn.focus(); }
  menuBtn = null;
}
function openMenu(btn){
  closeMenu(false);
  var id = btn.dataset.etatFor, cur = btn.dataset.e;
  menuBtn = btn; btn.setAttribute("aria-expanded", "true");
  menuEl = document.createElement("div");
  menuEl.className = "menu"; menuEl.setAttribute("role", "menu"); menuEl.setAttribute("aria-label", btn.getAttribute("aria-label"));
  menuEl.innerHTML = D.ETATS.map(function(e){ return '<button type="button" role="menuitemradio" aria-checked="' + (e === cur) + '" data-set-etat="' + e + '" tabindex="-1"><span class="etat" data-e="' + e + '">' + E(etatLabel(e)) + '</span></button>'; }).join("");
  document.body.appendChild(menuEl);
  var r = btn.getBoundingClientRect(), mh = menuEl.offsetHeight, mw = menuEl.offsetWidth;
  var top = r.bottom + 6 + scrollY; if(r.bottom + mh + 12 > innerHeight && r.top > mh + 12) top = r.top - mh - 6 + scrollY;
  menuEl.style.top = top + "px"; menuEl.style.left = Math.max(8, Math.min(r.left + scrollX, scrollX + innerWidth - mw - 8)) + "px";
  menuEl.dataset.for = id;
  (menuEl.querySelector('[aria-checked="true"]') || menuEl.firstChild).focus();
}

/* ---------- Champ Recruteurs, « à la Notion » : on tape un nom ; s'il existe on le choisit, sinon il est créé ---------- */
function tagsHTML(id, values){
  return '<div class="tags" data-tags="' + E(id) + '">'
    + (values || []).map(function(v){ return '<span class="tg" data-v="' + E(v) + '">' + E(v) + '<button type="button" aria-label="' + E(t("recruteurs.retirer", {nom: v})) + '">×</button></span>'; }).join("")
    + '<input type="text" id="' + E(id) + '" list="' + E(id) + '-l" autocomplete="off" placeholder="' + E(t("recruteurs.placeholder")) + '">'
    + '<datalist id="' + E(id) + '-l">' + QUI.equipe().map(function(n){ return '<option value="' + E(n) + '">'; }).join("") + '</datalist></div>';
}
function tagsValues(box){ return Array.prototype.map.call(box.querySelectorAll(".tg"), function(x){ return x.dataset.v; }); }
function tagsAdd(box, v){
  v = String(v || "").trim().replace(/\s+/g, " "); if(!v) return false;
  if(tagsValues(box).indexOf(v) >= 0) return false;
  QUI.ajouter(v);
  var s = document.createElement("span"); s.className = "tg"; s.dataset.v = v;
  s.innerHTML = E(v) + '<button type="button" aria-label="' + E(t("recruteurs.retirer", {nom: v})) + '">×</button>';
  box.insertBefore(s, box.querySelector("input"));
  return true;
}

/* ---------- Disponibilité : la liste Notion, plus « Autre… » pour ajouter une option ---------- */
function dispoHTML(id, value){
  var opts = S.dispos(); if(value && opts.indexOf(value) < 0) opts.push(value);
  return '<select id="' + E(id) + '" data-dispo><option value=""></option>' + opts.map(function(o){ return '<option' + (o === value ? ' selected' : '') + '>' + E(o) + '</option>'; }).join("")
    + '<option value="__autre">' + E(t("infos.autreDispo")) + '</option></select>';
}

/* ---------- Câblage commun, une fois par page ---------- */
function init(opts){
  opts = opts || {};
  onEtat = opts.onEtat || null;
  document.addEventListener("click", function(e){
    var cp = e.target.closest("[data-copy]"); if(cp){ copier(cp, cp.dataset.copy); return; }
    var tb = e.target.closest(".tip"); if(tb){ e.preventDefault(); var on = tb.getAttribute("aria-expanded") !== "true"; closeTips(tb); tipShow(tb, on); return; }
    closeTips();
    var eb = e.target.closest("[data-etat-for]"); if(eb){ e.preventDefault(); if(menuBtn === eb) closeMenu(true); else openMenu(eb); return; }
    var it = e.target.closest("[data-set-etat]");
    if(it && menuEl){ var id = menuEl.dataset.for, v = it.dataset.setEtat, btn = menuBtn; closeMenu(true); if(onEtat) onEtat(id, v, btn); return; }
    if(menuEl && !e.target.closest(".menu")) closeMenu(false);
    var tg = e.target.closest(".tags .tg button"); if(tg){ var box = tg.closest(".tags"); tg.parentNode.remove(); box.querySelector("input").focus(); box.dispatchEvent(new CustomEvent("tagschange", {bubbles: true})); }
  });
  document.addEventListener("mouseover", function(e){ var tb = e.target.closest && e.target.closest(".tip"); if(tb) tipShow(tb, true); });
  document.addEventListener("mouseout", function(e){ var tb = e.target.closest && e.target.closest(".tip"); if(tb && document.activeElement !== tb) tipShow(tb, false); });
  document.addEventListener("focusin", function(e){ if(e.target.classList && e.target.classList.contains("tip")) tipShow(e.target, true); });
  document.addEventListener("focusout", function(e){ if(e.target.classList && e.target.classList.contains("tip")) tipShow(e.target, false); });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){ if(menuEl){ closeMenu(true); e.stopPropagation(); return; } var open = document.querySelector('.tip[aria-expanded="true"]'); if(open){ tipShow(open, false); return; } }
    if(menuEl && menuEl.contains(document.activeElement)){
      var items = Array.prototype.slice.call(menuEl.querySelectorAll("[role=menuitemradio]")), i = items.indexOf(document.activeElement);
      if(e.key === "ArrowDown"){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if(e.key === "ArrowUp"){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if(e.key === "Home"){ e.preventDefault(); items[0].focus(); }
      if(e.key === "End"){ e.preventDefault(); items[items.length - 1].focus(); }
      if(e.key === "Tab"){ closeMenu(false); }
      return;
    }
    var ti = e.target.closest && e.target.closest(".tags input");
    if(ti){
      var box = ti.closest(".tags");
      if(e.key === "Enter" || e.key === ","){ e.preventDefault(); if(tagsAdd(box, ti.value)){ ti.value = ""; box.dispatchEvent(new CustomEvent("tagschange", {bubbles: true})); } }
      if(e.key === "Backspace" && !ti.value){ var last = box.querySelector(".tg:last-of-type"); if(last){ last.remove(); box.dispatchEvent(new CustomEvent("tagschange", {bubbles: true})); } }
    }
  });
  /* Choisir une suggestion de la liste l'ajoute aussitôt. */
  document.addEventListener("input", function(e){
    var ti = e.target.closest && e.target.closest(".tags input"); if(!ti) return;
    if(e.inputType === "insertReplacementText" || (QUI.equipe().indexOf(ti.value) >= 0 && !e.inputType)){ var box = ti.closest(".tags"); if(tagsAdd(box, ti.value)){ ti.value = ""; box.dispatchEvent(new CustomEvent("tagschange", {bubbles: true})); } }
  });
  /* Ajouter une option de disponibilité. */
  document.addEventListener("change", function(e){
    if(!e.target.matches || !e.target.matches("select[data-dispo]") || e.target.value !== "__autre") return;
    var sel = e.target, wrap = document.createElement("span");
    wrap.className = "dispo-new";
    wrap.innerHTML = '<label class="sr-only" for="' + sel.id + '-n">' + E(t("infos.autreDispoLabel")) + '</label><input type="text" id="' + sel.id + '-n" autocomplete="off" placeholder="' + E(t("infos.autreDispoLabel")) + '" style="margin-top:6px">';
    sel.value = ""; sel.insertAdjacentElement("afterend", wrap);
    var inp = wrap.querySelector("input"); inp.focus();
    function ok(){ var v = inp.value.trim(); wrap.remove(); if(!v){ sel.focus(); return; } S.addDispo(v); var o = document.createElement("option"); o.textContent = v; sel.insertBefore(o, sel.lastElementChild); sel.value = v; sel.focus(); sel.dispatchEvent(new Event("change", {bubbles: true})); }
    inp.addEventListener("keydown", function(k){ if(k.key === "Enter"){ k.preventDefault(); ok(); } if(k.key === "Escape"){ wrap.remove(); sel.focus(); } });
    inp.addEventListener("blur", ok);
  });
}

window.UI = {t: t, etapeLabel: etapeLabel, etatLabel: etatLabel, fmtDay: fmtDay, fmtWhen: fmtWhen, heure: heure,
  urlCandidat: urlCandidat, absolu: absolu, param: param, copier: copier, lienHTML: lienHTML,
  jobXp: jobXp, initiales: initiales, prenom: prenom, nomComplet: nomComplet, recruteursHTML: recruteursHTML, etatHTML: etatHTML, tip: tip, floatTip: floatTip,
  tagsHTML: tagsHTML, tagsValues: tagsValues, tagsAdd: tagsAdd, dispoHTML: dispoHTML, init: init, closeMenu: closeMenu};
})();
