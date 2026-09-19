import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { synchroniserCommande } from "@/lib/supabase/paiements";

/**
 * Webhook Fapshi — adresse à renseigner sur le service, dans le dashboard :
 *   https://<domaine>/api/paiement/webhook
 *
 * Fapshi l'appelle une seule fois par changement d'état (SUCCESSFUL, FAILED,
 * EXPIRED), sans relance si nous ne répondons pas. On répond donc vite, et on
 * ne se fie pas au corps reçu : seul le `transId` est lu, l'état est relu
 * auprès de Fapshi avant d'écrire quoi que ce soit. Un webhook perdu est
 * rattrapé par la page de retour, qui refait la même relecture.
 *
 * L'en-tête `x-wh-secret` doit valoir `FAPSHI_WEBHOOK_SECRET`, la même valeur
 * que celle saisie dans le dashboard. Sans lui, n'importe qui pourrait nous
 * faire relire des transactions — sans conséquence, mais autant fermer.
 */
export async function POST(requete: Request) {
  const secret = process.env.FAPSHI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook fapshi] FAPSHI_WEBHOOK_SECRET manquant.");
    return NextResponse.json({ erreur: "Webhook non configuré." }, { status: 503 });
  }

  /* Comparaison à temps constant : `!==` s'arrête au premier octet différent,
     ce qui laisse mesurer combien de caractères du secret sont justes. Sur un
     réseau c'est difficile à exploiter, mais la version sûre ne coûte rien. */
  const recu = Buffer.from(requete.headers.get("x-wh-secret") ?? "");
  const attendu = Buffer.from(secret);
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  let corps: { transId?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps illisible." }, { status: 400 });
  }

  const transId = typeof corps.transId === "string" ? corps.transId : null;
  if (!transId) return NextResponse.json({ erreur: "transId manquant." }, { status: 400 });

  const { statut } = await synchroniserCommande(transId);

  /* Une transaction inconnue de notre base n'est pas une erreur à renvoyer :
     Fapshi ne relancera pas, et un 200 clôt proprement l'événement. */
  return NextResponse.json({ statut });
}
