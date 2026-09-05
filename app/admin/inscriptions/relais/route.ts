import { NextResponse } from "next/server";

import { urlDuSite } from "@/lib/site-url";
import { identiteAdmin } from "@/lib/supabase/admin";
import { clientAdmin, lienActivationPour } from "@/lib/supabase/emails-auth";
import { lienWhatsApp, messageActivation } from "@/lib/telephone";

/**
 * Ouvre WhatsApp sur la conversation d'un compte non activé, message rédigé.
 *
 * Un gestionnaire de route plutôt qu'une action de serveur : la destination
 * est un lien externe (`wa.me`), et une navigation de premier niveau depuis un
 * simple `<a>` est le seul moyen fiable d'ouvrir l'application WhatsApp sur
 * tous les appareils. Le lien d'activation est produit ici, au clic, et non au
 * rendu de la liste — Supabase ne conserve qu'un jeton à la fois par compte,
 * si bien que le fabriquer à chaque affichage invaliderait ceux déjà relayés.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function versListe(origine: string, motif: string) {
  const url = new URL("/admin/inscriptions", origine);
  url.searchParams.set("erreur", motif);
  return NextResponse.redirect(url);
}

export async function GET(requete: Request) {
  const origine = urlDuSite(requete);

  /* Le contrôle du rôle est refait ici : un `layout.tsx` protège les pages
     qu'il enveloppe, jamais un gestionnaire de route voisin. Le middleware,
     lui, n'a garanti qu'une session — pas qu'elle porte le rôle admin. Sans
     cette ligne, tout compte connecté pourrait se faire remettre un lien
     d'activation valable pour le compte d'autrui. */
  const admin = await identiteAdmin();
  if (!admin) return new NextResponse("Accès réservé.", { status: 403 });

  const id = new URL(requete.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return versListe(origine, "identifiant");

  const supabase = clientAdmin();

  const { data, error } = await supabase.auth.admin.getUserById(id);
  const email = data?.user?.email;
  if (error || !email) return versListe(origine, "introuvable");

  /* Entre l'affichage de la liste et le clic, la personne a pu activer son
     compte toute seule. Lui renvoyer un lien n'aurait alors aucun sens. */
  if (data.user?.email_confirmed_at) return versListe(origine, "deja-actif");

  const { data: profil } = await supabase
    .from("profils")
    .select("contact_nom, telephone")
    .eq("id", id)
    .maybeSingle();

  const telephone = (profil?.telephone as string | null) ?? null;
  if (!telephone) return versListe(origine, "sans-numero");

  const lien = await lienActivationPour(email, origine);
  if (!lien) return versListe(origine, "lien");

  const message = messageActivation((profil?.contact_nom as string) ?? "", lien);
  return NextResponse.redirect(lienWhatsApp(telephone, message));
}
