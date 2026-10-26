/* Les options de disponibilité ajoutées par l'équipe. Les options de base (DISPOS) restent dans le code des pages :
   elles ne sont jamais stockées. GET et POST rendent la même liste, dans l'ordre d'ajout. */
import { ErreurHttp } from "./app.js";
import { DISPOS } from "./valeurs.js";

export function routesOptions(app, db) {
  const liste = db.prepare("SELECT libelle FROM options_disponibilite ORDER BY rowid");
  const ajouter = db.prepare("INSERT INTO options_disponibilite (libelle, ajoute_le) VALUES (?, ?) ON CONFLICT (libelle) DO NOTHING");
  const libelles = () => liste.all().map(r => r.libelle);

  app.get("/api/options-disponibilite", async () => libelles());

  app.post("/api/options-disponibilite", async (req, rep) => {
    const brut = req.body?.libelle;
    const libelle = typeof brut === "string" ? brut.trim().replace(/\s+/g, " ") : "";
    const longueur = [...libelle].length;
    if (longueur < 1 || longueur > 60) throw new ErreurHttp(400, "Champ libelle : de 1 à 60 caractères.");
    if (DISPOS.includes(libelle)) return rep.code(200).send(libelles());
    const ajoute = db.transaction(() => ajouter.run(libelle, new Date().toISOString()).changes).immediate();
    return rep.code(ajoute ? 201 : 200).send(libelles());
  });
}
