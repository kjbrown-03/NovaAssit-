import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cheminInterne } from "@/lib/chemin-interne";
import { COOKIE_EPHEMERE } from "@/lib/session-navigateur";

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

  /* Uniquement un chemin interne — validé par le parseur d'URL, pas par un
     simple test de préfixe : `/\evil.example` passait ce dernier et devenait
     `https://evil.example/` à la redirection. Voir `lib/chemin-interne.ts`. */
  const destination = cheminInterne(url.searchParams.get("next"));

  let reponse = NextResponse.redirect(new URL(destination, url.origin));

  /* Une connexion précédente sans « se souvenir de moi » laisse un témoin
     persistant. Le lien ouvre une session neuve : sans effacer ce témoin, le
     middleware la prendrait pour une session périmée et renverrait à la
     connexion dès la page suivante — c'est ce qui rendait les liens reçus par
     email inopérants. */
  reponse.cookies.delete(COOKIE_EPHEMERE);

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
