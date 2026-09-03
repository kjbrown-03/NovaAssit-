import { creerClientAdmin } from "./server";

export type StatutDevis = "nouveau" | "en_cours" | "traitee" | "perdue";

export type DemandeDevis = {
  id: number;
  entreprise: string;
  contact_nom: string;
  email: string;
  secteur: string | null;
  effectif: string | null;
  domaines: string[];
  canaux: string[];
  messages_par_jour: string | null;
  plage: string | null;
  precision_libre: string | null;
  formule_suggeree: string | null;
  statut: StatutDevis;
  note_interne: string | null;
  recue_le: string;
  traitee_le: string | null;
};

/** Ce que la route publique transmet, une fois validé. */
export type NouvelleDemandeDevis = {
  entreprise: string;
  contact_nom: string;
  email: string;
  secteur?: string | null;
  effectif?: string | null;
  domaines: string[];
  canaux?: string[];
  messages_par_jour?: string | null;
  plage?: string | null;
  precision_libre?: string | null;
  formule_suggeree?: string | null;
};

/**
 * Enregistre une demande de devis.
 *
 * Écrit avec la clé `service_role` parce que le visiteur n'est pas
 * authentifié : la table n'ouvre aucune politique d'insertion à `anon`, sans
 * quoi n'importe quel navigateur pourrait y déverser du spam. La validation a
 * déjà eu lieu dans la route appelante.
 *
 * Retourne `null` en cas d'échec plutôt que de lever : la route doit pouvoir
 * poursuivre l'envoi de l'email même si la base est momentanément indisponible.
 */
export async function enregistrerDemandeDevis(
  demande: NouvelleDemandeDevis,
): Promise<DemandeDevis | null> {
  try {
    const supabase = creerClientAdmin();

    const { data, error } = await supabase
      .from("demandes_devis")
      .insert({
        ...demande,
        canaux: demande.canaux ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error("[devis] enregistrement impossible :", error.message);
      return null;
    }

    return data as DemandeDevis;
  } catch (erreur) {
    console.error("[devis] enregistrement impossible :", erreur);
    return null;
  }
}

export const LIBELLE_STATUT_DEVIS: Record<StatutDevis, string> = {
  nouveau: "Nouvelle",
  en_cours: "En cours",
  traitee: "Traitée",
  perdue: "Sans suite",
};

/* Pastilles tonales, mêmes classes que le reste de la console. */
export const STYLE_STATUT_DEVIS: Record<StatutDevis, string> = {
  nouveau: "na-statut na-statut-attente",
  en_cours: "na-statut na-statut-cours",
  traitee: "na-statut na-statut-succes",
  perdue: "na-statut na-statut-neutre",
};
