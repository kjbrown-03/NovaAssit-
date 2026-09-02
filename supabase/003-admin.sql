-- ===========================================================================
-- Nova Assist — migration 003 : rôle administrateur
--
-- À exécuter après `002-heures.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Jusqu'ici tout compte authentifié était un client. Le back-office de
-- modération des témoignages n'était protégé que par une clé passée dans
-- l'URL — ce qui n'est pas une authentification. Cette migration introduit un
-- rôle porté par la base, seul endroit qu'un visiteur ne peut pas forger.
-- ===========================================================================

alter table public.profils
  add column if not exists role text not null default 'client';

-- La contrainte est posée à part : `add column ... check` échouerait à la
-- deuxième exécution, alors que ce bloc est idempotent.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profils_role_valide'
  ) then
    alter table public.profils
      add constraint profils_role_valide check (role in ('client', 'admin'));
  end if;
end $$;

comment on column public.profils.role is
  'client par défaut. admin ouvre le back-office. Modifiable uniquement par service_role.';


-- ---------------------------------------------------------------------------
-- Lecture du rôle sans récursion RLS
--
-- Une politique sur `profils` qui interrogerait `profils` se rappellerait
-- elle-même sans fin. `security definer` contourne RLS le temps de la lecture,
-- et `stable` permet à Postgres de n'évaluer la fonction qu'une fois par
-- requête.
-- ---------------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profils
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to authenticated;


-- ---------------------------------------------------------------------------
-- Promotion du compte d'administration
--
-- Rejoué sans dommage : si le compte n'existe pas encore, la mise à jour ne
-- touche aucune ligne.
-- ---------------------------------------------------------------------------
update public.profils
set role = 'admin'
where id in (
  select id from auth.users where email = 'kaldjobbaptiste03@gmail.com'
);


-- ---------------------------------------------------------------------------
-- Un administrateur voit tous les profils
--
-- Nécessaire au back-office : sans cette politique, la fiche d'un client
-- resterait invisible même pour l'administration, RLS ne laissant passer que
-- la ligne du compte connecté.
-- ---------------------------------------------------------------------------
drop policy if exists "admin lit tous les profils" on public.profils;
create policy "admin lit tous les profils"
  on public.profils
  for select
  to authenticated
  using (public.est_admin());
