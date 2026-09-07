-- ===========================================================================
-- Nova Assist — nettoyage des données d'essai
--
-- CE N'EST PAS UNE MIGRATION. Ce fichier ne construit rien : il efface des
-- lignes créées pendant les tests. Il n'a pas de numéro parce qu'il ne doit
-- PAS être rejoué par principe — on le lance quand on en a besoin, et
-- seulement après avoir relu ce qu'il va supprimer.
--
-- À jouer dans Supabase → SQL Editor, section par section, dans l'ordre.
--
-- ⚠️ Une suppression ne se défait pas. Le plan gratuit de Supabase ne fait
--    aucune sauvegarde automatique : ce qui part ici est perdu.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. AVANT TOUT — regarder ce qui va disparaître.
--
-- Lancez cette requête SEULE et lisez le résultat. Si une ligne ne vous
-- semble pas être un essai, arrêtez-vous là et ajustez l'adresse ci-dessous.
-- ---------------------------------------------------------------------------
select
  id,
  recue_le,
  entreprise,
  contact_nom,
  email,
  statut
from public.demandes_devis
where email = 'hylariekaldjob6@gmail.com'
order by recue_le desc;


-- ---------------------------------------------------------------------------
-- 2. La suppression.
--
-- À ne lancer qu'une fois la liste du dessus vérifiée.
--
-- Les lignes de `demandes` qui pointaient vers ces devis ne sont pas
-- effacées : leur `devis_id` passe simplement à NULL, comme le prévoit la
-- migration 009. Le suivi côté client reste donc lisible.
-- ---------------------------------------------------------------------------
delete from public.demandes_devis
where email = 'hylariekaldjob6@gmail.com';


-- ---------------------------------------------------------------------------
-- 3. Facultatif — le suivi client correspondant.
--
-- Si le compte d'essai a aussi des demandes visibles dans SON espace client,
-- et que vous voulez les faire disparaître de son tableau de bord.
--
-- Décommentez seulement si c'est bien ce que vous voulez.
-- ---------------------------------------------------------------------------
-- select d.id, d.reference, d.objet, d.statut, d.recue_le
--   from public.demandes d
--   join auth.users u on u.id = d.profil_id
--  where u.email = 'hylariekaldjob6@gmail.com'
--  order by d.recue_le desc;

-- delete from public.demandes d
--  using auth.users u
--  where u.id = d.profil_id
--    and u.email = 'hylariekaldjob6@gmail.com';


-- ---------------------------------------------------------------------------
-- 4. Facultatif — le compte d'essai lui-même.
--
-- Supprimer le compte efface en cascade son profil, ses demandes, ses
-- commandes, ses factures et ses documents : `profils.id` référence
-- `auth.users` avec `on delete cascade`, et le reste suit.
--
-- À ne faire que si vous n'avez plus besoin de ce compte pour tester.
-- Passe plutôt par Supabase → Authentication → Users → supprimer, qui
-- s'occupe aussi des jetons et des sessions.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- Vérification — après le passage.
-- ===========================================================================
-- select count(*) as restant
--   from public.demandes_devis
--  where email = 'hylariekaldjob6@gmail.com';
