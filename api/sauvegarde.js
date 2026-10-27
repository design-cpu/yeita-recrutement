/* Copie de la base, sur le serveur : node api/sauvegarde.js [--nettoyer]. Lancée chaque nuit par deploy/backup.sh.
   Copie cohérente par l'API de sauvegarde de SQLite (jamais sqlite3 .backup ni copie des fichiers : une lecture longue
   empêcherait le point de contrôle de l'API), contrôlée par integrity_check, en un seul fichier (journal DELETE).
   Écrite sous un nom temporaire puis renommée : le nom final ne désigne jamais une copie non contrôlée.
   Code 0 et chemin de la copie en dernière ligne si c'est fait ; code 1 sinon, avec un message en français. */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { cheminBase, ErreurConfig } from "./src/config.js";
import { ATTENTE_MS, estOccupee } from "./src/base.js";

const USAGE = `Usage :
  node api/sauvegarde.js              copie la base dans <dossier de la base>/sauvegardes/recrutement-AAAA-MM-JJ.db
  node api/sauvegarde.js --nettoyer   idem, puis supprime les copies de plus de 2 jours`;

const MOTIF_COPIE = /^recrutement-\d{4}-\d{2}-\d{2}\.db$/;
const MOTIF_TEMPORAIRE = /^recrutement-\d{4}-\d{2}-\d{2}\.db\.tmp-\d+$/;
const DUREE_GARDE_MS = 48 * 3600 * 1000;

class ErreurSauvegarde extends Error {}

function analyser(args) {
  if (args.length === 0) return { nettoyer: false };
  if (args.length === 1 && args[0] === "--nettoyer") return { nettoyer: true };
  throw new ErreurSauvegarde(USAGE);
}

/* Copie la base de `chemin` dans `dossier` ; rend le chemin de la copie contrôlée. */
async function copier(chemin, dossier, jour) {
  if (!fs.existsSync(chemin)) throw new ErreurSauvegarde(`Base absente : ${chemin}.`);
  fs.mkdirSync(dossier, { recursive: true, mode: 0o700 });
  const finale = path.join(dossier, `recrutement-${jour}.db`);
  const temporaire = `${finale}.tmp-${process.pid}`;
  let source, copie;
  try {
    source = new Database(chemin, { readonly: true, fileMustExist: true, timeout: ATTENTE_MS });
    await source.backup(temporaire);
    source.close();
    source = null;
    copie = new Database(temporaire, { fileMustExist: true });
    const controle = copie.pragma("integrity_check", { simple: true });
    if (controle !== "ok") throw new ErreurSauvegarde(`Copie abîmée, rien n'est gardé (integrity_check : ${controle}).`);
    copie.pragma("journal_mode = DELETE");
    copie.close();
    copie = null;
    fs.renameSync(temporaire, finale);
    return finale;
  } catch (e) {
    source?.close();
    copie?.close();
    for (const s of ["", "-wal", "-shm", "-journal"]) fs.rmSync(temporaire + s, { force: true });
    throw e;
  }
}

/* Supprime les copies et temporaires de plus de 2 jours ; jamais la copie du jour ni un autre fichier. */
function nettoyer(dossier, garder) {
  const limite = Date.now() - DUREE_GARDE_MS;
  let n = 0;
  for (const nom of fs.readdirSync(dossier)) {
    const p = path.join(dossier, nom);
    if (p === garder || !(MOTIF_COPIE.test(nom) || MOTIF_TEMPORAIRE.test(nom))) continue;
    const info = fs.lstatSync(p);
    if (info.isFile() && info.mtimeMs < limite) {
      fs.rmSync(p);
      n++;
    }
  }
  return n;
}

try {
  const options = analyser(process.argv.slice(2));
  const chemin = cheminBase(process.env);
  /* Copies lisibles par leur seul propriétaire, comme la base. */
  process.umask(0o077);
  const dossier = path.join(path.dirname(chemin), "sauvegardes");
  const jour = new Date().toISOString().slice(0, 10);
  const copie = await copier(chemin, dossier, jour);
  console.log(`Copie contrôlée (${fs.statSync(copie).size} octets).`);
  if (options.nettoyer) console.log(`Copies de plus de 2 jours supprimées : ${nettoyer(dossier, copie)}.`);
  console.log(copie);
} catch (e) {
  if (e instanceof ErreurSauvegarde || e instanceof ErreurConfig) console.error(e.message);
  else if (estOccupee(e)) console.error("Base occupée : rien n'a été copié, réessaie dans un instant.");
  else console.error(`Sauvegarde impossible : ${e.message}`);
  process.exit(1);
}
