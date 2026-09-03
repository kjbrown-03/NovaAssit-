"use server";

import { revalidatePath } from "next/cache";

import { corpsHtml, corpsTexte, echapperHtml, envoyerNotification } from "@/lib/email";
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
 * Deux canaux : une trace en base, qui alimente la liste du back-office et
 * survit à tout, et un email qui va chercher l'administration là où elle est.
 * L'email peut échouer — serveur indisponible, identifiants expirés — sans que
 * le témoignage soit perdu pour autant : il attend dans la file de modération.
 */
async function notifierAdmin(temoignage: {
  id: string;
  auteur: string;
  entreprise: string;
  ville: string;
  fonction: string;
  format: FormatTemoignage;
  citation: string;
  videoUrl?: string;
}) {
  const message = `Nouveau témoignage de ${temoignage.auteur} (${temoignage.entreprise}) — à valider.`;
  await ajouterNotification(temoignage.id, message);

  const lignes: [string, string][] = [
    ["Auteur", echapperHtml(temoignage.auteur)],
    ["Fonction", echapperHtml(temoignage.fonction)],
    ["Entreprise", echapperHtml(temoignage.entreprise)],
    ["Ville", echapperHtml(temoignage.ville)],
    ["Format", temoignage.format === "video" ? "Vidéo" : "Écrit"],
    ["Témoignage", echapperHtml(temoignage.citation)],
  ];
  if (temoignage.videoUrl) lignes.push(["Vidéo", echapperHtml(temoignage.videoUrl)]);

  const titre = "Nouveau témoignage à valider";
  const envoye = await envoyerNotification({
    sujet: `[Témoignage] ${temoignage.auteur} — ${temoignage.entreprise}`,
    texte: `${corpsTexte(titre, lignes)}

À valider dans le back-office : /admin/temoignages`,
    html: `${corpsHtml(titre, lignes)}<p style="font-family: sans-serif; font-size: 14px;">À valider dans le back-office : <b>/admin/temoignages</b></p>`,
  });

  console.info(`[temoignages] ${message}${envoye ? "" : " (email non envoyé)"}`);
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

  /* `null` signifie qu'aucune session n'a été trouvée, ou que la politique RLS
     a refusé l'insertion. Dans les deux cas, mieux vaut le dire que d'afficher
     un remerciement pour un témoignage qui n'existe pas. */
  if (!temoignage) {
    return {
      ok: false,
      message:
        "Votre témoignage n'a pas pu être enregistré. Reconnectez-vous et réessayez — si cela persiste, écrivez-nous sur WhatsApp.",
    };
  }

  await notifierAdmin({
    id: temoignage.id,
    auteur: temoignage.auteur,
    entreprise: temoignage.entreprise,
    ville: temoignage.ville,
    fonction: temoignage.fonction,
    format: temoignage.format,
    citation: temoignage.citation,
    videoUrl: temoignage.videoUrl,
  });

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
