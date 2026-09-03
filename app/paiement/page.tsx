import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { FORMULES } from "@/lib/content";
import { FormulairePaiement } from "./formulaire-paiement";
import type { IdFormule } from "@/lib/supabase/commandes";

export const metadata: Metadata = {
  title: "Paiement",
  description: "Souscription à votre formule Nova Assist.",
  robots: { index: false },
};

export default async function Paiement({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string }>;
}) {
  const { formule } = await searchParams;
  const choisie = FORMULES.find((f) => f.id === formule);

  /* Sans formule valide, il n'y a rien à régler : on renvoie au catalogue
     plutôt que d'afficher un paiement vide. */
  if (!choisie) redirect("/offres");

  return (
    <>
      <header className="bg-navy">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-[18px] lg:px-14 lg:py-6">
          <Wordmark size={20} />
          <Link
            href="/offres"
            className="flex items-center gap-2 text-[14px] text-white/70 transition-colors hover:text-gold"
          >
            <ArrowLeft aria-hidden size={16} /> Changer de formule
          </Link>
        </div>
      </header>

      <main id="contenu" className="px-5 py-10 lg:px-14 lg:py-14">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-3 pb-8">
          <p className="na-eyebrow">Souscription</p>
          <h1 className="text-[30px] leading-[1.15] text-navy lg:text-[42px]">
            Formule {choisie.nom}
          </h1>
          <p className="text-[17px] text-slate-mid">
            <span className="font-serif text-[24px] text-navy">{choisie.prix}</span>{" "}
            {choisie.unite} — {choisie.pour}
          </p>
        </div>

        {/* Bandeau d'honnêteté : afficher un formulaire de carte sans encaisser
            serait trompeur si rien ne le disait. */}
        <div className="mx-auto mb-8 flex max-w-[1000px] items-start gap-3 border border-gold-line bg-gold-soft px-5 py-4">
          <ShieldCheck aria-hidden className="mt-[2px] h-5 w-5 shrink-0 text-gold-ink" />
          <p className="text-[15px] leading-[1.6] text-navy">
            <strong>L&apos;encaissement en ligne n&apos;est pas encore actif.</strong> Vos
            coordonnées bancaires ne sont ni transmises ni conservées — elles ne quittent
            pas votre navigateur. Valider enregistre votre souscription ; notre équipe vous
            contacte ensuite pour le règlement.
          </p>
        </div>

        <FormulairePaiement
          formule={choisie.id as IdFormule}
          nomFormule={choisie.nom}
        />
      </main>
    </>
  );
}
