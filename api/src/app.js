/* L'application Fastify, construite à partir de la configuration et de la base ouverte (testable par inject, sans port).
   Chaque requête sous /api est identifiée et autorisée dans onRequest, donc avant l'analyse du corps ;
   seule la route GET /api/sante y échappe, reconnue par sa route et jamais par le texte de l'adresse. */
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { LIMITE_CORPS, emailValide } from "./valeurs.js";
import { estOccupee } from "./base.js";

const LECTURE = ["GET", "HEAD"];
const ROUTE_SANTE = "/api/sante";
const ROUTE_STATIQUE = "/*";

/* Erreur rendue telle quelle au client : {erreur, code?}. */
export class ErreurHttp extends Error {
  constructor(statut, message, code) { super(message); this.statut = statut; this.codeHttp = code; }
}

/* Routes d'administration (sauvegardes, déploiement) : réservées au rôle admin. */
export function adminRequis(req) {
  if (req.membre.role !== "admin") throw new ErreurHttp(403, "Réservé aux admins de l'équipe.", "admin-requis");
}

export function construireApp({ config, db, logger = false, routes = [] }) {
  /* maxParamLength : un :id trop long reste un « Identifiant invalide. » (400) jusqu'à 200 caractères. */
  const app = Fastify({ logger, bodyLimit: LIMITE_CORPS, routerOptions: { maxParamLength: 200 } });

  /* Seul le JSON est accepté (l'analyseur text/plain de Fastify est retiré). L'analyseur JSON de Fastify refuse
     __proto__ et constructor.prototype ; un corps vide, sur GET ou DELETE, vaut absent. */
  const analyseurJson = app.getDefaultJsonParser("error", "error");
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, corps, fini) =>
    corps === "" ? fini(null, undefined) : analyseurJson(req, corps, fini));

  const membre = db.prepare("SELECT email, prenom, role, actif FROM equipe WHERE email = ?");

  app.addHook("onRequest", async (req, rep) => {
    const route = req.routeOptions.url;
    if (route === ROUTE_SANTE) return;
    if (config.devStatic && route === ROUTE_STATIQUE) return;
    const entete = req.headers["x-forwarded-email"];
    const brut = entete === undefined || entete.trim() === "" ? config.devEmail : entete;
    const email = emailValide(brut);
    if (!email) throw new ErreurHttp(401, "Identité absente ou invalide.");
    const m = membre.get(email);
    if (!m || m.actif !== 1) throw new ErreurHttp(403, "Tu ne fais pas partie de l'équipe.", "hors-equipe");
    if (m.role === "lecture" && !LECTURE.includes(req.method)) throw new ErreurHttp(403, "Lecture seule : tu ne peux pas modifier.", "lecture-seule");
    req.membre = m;
  });

  /* PUT et POST exigent un corps JSON, même vide d'en-tête. */
  app.addHook("preValidation", async req => {
    if (req.method !== "PUT" && req.method !== "POST") return;
    const type = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json") throw new ErreurHttp(415, "Le corps doit être en JSON (application/json).");
  });

  /* Aucune réponse n'est gardée en cache, sauf les fichiers du site en mode local : décidé sur la route trouvée,
     pas sur le texte de l'adresse (/%61pi/… est routé vers /api/…). */
  app.addHook("onSend", async (req, rep) => {
    if (req.routeOptions.url !== ROUTE_STATIQUE) rep.header("Cache-Control", "no-store");
  });

  app.setErrorHandler((err, req, rep) => {
    if (err instanceof ErreurHttp) return envoyer(rep, err.statut, err.message, err.codeHttp);
    if (err.code === "FST_ERR_CTP_BODY_TOO_LARGE") return envoyer(rep, 413, "Dossier trop volumineux (1 Mo maximum).");
    if (err.code === "FST_ERR_CTP_INVALID_JSON_BODY") return envoyer(rep, 400, "JSON invalide.");
    if (err.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") return envoyer(rep, 415, "Le corps doit être en JSON (application/json).");
    if (estOccupee(err)) return envoyer(rep, 503, "Base occupée, réessaie dans un instant.");
    if (err.statusCode >= 400 && err.statusCode < 500) return envoyer(rep, err.statusCode, "Requête invalide.");
    /* Erreur inattendue : jamais le message brut au journal, il pourrait citer un dossier. */
    req.log.error({ erreur: { type: err.name, code: err.code, pile: String(err.stack ?? "").split("\n").slice(1).join("\n") } }, "Erreur interne");
    return envoyer(rep, 500, "Erreur interne.");
  });

  app.setNotFoundHandler((req, rep) => envoyer(rep, 404, "Route inconnue."));

  app.get(ROUTE_SANTE, async (req, rep) => {
    try { db.prepare("SELECT 1").get(); return { ok: true }; }
    catch { return rep.code(503).send({ ok: false }); }
  });

  app.get("/api/moi", async req => ({ email: req.membre.email, prenom: req.membre.prenom, role: req.membre.role }));

  const actifs = db.prepare("SELECT prenom, role FROM equipe WHERE actif = 1");
  app.get("/api/equipe", async () => actifs.all().sort((a, b) => a.prenom.localeCompare(b.prenom, "fr")));

  for (const r of routes) r(app, db);

  /* Mode local : le site construit, servi à la racine. Seule la route des fichiers échappe à l'autorisation. */
  if (config.devStatic) app.register(fastifyStatic, { root: config.devStatic, prefix: "/", wildcard: true, dotfiles: "deny" });

  /* Toute autre adresse sous /api : 404, après l'autorisation (jamais servie comme fichier en mode local). */
  app.all("/api/*", async () => { throw new ErreurHttp(404, "Route inconnue."); });

  return app;
}

export function envoyer(rep, statut, erreur, code) {
  return rep.code(statut).type("application/json; charset=utf-8").send(code ? { erreur, code } : { erreur });
}
