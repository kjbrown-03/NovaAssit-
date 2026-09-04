import { unstable_cache } from "next/cache";

import { creerClientPublic, creerClientServeur } from "@/lib/supabase/server";

import type { Article, NouvelArticle, StatutArticle } from "./types";

/**
 * Dépôt des articles — sur Supabase.
 *
 * Seule couture entre le stockage et le reste du code : ni les actions
 * serveur, ni les pages ne touchent aux requêtes. Même découpage que
 * `lib/temoignages/depot.ts`.
 *
 * Le cloisonnement est porté par RLS (migration 008), pas par ces fonctions :
 * un visiteur ne lit que les articles publiés, l'administration voit et écrit
 * tout. Ces requêtes n'ont donc pas à le vérifier elles-mêmes — `listerTous`
 * renverra simplement une liste vide à un visiteur ordinaire.
 */

/* La base est en `snake_case`, le reste du code en `camelCase`. La conversion
   est faite ici, une fois. */
type LigneArticle = {
  id: string;
  slug: string;
  titre: string;
  chapo: string;
  corps: string;
  secteur: string | null;
  statut: StatutArticle;
  cree_le: string;
  modifie_le: string;
  publie_le: string | null;
};

const COLONNES =
  "id, slug, titre, chapo, corps, secteur, statut, cree_le, modifie_le, publie_le";

function versArticle(l: LigneArticle): Article {
  return {
    id: l.id,
    slug: l.slug,
    titre: l.titre,
    chapo: l.chapo,
    corps: l.corps,
    secteur: l.secteur ?? undefined,
    statut: l.statut,
    creeLe: l.cree_le,
    modifieLe: l.modifie_le,
    publieLe: l.publie_le ?? undefined,
  };
}

/**
 * Vérifie que la table existe.
 *
 * Sans ce contrôle, une migration non jouée donnerait une liste vide — donc un
 * back-office qui affirme « aucun article » alors qu'il n'a rien pu lire.
 */
export async function etatDepot(): Promise<string | null> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("articles").select("id").limit(1);
  return error ? error.message : null;
}

/* ---------------------------------------------------------------- lecture */

/** Tous les articles, brouillons compris. RLS ne les rend qu'à l'administration. */
export async function listerTous(): Promise<Article[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("articles")
    .select(COLONNES)
    .order("modifie_le", { ascending: false });

  return ((data ?? []) as LigneArticle[]).map(versArticle);
}

/** Ce que voit le public : publiés, du plus récent au plus ancien. */
export async function listerPublies(): Promise<Article[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("articles")
    .select(COLONNES)
    .eq("statut", "publie")
    .order("publie_le", { ascending: false });

  return ((data ?? []) as LigneArticle[]).map(versArticle);
}

/**
 * Un article par son adresse publique.
 *
 * Ne filtre pas sur le statut : c'est RLS qui décide. Un visiteur ordinaire ne
 * verra rien d'un brouillon, tandis que l'administration peut relire le sien
 * avant publication en ouvrant simplement son adresse.
 */
export async function lireParSlug(slug: string): Promise<Article | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("articles")
    .select(COLONNES)
    .eq("slug", slug)
    .maybeSingle();

  return data ? versArticle(data as LigneArticle) : null;
}

export async function lireParId(id: string): Promise<Article | null> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("articles")
    .select(COLONNES)
    .eq("id", id)
    .maybeSingle();

  return data ? versArticle(data as LigneArticle) : null;
}

/** Les adresses publiées, pour le prérendu des pages d'article. */
export async function listerSlugsPublies(): Promise<string[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("articles").select("slug").eq("statut", "publie");
  return (data ?? []).map((l) => l.slug as string);
}

/* ------------------------------------------------------- lecture en cache

   Le blog est public et identique pour tous : sans cache, mille visiteurs
   simultanés déclenchent mille requêtes Supabase pour le même contenu. Ces
   deux fonctions passent par le client sans cookies — `unstable_cache` refuse
   un appel à `cookies()`, et à raison : un cache partagé ne doit dépendre
   d'aucun visiteur en particulier.

   L'étiquette `articles` est invalidée par les actions du back-office : une
   publication est donc visible immédiatement, sans attendre l'expiration.
   ------------------------------------------------------------------------ */

export const ETIQUETTE = "articles";

/** Filet de sécurité si une invalidation se perd : une heure au maximum. */
const DUREE = 3600;

export const listerPubliesEnCache = unstable_cache(
  async (): Promise<Article[]> => {
    const supabase = creerClientPublic();
    const { data } = await supabase
      .from("articles")
      .select(COLONNES)
      .eq("statut", "publie")
      .order("publie_le", { ascending: false });

    return ((data ?? []) as LigneArticle[]).map(versArticle);
  },
  ["articles-publies"],
  { tags: [ETIQUETTE], revalidate: DUREE },
);

/**
 * Un article publié, mis en cache.
 *
 * Renvoie `null` pour un brouillon : la page appelante retombe alors sur
 * `lireParSlug`, qui tient compte de la session et laisse l'administration
 * relire son brouillon. Le chemin fréquenté — un article publié, lu par un
 * visiteur — ne touche donc jamais la base.
 */
export const lirePublieEnCache = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    const supabase = creerClientPublic();
    const { data } = await supabase
      .from("articles")
      .select(COLONNES)
      .eq("slug", slug)
      .eq("statut", "publie")
      .maybeSingle();

    return data ? versArticle(data as LigneArticle) : null;
  },
  ["article-publie"],
  { tags: [ETIQUETTE], revalidate: DUREE },
);


/* --------------------------------------------------------------- écriture */

export type EchecDepot = { erreur: string };

function estConflitDeSlug(message: string): boolean {
  /* 23505 est la violation de contrainte d'unicité côté Postgres ; le message
     nomme l'index quand la contrainte porte sur `slug`. */
  return message.includes("23505") || message.toLowerCase().includes("slug");
}

export async function creer(
  entree: NouvelArticle & { slug: string },
): Promise<Article | EchecDepot> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("articles")
    .insert({
      slug: entree.slug,
      titre: entree.titre,
      chapo: entree.chapo,
      corps: entree.corps,
      secteur: entree.secteur ?? null,
      statut: "brouillon",
    })
    .select(COLONNES)
    .single();

  if (error) {
    console.error("[articles] création refusée :", error.message);
    return {
      erreur: estConflitDeSlug(error.message)
        ? "Un article porte déjà cette adresse. Changez le titre, ou donnez une adresse différente."
        : error.message,
    };
  }

  return versArticle(data as LigneArticle);
}

export async function modifier(
  id: string,
  entree: NouvelArticle & { slug: string },
): Promise<Article | EchecDepot> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("articles")
    .update({
      slug: entree.slug,
      titre: entree.titre,
      chapo: entree.chapo,
      corps: entree.corps,
      secteur: entree.secteur ?? null,
    })
    .eq("id", id)
    .select(COLONNES)
    .single();

  if (error) {
    console.error("[articles] modification refusée :", error.message);
    return {
      erreur: estConflitDeSlug(error.message)
        ? "Un autre article porte déjà cette adresse."
        : error.message,
    };
  }

  return versArticle(data as LigneArticle);
}

/**
 * Fait avancer un article d'un statut à l'autre.
 *
 * `publie_le` est posée à la première publication et **conservée ensuite** :
 * dépublier puis republier ne doit pas faire remonter un vieil article en tête
 * de liste comme s'il était neuf. La contrainte SQL exige seulement qu'un
 * article publié porte une date, pas qu'elle soit celle du jour.
 */
export async function changerStatut(
  id: string,
  statut: StatutArticle,
): Promise<Article | EchecDepot> {
  const supabase = await creerClientServeur();

  const actuel = await lireParId(id);
  if (!actuel) return { erreur: "Article introuvable." };

  const { data, error } = await supabase
    .from("articles")
    .update({
      statut,
      publie_le:
        statut === "publie"
          ? (actuel.publieLe ?? new Date().toISOString())
          : (actuel.publieLe ?? null),
    })
    .eq("id", id)
    .select(COLONNES)
    .single();

  if (error) {
    console.error("[articles] changement de statut refusé :", error.message);
    return { erreur: error.message };
  }

  return versArticle(data as LigneArticle);
}

export async function supprimer(id: string): Promise<string | null> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    console.error("[articles] suppression refusée :", error.message);
    return error.message;
  }
  return null;
}
