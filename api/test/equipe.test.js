/* Commandes en ligne en processus fils.
   equipe.js : commandes, affichages, erreurs, base partagée avec l'API, échec provoqué puis relance.
   sauvegarde.js (v1.7) : copie contrôlée pendant des écritures, échecs sans fichier laissé, --nettoyer. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { dossierTemporaire, creerApp, requete } from "./aide.js";

const EQUIPE = fileURLToPath(new URL("../equipe.js", import.meta.url));
const SAUVEGARDE = fileURLToPath(new URL("../sauvegarde.js", import.meta.url));
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

/* --- sauvegarde.js (v1.7) --- */

/* Lancée sous le masque 022 (celui d'un shell ordinaire) : le processus de test a pris 077 en ouvrant des bases,
   et le fils en hériterait, ce qui cacherait l'absence de masque dans sauvegarde.js. */
const SOUS_022 = ["-c", 'umask 022; exec "$0" "$@"', process.execPath, SAUVEGARDE];
function sauvegarde(dbPath, ...args) {
  const r = spawnSync("/bin/sh", [...SOUS_022, ...args], { env: { ...process.env, DB_PATH: dbPath }, encoding: "utf8", timeout: 15000 });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr };
}
const JOUR = () => new Date().toISOString().slice(0, 10);

/* Base de l'API avec n dossiers (texte repère dans chacun). */
function baseRemplie(dbPath, n) {
  assert.equal(equipe(dbPath, "add", "leo@yeita.fr", "Léo").code, 0);
  const db = new Database(dbPath);
  const ins = db.prepare("INSERT INTO candidats (id, data, version, modifie_le, modifie_par) VALUES (?, ?, 1, '2026-10-27', 'leo@yeita.fr')");
  db.transaction(() => { for (let i = 0; i < n; i++) ins.run(`cand-a-${i}`, JSON.stringify({ repere: "REPERE-" + i, texte: "x".repeat(500) })); })();
  return db;
}

test("sauvegarde : copie contrôlée pendant des écritures, un seul fichier 600, dernière ligne = chemin (CA1)", { timeout: 20000 }, async t => {
  const dossier = dossierTemporaire(t);
  const dbPath = path.join(dossier, "r.sqlite");
  const db = baseRemplie(dbPath, 5000);
  /* Une autre connexion écrit pendant toute la copie. */
  let ecrites = 0;
  const ins = db.prepare("INSERT INTO candidats (id, data, version, modifie_le, modifie_par) VALUES (?, '{}', 1, '2026-10-27', 'leo@yeita.fr')");
  const minuterie = setInterval(() => { ins.run(`cand-b-${ecrites}`); ecrites++; }, 1);
  const fils = spawn("/bin/sh", SOUS_022, { env: { ...process.env, DB_PATH: dbPath } });
  t.after(() => fils.kill());
  let sortie = "", erreur = "";
  fils.stdout.on("data", b => sortie += b); fils.stderr.on("data", b => erreur += b);
  const code = await new Promise(r => fils.on("exit", r));
  clearInterval(minuterie);
  db.close();
  assert.equal(code, 0, erreur);
  const copie = path.join(dossier, "sauvegardes", `recrutement-${JOUR()}.db`);
  assert.equal(sortie.trim().split("\n").at(-1), copie, "dernière ligne = chemin de la copie");
  assert.deepEqual(fs.readdirSync(path.join(dossier, "sauvegardes")), [path.basename(copie)], "un seul fichier, ni -wal, ni -shm, ni temporaire");
  assert.equal(mode(path.join(dossier, "sauvegardes")), "700");
  assert.equal(mode(copie), "600");
  const c = new Database(copie, { readonly: true });
  assert.equal(c.pragma("integrity_check", { simple: true }), "ok");
  assert.equal(c.pragma("journal_mode", { simple: true }), "delete");
  assert.equal(c.prepare("SELECT count(*) n FROM candidats WHERE id LIKE 'cand-a-%'").get().n, 5000, "toutes les lignes validées avant le lancement");
  assert.ok(c.prepare("SELECT count(*) n FROM candidats WHERE id LIKE 'cand-b-%'").get().n <= ecrites, "au plus celles écrites pendant");
  c.close();
  /* Une seconde copie le même jour remplace la première. */
  assert.equal(sauvegarde(dbPath).code, 0);
  assert.deepEqual(fs.readdirSync(path.join(dossier, "sauvegardes")), [path.basename(copie)]);
});

test("sauvegarde : base absente, base abîmée, dossier non inscriptible, argument inconnu → code 1, rien laissé (CA2)", t => {
  const dossier = dossierTemporaire(t);
  const absente = path.join(dossier, "absente.sqlite");
  let r = sauvegarde(absente);
  assert.equal(r.code, 1);
  assert.match(r.erreur, /^Base absente : /);
  assert.equal(fs.existsSync(absente), false, "aucune base créée");

  /* Pages écrasées dans la base source (comme V3) : la copie les recopie, le contrôle la refuse. */
  const abimee = path.join(dossier, "abimee", "r.sqlite");
  fs.mkdirSync(path.dirname(abimee));
  baseRemplie(abimee, 300).close();
  const octets = fs.readFileSync(abimee);
  octets.fill(0x41, 4096 * 5, 4096 * 5 + 2000);
  fs.writeFileSync(abimee, octets);
  /* Une bonne copie du jour existe déjà : l'échec ne doit pas la toucher. */
  const copies = path.join(path.dirname(abimee), "sauvegardes");
  fs.mkdirSync(copies, { mode: 0o700 });
  const bonne = new Database(path.join(copies, `recrutement-${JOUR()}.db`));
  bonne.exec("CREATE TABLE t (x); INSERT INTO t VALUES ('bonne copie')"); bonne.pragma("journal_mode = DELETE"); bonne.close();
  const avant = fs.readFileSync(path.join(copies, `recrutement-${JOUR()}.db`));
  r = sauvegarde(abimee);
  assert.equal(r.code, 1);
  assert.match(r.erreur, /^Copie abîmée, rien n'est gardé \(integrity_check : /);
  assert.deepEqual(fs.readdirSync(copies), [`recrutement-${JOUR()}.db`], "ni temporaire ni copie abîmée");
  assert.ok(fs.readFileSync(path.join(copies, `recrutement-${JOUR()}.db`)).equals(avant), "la copie précédente du jour est intacte");

  if (process.getuid?.() !== 0) {
    const bloque = path.join(dossier, "bloque", "r.sqlite");
    fs.mkdirSync(path.dirname(bloque));
    baseRemplie(bloque, 1).close();
    fs.mkdirSync(path.join(path.dirname(bloque), "sauvegardes"), { mode: 0o500 });
    r = sauvegarde(bloque);
    fs.chmodSync(path.join(path.dirname(bloque), "sauvegardes"), 0o700);
    assert.equal(r.code, 1);
    assert.match(r.erreur, /^Sauvegarde impossible : /);
    assert.deepEqual(fs.readdirSync(path.join(path.dirname(bloque), "sauvegardes")), []);
  } else t.diagnostic("lancé en root : cas « dossier non inscriptible » ignoré");

  r = sauvegarde(absente, "--tout");
  assert.equal(r.code, 1);
  assert.match(r.erreur, /^Usage/);
});

test("sauvegarde --nettoyer : copies et temporaires de plus de 48 h seulement (CA3)", t => {
  const dossier = dossierTemporaire(t);
  const dbPath = path.join(dossier, "r.sqlite");
  baseRemplie(dbPath, 1).close();
  const copies = path.join(dossier, "sauvegardes");
  fs.mkdirSync(copies, { mode: 0o700 });
  const heures = h => new Date(Date.now() - h * 3600 * 1000);
  const fichiers = {
    "recrutement-2026-01-01.db": 49, "recrutement-2026-01-01.db.tmp-123": 49,
    "recrutement-2026-01-02.db": 47, "autre.db": 100, "recrutement-2026-01-03.txt": 100
  };
  for (const [nom, h] of Object.entries(fichiers)) {
    fs.writeFileSync(path.join(copies, nom), "x");
    fs.utimesSync(path.join(copies, nom), heures(h), heures(h));
  }
  const r = sauvegarde(dbPath, "--nettoyer");
  assert.equal(r.code, 0, r.erreur);
  assert.match(r.sortie, /Copies de plus de 2 jours supprimées : 2\./);
  assert.deepEqual(fs.readdirSync(copies).sort(), ["autre.db", "recrutement-2026-01-02.db", "recrutement-2026-01-03.txt", `recrutement-${JOUR()}.db`].sort());
});
