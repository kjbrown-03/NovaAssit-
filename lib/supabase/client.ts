import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les composants « use client ».
 *
 * N'utilise que la clé `anon`, publique par nature : ce qu'elle laisse voir est
 * entièrement décidé par les politiques RLS du schéma. Aucune clé secrète ne
 * doit transiter par ici.
 */
export function creerClientNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
