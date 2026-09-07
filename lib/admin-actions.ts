"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { identiteAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/server";
import { ETIQUETTE_TARIFS } from "@/lib/tarifs";
import { ETIQUETTE_EQUIPE } from "@/lib/equipe-partage";

/**
 * Actions du back-office : tarifs, équipe, paramètres du compte.
 *
 * Chaque écriture vérifie le rôle avant de toucher à la base. Les politiques
 * RLS refuseraient déjà un non-administrateur, mais une action serveur est une
 * porte ouverte sur Internet : mieux vaut un refus clair ici qu'une erreur
 * technique renvoyée par Postgres.
 */

export type EtatAction = { ok: boolean; message?: string };

const REFUS: EtatAction = { ok: false, message: "Action réservée à l'administration." };

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);
  return typeof valeur === "string" ? valeur.trim() : "";
}

/* ----------------------------------------------------------------- tarifs */

/** Bornes de bon sens : au-delà, c'est une faute de frappe, pas un tarif. */
const MONTANT_MIN = 1000;
const MONTANT_MAX = 100_000_000;

export async function enregistrerTarifs(
  _precedent: EtatAction,
  donnees: FormData,
): Promise<EtatAction> {
  const admin = await identiteAdmin();
  if (!admin) return REFUS;

  const supabase = await creerClientServeur();
  const lignes: { formule: string; montant_fcfa: number; modifie_par: string }[] = [];

  for (const formule of ["essentiel", "professionnel", "premium"]) {
    const brut = texte(donnees, formule);
    if (!brut) continue;

    /* La saisie tolère les espaces : « 165 000 » est ce qu'on lit sur le site,
       et l'exiger sans espaces serait une chausse-trape. */
    const montant = Number(brut.replace(/[^\d]/g, ""));

    if (!Number.isFinite(montant) || montant < MONTANT_MIN || montant > MONTANT_MAX) {
      return {
        ok: false,
        message: `Montant invalide pour ${formule} : attendu entre ${MONTANT_MIN} et ${MONTANT_MAX} FCFA.`,
      };
    }

    lignes.push({ formule, montant_fcfa: montant, modifie_par: admin.id });
  }

  if (lignes.length === 0) return { ok: false, message: "Aucun montant saisi." };

  const { error } = await supabase
    .from("tarifs")
    .upsert(lignes.map((l) => ({ ...l, modifie_le: new Date().toISOString() })), {
      onConflict: "formule",
    });

  if (error) return { ok: false, message: error.message };

  /* Les prix s'affichent sur l'accueil, les offres, le devis et le paiement :
     tout ce qui les montre doit repartir de zéro. */
  revalidateTag(ETIQUETTE_TARIFS);
  for (const chemin of ["/", "/offres", "/devis", "/paiement", "/espace-client", "/admin/tarifs"]) {
    revalidatePath(chemin);
  }

  return { ok: true, message: "Tarifs enregistrés. Le site les affiche désormais." };
}

/* ----------------------------------------------------------------- équipe */

export async function enregistrerMembre(
  _precedent: EtatAction,
  donnees: FormData,
): Promise<EtatAction> {
  if (!(await identiteAdmin())) return REFUS;

  const id = texte(donnees, "id");
  const nom = texte(donnees, "nom");
  const role = texte(donnees, "role");

  if (!nom) return { ok: false, message: "Le nom est nécessaire." };
  if (!role) return { ok: false, message: "Indiquez la fonction du membre." };

  const supabase = await creerClientServeur();

  const champs = {
    nom,
    role,
    bio: texte(donnees, "bio") || null,
    photo: texte(donnees, "photo") || null,
    position: Number(texte(donnees, "position")) || 0,
    visible: donnees.get("visible") !== null,
  };

  const { error } = id
    ? await supabase.from("membres").update(champs).eq("id", id)
    : await supabase.from("membres").insert(champs);

  if (error) return { ok: false, message: error.message };

  rafraichirEquipe();
  return { ok: true, message: id ? "Membre mis à jour." : "Membre ajouté." };
}

export async function supprimerMembre(donnees: FormData): Promise<void> {
  if (!(await identiteAdmin())) return;

  const id = texte(donnees, "id");
  if (!id) return;

  const supabase = await creerClientServeur();

  /* La photo part avec la fiche : la laisser dans le bucket accumulerait des
     fichiers que plus rien ne référence. */
  const { data } = await supabase.from("membres").select("photo").eq("id", id).maybeSingle();
  if (data?.photo) await supabase.storage.from("equipe").remove([data.photo]);

  await supabase.from("membres").delete().eq("id", id);
  rafraichirEquipe();
}

function rafraichirEquipe() {
  revalidateTag(ETIQUETTE_EQUIPE);
  revalidatePath("/a-propos");
  revalidatePath("/admin/equipe");
}

/* ------------------------------------------------------------ paramètres */

/**
 * Change le mot de passe du compte connecté.
 *
 * L'ancien mot de passe est redemandé et vérifié par une reconnexion : sans ça,
 * une session laissée ouverte sur un poste partagé suffirait à s'approprier le
 * compte. Supabase ne l'exige pas de lui-même.
 */
export async function changerMotDePasse(
  _precedent: EtatAction,
  donnees: FormData,
): Promise<EtatAction> {
  const admin = await identiteAdmin();
  if (!admin) return REFUS;

  const actuel = texte(donnees, "actuel");
  const nouveau = texte(donnees, "nouveau");
  const confirmation = texte(donnees, "confirmation");

  if (nouveau.length < 8) {
    return { ok: false, message: "Le nouveau mot de passe doit faire au moins 8 caractères." };
  }
  if (nouveau !== confirmation) {
    return { ok: false, message: "Les deux saisies ne correspondent pas." };
  }
  if (nouveau === actuel) {
    return { ok: false, message: "Le nouveau mot de passe est identique à l'ancien." };
  }

  const supabase = await creerClientServeur();

  const { error: erreurVerif } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: actuel,
  });
  if (erreurVerif) {
    return { ok: false, message: "Mot de passe actuel incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Mot de passe modifié." };
}

/**
 * Change l'adresse du compte.
 *
 * Supabase envoie un lien de confirmation à la NOUVELLE adresse : tant qu'il
 * n'est pas ouvert, l'ancienne reste en vigueur. C'est ce qui empêche de
 * détourner un compte en changeant son adresse.
 */
export async function changerEmail(
  _precedent: EtatAction,
  donnees: FormData,
): Promise<EtatAction> {
  const admin = await identiteAdmin();
  if (!admin) return REFUS;

  const nouveau = texte(donnees, "email").toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(nouveau)) {
    return { ok: false, message: "Adresse invalide." };
  }
  if (nouveau === admin.email.toLowerCase()) {
    return { ok: false, message: "C'est déjà l'adresse du compte." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ email: nouveau });

  if (error) return { ok: false, message: error.message };

  return {
    ok: true,
    message:
      `Un lien de confirmation a été envoyé à ${nouveau}. ` +
      "Tant qu'il n'est pas ouvert, l'ancienne adresse reste celle du compte.",
  };
}
