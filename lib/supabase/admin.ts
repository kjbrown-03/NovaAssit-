import { creerClientServeur } from "./server";

export type IdentiteAdmin = {
  email: string;
  nom: string;
  entreprise: string;
};

/**
 * Vérifie que le compte connecté porte le rôle `admin`.
 *
 * Le rôle est lu dans la base, pas dans un cookie ni dans un paramètre d'URL :
 * c'est le seul endroit qu'un visiteur ne peut pas fabriquer. La politique RLS
 * de `profils` laisse chaque compte lire sa propre ligne, la lecture ci-dessous
 * ne demande donc aucun privilège particulier.
 *
 * Retourne `null` si la session manque ou si le compte n'est pas administrateur
 * — au rappelant de décider quoi afficher.
 */
export async function identiteAdmin(): Promise<IdentiteAdmin | null> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profils")
    .select("role, contact_nom, entreprise")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || data.role !== "admin") return null;

  return {
    email: user.email ?? "",
    nom: (data.contact_nom as string) ?? "",
    entreprise: (data.entreprise as string) ?? "",
  };
}
