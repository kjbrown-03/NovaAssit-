import nodemailer from "nodemailer";

/**
 * Envoi des notifications internes de Nova Assist.
 *
 * Le cahier des charges demande, au back office : « Gestion des demandes devis
 * reçues — Notification email + tableau suivi ». Le tableau vit en base ;
 * l'alerte passe par ici.
 *
 * Mutualisé parce que deux chemins ont le même besoin — une demande de devis
 * et un dépôt de témoignage — et qu'un transport dupliqué finit toujours par
 * diverger sur un détail : le port, l'expéditeur, la gestion d'erreur.
 */

export type Notification = {
  sujet: string;
  texte: string;
  html: string;
  /** Adresse du visiteur, pour pouvoir lui répondre d'un clic. */
  repondreA?: string;
  /**
   * Destinataire. Par défaut l'administration (`SMTP_TO`, à défaut
   * `SMTP_USER`) : la plupart des messages sont des alertes internes. Les
   * emails d'authentification, eux, vont au visiteur.
   */
  destinataire?: string;
};

/** Sans identifiants, on ne tente rien : l'appelant décide quoi faire. */
export function emailConfigure(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Un retour à la ligne dans un en-tête permettrait d'en injecter d'autres —
 * un `Bcc:` par exemple, qui ferait de ce formulaire un relais de spam.
 */
const ligneSure = (valeur: string) => valeur.replace(/[\r\n]+/g, " ").slice(0, 160);

/**
 * Envoie la notification. Retourne `false` plutôt que de lever : un email
 * perdu ne doit jamais faire échouer l'enregistrement qui l'a déclenché — la
 * donnée est déjà en base, c'est elle qui compte.
 */
export async function envoyerNotification(notification: Notification): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[email] SMTP_USER ou SMTP_PASS manquante — rien envoyé :", notification.sujet);
    return false;
  }

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
      from: SMTP_FROM || `"Nova Assist" <${SMTP_USER}>`,
      to: notification.destinataire || SMTP_TO || SMTP_USER,
      replyTo: notification.repondreA,
      subject: ligneSure(notification.sujet),
      text: notification.texte,
      html: notification.html,
    });

    return true;
  } catch (erreur) {
    console.error("[email] envoi impossible :", erreur);
    return false;
  }
}

/** Échappe une valeur avant insertion dans le corps HTML. */
export function echapperHtml(valeur: unknown): string {
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

/**
 * Met en page un tableau intitulé / valeur aux couleurs de la maison.
 * Les deux notifications ont la même forme : autant ne l'écrire qu'une fois.
 */
export function corpsHtml(titre: string, lignes: [string, string][]): string {
  return `
    <div style="font-family: sans-serif; color: #0b1f3a; max-width: 600px; padding: 20px;">
      <h2 style="color: #c9a227; margin-top: 0;">${echapperHtml(titre)}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        ${lignes
          .map(
            ([intitule, valeur], i) => `
          <tr>
            <td style="padding: 10px; ${
              i < lignes.length - 1 ? "border-bottom: 1px solid #eee;" : ""
            } font-weight: bold; width: 40%;">${echapperHtml(intitule)}</td>
            <td style="padding: 10px; ${
              i < lignes.length - 1 ? "border-bottom: 1px solid #eee;" : ""
            }">${valeur}</td>
          </tr>`,
          )
          .join("")}
      </table>
    </div>`;
}

/** Version texte : certaines messageries n'affichent pas le HTML, et sa
    présence améliore le classement anti-spam. */
export function corpsTexte(titre: string, lignes: [string, string][]): string {
  return [titre, "", ...lignes.map(([intitule, valeur]) => `${intitule} : ${valeur}`)].join("\n");
}
