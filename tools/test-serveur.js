/* Le mode serveur hors navigateur : adaptateur, démarrage, identité et options, contre une fausse API.
   Lancer : node tools/test-serveur.js   (Node 22 ; même chargement que tools/test-store.js) */
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ECHEANCE = 5000;   /* chaque vérification asynchrone échoue avec son message au-delà */

/* ---------- Fausse API : version optimiste comme api/src/candidats.js ---------- */
function fausseApi(){
  const api = {base: {}, appels: [], retard: 0, retardReponse: {}, panne: null, moi: {email: "alice@yeita.fr", prenom: "Alice", role: "recruteur"},
    equipe: [{prenom: "Alice", role: "recruteur"}, {prenom: "Bob", role: "recruteur"}], options: []};
  const rep = (status, corps, type) => ({status, ok: status >= 200 && status < 300,
    headers: {get: k => k.toLowerCase() === "content-type" ? (type === undefined ? (corps === null ? null : "application/json; charset=utf-8") : type) : null},
    json: () => Promise.resolve().then(() => typeof corps === "string" ? JSON.parse(corps) : corps)});
  const traiter = (url, o) => {
    const m = o.method || "GET", u = url.replace(/^\.\.\/api\//, "/api/");
    if(api.panne){ const p = api.panne(u, m, o); if(p) return p; }
    if(u === "/api/moi") return rep(200, api.moi);
    if(u === "/api/equipe") return rep(200, api.equipe);
    if(u === "/api/options-disponibilite"){
      if(m === "POST"){ const l = JSON.parse(o.body).libelle; if(api.options.indexOf(l) < 0) api.options.push(l); return rep(201, api.options.slice()); }
      return rep(200, api.options.slice());
    }
    if(u === "/api/candidats") return rep(200, Object.keys(api.base).map(id => ({id, version: api.base[id].version, data: JSON.parse(api.base[id].data)})));
    const id = decodeURIComponent(u.slice("/api/candidats/".length));
    if(!/^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$/.test(id)) return rep(400, {erreur: "Identifiant invalide."});
    const ligne = api.base[id];
    if(m === "GET") return ligne ? rep(200, {id, version: ligne.version, data: JSON.parse(ligne.data)}) : rep(404, {erreur: "Candidature introuvable.", code: "introuvable"});
    if(m === "DELETE"){ if(!ligne) return rep(404, {erreur: "Candidature introuvable.", code: "introuvable"}); delete api.base[id]; return rep(204, null); }
    if(m === "PUT"){
      if(api.avantPut){ const f = api.avantPut; api.avantPut = null; f(id); }
      const c = JSON.parse(o.body), conflit = {erreur: "La candidature a été modifiée par quelqu'un d'autre. Recharge la page.", code: "conflit"};
      if(c.version === null){ if(ligne) return rep(409, conflit); api.base[id] = {version: 1, data: JSON.stringify(c.data)}; return rep(201, {id, version: 1, data: c.data}); }
      if(!ligne || ligne.version !== c.version) return rep(409, conflit);
      ligne.version++; ligne.data = JSON.stringify(c.data); return rep(200, {id, version: ligne.version, data: c.data});
    }
    return rep(404, {erreur: "Route inconnue."});
  };
  api.fetch = (url, o = {}) => {
    api.appels.push({url, method: o.method || "GET", keepalive: !!o.keepalive, corps: o.body ? JSON.parse(o.body) : null});
    let r;
    try{ r = traiter(url, o); }catch(e){ return Promise.reject(e); }
    if(r && typeof r.then === "function") return r;
    const d = (api.retardReponse[o.method || "GET"] || 0) + api.retard;
    return d ? new Promise(ok => setTimeout(() => ok(r), d)) : Promise.resolve(r);
  };
  api.rep = rep;
  return api;
}

/* ---------- Un « navigateur » : contexte vm avec les scripts de la page ---------- */
function page(api, o = {}){
  const mem = o.mem || {}, sess = {}, ecouteurs = {}, bandeaux = [];
  let recharges = 0;
  const el = () => ({innerHTML: "", hidden: false, textContent: "", children: [], classList: {add(){}, remove(){}}, setAttribute(){}, addEventListener(){}, contains(){ return false; },
    querySelector(){ return null; }, insertBefore(n){ this.children.unshift(n); }, appendChild(n){ this.children.push(n); }, remove(){ this.retire = true; }, focus(){}});
  const body = el();
  const doc = {visibilityState: "visible", body, activeElement: null, readyState: "complete",
    getElementById: id => id === "live" ? null : null, createElement: () => el(), querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (t, f) => { (ecouteurs[t] = ecouteurs[t] || []).push(f); }};
  const ctx = {console, Date, JSON, Math, Promise, Object, Array, String, Error, RegExp, Number, WeakMap, Map, Set, setTimeout, clearTimeout, URL,
    AbortSignal, encodeURIComponent, decodeURIComponent,
    localStorage: {getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }},
    sessionStorage: {getItem: k => sess[k] ?? null, setItem: (k, v) => { sess[k] = String(v); }, removeItem: k => { delete sess[k]; }},
    location: Object.assign({protocol: "https:", hostname: "localhost", reload(){ recharges++; }}, o.location || {}),
    document: doc, fetch: api.fetch, addEventListener: (t, f) => { (ecouteurs[t] = ecouteurs[t] || []).push(f); }};
  ctx.window = ctx; ctx.self = ctx; ctx.top = ctx; vm.createContext(ctx);
  const fichiers = ["assets/yeita.js", "assets/config.js", "assets/wording.fr.js", "assets/dossier.js", "assets/qui.js", "assets/store.js", "assets/adapter-serveur.js"];
  if(o.demarrage !== false) fichiers.push("assets/demarrage.js");
  for(const f of fichiers) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, {filename: f});
  ctx.__mem = mem; ctx.__sess = sess; ctx.__ecouteurs = ecouteurs; ctx.__body = body;
  Object.defineProperty(ctx, "__recharges", {get: () => recharges});
  return ctx;
}

let fails = 0, n = 0;
const ok = (c, m, x) => { n++; console.log((c ? "OK  " : "FAIL") + " " + m + (x !== undefined ? "  " + x : "")); if(!c) fails++; };
const delai = ms => new Promise(r => setTimeout(r, ms));
const echeance = (p, m) => Promise.race([p, delai(ECHEANCE).then(() => { throw new Error("échéance dépassée : " + m); })]);
const attendre = async (p, m) => { try{ return await echeance(p, m); }catch(e){ ok(false, m, e.message); return undefined; } };
const rejette = async (p, m, code, re) => {
  try{ await echeance(p, m); ok(false, m, "(n'a pas échoué)"); }
  catch(e){ ok((!code || e.code === code) && (!re || re.test(e.message)), m, e.code + " · " + e.message); }
};
const enAttente = async (p, ms = 200) => Promise.race([p.then(() => "résolue", () => "rejetée"), delai(ms).then(() => "en attente")]);
const dossier = (ctx, nom) => { const d = ctx.DOSSIER.blank(nom); return d; };
/* Un rejet non traité (page ou mode serveur) est un échec, et la suite continue jusqu'aux vérifications suivantes. */
process.on("unhandledRejection", e => { ok(false, "rejet non traité", e && e.message); });

(async () => {
  /* ===== Adaptateur ===== */
  {
    const api = fausseApi(), ctx = page(api, {demarrage: false});
    const erreurs = []; let att401 = 0;
    const A = ctx.AdaptateurServeur({fetch: api.fetch, surErreur: e => erreurs.push(e), sur401: () => { att401++; return new Promise(() => {}); }});
    ok(A.name === "serveur" && A.volatile === false, "adaptateur : nom et volatile:false (indicateur « données volatiles » masqué)");

    const d = dossier(ctx, "Léna Garnier");
    await attendre(A.put(d), "création");
    let c = api.appels.at(-1);
    ok(c.method === "PUT" && c.corps.version === null && api.base[d.id].version === 1, "put : création avec version null → version 1");
    ok(A.version(d) === 1, "put : la version de l'enveloppe est retenue pour l'objet");
    await attendre(A.put(d), "mise à jour");
    ok(api.appels.at(-1).corps.version === 1 && api.base[d.id].version === 2, "put : la mise à jour envoie la version retenue (1 → 2)");

    /* Lecture : upgrade et version */
    const v2 = {schema: "yeita-dossier-candidat", version: 2, id: "cand-ancien-aaaaa", candidat: {nom: "Ancien", role: "PM"}, identite: {prenom: "An", nom: "Cien"},
      parcours: {etape: "passation-ec1", etapes: {}, cloture: null}, meta: {creeLe: "2026-10-01T00:00:00Z", modifieLe: "2026-10-01T00:00:00Z"}};
    api.base[v2.id] = {version: 7, data: JSON.stringify(v2)};
    const lu = await attendre(A.get(v2.id), "get ancien");
    ok(lu && lu.version === 3 && lu.parcours.etape === "bilan-ec1" && A.version(lu) === 7, "get : le dossier est mis à niveau (v2 → v3) et sa version (7) retenue");
    const tous = await attendre(A.list(), "list");
    ok(Array.isArray(tous) && tous.length === 2 && tous.every(x => x.version === 3), "list : les data de chaque enveloppe, mis à niveau");

    /* Conflit */
    erreurs.length = 0;
    api.base[d.id].version = 9;   /* quelqu'un d'autre a enregistré */
    await rejette(A.put(d), "put : version périmée → conflit", "conflit", /modifiée par quelqu'un d'autre/);
    ok(erreurs.length === 1 && erreurs[0].code === "conflit", "put : le conflit est aussi remis au bandeau (surErreur)");
    await rejette(A.put(d), "put : après un 409, la version gardée ne change pas (refusé encore)", "conflit");
    ok(api.base[d.id].version === 9, "conflit : la base garde la version de l'autre");

    /* Un objet ancien ne passe pas */
    const e = dossier(ctx, "Objet Ancien");
    await attendre(A.put(e), "création e");
    const vieux = await attendre(A.get(e.id), "lecture 1"), neuf = await attendre(A.get(e.id), "lecture 2");
    neuf.notesLibres = {x: "neuf"}; await attendre(A.put(neuf), "enregistrement du neuf");
    await rejette(A.put(vieux), "put : un objet lu avant un enregistrement plus récent est refusé (version par objet)", "conflit");

    /* Objet jamais vu (import) : version la plus haute connue par identifiant */
    const copie = JSON.parse(JSON.stringify(neuf));
    await attendre(A.put(copie), "put d'une copie (import)");
    ok(api.appels.at(-1).corps.version === 2 && api.base[e.id].version === 3, "put : un objet inconnu prend la version la plus haute connue pour l'identifiant");

    /* File par dossier : enregistrements rapprochés, réponses lentes */
    const f = dossier(ctx, "File Lente");
    await attendre(A.put(f), "création f");
    api.retard = 80;
    const prom = [];
    for(let i = 1; i <= 3; i++){ f.notesLibres = {texte: "saisie " + i}; prom.push(A.put(f)); await delai(20); }
    const res = await attendre(Promise.allSettled(prom), "trois put rapprochés");
    api.retard = 0;
    ok(res && res.every(r => r.status === "fulfilled"), "file : trois put rapprochés du même dossier, aucun 409", res && res.map(r => r.status).join(","));
    ok(JSON.parse(api.base[f.id].data).notesLibres.texte === "saisie 3" && api.base[f.id].version === 4, "file : la base garde la dernière saisie");

    /* Version la plus haute : une liste lente ne fait pas reculer la version */
    api.retardReponse.GET = 60;
    const lente = A.list();
    f.notesLibres = {texte: "après"}; await attendre(A.put(f), "put pendant la liste");
    await attendre(lente, "liste lente");
    api.retardReponse.GET = 0;
    const copie2 = JSON.parse(JSON.stringify(f));
    await attendre(A.put(copie2), "put d'une copie après la liste lente");
    ok(api.appels.at(-1).corps.version === 5, "version la plus haute : une réponse ancienne ne fait pas reculer la version par identifiant", api.appels.at(-1).corps.version);

    /* Identifiants */
    const avant = api.appels.length;
    ok((await attendre(A.get("cand-x/../y"), "get hors motif")) === null && (await attendre(A.remove("../moi"), "remove hors motif")) === null, "identifiant hors motif : get et remove → null");
    const g = dossier(ctx, "Hors Format"); g.id = "fichier-modifie";
    await rejette(A.put(g), "identifiant hors motif : put rejeté avec le nom du dossier", "identifiant", /Identifiant invalide pour « Hors Format »/);
    ok(api.appels.length === avant, "identifiant hors motif : aucune requête");

    /* Réponses */
    ok((await attendre(A.get("cand-absent-zzzzz"), "get absent")) === null, "get : 404 introuvable → null");
    api.panne = (u, m) => m === "GET" ? api.rep(404, {erreur: "Route inconnue."}) : null;
    await rejette(A.get(e.id), "get : 404 sans code → rejet distinct d'introuvable", "api", /Route inconnue/);
    api.panne = () => api.rep(502, "<html>Bad Gateway</html>", "text/html");
    await rejette(A.list(), "502 HTML d'oauth2-proxy → message réseau", "reseau", /La base ne répond pas/);
    api.panne = () => api.rep(403, "Forbidden", "text/plain");
    await rejette(A.put(e), "403 non JSON → message réseau", "reseau");
    api.panne = () => api.rep(200, "<!doctype html>", "text/html");
    await rejette(A.list(), "200 non JSON → message réseau", "reseau");
    api.panne = () => api.rep(200, JSON.stringify([{id: "cand-proxy-aaaaa", version: 1, data: {}}]), "text/html");
    await rejette(A.list(), "JSON valide servi en text/html (page d'un proxy) → message réseau", "reseau");
    api.panne = () => api.rep(200, "{pas du json", "application/json");
    await rejette(A.list(), "JSON illisible → message réseau", "reseau");
    api.panne = () => Promise.reject(new TypeError("Failed to fetch"));
    await rejette(A.list(), "réseau coupé → message réseau", "reseau");
    api.panne = () => api.rep(503, {erreur: "Base occupée, réessaie dans un instant."});
    await rejette(A.put(e), "503 JSON sans code → texte de l'API", "api", /Base occupée/);
    api.panne = () => api.rep(403, {erreur: "Lecture seule : tu ne peux pas modifier.", code: "lecture-seule"});
    await rejette(A.put(e), "403 lecture-seule → message et code", "lecture-seule", /Lecture seule/);
    api.panne = () => api.rep(401, {});
    const p401 = A.list();
    ok((await enAttente(p401)) === "en attente" && att401 === 1, "401 : sur401 appelé, la promesse reste en attente (la page se recharge)");
    api.panne = null;

    /* Suppression */
    await attendre(A.remove(e.id), "remove");
    ok(api.appels.at(-1).method === "DELETE" && !api.base[e.id], "remove : DELETE, dossier effacé");
    const nb = api.appels.length;
    await rejette(A.put(neuf), "put après remove du même identifiant : rejeté (conflit)", "conflit");
    ok(api.appels.length === nb && !api.base[e.id], "put après remove : aucune requête, aucune recréation");
    ok((await attendre(A.remove("cand-absent-zzzzz"), "remove absent")) === undefined, "remove : 404 introuvable → résolue");

    /* Départ de la page */
    const h = dossier(ctx, "Depart Page");
    await attendre(A.put(h), "création h");
    api.retardReponse.PUT = 150;   /* le PUT atteint l'API, sa réponse revient tard */
    h.notesLibres = {texte: "avant départ"}; const enVol = A.put(h);
    await delai(20);
    h.notesLibres = {texte: "dernière frappe"}; const dep = A.partir(h);
    await attendre(Promise.allSettled([enVol, dep]), "départ pendant un PUT en cours");
    api.retardReponse.PUT = 0;
    const dernier = api.appels.filter(x => x.method === "PUT").at(-1);
    ok(dernier.keepalive === true && dernier.corps.version === 2, "départ : keepalive, version que le PUT en cours produira (1 + 1)", dernier.corps.version);
    ok(JSON.parse(api.base[h.id].data).notesLibres.texte === "dernière frappe", "départ : la dernière frappe est en base");
  }

  /* ===== Démarrage ===== */
  const demarrer = async (api, o) => { const ctx = page(api, o); await delai(30); return ctx; };
  {
    const api = fausseApi(), ctx = await demarrer(api);
    await attendre(ctx.DEMARRAGE.pret, "pret (serveur)");
    ok(ctx.DEMARRAGE.mode() === "serveur" && ctx.DOSSIER.adapter().name === "serveur", "démarrage : 200 → mode serveur, adaptateur serveur branché");
    ok(ctx.QUI.moi() === "Alice" && ctx.QUI.equipe().join() === "Alice,Bob", "démarrage : QUI.moi() = prénom du compte, QUI.equipe() = /api/equipe");
    const ordre = api.appels.map(a => a.url.replace("../api/", ""));
    ok(ordre[0] === "moi" && ordre.slice(1, 3).sort().join() === "equipe,options-disponibilite", "démarrage : /api/moi d'abord, puis équipe et options", ordre.join(" "));
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "<html>404</html>", "text/html") : null;
    const ctx = await demarrer(api);
    await attendre(ctx.DEMARRAGE.pret, "pret (navigateur)");
    ok(ctx.DEMARRAGE.mode() === "navigateur" && ctx.DOSSIER.adapter().name === "navigateur", "démarrage : 404 text/html (serveur statique) → mode navigateur");
    ok(api.appels.length === 1, "démarrage : en mode navigateur, aucun autre appel à l'API");
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "<html>404</html>", "text/html") : null;
    const ctx = await demarrer(api, {location: {hostname: "recrutement.yeita.fr"}});
    ok(ctx.DEMARRAGE.mode() === "bloque" && (await enAttente(ctx.DEMARRAGE.pret)) === "en attente", "démarrage : 404 sous l'hôte de production → bloqué, pret jamais résolue");
  }
  for(const h of ["recrutement.yeita.fr.", "RECRUTEMENT.yeita.fr"]){
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "<html>404</html>", "text/html") : null;
    const ctx = await demarrer(api, {location: {hostname: h}});
    ok(ctx.DEMARRAGE.mode() === "bloque", "démarrage : 404 sous « " + h + " » (même site, forme différente) → bloqué");
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(401, {}) : null;
    const ctx = page(api, {demarrage: false});
    ctx.sessionStorage = {getItem(){ throw new Error("bloqué"); }, setItem(){ throw new Error("bloqué"); }, removeItem(){}};
    vm.runInContext(fs.readFileSync(path.join(root, "assets/demarrage.js"), "utf8"), ctx, {filename: "assets/demarrage.js"});
    await delai(30);
    ok(ctx.__recharges === 0 && ctx.DEMARRAGE.mode() === "bloque", "démarrage : 401 sans stockage de session → bloqué, sans rechargement (pas de boucle)");
  }
  {
    const api = fausseApi();
    const ctx = await demarrer(api, {location: {protocol: "file:"}});
    await attendre(ctx.DEMARRAGE.pret, "pret (file:)");
    ok(ctx.DEMARRAGE.mode() === "navigateur" && api.appels.length === 0, "démarrage : file: → mode navigateur sans requête");
  }
  for(const [nom, panne] of [
    ["403 JSON hors équipe", api => api.rep(403, {erreur: "Tu ne fais pas partie de l'équipe.", code: "hors-equipe"})],
    ["502 HTML", api => api.rep(502, "<html>", "text/html")],
    ["200 non JSON", api => api.rep(200, "<html>", "text/html")],
    ["200 sans prénom", api => api.rep(200, {email: "x@yeita.fr"})],
    ["réseau coupé", () => Promise.reject(new TypeError("Failed to fetch"))]]){
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? panne(api) : null;
    const ctx = await demarrer(api);
    ok(ctx.DEMARRAGE.mode() === "bloque" && (await enAttente(ctx.DEMARRAGE.pret)) === "en attente", "démarrage : " + nom + " → bloqué");
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/equipe" ? api.rep(404, {erreur: "Route inconnue."}) : null;
    const ctx = await demarrer(api);
    ok(ctx.DEMARRAGE.mode() === "bloque" && ctx.DOSSIER.adapter().name !== "serveur", "démarrage : /api/equipe en 404 → bloqué, jamais d'état mixte");
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(401, {}) : null;
    const ctx = await demarrer(api);
    ok(ctx.__recharges === 1 && ctx.__sess["yeita-rechargement-401"], "démarrage : 401 → un rechargement, horodaté");
    const ctx2 = await demarrer(api, {});
    ok(ctx2.__recharges === 1, "démarrage : (témoin) une nouvelle page sans horodatage recharge aussi");
    /* même onglet : l'horodatage survit au rechargement */
    const sess = {"yeita-rechargement-401": String(Date.now())};
    const ctx3 = page(api, {demarrage: false}); Object.assign(ctx3.__sess, sess);
    vm.runInContext(fs.readFileSync(path.join(root, "assets/demarrage.js"), "utf8"), ctx3, {filename: "assets/demarrage.js"});
    await delai(30);
    ok(ctx3.__recharges === 0 && ctx3.DEMARRAGE.mode() === "bloque", "démarrage : 401 moins de 60 s après un rechargement dû à un 401 → bloqué, sans nouveau rechargement");
  }
  {
    /* Lenteur : 10 s sans réponse (échéance raccourcie pour le test) */
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? new Promise(() => {}) : null;
    const ctx = page(api, {demarrage: false}); ctx.DEMARRAGE_DELAI = 80;
    vm.runInContext(fs.readFileSync(path.join(root, "assets/demarrage.js"), "utf8"), ctx, {filename: "assets/demarrage.js"});
    await delai(150);
    ok(ctx.DEMARRAGE.mode() === "bloque", "démarrage : pas de réponse dans le délai → bloqué, message réseau");
  }
  {
    /* Adaptateur d'attente : rien n'est écrit avant le choix du mode, ni en mode bloqué */
    const api = fausseApi(); let lacher; api.panne = u => u === "/api/moi" ? new Promise(r => { lacher = r; }) : null;
    const ctx = page(api);
    ok(ctx.DEMARRAGE.mode() === "attente" && ctx.QUI.moi() === "", "attente : mode « attente », QUI.moi() vide");
    const ecr = ctx.DOSSIER.save(ctx.DOSSIER.blank("Pendant Attente"));
    ctx.STORE.addDispo("Option attente");
    ok(!ctx.__mem["yeita-dossiers"] && !ctx.__mem["yeita-options-disponibilite"], "attente : aucune écriture locale (dossiers, options)");
    lacher(api.rep(502, "<html>", "text/html"));
    await delai(30);
    ok(ctx.DEMARRAGE.mode() === "bloque" && (await enAttente(ecr)) === "en attente" && !ctx.__mem["yeita-dossiers"], "bloqué : l'écriture lancée pendant l'attente ne part nulle part");
    ok(!api.appels.some(a => a.method === "PUT"), "bloqué : aucune requête PUT");
  }
  {
    /* Bandeau */
    const api = fausseApi(); const ctx = await demarrer(api);
    await attendre(ctx.DEMARRAGE.pret, "pret");
    const d = ctx.DOSSIER.blank("Bandeau Test"); await ctx.DOSSIER.save(d);
    api.base[d.id].version = 5;
    await ctx.DOSSIER.save(d).catch(() => {});
    const b = ctx.__body.children[0];
    ok(b && /notice err/.test(b.className) && /modifiée par quelqu'un d'autre/.test(b.innerHTML) && /Recharger/.test(b.innerHTML) && /copie-le avant de recharger/.test(b.innerHTML),
      "bandeau : conflit → message, saisie non enregistrée, bouton Recharger", b && b.innerHTML.slice(0, 120));
    api.panne = () => api.rep(403, {erreur: "Lecture seule : tu ne peux pas modifier.", code: "lecture-seule"});
    await ctx.DOSSIER.save(d).catch(() => {});
    const b2 = ctx.__body.children[0];
    ok(/Lecture seule/.test(b2.innerHTML) && !/Recharger/.test(b2.innerHTML) && !/copie-le/.test(b2.innerHTML), "bandeau : lecture seule → message seul, sans bouton");
  }
  {
    /* Retour sur l'onglet */
    const api = fausseApi(); const ctx = await demarrer(api);
    await attendre(ctx.DEMARRAGE.pret, "pret");
    let appels = 0; ctx.DEMARRAGE.auRetour(() => { appels++; });
    ctx.document.visibilityState = "hidden"; (ctx.__ecouteurs.visibilitychange || []).forEach(f => f());
    ctx.document.visibilityState = "visible"; (ctx.__ecouteurs.visibilitychange || []).forEach(f => f());
    ok(appels === 1, "retour sur l'onglet : la fonction est appelée au retour (visible), pas au départ");
    const api2 = fausseApi(); api2.panne = u => u === "/api/moi" ? api2.rep(404, "x", "text/html") : null;
    const nav = await demarrer(api2); await attendre(nav.DEMARRAGE.pret, "pret nav");
    let n2 = 0; nav.DEMARRAGE.auRetour(() => { n2++; }); (nav.__ecouteurs.visibilitychange || []).forEach(f => f());
    ok(n2 === 0, "retour sur l'onglet : rien en mode navigateur (les écoutes storage suffisent)");
  }

  /* ===== Identité et options ===== */
  {
    const api = fausseApi(); api.moi = {email: "lea@yeita.fr", prenom: "Léa", role: "lecture"}; api.options = ["Fin 2027"];
    const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret");
    const el = {innerHTML: "", addEventListener(){}, contains(){ return false; }, querySelector(){ return null; }};
    ctx.QUI.monter(el);
    ok(/Connecté·e : Léa · lecture seule/.test(el.innerHTML) && !/qui-sel/.test(el.innerHTML), "QUI.monter : mode serveur, « Connecté·e : Léa · lecture seule », sans liste", el.innerHTML);
    ctx.QUI.choisir("Pirate"); ok(ctx.QUI.moi() === "Léa", "QUI.choisir : sans effet en mode serveur");
    ctx.QUI.ajouter("Manager Externe");
    ok(ctx.QUI.equipe().indexOf("Manager Externe") >= 0 && !ctx.__mem["yeita-equipe-ajouts"], "QUI.ajouter : la page seulement, rien dans le localStorage");
    ok(ctx.STORE.dispos().indexOf("Fin 2027") >= 0 && ctx.STORE.dispos().indexOf("1 mois") >= 0, "options : base + ajouts venus de l'API");
    api.moi.role = "recruteur";
    ctx.STORE.addDispo("Octobre 2027");
    ok(ctx.STORE.dispos().indexOf("Octobre 2027") >= 0, "options : addDispo ajoute aussitôt");
    await delai(30);
    ok(api.options.indexOf("Octobre 2027") >= 0 && !ctx.__mem["yeita-options-disponibilite"], "options : POST vers l'API, rien dans le localStorage");
  }
  {
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "x", "text/html") : null;
    const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret nav");
    const el = {innerHTML: "", addEventListener(){}, contains(){ return false; }, querySelector(){ return null; }};
    ctx.QUI.monter(el);
    ok(/qui-sel/.test(el.innerHTML), "QUI.monter : mode navigateur, la liste actuelle");
    ctx.STORE.addDispo("Locale"); ok(/Locale/.test(ctx.__mem["yeita-options-disponibilite"] || ""), "options : mode navigateur, localStorage comme avant");
  }

  /* ===== Fiches : écrire sa partie ===== */
  {
    const api = fausseApi(); const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret");
    const D = ctx.DOSSIER;
    const d = D.blank("Fiche Partie"); await D.save(d);
    const onglet1 = await D.get(d.id), onglet2 = await D.get(d.id);   /* EC1 et décompte, ouverts ensemble */
    const poserEc1 = (x, t) => { x.fiches = x.fiches || {}; x.fiches.ec1 = {f: {texte: t}}; };
    const poserDec = (x, t) => { x.fiches = x.fiches || {}; x.fiches.decompte = {notes: {a: t}}; };
    const lireEc1 = x => x.fiches && x.fiches.ec1, lireDec = x => x.fiches && x.fiches.decompte;
    let r1 = await attendre(D.ecrirePartie(onglet1, {poser: x => poserEc1(x, "ec1 a"), lire: lireEc1}), "ec1 1");
    let r2 = await attendre(D.ecrirePartie(onglet2, {poser: x => poserDec(x, "dec a"), lire: lireDec}), "décompte 1");
    r1 = await attendre(D.ecrirePartie(r1, {poser: x => poserEc1(x, "ec1 b"), lire: lireEc1}), "ec1 2");
    r2 = await attendre(D.ecrirePartie(r2, {poser: x => poserDec(x, "dec b"), lire: lireDec}), "décompte 2");
    const base = JSON.parse(api.base[d.id].data);
    ok(base.fiches.ec1.f.texte === "ec1 b" && base.fiches.decompte.notes.a === "dec b", "fiches : EC1 et décompte alternés, chaque partie en base, aucun refus");
    /* même partie changée ailleurs */
    const autre = await D.get(d.id); poserEc1(autre, "ec1 de Bob"); await D.save(autre);
    const nb = api.appels.filter(a => a.method === "PUT").length;
    await rejette(D.ecrirePartie(r1, {poser: x => poserEc1(x, "ec1 périmée"), lire: lireEc1}), "fiches : même partie changée ailleurs → refus", "conflit");
    ok(api.appels.filter(a => a.method === "PUT").length === nb && JSON.parse(api.base[d.id].data).fiches.ec1.f.texte === "ec1 de Bob", "fiches : aucun PUT, les notes de Bob restent");
    /* dossier supprimé */
    await D.remove(d.id);
    await rejette(D.ecrirePartie(r2, {poser: x => poserDec(x, "après suppression"), lire: lireDec}), "fiches : dossier supprimé → refus", "conflit");
    ok(!api.base[d.id], "fiches : aucune recréation");
  }
  {
    /* Conflit sur une autre partie entre la relecture et l'écriture : nouvelle tentative réussie, bandeau retiré (revue Q2) */
    const api = fausseApi(); const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret");
    const D = ctx.DOSSIER, d = D.blank("Tentative"); await D.save(d);
    const ouverte = await D.get(d.id);
    api.avantPut = id => { const l = api.base[id], x = JSON.parse(l.data); x.fiches.decompte = {notes: {a: "autre page"}}; l.data = JSON.stringify(x); l.version++; };
    const r = await attendre(D.ecrirePartie(ouverte, {poser: x => { x.fiches.ec1 = {f: {t: "après tentative"}}; }, lire: x => x.fiches.ec1}), "écriture avec nouvelle tentative");
    const b = JSON.parse(api.base[d.id].data);
    ok(r && b.fiches.ec1.f.t === "après tentative" && b.fiches.decompte.notes.a === "autre page", "nouvelle tentative : la partie est écrite, celle de l'autre page reste");
    ok(ctx.__body.children.length && ctx.__body.children[0].retire === true, "nouvelle tentative réussie : le bandeau de conflit est retiré (revue Q2)");
  }
  {
    /* Départ d'une fiche pendant un enregistrement en cours : la partie se pose sur l'objet en vol (revue de code, Q1) */
    const api = fausseApi(); const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret");
    const D = ctx.DOSSIER, d = D.blank("Depart Fiche"); await D.save(d);
    const ec1 = await D.get(d.id), dec = await D.get(d.id);
    const lireDec = x => x.fiches && x.fiches.decompte, lireEc1 = x => x.fiches && x.fiches.ec1;
    await attendre(D.ecrirePartie(dec, {poser: x => { x.fiches.decompte = {notes: {a: "décompte"}}; }, lire: lireDec}), "décompte écrit");
    api.retardReponse.PUT = 150;
    const enVol = D.ecrirePartie(ec1, {poser: x => { x.fiches.ec1 = {f: {t: "ec1 en vol"}}; }, lire: lireEc1});
    await delai(40);
    D.partirPartie(ec1, x => { x.fiches.ec1 = {f: {t: "ec1 au départ"}}; });
    await attendre(Promise.allSettled([enVol]), "PUT en vol"); await delai(200);
    api.retardReponse.PUT = 0;
    const b = JSON.parse(api.base[d.id].data);
    ok(b.fiches.decompte && b.fiches.decompte.notes.a === "décompte" && b.fiches.ec1.f.t === "ec1 au départ", "départ pendant un PUT en cours : la partie de l'autre page reste, la dernière frappe est en base", JSON.stringify(b.fiches));
    /* Départ après une relecture non adoptée (EC2 au retour sur l'onglet) */
    const ec2 = await D.get(d.id);
    const autre = await D.get(d.id); autre.fiches.ec1 = {f: {t: "EC1 de Bob"}}; await D.save(autre);   /* relève la version par identifiant */
    await D.get(d.id);                                                                                   /* relecture non adoptée */
    await attendre(D.partirPartie(ec2, x => { x.fiches.ec2 = {f: {t: "EC2 au départ"}}; }), "départ EC2");
    const b2 = JSON.parse(api.base[d.id].data);
    ok(b2.fiches.ec1.f.t === "EC1 de Bob", "départ après une relecture non adoptée : l'EC1 de Bob n'est pas écrasée (refus accepté, H5)", JSON.stringify(b2.fiches));
  }
  {
    /* Mode navigateur : un refus de fiche affiche aussi le bandeau */
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "x", "text/html") : null;
    const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret nav");
    const D = ctx.DOSSIER, d = D.blank("Refus Local"); await D.save(d);
    const ouverte = await D.get(d.id), autre = await D.get(d.id);
    autre.fiches.decompte = {notes: {a: "autre onglet"}}; await D.save(autre);
    await D.ecrirePartie(ouverte, {poser: x => { x.fiches.decompte = {notes: {a: "périmée"}}; }, lire: x => x.fiches.decompte}).catch(() => {});
    const bd = ctx.__body.children[0];
    ok(bd && /modifiée par quelqu'un d'autre/.test(bd.innerHTML), "mode navigateur : refus d'une fiche → bandeau (R6i, revue de code Q3)");
  }
  {
    /* Mode navigateur : un dossier supprimé dans un autre onglet n'est pas recréé par une fiche restée ouverte */
    const api = fausseApi(); api.panne = u => u === "/api/moi" ? api.rep(404, "x", "text/html") : null;
    const ctx = await demarrer(api); await attendre(ctx.DEMARRAGE.pret, "pret nav");
    const D = ctx.DOSSIER, d = D.blank("Fiche Locale"); await D.save(d);
    const ouverte = await D.get(d.id);
    delete JSON.parse(ctx.__mem["yeita-dossiers"])[d.id];
    const tous = JSON.parse(ctx.__mem["yeita-dossiers"]); delete tous[d.id]; ctx.__mem["yeita-dossiers"] = JSON.stringify(tous);   /* l'autre onglet a supprimé */
    await rejette(D.ecrirePartie(ouverte, {poser: x => { x.fiches.ec1 = {f: {t: "x"}}; }, lire: x => x.fiches.ec1}), "fiches (navigateur) : dossier supprimé ailleurs → refus", "conflit");
    ok(!JSON.parse(ctx.__mem["yeita-dossiers"])[d.id], "fiches (navigateur) : aucune recréation");
  }

  console.log(fails ? "\n" + fails + " échec(s) sur " + n : "\nTOUT OK (" + n + " vérifications)");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error("FAIL exception", e); process.exit(1); });
