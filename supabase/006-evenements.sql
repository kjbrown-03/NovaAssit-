-- ===========================================================================
-- Nova Assist — migration 006 : conversions mesurées
--
-- À exécuter après `005-admin-lecture.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Le cahier des charges demande, au back office : « Statistiques fréquentation
-- — Suivi des conversions (devis, inscriptions, WhatsApp, appels) ».
--
-- Les devis et les inscriptions se comptent déjà dans leurs tables. Les clics
-- WhatsApp et les appels, eux, quittent le site sans laisser de trace : sans
-- cette table, ces deux conversions-là sont invisibles.
--
-- Rien de personnel n'est stocké : ni adresse IP, ni identifiant de visiteur,
-- ni empreinte de navigateur. Un type, une page, une heure. On compte des
-- gestes, on ne suit personne — ce qui évite aussi d'avoir à demander un
-- consentement pour du traçage.
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'type_evenement') then
    create type type_evenement as enum ('whatsapp', 'appel', 'brochure', 'devis_ouvert');
  end if;
end $$;

create table if not exists public.evenements (
  id       bigint generated always as identity primary key,
  type     type_evenement not null,
  -- Page d'où part le geste, pour savoir ce qui convertit.
  chemin   text,
  cree_le  timestamptz not null default now()
);

comment on table public.evenements is
  'Conversions sortantes (WhatsApp, appel, brochure). Aucune donnée personnelle.';

create index if not exists evenements_type_date_idx
  on public.evenements (type, cree_le desc);


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Pas de politique d'insertion : l'écriture passe par la route serveur
-- `/api/evenement` avec la clé service_role. Ouvrir l'insertion à `anon`
-- laisserait n'importe qui gonfler les compteurs depuis sa console.
-- ---------------------------------------------------------------------------
alter table public.evenements enable row level security;

drop policy if exists "admin lit les evenements" on public.evenements;
create policy "admin lit les evenements"
  on public.evenements
  for select
  to authenticated
  using (public.est_admin());
