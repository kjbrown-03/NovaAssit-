import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Wordmark } from "@/components/wordmark";
import { formaterFcfa } from "@/lib/content";
import { synchroniserCommande, type StatutCommande } from "@/lib/supabase/paiements";
import { creerClientServeur } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Retour de paiement",
  robots: { index: false },
};

/**
 * Page où Fapshi renvoie le client une fois le paiement terminé — ou abandonné.
 *
 * Elle ne croit pas l'URL : la commande est lue en base, sous la session du
 * client (RLS lui rend seulement les siennes), et si elle est encore en
 * attente, on va relire l'état auprès de Fapshi. C'est ce qui rattrape un
 * webhook arrivé trop tôt, ou jamais arrivé.
 */
export default async function RetourPaiement({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string }>;
}) {
  const { commande: brut } = await searchParams;
  const id = Number(brut);
  if (!Number.isInteger(id) || id <= 0) redirect("/espace-client/abonnement");

  const supabase = await creerClientServeur();
  const { data: commande } = await supabase
    .from("commandes")
    .select("id, formule, periode, montant_fcfa, statut, fapshi_trans_id")
    .eq("id", id)
    .maybeSingle();

  if (!commande) redirect("/espace-client/abonnement");

  let statut = commande.statut as StatutCommande;
  if (statut === "en_attente" && commande.fapshi_trans_id) {
    const resultat = await synchroniserCommande(commande.fapshi_trans_id);
    if (resultat.statut !== "inconnue") statut = resultat.statut;
  }

  const montant = `${formaterFcfa(commande.montant_fcfa)} FCFA`;
  const periode = commande.periode === "annuel" ? "règlement annuel" : "règlement mensuel";

  const contenu: Record<StatutCommande, { Icone: typeof CheckCircle2; eyebrow: string; titre: string; texte: string }> = {
    payee: {
      Icone: CheckCircle2,
      eyebrow: "Paiement confirmé",
      titre: "Votre souscription est active.",
      texte: `Nous avons bien reçu ${montant} (${periode}). Votre espace client est ouvert, et notre équipe prend contact avec vous sous 24 h ouvrées pour démarrer.`,
    },
    en_attente: {
      Icone: Clock,
      eyebrow: "Paiement en cours",
      titre: "Nous attendons la confirmation de votre opérateur.",
      texte: "Si vous avez validé le paiement sur votre téléphone, la confirmation arrive dans les minutes qui suivent. Rechargez cette page, ou retrouvez l'état de votre souscription dans votre espace.",
    },
    echouee: {
      Icone: XCircle,
      eyebrow: "Paiement refusé",
      titre: "Le paiement n'a pas abouti.",
      texte: "Votre opérateur a refusé l'opération — solde insuffisant ou demande non validée à temps, le plus souvent. Aucun montant n'a été prélevé. Vous pouvez réessayer.",
    },
    expiree: {
      Icone: XCircle,
      eyebrow: "Lien expiré",
      titre: "Ce lien de paiement n'est plus valable.",
      texte: "Un lien de paiement reste ouvert 24 heures. Aucun montant n'a été prélevé : relancez la souscription pour en obtenir un nouveau.",
    },
    annulee: {
      Icone: XCircle,
      eyebrow: "Souscription annulée",
      titre: "Cette souscription a été annulée.",
      texte: "Aucun montant n'a été prélevé. Vous pouvez relancer la souscription à tout moment.",
    },
  };

  const { Icone, eyebrow, titre, texte } = contenu[statut];
  const reussite = statut === "payee";

  return (
    <div className="na-pousse">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-[18px] lg:px-14 lg:py-6">
          <Wordmark size={20} />
          <Link
            href="/espace-client"
            className="flex items-center gap-2 text-[14px] text-white/70 transition-colors hover:text-gold"
          >
            <ArrowLeft aria-hidden size={16} /> Mon espace
          </Link>
        </div>
      </header>

      <main id="contenu" className="px-5 py-10 lg:px-14 lg:py-14">
        <div
          className={`mx-auto max-w-[60ch] border p-8 lg:p-12 ${
            reussite ? "border-gold-line bg-gold-soft" : "border-line bg-stone-50"
          }`}
        >
          <Icone aria-hidden className={`h-8 w-8 ${reussite ? "text-gold-ink" : "text-navy"}`} />
          <p className="na-eyebrow mt-5">{eyebrow}</p>
          <h1 className="mt-4 text-[28px] leading-[1.15] text-navy lg:text-[36px]">{titre}</h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-slate-mid">{texte}</p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.12em] text-gray-mid uppercase">
            Commande n° {commande.id}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {reussite || statut === "en_attente" ? (
              <Link
                href="/espace-client/abonnement"
                className="inline-block bg-navy px-7 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Voir mon abonnement
              </Link>
            ) : (
              <Link
                href={`/paiement?formule=${commande.formule}${commande.periode === "annuel" ? "&periode=annuel" : ""}`}
                className="inline-block bg-navy px-7 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Réessayer le paiement
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
