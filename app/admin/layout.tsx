import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Wordmark } from "@/components/wordmark";
import { BoutonDeconnexion } from "@/components/espace-client/bouton-deconnexion";
import { NavAdmin, TitreSection } from "@/components/admin/nav-admin";
import { BlocAdmin } from "@/components/admin/bloc-admin";
import { identiteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/* Le back-office lit des données écrites à l'instant : jamais de cache. */
export const dynamic = "force-dynamic";

/**
 * Coque du back-office — même architecture que l'espace client : rail
 * rétractable bleu nuit, contenu dans une carte flottante. Ce qui change tient
 * aux onglets et à l'absence de tout ce qui relève d'un abonnement.
 *
 * Le contrôle du rôle est ici et non dans chaque page : une section ajoutée
 * plus tard hérite de la protection sans que personne ait à y penser. Le
 * middleware a déjà garanti qu'une session existe ; reste à vérifier qu'elle
 * porte bien le rôle `admin`, lu en base.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await identiteAdmin();

  if (!admin) {
    return (
      <main id="contenu" className="na-console min-h-svh px-5 py-20">
        <div className="mx-auto max-w-[560px]">
          <div className="na-carte na-monte rounded-3xl p-8 shadow-sm">
            <h1 className="mb-3 text-[26px] text-navy">Accès réservé</h1>
            <p className="mb-5 text-[15px] leading-[1.6] text-slate-mid">
              Ce compte n&apos;a pas le rôle administrateur. Connectez-vous avec un compte
              d&apos;administration pour accéder au back-office.
            </p>
            <BoutonDeconnexion tone="on-paper" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="na-console min-h-svh md:flex">
      {/* ------------------------------------------------------------ latérale */}
      <aside
        className={
          /* Rail rétractable : replié sur ses icônes, il se déploie au survol
             et au focus clavier, sans quoi on ne pourrait pas le parcourir à la
             tabulation. */
          "group/rail flex flex-col gap-6 bg-navy py-[26px] transition-[width] duration-200 ease-linear " +
          "md:sticky md:top-0 md:h-svh md:w-[76px] md:shrink-0 md:overflow-x-hidden md:overflow-y-auto " +
          "md:hover:w-[252px] md:focus-within:w-[252px] lg:gap-8"
        }
      >
        <div className="relative h-[26px] px-5">
          {/* Replié, seule l'initiale tient dans la largeur du rail. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-5 hidden items-center font-serif text-[21px] text-gold transition-opacity duration-200 md:flex md:group-hover/rail:opacity-0 md:group-focus-within/rail:opacity-0"
          >
            N
          </span>
          <span className="absolute inset-y-0 left-5 flex items-center transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
            <Wordmark size={19} />
          </span>
        </div>

        <NavAdmin />

        <div className="mt-auto flex flex-col gap-1 border-t border-gold/20 px-5 pt-4 md:px-3">
          <BlocAdmin nom={admin.nom} email={admin.email} />
          <BoutonDeconnexion />
        </div>
      </aside>

      {/* Le contenu flotte dans une carte blanche arrondie, posée sur le fond
          sablé — même signature que l'espace client. */}
      <div className="flex min-w-0 flex-1 md:p-2">
        <main
          id="contenu"
          className="na-carte flex min-w-0 flex-1 flex-col shadow-sm md:rounded-2xl"
        >
          <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-line-soft px-8 md:flex">
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[19px] font-semibold text-navy">
                <TitreSection />
              </p>
              <p className="truncate text-[13px] text-gray-mid">{admin.email}</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 border border-navy px-4 py-2 text-[14px] text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <ArrowLeft aria-hidden size={15} /> Retour au site
            </Link>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
              {/* En-tête mobile : la barre du haut est masquée sous md. */}
              <div className="flex flex-col gap-1 md:hidden">
                <p className="text-[24px] text-navy">
                  <TitreSection />
                </p>
                <p className="truncate text-[14px] text-gray-mid">{admin.email}</p>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
