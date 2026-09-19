-- ===========================================================================
-- Nova Assist — migration 013 : encaisser une souscription par Fapshi
--
-- À exécuter après `012-devis-chiffre.sql`, dans Supabase → SQL Editor.
-- Réexécutable sans effet de bord.
--
-- Le cahier des charges prévoyait Tara ; la cliente a retenu Fapshi, qui
-- encaisse par MTN Mobile Money et Orange Money. La table `commandes` garde
-- son rôle — une ligne par souscription — et gagne ce qu'il faut pour suivre
-- un paiement Fapshi de bout en bout.
-- ===========================================================================

-- Une commande peut désormais échouer ou expirer (lien de paiement de 24 h)
-- sans avoir été annulée par quelqu'un.
alter type statut_commande add value if not exists 'echouee';
alter type statut_commande add value if not exists 'expiree';

alter table public.commandes
  -- Identifiant `transId` renvoyé par Fapshi à la création du lien. Nul tant
  -- que le lien n'a pas été créé. Unique : le webhook s'en sert pour
  -- retrouver la commande, deux commandes ne peuvent pas le partager.
  add column if not exists fapshi_trans_id text unique,

  -- Mensuel, ou annuel (dix mensualités). Le montant enregistré en tient déjà
  -- compte ; la période sert à l'affichage et à la facturation.
  add column if not exists periode text not null default 'mensuel'
    check (periode in ('mensuel', 'annuel')),

  -- Ce que Fapshi rapporte une fois le paiement confirmé.
  add column if not exists payee_le timestamptz,
  add column if not exists moyen_paiement text,

  -- Tara n'a jamais été branché : la colonne est restée vide.
  drop column if exists tara_reference;

comment on column public.commandes.fapshi_trans_id is
  'transId Fapshi. Sert de clé de rapprochement pour le webhook et la page de retour.';
