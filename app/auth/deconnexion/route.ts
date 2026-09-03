import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { COOKIE_EPHEMERE, COOKIE_NAVIGATEUR_OUVERT } from "@/lib/session-navigateur";

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
  const reponse = NextResponse.redirect(new URL("/", requete.nextUrl.origin), 303);

  /* Les témoins de « se souvenir de moi » n'ont plus d'objet sans session ;
     laissés en place, le prochain visiteur de ce navigateur hériterait d'un
     réglage qu'il n'a pas choisi. */
  reponse.cookies.delete(COOKIE_EPHEMERE);
  reponse.cookies.delete(COOKIE_NAVIGATEUR_OUVERT);
  return reponse;
}
