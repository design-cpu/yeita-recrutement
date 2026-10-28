import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import { ouvrirBase, ErreurBase, SCHEMA, AJOUTS } from "../src/base.js";
import { dossierTemporaire } from "./aide.js";

const mode = p => (fs.statSync(p).mode & 0o777).toString(8);

test("base neuve : schéma, réglages, droits", t => {
  const d = path.join(dossierTemporaire(t), "data");
  const chemin = path.join(d, "r.sqlite");
  const { db, creee, userVersion } = ouvrirBase(chemin);
  t.after(() => db.close());
  assert.equal(creee, true);
  assert.equal(userVersion, 1);
  assert.equal(db.pragma("journal_mode", { simple: true }), "wal");
  assert.equal(db.pragma("secure_delete", { simple: true }), 1);
  assert.equal(db.pragma("busy_timeout", { simple: true }), 5000);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map(r => r.name);
  assert.deepEqual(tables, ["candidats", "equipe", "fichiers", "journal", "options_disponibilite"]);
  db.prepare("INSERT INTO options_disponibilite VALUES ('x', 'le')").run();
  assert.equal(mode(d), "700");
  for (const s of ["", "-wal", "-shm"]) assert.equal(mode(chemin + s), "600", `mode de ${s || "la base"}`);
});

test("réouverture : rien n'est recréé, données gardées", t => {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  const a = ouvrirBase(chemin);
  a.db.prepare("INSERT INTO options_disponibilite VALUES ('x', 'le')").run();
  a.db.close();
  const b = ouvrirBase(chemin);
  t.after(() => b.db.close());
  assert.equal(b.creee, false);
  assert.equal(b.db.prepare("SELECT count(*) n FROM options_disponibilite").get().n, 1);
});

test("base d'une version plus récente : refus, y compris une base de test passée en 2 par la branche d'avant la 1.10 (R1b)", t => {
  for (const v of [2, 3]) {
    const chemin = path.join(dossierTemporaire(t), "r.sqlite");
    const x = new Database(chemin); x.exec(SCHEMA); x.pragma(`user_version = ${v}`); x.close();
    assert.throws(() => ouvrirBase(chemin), e => e instanceof ErreurBase && new RegExp(`version plus récente \\(user_version ${v}\\) : .*r\\.sqlite\\.$`).test(e.message));
  }
});

test("échec provoqué pendant le schéma puis relance (règle 2)", t => {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  /* Une table journal créée à la main, user_version encore à 0. */
  const x = new Database(chemin); x.exec("CREATE TABLE journal (x)"); x.close();
  assert.throws(() => ouvrirBase(chemin), e => e instanceof ErreurBase && /Schéma impossible à appliquer/.test(e.message));
  const y = new Database(chemin);
  assert.equal(y.pragma("user_version", { simple: true }), 0);
  assert.deepEqual(y.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name), ["journal"]);
  y.exec("DROP TABLE journal"); y.close();
  const { db, userVersion } = ouvrirBase(chemin);
  t.after(() => db.close());
  assert.equal(userVersion, 1);
});

/* Une base de la 1.9 : schéma de la version 1, sans la table fichiers. */
function base19(t, avecCandidat = true) {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  const x = new Database(chemin); x.pragma("journal_mode = WAL"); x.exec(SCHEMA); x.pragma("user_version = 1");
  if (avecCandidat) x.prepare("INSERT INTO candidats VALUES ('cand-a-b', '{\"x\":1}', 1, 'le', 'par')").run();
  x.close();
  return chemin;
}

test("base de la 1.9 : table fichiers ajoutée, user_version reste 1, dossiers intacts (R1, CA1)", t => {
  const chemin = base19(t);
  const { db, userVersion } = ouvrirBase(chemin);
  t.after(() => db.close());
  assert.equal(userVersion, 1);
  assert.deepEqual(db.prepare("SELECT id, data, version FROM candidats").all(), [{ id: "cand-a-b", data: '{"x":1}', version: 1 }]);
  assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE name IN ('fichiers', 'fichiers_candidat') ORDER BY name").all().map(r => r.name), ["fichiers", "fichiers_candidat"]);
});

test("base à jour : l'ouverture n'écrit rien (aucun verrou pris)", t => {
  const chemin = base19(t);
  ouvrirBase(chemin).db.close();
  /* Une écriture en cours ailleurs ne bloque pas une ouverture de base à jour. */
  const a = new Database(chemin); a.exec("BEGIN IMMEDIATE");
  t.after(() => { a.exec("ROLLBACK"); a.close(); });
  const debut = Date.now();
  const { db } = ouvrirBase(chemin);
  db.close();
  assert.ok(Date.now() - debut < 1000, "l'ouverture d'une base à jour a attendu le verrou d'écriture");
});

test("retour vers la 1.9 : la base reste lisible par la règle de la 1.9 et la suppression d'un candidat emporte ses fichiers (R2, CA2)", t => {
  const chemin = base19(t);
  ouvrirBase(chemin).db.close();
  /* Ce que fait l'API de la 1.9 : refus au-delà de user_version 1, puis DELETE FROM candidats (clés étrangères actives par défaut). */
  const x = new Database(chemin);
  t.after(() => x.close());
  assert.equal(x.pragma("user_version", { simple: true }), 1);
  assert.equal(x.pragma("foreign_keys", { simple: true }), 1);
  x.prepare("INSERT INTO fichiers VALUES ('fic-000000000000000001', 'cand-a-b', 'cv', 'cv.pdf', 'application/pdf', 9, X'255044462D', 'le', 'par')").run();
  x.prepare("DELETE FROM candidats WHERE id = 'cand-a-b'").run();
  assert.equal(x.prepare("SELECT count(*) n FROM fichiers").get().n, 0);
});

test("base de la 1.9 complétée par une autre instance pendant l'attente : l'ouverture réussit sans recréer la table (R1)", { timeout: 20000 }, async t => {
  const chemin = base19(t);
  const a = new Database(chemin);
  a.exec("BEGIN IMMEDIATE");
  const fils = spawn(process.execPath, ["--input-type=module", "-e",
    `import { ouvrirBase } from ${JSON.stringify(new URL("../src/base.js", import.meta.url).href)};
     const { db, userVersion } = ouvrirBase(${JSON.stringify(chemin)}); console.log("ok " + userVersion); db.close();`]);
  t.after(() => fils.kill());
  let sortie = ""; fils.stdout.on("data", b => sortie += b); fils.stderr.on("data", b => sortie += b);
  await new Promise(r => setTimeout(r, 400));
  /* Pendant que le fils attend le verrou : la table est ajoutée ici, comme le ferait une autre instance de la 1.10. */
  a.exec(AJOUTS);
  a.exec("COMMIT"); a.close();
  const code = await Promise.race([new Promise(r => fils.on("exit", r)), new Promise(r => setTimeout(() => r("échéance"), 10000))]);
  assert.equal(code, 0, `l'ouverture pendant l'ajout par une autre instance a échoué : ${sortie}`);
  assert.match(sortie, /^ok 1/);
});

test("deux ouvertures simultanées d'une base de la 1.9 : la table est ajoutée une fois, les deux réussissent (R1, CA1)", { timeout: 20000 }, async t => {
  const chemin = base19(t);
  const ouvrir = () => new Promise(fin => {
    const fils = spawn(process.execPath, ["--input-type=module", "-e",
      `import { ouvrirBase } from ${JSON.stringify(new URL("../src/base.js", import.meta.url).href)};
       const { db, userVersion } = ouvrirBase(${JSON.stringify(chemin)}); console.log("ok " + userVersion); db.close();`]);
    let sortie = ""; fils.stdout.on("data", b => sortie += b); fils.stderr.on("data", b => sortie += b);
    const echeance = setTimeout(() => { fils.kill(); fin({ code: "échéance", sortie }); }, 10000);
    fils.on("exit", code => { clearTimeout(echeance); fin({ code, sortie }); });
    t.after(() => fils.kill());
  });
  const r = await Promise.all([ouvrir(), ouvrir(), ouvrir()]);
  for (const x of r) { assert.equal(x.code, 0, x.sortie); assert.match(x.sortie, /^ok 1/); }
  const y = new Database(chemin, { readonly: true });
  t.after(() => y.close());
  assert.equal(y.prepare("SELECT count(*) n FROM sqlite_master WHERE name = 'fichiers'").get().n, 1);
});

test("deux ouvertures concurrentes d'une base neuve : la seconde attend puis réussit", { timeout: 20000 }, async t => {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  /* La première connexion crée le schéma et garde sa transaction pendant que la seconde s'ouvre (processus fils). */
  const a = new Database(chemin); a.pragma("journal_mode = WAL");
  a.exec("BEGIN IMMEDIATE");
  const fils = spawn(process.execPath, ["--input-type=module", "-e",
    `import { ouvrirBase } from ${JSON.stringify(new URL("../src/base.js", import.meta.url).href)};
     const { db, userVersion } = ouvrirBase(${JSON.stringify(chemin)}); console.log("ok " + userVersion); db.close();`]);
  let sortie = ""; fils.stdout.on("data", b => sortie += b); fils.stderr.on("data", b => sortie += b);
  await new Promise(r => setTimeout(r, 400));
  /* Pendant que le fils attend : le schéma est créé ici, comme le ferait une autre instance. */
  a.exec(SCHEMA);
  a.pragma("user_version = 1");
  a.exec("COMMIT"); a.close();
  const code = await new Promise(r => fils.on("exit", r));
  assert.equal(code, 0, sortie);
  assert.match(sortie, /^ok 1/);
});
