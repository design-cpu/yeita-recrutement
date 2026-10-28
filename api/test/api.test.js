/* Identité, autorisation, format des erreurs, /api/sante, /api/moi, /api/equipe, options de disponibilité,
   état des sauvegardes (v1.7). */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

/* --- GET /api/sauvegardes (v1.7) : réservé aux admins, lu dans <dossier de la base>/etat/ --- */

function etat(dbPath, fichier, contenu) {
  const d = path.join(path.dirname(dbPath), "etat");
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, fichier), typeof contenu === "string" ? contenu : JSON.stringify(contenu));
}
const ilYA = h => new Date(Date.now() - h * 3600 * 1000).toISOString();

test("sauvegardes : admin seulement ; recruteur, lecture, hors équipe, sans identité refusés (CA22)", async t => {
  const { app } = creerApp(t);
  let r = await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" });
  assert.equal(r.statusCode, 200, r.body);
  for (const email of ["rec@yeita.fr", "lec@yeita.fr"]) {
    r = await requete(app, email, { url: "/api/sauvegardes" });
    assert.equal(r.statusCode, 403, email);
    assert.deepEqual(json(r), { erreur: "Réservé aux admins de l'équipe.", code: "admin-requis" });
  }
  r = await requete(app, "parti@yeita.fr", { url: "/api/sauvegardes" });
  assert.equal(json(r).code, "hors-equipe");
  r = await requete(app, null, { url: "/api/sauvegardes" });
  assert.equal(r.statusCode, 401);
});

test("sauvegardes : fichiers absents → null, en retard (CA22)", async t => {
  const { app } = creerApp(t);
  const v = json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" }));
  assert.deepEqual(v.sauvegarde, { derniere: null, reussie: null, en_retard: true });
  assert.deepEqual(v.disque, { mesure: null, en_retard: true });
  assert.ok(Math.abs(Date.parse(v.maintenant) - Date.now()) < 5000);
});

test("sauvegardes : états lus, seuils de 26 h et 2 h, fichier illisible (CA22)", async t => {
  const { app, dbPath } = creerApp(t);
  const reussie = { le: ilYA(25.9), resultat: "reussie", fichier: "recrutement-x.db.age", taille: 32968, copies: 3 };
  etat(dbPath, "sauvegarde-reussie.json", reussie);
  etat(dbPath, "sauvegarde-derniere.json", { le: ilYA(1), resultat: "echec", etape: "chiffrement (age)", code: 1 });
  etat(dbPath, "disque.json", { le: ilYA(1.9), resultat: "normal", racine: 34, docker: 34, seuil: 80 });
  let v = json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" }));
  assert.deepEqual(v.sauvegarde.reussie, reussie);
  assert.equal(v.sauvegarde.derniere.etape, "chiffrement (age)");
  assert.equal(v.sauvegarde.en_retard, false, "25,9 h : à l'heure");
  assert.equal(v.disque.en_retard, false, "1,9 h : à l'heure");
  etat(dbPath, "sauvegarde-reussie.json", { ...reussie, le: ilYA(26.1) });
  etat(dbPath, "disque.json", "{ pas du JSON");
  v = json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" }));
  assert.equal(v.sauvegarde.en_retard, true, "26,1 h : en retard");
  assert.deepEqual(v.disque, { mesure: { illisible: true }, en_retard: true });
  etat(dbPath, "disque.json", { le: ilYA(2.1), resultat: "normal", racine: 1, docker: 1, seuil: 80 });
  assert.equal(json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" })).disque.en_retard, true, "2,1 h : en retard");
  etat(dbPath, "sauvegarde-reussie.json", { ...reussie, le: "pas une date" });
  assert.equal(json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" })).sauvegarde.en_retard, true, "date invalide : en retard");
  etat(dbPath, "sauvegarde-reussie.json", { ...reussie, le: new Date(Date.now() + 3600 * 1000).toISOString() });
  assert.equal(json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" })).sauvegarde.en_retard, true, "date dans le futur : en retard");
  for (const contenu of ["[1, 2]", "42", "null"]) {
    etat(dbPath, "sauvegarde-derniere.json", contenu);
    assert.deepEqual(json(await requete(app, "adm@yeita.fr", { url: "/api/sauvegardes" })).sauvegarde.derniere, { illisible: true }, `JSON valide mais pas un objet : ${contenu}`);
  }
});
