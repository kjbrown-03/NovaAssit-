import { createClient } from "@supabase/supabase-js";

import { corpsHtml, corpsTexte, echapperHtml, envoyerNotification } from "@/lib/email";

/**
 * Emails d'authentification envoyés par nos soins, via nodemailer.
 *
 * Supabase sait générer les liens de confirmation et de réinitialisation sans
 * les envoyer (`generateLink`). On récupère donc le lien et on l'expédie
 * nous-mêmes, avec le même SMTP que les notifications internes.
 *
 * Pourquoi : le service d'envoi intégré de Supabase est plafonné à deux emails
 * par heure. Chaque inscription et chaque mot de passe oublié en consommait un,
 * si bien qu'après deux essais tout le monde recevait
 * « over_email_send_rate_limit » — inscription impossible.
 *
 * Effet de bord bienvenu : les messages partent de l'adresse Nova Assist et
 * sont rédigés en français, au lieu des gabarits anglais par défaut.
 */

type TypeLien = "signup" | "recovery";

/**
 * Client d'administration dédié.
 *
 * `createClient` du paquet `supabase-js`, et non le client SSR : ces appels
 * n'ont ni cookie ni session à gérer, et `admin.generateLink` exige la clé
 * `service_role`.
 */
function clientAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !cle) throw new Error("Configuration Supabase incomplète.");

  return createClient(url, cle, { auth: { persistSession: false } });
}

/** Le bouton doré du gabarit, seul élément interactif du message. */
function bouton(lien: string, libelle: string): string {
  return `<p style="margin: 26px 0;">
    <a href="${lien}" style="background:#0b1f3a;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:sans-serif;font-size:15px;font-weight:600;display:inline-block;">${echapperHtml(libelle)}</a>
  </p>`;
}

export type ResultatLien = { ok: true } | { ok: false; erreur: string };

/**
 * Crée le compte s'il n'existe pas, puis envoie le lien de confirmation.
 *
 * `generateLink` avec le type `signup` fait les deux premières choses en une
 * fois et ne déclenche aucun email — c'est précisément ce qu'on veut.
 */
export async function envoyerLienInscription(params: {
  email: string;
  motDePasse: string;
  entreprise: string;
  contactNom: string;
  origine: string;
}): Promise<ResultatLien> {
  try {
    const supabase = clientAdmin();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: params.email,
      password: params.motDePasse,
      options: {
        /* Lues telles quelles par le déclencheur SQL `gerer_nouveau_compte`
           pour remplir la table `profils`. */
        data: { entreprise: params.entreprise, contact_nom: params.contactNom },
        redirectTo: `${params.origine}/auth/confirm?next=/espace-client`,
      },
    });

    if (error) return { ok: false, erreur: error.message };

    const lien = data.properties?.action_link;
    if (!lien) return { ok: false, erreur: "Lien de confirmation introuvable." };

    const titre = "Confirmez votre adresse";
    const lignes: [string, string][] = [
      ["Entreprise", echapperHtml(params.entreprise)],
      ["Contact", echapperHtml(params.contactNom)],
    ];

    const envoye = await envoyerNotification({
      destinataire: params.email,
      sujet: "Nova Assist — confirmez votre adresse",
      texte: `${corpsTexte(titre, lignes)}\n\nOuvrez ce lien pour activer votre accès :\n${lien}`,
      html: `${corpsHtml(titre, lignes)}${bouton(lien, "Activer mon accès")}
        <p style="font-family:sans-serif;font-size:13px;color:#8a8474;">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br>${echapperHtml(lien)}</p>`,
    });

    return envoye ? { ok: true } : { ok: false, erreur: "L'email n'a pas pu être envoyé." };
  } catch (erreur) {
    console.error("[auth] inscription :", erreur);
    return { ok: false, erreur: "Service indisponible." };
  }
}

/** Envoie le lien de réinitialisation du mot de passe. */
export async function envoyerLienReinitialisation(params: {
  email: string;
  origine: string;
}): Promise<ResultatLien> {
  try {
    const supabase = clientAdmin();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: params.email,
      options: { redirectTo: `${params.origine}/auth/confirm?next=/mot-de-passe-nouveau` },
    });

    if (error) return { ok: false, erreur: error.message };

    const lien = data.properties?.action_link;
    if (!lien) return { ok: false, erreur: "Lien de réinitialisation introuvable." };

    const titre = "Réinitialisation de votre mot de passe";
    const lignes: [string, string][] = [
      ["Compte", echapperHtml(params.email)],
      ["Validité", "1 heure"],
    ];

    const envoye = await envoyerNotification({
      destinataire: params.email,
      sujet: "Nova Assist — réinitialiser votre mot de passe",
      texte: `${corpsTexte(titre, lignes)}\n\nOuvrez ce lien pour choisir un nouveau mot de passe :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      html: `${corpsHtml(titre, lignes)}${bouton(lien, "Choisir un nouveau mot de passe")}
        <p style="font-family:sans-serif;font-size:13px;color:#8a8474;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>`,
    });

    return envoye ? { ok: true } : { ok: false, erreur: "L'email n'a pas pu être envoyé." };
  } catch (erreur) {
    console.error("[auth] réinitialisation :", erreur);
    return { ok: false, erreur: "Service indisponible." };
  }
}
