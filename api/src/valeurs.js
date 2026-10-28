/* Valeurs reprises des pages et du modèle, recopiées ici : l'API n'importe rien de assets/.
   Sources : assets/dossier.js (SCHEMA, uid(), DISPOS) et docs/backend/MODELE.md (étapes du parcours). */

export const SCHEMA_DOSSIER = "yeita-dossier-candidat";

/* uid() de assets/dossier.js : "cand-" + horodatage en base 36 + "-" + 5 caractères en base 36. */
export const MOTIF_ID = /^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$/;

/* Les 12 étapes de parcours.etape (MODELE.md, « Le parcours »). */
export const ETAPES = ["appel", "ec1", "bilan-ec1", "ec2", "bilan-ec2", "ec3", "decision",
  "proposition", "go-mission", "onboarding", "vivier", "non-retenu"];

/* Options de disponibilité de base (DISPOS de assets/dossier.js) : jamais stockées, seuls les ajouts le sont. */
export const DISPOS = ["Intercontrat", "Immédiatement", "1 mois", "2 mois", "3 mois", "Septembre"];

export const MOTIF_EMAIL = /^[a-z0-9._%+-]+@yeita\.fr$/;
export const ROLES = ["recruteur", "admin", "lecture"];
export const HOTES_LOCAUX = ["127.0.0.1", "::1", "localhost"];

export const LIMITE_CORPS = 1048576;

/* Fichiers des candidats (1.10) : 10 Mo au plus (un portfolio PDF exporté de Figma pèse souvent 3 à 8 Mo). */
export const LIMITE_FICHIER = 10 * 1048576;
export const TYPES_FICHIER = ["application/pdf", "image/png", "image/jpeg"];
export const CHAMPS_FICHIER = ["cv", "portfolio"];
export const MOTIF_FICHIER = /^fic-[a-f0-9]{18}$/;
export const MESSAGE_CONFLIT = "La candidature a été modifiée par quelqu'un d'autre. Recharge la page.";

/* Email mis en forme (espaces retirés, minuscules) s'il est valide, sinon null. */
export function emailValide(brut) {
  if (typeof brut !== "string") return null;
  const e = brut.trim().toLowerCase();
  return MOTIF_EMAIL.test(e) ? e : null;
}
