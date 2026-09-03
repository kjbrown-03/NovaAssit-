"use server";

import { creerClientServeur } from "./server";
import { FORMULES } from "@/lib/content";

export type IdFormule = "essentiel" | "professionnel" | "premium";

/** « 165 000 » → 165000. Le prix est saisi pour l'affichage, pas pour le calcul. */
function montantEnFcfa(id: IdFormule): number {
  const formule = FORMULES.find((f) => f.id === id);
  return Number((formule?.prix ?? "0").replace(/\s/g, "")) || 0;
}

/**
 * Enregistre une souscription en attente de paiement.
 *
 * Aucune donnée de carte n'entre ici, et c'est délibéré : le numéro et le CVV
 * ne quittent jamais le navigateur. Cette table ne retient que la formule, son
 * montant et l'état du règlement — la référence Tara viendra la compléter quand
 * l'encaissement sera branché.
 *
 * Le montant est relu depuis `FORMULES`, jamais reçu du client : sinon
 * n'importe qui pourrait souscrire au tarif de son choix.
 */
export async function creerCommande(formule: IdFormule): Promise<
  { ok: true; id: number } | { ok: false; erreur: string }
> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  const montant = montantEnFcfa(formule);
  if (montant <= 0) return { ok: false, erreur: "Formule inconnue." };

  const { data, error } = await supabase
    .from("commandes")
    .insert({
      profil_id: user.id,
      formule,
      montant_fcfa: montant,
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[commande] insertion refusée :", error.message);
    return { ok: false, erreur: "La souscription n'a pas pu être enregistrée." };
  }

  return { ok: true, id: data.id };
}
