-- ===========================================================================
-- Nova Assist — migration 002 : suivi des heures
--
-- À exécuter après `schema.sql`, dans Supabase → SQL Editor → Run.
-- Réexécutable sans effet de bord.
--
-- Le tableau de bord affiche « heures consommées / forfait ». Ces deux nombres
-- sont tenus par Nova Assist depuis le back-office : le client les lit, il ne
-- les écrit pas. D'où l'absence de politique UPDATE — la mise à jour passe par
-- la clé service_role.
-- ===========================================================================

alter table public.profils
  add column if not exists heures_incluses   integer check (heures_incluses   >= 0),
  add column if not exists heures_consommees integer check (heures_consommees >= 0);

comment on column public.profils.heures_incluses is
  'Forfait mensuel en heures. Null tant que la formule n''est pas arrêtée.';
comment on column public.profils.heures_consommees is
  'Heures consommées sur le mois en cours, mises à jour par Nova Assist.';
