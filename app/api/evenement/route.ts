import { NextResponse } from "next/server";

import { creerClientAdmin } from "@/lib/supabase/server";

/**
 * Enregistre une conversion sortante — clic WhatsApp, appel, brochure.
 *
 * Ces gestes quittent le site : sans cette route, ils ne laissent aucune trace
 * et les « statistiques de fréquentation » du cahier des charges seraient
 * amputées de deux de leurs quatre conversions.
 *
 * Aucune donnée personnelle n'est conservée — ni IP, ni identifiant de
 * visiteur. Un type, une page, une heure.
 */

const TYPES = ["whatsapp", "appel", "brochure", "devis_ouvert"] as const;
type TypeEvenement = (typeof TYPES)[number];

export async function POST(requete: Request) {
  let corps: { type?: unknown; chemin?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps illisible." }, { status: 400 });
  }

  const type = String(corps.type ?? "");
  if (!TYPES.includes(type as TypeEvenement)) {
    return NextResponse.json({ erreur: "Type inconnu." }, { status: 422 });
  }

  /* Le chemin vient du navigateur : on le borne et on écarte tout ce qui n'est
     pas un chemin interne, pour ne pas stocker d'URL arbitraire. */
  const brut = typeof corps.chemin === "string" ? corps.chemin : "";
  const chemin = brut.startsWith("/") ? brut.slice(0, 120) : null;

  try {
    const supabase = creerClientAdmin();
    const { error } = await supabase.from("evenements").insert({ type, chemin });

    if (error) {
      console.error("[evenement] insertion refusée :", error.message);
      /* Une mesure perdue ne doit jamais gêner le visiteur : on répond 204
         plutôt que de propager l'erreur jusqu'à son navigateur. */
      return new NextResponse(null, { status: 204 });
    }
  } catch (erreur) {
    console.error("[evenement] insertion refusée :", erreur);
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}
