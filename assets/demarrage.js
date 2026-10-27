/* Le démarrage des pages de candidatures/ : choisit où vivent les dossiers, avant toute lecture.
   - L'API répond à /api/moi (200) : mode serveur. Les dossiers, l'équipe et les options passent par elle
     (assets/adapter-serveur.js), « Qui es-tu ? » devient le prénom du compte.
   - Pas d'API sur ce site (404, hors du site de production) ou page ouverte en file:// : mode navigateur, comme avant.
   - Tout le reste (session expirée, compte hors équipe, panne, pas de réponse en 10 s, 404 en production) : rien n'est lu
     ni écrit, un bandeau dit pourquoi. Jamais d'enregistrement silencieux dans le navigateur en production.
   Chaque page attend DEMARRAGE.pret avant sa première lecture ; jusque-là, un adaptateur d'attente retient les appels.
   Chargé après dossier.js, qui.js, store.js, adapter-serveur.js. */
(function(){
"use strict";
var D = window.DOSSIER, A = window.AdaptateurServeur;
var DELAI = window.DEMARRAGE_DELAI || 10000;   /* au-delà, mode bloqué (DEMARRAGE_DELAI : tests) */
var GARDE_401 = "yeita-rechargement-401", FENETRE_401 = 60000;
var mode = "attente", resoudre, choisi = null, bandeau = null, retours = [];
var pret = new Promise(function(r){ resoudre = r; });
var local = D.adapter();

function W(){ return (window.WORDING && WORDING.serveur) || {}; }
function t(cle){ return W()[cle] || A.texte(cle); }

/* ---------- Adaptateur d'attente : tout appel attend le choix du mode ; en mode bloqué, rien ne part ---------- */
function plusTard(nom){ return function(){ var args = arguments; return pret.then(function(){ return choisi[nom].apply(choisi, args); }); }; }
D.use({name: "attente", volatile: false, list: plusTard("list"), get: plusTard("get"), put: plusTard("put"), remove: plusTard("remove")});
if(window.QUI) QUI.attente();
var enMemoire = [];
if(window.STORE) STORE.sourceDispos({ajouts: function(){ return enMemoire; }, ajouter: function(l){ enMemoire.push(l); }});

/* ---------- Bandeau ---------- */
/* cas : l'erreur (code, ecriture) ou rien. Lecture seule : message seul ; enregistrement refusé : la saisie n'est pas gardée. */
function erreur(message, cas){
  cas = cas || {};
  var E = (window.YEITA && YEITA.esc) || function(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var lecture = cas.code === "lecture-seule";
  var el = document.createElement("div");
  el.className = "notice err demarrage-bandeau";
  el.setAttribute("role", "alert");
  el.setAttribute("style", "position:sticky;top:0;z-index:60;margin:0 0 8px;border-radius:0 0 12px 12px");
  el.innerHTML = '<span>' + E(message) + '</span>'
    + (cas.ecriture && !lecture ? '<span>' + E(t("saisie")) + '</span>' : '')
    + (lecture ? '' : '<button type="button" data-recharger>' + E(t("recharger")) + '</button>');
  el.addEventListener("click", function(e){ if(e.target && e.target.hasAttribute && e.target.hasAttribute("data-recharger")) location.reload(); });
  if(bandeau && bandeau.remove) bandeau.remove();
  bandeau = el;
  document.body.insertBefore(el, document.body.firstChild || null);
  return el;
}
function effacer(){ if(bandeau && bandeau.remove) bandeau.remove(); bandeau = null; }

/* ---------- Les modes ---------- */
function bloquer(message, cas){ mode = "bloque"; erreur(message, cas || {}); }
function navigateur(){
  mode = "navigateur"; choisi = local; D.use(local);
  D.onRefus = function(e){ erreur(e.message, e); };   /* une fiche refusée (autre onglet) le dit aussi dans ce mode */
  if(window.QUI) QUI.local();
  if(window.STORE) STORE.sourceDispos(null);
  resoudre();
}
/* Un 401 : la session oauth2-proxy a expiré, la page se recharge (oauth2-proxy renvoie vers Google). Un second 401 moins
   de 60 s après un tel rechargement : l'identité n'arrive pas à l'API, on s'arrête au lieu de recharger sans fin. */
function sur401(){
  var avant = 0;
  try{ avant = Number(sessionStorage.getItem(GARDE_401)) || 0; }catch(e){}
  if(avant && Date.now() - avant < FENETRE_401){ bloquer(t("session")); return new Promise(function(){}); }
  /* Sans stockage de session, la garde ne tiendrait pas : on s'arrête au lieu de risquer une boucle. */
  try{ sessionStorage.setItem(GARDE_401, String(Date.now())); }catch(e){ bloquer(t("session")); return new Promise(function(){}); }
  location.reload();
  return new Promise(function(){});
}
function lireApi(chemin){
  return fetch("../api/" + chemin, {headers: {"Accept": "application/json"}, cache: "no-store", credentials: "same-origin"})
    .then(A.lire, function(){ return {type: "erreur", erreur: {code: "reseau", message: t("reseau")}}; });
}
function serveur(moi){
  Promise.all([lireApi("equipe"), lireApi("options-disponibilite")]).then(function(rs){
    if(rs.some(function(r){ return r.type === "401"; })) return sur401();
    if(!rs.every(function(r){ return r.type === "ok" && Array.isArray(r.json); })) return bloquer(t("reseau"));
    var options = rs[1].json.slice();
    choisi = A({sur401: sur401, surErreur: function(e){ erreur(e.message, e); }});
    D.use(choisi);
    D.onRefus = function(e){ erreur(e.message, e); };
    D.onRetabli = effacer;
    if(window.QUI) QUI.compte(moi, rs[0].json.map(function(m){ return m.prenom; }));
    if(window.STORE) STORE.sourceDispos({
      ajouts: function(){ return options; },
      ajouter: function(libelle){
        options.push(libelle);
        fetch("../api/options-disponibilite", {method: "POST", headers: {"Accept": "application/json", "Content-Type": "application/json"},
          body: JSON.stringify({libelle: libelle}), cache: "no-store", credentials: "same-origin"})
          .then(A.lire, function(){ return {type: "erreur", erreur: {code: "reseau", message: t("reseau")}}; })
          .then(function(r){
            if(r.type === "401") return sur401();
            if(r.type === "ok" && Array.isArray(r.json)){ options.length = 0; Array.prototype.push.apply(options, r.json); return; }
            erreur(r.erreur.message, r.erreur);
          });
      }
    });
    mode = "serveur";
    resoudre();
  });
}
/* Nom d'hôte comparé tel que le navigateur le résout : casse et point final ignorés (recrutement.yeita.fr. est le même site).
   En cas de doute, on se considère en production : bloquer vaut mieux qu'un repli silencieux. */
function hoteDeProduction(){
  function nom(h){ return String(h || "").toLowerCase().replace(/\.+$/, ""); }
  try{ return nom(new URL(YEITA.SITE).hostname) === nom(location.hostname); }catch(e){ return true; }
}

function demarrer(){
  if(location.protocol === "file:") return navigateur();
  var fini = false;
  var minuteur = setTimeout(function(){ if(!fini){ fini = true; bloquer(t("reseau")); } }, DELAI);
  fetch("../api/moi", {headers: {"Accept": "application/json"}, cache: "no-store", credentials: "same-origin"}).then(function(res){
    if(fini) return;
    /* Le 404 se classe avant le corps : celui d'un serveur statique est en HTML. */
    if(res.status === 404){ fini = true; clearTimeout(minuteur); return hoteDeProduction() ? bloquer(t("reseau")) : navigateur(); }
    return A.lire(res).then(function(r){
      if(fini) return;
      fini = true; clearTimeout(minuteur);
      if(r.type === "401") return sur401();
      if(r.type === "ok") return (r.json && typeof r.json.prenom === "string" && r.json.prenom.trim()) ? serveur(r.json) : bloquer(t("reseau"));
      return bloquer(r.erreur.code === "hors-equipe" ? t("horsEquipe") : r.erreur.message, r.erreur);
    });
  }, function(){ if(!fini){ fini = true; clearTimeout(minuteur); bloquer(t("reseau")); } });
}

/* ---------- Retour sur l'onglet : en mode serveur, les pages relisent (les écoutes storage ne voient rien) ---------- */
document.addEventListener("visibilitychange", function(){
  if(mode !== "serveur" || document.visibilityState !== "visible") return;
  retours.forEach(function(fn){ try{ fn(); }catch(e){} });
});

window.DEMARRAGE = {
  pret: pret,
  mode: function(){ return mode; },
  auRetour: function(fn){ retours.push(fn); },
  erreur: erreur,
  effacer: effacer
};
demarrer();
})();
