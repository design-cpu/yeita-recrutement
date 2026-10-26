/* equipe.js en processus fils : commandes, affichages, erreurs, base partagée avec l'API, échec provoqué puis relance. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { dossierTemporaire, creerApp, requete } from "./aide.js";

const EQUIPE = fileURLToPath(new URL("../equipe.js", import.meta.url));
const mode = p => (fs.statSync(p).mode & 0o777).toString(8);

function equipe(dbPath, ...args) {
  const r = spawnSync(process.execPath, [EQUIPE, ...args], { env: { ...process.env, DB_PATH: dbPath }, encoding: "utf8" });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr };
}

test("premier admin : base créée, affichée, droits réservés", t => {
  const d = path.join(dossierTemporaire(t), "data");
  const dbPath = path.join(d, "r.sqlite");
  const r = equipe(dbPath, "add", "Sacha.Martin@Yeita.fr", "Sacha", "admin");
  assert.equal(r.code, 0, r.erreur);
  assert.equal(r.sortie.split("\n")[0], `Base : ${dbPath} (créée)`);
  assert.match(r.sortie, /Ajouté : sacha\.martin@yeita\.fr · Sacha · admin · actif · ajouté le \d{4}-/);
  assert.equal(mode(d), "700");
  assert.equal(mode(dbPath), "600");
  const encore = equipe(dbPath, "list");
  assert.equal(encore.sortie.split("\n")[0], `Base : ${dbPath}`);
});

test("commandes : add, list, disable, role, réactivation", t => {
  const dbPath = path.join(dossierTemporaire(t), "r.sqlite");
  assert.equal(equipe(dbPath, "list").sortie.split("\n")[1], "Aucun membre.");
  equipe(dbPath, "add", "leo@yeita.fr", "Léo");
  equipe(dbPath, "add", "pauline@yeita.fr", "Pauline", "lecture");
  let r = equipe(dbPath, "role", "leo@yeita.fr", "admin");
  assert.match(r.sortie, /Rôle changé : leo@yeita\.fr · Léo · admin · actif/);
  r = equipe(dbPath, "disable", "pauline@yeita.fr");
  assert.match(r.sortie, /Désactivé : pauline@yeita\.fr · Pauline · lecture · désactivé/);
  r = equipe(dbPath, "role", "pauline@yeita.fr", "recruteur");
  assert.match(r.sortie, /pauline@yeita\.fr · Pauline · recruteur · désactivé/, "role ne réactive pas");
  r = equipe(dbPath, "list");
  assert.deepEqual(r.sortie.trim().split("\n").slice(1).map(l => l.split(" · ").slice(0, 4).join(" · ")), [
    "leo@yeita.fr · Léo · admin · actif", "pauline@yeita.fr · Pauline · recruteur · désactivé"
  ]);
  r = equipe(dbPath, "add", "pauline@yeita.fr", "Pauline B.", "lecture");
  assert.match(r.sortie, /Réactivé : pauline@yeita\.fr · Pauline B\. · lecture · actif/);
});

test("erreurs : code 1, message, base non créée pour une commande mal tapée", t => {
  const dbPath = path.join(dossierTemporaire(t), "r.sqlite");
  const cas = [
    [["add", "leo@gmail.com", "Léo"], /^Email invalide/],
    [["add", "leo@yeita.fr", "admin"], /est un rôle, pas un prénom/],
    [["add", "leo@yeita.fr", "Léo", "chef"], /^Rôle inconnu/],
    [["add", "leo@yeita.fr", "  "], /^Prénom manquant/],
    [["supprime", "leo@yeita.fr"], /^Usage/],
    [[], /^Usage/]
  ];
  for (const [args, motif] of cas) {
    const r = equipe(dbPath, ...args);
    assert.equal(r.code, 1, args.join(" "));
    assert.match(r.erreur, motif, args.join(" "));
  }
  assert.equal(fs.existsSync(dbPath), false);
  equipe(dbPath, "add", "leo@yeita.fr", "Léo");
  for (const [args, motif] of [[["add", "leo@yeita.fr", "Léo"], /^Déjà membre actif/], [["disable", "x@yeita.fr"], /^Membre inconnu/], [["role", "x@yeita.fr", "admin"], /^Membre inconnu/]]) {
    const r = equipe(dbPath, ...args);
    assert.equal(r.code, 1);
    assert.match(r.erreur, motif);
  }
  assert.equal(equipe(dbPath, "add", "x@yeita.fr", "X").code, 0);
  const autre = equipe(":memory:", "list");
  assert.equal(autre.code, 1);
  assert.match(autre.erreur, /^DB_PATH refusé/);
});

test("même base que l'API : disable pris en compte à la requête suivante", async t => {
  const { app, dbPath } = creerApp(t);
  assert.equal((await requete(app, "rec@yeita.fr", { url: "/api/moi" })).statusCode, 200);
  assert.equal(equipe(dbPath, "disable", "rec@yeita.fr").code, 0);
  assert.equal((await requete(app, "rec@yeita.fr", { url: "/api/moi" })).statusCode, 403);
});

test("base occupée : add attend puis réussit ; délai dépassé, échec puis relance (règle 2)", { timeout: 30000 }, async t => {
  const dbPath = path.join(dossierTemporaire(t), "r.sqlite");
  equipe(dbPath, "list");
  const verrou = new Database(dbPath);
  /* Le verrou est relâché après 1 s : add attend puis réussit. */
  verrou.exec("BEGIN IMMEDIATE");
  const fils = spawn(process.execPath, [EQUIPE, "add", "leo@yeita.fr", "Léo"], { env: { ...process.env, DB_PATH: dbPath } });
  let sortie = ""; fils.stdout.on("data", b => sortie += b); fils.stderr.on("data", b => sortie += b);
  await new Promise(r => setTimeout(r, 1000));
  verrou.exec("COMMIT");
  assert.equal(await new Promise(r => fils.on("exit", r)), 0, sortie);
  /* Le verrou est gardé au-delà du délai : échec en code 1, rien d'écrit ; la relance réussit. */
  verrou.exec("BEGIN IMMEDIATE");
  const bloque = spawn(process.execPath, [EQUIPE, "add", "pauline@yeita.fr", "Pauline"], { env: { ...process.env, DB_PATH: dbPath } });
  let err = ""; bloque.stderr.on("data", b => err += b);
  assert.equal(await new Promise(r => bloque.on("exit", r)), 1);
  assert.match(err, /^Base occupée/);
  verrou.exec("COMMIT"); verrou.close();
  assert.equal(equipe(dbPath, "add", "pauline@yeita.fr", "Pauline").code, 0);
  const lecture = new Database(dbPath);
  assert.equal(lecture.prepare("SELECT count(*) n FROM equipe WHERE email = 'pauline@yeita.fr'").get().n, 1);
  lecture.close();
});

test("schéma impossible (table journal à user_version 0) : code 1, base inchangée, relance après correction (QA)", t => {
  const dbPath = path.join(dossierTemporaire(t), "r.sqlite");
  const x = new Database(dbPath); x.exec("CREATE TABLE journal (x)"); x.close();
  const r = equipe(dbPath, "add", "leo@yeita.fr", "Léo");
  assert.equal(r.code, 1);
  assert.match(r.erreur, /^Schéma impossible à appliquer/);
  const y = new Database(dbPath);
  assert.equal(y.pragma("user_version", { simple: true }), 0);
  assert.deepEqual(y.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(l => l.name), ["journal"]);
  y.exec("DROP TABLE journal"); y.close();
  const relance = equipe(dbPath, "add", "leo@yeita.fr", "Léo");
  assert.equal(relance.code, 0, relance.erreur);
  assert.match(relance.sortie, /Ajouté : leo@yeita\.fr · Léo · recruteur · actif/);
});
