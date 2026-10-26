/* Le point d'entrée lancé en processus fils : démarrage, refus en code 1, écoute, mode local, arrêt en code 0. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dossierTemporaire } from "./aide.js";

const SERVEUR = fileURLToPath(new URL("../server.js", import.meta.url));

function portLibre() {
  return new Promise(r => { const s = net.createServer().listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
}

/* Lance l'API avec env (sans hériter des variables de l'API du poste) ; rend dès qu'elle a démarré ou qu'elle est sortie.
   Le processus est toujours arrêté à la fin du test, même si un test échoue avant. */
function lancer(t, env, cwd) {
  const propre = Object.fromEntries(Object.entries(process.env).filter(([k]) => !["PORT", "HOST", "DB_PATH", "NODE_ENV", "DEV_EMAIL", "DEV_STATIC"].includes(k)));
  const p = spawn(process.execPath, [SERVEUR], { env: { ...propre, ...env }, cwd: cwd ?? os.tmpdir() });
  let sortie = "";
  const fin = new Promise(r => p.on("exit", code => r(code)));
  t.after(async () => { if (p.exitCode === null && p.signalCode === null) { p.kill("SIGKILL"); await fin; } });
  const pret = new Promise(r => {
    const lire = b => { sortie += b; if (sortie.includes("API démarrée")) r("pret"); };
    p.stdout.on("data", lire); p.stderr.on("data", lire);
    fin.then(() => r("sortie"));
  });
  return { p, fin, pret, sortie: () => sortie };
}

async function demarrer(t, env, cwd) {
  const l = lancer(t, env, cwd);
  assert.equal(await l.pret, "pret", l.sortie());
  return l;
}

test("refus de démarrer : code 1 et une ligne qui nomme la variable", async t => {
  const d = dossierTemporaire(t);
  const base = path.join(d, "r.sqlite");
  const cas = [
    [{ PORT: "8000 # x", DB_PATH: base }, /^PORT refusé/],
    [{ DB_PATH: ":memory:" }, /^DB_PATH refusé/],
    [{ DB_PATH: base, HOST: "0.0.0.0", DEV_EMAIL: "moi@yeita.fr" }, /^DEV_EMAIL refusé : interdit quand HOST/],
    [{ DB_PATH: base, NODE_ENV: " Production ", DEV_EMAIL: "moi@yeita.fr" }, /^DEV_EMAIL refusé : interdit quand NODE_ENV/],
    [{ DB_PATH: base, DEV_STATIC: d }, /^DEV_STATIC refusé/]
  ];
  for (const [env, motif] of cas) {
    const l = lancer(t, env);
    assert.equal(await l.fin, 1, JSON.stringify(env));
    assert.match(l.sortie().trim(), motif);
    assert.equal(l.sortie().trim().split("\n").length, 1, "une seule ligne");
  }
  assert.equal(fs.existsSync(base), false, "aucune base créée avant le refus");
});

test("port occupé : code 1 et message", async t => {
  const d = dossierTemporaire(t);
  const occupe = net.createServer().listen(0, "127.0.0.1");
  await new Promise(r => occupe.on("listening", r));
  t.after(() => occupe.close());
  const port = occupe.address().port;
  const l = lancer(t, { PORT: String(port), DB_PATH: path.join(d, "r.sqlite") });
  assert.equal(await l.fin, 1);
  assert.match(l.sortie(), new RegExp(`Impossible d'écouter sur 127\\.0\\.0\\.1:${port} : port déjà utilisé\\.`));
});

test("démarrage : valeurs résolues journalisées, écoute sur 127.0.0.1 par défaut, arrêt en code 0", async t => {
  const d = dossierTemporaire(t);
  const port = await portLibre();
  const l = await demarrer(t, { PORT: String(port), DB_PATH: "base-relative.sqlite" }, d);
  const ligne = JSON.parse(l.sortie().split("\n").find(x => x.includes("API démarrée")));
  /* Chemin relatif résolu depuis api/, pas depuis le dossier courant. */
  const attendu = path.join(path.dirname(SERVEUR), "base-relative.sqlite");
  t.after(() => { for (const s of ["", "-wal", "-shm"]) fs.rmSync(attendu + s, { force: true }); });
  assert.deepEqual([ligne.hote, ligne.port, ligne.base, ligne.user_version], ["127.0.0.1", port, attendu, 1]);
  assert.ok(!l.sortie().includes("joignable que par oauth2-proxy"));
  const r = await fetch(`http://127.0.0.1:${port}/api/sante`);
  assert.deepEqual(await r.json(), { ok: true });
  /* Une adresse non locale de la machine ne répond pas. */
  const externe = Object.values(os.networkInterfaces()).flat().find(i => i && i.family === "IPv4" && !i.internal);
  if (externe) await assert.rejects(fetch(`http://${externe.address}:${port}/api/sante`), `joignable sur ${externe.address}`);
  l.p.kill("SIGTERM");
  assert.equal(await l.fin, 0);
});

test("HOST non local : avertissement d'exposition", async t => {
  const d = dossierTemporaire(t);
  const port = await portLibre();
  const l = await demarrer(t, { PORT: String(port), HOST: "0.0.0.0", DB_PATH: path.join(d, "r.sqlite") });
  assert.match(l.sortie(), /L'API croit X-Forwarded-Email : elle ne doit être joignable que par oauth2-proxy\./);
});

test("mode local : DEV_EMAIL et DEV_STATIC", async t => {
  const racine = dossierTemporaire(t);
  const site = path.join(racine, "_site");
  fs.mkdirSync(site);
  fs.writeFileSync(path.join(site, "index.html"), "<p>site de test</p>");
  const port = await portLibre();
  const l = await demarrer(t, { PORT: String(port), DB_PATH: path.join(racine, "data", "r.sqlite"), DEV_EMAIL: "dev@yeita.fr", DEV_STATIC: site });
  assert.match(l.sortie(), /Mode local : DEV_EMAIL=dev@yeita\.fr/);
  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /site de test/);
  assert.deepEqual(await (await fetch(`http://127.0.0.1:${port}/api/sante`)).json(), { ok: true });
  /* DEV_EMAIL n'est pas encore dans l'équipe : l'autorisation s'applique comme pour un vrai compte. */
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/moi`)).status, 403);
  /* Une adresse inconnue sous /api n'est jamais servie comme fichier. */
  const inconnue = await fetch(`http://127.0.0.1:${port}/api/index.html`);
  assert.equal(inconnue.status, 403);
});
