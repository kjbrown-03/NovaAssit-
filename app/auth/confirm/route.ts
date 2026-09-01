import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Retour des liens envoyés par email : confirmation d'inscription,
 * réinitialisation de mot de passe, lien magique.
 *
 * Le lien reçu par le client passe d'abord par Supabase, qui vérifie le jeton
 * puis renvoie ici — avec, selon le mode, un `code` (PKCE) ou un `token_hash`.
 * Dans les deux cas il faut l'échanger contre une session et **poser les
 * cookies**, ce qu'une page ne fait pas : d'où cette route dédiée.
 *
 * Sans elle, le navigateur atterrissait sur une page qui ignorait le code, et
 * l'utilisateur restait déconnecté.
 */
export async function GET(requete: NextRequest) {
  const url = requete.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const suiteBrute = url.searchParams.get("next");
  /* Même précaution que sur la page de connexion : uniquement un chemin
     interne, jamais une URL absolue fournie de l'extérieur. */
  const destination =
    suiteBrute && suiteBrute.startsWith("/") && !suiteBrute.startsWith("//")
      ? suiteBrute
      : "/espace-client";

  let reponse = NextResponse.redirect(new URL(destination, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire) {
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return reponse;
    return echec(url, error.message);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return reponse;
    return echec(url, error.message);
  }

  return echec(url, "Lien incomplet");
}

/** Renvoie vers la connexion avec un motif lisible plutôt qu'une page blanche. */
function echec(url: NextURL, raison: string) {
  const cible = new URL("/connexion", url.origin);
  cible.searchParams.set("erreur", raison);
  return NextResponse.redirect(cible);
}

type NextURL = NextRequest["nextUrl"];
