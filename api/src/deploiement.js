/* Le déploiement automatique, pour les admins (v1.9). L'état est lu dans <dossier de la base>/etat/deploiement.json,
   écrit par deploy/auto-deploy.sh ; une demande est déposée dans <dossier de la base>/demandes/deploiement.demande,
   que l'hôte prend, valide et traite. L'application ne lance aucune commande ; aucune donnée de candidat. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ErreurHttp } from "./app.js";
import { lire } from "./sauvegardes.js";

/* Format de la demande : une ligne clé=valeur par champ, lu de la même façon par deploy/auto-deploy.sh. */
export const CLES_DEMANDE = ["action", "commit", "par", "le"];
export const TAILLE_MAX_DEMANDE = 1024;
const MOTIF_COMMIT = /^[0-9a-f]{7,40}$/;
const MOTIF_LE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{3})?Z$/;
const MOTIF_PAR = /^[a-z0-9._%+-]+@[a-z0-9.-]+$/;

/* Demande en attente : null si absente ; {illisible: true} si ce n'est pas un fichier ordinaire, si elle est trop
   grande ou si ses champs ne sont pas exactement ceux attendus (mêmes règles que l'hôte, spec R6). */
export function lireDemande(fichier) {
  let info;
  try { info = fs.lstatSync(fichier); } catch (e) { if (e.code === "ENOENT") return null; return { illisible: true }; }
  if (!info.isFile() || info.size > TAILLE_MAX_DEMANDE) return { illisible: true };
  let texte;
  try { texte = fs.readFileSync(fichier, "utf8"); } catch { return { illisible: true }; }
  const d = {};
  for (const ligne of texte.split("\n")) {
    if (ligne === "") continue;
    const i = ligne.indexOf("=");
    const cle = i > 0 ? ligne.slice(0, i) : "";
    if (!CLES_DEMANDE.includes(cle) || Object.hasOwn(d, cle)) return { illisible: true };
    d[cle] = ligne.slice(i + 1);
  }
  const valide = CLES_DEMANDE.every(c => Object.hasOwn(d, c))
    && (d.action === "deployer" ? d.commit === "main" || MOTIF_COMMIT.test(d.commit) : d.action === "reprendre" && d.commit === "")
    && d.par.length <= 254 && MOTIF_PAR.test(d.par) && MOTIF_LE.test(d.le);
  return valide ? d : { illisible: true };
}

/* Corps de POST /api/deploiement/demande : {action: "deployer", commit: "main"|<hash>} ou {action: "reprendre"}. */
function demandeDuCorps(corps) {
  const erreur = () => new ErreurHttp(400, "Demande invalide : {action: \"deployer\", commit: \"main\" ou un hash de 7 à 40 caractères hexadécimaux}, ou {action: \"reprendre\"}.");
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) throw erreur();
  const cles = Object.keys(corps).sort().join(",");
  if (corps.action === "deployer" && cles === "action,commit"
    && typeof corps.commit === "string" && (corps.commit === "main" || MOTIF_COMMIT.test(corps.commit))) {
    return { action: "deployer", commit: corps.commit };
  }
  if (corps.action === "reprendre" && cles === "action") return { action: "reprendre", commit: "" };
  throw erreur();
}

export function routesDeploiement(app, db) {
  const base = path.dirname(db.name);
  const fichierEtat = path.join(base, "etat", "deploiement.json");
  const dossierDemandes = path.join(base, "demandes");
  const fichierDemande = path.join(dossierDemandes, "deploiement.demande");

  function adminRequis(req) {
    if (req.membre.role !== "admin") throw new ErreurHttp(403, "Réservé aux admins de l'équipe.", "admin-requis");
  }

  app.get("/api/deploiement", async req => {
    adminRequis(req);
    return { maintenant: new Date().toISOString(), etat: lire(fichierEtat), demande: lireDemande(fichierDemande) };
  });

  app.post("/api/deploiement/demande", async (req, rep) => {
    adminRequis(req);
    const voulue = demandeDuCorps(req.body);
    /* L'email est celui du membre identifié par onRequest, jamais l'en-tête brut ni le corps. */
    const enAttente = lireDemande(fichierDemande);
    if (enAttente && !enAttente.illisible && enAttente.action === voulue.action && enAttente.commit === voulue.commit
      && enAttente.par === req.membre.email) {
      return rep.code(202).send({ demande: enAttente });
    }
    const demande = { ...voulue, par: req.membre.email, le: new Date().toISOString() };
    const texte = CLES_DEMANDE.map(c => `${c}=${demande[c]}\n`).join("");
    /* Nom temporaire puis renommage : l'hôte ne lit jamais une demande à moitié écrite. */
    const temporaire = path.join(dossierDemandes, `.deploiement.demande.${crypto.randomBytes(6).toString("hex")}.tmp`);
    try {
      fs.mkdirSync(dossierDemandes, { recursive: true, mode: 0o700 });
      fs.writeFileSync(temporaire, texte, { mode: 0o600, flag: "wx" });
      fs.renameSync(temporaire, fichierDemande);
    } catch (e) {
      try { fs.rmSync(temporaire, { force: true }); } catch { /* rien à retirer */ }
      req.log.error({ erreur: { code: e.code } }, "Demande de déploiement non écrite");
      throw new ErreurHttp(503, "Le serveur n'a pas pu enregistrer la demande.", "demande-non-ecrite");
    }
    return rep.code(202).send({ demande });
  });
}
