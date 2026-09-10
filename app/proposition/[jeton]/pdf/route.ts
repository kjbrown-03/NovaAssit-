import { notFound } from "next/navigation";

import { fabriquerDevisPdf } from "@/lib/devis/pdf";
import { lireProposition, nomFichier, versDocument } from "@/lib/devis/proposition";

/**
 * Le fichier PDF de la proposition.
 *
 * Fabriqué à la demande plutôt que stocké : le document se déduit entièrement
 * de la ligne en base, et un fichier gardé quelque part se serait désynchronisé
 * dès la première correction de prix.
 *
 * `Content-Disposition: attachment` force le téléchargement plutôt que
 * l'ouverture dans le lecteur intégré — c'est ce qui était demandé, et sur
 * téléphone c'est aussi ce qui permet de transmettre le fichier ensuite.
 */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ jeton: string }> },
) {
  const { jeton } = await params;
  const devis = await lireProposition(jeton);

  if (!devis) notFound();

  const octets = fabriquerDevisPdf(versDocument(devis));

  return new Response(octets as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomFichier(devis)}"`,
      "Content-Length": String(octets.byteLength),
      /* Le prix peut être corrigé : rien ne doit rester en cache entre-temps,
         ni chez le prospect ni sur un intermédiaire. */
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
