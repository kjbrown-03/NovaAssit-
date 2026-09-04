import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les composants « use client ».
 *
 * N'utilise que la clé `anon`, publique par nature : ce qu'elle laisse voir est
 * entièrement décidé par les politiques RLS du schéma. Aucune clé secrète ne
 * doit transiter par ici.
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

export function creerClientNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: OPTIONS_COOKIE },
  );
}
