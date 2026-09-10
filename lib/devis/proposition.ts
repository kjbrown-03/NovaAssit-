import "server-only";

import { creerClientAdmin } from "@/lib/supabase/server";
import { referenceDemande, type DemandeDevis } from "@/lib/supabase/devis";
import type { DevisAImprimer } from "./pdf";

/**
 * Lecture d'une proposition par son jeton public.
 *
 * Le prospect ouvre son devis depuis WhatsApp, sur son téléphone, sans être
 * connecté — il n'a parfois même pas de compte. La page ne peut donc pas
 * s'appuyer sur une session : c'est le jeton de l'adresse qui fait office de
 * clé, et il est imprévisible.
 *
 * D'où la lecture en `service_role` plutôt que par RLS : aucune politique ne
 * saurait exprimer « visible pour qui connaît ce jeton », et en écrire une qui
 * ouvrirait la table à `anon` serait bien plus risqué que ce contournement,
 * borné ici à une ligne retrouvée par son secret.
 */
export async function lireProposition(jeton: string): Promise<DemandeDevis | null> {
  /* Un jeton mal formé ne doit pas atteindre la base : PostgREST répondrait
     par une erreur de conversion, plus bavarde qu'un simple « introuvable ». */
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jeton)) {
    return null;
  }

  try {
    const supabase = creerClientAdmin();
    const { data, error } = await supabase
      .from("demandes_devis")
      .select("*")
      .eq("jeton", jeton)
      .maybeSingle();

    if (error) {
      console.error("[proposition] lecture impossible :", error.message);
      return null;
    }

    /* Tant qu'aucun montant n'est posé, la proposition n'existe pas encore :
       on ne montre pas un devis vide à qui aurait deviné l'adresse. */
    if (!data || (data as DemandeDevis).montant_fcfa == null) return null;

    return data as DemandeDevis;
  } catch (erreur) {
    console.error("[proposition] lecture impossible :", erreur);
    return null;
  }
}

/** Traduit une ligne de la base en document imprimable. */
export function versDocument(devis: DemandeDevis): DevisAImprimer {
  return {
    reference: referenceDemande(String(devis.id), new Date(devis.recue_le)),
    entreprise: devis.entreprise,
    contactNom: devis.contact_nom,
    email: devis.email,
    telephone: devis.telephone,
    secteur: devis.secteur,
    effectif: devis.effectif,
    domaines: devis.domaines ?? [],
    canaux: devis.canaux ?? [],
    messagesParJour: devis.messages_par_jour,
    plage: devis.plage,
    prestation: devis.prestation,
    montantFcfa: devis.montant_fcfa ?? 0,
    etabliLe: devis.devis_etabli_le ? new Date(devis.devis_etabli_le) : new Date(),
    validiteJours: devis.validite_jours ?? 30,
  };
}

/** Nom du fichier proposé au téléchargement. */
export function nomFichier(devis: DemandeDevis): string {
  const reference = referenceDemande(String(devis.id), new Date(devis.recue_le));
  /* L'entreprise entre dans le nom du fichier : accents et espaces retirés,
     sinon l'en-tête `Content-Disposition` doit être encodé et certains
     clients de messagerie le rendent illisible. */
  const maison = devis.entreprise
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `Devis-${reference}${maison ? `-${maison}` : ""}.pdf`;
}
