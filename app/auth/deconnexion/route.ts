import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Ferme la session et renvoie à l'accueil.
 *
 * En POST volontairement : un GET serait déclenché par n'importe quel
 * préchargement de lien ou scanner d'antivirus, et déconnecterait le client
 * sans qu'il ait rien demandé.
 */
export async function POST(requete: NextRequest) {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();

  /* 303 : le navigateur doit repasser en GET après le POST. */
  return NextResponse.redirect(new URL("/", requete.nextUrl.origin), 303);
}
