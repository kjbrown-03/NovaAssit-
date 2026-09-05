-- ===========================================================================
-- Nova Assist — migration 009 : relier une demande de devis à son suivi client
--
-- À exécuter après `008-articles.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Deux tables décrivent la même demande vue de deux côtés :
--
--   `demandes_devis`  la file de l'administration, avec ses statuts métier
--                     (nouveau, en cours, traitée, sans suite).
--   `demandes`        ce que le client suit dans son espace, avec ses propres
--                     statuts (en cours, attente retour, terminée).
--
-- Rien ne les reliait. Conséquence : faire avancer une demande dans le
-- back-office ne changeait rien chez le client, qui voyait sa demande figée
-- « en cours » indéfiniment.
--
-- Cette colonne établit le lien. Elle est nullable : les demandes déposées par
-- un visiteur non connecté n'ont pas de suivi client, et celles créées avant
-- cette migration n'en auront jamais.
-- ===========================================================================

alter table public.demandes
  add column if not exists devis_id bigint
    references public.demandes_devis (id) on delete set null;

comment on column public.demandes.devis_id is
  'Demande de devis à l''origine de ce suivi. Null si déposée hors compte.';

-- La propagation cherche « le suivi de CE devis » : l'index suit cet accès.
create index if not exists demandes_devis_id_idx
  on public.demandes (devis_id);


-- ===========================================================================
-- Vérification — à lancer après le script.
-- ===========================================================================
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'demandes'
--  order by ordinal_position;
