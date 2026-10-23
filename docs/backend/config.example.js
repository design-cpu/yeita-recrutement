/* OBSOLÈTE (23 octobre 2026) : piste Supabase abandonnée. Authentification (oauth2-proxy, SSO Google @yeita.fr) et stockage (SQLite, serveur OVH)
   sont pris en charge par Sacha. Fichier gardé pour mémoire, à ne pas brancher. Modèle qui fait foi : docs/backend/MODELE.md. */
/* Configuration de la base partagée. À copier en assets/backend-config.js le jour du GO, et à remplir.
   L'adresse et la clé « anon » sont publiques par nature : la sécurité vient des règles RLS de schema.sql,
   jamais de cette clé. Ne mets ici AUCUNE clé « service_role ». */
window.YEITA_BACKEND_CONFIG = {
  url: "",        /* Supabase → Project Settings → API → Project URL, par exemple https://xxxx.supabase.co */
  anonKey: "",    /* Supabase → Project Settings → API → anon public */
  domaine: "yeita.fr"
};
