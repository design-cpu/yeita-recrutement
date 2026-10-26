/* Les dossiers candidat : liste, lecture, création, mise à jour, conflits, suppression, journal, effacement sur le disque. */
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { creerApp, requete, dossier, fichiersContiennent } from "./aide.js";

const json = r => JSON.parse(r.body);
const put = (app, id, version, data, email = "rec@yeita.fr") =>
  requete(app, email, { method: "PUT", url: `/api/candidats/${id}`, payload: { version, data } });
const ID = "cand-mh3k2x1-ab12c";
const MESSAGE = "La candidature a été modifiée par quelqu'un d'autre. Recharge la page.";

test("création : 201 version 1, seconde création 409", async t => {
  const { app } = creerApp(t);
  const r = await put(app, ID, null, dossier(ID));
  assert.equal(r.statusCode, 201);
  assert.deepEqual(json(r), { id: ID, version: 1, data: dossier(ID) });
  const x = await put(app, ID, null, dossier(ID), "adm@yeita.fr");
  assert.equal(x.statusCode, 409);
  assert.deepEqual(json(x), { erreur: MESSAGE, code: "conflit" });
});

test("conflit : deux écritures sur la même version lue", async t => {
  const { app } = creerApp(t);
  await put(app, ID, null, dossier(ID));
  const a = await put(app, ID, 1, dossier(ID, "Version de Léo"));
  assert.equal(a.statusCode, 200);
  assert.equal(json(a).version, 2);
  const b = await put(app, ID, 1, dossier(ID, "Version de Sacha"), "adm@yeita.fr");
  assert.equal(b.statusCode, 409);
  assert.deepEqual(json(b), { erreur: MESSAGE, code: "conflit" });
  const lu = json(await requete(app, "lec@yeita.fr", { url: `/api/candidats/${ID}` }));
  assert.equal(lu.data.candidat.nom, "Version de Léo");
  assert.equal(lu.version, 2);
  /* data.version (3, version du schéma) n'est pas la version de la ligne. */
  await put(app, ID, 2, dossier(ID));
  assert.equal((await put(app, ID, 3, dossier(ID))).statusCode, 200);
  const autre = "cand-zz-yy";
  await put(app, autre, null, dossier(autre));
  assert.equal((await put(app, autre, 3, dossier(autre))).statusCode, 409);
});

test("mise à jour d'un dossier supprimé : 409", async t => {
  const { app } = creerApp(t);
  await put(app, ID, null, dossier(ID));
  await requete(app, "adm@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` });
  const r = await put(app, ID, 1, dossier(ID));
  assert.equal(r.statusCode, 409);
  assert.equal(json(r).code, "conflit");
});

test("PUT refusés : champs, identifiant, taille, type", async t => {
  const { app } = creerApp(t);
  const d = dossier(ID);
  const cas = [
    ["schema faux", { version: null, data: { ...d, schema: "autre" } }, /data\.schema/],
    ["id différent", { version: null, data: dossier("cand-x-y") }, /data\.id/],
    ["version non entière", { version: 1.5, data: d }, /Champ version/],
    ["version 0", { version: 0, data: d }, /Champ version/],
    ["version texte", { version: "1", data: d }, /Champ version/],
    ["version absente", { data: d }, /Champ version/],
    ["data absent", { version: null }, /Champ data :/],
    ["data tableau", { version: null, data: [] }, /Champ data :/],
    ["corps tableau", [], /Corps attendu/]
  ];
  for (const [nom, payload, motif] of cas) {
    const r = await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload });
    assert.equal(r.statusCode, 400, nom);
    assert.match(json(r).erreur, motif, nom);
  }
  for (const id of ["jean-dupont", "cand-Lena-Garnier", "cand-a-b-c", "cand-" + "a".repeat(20) + "-b"]) {
    const r = await put(app, id, null, dossier(id));
    assert.equal(r.statusCode, 400, id);
    assert.deepEqual(json(r), { erreur: "Identifiant invalide." });
  }
  const gros = { version: null, data: { ...d, notes: "x".repeat(1048576) } };
  const g = await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: gros });
  assert.equal(g.statusCode, 413);
  assert.deepEqual(json(g), { erreur: "Dossier trop volumineux (1 Mo maximum)." });
  const t415 = await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: JSON.stringify({ version: null, data: d }), headers: { "content-type": "text/plain" } });
  assert.equal(t415.statusCode, 415);
  assert.equal(json(await requete(app, "rec@yeita.fr", { url: "/api/candidats" })).length, 0);
});

test("lecture : 404 introuvable, 400 identifiant invalide ; GET et DELETE acceptent un Content-Type JSON sans corps", async t => {
  const { app } = creerApp(t);
  const r = await requete(app, "rec@yeita.fr", { url: `/api/candidats/${ID}`, headers: { "content-type": "application/json" } });
  assert.equal(r.statusCode, 404);
  assert.deepEqual(json(r), { erreur: "Candidature introuvable.", code: "introuvable" });
  assert.equal((await requete(app, "rec@yeita.fr", { url: "/api/candidats/jean-dupont" })).statusCode, 400);
  await put(app, ID, null, dossier(ID));
  const del = await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}`, headers: { "content-type": "application/json" } });
  assert.equal(del.statusCode, 204);
  const encore = await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` });
  assert.deepEqual(json(encore), { erreur: "Candidature introuvable.", code: "introuvable" });
});

test("liste : enveloppes {id, version, data}, triées par meta.modifieLe décroissant", async t => {
  const { app } = creerApp(t);
  const ids = ["cand-a-1", "cand-b-2", "cand-c-3"];
  const dates = ["2026-10-02T00:00:00.000Z", "2026-10-03T00:00:00.000Z", "2026-10-01T00:00:00.000Z"];
  for (let i = 0; i < 3; i++) { const d = dossier(ids[i]); d.meta.modifieLe = dates[i]; await put(app, ids[i], null, d); }
  const liste = json(await requete(app, "lec@yeita.fr", { url: "/api/candidats" }));
  assert.deepEqual(liste.map(e => e.id), ["cand-b-2", "cand-a-1", "cand-c-3"]);
  for (const e of liste) assert.deepEqual(Object.keys(e), ["id", "version", "data"]);
});

test("journal : une ligne par écriture, sans contenu ; après suppression, une seule ligne", async t => {
  const { app, db } = creerApp(t);
  await put(app, ID, null, dossier(ID, "Léna Garnier", "appel"));
  await put(app, ID, 1, dossier(ID, "Léna Garnier", "ec1"));
  await put(app, ID, 2, dossier(ID, "Léna Garnier", "étape inventée"));
  const lignes = db.prepare("SELECT candidat_id, action, etape, par FROM journal ORDER BY id").all();
  assert.deepEqual(lignes, [
    { candidat_id: ID, action: "creation", etape: "appel", par: "rec@yeita.fr" },
    { candidat_id: ID, action: "modification", etape: "ec1", par: "rec@yeita.fr" },
    { candidat_id: ID, action: "modification", etape: null, par: "rec@yeita.fr" }
  ]);
  assert.deepEqual(Object.keys(db.prepare("SELECT * FROM journal").get()), ["id", "candidat_id", "action", "etape", "par", "le"]);
  await requete(app, "adm@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` });
  assert.deepEqual(db.prepare("SELECT candidat_id, action, etape, par FROM journal").all(),
    [{ candidat_id: ID, action: "suppression", etape: null, par: "adm@yeita.fr" }]);
});

test("effacement sur le disque : version remplacée et dossier supprimé introuvables, sans VACUUM", async t => {
  const { app, dbPath } = creerApp(t);
  await put(app, ID, null, dossier(ID, "REPERE-ANCIEN Garnier"));
  assert.deepEqual(fichiersContiennent(dbPath, "REPERE-ANCIEN"), [""], "le dossier vivant est dans la base");
  await put(app, ID, 1, dossier(ID, "REPERE-NOUVEAU Garnier"));
  assert.deepEqual(fichiersContiennent(dbPath, "REPERE-ANCIEN"), [], "version remplacée encore lisible");
  await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` });
  assert.deepEqual(fichiersContiennent(dbPath, "REPERE-NOUVEAU"), [], "dossier supprimé encore lisible");
});

test("base occupée : PUT en 503 après l'attente, rien d'écrit", { timeout: 20000 }, async t => {
  const { app, dbPath } = creerApp(t);
  const autre = new Database(dbPath);
  autre.exec("BEGIN IMMEDIATE");
  const r = await put(app, ID, null, dossier(ID));
  autre.exec("ROLLBACK"); autre.close();
  assert.equal(r.statusCode, 503);
  assert.deepEqual(json(r), { erreur: "Base occupée, réessaie dans un instant." });
  assert.equal(json(await requete(app, "rec@yeita.fr", { url: "/api/candidats" })).length, 0);
});

test("journal du serveur : ni nom ni email, y compris sur 400, 409, 413 et 500", async t => {
  const lignes = [];
  const { app, db } = creerApp(t, { flux: { write: l => lignes.push(l) } });
  await put(app, ID, null, dossier(ID, "REPERE-NOM Garnier"));
  await put(app, ID, 7, dossier(ID, "REPERE-NOM Garnier"));
  await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: { version: null, data: { ...dossier(ID, "REPERE-NOM"), schema: "x" } } });
  await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: { version: 1, data: { ...dossier(ID, "REPERE-NOM"), notes: "x".repeat(1048576) } } });
  await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: '{"data":{"nom":"REPERE-NOM"', headers: { "content-type": "application/json" } });
  /* Une ligne abîmée en base : la lecture tombe en 500. */
  /* Le message de JSON.parse cite alors le texte (V8 : « Unexpected token 'R', "REPERE-NOM…" is not valid JSON »). */
  db.prepare("UPDATE candidats SET data = ? WHERE id = ?").run("REPERE-NOM Garnier", ID);
  const r = await requete(app, "rec@yeita.fr", { url: `/api/candidats/${ID}` });
  assert.equal(r.statusCode, 500);
  assert.deepEqual(json(r), { erreur: "Erreur interne." });
  const tout = lignes.join("");
  assert.ok(tout.includes("Erreur interne"), "l'erreur 500 est journalisée");
  assert.ok(!tout.includes("REPERE-NOM"), "un nom de candidat est dans le journal du serveur");
  assert.ok(!tout.includes("rec@yeita.fr"), "un email est dans le journal du serveur");
});
