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
export async function creerClientServeur() {
  const magasin = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
