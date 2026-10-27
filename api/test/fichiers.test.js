/* Les fichiers des candidats (1.7) : envoi, types, taille, nom nettoyé, accès, lecture, retrait, suppression avec le dossier. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { creerApp, requete, dossier, fichiersContiennent } from "./aide.js";
import { nomPropre } from "../src/fichiers.js";

const ID = "cand-mh3k2x1-ab12c";
const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from("CV-SECRET-MARQUEUR " + "x".repeat(200))]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const json = r => JSON.parse(r.body);

async function avecCandidat(t) {
  const c = creerApp(t);
  await requete(c.app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: { version: null, data: dossier(ID) } });
  return c;
}
const envoyer = (app, corps, { type = "application/pdf", nom = "CV Léna.pdf", champ = "cv", email = "rec@yeita.fr", id = ID } = {}) =>
  requete(app, email, { method: "POST", url: `/api/candidats/${id}/fichiers?champ=${champ}`, payload: corps,
    headers: { "content-type": type, "x-nom-fichier": encodeURIComponent(nom) } });

test("envoi d'un PDF : 201, métadonnées, relu tel quel avec son type et nosniff", async t => {
  const { app } = await avecCandidat(t);
  const r = await envoyer(app, PDF);
  assert.equal(r.statusCode, 201, r.body);
  const m = json(r);
  assert.match(m.id, /^fic-[a-f0-9]{18}$/);
  assert.deepEqual([m.champ, m.nom, m.type, m.taille, m.deposePar], ["cv", "CV Léna.pdf", "application/pdf", PDF.length, "rec@yeita.fr"]);
  const g = await requete(app, "lec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/${m.id}` });
  assert.equal(g.statusCode, 200);
  assert.equal(g.headers["content-type"], "application/pdf");
  assert.equal(g.headers["x-content-type-options"], "nosniff");
  assert.equal(g.headers["cache-control"], "no-store");
  assert.ok(g.rawPayload.equals(PDF));
  const l = await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers` });
  assert.deepEqual(json(l).map(x => x.id), [m.id]);
});

test("types : PNG accepté ; type annoncé faux, contenu d'un autre type ou type inconnu refusés (415)", async t => {
  const { app } = await avecCandidat(t);
  assert.equal((await envoyer(app, PNG, { type: "image/png", nom: "maquette.png", champ: "portfolio" })).statusCode, 201);
  const faux = await envoyer(app, PNG, { type: "application/pdf" });
  assert.equal(faux.statusCode, 415); assert.equal(json(faux).code, "type-fichier");
  assert.equal((await envoyer(app, Buffer.from("<script>alert(1)</script>"), { type: "image/jpeg" })).statusCode, 415);
  const html = await envoyer(app, Buffer.from("<html>"), { type: "text/html" });
  assert.equal(html.statusCode, 415);
});

test("taille : au-delà de 10 Mo, 413 « Fichier trop volumineux »", async t => {
  const { app } = await avecCandidat(t);
  const r = await envoyer(app, Buffer.concat([PDF, Buffer.alloc(10 * 1048576)]));
  assert.equal(r.statusCode, 413);
  assert.deepEqual(json(r), { erreur: "Fichier trop volumineux (10 Mo maximum).", code: "fichier-trop-gros" });
});

test("nom nettoyé : sans chemin ni caractère spécial, extension selon le type réel", () => {
  assert.equal(nomPropre(encodeURIComponent("../../etc/passwd"), "application/pdf"), "passwd.pdf");
  assert.equal(nomPropre(encodeURIComponent("C:\\Users\\x\\CV <final>;rm -rf.PDF"), "application/pdf"), "CV finalrm -rf.pdf");
  assert.equal(nomPropre(encodeURIComponent("photo.jpeg"), "image/jpeg"), "photo.jpg");
  assert.equal(nomPropre("", "image/png"), "fichier.png");
  assert.equal(nomPropre(encodeURIComponent("a".repeat(300) + ".pdf"), "application/pdf").length, 114);
});

test("accès : lecture seule ne dépose ni ne retire, hors équipe refusé, champ et identifiants contrôlés", async t => {
  const { app } = await avecCandidat(t);
  assert.equal((await envoyer(app, PDF, { email: "lec@yeita.fr" })).statusCode, 403);
  assert.equal((await envoyer(app, PDF, { email: "parti@yeita.fr" })).statusCode, 403);
  assert.equal((await envoyer(app, PDF, { email: "inconnu@yeita.fr" })).statusCode, 403);
  assert.equal((await envoyer(app, PDF, { champ: "photo" })).statusCode, 400);
  assert.equal((await envoyer(app, PDF, { id: "cand-absent-zzzzz" })).statusCode, 404);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/../x` })).statusCode < 500, true);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/fic-000000000000000000` })).statusCode, 404);
  const m = json(await envoyer(app, PDF));
  assert.equal((await requete(app, "lec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${m.id}` })).statusCode, 403);
  /* Un fichier ne se lit que sous son candidat. */
  const AUTRE = "cand-mh3k2x1-zz99z";
  await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${AUTRE}`, payload: { version: null, data: dossier(AUTRE) } });
  assert.equal((await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${AUTRE}/fichiers/${m.id}` })).statusCode, 404);
});

test("les dossiers restent en JSON seul : un PUT de fichier brut est refusé (415)", async t => {
  const { app } = await avecCandidat(t);
  const r = await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: PDF, headers: { "content-type": "application/pdf" } });
  assert.equal(r.statusCode, 415);
});

test("retrait puis suppression du candidat : fichiers effacés, y compris sur le disque", async t => {
  const { app, db, dbPath } = await avecCandidat(t);
  const a = json(await envoyer(app, PDF));
  await envoyer(app, PNG, { type: "image/png", champ: "portfolio" });
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${a.id}` })).statusCode, 204);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${a.id}` })).statusCode, 404);
  assert.equal(db.prepare("SELECT count(*) n FROM fichiers").get().n, 1);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` })).statusCode, 204);
  assert.equal(db.prepare("SELECT count(*) n FROM fichiers").get().n, 0);
  assert.deepEqual(fichiersContiennent(dbPath, "CV-SECRET-MARQUEUR"), []);
});
