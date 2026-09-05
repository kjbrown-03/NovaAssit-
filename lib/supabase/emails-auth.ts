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

/**
 * Retrouve un compte par son adresse.
 *
 * `supabase-js` n'expose pas de recherche par email : on pagine la liste
 * d'administration. Bornée à 2 000 comptes — bien au-delà de ce que Nova
 * Assist aura avant longtemps, et sans risque de balayer indéfiniment.
 */
async function trouverCompte(
  supabase: ReturnType<typeof clientAdmin>,
  email: string,
): Promise<{ id: string; confirme: boolean } | null> {
  const recherche = email.toLowerCase();

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;

    const trouve = data.users.find((u) => (u.email ?? "").toLowerCase() === recherche);
    if (trouve) {
      return { id: trouve.id, confirme: Boolean(trouve.email_confirmed_at) };
    }

    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Construit le lien nous-memes, vers notre propre route.
 *
 * `properties.action_link` pointe vers le point de verification de Supabase,
 * qui redirige ensuite. Deux fragilites en decoulent :
 *
 *   - la destination doit figurer dans la liste autorisee du tableau de bord,
 *     sans quoi Supabase la remplace en silence par son « Site URL » — c'est
 *     ce qui a casse tous les liens de confirmation ;
 *   - selon le mode du projet, il renvoie les jetons dans le FRAGMENT de
 *     l'URL (`#access_token=...`), que le serveur ne recoit jamais.
 *
 * Avec `hashed_token`, le lien mene directement a `/auth/confirm`, qui appelle
 * `verifyOtp` et pose les cookies de session. Plus aucune dependance au
 * reglage du tableau de bord, ni au mode de flux.
 */
function lienVersConfirmation(
  origine: string,
  proprietes: { hashed_token?: string; verification_type?: string } | null | undefined,
  suite: string,
): string | null {
  const jeton = proprietes?.hashed_token;
  const type = proprietes?.verification_type;
  if (!jeton || !type) return null;

  const url = new URL("/auth/confirm", origine);
  url.searchParams.set("token_hash", jeton);
  url.searchParams.set("type", type);
  url.searchParams.set("next", suite);
  return url.toString();
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

    /* `generateLink` de type `signup` échoue si l'adresse est déjà prise. Deux
       cas très différents se cachent derrière cette erreur :

       - le compte existe et n'est PAS confirmé : la personne s'est inscrite,
         n'a pas ouvert son lien, et réessaie. Sans ce repli, elle resterait
         bloquée pour toujours — chaque nouvelle tentative échouant en silence.
       - le compte est confirmé : il n'y a rien à envoyer, la personne doit se
         connecter. On reste muet, pour ne pas confirmer l'existence du compte
         à qui teste des adresses. */
    let lien = lienVersConfirmation(params.origine, data?.properties, "/espace-client");

    if (error) {
      const compte = await trouverCompte(supabase, params.email);
      if (!compte || compte.confirme) {
        return { ok: false, erreur: error.message };
      }

      /* Un lien magique confirme l'adresse à son ouverture, exactement comme
         le lien d'inscription d'origine. */
      const relance = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: params.email,
        options: { redirectTo: `${params.origine}/auth/confirm?next=/espace-client` },
      });

      if (relance.error) return { ok: false, erreur: relance.error.message };
      lien = lienVersConfirmation(params.origine, relance.data?.properties, "/espace-client");
    }

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

    const lien = lienVersConfirmation(params.origine, data.properties, "/mot-de-passe-nouveau");
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
