/* Identité, autorisation, format des erreurs, /api/sante, /api/moi, /api/equipe, options de disponibilité. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { creerApp, requete } from "./aide.js";

const json = r => JSON.parse(r.body);

test("identité : 401 sans identité valide, X-Forwarded-User ignoré", async t => {
  const { app } = creerApp(t);
  const cas = [
    ["sans en-tête", {}],
    ["X-Forwarded-User seul", { "x-forwarded-user": "rec@yeita.fr" }],
    ["en-tête en double", { "x-forwarded-email": ["rec@yeita.fr", "adm@yeita.fr"] }],
    ["domaine piégé", { "x-forwarded-email": "rec@yeita.fr.evil.com" }],
    ["autre domaine", { "x-forwarded-email": "rec@gmail.com" }],
    ["vide", { "x-forwarded-email": "" }]
  ];
  for (const [nom, headers] of cas) {
    const r = await app.inject({ url: "/api/moi", headers });
    assert.equal(r.statusCode, 401, nom);
    assert.deepEqual(json(r), { erreur: "Identité absente ou invalide." }, nom);
  }
});

test("autorisation : membre actif, casse ignorée ; hors équipe et inactif en 403", async t => {
  const { app } = creerApp(t);
  const r = await requete(app, " Rec@Yeita.FR ", { url: "/api/moi" });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(json(r), { email: "rec@yeita.fr", prenom: "Léo", role: "recruteur" });
  for (const email of ["inconnu@yeita.fr", "parti@yeita.fr"]) {
    const x = await requete(app, email, { url: "/api/moi" });
    assert.equal(x.statusCode, 403, email);
    assert.deepEqual(json(x), { erreur: "Tu ne fais pas partie de l'équipe.", code: "hors-equipe" }, email);
  }
});

test("désactivation prise en compte à la requête suivante", async t => {
  const { app, db } = creerApp(t);
  assert.equal((await requete(app, "adm@yeita.fr", { url: "/api/moi" })).statusCode, 200);
  db.prepare("UPDATE equipe SET actif = 0 WHERE email = 'adm@yeita.fr'").run();
  assert.equal((await requete(app, "adm@yeita.fr", { url: "/api/moi" })).statusCode, 403);
});

test("rôle lecture : GET permis, écriture refusée avant l'analyse du corps", async t => {
  const { app } = creerApp(t);
  assert.equal((await requete(app, "lec@yeita.fr", { url: "/api/equipe" })).statusCode, 200);
  const essais = [
    { method: "POST", url: "/api/options-disponibilite", payload: { libelle: "x" } },
    { method: "PUT", url: "/api/candidats/cand-a-b", payload: "{pas du json", headers: { "content-type": "application/json" } },
    { method: "PUT", url: "/api/candidats/cand-a-b", payload: "x".repeat(1048577 * 2), headers: { "content-type": "application/json" } },
    { method: "DELETE", url: "/api/candidats/cand-a-b" }
  ];
  for (const e of essais) {
    const r = await requete(app, "lec@yeita.fr", e);
    assert.equal(r.statusCode, 403, `${e.method} ${e.url}`);
    assert.deepEqual(json(r), { erreur: "Lecture seule : tu ne peux pas modifier.", code: "lecture-seule" });
  }
});

test("/api/sante : sans authentification, exemption limitée à la route", async t => {
  const { app } = creerApp(t);
  for (const url of ["/api/sante", "/api/sante?x=1"]) {
    const r = await app.inject({ url });
    assert.equal(r.statusCode, 200, url);
    assert.deepEqual(json(r), { ok: true });
  }
  for (const url of ["/api/sante/", "/api/candidats?x=/api/sante", "/api/sante/../candidats", "/api//candidats", "/api/SANTE", "/api/sante%2F..%2Fcandidats"]) {
    const r = await app.inject({ url });
    assert.equal(r.statusCode, 401, url);
  }
});

test("/api/sante : 503 si la base ne répond plus", async t => {
  const { app, db } = creerApp(t);
  db.close();
  const r = await app.inject({ url: "/api/sante" });
  assert.equal(r.statusCode, 503);
  assert.deepEqual(json(r), { ok: false });
});

test("/api/equipe : membres actifs, prénom et rôle seulement, triés", async t => {
  const { app } = creerApp(t);
  const r = await requete(app, "rec@yeita.fr", { url: "/api/equipe" });
  assert.deepEqual(json(r), [
    { prenom: "Léo", role: "recruteur" }, { prenom: "Pauline", role: "lecture" }, { prenom: "Sacha", role: "admin" }
  ]);
});

test("erreurs en JSON, no-store, route inconnue sans code", async t => {
  const { app } = creerApp(t);
  const r = await requete(app, "rec@yeita.fr", { url: "/api/inconnue" });
  assert.equal(r.statusCode, 404);
  assert.match(r.headers["content-type"], /^application\/json/);
  assert.deepEqual(json(r), { erreur: "Route inconnue." });
  assert.equal(r.headers["cache-control"], "no-store");
  assert.equal((await app.inject({ url: "/api/sante" })).headers["cache-control"], "no-store");
  /* Adresse encodée, routée vers /api/moi : no-store décidé sur la route, pas sur le texte. */
  const encodee = await requete(app, "rec@yeita.fr", { url: "/%61pi/moi" });
  assert.equal(encodee.statusCode, 200);
  assert.equal(encodee.headers["cache-control"], "no-store");
  const sans = await app.inject({ url: "/api/inconnue" });
  assert.equal(sans.statusCode, 401);
});

test("corps : seul le JSON est accepté pour PUT et POST", async t => {
  const { app } = creerApp(t);
  const cas = [
    ["text/plain", { "content-type": "text/plain" }, '{"libelle":"x"}'],
    ["formulaire", { "content-type": "application/x-www-form-urlencoded" }, "libelle=x"],
    ["sans Content-Type", {}, undefined]
  ];
  for (const [nom, headers, payload] of cas) {
    const r = await requete(app, "rec@yeita.fr", { method: "POST", url: "/api/options-disponibilite", headers, payload });
    assert.equal(r.statusCode, 415, nom);
    assert.deepEqual(json(r), { erreur: "Le corps doit être en JSON (application/json)." }, nom);
  }
  const mauvais = await requete(app, "rec@yeita.fr", { method: "POST", url: "/api/options-disponibilite", headers: { "content-type": "application/json" }, payload: "{x" });
  assert.equal(mauvais.statusCode, 400);
  assert.deepEqual(json(mauvais), { erreur: "JSON invalide." });
});

test("mode local : DEV_EMAIL remplace l'en-tête absent, l'en-tête l'emporte", async t => {
  const { app } = creerApp(t, { config: { devEmail: "adm@yeita.fr" } });
  assert.equal(json(await app.inject({ url: "/api/moi" })).email, "adm@yeita.fr");
  assert.equal(json(await requete(app, "rec@yeita.fr", { url: "/api/moi" })).email, "rec@yeita.fr");
  assert.equal((await requete(app, "pirate@gmail.com", { url: "/api/moi" })).statusCode, 401);
});

test("options de disponibilité : ajout, doublon, option de base, longueur, lecture seule", async t => {
  const { app, db } = creerApp(t);
  const post = (libelle, email = "rec@yeita.fr") => requete(app, email, { method: "POST", url: "/api/options-disponibilite", payload: { libelle } });
  assert.deepEqual(json(await requete(app, "lec@yeita.fr", { url: "/api/options-disponibilite" })), []);
  const a = await post("  Fin   janvier ");
  assert.equal(a.statusCode, 201);
  assert.deepEqual(json(a), ["Fin janvier"]);
  const b = await post("6 mois", "adm@yeita.fr");
  assert.deepEqual(json(b), ["Fin janvier", "6 mois"]);
  const doublon = await post("Fin janvier");
  assert.equal(doublon.statusCode, 200);
  assert.deepEqual(json(doublon), ["Fin janvier", "6 mois"]);
  const base = await post("1 mois");
  assert.equal(base.statusCode, 200);
  assert.deepEqual(json(base), ["Fin janvier", "6 mois"]);
  for (const v of ["", "   ", "x".repeat(61), 12, null]) {
    const r = await post(v);
    assert.equal(r.statusCode, 400, String(v));
    assert.deepEqual(json(r), { erreur: "Champ libelle : de 1 à 60 caractères." });
  }
  assert.equal((await post("é".repeat(60))).statusCode, 201);
  assert.equal((await post("Autre", "lec@yeita.fr")).statusCode, 403);
  assert.equal(db.prepare("SELECT count(*) n FROM options_disponibilite").get().n, 3);
});
