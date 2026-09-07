/**
 * Ce que l'équipe expose des deux côtés de la frontière serveur / navigateur.
 *
 * Ce fichier existe parce que `lib/equipe.ts` importe le client Supabase
 * serveur, donc `next/headers` — que Next refuse d'inclure dans un bundle
 * navigateur. Le formulaire d'ajout d'un membre est un composant client et a
 * pourtant besoin du type, du nom du bucket et de la fabrication d'URL.
 *
 * Rien ici ne touche à la base : ce sont des données de forme, pas d'accès.
 */

export const ETIQUETTE_EQUIPE = "equipe";
export const BUCKET = "equipe";

export type Membre = {
  id: string;
  nom: string;
  role: string;
  bio?: string;
  /** Chemin dans le bucket, pas une URL. */
  photo?: string;
  position: number;
  visible: boolean;
};

/**
 * URL publique d'un portrait.
 *
 * Le bucket est public : ces photos s'affichent sur une page ouverte à tous.
 * Un lien signé n'apporterait aucune protection et empêcherait le navigateur
 * de les mettre en cache.
 */
export function urlPortrait(chemin: string | undefined): string | null {
  if (!chemin) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${chemin}`;
}
