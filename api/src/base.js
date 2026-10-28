/* Ouverture de la base SQLite et application du schéma, communes à l'API et à equipe.js.
   Ordre (spec R12) : masque, WAL et réglages hors transaction, lecture de user_version,
   puis le schéma dans une transaction immédiate qui relit user_version (une autre connexion a pu le créer pendant l'attente). */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export const VERSION_SCHEMA = 2;
export const ATTENTE_MS = 5000;

export const SCHEMA = `
CREATE TABLE equipe (
  email     TEXT PRIMARY KEY CHECK (email = lower(email) AND email LIKE '%@yeita.fr'),
  prenom    TEXT NOT NULL CHECK (length(trim(prenom)) > 0),
  role      TEXT NOT NULL CHECK (role IN ('recruteur','admin','lecture')),
  actif     INTEGER NOT NULL DEFAULT 1 CHECK (actif IN (0,1)),
  ajoute_le TEXT NOT NULL
);
CREATE TABLE candidats (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  version     INTEGER NOT NULL CHECK (version >= 1),
  modifie_le  TEXT NOT NULL,
  modifie_par TEXT NOT NULL
);
CREATE TABLE journal (
  id          INTEGER PRIMARY KEY,
  candidat_id TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('creation','modification','suppression')),
  etape       TEXT,
  par         TEXT NOT NULL,
  le          TEXT NOT NULL
);
CREATE TABLE options_disponibilite (
  libelle   TEXT PRIMARY KEY,
  ajoute_le TEXT NOT NULL
);`;

/* Les évolutions du schéma, appliquées dans l'ordre à partir de la version de la base (1.10 : fichiers des candidats).
   Les fichiers (CV, portfolio) sont dans la base, avec le dossier : même accès réservé à l'équipe, même effacement réel. */
export const MIGRATIONS = {
  2: `
CREATE TABLE fichiers (
  id          TEXT PRIMARY KEY,
  candidat_id TEXT NOT NULL REFERENCES candidats (id) ON DELETE CASCADE,
  champ       TEXT NOT NULL CHECK (champ IN ('cv','portfolio')),
  nom         TEXT NOT NULL CHECK (length(nom) BETWEEN 1 AND 120),
  type        TEXT NOT NULL CHECK (type IN ('application/pdf','image/png','image/jpeg')),
  taille      INTEGER NOT NULL CHECK (taille > 0),
  contenu     BLOB NOT NULL,
  depose_le   TEXT NOT NULL,
  depose_par  TEXT NOT NULL
);
CREATE INDEX fichiers_candidat ON fichiers (candidat_id);`
};

export class ErreurBase extends Error {}

/* Vrai pour SQLITE_BUSY et ses variantes : la base est tenue par une autre écriture. */
export function estOccupee(e) {
  return typeof e?.code === "string" && e.code.startsWith("SQLITE_BUSY");
}

/* Ouvre la base et applique le schéma. Rend {db, creee, userVersion} ; lance ErreurBase avec un message en français. */
export function ouvrirBase(chemin) {
  /* Base, -wal, -shm et dossier créés lisibles par leur seul propriétaire. */
  process.umask(0o077);
  const creee = !fs.existsSync(chemin);
  let db;
  try {
    fs.mkdirSync(path.dirname(chemin), { recursive: true, mode: 0o700 });
    db = new Database(chemin, { timeout: ATTENTE_MS });
    db.pragma("journal_mode = WAL");
    db.pragma(`busy_timeout = ${ATTENTE_MS}`);
    db.pragma("secure_delete = ON");
  } catch (e) {
    db?.close();
    throw new ErreurBase(`Base impossible à ouvrir (${chemin}) : ${e.message}`);
  }
  try {
    appliquerSchema(db);
  } catch (e) {
    db.close();
    if (e instanceof ErreurBase) throw new ErreurBase(`${e.message.replace(/\.$/, "")} : ${chemin}.`);
    if (estOccupee(e)) throw new ErreurBase(`Base occupée (${chemin}) : réessaie dans un instant.`);
    throw new ErreurBase(`Schéma impossible à appliquer (${chemin}) : ${e.message}`);
  }
  return { db, creee, userVersion: db.pragma("user_version", { simple: true }) };
}

function appliquerSchema(db) {
  const lue = () => db.pragma("user_version", { simple: true });
  const v = lue();
  if (v > VERSION_SCHEMA) throw new ErreurBase(`Base d'une version plus récente (user_version ${v}).`);
  if (v === VERSION_SCHEMA) return;
  db.transaction(() => {
    let w = lue();
    if (w === VERSION_SCHEMA) return;
    if (w === 0) { db.exec(SCHEMA); w = 1; }
    for (let n = w + 1; n <= VERSION_SCHEMA; n++) db.exec(MIGRATIONS[n]);
    db.pragma(`user_version = ${VERSION_SCHEMA}`);
  }).immediate();
}
