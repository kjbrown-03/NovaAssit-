-- ===========================================================================
-- Nova Assist — migration 004 : demandes de devis
--
-- À exécuter après `003-admin.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Le cahier des charges demande, au back office : « Gestion des demandes devis
-- reçues — Notification email + tableau suivi ». L'email existait déjà ; le
-- tableau de suivi n'avait aucun support, faute de persistance. Une demande
-- dont l'email se perdait était une demande perdue.
-- ===========================================================================

-- `create type` n'accepte pas `if not exists` : sans ce garde, une seconde
-- exécution échouerait, contrairement à ce qu'annonce l'en-tête.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'statut_devis') then
    create type statut_devis as enum ('nouveau', 'en_cours', 'traitee', 'perdue');
  end if;
end $$;

create table if not exists public.demandes_devis (
  id                bigint generated always as identity primary key,

  -- Identité du demandeur, telle que saisie dans le formulaire public.
  entreprise        text not null,
  contact_nom       text not null,
  email             text not null,
  secteur           text,
  effectif          text,

  -- Besoin exprimé. `domaines` est obligatoire côté formulaire.
  domaines          text[] not null default '{}',
  canaux            text[] not null default '{}',
  messages_par_jour text,
  plage             text,
  precision_libre   text,
  formule_suggeree  text,

  -- Suivi interne.
  statut            statut_devis not null default 'nouveau',
  note_interne      text,
  recue_le          timestamptz not null default now(),
  traitee_le        timestamptz
);

comment on table public.demandes_devis is
  'Demandes de devis reçues par le formulaire public. Alimente le tableau de suivi du back-office.';
comment on column public.demandes_devis.precision_libre is
  'Champ libre du formulaire. Nommé ainsi car « precision » est un mot réservé en SQL.';

create index if not exists demandes_devis_statut_idx
  on public.demandes_devis (statut, recue_le desc);


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Aucune politique d'insertion : le formulaire public n'écrit pas directement.
-- C'est la route serveur `/api/devis` qui insère avec la clé service_role,
-- après validation. Ouvrir l'insertion à `anon` ferait de cette table une
-- boîte à spam accessible depuis n'importe quel navigateur.
-- ---------------------------------------------------------------------------
alter table public.demandes_devis enable row level security;

drop policy if exists "admin lit les demandes de devis" on public.demandes_devis;
create policy "admin lit les demandes de devis"
  on public.demandes_devis
  for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin suit les demandes de devis" on public.demandes_devis;
create policy "admin suit les demandes de devis"
  on public.demandes_devis
  for update
  to authenticated
  using (public.est_admin())
  with check (public.est_admin());
