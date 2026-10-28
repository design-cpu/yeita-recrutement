/* L'état des sauvegardes, pour les admins : lu dans <dossier de la base>/etat/, écrit par deploy/backup.sh et
   deploy/verif-disque.sh (en production : /data/etat). Lecture seule ; aucune donnée de candidat. */
import fs from "node:fs";
import path from "node:path";
import { adminRequis } from "./app.js";

/* Au-delà, l'état est « en retard » : une nuit manquée (24 h + 2 h de marge), deux mesures du disque manquées. */
export const RETARD_SAUVEGARDE_MS = 26 * 3600 * 1000;
export const RETARD_DISQUE_MS = 2 * 3600 * 1000;

/* Contenu d'un fichier d'état : null s'il est absent ; {illisible: true} s'il n'est pas un objet JSON. */
export function lire(fichier) {
  let texte;
  try { texte = fs.readFileSync(fichier, "utf8"); } catch (e) { if (e.code === "ENOENT") return null; return { illisible: true }; }
  try {
    const v = JSON.parse(texte);
    return v && typeof v === "object" && !Array.isArray(v) ? v : { illisible: true };
  } catch { return { illisible: true }; }
}

/* Vrai si la date ISO est absente, invalide ou plus vieille que le délai. */
function enRetard(etat, delai, maintenant) {
  const t = Date.parse(etat?.le ?? "");
  return !(t <= maintenant) || maintenant - t > delai;
}

export function routesSauvegardes(app, db) {
  const dossier = path.join(path.dirname(db.name), "etat");

  app.get("/api/sauvegardes", async req => {
    adminRequis(req);
    const maintenant = Date.now();
    const reussie = lire(path.join(dossier, "sauvegarde-reussie.json"));
    const derniere = lire(path.join(dossier, "sauvegarde-derniere.json"));
    const disque = lire(path.join(dossier, "disque.json"));
    return {
      maintenant: new Date(maintenant).toISOString(),
      sauvegarde: { derniere, reussie, en_retard: enRetard(reussie, RETARD_SAUVEGARDE_MS, maintenant) },
      disque: { mesure: disque, en_retard: enRetard(disque, RETARD_DISQUE_MS, maintenant) }
    };
  });
}
