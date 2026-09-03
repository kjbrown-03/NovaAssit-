-- ===========================================================================
-- Nova Assist — migration 005 : lecture administrateur des données clients
--
-- À exécuter après `004-devis.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Le cahier des charges demande, au back office : « Gestion des comptes clients
-- — Suivi des commandes, historique des paiements ». La migration 003 n'avait
-- ouvert que `profils` ; demandes, commandes, factures et documents restaient
-- invisibles à l'administration, RLS ne laissant passer que les lignes du
-- compte connecté.
--
-- Lecture seule, volontairement : le back-office consulte et suit, il ne
-- réécrit pas l'historique d'un client. Les écritures continuent de passer par
-- la clé service_role, hors du navigateur.
-- ===========================================================================

drop policy if exists "admin lit toutes les demandes" on public.demandes;
create policy "admin lit toutes les demandes"
  on public.demandes
  for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin lit toutes les commandes" on public.commandes;
create policy "admin lit toutes les commandes"
  on public.commandes
  for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin lit toutes les factures" on public.factures;
create policy "admin lit toutes les factures"
  on public.factures
  for select
  to authenticated
  using (public.est_admin());

drop policy if exists "admin lit tous les documents" on public.documents;
create policy "admin lit tous les documents"
  on public.documents
  for select
  to authenticated
  using (public.est_admin());
