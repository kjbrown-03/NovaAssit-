import { formaterTelephone } from "@/lib/telephone";

import { clientAdmin } from "./emails-auth";

/**
 * Les comptes créés mais jamais activés.
 *
 * Leur existence est la conséquence directe d'un problème de délivrabilité :
 * l'email de confirmation part d'une adresse Gmail sans domaine authentifié,
 * Gmail le classe en indésirable et y désactive les liens. La personne s'est
 * inscrite, n'a rien reçu d'exploitable, et reste bloquée sans le savoir.
 *
 * Cette liste sert à la rattraper à la main, par WhatsApp. Le lien lui-même
 * n'est pas produit ici : voir `lienActivationPour` et la route de relais.
 */

export type InscriptionEnAttente = {
  id: string;
  email: string;
  entreprise: string;
  contactNom: string;
  /** Forme internationale, chiffres seuls — `null` si aucun numéro utilisable. */
  telephone: string | null;
  /** Même numéro, mis en forme pour l'affichage. */
  telephoneLisible: string | null;
  creeLe: string;
};

/** Au-delà, la liste cesse d'être une liste d'action et devient un rapport. */
const PLAFOND = 40;

export async function listerInscriptionsEnAttente(): Promise<{
  comptes: InscriptionEnAttente[];
  erreur: string | null;
}> {
  try {
    const supabase = clientAdmin();

    /* `supabase-js` n'expose pas de filtre sur la confirmation : on pagine et
       on trie ici. Bornée à dix pages — bien au-delà du volume attendu, et
       sans risque de balayer indéfiniment. */
    const enAttente = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { comptes: [], erreur: error.message };

      const comptes = data?.users ?? [];
      for (const compte of comptes) {
        if (!compte.email_confirmed_at) enAttente.push(compte);
      }
      if (comptes.length < 200) break;
    }

    /* Le plus récent d'abord : c'est celui qui attend devant son téléphone. */
    enAttente.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    const retenus = enAttente.slice(0, PLAFOND);

    if (retenus.length === 0) return { comptes: [], erreur: null };

    /* Le déclencheur `gerer_nouveau_compte` crée la fiche dès l'inscription,
       avant toute confirmation : elle existe donc pour chacun de ces comptes.
       Le repli couvre le cas où elle aurait été supprimée à la main. */
    const { data: profils, error: erreurProfils } = await supabase
      .from("profils")
      .select("id, entreprise, contact_nom, telephone")
      .in(
        "id",
        retenus.map((compte) => compte.id),
      );

    if (erreurProfils) return { comptes: [], erreur: erreurProfils.message };

    const parId = new Map((profils ?? []).map((profil) => [profil.id as string, profil]));

    return {
      comptes: retenus.map((compte) => {
        const profil = parId.get(compte.id);
        const telephone = (profil?.telephone as string | null) ?? null;

        return {
          id: compte.id,
          email: compte.email ?? "",
          entreprise: (profil?.entreprise as string) ?? "À compléter",
          contactNom: (profil?.contact_nom as string) ?? "À compléter",
          telephone,
          telephoneLisible: telephone ? formaterTelephone(telephone) : null,
          creeLe: compte.created_at ?? "",
        };
      }),
      erreur: null,
    };
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : "Lecture impossible.";
    return { comptes: [], erreur: message };
  }
}
