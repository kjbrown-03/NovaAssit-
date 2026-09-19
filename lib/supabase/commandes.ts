"use server";

import { initierPaiement } from "@/lib/fapshi";
import { MOIS_FACTURES_A_L_ANNEE } from "@/lib/content";
import { chargerFormules } from "@/lib/tarifs";
import { creerClientAdmin, creerClientServeur } from "./server";

export type IdFormule = "essentiel" | "professionnel" | "premium";
export type Periode = "mensuel" | "annuel";

/**
 * Enregistre une souscription et ouvre son paiement chez Fapshi.
 *
 * Le montant est relu depuis les tarifs en base — jamais reçu du client,
 * sinon n'importe qui souscrirait au prix de son choix. L'année se règle en
 * dix mensualités, comme l'affiche la page.
 *
 * La commande est écrite avant d'appeler Fapshi : si l'appel échoue, on la
 * marque annulée plutôt que de laisser une ligne « en attente » sans lien.
 * Retourne le lien de paiement hébergé, vers lequel le navigateur redirige.
 */
export async function creerCommande(
  formule: IdFormule,
  periode: Periode,
): Promise<{ ok: true; lien: string } | { ok: false; erreur: string }> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, erreur: "Session expirée. Reconnectez-vous." };

  const choisie = (await chargerFormules()).find((f) => f.id === formule);
  if (!choisie) return { ok: false, erreur: "Formule inconnue." };

  const montant =
    periode === "annuel"
      ? choisie.montantMensuel * MOIS_FACTURES_A_L_ANNEE
      : choisie.montantMensuel;
  if (montant <= 0) return { ok: false, erreur: "Tarif indisponible." };

  const { data, error } = await supabase
    .from("commandes")
    .insert({
      profil_id: user.id,
      formule,
      periode,
      montant_fcfa: montant,
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[commande] insertion refusée :", error.message);
    return { ok: false, erreur: "La souscription n'a pas pu être enregistrée." };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const paiement = await initierPaiement({
    montantFcfa: montant,
    email: user.email,
    commandeId: data.id,
    profilId: user.id,
    message: `Nova Assist — formule ${choisie.nom}, ${periode === "annuel" ? "règlement annuel" : "règlement mensuel"}`,
    redirectUrl: `${site}/paiement/retour?commande=${data.id}`,
  });

  /* Le client n'a pas le droit de modifier sa commande (pas de politique RLS
     `update`) : ces deux écritures passent par le client d'administration. */
  const admin = creerClientAdmin();

  if (!paiement.ok) {
    await admin.from("commandes").update({ statut: "annulee" }).eq("id", data.id);
    return { ok: false, erreur: paiement.erreur };
  }

  const { error: erreurLien } = await admin
    .from("commandes")
    .update({ fapshi_trans_id: paiement.transId })
    .eq("id", data.id);

  if (erreurLien) {
    /* Sans le transId en base, le webhook ne retrouverait pas la commande :
       inutile d'envoyer le client payer un lien qu'on ne saura pas rapprocher. */
    console.error("[commande] transId non enregistré :", erreurLien.message);
    return { ok: false, erreur: "La souscription n'a pas pu être enregistrée." };
  }

  return { ok: true, lien: paiement.lien };
}
