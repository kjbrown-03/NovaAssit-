import { creerClientAdmin, creerClientServeur } from "@/lib/supabase/server";

import {
  MAX_ACCUEIL,
  type Notification,
  type NouveauTemoignage,
  type StatutTemoignage,
  type Temoignage,
} from "./types";

/**
 * Dépôt des témoignages — sur Supabase.
 *
 * Les données vivaient auparavant dans des fichiers JSON sous `.data/`, écrits
 * avant que le projet ait une base. Ça ne survivait pas à un hébergement sans
 * disque durable : chaque déploiement serait reparti de zéro.
 *
 * Ce fichier reste la seule couture entre le stockage et le reste du code —
 * ni les actions serveur, ni les pages, ni les composants ne touchent aux
 * requêtes. Les fonctions exportées ont gardé exactement leur signature, la
 * bascule n'a donc rien changé au-dessus.
 *
 * Le cloisonnement est porté par RLS (migration 007), pas par ces fonctions :
 * un client ne lit que ses dépôts et les témoignages publiés, l'administration
 * voit tout. Ces requêtes n'ont pas à le vérifier elles-mêmes.
 */

/* La base est en `snake_case`, le reste du code en `camelCase`. La conversion
   est faite ici, une fois, plutôt que dispersée dans les composants. */
type LigneTemoignage = {
  id: string;
  profil_id: string;
  format: "texte" | "video";
  citation: string;
  video_url: string | null;
  auteur: string;
  fonction: string;
  entreprise: string;
  ville: string;
  statut: StatutTemoignage;
  motif_refus: string | null;
  soumis_le: string;
  traite_le: string | null;
};

const COLONNES =
  "id, profil_id, format, citation, video_url, auteur, fonction, entreprise, ville, statut, motif_refus, soumis_le, traite_le";

function versTemoignage(l: LigneTemoignage): Temoignage {
  return {
    id: l.id,
    format: l.format,
    citation: l.citation,
    videoUrl: l.video_url ?? undefined,
    auteur: l.auteur,
    fonction: l.fonction,
    entreprise: l.entreprise,
    ville: l.ville,
    auteurCompte: l.profil_id,
    statut: l.statut,
    soumisLe: l.soumis_le,
    traiteLe: l.traite_le ?? undefined,
    motifRefus: l.motif_refus ?? undefined,
  };
}

/**
 * Vérifie que la table existe.
 *
 * Sans ce contrôle, une migration non jouée donnerait des listes vides — donc
 * un back-office qui affirme « rien en attente » alors qu'il n'a rien pu lire.
 * Mieux vaut dire ce qui manque.
 */
export async function etatDepot(): Promise<string | null> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("temoignages").select("id").limit(1);
  return error ? error.message : null;
}

/* ------------------------------------------------------------- témoignages */

export async function listerTous(): Promise<Temoignage[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("temoignages")
    .select(COLONNES)
    .order("soumis_le", { ascending: false });

  return ((data ?? []) as LigneTemoignage[]).map(versTemoignage);
}

export async function listerParStatut(statut: StatutTemoignage): Promise<Temoignage[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("temoignages")
    .select(COLONNES)
    .eq("statut", statut)
    .order("soumis_le", { ascending: false });

  return ((data ?? []) as LigneTemoignage[]).map(versTemoignage);
}

export async function listerParCompte(profilId: string): Promise<Temoignage[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("temoignages")
    .select(COLONNES)
    .eq("profil_id", profilId)
    .order("soumis_le", { ascending: false });

  return ((data ?? []) as LigneTemoignage[]).map(versTemoignage);
}

/**
 * Les témoignages affichés à l'accueil : validés uniquement, les plus
 * anciennement validés d'abord, et jamais plus de `MAX_ACCUEIL`.
 *
 * Le plafond est appliqué par la requête — `limit` — et non après coup : la
 * base ne renvoie que ce qui sera montré.
 */
export async function listerPourAccueil(): Promise<Temoignage[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("temoignages")
    .select(COLONNES)
    .eq("statut", "valide")
    .order("traite_le", { ascending: true, nullsFirst: false })
    .limit(MAX_ACCUEIL);

  return ((data ?? []) as LigneTemoignage[]).map(versTemoignage);
}

export async function compterValides(): Promise<number> {
  const supabase = await creerClientServeur();
  const { count } = await supabase
    .from("temoignages")
    .select("*", { count: "exact", head: true })
    .eq("statut", "valide");

  return count ?? 0;
}

/**
 * Enregistre un dépôt. Le compte est déduit de la session, jamais du
 * formulaire : sans quoi un client pourrait témoigner au nom d'un autre.
 * La politique RLS refuserait de toute façon, mais autant ne pas construire
 * une requête vouée à l'échec.
 */
export async function ajouter(entree: NouveauTemoignage): Promise<Temoignage | null> {
  const supabase = await creerClientServeur();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const profilId = session?.user?.id;
  if (!profilId) return null;

  const { data, error } = await supabase
    .from("temoignages")
    .insert({
      profil_id: profilId,
      format: entree.format,
      citation: entree.citation,
      video_url: entree.videoUrl ?? null,
      auteur: entree.auteur,
      fonction: entree.fonction,
      entreprise: entree.entreprise,
      ville: entree.ville,
      statut: "attente",
    })
    .select(COLONNES)
    .single();

  if (error) {
    console.error("[temoignages] dépôt refusé :", error.message);
    return null;
  }

  /* Ce que le client vient de saisir enrichit sa fiche : au témoignage
     suivant, fonction et ville lui seront reproposées. Sans conséquence si la
     migration 010 n'est pas jouée — l'échec est journalisé, le témoignage est
     déjà enregistré. */
  await memoriserIdentite(profilId, entree.fonction, entree.ville);

  return versTemoignage(data as LigneTemoignage);
}

/** Complète la fiche client avec ce qui n'y figurait pas encore. */
async function memoriserIdentite(
  profilId: string,
  fonction: string,
  ville: string,
): Promise<void> {
  if (!fonction && !ville) return;

  try {
    const supabase = await creerClientServeur();
    const { error } = await supabase
      .from("profils")
      .update({ fonction: fonction || null, ville: ville || null })
      .eq("id", profilId);

    if (error) console.error("[temoignages] fiche non complétée :", error.message);
  } catch (erreur) {
    console.error("[temoignages] fiche non complétée :", erreur);
  }
}

export async function changerStatut(
  id: string,
  statut: StatutTemoignage,
  motifRefus?: string,
): Promise<Temoignage | null> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("temoignages")
    .update({
      statut,
      traite_le: new Date().toISOString(),
      motif_refus: statut === "refuse" ? (motifRefus ?? null) : null,
    })
    .eq("id", id)
    .select(COLONNES)
    .single();

  if (error) {
    console.error("[temoignages] changement de statut refusé :", error.message);
    return null;
  }

  return versTemoignage(data as LigneTemoignage);
}

/* ----------------------------------------------------------- notifications */

/**
 * Écrit avec la clé `service_role` : c'est le dépôt d'un *client* qui doit
 * prévenir l'administration, et un client n'a — à raison — aucun droit
 * d'écriture sur cette table.
 */
export async function ajouterNotification(
  temoignageId: string,
  message: string,
): Promise<Notification | null> {
  try {
    const supabase = creerClientAdmin();
    const { data, error } = await supabase
      .from("notifications_admin")
      .insert({ temoignage_id: temoignageId, message })
      .select("id, temoignage_id, message, cree_le, lue_le")
      .single();

    if (error) {
      console.error("[temoignages] notification non enregistrée :", error.message);
      return null;
    }

    return {
      id: data.id as string,
      temoignageId: data.temoignage_id as string,
      message: data.message as string,
      creeLe: data.cree_le as string,
      lueLe: (data.lue_le as string | null) ?? undefined,
    };
  } catch (erreur) {
    console.error("[temoignages] notification non enregistrée :", erreur);
    return null;
  }
}

export async function listerNotifications(): Promise<Notification[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("notifications_admin")
    .select("id, temoignage_id, message, cree_le, lue_le")
    .order("cree_le", { ascending: false })
    .limit(50);

  return (data ?? []).map((l) => ({
    id: l.id as string,
    temoignageId: l.temoignage_id as string,
    message: l.message as string,
    creeLe: l.cree_le as string,
    lueLe: (l.lue_le as string | null) ?? undefined,
  }));
}

export async function marquerNotificationsLues(): Promise<void> {
  const supabase = await creerClientServeur();
  await supabase
    .from("notifications_admin")
    .update({ lue_le: new Date().toISOString() })
    .is("lue_le", null);
}
