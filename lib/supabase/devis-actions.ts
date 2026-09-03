"use server";

import { revalidatePath } from "next/cache";

import { creerClientServeur } from "./server";
import type { StatutDevis } from "./devis";

const STATUTS: StatutDevis[] = ["nouveau", "en_cours", "traitee", "perdue"];

/**
 * Fait avancer une demande de devis dans le suivi.
 *
 * Passe par le client authentifié, pas par `service_role` : la politique RLS
 * « admin suit les demandes de devis » vérifie le rôle en base à chaque
 * écriture. Un compte client qui appellerait cette action se ferait refuser par
 * Postgres, sans que le code ait à le contrôler lui-même.
 */
export async function changerStatutDevis(donnees: FormData): Promise<void> {
  const id = Number(donnees.get("id"));
  const statut = String(donnees.get("statut") ?? "");

  if (!Number.isFinite(id) || !STATUTS.includes(statut as StatutDevis)) return;

  const supabase = await creerClientServeur();

  const { error } = await supabase
    .from("demandes_devis")
    .update({
      statut,
      /* Horodate la sortie du suivi actif ; remis à null si on la rouvre. */
      traitee_le: statut === "traitee" || statut === "perdue" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) console.error("[devis] changement de statut refusé :", error.message);

  revalidatePath("/admin/devis");
}
