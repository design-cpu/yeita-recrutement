/* Outils communs aux tests : dossiers temporaires, base de test, application prête à recevoir des requêtes. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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
