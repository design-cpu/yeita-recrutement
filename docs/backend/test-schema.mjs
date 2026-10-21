// Vérifie docs/backend/schema.sql sur un Postgres embarqué, sans compte Supabase.
// Lancer : npm i @electric-sql/pglite@0.2.17 (dans un dossier de travail), puis node docs/backend/test-schema.mjs docs/backend/schema.sql
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
const ok = (c, l) => { console.log((c ? "OK  " : "FAIL"), l); if(!c) process.exitCode = 1; };
// Ce que Supabase fournit : rôles, schéma auth, auth.jwt()
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.jwt() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`);
await db.exec(fs.readFileSync(process.argv[2], "utf8"));
await db.exec(`grant select, insert, update, delete on public.candidats, public.equipe, public.journal to authenticated;
  insert into public.equipe (email, prenom, role) values ('thelo@yeita.fr','Thélo','recruteur'), ('lea@yeita.fr','Léa','lecture'), ('parti@yeita.fr','Parti','recruteur');
  update public.equipe set actif = false where email = 'parti@yeita.fr';`);
const as = async (role, email, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.claims', '${email ? JSON.stringify({email}) : ""}', false); set role ${role};`);
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
};
const dossier = (id, nom, etape) => JSON.stringify({schema:"yeita-dossier-candidat", version:2, id, candidat:{nom}, identite:{provenance:"wttj"}, parcours:{etape}, meta:{demo:false}});
let r = await as("authenticated", "thelo@yeita.fr", "select * from public.enregistrer_candidat($1, $2::jsonb, null)", ["c1", dossier("c1","Léna Garnier","appel")]);
ok(r.rows[0].nouvelle_version === 1, "recruteur : création");
r = await as("authenticated", "thelo@yeita.fr", "select * from public.enregistrer_candidat($1, $2::jsonb, 1)", ["c1", dossier("c1","Léna Garnier","ec1")]);
ok(r.rows[0].nouvelle_version === 2, "recruteur : mise à jour avec la bonne version");
let err = null; try { await as("authenticated", "thelo@yeita.fr", "select * from public.enregistrer_candidat($1, $2::jsonb, 1)", ["c1", dossier("c1","Léna Garnier","ec2")]); } catch(e){ err = e.message; }
ok(err && /conflit/.test(err), "version périmée : conflit");
r = await as("authenticated", "thelo@yeita.fr", "select nom, etape, provenance, modifie_par from public.candidats");
ok(r.rows.length === 1 && r.rows[0].etape === "ec1" && r.rows[0].nom === "Léna Garnier" && r.rows[0].modifie_par === "thelo@yeita.fr", "colonnes tirées du dossier, auteur");
r = await as("authenticated", "lea@yeita.fr", "select count(*)::int n from public.candidats");
ok(r.rows[0].n === 1, "lecture seule : voit");
err = null; try { await as("authenticated", "lea@yeita.fr", "select * from public.enregistrer_candidat($1, $2::jsonb, null)", ["c2", dossier("c2","X","appel")]); } catch(e){ err = e.message; }
ok(err, "lecture seule : n'écrit pas");
r = await as("authenticated", "parti@yeita.fr", "select count(*)::int n from public.candidats");
ok(r.rows[0].n === 0, "personne retirée : ne voit plus rien");
r = await as("authenticated", "intrus@gmail.com", "select count(*)::int n from public.candidats");
ok(r.rows[0].n === 0, "hors Yeita : ne voit rien");
err = null; try { await as("anon", "", "select count(*) from public.candidats"); } catch(e){ err = e.message; }
ok(err, "sans connexion : refusé");
err = null; try { await as("anon", "", "select * from public.enregistrer_candidat('c3', '{}'::jsonb, null)"); } catch(e){ err = e.message; }
ok(err, "sans connexion : pas d'enregistrement");
r = await as("authenticated", "thelo@yeita.fr", "select * from public.moi()");
ok(r.rows[0] && r.rows[0].prenom === "Thélo", "moi() : le prénom remplace « Tu es »");
await as("authenticated", "thelo@yeita.fr", "delete from public.candidats where id = 'c1'");
r = await as("authenticated", "thelo@yeita.fr", "select action, par from public.journal order by id");
ok(r.rows.map(x => x.action).join(",") === "creation,modification,suppression" && r.rows.every(x => x.par === "thelo@yeita.fr"), "journal : création, modification, suppression, avec l'auteur");
err = null; try { await as("authenticated", "thelo@yeita.fr", "insert into public.journal (candidat_id, action, par) values ('x','creation','moi')"); } catch(e){ err = e.message; }
ok(err, "journal : personne n'y écrit à la main");
// purge
await db.exec(`insert into public.candidats (id, data, modifie_le) values ('old', '${dossier("old","Ancien","clos")}'::jsonb, now()), ('new', '${dossier("new","Récent","clos")}'::jsonb, now());
  alter table public.candidats disable trigger candidats_touche; update public.candidats set modifie_le = now() - interval '25 months' where id = 'old'; alter table public.candidats enable trigger candidats_touche;`);
r = await db.query("select public.purger_candidatures(24) n");
ok(r.rows[0].n === 1, "purge : seules les candidatures closes trop anciennes partent");
err = null; try { await as("authenticated", "thelo@yeita.fr", "select public.purger_candidatures(0)"); } catch(e){ err = e.message; }
ok(err, "purge : réservée à l'administration");
console.log(process.exitCode ? "ÉCHEC" : "TOUT OK");
