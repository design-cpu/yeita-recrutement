/* OBSOLÈTE (23 octobre 2026) : piste Supabase abandonnée. Authentification (oauth2-proxy, SSO Google @yeita.fr) et stockage (SQLite, serveur OVH)
   sont pris en charge par Sacha. Fichier gardé pour mémoire, à ne pas brancher. Modèle qui fait foi : docs/backend/MODELE.md. */
/* Adaptateur Supabase pour assets/dossier.js : list, get, put, remove, en promesses, comme l'adaptateur du navigateur.
   PRÉPARÉ, NON BRANCHÉ : aucune page ne charge ce fichier. Mise en place : docs/backend/README.md.

   Chaque candidature est une ligne de la table « candidats » (docs/backend/schema.sql) : le dossier v2 tel quel, en JSONB.
   L'adaptateur retient la version lue de chaque ligne. À l'enregistrement, si quelqu'un d'autre a enregistré entre-temps,
   la base refuse et la page affiche le message : on recharge plutôt que d'écraser. */
(function(){
"use strict";
var COLS = "id,data,version";
var MSG = {
  conflit: "La candidature a été modifiée par quelqu'un d'autre. Recharge la page pour voir sa version.",
  existe: "Cette candidature existe déjà dans la base. Recharge la page.",
  acces: "Ton compte n'a pas accès aux candidatures. Demande à être ajouté à l'équipe.",
  reseau: "La base ne répond pas. Vérifie ta connexion, puis réessaie."
};
function fail(e){
  var m = String((e && (e.message || e.details)) || ""), code = e && e.code;
  var text = /conflit/.test(m) ? MSG.conflit
    : code === "23505" ? MSG.existe
    : (code === "42501" || /row-level security|permission denied/i.test(m)) ? MSG.acces
    : (/fetch|network/i.test(m) ? MSG.reseau : "Enregistrement refusé par la base : " + m);
  return Promise.reject(new Error(text));
}
function SupabaseAdapter(client){
  var versions = {};   /* id → version lue */
  function fromRow(r){ versions[r.id] = r.version; return DOSSIER.upgrade(r.data); }
  return {
    name: "supabase",
    volatile: false,
    list: function(){
      return client.from("candidats").select(COLS).order("modifie_le", {ascending: false})
        .then(function(r){ return r.error ? fail(r.error) : r.data.map(fromRow); }, fail);
    },
    get: function(id){
      return client.from("candidats").select(COLS).eq("id", id).maybeSingle()
        .then(function(r){ return r.error ? fail(r.error) : (r.data ? fromRow(r.data) : null); }, fail);
    },
    put: function(d){
      var v = Object.prototype.hasOwnProperty.call(versions, d.id) ? versions[d.id] : null;
      return client.rpc("enregistrer_candidat", {p_id: d.id, p_data: d, p_version: v})
        .then(function(r){
          if(r.error) return fail(r.error);
          var row = Array.isArray(r.data) ? r.data[0] : r.data;
          if(row) versions[d.id] = row.nouvelle_version;
          return d;
        }, fail);
    },
    remove: function(id){
      return client.from("candidats").delete().eq("id", id)
        .then(function(r){ if(r.error) return fail(r.error); delete versions[id]; }, fail);
    },
    /* Après un refus pour conflit : relire la ligne pour repartir de la version de l'autre. */
    forget: function(id){ delete versions[id]; }
  };
}
window.SupabaseAdapter = SupabaseAdapter;
})();
