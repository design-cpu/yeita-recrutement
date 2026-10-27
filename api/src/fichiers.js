/* Les fichiers d'un candidat (CV, portfolio), depuis la 1.7 : gardés dans la base, à côté du dossier.
   Même accès que les dossiers (onRequest : équipe, lecture seule pour les GET), jamais servis comme fichiers du site.
   Envoi : POST /api/candidats/:id/fichiers?champ=cv|portfolio, le fichier brut en corps (Content-Type du fichier),
   son nom dans l'en-tête X-Nom-Fichier (encodeURIComponent). Types : PDF, PNG, JPG, reconnus à leurs premiers octets.
   Suppression du candidat : ses fichiers partent dans la même transaction (candidats.js). Point de contrôle après chaque écriture. */
import crypto from "node:crypto";
import { ErreurHttp } from "./app.js";
import { CHAMPS_FICHIER, LIMITE_FICHIER, MOTIF_FICHIER, MOTIF_ID, TYPES_FICHIER } from "./valeurs.js";

export const ROUTE_ENVOI = "/api/candidats/:id/fichiers";

const INTROUVABLE = () => new ErreurHttp(404, "Candidature introuvable.", "introuvable");
const FICHIER_INTROUVABLE = () => new ErreurHttp(404, "Fichier introuvable.", "fichier-introuvable");

/* Signatures des trois types acceptés. */
const SIGNATURES = {
  "application/pdf": b => b.length > 4 && b.subarray(0, 5).toString("latin1") === "%PDF-",
  "image/png": b => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
};
const EXTENSION = { "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg" };

/* Nom nettoyé : sans chemin, lettres, chiffres, espace, point, tiret, tiret bas et parenthèses ; 120 caractères au plus ;
   l'extension suit le type réel. */
export function nomPropre(brut, type) {
  let n = "";
  try { n = decodeURIComponent(String(brut ?? "")); } catch { n = String(brut ?? ""); }
  n = n.split(/[\\/]/).pop().normalize("NFC").replace(/[^\p{L}\p{N} ._()-]/gu, "").replace(/\s+/g, " ").replace(/^[.\s]+/, "").trim();
  n = n.replace(/\.(pdf|png|jpe?g)$/i, "").slice(0, 110).trim() || "fichier";
  return n + EXTENSION[type];
}

function idValide(id, motif = MOTIF_ID) {
  if (!motif.test(String(id))) throw new ErreurHttp(400, "Identifiant invalide.");
  return id;
}

const meta = l => ({ id: l.id, champ: l.champ, nom: l.nom, type: l.type, taille: l.taille, deposeLe: l.depose_le, deposePar: l.depose_par });

export function routesFichiers(app, db, pointDeControle) {
  const q = {
    candidat: db.prepare("SELECT 1 FROM candidats WHERE id = ?"),
    liste: db.prepare("SELECT id, champ, nom, type, taille, depose_le, depose_par FROM fichiers WHERE candidat_id = ? ORDER BY depose_le"),
    un: db.prepare("SELECT id, champ, nom, type, taille, contenu, depose_le, depose_par FROM fichiers WHERE id = ? AND candidat_id = ?"),
    ajouter: db.prepare("INSERT INTO fichiers (id, candidat_id, champ, nom, type, taille, contenu, depose_le, depose_par) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    retirer: db.prepare("DELETE FROM fichiers WHERE id = ? AND candidat_id = ?")
  };

  /* L'analyseur des fichiers n'existe que pour la route d'envoi (contexte encapsulé). */
  app.register(async sous => {
    sous.addContentTypeParser(TYPES_FICHIER, { parseAs: "buffer", bodyLimit: LIMITE_FICHIER }, (req, corps, fini) => fini(null, corps));
    sous.post(ROUTE_ENVOI, { bodyLimit: LIMITE_FICHIER }, async (req, rep) => {
      const id = idValide(req.params.id);
      const champ = req.query?.champ;
      if (!CHAMPS_FICHIER.includes(champ)) throw new ErreurHttp(400, "Champ attendu : cv ou portfolio.");
      const type = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      const corps = req.body;
      if (!Buffer.isBuffer(corps) || !corps.length) throw new ErreurHttp(400, "Fichier vide.");
      if (!SIGNATURES[type] || !SIGNATURES[type](corps)) throw new ErreurHttp(415, "Seuls les fichiers PDF, PNG et JPG sont acceptés.", "type-fichier");
      const f = { id: "fic-" + crypto.randomBytes(9).toString("hex"), nom: nomPropre(req.headers["x-nom-fichier"], type), le: new Date().toISOString(), par: req.membre.email };
      db.transaction(() => {
        if (!q.candidat.get(id)) throw INTROUVABLE();
        q.ajouter.run(f.id, id, champ, f.nom, type, corps.length, corps, f.le, f.par);
      }).immediate();
      pointDeControle(req.log);
      return rep.code(201).send({ id: f.id, champ, nom: f.nom, type, taille: corps.length, deposeLe: f.le, deposePar: f.par });
    });
  });

  app.get("/api/candidats/:id/fichiers", async req => {
    const id = idValide(req.params.id);
    if (!q.candidat.get(id)) throw INTROUVABLE();
    return q.liste.all(id).map(meta);
  });

  /* Ouvert dans un nouvel onglet : affiché par le navigateur, jamais interprété autrement que par son type. */
  app.get("/api/candidats/:id/fichiers/:fid", async (req, rep) => {
    const l = q.un.get(idValide(req.params.fid, MOTIF_FICHIER), idValide(req.params.id));
    if (!l) throw FICHIER_INTROUVABLE();
    return rep.type(l.type).header("X-Content-Type-Options", "nosniff")
      .header("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(l.nom)}`)
      .send(l.contenu);
  });

  app.delete("/api/candidats/:id/fichiers/:fid", async (req, rep) => {
    const fid = idValide(req.params.fid, MOTIF_FICHIER), id = idValide(req.params.id);
    db.transaction(() => { if (q.retirer.run(fid, id).changes === 0) throw FICHIER_INTROUVABLE(); }).immediate();
    pointDeControle(req.log);
    return rep.code(204).send();
  });
}
