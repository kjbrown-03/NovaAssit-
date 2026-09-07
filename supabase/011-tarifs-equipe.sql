-- ===========================================================================
-- Nova Assist — migration 011 : tarifs modifiables et membres de l'équipe
--
-- À exécuter après `010-profil-temoignage.sql`, dans Supabase → SQL Editor.
-- Réexécutable sans effet de bord.
--
-- Deux besoins du back-office, plus le stockage des photos :
--
--   `tarifs`   les prix vivaient dans `lib/content.ts`. Les changer imposait
--              une modification de code et un déploiement — inacceptable pour
--              une donnée commerciale qui bouge sans prévenir. Seul le montant
--              est en base : les intitulés, les prestations incluses et les
--              cibles restent dans le code, car ce sont des textes de marque
--              qui se relisent, pas des variables.
--
--   `membres`  l'équipe affichée sur « À propos » venait des fichiers de
--              traduction, avec des portraits d'exemple. Elle se gère
--              désormais depuis le back-office, photos comprises.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tarifs
--
-- Une ligne par formule, la clé reprenant l'identifiant du code (`essentiel`,
-- `professionnel`, `premium`). Pas de clé étrangère : la liste des formules est
-- une donnée de code, pas de base.
-- ---------------------------------------------------------------------------
create table if not exists public.tarifs (
  formule       text primary key,
  montant_fcfa  integer not null check (montant_fcfa > 0),
  modifie_le    timestamptz not null default now(),
  modifie_par   uuid references public.profils (id) on delete set null,

  constraint tarif_formule_connue
    check (formule in ('essentiel', 'professionnel', 'premium'))
);

comment on table public.tarifs is
  'Montant mensuel de chaque formule. Absent = le prix du code fait foi.';

-- Valeurs de départ : celles du code au moment de la migration. Sans elles, le
-- back-office s'ouvrirait sur des champs vides et l'administration croirait
-- avoir perdu ses prix.
insert into public.tarifs (formule, montant_fcfa)
values ('essentiel', 75000), ('professionnel', 165000), ('premium', 320000)
on conflict (formule) do nothing;


-- ---------------------------------------------------------------------------
-- Membres de l'équipe
-- ---------------------------------------------------------------------------
create table if not exists public.membres (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  role       text not null,
  bio        text,
  -- Chemin dans le bucket `equipe`, pas une URL : le bucket peut changer de
  -- domaine, le chemin non.
  photo      text,
  -- Ordre d'affichage. Un entier libre plutôt qu'un rang calculé : réordonner
  -- ne doit pas réécrire toutes les lignes.
  position   integer not null default 0,
  visible    boolean not null default true,
  cree_le    timestamptz not null default now()
);

comment on table public.membres is
  'Équipe affichée sur la page À propos. Gérée depuis le back-office.';

create index if not exists membres_ordre_idx
  on public.membres (visible, position, cree_le);


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tarifs  enable row level security;
alter table public.membres enable row level security;

-- Les tarifs et l'équipe s'affichent sur le site public : lecture ouverte.
drop policy if exists "tarifs visibles par tous" on public.tarifs;
create policy "tarifs visibles par tous"
  on public.tarifs for select to anon, authenticated using (true);

drop policy if exists "membres visibles par tous" on public.membres;
create policy "membres visibles par tous"
  on public.membres for select to anon, authenticated using (visible);

drop policy if exists "admin voit tous les membres" on public.membres;
create policy "admin voit tous les membres"
  on public.membres for select to authenticated using (public.est_admin());

-- Écriture réservée à l'administration, sur les deux tables.
drop policy if exists "admin modifie les tarifs" on public.tarifs;
create policy "admin modifie les tarifs"
  on public.tarifs for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists "admin cree les tarifs" on public.tarifs;
create policy "admin cree les tarifs"
  on public.tarifs for insert to authenticated
  with check (public.est_admin());

drop policy if exists "admin cree les membres" on public.membres;
create policy "admin cree les membres"
  on public.membres for insert to authenticated
  with check (public.est_admin());

drop policy if exists "admin modifie les membres" on public.membres;
create policy "admin modifie les membres"
  on public.membres for update to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists "admin supprime les membres" on public.membres;
create policy "admin supprime les membres"
  on public.membres for delete to authenticated
  using (public.est_admin());


-- ---------------------------------------------------------------------------
-- Stockage des portraits
--
-- Bucket public : ces photos s'affichent sur une page publique, un lien signé
-- n'apporterait rien et compliquerait la mise en cache. L'écriture, elle,
-- reste réservée à l'administration.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('equipe', 'equipe', true)
on conflict (id) do nothing;

drop policy if exists "portraits lisibles par tous" on storage.objects;
create policy "portraits lisibles par tous"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'equipe');

drop policy if exists "admin depose un portrait" on storage.objects;
create policy "admin depose un portrait"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'equipe' and public.est_admin());

drop policy if exists "admin remplace un portrait" on storage.objects;
create policy "admin remplace un portrait"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'equipe' and public.est_admin());

drop policy if exists "admin supprime un portrait" on storage.objects;
create policy "admin supprime un portrait"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'equipe' and public.est_admin());


-- ===========================================================================
-- Vérification — à lancer après le script.
-- ===========================================================================
-- select formule, montant_fcfa from public.tarifs order by montant_fcfa;
-- select id, public from storage.buckets where id = 'equipe';
