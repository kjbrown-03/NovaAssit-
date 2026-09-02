import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Réception d'une demande de devis.
 *
 * La demande est validée puis transmise par email à l'adresse professionnelle
 * Nova Assist (cahier des charges §6.1). Le transport SMTP se configure par les
 * variables `SMTP_*` — voir `.env.example`.
 *
 * ⚠️ Restent à faire avant mise en ligne :
 *   1. une protection anti-spam — captcha ou Turnstile (§6.4) ; en l'état, le
 *      formulaire est ouvert à l'envoi automatisé,
 *   2. une persistance des demandes, pour le tableau de suivi du back-office
 *      (§5.1) : aujourd'hui, un email perdu est une demande perdue.
 */

type Demande = Record<string, unknown>;

/** Échappe une valeur avant insertion dans le corps HTML de l'email. */
function echapper(valeur: unknown): string {
  const texte =
    typeof valeur === "string"
      ? valeur
      : Array.isArray(valeur)
        ? valeur.filter((v) => typeof v === "string").join(", ")
        : "";

  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Valeur échappée, ou une mention lisible quand le champ est vide. */
const champ = (valeur: unknown, defaut = "Non renseigné") => echapper(valeur) || defaut;

/**
 * Nettoie une valeur destinée à l'en-tête `Subject`.
 * Un retour à la ligne dans un en-tête permettrait d'en injecter d'autres —
 * un `Bcc:` par exemple, qui ferait de ce formulaire un relais de spam.
 */
const ligneSure = (valeur: string) => valeur.replace(/[\r\n]+/g, " ").slice(0, 120);

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
  /* Le motif interdit les espaces, donc aussi les retours à la ligne : cette
     adresse peut servir de `Reply-To` sans risque d'injection d'en-tête. */
  if (!/^\S+@\S+\.\S+$/.test(email)) manquants.push("email");
  if (domaines.length === 0) manquants.push("domaines");
  if (corps.consentement !== true) manquants.push("consentement");

  if (manquants.length > 0) {
    return NextResponse.json(
      { erreur: "Demande incomplète.", champs: manquants },
      { status: 422 },
    );
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO } = process.env;

  /* Sans transport configuré, la demande serait perdue en silence. On refuse
     plutôt que d'afficher une confirmation mensongère au visiteur. */
  if (!SMTP_USER || !SMTP_PASS) {
    console.error(
      "[devis] SMTP_USER ou SMTP_PASS manquante — demande NON transmise :",
      { entreprise, email },
    );
    return NextResponse.json(
      { erreur: "Service d'envoi indisponible." },
      { status: 503 },
    );
  }

  const lignes: [string, string][] = [
    ["Entreprise", champ(entreprise)],
    ["Contact", champ(contactNom)],
    ["Email", champ(email)],
    ["Secteur d'activité", champ(corps.secteur)],
    ["Effectif", champ(corps.effectif)],
    ["Domaines délégués", champ(domaines)],
    ["Canaux concernés", champ(corps.canaux, "Aucun")],
    ["Volume de messages/j", champ(corps.messagesParJour)],
    ["Plage horaire", champ(corps.plage)],
    ["Précisions", champ(corps.precision, "—")],
    ["Formule pressentie", champ(corps.formuleSuggeree, "Inconnue")],
  ];

  const corpsHtml = `
    <div style="font-family: sans-serif; color: #0b1f3a; max-width: 600px; padding: 20px;">
      <h2 style="color: #c9a227;">Nouvelle demande de devis</h2>
      <p>Une nouvelle demande a été soumise sur le site Nova Assist.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        ${lignes
          .map(
            ([intitule, valeur], i) => `
          <tr>
            <td style="padding: 10px; ${
              i < lignes.length - 1 ? "border-bottom: 1px solid #eee;" : ""
            } font-weight: bold; width: 40%;">${intitule}</td>
            <td style="padding: 10px; ${
              i < lignes.length - 1 ? "border-bottom: 1px solid #eee;" : ""
            }">${valeur}</td>
          </tr>`,
          )
          .join("")}
      </table>
    </div>`;

  /* Version texte : certaines messageries n'affichent pas le HTML, et sa
     présence améliore le classement anti-spam. */
  const corpsTexte = [
    "Nouvelle demande de devis — site Nova Assist",
    "",
    ...lignes.map(([intitule, valeur]) => `${intitule} : ${valeur}`),
  ].join("\n");

  try {
    const port = Number(SMTP_PORT) || 465;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST || "smtp.gmail.com",
      port,
      /* 465 est du TLS implicite ; 587 démarre en clair puis passe en STARTTLS. */
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transport.sendMail({
      from: SMTP_FROM || '"Nova Assist Web" <noreply@novaassist.cm>',
      to: SMTP_TO || SMTP_USER,
      replyTo: email,
      subject: `[Devis] Nouvelle demande de ${ligneSure(entreprise)}`,
      text: corpsTexte,
      html: corpsHtml,
    });
  } catch (erreur) {
    /* Journalisé avec les coordonnées : c'est le dernier filet avant qu'une
       demande ne disparaisse pour de bon. */
    console.error("[devis] échec de l'envoi — demande NON transmise :", {
      entreprise,
      email,
      erreur,
    });
    return NextResponse.json(
      { erreur: "L'envoi a échoué." },
      { status: 502 },
    );
  }

  console.info("[devis] demande transmise pour", entreprise);
  return NextResponse.json({ ok: true }, { status: 201 });
}
