import { NextResponse } from "next/server";

/**
 * Réception d'une demande de devis.
 *
 * ⚠️ À BRANCHER AVANT MISE EN LIGNE : cette route valide et journalise la
 * demande, mais n'envoie encore aucun email. Le cahier des charges prévoit
 * « formulaire connecté à un email professionnel Nova Assist » (§6.1) et une
 * protection anti-spam (§6.4). Il reste donc à ajouter :
 *   1. un transport email (Resend, Postmark, SMTP…) vers l'adresse Nova Assist,
 *   2. une vérification captcha / Turnstile sur la requête,
 *   3. une persistance des demandes pour le tableau de suivi du back-office.
 */

type Demande = {
  entreprise?: unknown;
  email?: unknown;
  contactNom?: unknown;
  consentement?: unknown;
  domaines?: unknown;
};

export async function POST(requete: Request) {
  let corps: Demande;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps de requête illisible." }, { status: 400 });
  }

  const entreprise = typeof corps.entreprise === "string" ? corps.entreprise.trim() : "";
  const contactNom = typeof corps.contactNom === "string" ? corps.contactNom.trim() : "";
  const email = typeof corps.email === "string" ? corps.email.trim() : "";
  const domaines = Array.isArray(corps.domaines) ? corps.domaines : [];

  const manquants: string[] = [];
  if (!entreprise) manquants.push("entreprise");
  if (!contactNom) manquants.push("contactNom");
  if (!/^\S+@\S+\.\S+$/.test(email)) manquants.push("email");
  if (domaines.length === 0) manquants.push("domaines");
  if (corps.consentement !== true) manquants.push("consentement");

  if (manquants.length > 0) {
    return NextResponse.json(
      { erreur: "Demande incomplète.", champs: manquants },
      { status: 422 },
    );
  }

  /* En attendant le transport email, la demande est tracée côté serveur. */
  console.info("[devis] nouvelle demande", { entreprise, email, domaines });

  return NextResponse.json({ ok: true }, { status: 201 });
}
