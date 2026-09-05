import { creerClientAdmin, creerClientServeur } from "./server";

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

/**
 * Reporte la demande dans le suivi visible par le client.
 *
 * `demandes_devis` est la file de l'administration ; `demandes` est ce que le
 * client consulte dans son espace. Les deux tables existaient, mais rien ne les
 * reliait : une demande envoyée depuis le site n'apparaissait jamais dans
 * « Mes demandes », qui restait vide quoi qu'on fasse.
 *
 * Écrit avec la session du client — la politique « demandes creees par leur
 * client » l'y autorise pour sa propre ligne, et refuse pour celle d'un autre.
 * Un visiteur non connecté n'a pas de suivi : sa demande vit dans
 * `demandes_devis` seule, et l'administration la traite par email.
 *
 * Ne lève jamais : la demande est déjà enregistrée, ce report est un confort.
 */
export async function reporterDansLeSuivi(params: {
  profilId: string;
  devisId: number;
  reference: string;
  domaines: string[];
  precision: string | null;
  formuleSuggeree: string | null;
}): Promise<boolean> {
  try {
    const supabase = await creerClientServeur();

    /* L'objet doit se lire d'un coup d'œil dans une liste : les domaines
       demandés le résument mieux qu'un intitulé générique. */
    const objet =
      params.domaines.length > 0
        ? `Devis — ${params.domaines.slice(0, 3).join(", ")}${params.domaines.length > 3 ? "…" : ""}`
        : "Demande de devis";

    const detail = [
      params.formuleSuggeree ? `Formule pressentie : ${params.formuleSuggeree}` : null,
      params.precision,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase.from("demandes").insert({
      profil_id: params.profilId,
      /* Le lien qui permettra à l'administration de faire suivre le statut. */
      devis_id: params.devisId,
      reference: params.reference,
      objet,
      detail: detail || null,
    });

    if (error) {
      console.error("[devis] report dans le suivi impossible :", error.message);
      return false;
    }
    return true;
  } catch (erreur) {
    console.error("[devis] report dans le suivi impossible :", erreur);
    return false;
  }
}

/**
 * Référence lisible d'une demande : `NA-250905-4F2A`.
 *
 * Datée pour se situer d'un regard, complétée d'un suffixe tiré de
 * l'identifiant de la demande de devis — la colonne est unique, deux demandes
 * du même jour ne peuvent pas se télescoper.
 */
export function referenceDemande(idDevis: string, date = new Date()): string {
  const jour = date.toISOString().slice(2, 10).replace(/-/g, "");
  const suffixe = idDevis.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  return `NA-${jour}-${suffixe}`;
}


/**
 * Traduit un statut du back-office vers celui que lit le client.
 *
 * Les deux vocabulaires ne se recouvrent pas : l'administration distingue une
 * demande neuve d'une demande en traitement, distinction sans intérêt pour le
 * client, qui veut savoir si c'est en cours ou fini. `attente_retour` n'a pas
 * d'équivalent côté devis — il reste réservé aux demandes ouvertes à la main
 * depuis le back-office.
 */
export function statutClientPour(statut: StatutDevis): "en_cours" | "terminee" {
  return statut === "traitee" || statut === "perdue" ? "terminee" : "en_cours";
}

/**
 * Répercute l'avancement sur le suivi du client.
 *
 * Écrit avec `service_role` : le schéma n'ouvre volontairement aucune politique
 * UPDATE sur `demandes` — « le statut est piloté par Nova Assist, jamais par le
 * client ». C'est donc à ce titre qu'on écrit ici, et pour la seule ligne
 * rattachée à ce devis.
 *
 * Ne lève jamais : l'avancement côté administration a déjà eu lieu, ce report
 * ne doit pas le remettre en cause.
 */
export async function repercuterStatutAuClient(
  devisId: number,
  statut: StatutDevis,
): Promise<void> {
  try {
    const supabase = creerClientAdmin();
    const { error } = await supabase
      .from("demandes")
      .update({ statut: statutClientPour(statut) })
      .eq("devis_id", devisId);

    if (error) {
      console.error("[devis] statut non répercuté au client :", error.message);
    }
  } catch (erreur) {
    console.error("[devis] statut non répercuté au client :", erreur);
  }
}
