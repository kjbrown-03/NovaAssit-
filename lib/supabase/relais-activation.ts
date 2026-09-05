"use server";

import { headers } from "next/headers";

import { identiteAdmin } from "./admin";
import { clientAdmin, lienActivationPour } from "./emails-auth";
import { lienWhatsApp, messageActivation, normaliserTelephone } from "@/lib/telephone";

/**
 * Relais WhatsApp du lien d'activation, depuis le back-office.
 *
 * Nova Assist n'envoie pas le message elle-même : le site prépare la
 * conversation, l'administration appuie sur envoyer depuis sa ligne WhatsApp
 * Business. L'expéditeur affiché est donc « Nova Assist », le nom du profil
 * professionnel attaché au numéro — aucune API payante n'entre en jeu.
 *
 * Le lien est fabriqué à l'instant du clic, jamais au chargement de la liste :
 * Supabase ne garde qu'un jeton à la fois par compte, ouvrir la page ne doit
 * donc pas invalider un lien déjà relayé.
 */
export type ResultatRelais =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Reconstitue l'origine publique à partir des en-têtes de la requête. */
async function origine(): Promise<string> {
  const entetes = await headers();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host") ?? "localhost:3000";
  const protocole = entetes.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

export async function preparerRelaisWhatsApp(profilId: string): Promise<ResultatRelais> {
  if (!(await identiteAdmin())) {
    return { ok: false, message: "Action réservée à l'administration." };
  }

  const supabase = clientAdmin();

  const { data, error } = await supabase.auth.admin.getUserById(profilId);
  if (error || !data?.user) {
    return { ok: false, message: "Compte introuvable côté authentification." };
  }

  const utilisateur = data.user;

  if (utilisateur.email_confirmed_at) {
    return {
      ok: false,
      message: "Ce compte est déjà confirmé — aucun lien d'activation à envoyer.",
    };
  }

  if (!utilisateur.email) {
    return { ok: false, message: "Ce compte n'a pas d'adresse email exploitable." };
  }

  /* Le numéro vient de la fiche client, saisi à l'inscription. Sans lui, il n'y
     a pas de conversation à ouvrir. */
  const { data: profil } = await supabase
    .from("profils")
    .select("telephone, contact_nom")
    .eq("id", profilId)
    .maybeSingle();

  const numero = normaliserTelephone(String(profil?.telephone ?? ""));
  if (!numero) {
    return {
      ok: false,
      message: "Aucun numéro exploitable sur ce compte : relancez-le par email.",
    };
  }

  const lien = await lienActivationPour(utilisateur.email, await origine());
  if (!lien) {
    return { ok: false, message: "Le lien d'activation n'a pas pu être généré." };
  }

  return {
    ok: true,
    url: lienWhatsApp(numero, messageActivation(String(profil?.contact_nom ?? ""), lien)),
  };
}
