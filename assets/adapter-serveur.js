/* Adaptateur serveur pour assets/dossier.js : list, get, put, remove en promesses, comme l'adaptateur du navigateur,
   mais vers l'API (api/, contrat dans api/README.md). Branché par assets/demarrage.js quand /api/moi répond.

   L'adaptateur retient la version lue de chaque dossier : pour l'objet rendu (un objet ancien ne passe pas sans être
   relu) et, à défaut, par identifiant (la plus haute reçue). Les requêtes d'un même dossier partent l'une après l'autre.
   Il ne retente jamais seul : un conflit (409) est rendu à la page, qui affiche le message et propose de recharger.
   Forme reprise de l'ancien adaptateur Supabase (git show a86b6f4:assets/adapter-supabase.js). */
(function(){
"use strict";
/* Le motif de uid() (assets/dossier.js), le même que l'API (api/src/valeurs.js, MOTIF_ID). */
var MOTIF_ID = /^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$/;

function textes(){ return (window.WORDING && WORDING.serveur) || {}; }
function msg(cle, defaut){ return textes()[cle] || defaut; }
var DEFAUT = {
  conflit: "La candidature a été modifiée par quelqu'un d'autre. Recharge la page.",
  horsEquipe: "Tu ne fais pas partie de l'équipe.",
  lectureSeule: "Lecture seule : tu ne peux pas modifier.",
  reseau: "La base ne répond pas. Vérifie ta connexion, puis réessaie.",
  identifiant: "Identifiant invalide pour « {nom} » : ce dossier ne peut pas être enregistré dans la base."
};
function texte(cle, vars){
  var t = msg(cle, DEFAUT[cle]);
  Object.keys(vars || {}).forEach(function(k){ t = t.split("{" + k + "}").join(vars[k]); });
  return t;
}
function erreur(code, message, status){ var e = new Error(message); e.code = code; e.status = status || 0; return e; }
var MESSAGE_CODE = {"conflit": "conflit", "hors-equipe": "horsEquipe", "lecture-seule": "lectureSeule"};

/* Classement d'une réponse, dans l'ordre de la spec (§ API et intégrations) ; le 404 du démarrage est classé par demarrage.js.
   Rend {type: "ok", status, json} | {type: "401"} | {type: "erreur", erreur}. */
function lire(res){
  if(res.status === 401) return Promise.resolve({type: "401"});
  if(res.status === 204) return Promise.resolve({type: "ok", status: 204, json: null});
  var ct = (res.headers && res.headers.get("content-type")) || "";
  if(ct.indexOf("application/json") < 0) return Promise.resolve({type: "erreur", erreur: erreur("reseau", texte("reseau"), res.status)});
  return res.json().then(function(json){
    if(res.ok) return {type: "ok", status: res.status, json: json};
    var code = json && typeof json.code === "string" ? json.code : null;
    if(code) return {type: "erreur", erreur: erreur(code, MESSAGE_CODE[code] ? texte(MESSAGE_CODE[code]) : String(json.erreur || ""), res.status)};
    return {type: "erreur", erreur: erreur("api", String((json && json.erreur) || texte("reseau")), res.status)};
  }, function(){ return {type: "erreur", erreur: erreur("reseau", texte("reseau"), res.status)}; });
}

/* opts : base (préfixe des adresses, "../api/" par défaut), sur401() (rend une promesse qui ne se résout pas : la page
   se recharge ou se bloque), surErreur(erreur) (le bandeau), fetch (pour les tests). */
function AdaptateurServeur(opts){
  opts = opts || {};
  var base = opts.base || "../api/";
  var faire = opts.fetch || function(u, o){ return window.fetch(u, o); };
  var parObjet = new WeakMap();   /* objet dossier → version lue ou écrite */
  var parId = {};                 /* id → plus haute version reçue */
  var supprimes = {};             /* id supprimés depuis cette page */
  var enCours = {};               /* id → {objet, version} du PUT en cours */
  var files = {};                 /* id → dernière requête de la file */

  function retenir(id, d, v){
    if(d && typeof d === "object") parObjet.set(d, v);
    if(!(id in parId) || v > parId[id]) parId[id] = v;
  }
  function adresse(id){ return base + "candidats" + (id === undefined ? "" : "/" + encodeURIComponent(id)); }
  function envoyer(methode, url, corps, keepalive){
    var o = {method: methode, headers: {"Accept": "application/json"}, cache: "no-store", credentials: "same-origin"};
    if(corps !== undefined){ o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(corps); }
    if(keepalive) o.keepalive = true;
    return faire(url, o).then(lire, function(){ return {type: "erreur", erreur: erreur("reseau", texte("reseau"))}; });
  }
  /* Rejet visible : le bandeau, puis la promesse rejetée. Un 401 ne rejette pas : la page se recharge.
     ecriture : l'erreur vient d'un enregistrement (le bandeau ajoute que la saisie n'est pas enregistrée). */
  function echec(e, ecriture){ if(ecriture) e.ecriture = true; if(opts.surErreur) opts.surErreur(e); return Promise.reject(e); }
  function suite(r, ok){
    if(r.type === "401") return opts.sur401 ? opts.sur401() : new Promise(function(){});
    if(r.type === "ok") return ok(r);
    return null;
  }
  function enFile(id, fn){
    var p = (files[id] || Promise.resolve()).then(fn, fn);
    files[id] = p.catch(function(){});
    return p;
  }

  return {
    name: "serveur",
    volatile: false,
    list: function(){
      return envoyer("GET", adresse()).then(function(r){
        var s = suite(r, function(r){
          return r.json.map(function(env){ var d = DOSSIER.upgrade(env.data); retenir(env.id, d, env.version); return d; });
        });
        return s || echec(r.erreur);
      });
    },
    get: function(id){
      if(!MOTIF_ID.test(String(id || ""))) return Promise.resolve(null);
      return enFile(id, function(){
        return envoyer("GET", adresse(id)).then(function(r){
          var s = suite(r, function(r){ var d = DOSSIER.upgrade(r.json.data); retenir(id, d, r.json.version); return d; });
          if(s) return s;
          if(r.erreur.code === "introuvable" || r.erreur.status === 400) return null;
          return echec(r.erreur);
        });
      });
    },
    put: function(d){
      var id = d && d.id;
      if(!MOTIF_ID.test(String(id || ""))) return echec(erreur("identifiant", texte("identifiant", {nom: (d && d.candidat && d.candidat.nom) || id || ""})), true);
      return enFile(id, function(){
        if(supprimes[id]) return echec(erreur("conflit", texte("conflit")), true);
        var v = parObjet.has(d) ? parObjet.get(d) : (id in parId ? parId[id] : null);
        enCours[id] = {objet: d, version: v};
        return envoyer("PUT", adresse(id), {version: v, data: d}).then(function(r){
          delete enCours[id];
          var s = suite(r, function(r){ retenir(id, d, r.json.version); return d; });
          return s || echec(r.erreur, true);
        });
      });
    },
    remove: function(id){
      if(!MOTIF_ID.test(String(id || ""))) return Promise.resolve(null);
      return enFile(id, function(){
        return envoyer("DELETE", adresse(id)).then(function(r){
          var s = suite(r, function(){ supprimes[id] = true; delete parId[id]; return undefined; });
          if(s !== null) return s;
          if(r.erreur.code === "introuvable"){ supprimes[id] = true; delete parId[id]; return undefined; }
          return echec(r.erreur, true);
        });
      });
    },
    /* Départ de la page (pagehide) : part aussitôt, hors de la file, avec keepalive. d est posé sur base (le dernier
       dossier lu ou écrit par la page, ou l'objet du PUT en cours) : il porte la version de base, ou celle que le PUT en
       cours produira. Jamais la plus haute connue : elle pourrait couvrir des parties que d n'a pas (revue de code, Q1).
       Un refus ne peut plus être affiché (H5). */
    partir: function(d, base){
      var id = d && d.id;
      if(!MOTIF_ID.test(String(id || "")) || supprimes[id]) return Promise.resolve(null);
      base = base || d;
      var vol = enCours[id];
      var v = (vol && vol.objet === base) ? (vol.version === null ? 1 : vol.version + 1) : (parObjet.has(base) ? parObjet.get(base) : null);
      return envoyer("PUT", adresse(id), {version: v, data: d}, true).then(function(r){
        if(r.type === "ok") retenir(id, d, r.json.version);
        return r.type === "ok" ? d : null;
      });
    },
    /* Fichiers d'un candidat (1.10) : envoi brut (type du fichier, nom dans X-Nom-Fichier), adresse de lecture, retrait. */
    deposer: function(id, champ, fichier){
      if(!MOTIF_ID.test(String(id || ""))) return echec(erreur("identifiant", texte("identifiant", {nom: id || ""})), true);
      var o = {method: "POST", cache: "no-store", credentials: "same-origin", body: fichier,
        headers: {"Accept": "application/json", "Content-Type": fichier.type || "application/octet-stream", "X-Nom-Fichier": encodeURIComponent(fichier.name || "")}};
      return faire(adresse(id) + "/fichiers?champ=" + encodeURIComponent(champ), o).then(lire, function(){ return {type: "erreur", erreur: erreur("reseau", texte("reseau"))}; })
        .then(function(r){ var s = suite(r, function(r){ return r.json; }); return s || Promise.reject(r.erreur); });
    },
    fichierUrl: function(id, fid){ return adresse(id) + "/fichiers/" + encodeURIComponent(fid); },
    retirerFichier: function(id, fid){
      return envoyer("DELETE", adresse(id) + "/fichiers/" + encodeURIComponent(fid)).then(function(r){
        var s = suite(r, function(){ return undefined; });
        if(s !== null) return s;
        if(r.erreur.code === "fichier-introuvable") return undefined;
        return Promise.reject(r.erreur);
      });
    },
    /* L'objet du PUT en cours pour cet identifiant, ou null (départ des fiches : leur partie se pose dessus). */
    enVol: function(id){ return enCours[id] ? enCours[id].objet : null; },
    /* Version gardée pour un objet (tests). */
    version: function(d){ return parObjet.has(d) ? parObjet.get(d) : null; }
  };
}
AdaptateurServeur.lire = lire;
AdaptateurServeur.MOTIF_ID = MOTIF_ID;
AdaptateurServeur.texte = texte;
window.AdaptateurServeur = AdaptateurServeur;
})();
