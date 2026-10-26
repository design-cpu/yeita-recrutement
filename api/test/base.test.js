import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import { ouvrirBase, ErreurBase, SCHEMA } from "../src/base.js";
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
  assert.deepEqual(tables, ["candidats", "equipe", "journal", "options_disponibilite"]);
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

test("base d'une version plus récente : refus", t => {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  const x = new Database(chemin); x.pragma("user_version = 2"); x.close();
  assert.throws(() => ouvrirBase(chemin), e => e instanceof ErreurBase && /version plus récente \(user_version 2\) : .*r\.sqlite\.$/.test(e.message));
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

test("deux ouvertures concurrentes d'une base neuve : la seconde attend puis réussit", { timeout: 20000 }, async t => {
  const chemin = path.join(dossierTemporaire(t), "r.sqlite");
  /* La première connexion crée le schéma et garde sa transaction pendant que la seconde s'ouvre (processus fils). */
  const a = new Database(chemin); a.pragma("journal_mode = WAL");
  a.exec("BEGIN IMMEDIATE");
  const fils = spawn(process.execPath, ["--input-type=module", "-e",
    `import { ouvrirBase } from ${JSON.stringify(new URL("../src/base.js", import.meta.url).href)};
     const { db, userVersion } = ouvrirBase(${JSON.stringify(chemin)}); console.log("ok", userVersion); db.close();`]);
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
