/* Point d'entrée de l'API : lit la configuration, ouvre la base, écoute.
   Toute erreur de démarrage sort en code 1 avec une ligne en français ; SIGINT et SIGTERM ferment proprement (code 0). */
import { lireConfig, ErreurConfig } from "./src/config.js";
import { ouvrirBase, ErreurBase } from "./src/base.js";
import { construireApp } from "./src/app.js";
import { routesApi } from "./src/routes.js";

function arret(message) {
  console.error(message);
  process.exit(1);
}

let config, base;
try {
  config = lireConfig(process.env);
  base = ouvrirBase(config.dbPath);
} catch (e) {
  if (e instanceof ErreurConfig || e instanceof ErreurBase) arret(e.message);
  throw e;
}

const app = construireApp({ config, db: base.db, logger: { level: "info" }, routes: routesApi });

try {
  await app.listen({ host: config.host, port: config.port });
} catch (e) {
  base.db.close();
  const raison = e.code === "EADDRINUSE" ? "port déjà utilisé" : e.code === "EADDRNOTAVAIL" || e.code === "ENOTFOUND" ? "adresse indisponible" : e.code ?? e.message;
  arret(`Impossible d'écouter sur ${config.host}:${config.port} : ${raison}.`);
}

app.log.info({
  hote: config.host, port: config.port, base: config.dbPath, user_version: base.userVersion,
  node_env: process.env.NODE_ENV ?? null,
  ...(config.devEmail ? { dev_email: config.devEmail } : {}),
  ...(config.devStatic ? { dev_static: config.devStatic } : {})
}, "API démarrée");
if (!config.local) app.log.warn("L'API croit X-Forwarded-Email : elle ne doit être joignable que par oauth2-proxy.");
if (config.devEmail) app.log.warn(`Mode local : DEV_EMAIL=${config.devEmail}`);
if (config.devStatic) app.log.warn(`Mode local : DEV_STATIC=${config.devStatic}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await app.close();
    base.db.close();
    process.exit(0);
  });
}
