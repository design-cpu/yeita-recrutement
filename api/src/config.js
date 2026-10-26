/* Lecture et contrôle des variables d'environnement, en un seul endroit.
   lireConfig(env) rend la configuration ou lance une ErreurConfig dont le message nomme la variable en faute :
   le point d'entrée l'affiche et sort en code 1, avant toute écoute. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOTES_LOCAUX, emailValide } from "./valeurs.js";

/* Le dossier api/ : base de résolution de tout chemin relatif, quel que soit le dossier courant. */
export const DOSSIER_API = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_PAR_DEFAUT = "data/recrutement.sqlite";

export class ErreurConfig extends Error {}

/* Une variable vide vaut absente. */
function valeur(env, nom) {
  const v = env[nom];
  return v === undefined || v === "" ? undefined : v;
}

/* Refus de forme communs aux chemins : commentaire de fin de ligne ou guillemets restés dans la valeur. */
function formeDeChemin(nom, v) {
  if (v.includes("#")) throw new ErreurConfig(`${nom} refusé : « ${v} » contient « # » (commentaire resté dans la valeur ?).`);
  if (/["']/.test(v)) throw new ErreurConfig(`${nom} refusé : « ${v} » contient des guillemets.`);
}

/* Chemin de la base, partagé par l'API et equipe.js. */
export function cheminBase(env, dossierApi = DOSSIER_API) {
  const v = valeur(env, "DB_PATH");
  if (v === undefined) return path.resolve(dossierApi, BASE_PAR_DEFAUT);
  if (v.trim() === ":memory:") throw new ErreurConfig("DB_PATH refusé : « :memory: » perdrait tous les dossiers à l'arrêt.");
  formeDeChemin("DB_PATH", v);
  const chemin = path.resolve(dossierApi, v);
  if (fs.existsSync(chemin) && fs.statSync(chemin).isDirectory()) {
    throw new ErreurConfig(`DB_PATH refusé : ${chemin} est un dossier, il faut le chemin d'un fichier.`);
  }
  return chemin;
}

/* Chemin réel du chemin donné, ou de son plus proche parent existant (la base peut ne pas exister encore). */
function cheminReel(p) {
  let courant = p, reste = "";
  while (!fs.existsSync(courant)) {
    reste = path.join(path.basename(courant), reste);
    const parent = path.dirname(courant);
    if (parent === courant) break;
    courant = parent;
  }
  return path.join(fs.realpathSync(courant), reste);
}

function estDans(dossier, p) {
  const rel = path.relative(dossier, p);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function lireConfig(env, dossierApi = DOSSIER_API) {
  const port = (() => {
    const v = valeur(env, "PORT");
    if (v === undefined) return 8000;
    const n = /^\d+$/.test(v) ? Number(v) : NaN;
    if (!(n >= 1 && n <= 65535)) throw new ErreurConfig(`PORT refusé : « ${v} » (un entier de 1 à 65535 est attendu).`);
    return n;
  })();

  const host = valeur(env, "HOST") ?? "127.0.0.1";
  if (/\s/.test(host)) throw new ErreurConfig(`HOST refusé : « ${host} » contient un espace.`);
  const local = HOTES_LOCAUX.includes(host);
  const production = (env.NODE_ENV ?? "").trim().toLowerCase() === "production";

  const dbPath = cheminBase(env, dossierApi);

  /* Le mode local n'est accepté que sur une adresse de bouclage, hors production. */
  function modeLocal(nom) {
    if (production) throw new ErreurConfig(`${nom} refusé : interdit quand NODE_ENV vaut production.`);
    if (!local) throw new ErreurConfig(`${nom} refusé : interdit quand HOST (${host}) n'est pas 127.0.0.1, ::1 ou localhost.`);
  }

  let devEmail = null;
  const brutEmail = valeur(env, "DEV_EMAIL");
  if (brutEmail !== undefined) {
    modeLocal("DEV_EMAIL");
    devEmail = emailValide(brutEmail);
    if (!devEmail) throw new ErreurConfig(`DEV_EMAIL refusé : « ${brutEmail} » n'est pas une adresse @yeita.fr valide.`);
  }

  let devStatic = null;
  const brutStatic = valeur(env, "DEV_STATIC");
  if (brutStatic !== undefined) {
    modeLocal("DEV_STATIC");
    formeDeChemin("DEV_STATIC", brutStatic);
    const dossier = path.resolve(dossierApi, brutStatic);
    if (!fs.existsSync(dossier) || !fs.statSync(dossier).isDirectory()) {
      throw new ErreurConfig(`DEV_STATIC refusé : ${dossier} n'est pas un dossier existant.`);
    }
    if (!fs.existsSync(path.join(dossier, "index.html"))) {
      throw new ErreurConfig(`DEV_STATIC refusé : ${dossier} ne contient pas index.html (site construit attendu).`);
    }
    const reel = fs.realpathSync(dossier);
    if (estDans(reel, cheminReel(dbPath)) || estDans(reel, fs.realpathSync(dossierApi))) {
      throw new ErreurConfig(`DEV_STATIC refusé : ${dossier} contient la base ou le dossier api/, qui seraient servis.`);
    }
    devStatic = dossier;
  }

  return { host, port, local, production, dbPath, devEmail, devStatic };
}
