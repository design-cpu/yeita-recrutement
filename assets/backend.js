/* OBSOLÈTE (23 octobre 2026) : piste Supabase abandonnée. Authentification (oauth2-proxy, SSO Google @yeita.fr) et stockage (SQLite, serveur OVH)
   sont pris en charge par Sacha. Fichier gardé pour mémoire, à ne pas brancher. Modèle qui fait foi : docs/backend/MODELE.md. */
/* Branchement de la base partagée (Supabase). PRÉPARÉ, NON CHARGÉ : aucune page n'inclut ce fichier.
   Le jour du GO, chaque page qui lit des candidatures charge, dans cet ordre, après assets/dossier.js (et store.js) :
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
     <script src="assets/backend-config.js"></script>      (copie de docs/backend/config.example.js)
     <script src="assets/adapter-supabase.js"></script>
     <script src="assets/backend.js"></script>
   puis attend YEITA_BACKEND.ready avant sa première lecture. Détail : docs/backend/README.md.

   Sans configuration, ou si la bibliothèque ne charge pas, rien ne change : le module reste dans le navigateur. */
(function(){
"use strict";
var B = {actif: false, ready: Promise.resolve(null), client: null, moi: null, onChange: function(){}, signOut: function(){}};
window.YEITA_BACKEND = B;
var cfg = window.YEITA_BACKEND_CONFIG;
if(!cfg || !cfg.url || !cfg.anonKey || !window.supabase || !window.SupabaseAdapter || !window.DOSSIER) return;

var client = window.supabase.createClient(cfg.url, cfg.anonKey, {auth: {persistSession: true, detectSessionInUrl: true}});
B.client = client; B.actif = true;
var E = function(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
var DOMAINE = cfg.domaine || "yeita.fr";

/* La page attend : connexion, puis appartenance à l'équipe, puis l'adaptateur est branché. */
B.ready = client.auth.getSession().then(function(r){
  var s = r.data && r.data.session;
  if(!s){ gate(); return new Promise(function(){}); }
  return client.rpc("moi").then(function(m){
    var me = m.data && m.data[0];
    if(!me){ refused(s.user && s.user.email); return new Promise(function(){}); }
    B.moi = me;
    DOSSIER.use(SupabaseAdapter(client));
    if(window.STORE) STORE.setMe(me.prenom);   /* le prénom du compte remplace le choix « Tu es » */
    return me;
  });
});

/* Mises à jour en direct : un passage fait par un autre recruteur redessine la page (si activé dans schema.sql). */
B.onChange = function(fn){
  B.ready.then(function(){
    client.channel("candidats").on("postgres_changes", {event: "*", schema: "public", table: "candidats"}, function(p){ fn(p.new && p.new.id || p.old && p.old.id); }).subscribe();
  });
};
B.signOut = function(){ return client.auth.signOut().then(function(){ location.reload(); }); };

/* ---------- Écran de connexion : un lien envoyé par e-mail, réservé aux adresses de l'équipe ---------- */
function panel(html){
  var d = document.getElementById("yb-gate") || document.createElement("div");
  d.id = "yb-gate";
  d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "yb-t");
  d.style.cssText = "position:fixed; inset:0; z-index:50; background:var(--paper); display:grid; place-items:center; padding:24px max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px)); overflow:auto";
  d.innerHTML = '<div class="panel" style="max-width:460px; width:100%; display:grid; gap:14px">' + html + '</div>';
  if(!d.parentNode) document.body.appendChild(d);
  var f = d.querySelector("input, button, a"); if(f) f.focus();
  return d;
}
function gate(){
  var d = panel('<h1 id="yb-t" style="font-size:26px">Espace recrutement Yeita</h1>'
    + '<p>Les candidatures sont réservées à l\'équipe. Indique ton adresse <b>@' + E(DOMAINE) + '</b> : tu reçois un lien de connexion par e-mail.</p>'
    + '<form id="yb-form" class="field" novalidate><label for="yb-mail">Ton adresse e-mail</label>'
    + '<input type="email" id="yb-mail" autocomplete="email" required placeholder="prenom@' + E(DOMAINE) + '">'
    + '<p class="form-err" id="yb-err" role="alert" hidden style="color:var(--stop); font-weight:600"></p>'
    + '<div class="actions" style="margin-top:6px"><button type="submit" class="btn primary">Recevoir le lien</button></div></form>');
  d.querySelector("#yb-form").addEventListener("submit", function(e){
    e.preventDefault();
    var mail = d.querySelector("#yb-mail").value.trim().toLowerCase(), er = d.querySelector("#yb-err");
    if(!new RegExp("^[^@\\s]+@" + DOMAINE.replace(/\./g, "\\.") + "$").test(mail)){ er.textContent = "Utilise ton adresse @" + DOMAINE + "."; er.hidden = false; return; }
    er.hidden = true;
    client.auth.signInWithOtp({email: mail, options: {emailRedirectTo: location.href.split("#")[0] + location.hash, shouldCreateUser: false}}).then(function(r){
      if(r.error){ er.textContent = "Lien non envoyé. Vérifie l'adresse, ou demande à être ajouté à l'équipe."; er.hidden = false; return; }
      panel('<h1 id="yb-t" style="font-size:26px">Regarde tes e-mails</h1><p>Un lien de connexion part vers <b>' + E(mail) + '</b>. Ouvre-le dans ce navigateur : la page s\'ouvrira directement.</p>');
    });
  });
}
function refused(mail){
  panel('<h1 id="yb-t" style="font-size:26px">Accès non ouvert</h1>'
    + '<p>Le compte <b>' + E(mail || "") + '</b> ne fait pas partie de l\'équipe recrutement. Demande à être ajouté, puis reconnecte-toi.</p>'
    + '<div class="actions"><button type="button" class="btn" id="yb-out">Changer de compte</button></div>');
  document.getElementById("yb-out").addEventListener("click", B.signOut);
}
})();
