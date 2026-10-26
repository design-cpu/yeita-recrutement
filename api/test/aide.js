/* Outils communs aux tests : dossiers temporaires, base de test, application prête à recevoir des requêtes. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ouvrirBase } from "../src/base.js";
import { construireApp } from "../src/app.js";
import { routesApi } from "../src/routes.js";

export function dossierTemporaire(t) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "recrutement-api-"));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}

/* Un faux dossier api/ (pour les chemins relatifs) contenant un site construit minimal. */
export function siteConstruit(dossier) {
  const site = path.join(dossier, "_site");
  fs.mkdirSync(site, { recursive: true });
  fs.writeFileSync(path.join(site, "index.html"), "<!doctype html><title>site</title>");
  return site;
}

/* Un dossier v3 minimal, au format de assets/dossier.js. */
export function dossier(id, nom = "Léna Garnier", etape = "appel") {
  return {
    schema: "yeita-dossier-candidat", version: 3, id,
    candidat: { nom, role: "PM" },
    identite: { personne: nom },
    parcours: { etape, etapes: {}, cloture: null },
    meta: { creeLe: "2026-10-01T10:00:00.000Z", modifieLe: "2026-10-01T10:00:00.000Z" }
  };
}

/* Lit les octets des fichiers de la base (.sqlite, -wal, -shm) pour y chercher un texte. */
export function fichiersContiennent(chemin, texte) {
  return ["", "-wal", "-shm"].filter(s => fs.existsSync(chemin + s) && fs.readFileSync(chemin + s).toString("latin1").includes(texte));
}

/* Membres de test : un par rôle, plus un désactivé. */
export const MEMBRES = [
  ["rec@yeita.fr", "Léo", "recruteur", 1],
  ["adm@yeita.fr", "Sacha", "admin", 1],
  ["lec@yeita.fr", "Pauline", "lecture", 1],
  ["parti@yeita.fr", "Ancien", "recruteur", 0]
];

/* Base temporaire avec l'équipe de test, et l'application construite dessus. logger : un flux pour capturer le journal. */
export function creerApp(t, { config = {}, flux = null } = {}) {
  const dossierBase = dossierTemporaire(t);
  const dbPath = path.join(dossierBase, "r.sqlite");
  const { db } = ouvrirBase(dbPath);
  const ins = db.prepare("INSERT INTO equipe VALUES (?, ?, ?, ?, '2026-10-26T00:00:00.000Z')");
  for (const m of MEMBRES) ins.run(...m);
  const conf = { host: "127.0.0.1", port: 8000, local: true, production: false, dbPath, devEmail: null, devStatic: null, ...config };
  const logger = flux ? { level: "info", stream: flux } : false;
  const app = construireApp({ config: conf, db, logger, routes: routesApi });
  t.after(async () => { await app.close(); db.close(); });
  return { app, db, dbPath };
}

/* Requête au nom d'un membre (email) ; email null : sans en-tête. */
export function requete(app, email, opts) {
  const headers = { ...(opts.headers ?? {}) };
  if (email) headers["x-forwarded-email"] = email;
  return app.inject({ ...opts, headers });
}
