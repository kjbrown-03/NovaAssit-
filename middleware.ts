import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Préfixes exigeant une session valide. */
const ROUTES_PROTEGEES = [
  "/espace-client",
  /* Accessible seulement par le lien de réinitialisation, qui ouvre une
     session en passant par /auth/confirm. */
  "/mot-de-passe-nouveau",
];

/**
 * Rafraîchit la session à chaque requête et ferme l'espace client.
 *
 * Avant ce fichier, `/espace-client` était accessible à quiconque tapait
 * l'URL. Pour un service qui vend de la confidentialité, c'était le défaut le
 * plus grave du site.
 *
 * Le middleware est une barrière de commodité — il redirige proprement. La
 * vraie protection des données reste les politiques RLS : même en contournant
 * cette redirection, aucune ligne d'un autre client ne serait lisible.
 */
export async function middleware(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire) {
          cookiesAEcrire.forEach(({ name, value }) =>
            requete.cookies.set(name, value),
          );
          reponse = NextResponse.next({ request: requete });
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /* `getUser()` et non `getSession()` : seul le premier revalide le jeton
     auprès de Supabase. `getSession` se contente de lire un cookie, qui peut
     être forgé. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = requete.nextUrl.pathname;
  const protegee = ROUTES_PROTEGEES.some(
    (prefixe) => chemin === prefixe || chemin.startsWith(`${prefixe}/`),
  );

  if (protegee && !user) {
    const url = requete.nextUrl.clone();
    url.pathname = "/connexion";
    /* Mémorise la destination pour y revenir après connexion. */
    url.searchParams.set("suite", chemin);
    return NextResponse.redirect(url);
  }

  /* Déjà connecté : la page de connexion n'a plus d'objet. */
  if (chemin === "/connexion" && user) {
    const url = requete.nextUrl.clone();
    url.pathname = "/espace-client";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return reponse;
}

export const config = {
  /* Tout sauf les fichiers statiques et les images — inutile d'y vérifier une
     session, et coûteux à chaque requête. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
