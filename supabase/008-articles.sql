-- ===========================================================================
-- Nova Assist — migration 008 : articles du blog
--
-- À exécuter après `007-temoignages.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Jusqu'ici la page `/blog` affichait trois titres écrits en dur dans le code,
-- marqués « à paraître ». Le cahier des charges prévoit « Blog ressources —
-- Articles par secteur cible » ; il fallait donc un endroit où les articles
-- existent vraiment, et un moyen pour Nova Assist de les publier sans passer
-- par un déploiement.
--
-- Le patron est celui des témoignages (migration 007) : le public ne lit que
-- ce qui est publié, l'administration voit et écrit tout. À une différence
-- près — un témoignage est déposé par un client, un article est écrit par
-- l'administration seule.
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'statut_article') then
    -- `archive` plutôt qu'une suppression : un article retiré du site garde
    -- son adresse et son texte, on peut le republier ou le corriger.
    create type statut_article as enum ('brouillon', 'publie', 'archive');
  end if;
end $$;

create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),

  -- Adresse publique de l'article : /blog/<slug>. Unique, car c'est elle qui
  -- l'identifie pour un lecteur et pour un moteur de recherche.
  slug        text not null unique,
  titre       text not null,
  -- Résumé affiché dans la liste et repris en meta description.
  chapo       text not null,
  corps       text not null,

  -- Secteur visé (PME, santé, commerce…). Libre : la liste des secteurs vit
  -- dans `lib/content.ts` et bougera avant que la base ne bouge.
  secteur     text,

  statut      statut_article not null default 'brouillon',
  auteur_id   uuid references public.profils (id) on delete set null,

  cree_le     timestamptz not null default now(),
  modifie_le  timestamptz not null default now(),
  publie_le   timestamptz,

  -- Un article publié porte forcément sa date : c'est elle qui ordonne la
  -- liste et qui s'affiche au lecteur. Sans cette contrainte, un article
  -- publié sans date se retrouverait en fin de liste sans qu'on comprenne.
  constraint article_publie_a_une_date
    check (statut <> 'publie' or publie_le is not null)
);

comment on table public.articles is
  'Articles du blog. Rédigés dans le back-office, visibles du public une fois publiés.';

-- La liste publique interroge toujours « publiés, du plus récent au plus
-- ancien » : l'index suit cet ordre exact.
create index if not exists articles_publication_idx
  on public.articles (statut, publie_le desc);


-- ---------------------------------------------------------------------------
-- `modifie_le` tenu par la base
--
-- Confier cette date au code applicatif, c'est l'oublier un jour dans une
-- requête. Le déclencheur la pose à chaque écriture, quelle qu'en soit
-- l'origine.
-- ---------------------------------------------------------------------------
create or replace function public.marquer_article_modifie()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

drop trigger if exists av_article_modifie on public.articles;
create trigger av_article_modifie
  before update on public.articles
  for each row execute function public.marquer_article_modifie();


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.articles enable row level security;

-- Le blog est public : un visiteur non connecté doit pouvoir lire.
drop policy if exists "articles publies visibles par tous" on public.articles;
create policy "articles publies visibles par tous"
  on public.articles for select
  to anon, authenticated
  using (statut = 'publie');

-- L'administration voit aussi les brouillons et les archives.
drop policy if exists "admin voit tous les articles" on public.articles;
create policy "admin voit tous les articles"
  on public.articles for select
  to authenticated
  using (public.est_admin());

-- Écriture réservée à l'administration. Un client n'écrit pas d'article :
-- contrairement aux témoignages, il n'y a pas de dépôt à modérer.
drop policy if exists "admin redige les articles" on public.articles;
create policy "admin redige les articles"
  on public.articles for insert
  to authenticated
  with check (public.est_admin());

drop policy if exists "admin modifie les articles" on public.articles;
create policy "admin modifie les articles"
  on public.articles for update
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists "admin supprime les articles" on public.articles;
create policy "admin supprime les articles"
  on public.articles for delete
  to authenticated
  using (public.est_admin());


-- ===========================================================================
-- Vérification — à lancer après le script.
-- ===========================================================================
-- select tablename, rowsecurity from pg_tables
--  where schemaname = 'public' and tablename = 'articles';
--
-- select policyname, cmd from pg_policies
--  where schemaname = 'public' and tablename = 'articles'
--  order by policyname;
