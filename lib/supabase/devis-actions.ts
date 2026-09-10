"use server";

import { revalidatePath } from "next/cache";

import { creerClientServeur } from "./server";
import { repercuterStatutAuClient, type StatutDevis } from "./devis";

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

  if (error) {
    console.error("[devis] changement de statut refusé :", error.message);
    return;
  }

  /* Le client doit voir bouger sa demande : sans ce report, elle restait
     figée « en cours » quoi que fasse l'administration. */
  await repercuterStatutAuClient(id, statut as StatutDevis);

  revalidatePath("/admin/devis");
  revalidatePath("/espace-client");
}

/**
 * Pose un prix sur une demande, ce qui la transforme en proposition.
 *
 * Une demande de devis arrive quand aucune formule toute faite ne convient :
 * le montant ne peut donc pas se déduire, il se décide. Cette action est le
 * seul endroit où il s'écrit.
 *
 * Même raison qu'au-dessus de passer par le client authentifié : c'est RLS qui
 * vérifie le rôle, pas ce code.
 */
export async function etablirDevis(donnees: FormData): Promise<void> {
  const id = Number(donnees.get("id"));
  /* La saisie autorise les espaces des milliers — « 245 000 » est ce qu'on
     tape naturellement — et les retire avant conversion. */
  const brut = String(donnees.get("montant") ?? "").replace(/[\s\u00A0]/g, "");
  const montant = Number(brut);
  const prestation = String(donnees.get("prestation") ?? "").trim();
  const validite = Number(donnees.get("validite") ?? 30);

  if (!Number.isFinite(id) || !Number.isInteger(montant) || montant <= 0) return;

  const supabase = await creerClientServeur();

  const { error } = await supabase
    .from("demandes_devis")
    .update({
      montant_fcfa: montant,
      prestation: prestation || null,
      validite_jours: Number.isInteger(validite) && validite > 0 && validite <= 365 ? validite : 30,
      devis_etabli_le: new Date().toISOString(),
      /* Chiffrer une demande, c'est la prendre en charge : le statut suit,
         sans obliger à un second clic. */
      statut: "en_cours",
      traitee_le: null,
    })
    .eq("id", id);

  if (error) {
    console.error("[devis] chiffrage refusé :", error.message);
    return;
  }

  await repercuterStatutAuClient(id, "en_cours");
  revalidatePath("/admin/devis");
  revalidatePath("/espace-client");
}
