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

  /* `getSession()` lit le cookie sans appel réseau, là où `getUser()` part
     valider le jeton auprès de Supabase — 350 à 580 ms mesurés depuis ce
     poste. Le middleware a déjà fait cette validation pour toute route
     `/admin`, la refaire ici doublait le coût de chaque page du back-office.

     L'identifiant ne sert qu'à cibler la ligne : c'est la lecture en base qui
     décide du rôle, et RLS qui la garde. Un cookie forgé ne donnerait aucun
     profil, donc aucun accès. */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
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
