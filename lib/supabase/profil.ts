import { creerClientServeur } from "./server";

/**
 * Ce qu'un client a déjà renseigné, pour ne pas le lui redemander.
 *
 * Les champs viennent de deux endroits : l'adresse est celle du compte
 * authentifié, le reste de la fiche `profils` remplie à l'inscription puis
 * complétée depuis l'espace client.
 */
export type ProfilConnu = {
  entreprise: string;
  contactNom: string;
  email: string;
  telephone: string;
  secteur: string;
  effectif: string;
};

/* Les valeurs de repli posées par le déclencheur `gerer_nouveau_compte` quand
   l'inscription n'a pas fourni le champ. Les recopier dans un formulaire
   n'aiderait personne : autant laisser la case vide. */
const REMPLISSAGE_AUTOMATIQUE = "À compléter";

function utile(valeur: unknown): string {
  const texte = typeof valeur === "string" ? valeur.trim() : "";
  return texte === REMPLISSAGE_AUTOMATIQUE ? "" : texte;
}

/**
 * Lit le profil du compte connecté.
 *
 * Retourne `null` sans session — le formulaire de devis reste alors utilisable,
 * simplement vide. Aucune clause de filtrage n'est nécessaire au-delà de
 * l'identifiant : RLS interdit déjà de lire la ligne d'un autre.
 */
export async function chargerProfilConnu(): Promise<ProfilConnu | null> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profils")
    .select("entreprise, contact_nom, telephone, secteur, effectif")
    .eq("id", user.id)
    .maybeSingle();

  return {
    entreprise: utile(data?.entreprise),
    contactNom: utile(data?.contact_nom),
    email: user.email ?? "",
    telephone: utile(data?.telephone),
    secteur: utile(data?.secteur),
    effectif: utile(data?.effectif),
  };
}
