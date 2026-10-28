/* Les fichiers des candidats (1.10) : envoi, types, taille, nom nettoyé, accès, lecture, retrait, suppression avec le dossier. */
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
  assert.equal(g.headers["content-disposition"], "inline; filename*=UTF-8''" + encodeURIComponent("CV Léna.pdf"));
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

/* ---- 1.10, spec R6 : l'enregistrement du dossier garantit ses références et nettoie les fichiers non référencés ---- */
const HEURE = 3600 * 1000;
function horloge(depart = Date.parse("2026-10-28T10:00:00.000Z")) {
  let t = depart;
  const h = () => new Date(t);
  h.avancer = ms => { t += ms; };
  return h;
}
async function lire(app, id = ID) { return json(await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${id}` })); }
async function enregistrer(app, d, refs, { email = "rec@yeita.fr", version = d.version } = {}) {
  const data = structuredClone(d.data);
  data.identite.fichiers = { cv: null, portfolio: null, ...refs };
  return requete(app, email, { method: "PUT", url: `/api/candidats/${data.id}`, payload: { version, data } });
}
const ref = m => ({ id: m.id, nom: m.nom, type: m.type, taille: m.taille, le: m.deposeLe, par: m.deposePar });

test("R6 : un dossier qui référence un fichier absent, d'un autre candidat ou d'un autre champ est refusé (409), rien n'est écrit", async t => {
  const { app } = await avecCandidat(t);
  const AUTRE = "cand-mh3k2x1-zz99z";
  await requete(app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${AUTRE}`, payload: { version: null, data: dossier(AUTRE) } });
  const ailleurs = json(await envoyer(app, PDF, { id: AUTRE }));
  const cv = json(await envoyer(app, PDF));
  const avant = await lire(app);
  for (const refs of [{ cv: { id: "fic-000000000000000000" } }, { cv: ref(ailleurs) }, { portfolio: ref(cv) }]) {
    const r = await enregistrer(app, avant, refs);
    assert.equal(r.statusCode, 409, JSON.stringify(refs));
    assert.deepEqual(json(r), { erreur: "Le CV ou le portfolio de cette fiche n'existe plus. Recharge la page.", code: "fichier-introuvable" });
  }
  assert.equal((await lire(app)).version, avant.version);
  assert.equal((await enregistrer(app, avant, { cv: ref(cv) })).statusCode, 200);
  for (const mauvais of [{ cv: "fic-x" }, { cv: { id: "../x" } }]) assert.equal((await enregistrer(app, await lire(app), mauvais)).statusCode, 400);
});

test("R6 : deux recruteurs, B retire le CV pendant que A enregistre sur une version prédite → 409 pour A, aucune référence absente", async t => {
  const { app } = await avecCandidat(t);
  const cv = json(await envoyer(app, PDF));
  assert.equal((await enregistrer(app, await lire(app), { cv: ref(cv) })).statusCode, 200);
  const vueA = await lire(app);
  /* B : enregistre sans le CV, puis le retire de l'API (ordre de la spec R5). */
  assert.equal((await enregistrer(app, vueA, {}, { email: "adm@yeita.fr" })).statusCode, 200);
  assert.equal((await requete(app, "adm@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${cv.id}` })).statusCode, 204);
  /* A : départ de la page sur la version suivante prédite, avec sa copie qui référence encore le CV. */
  const r = await enregistrer(app, vueA, { cv: ref(cv) }, { version: vueA.version + 1 });
  assert.equal(r.statusCode, 409);
  assert.equal(json(r).code, "fichier-introuvable");
  assert.equal((await lire(app)).data.identite.fichiers.cv, null);
});

test("R6 : un fichier non référencé est gardé moins d'une heure, puis effacé (y compris des fichiers bruts) au premier enregistrement suivant", async t => {
  const h = horloge();
  const c = creerApp(t, { maintenant: h });
  await requete(c.app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${ID}`, payload: { version: null, data: dossier(ID) } });
  const AUTRE = "cand-mh3k2x1-zz99z";
  await requete(c.app, "rec@yeita.fr", { method: "PUT", url: `/api/candidats/${AUTRE}`, payload: { version: null, data: dossier(AUTRE) } });
  const voisin = json(await envoyer(c.app, PDF, { id: AUTRE }));
  const garde = json(await envoyer(c.app, PDF));
  const orphelin = json(await envoyer(c.app, Buffer.concat([Buffer.from("%PDF-1.4\nORPHELIN-MARQUEUR "), Buffer.alloc(3000, 0x41)]), { champ: "portfolio" }));
  assert.equal((await enregistrer(c.app, await lire(c.app), { cv: ref(garde) })).statusCode, 200);
  h.avancer(59 * 60 * 1000);
  assert.equal((await enregistrer(c.app, await lire(c.app), { cv: ref(garde) })).statusCode, 200);
  assert.deepEqual(json(await requete(c.app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers` })).map(x => x.id).sort(), [garde.id, orphelin.id].sort());
  h.avancer(2 * 60 * 1000);
  assert.equal((await enregistrer(c.app, await lire(c.app), { cv: ref(garde) })).statusCode, 200);
  assert.deepEqual(json(await requete(c.app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers` })).map(x => x.id), [garde.id]);
  assert.deepEqual(fichiersContiennent(c.dbPath, "ORPHELIN-MARQUEUR"), []);
  /* Le fichier non référencé d'un autre candidat n'est pas touché par l'enregistrement de celui-ci. */
  assert.equal((await requete(c.app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${AUTRE}/fichiers/${voisin.id}` })).statusCode, 200);
  /* Le fichier référencé, lui, n'est jamais effacé, quel que soit son âge. */
  h.avancer(48 * HEURE);
  assert.equal((await enregistrer(c.app, await lire(c.app), { cv: ref(garde) })).statusCode, 200);
  assert.equal((await requete(c.app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/${garde.id}` })).statusCode, 200);
});

test("limites et accès (CA9) : 10 Mo pile acceptés ; lecture : HEAD 200, POST par une adresse encodée refusé", async t => {
  const { app } = await avecCandidat(t);
  const pile = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(10 * 1048576 - 9, 0x41)]);
  const m = await envoyer(app, pile);
  assert.equal(m.statusCode, 201);
  assert.equal(json(m).taille, 10 * 1048576);
  assert.equal((await requete(app, "lec@yeita.fr", { method: "HEAD", url: `/api/candidats/${ID}/fichiers/${json(m).id}` })).statusCode, 200);
  const enc = await requete(app, "lec@yeita.fr", { method: "POST", url: `/api/candidats/${ID}/%66ichiers?champ=cv`, payload: PDF, headers: { "content-type": "application/pdf" } });
  assert.equal(enc.statusCode, 403);
});

test("R6 : un fichier encore cité par le dossier enregistré ne se retire pas (409 fichier-cite) ; après l'enregistrement sans lui, oui", async t => {
  const { app } = await avecCandidat(t);
  const cv = json(await envoyer(app, PDF));
  assert.equal((await enregistrer(app, await lire(app), { cv: ref(cv) })).statusCode, 200);
  const r = await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${cv.id}` });
  assert.equal(r.statusCode, 409);
  assert.deepEqual(json(r), { erreur: "Ce fichier est encore sur la fiche. Recharge la page.", code: "fichier-cite" });
  assert.equal((await requete(app, "rec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/${cv.id}` })).statusCode, 200);
  /* Même règle pour le portfolio. */
  const pf = json(await envoyer(app, PNG, { type: "image/png", champ: "portfolio" }));
  assert.equal((await enregistrer(app, await lire(app), { cv: ref(cv), portfolio: ref(pf) })).statusCode, 200);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${pf.id}` })).statusCode, 409);
  /* Enregistré sans eux, ils se retirent. */
  assert.equal((await enregistrer(app, await lire(app), {})).statusCode, 200);
  for (const f of [cv, pf]) assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${f.id}` })).statusCode, 204);
});

/* ---- QA 1.10 : contrôles ajoutés par la QA de version ---- */
test("QA R10 (CA10) : le repère d'un CV disparaît des fichiers bruts dès son retrait, puis à la suppression d'un candidat dont le CV est référencé", async t => {
  const { app, dbPath } = await avecCandidat(t);
  const marque = n => Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from(`QA-REPERE-${n} `.repeat(50))]);
  const a = json(await envoyer(app, marque("RETRAIT")));
  assert.ok(fichiersContiennent(dbPath, "QA-REPERE-RETRAIT").length > 0, "le repère est bien écrit avant le retrait");
  /* Retrait seul (dossier jamais enregistré avec lui) : aucune autre écriture après. */
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}/fichiers/${a.id}` })).statusCode, 204);
  assert.deepEqual(fichiersContiennent(dbPath, "QA-REPERE-RETRAIT"), []);
  /* Suppression d'un candidat dont le dossier référence le CV. */
  const b = json(await envoyer(app, marque("SUPPRESSION")));
  assert.equal((await enregistrer(app, await lire(app), { cv: ref(b) })).statusCode, 200);
  assert.ok(fichiersContiennent(dbPath, "QA-REPERE-SUPPRESSION").length > 0);
  assert.equal((await requete(app, "rec@yeita.fr", { method: "DELETE", url: `/api/candidats/${ID}` })).statusCode, 204);
  assert.deepEqual(fichiersContiennent(dbPath, "QA-REPERE-SUPPRESSION"), []);
});

test("QA R6 (deux recruteurs) : B retire un CV que le dossier enregistré par A cite → 409 fichier-cite, dossier intact (version, données), CV lisible, y compris par une adresse encodée", async t => {
  const { app } = await avecCandidat(t);
  const cv = json(await envoyer(app, PDF));
  assert.equal((await enregistrer(app, await lire(app), { cv: ref(cv) })).statusCode, 200);
  const avant = await lire(app);
  for (const url of [`/api/candidats/${ID}/fichiers/${cv.id}`, `/api/candidats/${ID}/%66ichiers/${cv.id}`]) {
    const r = await requete(app, "adm@yeita.fr", { method: "DELETE", url });
    assert.equal(r.statusCode, 409, url);
    assert.equal(json(r).code, "fichier-cite");
  }
  assert.deepEqual(await lire(app), avant);
  const g = await requete(app, "adm@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/${cv.id}` });
  assert.equal(g.statusCode, 200);
  assert.ok(g.rawPayload.equals(PDF));
});

test("QA CA9 : rôle lecture par une adresse encodée (%66ichiers) : GET et HEAD 200, DELETE 403, fichier intact", async t => {
  const { app } = await avecCandidat(t);
  const m = json(await envoyer(app, PDF));
  const enc = `/api/candidats/${ID}/%66ichiers/${m.id}`;
  assert.equal((await requete(app, "lec@yeita.fr", { method: "GET", url: enc })).statusCode, 200);
  assert.equal((await requete(app, "lec@yeita.fr", { method: "HEAD", url: enc })).statusCode, 200);
  assert.equal((await requete(app, "lec@yeita.fr", { method: "DELETE", url: enc })).statusCode, 403);
  assert.equal((await requete(app, "lec@yeita.fr", { method: "GET", url: `/api/candidats/${ID}/fichiers/${m.id}` })).statusCode, 200);
});
