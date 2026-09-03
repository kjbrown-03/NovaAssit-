-- ===========================================================================
-- Nova Assist — migration 007 : témoignages clients
--
-- À exécuter après `006-evenements.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Les témoignages vivaient jusqu'ici dans des fichiers JSON sous `.data/`,
-- écrits avant que le projet ait une base. Ça ne survit pas à un déploiement
-- sur un hébergement sans disque durable — Vercel, Netlify — où chaque mise en
-- ligne repartirait de zéro et où deux instances ne verraient pas les mêmes
-- données.
--
-- Au passage, un témoignage est désormais rattaché au compte qui l'a déposé
-- (`profil_id`) plutôt qu'à une adresse email saisie au clavier : on sait qui a
-- écrit quoi, et un client ne peut pas déposer au nom d'un autre.
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'format_temoignage') then
    create type format_temoignage as enum ('texte', 'video');
  end if;
  if not exists (select 1 from pg_type where typname = 'statut_temoignage') then
    create type statut_temoignage as enum ('attente', 'valide', 'refuse');
  end if;
end $$;

create table if not exists public.temoignages (
  id           uuid primary key default gen_random_uuid(),
  profil_id    uuid not null references public.profils (id) on delete cascade,

  format       format_temoignage not null default 'texte',
  citation     text not null,
  -- Lien YouTube ou Vimeo non répertorié. Les vidéos ne sont pas hébergées
  -- ici : le stockage de fichiers lourds n'est pas au périmètre.
  video_url    text,

  auteur       text not null,
  fonction     text not null,
  entreprise   text not null,
  ville        text not null,

  statut       statut_temoignage not null default 'attente',
  motif_refus  text,
  soumis_le    timestamptz not null default now(),
  traite_le    timestamptz,

  constraint temoignage_video_a_un_lien
    check (format <> 'video' or video_url is not null)
);

comment on table public.temoignages is
  'Témoignages déposés par les clients. Publiés à l''accueil après validation.';

create index if not exists temoignages_statut_idx
  on public.temoignages (statut, traite_le, soumis_le);


-- ---------------------------------------------------------------------------
-- Notifications de l'administration
-- ---------------------------------------------------------------------------
create table if not exists public.notifications_admin (
  id            uuid primary key default gen_random_uuid(),
  temoignage_id uuid references public.temoignages (id) on delete cascade,
  message       text not null,
  cree_le       timestamptz not null default now(),
  lue_le        timestamptz
);


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.temoignages        enable row level security;
alter table public.notifications_admin enable row level security;

-- Tout le monde lit les témoignages publiés : c'est ce qui alimente la page
-- d'accueil, y compris pour un visiteur non connecté.
drop policy if exists "temoignages publies visibles par tous" on public.temoignages;
create policy "temoignages publies visibles par tous"
  on public.temoignages for select
  to anon, authenticated
  using (statut = 'valide');

-- Un client suit ses propres dépôts, quel qu'en soit le statut.
drop policy if exists "client voit ses temoignages" on public.temoignages;
create policy "client voit ses temoignages"
  on public.temoignages for select
  to authenticated
  using ((select auth.uid()) = profil_id);

-- Un client dépose pour lui-même, et toujours en attente : `with check`
-- empêche de s'auto-publier en forçant `statut` à la création.
drop policy if exists "client depose son temoignage" on public.temoignages;
create policy "client depose son temoignage"
  on public.temoignages for insert
  to authenticated
  with check ((select auth.uid()) = profil_id and statut = 'attente');

-- L'administration voit tout et fait avancer les statuts.
drop policy if exists "admin voit tous les temoignages" on public.temoignages;
create policy "admin voit tous les temoignages"
  on public.temoignages for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin modere les temoignages" on public.temoignages;
create policy "admin modere les temoignages"
  on public.temoignages for update
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- Les notifications ne regardent que l'administration.
drop policy if exists "admin lit ses notifications" on public.notifications_admin;
create policy "admin lit ses notifications"
  on public.notifications_admin for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin marque ses notifications" on public.notifications_admin;
create policy "admin marque ses notifications"
  on public.notifications_admin for update
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());
