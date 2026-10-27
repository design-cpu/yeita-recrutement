/* Les dossiers candidat : le contrat list/get/put/remove de docs/backend/MODELE.md.
   Chaque écriture est une transaction immédiate avec sa ligne de journal, suivie d'un point de contrôle TRUNCATE :
   avec secure_delete, ni un dossier supprimé ni une version remplacée ne restent lisibles dans les fichiers (spec R21). */
import { ErreurHttp } from "./app.js";
import { ATTENTE_MS } from "./base.js";
import { ETAPES, MESSAGE_CONFLIT, MOTIF_ID, SCHEMA_DOSSIER } from "./valeurs.js";
import { routesFichiers } from "./fichiers.js";

const INTROUVABLE = () => new ErreurHttp(404, "Candidature introuvable.", "introuvable");
const CONFLIT = () => new ErreurHttp(409, MESSAGE_CONFLIT, "conflit");

function idValide(id) {
  if (!MOTIF_ID.test(id)) throw new ErreurHttp(400, "Identifiant invalide.");
  return id;
}

/* L'enveloppe rendue au client : la version de la ligne, distincte de data.version (version du schéma du dossier). */
const enveloppe = ligne => ({ id: ligne.id, version: ligne.version, data: JSON.parse(ligne.data) });

/* L'étape gardée au journal, seulement si c'est l'une des 12 étapes du parcours. */
function etapeDe(data) {
  const e = data?.parcours?.etape;
  return ETAPES.includes(e) ? e : null;
}

/* Le corps d'un PUT : {version: null | entier ≥ 1, data: dossier de cet id}. */
function corpsPut(corps, id) {
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) throw new ErreurHttp(400, "Corps attendu : {version, data}.");
  const { version, data } = corps;
  if (version !== null && !(Number.isInteger(version) && version >= 1)) throw new ErreurHttp(400, "Champ version : null ou un entier ≥ 1.");
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ErreurHttp(400, "Champ data : le dossier (objet) est obligatoire.");
  if (data.schema !== SCHEMA_DOSSIER) throw new ErreurHttp(400, `Champ data.schema : « ${SCHEMA_DOSSIER} » attendu.`);
  if (data.id !== id) throw new ErreurHttp(400, "Champ data.id : il doit être égal à l'identifiant de l'adresse.");
  return { version, data };
}

export function routesCandidats(app, db) {
  const q = {
    liste: db.prepare(`SELECT id, version, data FROM candidats
      ORDER BY json_extract(data, '$.meta.modifieLe') DESC, modifie_le DESC`),
    un: db.prepare("SELECT id, version, data FROM candidats WHERE id = ?"),
    creer: db.prepare(`INSERT INTO candidats (id, data, version, modifie_le, modifie_par) VALUES (?, ?, 1, ?, ?)
      ON CONFLICT (id) DO NOTHING`),
    modifier: db.prepare(`UPDATE candidats SET data = ?, version = version + 1, modifie_le = ?, modifie_par = ?
      WHERE id = ? AND version = ?`),
    supprimer: db.prepare("DELETE FROM candidats WHERE id = ?"),
    purger: db.prepare("DELETE FROM journal WHERE candidat_id = ?"),
    fichiers: db.prepare("DELETE FROM fichiers WHERE candidat_id = ?"),
    journal: db.prepare("INSERT INTO journal (candidat_id, action, etape, par, le) VALUES (?, ?, ?, ?, ?)")
  };

  /* Après chaque écriture sur candidats : le WAL est vidé et remis à zéro. Le point de contrôle n'attend pas un lecteur
     plus de 100 ms (l'écriture est déjà validée, et l'accès synchrone gèlerait toutes les requêtes) : s'il ne peut aboutir,
     une ancienne version peut rester dans les fichiers jusqu'au point de contrôle suivant. */
  function pointDeControle(log) {
    db.pragma("busy_timeout = 100");
    try {
      const [r] = db.pragma("wal_checkpoint(TRUNCATE)");
      if (r.busy) log.warn("Point de contrôle incomplet : une ancienne version peut rester dans les fichiers jusqu'au suivant.");
    } finally {
      db.pragma(`busy_timeout = ${ATTENTE_MS}`);
    }
  }

  routesFichiers(app, db, pointDeControle);

  app.get("/api/candidats", async () => q.liste.all().map(enveloppe));

  app.get("/api/candidats/:id", async req => {
    const ligne = q.un.get(idValide(req.params.id));
    if (!ligne) throw INTROUVABLE();
    return enveloppe(ligne);
  });

  app.put("/api/candidats/:id", async (req, rep) => {
    const id = idValide(req.params.id);
    const { version, data } = corpsPut(req.body, id);
    const texte = JSON.stringify(data), le = new Date().toISOString(), par = req.membre.email;
    const ecrire = db.transaction(() => {
      if (version === null) {
        if (q.creer.run(id, texte, le, par).changes === 0) throw CONFLIT();
        q.journal.run(id, "creation", etapeDe(data), par, le);
        return 1;
      }
      /* Version périmée ou dossier supprimé entre-temps : même conflit (pitch : « sinon 409 »). */
      if (q.modifier.run(texte, le, par, id, version).changes === 0) throw CONFLIT();
      q.journal.run(id, "modification", etapeDe(data), par, le);
      return version + 1;
    });
    const nouvelle = ecrire.immediate();
    pointDeControle(req.log);
    return rep.code(version === null ? 201 : 200).send({ id, version: nouvelle, data });
  });

  app.delete("/api/candidats/:id", async (req, rep) => {
    const id = idValide(req.params.id);
    const effacer = db.transaction(() => {
      if (q.supprimer.run(id).changes === 0) throw INTROUVABLE();
      /* Demande d'effacement : le parcours ne reste pas au journal, seule la suppression y est notée (arbitrage de l'utilisateur). */
      q.purger.run(id);
      /* Ses fichiers (CV, portfolio) partent avec lui, dans la même transaction (1.7). */
      q.fichiers.run(id);
      q.journal.run(id, "suppression", null, req.membre.email, new Date().toISOString());
    });
    effacer.immediate();
    pointDeControle(req.log);
    return rep.code(204).send();
  });
}
