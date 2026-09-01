"use server";

import { revalidatePath } from "next/cache";

import { ajouter, ajouterNotification, changerStatut, compterValides } from "./depot";
import { MAX_ACCUEIL, type FormatTemoignage, type NouveauTemoignage } from "./types";

export type EtatSoumission = {
  ok: boolean;
  message?: string;
  erreurs?: Partial<Record<string, string>>;
};

const LONGUEUR_MIN = 60;
const LONGUEUR_MAX = 600;

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);
  return typeof valeur === "string" ? valeur.trim() : "";
}

/** Un lien de vidéo doit être une URL http(s) exploitable telle quelle. */
function lienValide(valeur: string): boolean {
  try {
    const url = new URL(valeur);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Prévient l'administration qu'un témoignage attend une validation.
 *
 * ⚠️ À BRANCHER AVANT MISE EN LIGNE : la notification est aujourd'hui écrite
 * dans le dépôt et affichée dans `/admin/temoignages`. Il reste à envoyer un
 * email réel via un fournisseur (Resend, Postmark, SMTP), au même endroit que
 * l'email de demande de devis — voir `app/api/devis/route.ts`, qui porte la
 * même dette.
 */
async function notifierAdmin(id: string, auteur: string, entreprise: string) {
  const message = `Nouveau témoignage de ${auteur} (${entreprise}) — à valider.`;
  await ajouterNotification(id, message);
  console.info(`[temoignages] ${message}`);
}

export async function soumettreTemoignage(
  _precedent: EtatSoumission,
  donnees: FormData,
): Promise<EtatSoumission> {
  const format = (texte(donnees, "format") || "texte") as FormatTemoignage;
  const citation = texte(donnees, "citation");
  const videoUrl = texte(donnees, "videoUrl");

  const entree: NouveauTemoignage = {
    format,
    citation,
    videoUrl: format === "video" ? videoUrl : undefined,
    auteur: texte(donnees, "auteur"),
    fonction: texte(donnees, "fonction"),
    entreprise: texte(donnees, "entreprise"),
    ville: texte(donnees, "ville"),
    /* Tant qu'il n'y a pas d'authentification, le compte se déduit de l'email
       saisi. À remplacer par l'identifiant de session une fois la connexion
       branchée — voir `components/ui/auth-switch.tsx`. */
    auteurCompte: texte(donnees, "email"),
  };

  const erreurs: Record<string, string> = {};

  if (!entree.auteur) erreurs.auteur = "Indiquez votre nom.";
  if (!entree.fonction) erreurs.fonction = "Indiquez votre fonction.";
  if (!entree.entreprise) erreurs.entreprise = "Indiquez votre entreprise.";
  if (!entree.ville) erreurs.ville = "Indiquez votre ville.";

  if (!citation) {
    erreurs.citation =
      format === "video"
        ? "Résumez en une phrase ce que dit la vidéo."
        : "Écrivez votre témoignage.";
  } else if (format === "texte" && citation.length < LONGUEUR_MIN) {
    erreurs.citation = `Encore un peu : ${citation.length} caractères sur ${LONGUEUR_MIN} minimum.`;
  } else if (citation.length > LONGUEUR_MAX) {
    erreurs.citation = `Trop long : ${citation.length} caractères pour ${LONGUEUR_MAX} maximum.`;
  }

  if (format === "video" && !lienValide(videoUrl)) {
    erreurs.videoUrl = "Collez un lien commençant par https:// (YouTube, Vimeo…).";
  }

  if (!donnees.get("consentement")) {
    erreurs.consentement = "Votre accord de publication est nécessaire.";
  }

  if (Object.keys(erreurs).length > 0) {
    return { ok: false, erreurs, message: "Le formulaire comporte des erreurs." };
  }

  const temoignage = await ajouter(entree);
  await notifierAdmin(temoignage.id, temoignage.auteur, temoignage.entreprise);

  revalidatePath("/espace-client");
  revalidatePath("/admin/temoignages");

  return {
    ok: true,
    message:
      "Merci — votre témoignage est transmis. Il apparaîtra sur la page d'accueil après validation par notre équipe.",
  };
}

/* ------------------------------------------------------------ modération */

export async function validerTemoignage(donnees: FormData): Promise<void> {
  const id = texte(donnees, "id");
  if (!id) return;

  await changerStatut(id, "valide");

  /* Le plafond n'empêche pas la validation : il limite l'affichage. On le
     signale pour que l'administration sache que la place est prise. */
  const valides = await compterValides();
  if (valides > MAX_ACCUEIL) {
    await ajouterNotification(
      id,
      `Validé, mais l'accueil affiche déjà ${MAX_ACCUEIL} témoignages : celui-ci attend qu'une place se libère.`,
    );
  }

  revalidatePath("/admin/temoignages");
  revalidatePath("/espace-client");
  revalidatePath("/");
}

export async function refuserTemoignage(donnees: FormData): Promise<void> {
  const id = texte(donnees, "id");
  if (!id) return;

  await changerStatut(id, "refuse", texte(donnees, "motif") || undefined);

  revalidatePath("/admin/temoignages");
  revalidatePath("/espace-client");
  revalidatePath("/");
}

/** Retire un témoignage de l'accueil sans le refuser : il repasse en attente. */
export async function depublierTemoignage(donnees: FormData): Promise<void> {
  const id = texte(donnees, "id");
  if (!id) return;

  await changerStatut(id, "attente");

  revalidatePath("/admin/temoignages");
  revalidatePath("/espace-client");
  revalidatePath("/");
}
