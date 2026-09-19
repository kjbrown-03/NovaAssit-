import "server-only";

import { statutPaiement, type StatutFapshi, type TransactionFapshi } from "@/lib/fapshi";
import { creerClientAdmin } from "./server";

export type StatutCommande = "en_attente" | "payee" | "annulee" | "echouee" | "expiree";

/** Ce que l'état Fapshi devient chez nous. `null` : rien à écrire, on attend. */
function traduire(statut: StatutFapshi): StatutCommande | null {
  switch (statut) {
    case "SUCCESSFUL":
      return "payee";
    case "FAILED":
      return "echouee";
    case "EXPIRED":
      return "expiree";
    default:
      return null;
  }
}

/**
 * Aligne une commande sur l'état réel de sa transaction Fapshi.
 *
 * Appelée par le webhook et par la page de retour : les deux passent par ici
 * pour que le rapprochement soit écrit une seule fois, de la même façon. Elle
 * relit toujours l'état auprès de Fapshi plutôt que de croire ce qu'on lui
 * apporte — un webhook forgé ou un retour manipulé ne marqueront rien payé.
 *
 * Écrit avec le client d'administration : aucune politique RLS n'autorise un
 * client à modifier sa commande, et c'est voulu.
 */
export async function synchroniserCommande(transId: string): Promise<{
  statut: StatutCommande | "inconnue";
  transaction: TransactionFapshi | null;
}> {
  const transaction = await statutPaiement(transId);
  if (!transaction) return { statut: "inconnue", transaction: null };

  const statut = traduire(transaction.status);
  const supabase = creerClientAdmin();

  const { data: commande } = await supabase
    .from("commandes")
    .select("id, profil_id, formule, statut, montant_fcfa")
    .eq("fapshi_trans_id", transId)
    .maybeSingle();

  if (!commande) return { statut: "inconnue", transaction };

  /* Une commande payée le reste : une relecture tardive (« EXPIRED » après le
     délai, par exemple) ne doit pas la faire reculer. */
  if (statut === null || commande.statut === "payee") {
    return { statut: commande.statut as StatutCommande, transaction };
  }

  /* Le montant encaissé doit être celui de la commande. Fapshi le fixe à la
     création et ne le laisse pas modifier, mais on ne marque rien payé sur la
     seule foi d'un « SUCCESSFUL » : un écart, quelle qu'en soit la cause, se
     règle à la main et se voit dans les journaux. */
  if (
    statut === "payee" &&
    typeof transaction.amount === "number" &&
    transaction.amount !== commande.montant_fcfa
  ) {
    console.error("[paiement] montant encaissé différent de la commande — non rapprochée :", {
      commande: commande.id,
      attendu: commande.montant_fcfa,
      recu: transaction.amount,
      transId,
    });
    return { statut: commande.statut as StatutCommande, transaction };
  }

  const { error } = await supabase
    .from("commandes")
    .update({
      statut,
      payee_le: statut === "payee" ? transaction.dateConfirmed ?? new Date().toISOString() : null,
      moyen_paiement: transaction.medium ?? null,
    })
    .eq("id", commande.id);

  if (error) {
    console.error("[paiement] mise à jour refusée :", error.message);
    return { statut: commande.statut as StatutCommande, transaction };
  }

  /* La souscription prend effet : la formule s'affiche dans l'espace client
     et le back-office la voit comme active. */
  if (statut === "payee") {
    const { error: erreurProfil } = await supabase
      .from("profils")
      .update({ formule: commande.formule })
      .eq("id", commande.profil_id);
    if (erreurProfil) console.error("[paiement] formule non posée :", erreurProfil.message);
  }

  return { statut, transaction };
}
