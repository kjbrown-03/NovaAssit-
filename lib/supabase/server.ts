import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour les composants serveur, les actions et les routes API.
 *
 * Reste sur la clé `anon` : la session de l'utilisateur est lue dans les
 * cookies, et les politiques RLS s'appliquent normalement. C'est le
 * comportement voulu — le serveur agit *au nom du client connecté*, pas
 * au-dessus de lui.
 */
/**
 * `@supabase/ssr` ne pose PAS `secure` par défaut (voir `DEFAULT_COOKIE_OPTIONS`
 * dans le paquet) : le cookie de session pourrait alors partir en clair sur une
 * requête http://. On l'impose en production — et seulement là, un cookie
 * `Secure` étant refusé par le navigateur sur http://localhost.
 *
 * Contrairement à `maxAge`, que la bibliothèque réimpose après nos options,
 * `secure` traverse bien `cookieOptions`.
 */
const OPTIONS_COOKIE = { secure: process.env.NODE_ENV === "production" };

export async function creerClientServeur() {
  const magasin = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: OPTIONS_COOKIE,
      cookies: {
        getAll() {
          return magasin.getAll();
        },
        setAll(cookiesAEcrire) {
          try {
            cookiesAEcrire.forEach(({ name, value, options }) =>
              magasin.set(name, value, options),
            );
          } catch {
            /* Appelé depuis un composant serveur : l'écriture de cookies y est
               interdite. Sans gravité, c'est le middleware qui rafraîchit la
               session à chaque requête. */
          }
        },
      },
    },
  );
}

/**
 * Client public — sans session, donc sans cookies.
 *
 * Sert aux lectures dont le résultat est le même pour tout le monde : les
 * articles publiés, par exemple. C'est ce qui permet de les mettre en cache :
 * `unstable_cache` refuse un appel à `cookies()`, et à raison — un cache
 * partagé entre visiteurs ne doit dépendre d'aucun d'entre eux.
 *
 * Reste sur la clé `anon` : RLS s'applique avec le rôle `anon`, qui ne voit
 * que ce qui est explicitement public. Un brouillon reste invisible.
 */
export function creerClientPublic() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}

/**
 * Client d'administration — contourne TOUTES les politiques RLS.
 *
 * Réservé aux traitements serveur qui agissent pour le compte de Nova Assist :
 * retour de paiement Tara, changement de statut d'une demande, back-office.
 * Ne jamais l'appeler depuis un composant client, ni le dériver d'une donnée
 * fournie par l'utilisateur.
 */
export function creerClientAdmin() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante — client d'administration indisponible.",
    );
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
