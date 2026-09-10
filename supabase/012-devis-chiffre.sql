-- ===========================================================================
-- Nova Assist — migration 012 : chiffrer une demande et l'envoyer en devis
--
-- À exécuter après `011-tarifs-equipe.sql`, dans Supabase → SQL Editor.
-- Réexécutable sans effet de bord.
--
-- Une demande de devis arrive quand les formules toutes faites ne conviennent
-- pas au prospect. L'administration doit donc pouvoir y poser un prix, puis
-- renvoyer une proposition au demandeur.
--
-- Tout tient dans `demandes_devis` plutôt que dans une table « devis »
-- séparée : il y a exactement une proposition par demande, et une table de
-- plus n'aurait apporté qu'une jointure.
-- ===========================================================================

alter table public.demandes_devis
  -- Le formulaire public collectait déjà le téléphone sans jamais l'écrire :
  -- c'est pourtant le seul moyen d'envoyer la proposition sur WhatsApp.
  add column if not exists telephone text,

  -- Le prix, et ce qu'il couvre. Nuls tant que la demande n'est pas chiffrée.
  add column if not exists montant_fcfa integer check (montant_fcfa > 0),
  add column if not exists prestation text,
  add column if not exists devis_etabli_le timestamptz,

  -- Durée de validité, en jours. Modifiable au cas par cas.
  add column if not exists validite_jours integer not null default 30
    check (validite_jours between 1 and 365),

  -- Jeton du lien public. Le prospect ouvre sa proposition depuis WhatsApp,
  -- souvent sans être connecté : le lien doit donc porter son propre secret.
  -- `gen_random_uuid` est imprévisible, contrairement à l'identifiant en
  -- clair qui aurait laissé lire les devis des autres en incrémentant.
  add column if not exists jeton uuid not null default gen_random_uuid();

comment on column public.demandes_devis.telephone is
  'Téléphone ou WhatsApp du demandeur, tel que saisi dans le formulaire.';
comment on column public.demandes_devis.montant_fcfa is
  'Montant proposé. Null tant que l''administration n''a pas chiffré.';
comment on column public.demandes_devis.jeton is
  'Secret du lien public vers la proposition. Ne jamais l''exposer en liste.';

-- Unicité du jeton : c'est par lui qu'on retrouve la proposition.
create unique index if not exists demandes_devis_jeton_idx
  on public.demandes_devis (jeton);


-- ===========================================================================
-- Vérification — à lancer après le script.
-- ===========================================================================
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'demandes_devis'
--    and column_name in ('telephone','montant_fcfa','prestation',
--                        'devis_etabli_le','validite_jours','jeton')
--  order by column_name;
