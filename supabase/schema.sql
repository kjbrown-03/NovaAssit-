    -- ===========================================================================
    -- Nova Assist — schéma de l'espace client
    --
    -- À exécuter dans Supabase : SQL Editor → New query → coller → Run.
    -- Le script est réexécutable : chaque objet est créé « if not exists » ou
    -- remplacé, on peut donc le relancer après modification sans tout casser.
    --
    -- Principe de sécurité : RLS activée sur TOUTES les tables, sans exception.
    -- Chaque client ne voit que ses propres lignes. Le cloisonnement est porté par
    -- la base, pas par le code applicatif. Le cahier des charges insiste sur la
    -- confidentialité comme argument commercial ; RLS est ce qui la rend vraie.
    -- ===========================================================================


    -- ---------------------------------------------------------------------------
    -- Types
    -- ---------------------------------------------------------------------------
    do $$ begin
      create type formule_nova as enum ('essentiel', 'professionnel', 'premium');
    exception when duplicate_object then null; end $$;

    do $$ begin
      create type statut_demande as enum ('en_cours', 'attente_retour', 'terminee');
    exception when duplicate_object then null; end $$;

    do $$ begin
      create type statut_commande as enum ('en_attente', 'payee', 'annulee');
    exception when duplicate_object then null; end $$;

    do $$ begin
      create type type_document as enum ('rapport', 'facture', 'contrat', 'autre');
    exception when duplicate_object then null; end $$;


    -- ---------------------------------------------------------------------------
    -- profils — une ligne par compte, en vis-à-vis de auth.users
    --
    -- `auth.users` est géré par Supabase et n'est pas modifiable. On y adosse une
    -- table applicative qui porte les informations d'entreprise.
    -- ---------------------------------------------------------------------------
    create table if not exists public.profils (
      id             uuid primary key references auth.users (id) on delete cascade,
      entreprise     text not null,
      contact_nom    text not null,
      telephone      text,
      secteur        text,
      effectif       text,
      formule        formule_nova,
      cree_le        timestamptz not null default now(),
      modifie_le     timestamptz not null default now()
    );

    comment on table public.profils is
      'Fiche entreprise du client. Une ligne par compte authentifié.';


    -- ---------------------------------------------------------------------------
    -- demandes — les sollicitations suivies dans le tableau de bord
    -- ---------------------------------------------------------------------------
    create table if not exists public.demandes (
      id          bigint generated always as identity primary key,
      profil_id   uuid not null references public.profils (id) on delete cascade,
      reference   text not null unique,
      objet       text not null,
      detail      text,
      statut      statut_demande not null default 'en_cours',
      prioritaire boolean not null default false,
      recue_le    timestamptz not null default now()
    );

    create index if not exists demandes_profil_idx on public.demandes (profil_id, recue_le desc);


    -- ---------------------------------------------------------------------------
    -- commandes — souscription à une formule, réglée via Tara
    -- ---------------------------------------------------------------------------
    create table if not exists public.commandes (
      id              bigint generated always as identity primary key,
      profil_id       uuid not null references public.profils (id) on delete cascade,
      formule         formule_nova not null,
      montant_fcfa    integer not null check (montant_fcfa > 0),
      statut          statut_commande not null default 'en_attente',
      -- Référence renvoyée par Tara. Nulle tant que le paiement n'est pas lancé.
      tara_reference  text,
      creee_le        timestamptz not null default now()
    );

    create index if not exists commandes_profil_idx on public.commandes (profil_id, creee_le desc);


    -- ---------------------------------------------------------------------------
    -- factures
    -- ---------------------------------------------------------------------------
    create table if not exists public.factures (
      id            bigint generated always as identity primary key,
      profil_id     uuid not null references public.profils (id) on delete cascade,
      commande_id   bigint references public.commandes (id) on delete set null,
      numero        text not null unique,
      montant_fcfa  integer not null check (montant_fcfa > 0),
      echeance      date not null,
      payee_le      timestamptz,
      -- Chemin dans le bucket Storage, pas une URL : les liens sont signés à la
      -- demande, pour que le PDF ne soit jamais accessible publiquement.
      chemin_pdf    text
    );

    create index if not exists factures_profil_idx on public.factures (profil_id, echeance desc);


    -- ---------------------------------------------------------------------------
    -- documents — rapports, contrats, pièces déposées
    -- ---------------------------------------------------------------------------
    create table if not exists public.documents (
      id         bigint generated always as identity primary key,
      profil_id  uuid not null references public.profils (id) on delete cascade,
      titre      text not null,
      type       type_document not null default 'autre',
      chemin     text not null,
      ajoute_le  timestamptz not null default now()
    );

    create index if not exists documents_profil_idx on public.documents (profil_id, ajoute_le desc);


    -- ===========================================================================
    -- Création automatique du profil à l'inscription
    --
    -- Sans ce déclencheur, un compte créé n'aurait aucune ligne dans `profils`, et
    -- toutes les politiques RLS le rejetteraient. Les champs d'entreprise sont lus
    -- dans les métadonnées passées au moment du `signUp`.
    -- ===========================================================================
    create or replace function public.gerer_nouveau_compte()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.profils (id, entreprise, contact_nom, telephone, secteur, effectif)
      values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'entreprise', 'À compléter'),
        coalesce(new.raw_user_meta_data ->> 'contact_nom', 'À compléter'),
        new.raw_user_meta_data ->> 'telephone',
        new.raw_user_meta_data ->> 'secteur',
        new.raw_user_meta_data ->> 'effectif'
      );
      return new;
    end;
    $$;

    drop trigger if exists au_nouveau_compte on auth.users;
    create trigger au_nouveau_compte
      after insert on auth.users
      for each row execute function public.gerer_nouveau_compte();


    -- ===========================================================================
    -- Row Level Security
    --
    -- `activer` ne suffit pas : sans politique, une table RLS refuse TOUT. Chaque
    -- table reçoit donc ses règles explicites.
    --
    -- `(select auth.uid())` plutôt que `auth.uid()` : la forme sous-requête est
    -- évaluée une fois par requête au lieu d'une fois par ligne.
    -- ===========================================================================

    alter table public.profils   enable row level security;
    alter table public.demandes  enable row level security;
    alter table public.commandes enable row level security;
    alter table public.factures  enable row level security;
    alter table public.documents enable row level security;

    -- --- profils ---------------------------------------------------------------
    drop policy if exists "profil visible par son proprietaire" on public.profils;
    create policy "profil visible par son proprietaire"
      on public.profils for select
      to authenticated
      using ((select auth.uid()) = id);

    drop policy if exists "profil modifiable par son proprietaire" on public.profils;
    create policy "profil modifiable par son proprietaire"
      on public.profils for update
      to authenticated
      using ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);

    -- Pas de politique INSERT ni DELETE : la création passe par le déclencheur
    -- ci-dessus, la suppression par celle du compte auth (cascade).

    -- --- demandes --------------------------------------------------------------
    drop policy if exists "demandes visibles par leur client" on public.demandes;
    create policy "demandes visibles par leur client"
      on public.demandes for select
      to authenticated
      using ((select auth.uid()) = profil_id);

    drop policy if exists "demandes creees par leur client" on public.demandes;
    create policy "demandes creees par leur client"
      on public.demandes for insert
      to authenticated
      with check ((select auth.uid()) = profil_id);

    -- Le statut est piloté par Nova Assist, jamais par le client : pas d'UPDATE.

    -- --- commandes -------------------------------------------------------------
    drop policy if exists "commandes visibles par leur client" on public.commandes;
    create policy "commandes visibles par leur client"
      on public.commandes for select
      to authenticated
      using ((select auth.uid()) = profil_id);

    drop policy if exists "commandes creees par leur client" on public.commandes;
    create policy "commandes creees par leur client"
      on public.commandes for insert
      to authenticated
      with check ((select auth.uid()) = profil_id);

    -- Le passage à « payee » vient du retour Tara, côté serveur, avec la clé
    -- service_role qui contourne RLS. Le client ne peut pas se déclarer payé.

    -- --- factures --------------------------------------------------------------
    drop policy if exists "factures visibles par leur client" on public.factures;
    create policy "factures visibles par leur client"
      on public.factures for select
      to authenticated
      using ((select auth.uid()) = profil_id);

    -- --- documents -------------------------------------------------------------
    drop policy if exists "documents visibles par leur client" on public.documents;
    create policy "documents visibles par leur client"
      on public.documents for select
      to authenticated
      using ((select auth.uid()) = profil_id);


    -- ===========================================================================
    -- Vérification — à lancer après le script.
    -- Les cinq tables doivent afficher rowsecurity = true.
    -- ===========================================================================
    -- select tablename, rowsecurity
    --   from pg_tables
    --  where schemaname = 'public'
    --  order by tablename;
