import { unstable_cache } from "next/cache";

import { creerClientPublic, creerClientServeur } from "@/lib/supabase/server";
import { ETIQUETTE_EQUIPE, type Membre } from "@/lib/equipe-partage";

/* Re-exportés pour que le code serveur n'ait qu'un seul import à faire. Le
   code client, lui, doit viser `equipe-partage` directement : ce fichier tire
   `next/headers`, que Next refuse dans un bundle navigateur. */
export { BUCKET, ETIQUETTE_EQUIPE, urlPortrait, type Membre } from "@/lib/equipe-partage";

/**
 * Membres de l'équipe, affichés sur « À propos ».
 *
 * Ils venaient des fichiers de traduction, avec des portraits d'exemple en noir
 * et blanc. Ils se gèrent désormais depuis le back-office, photos comprises.
 */

const DUREE = 3600;

type LigneMembre = {
  id: string;
  nom: string;
  role: string;
  bio: string | null;
  photo: string | null;
  position: number;
  visible: boolean;
};

const COLONNES = "id, nom, role, bio, photo, position, visible";

function versMembre(l: LigneMembre): Membre {
  return {
    id: l.id,
    nom: l.nom,
    role: l.role,
    bio: l.bio ?? undefined,
    photo: l.photo ?? undefined,
    position: l.position,
    visible: l.visible,
  };
}

/** Ce que voit le site public : les membres visibles, dans l'ordre choisi. */
export const listerEquipeEnCache = unstable_cache(
  async (): Promise<Membre[]> => {
    const supabase = creerClientPublic();
    const { data, error } = await supabase
      .from("membres")
      .select(COLONNES)
      .eq("visible", true)
      .order("position", { ascending: true })
      .order("cree_le", { ascending: true });

    /* Table absente ou base indisponible : la page « À propos » se rend sans
       section équipe plutôt que d'échouer. */
    if (error) {
      console.error("[equipe] lecture impossible :", error.message);
      return [];
    }
    return ((data ?? []) as LigneMembre[]).map(versMembre);
  },
  ["equipe-visible"],
  { tags: [ETIQUETTE_EQUIPE], revalidate: DUREE },
);

/** Tout, masqués compris. RLS ne le rend qu'à l'administration. */
export async function listerTousLesMembres(): Promise<{
  membres: Membre[];
  erreur: string | null;
}> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("membres")
    .select(COLONNES)
    .order("position", { ascending: true })
    .order("cree_le", { ascending: true });

  if (error) return { membres: [], erreur: error.message };
  return { membres: ((data ?? []) as LigneMembre[]).map(versMembre), erreur: null };
}
