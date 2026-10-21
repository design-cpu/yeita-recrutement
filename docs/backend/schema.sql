-- Module Candidatures Yeita · schéma Supabase (Postgres)
-- PRÉPARÉ, NON DÉPLOYÉ. À exécuter une fois, dans l'éditeur SQL du projet, le jour du GO.
-- Voir docs/backend/README.md et STORAGE.md.
--
-- Principe : une ligne par candidature. Le dossier candidat v2 (assets/dossier.js) est rangé tel quel
-- en JSONB : les pages n'ont rien à changer. Quelques colonnes sont tirées du JSON pour trier et pour
-- les bilans. Le site est public (GitHub Pages) : toute la sécurité est ici, dans les règles RLS.

-- ---------------------------------------------------------------------------
-- 1. L'équipe : les personnes Yeita autorisées, par adresse e-mail
-- ---------------------------------------------------------------------------
create table if not exists public.equipe (
  email     text primary key check (email ~* '^[^@\s]+@yeita\.fr$'),
  prenom    text not null,
  role      text not null default 'recruteur' check (role in ('recruteur', 'fondateur', 'lecture')),
  actif     boolean not null default true,
  ajoute_le timestamptz not null default now()
);
comment on table public.equipe is 'Qui accède au module Candidatures. Retirer une personne : actif = false.';

-- Exemples, à remplacer par la vraie liste décidée avec Mattéo :
-- insert into public.equipe (email, prenom, role) values
--   ('peter@yeita.fr',  'Peter',  'recruteur'),
--   ('thelo@yeita.fr',  'Thélo',  'recruteur'),
--   ('andrea@yeita.fr', 'Andrea', 'recruteur');

-- La personne connectée fait-elle partie de l'équipe ? ecrire = true exige un rôle qui écrit.
create or replace function public.est_equipe(ecrire boolean default false)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.equipe e
    where lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (auth.jwt() ->> 'email') ~* '@yeita\.fr$'
      and e.actif
      and (not ecrire or e.role in ('recruteur', 'fondateur'))
  );
$$;

-- Le prénom de la personne connectée : remplace le choix « Tu es » du module.
create or replace function public.moi()
returns table (email text, prenom text, role text)
language sql stable security definer
set search_path = public
as $$
  select e.email, e.prenom, e.role from public.equipe e
  where lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', '')) and e.actif;
$$;

-- ---------------------------------------------------------------------------
-- 2. Les candidatures
-- ---------------------------------------------------------------------------
create table if not exists public.candidats (
  id          text primary key,
  data        jsonb not null check (data ->> 'schema' = 'yeita-dossier-candidat'),
  nom         text generated always as (data -> 'candidat' ->> 'nom') stored,
  etape       text generated always as (data -> 'parcours' ->> 'etape') stored,
  provenance  text generated always as (data -> 'identite' ->> 'provenance') stored,
  demo        boolean generated always as (coalesce((data -> 'meta' ->> 'demo')::boolean, false)) stored,
  version     integer not null default 1,
  cree_le     timestamptz not null default now(),
  modifie_le  timestamptz not null default now(),
  modifie_par text not null default coalesce(auth.jwt() ->> 'email', '')
);
create index if not exists candidats_modifie_le on public.candidats (modifie_le desc);
create index if not exists candidats_etape on public.candidats (etape);
comment on table public.candidats is 'Une ligne par candidature. data = dossier candidat v2 (assets/dossier.js).';

-- Toute modification directe met à jour la date et l'auteur.
create or replace function public.candidats_touche()
returns trigger language plpgsql as $$
begin
  new.modifie_le := now();
  new.modifie_par := coalesce(auth.jwt() ->> 'email', new.modifie_par);
  return new;
end $$;
drop trigger if exists candidats_touche on public.candidats;
create trigger candidats_touche before update on public.candidats
  for each row execute function public.candidats_touche();

-- Enregistrer avec détection de conflit : p_version est la version lue par la page.
-- null = nouvelle candidature. Si quelqu'un a enregistré entre-temps, l'enregistrement est refusé.
create or replace function public.enregistrer_candidat(p_id text, p_data jsonb, p_version integer)
returns table (nouvelle_version integer, enregistre_le timestamptz)
language plpgsql security invoker
set search_path = public
as $$
declare v integer;
begin
  if p_version is null then
    insert into public.candidats (id, data) values (p_id, p_data)
      returning public.candidats.version into v;
  else
    update public.candidats c set data = p_data, version = c.version + 1
      where c.id = p_id and c.version = p_version
      returning c.version into v;
    if v is null then
      raise exception 'conflit' using hint = 'La candidature a été modifiée par quelqu''un d''autre. Recharge la page.';
    end if;
  end if;
  return query select c.version, c.modifie_le from public.candidats c where c.id = p_id;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Le journal : qui a fait quoi, et quand (sans le contenu)
-- ---------------------------------------------------------------------------
create table if not exists public.journal (
  id          bigint generated always as identity primary key,
  candidat_id text not null,
  action      text not null check (action in ('creation', 'modification', 'suppression')),
  etape       text,
  par         text not null,
  le          timestamptz not null default now()
);
create index if not exists journal_candidat on public.journal (candidat_id, le desc);

create or replace function public.journaliser()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare par text := coalesce(auth.jwt() ->> 'email', 'système');
begin
  if tg_op = 'DELETE' then
    insert into public.journal (candidat_id, action, etape, par) values (old.id, 'suppression', old.etape, par);
    return old;
  end if;
  insert into public.journal (candidat_id, action, etape, par)
  values (new.id, case tg_op when 'INSERT' then 'creation' else 'modification' end, new.etape, par);
  return new;
end $$;
drop trigger if exists candidats_journal on public.candidats;
create trigger candidats_journal after insert or update or delete on public.candidats
  for each row execute function public.journaliser();

-- ---------------------------------------------------------------------------
-- 4. Règles d'accès (RLS) : rien sans connexion, rien hors de l'équipe
-- ---------------------------------------------------------------------------
alter table public.equipe    enable row level security;
alter table public.candidats enable row level security;
alter table public.journal   enable row level security;

revoke all on public.equipe, public.candidats, public.journal from anon;
revoke execute on function public.enregistrer_candidat(text, jsonb, integer) from anon, public;
grant execute on function public.enregistrer_candidat(text, jsonb, integer) to authenticated;
grant execute on function public.moi() to authenticated;

drop policy if exists equipe_lire on public.equipe;
create policy equipe_lire on public.equipe for select to authenticated using (public.est_equipe());

drop policy if exists candidats_lire on public.candidats;
create policy candidats_lire on public.candidats for select to authenticated using (public.est_equipe());
drop policy if exists candidats_ajouter on public.candidats;
create policy candidats_ajouter on public.candidats for insert to authenticated with check (public.est_equipe(true));
drop policy if exists candidats_modifier on public.candidats;
create policy candidats_modifier on public.candidats for update to authenticated
  using (public.est_equipe(true)) with check (public.est_equipe(true));
drop policy if exists candidats_supprimer on public.candidats;
create policy candidats_supprimer on public.candidats for delete to authenticated using (public.est_equipe(true));

drop policy if exists journal_lire on public.journal;
create policy journal_lire on public.journal for select to authenticated using (public.est_equipe());
-- Pas de règle d'écriture sur le journal : seul le déclencheur y écrit.

-- ---------------------------------------------------------------------------
-- 5. Durée de conservation (à fixer avec Mattéo, voir STORAGE.md)
-- ---------------------------------------------------------------------------
-- Supprime les candidatures closes (« Pas aujourd'hui ») sans modification depuis p_mois mois,
-- et les exemples fictifs de plus de 7 jours. Rend le nombre de lignes supprimées.
create or replace function public.purger_candidatures(p_mois integer default 24)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.candidats
  where (etape = 'clos' and modifie_le < now() - make_interval(months => p_mois))
     or (demo and modifie_le < now() - interval '7 days');
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.purger_candidatures(integer) from anon, authenticated, public;

-- Une fois la durée décidée, planifier la purge chaque nuit (extension pg_cron à activer dans Supabase) :
-- select cron.schedule('purge-candidatures', '0 3 * * *', $$select public.purger_candidatures(24)$$);

-- ---------------------------------------------------------------------------
-- 6. Mises à jour en direct (facultatif) : un recruteur voit les passages d'un autre sans recharger
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.candidats;
