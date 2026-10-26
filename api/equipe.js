/* Gestion de l'équipe en ligne de commande, sur le serveur : node api/equipe.js add|list|disable|role.
   Même base que l'API (DB_PATH, résolu depuis api/), même masque, même schéma ; à lancer avec le même utilisateur système.
   Code 0 si c'est fait, 1 sinon, avec un message en français. */
import { cheminBase, ErreurConfig } from "./src/config.js";
import { ouvrirBase, ErreurBase, estOccupee } from "./src/base.js";
import { ROLES, emailValide } from "./src/valeurs.js";

const USAGE = `Usage :
  node api/equipe.js add <email> <prénom> [rôle]   ajoute (ou réactive) un membre ; rôle : ${ROLES.join(", ")} (défaut : recruteur)
  node api/equipe.js list                          liste l'équipe, membres désactivés compris
  node api/equipe.js disable <email>               désactive un membre
  node api/equipe.js role <email> <rôle>           change le rôle d'un membre`;

class ErreurCommande extends Error {}

function email(brut) {
  const e = emailValide(brut);
  if (!e) throw new ErreurCommande(`Email invalide : « ${brut ?? ""} » (adresse @yeita.fr attendue).`);
  return e;
}
function role(brut) {
  if (!ROLES.includes(brut)) throw new ErreurCommande(`Rôle inconnu : « ${brut ?? ""} » (${ROLES.join(", ")}).`);
  return brut;
}
function prenom(brut) {
  const p = String(brut ?? "").trim().replace(/\s+/g, " ");
  if (!p) throw new ErreurCommande("Prénom manquant.");
  if (ROLES.includes(p.toLowerCase())) throw new ErreurCommande(`« ${p} » est un rôle, pas un prénom : node api/equipe.js add <email> <prénom> [rôle].`);
  return p;
}

const ligne = m => `${m.email} · ${m.prenom} · ${m.role} · ${m.actif ? "actif" : "désactivé"} · ajouté le ${m.ajoute_le}`;

/* Contrôle des arguments avant d'ouvrir la base : une commande mal tapée ne crée rien. */
function analyser([commande, ...args]) {
  switch (commande) {
    case "add":
      if (args.length < 2 || args.length > 3) throw new ErreurCommande(USAGE);
      return { commande, email: email(args[0]), prenom: prenom(args[1]), role: role(args[2] ?? "recruteur") };
    case "list":
      if (args.length) throw new ErreurCommande(USAGE);
      return { commande };
    case "disable":
      if (args.length !== 1) throw new ErreurCommande(USAGE);
      return { commande, email: email(args[0]) };
    case "role":
      if (args.length !== 2) throw new ErreurCommande(USAGE);
      return { commande, email: email(args[0]), role: role(args[1]) };
    default:
      throw new ErreurCommande(USAGE);
  }
}

function executer(db, c) {
  const un = db.prepare("SELECT * FROM equipe WHERE email = ?");
  const ecrire = f => db.transaction(f).immediate();
  if (c.commande === "list") {
    const tous = db.prepare("SELECT * FROM equipe ORDER BY actif DESC, prenom").all();
    return tous.length ? tous.map(ligne).join("\n") : "Aucun membre.";
  }
  if (c.commande === "add") {
    return ecrire(() => {
      const m = un.get(c.email);
      if (m?.actif) throw new ErreurCommande(`Déjà membre actif : ${ligne(m)}`);
      if (m) {
        db.prepare("UPDATE equipe SET prenom = ?, role = ?, actif = 1 WHERE email = ?").run(c.prenom, c.role, c.email);
        return `Réactivé : ${ligne(un.get(c.email))}`;
      }
      db.prepare("INSERT INTO equipe (email, prenom, role, actif, ajoute_le) VALUES (?, ?, ?, 1, ?)").run(c.email, c.prenom, c.role, new Date().toISOString());
      return `Ajouté : ${ligne(un.get(c.email))}`;
    });
  }
  return ecrire(() => {
    if (!un.get(c.email)) throw new ErreurCommande(`Membre inconnu : ${c.email}.`);
    if (c.commande === "disable") db.prepare("UPDATE equipe SET actif = 0 WHERE email = ?").run(c.email);
    else db.prepare("UPDATE equipe SET role = ? WHERE email = ?").run(c.role, c.email);
    return `${c.commande === "disable" ? "Désactivé" : "Rôle changé"} : ${ligne(un.get(c.email))}`;
  });
}

let db;
try {
  const c = analyser(process.argv.slice(2));
  const chemin = cheminBase(process.env);
  const base = ouvrirBase(chemin);
  db = base.db;
  console.log(`Base : ${chemin}${base.creee ? " (créée)" : ""}`);
  console.log(executer(db, c));
  db.close();
} catch (e) {
  db?.close();
  if (e instanceof ErreurCommande || e instanceof ErreurConfig || e instanceof ErreurBase) console.error(e.message);
  else if (estOccupee(e)) console.error("Base occupée (l'API écrit) : rien n'a été fait, réessaie dans un instant.");
  else throw e;
  process.exit(1);
}
