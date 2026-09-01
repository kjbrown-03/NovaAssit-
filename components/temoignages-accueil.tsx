import { Temoignages, type CarteTemoignage } from "@/components/temoignages";
import { listerPourAccueil } from "@/lib/temoignages/depot";

/**
 * Récupère côté serveur les témoignages validés par l'administration — cinq au
 * maximum, le plafond est appliqué par `listerPourAccueil` — et les confie à la
 * pile animée.
 *
 * Ce composant existe pour garder `<Temoignages>` purement présentationnel :
 * lui est un composant client, il ne peut pas lire le dépôt.
 */
export async function TemoignagesAccueil() {
  const publies = await listerPourAccueil();

  const cartes: CarteTemoignage[] = publies.map((temoignage) => ({
    cle: temoignage.id,
    format: temoignage.format,
    citation: temoignage.citation,
    auteur: temoignage.auteur,
    fonction: `${temoignage.fonction}, ${temoignage.entreprise} — ${temoignage.ville}`,
    videoUrl: temoignage.videoUrl,
  }));

  return <Temoignages temoignages={cartes} />;
}
