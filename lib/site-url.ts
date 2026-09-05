/**
 * Adresse publique du site, telle qu'elle doit figurer dans un lien envoyé par
 * email.
 *
 * Ne pas la déduire de la requête : derrière le proxy de Vercel, `request.url`
 * porte parfois l'adresse interne de la fonction, et un lien de confirmation
 * qui pointe vers une adresse interne ne mène nulle part.
 *
 * Ordre de préférence :
 *   1. `NEXT_PUBLIC_SITE_URL` — la seule valeur que l'on maîtrise vraiment ;
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — le domaine de production, stable d'un
 *      déploiement à l'autre, contrairement à `VERCEL_URL` qui change à chaque
 *      fois et enverrait les gens vers une prévisualisation morte ;
 *   3. l'origine de la requête, en dernier recours et en développement.
 */
export function urlDuSite(requete?: Request): string {
  const explicite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicite) return normaliser(explicite);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normaliser(production);

  if (requete) {
    try {
      return new URL(requete.url).origin;
    } catch {
      /* Adresse illisible : on retombe sur le développement local. */
    }
  }

  return "http://localhost:3000";
}

/**
 * Ajoute le schéma s'il manque et retire la barre finale.
 *
 * C'est exactement l'erreur qui a cassé les liens de confirmation : le Site URL
 * de Supabase avait été saisi « nova-assit.vercel.app », sans `https://`. Un
 * navigateur lit alors une adresse relative, et le lien ne mène nulle part.
 */
function normaliser(valeur: string): string {
  const avecSchema = /^https?:\/\//i.test(valeur) ? valeur : `https://${valeur}`;
  return avecSchema.replace(/\/+$/, "");
}
