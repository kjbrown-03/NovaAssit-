-- ===========================================================================
-- Nova Assist — migration 010 : fonction et ville sur la fiche client
--
-- À exécuter après `009-lien-demandes.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Le formulaire de témoignage demande quatre informations d'identité : nom,
-- fonction, entreprise, ville. Deux seulement existaient sur la fiche client,
-- si bien qu'un client qui témoigne une seconde fois ressaisissait sa fonction
-- et sa ville — des données qui ne changent jamais.
--
-- Ces colonnes sont renseignées au premier témoignage, puis reproposées.
-- Nullable : rien n'oblige à les connaître, et l'inscription ne les demande pas.
-- ===========================================================================

alter table public.profils
  add column if not exists fonction text,
  add column if not exists ville    text;

comment on column public.profils.fonction is
  'Fonction du contact. Renseignée au premier témoignage, reproposée ensuite.';
comment on column public.profils.ville is
  'Ville du client. Même usage que fonction.';


-- ===========================================================================
-- Vérification — à lancer après le script.
-- ===========================================================================
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'profils'
--    and column_name in ('fonction', 'ville');
