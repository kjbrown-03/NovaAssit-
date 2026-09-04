import { NextResponse } from "next/server";

import { emailConfigure } from "@/lib/email";
import { envoyerLienReinitialisation } from "@/lib/supabase/emails-auth";

/**
 * Mot de passe oublié — le lien part par notre SMTP, pas par celui de Supabase,
 * dont le quota de deux emails par heure bloquait la fonction dès le troisième
 * essai.
 *
 * La réponse est toujours la même, que l'adresse existe ou non : répondre
 * différemment reviendrait à confirmer qu'une personne est cliente de Nova
 * Assist, pour qui interroge le formulaire adresse par adresse.
 */
export async function POST(requete: Request) {
  let corps: { email?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps illisible." }, { status: 400 });
  }

  const email = typeof corps.email === "string" ? corps.email.trim() : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ erreur: "Adresse invalide." }, { status: 422 });
  }

  if (!emailConfigure()) {
    console.error("[mot-de-passe] SMTP non configuré — aucun lien envoyable.");
    return NextResponse.json({ erreur: "Service indisponible." }, { status: 503 });
  }

  const origine = new URL(requete.url).origin;
  const resultat = await envoyerLienReinitialisation({ email, origine });

  if (!resultat.ok) {
    console.error("[mot-de-passe] échec :", resultat.erreur, "pour", email);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
