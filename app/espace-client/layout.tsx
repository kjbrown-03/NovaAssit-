import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { RailConsole } from "@/components/console/rail-console";
import { NavEspace } from "@/components/espace-client/nav-espace";
import { BlocProfil } from "@/components/espace-client/bloc-profil";
import { BoutonDeconnexion } from "@/components/espace-client/bouton-deconnexion";
import { ShinyButton } from "@/components/ui/shiny-button";
import { chargerTableauDeBord, semaineCourante } from "@/lib/supabase/espace-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageEspace");
  return { title: t("metaTitre"), description: t("metaDescription"), robots: { index: false } };
}

/**
 * Coque de l'espace client.
 *
 * Elle porte ce qui ne change pas d'une section à l'autre : le panneau de
 * navigation, la salutation, le bouton de nouvelle demande. Chaque onglet est
 * désormais une vraie page — auparavant tout tenait sur un seul écran et
 * « Mon profil » se trouvait en faisant défiler jusqu'en bas.
 *
 * `chargerTableauDeBord` est mémorisé par requête : l'appeler ici et dans la
 * page ne coûte qu'un seul aller-retour.
 */
export default async function EspaceClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profil } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");
  const tf = await getTranslations("formules");
  const locale = await getLocale();

  /* L'administration n'a rien à faire ici : ce tableau de bord affiche les
     demandes et factures d'un client, données qu'un compte d'administration
     n'a pas. On la renvoie vers son back-office. */
  if (profil?.role === "admin") redirect("/admin/devis");

  const entreprise = profil?.entreprise ?? t("profilIncomplet");
  const prenomOuNom = profil?.contact_nom?.trim();

  const nomFormule = profil?.formule
    ? t("formuleLibelle", { nom: tf(`${profil.formule}.nom`) })
    : t("formuleADefinir");

  const salutation = prenomOuNom ? t("bonjourNom", { nom: prenomOuNom }) : t("bonjour");

  return (
    <div className="na-console min-h-svh md:flex">
      <RailConsole
        id="menu-espace-client"
        ouvrirLabel={t("ouvrirMenu")}
        fermerLabel={t("fermerMenu")}
      >
        <NavEspace />

        <div className="mt-auto flex flex-col gap-1 border-t border-gold/20 px-2 pt-4 md:px-3">
          <BlocProfil
            nom={prenomOuNom ?? null}
            entreprise={entreprise}
            formule={nomFormule}
          />
          <BoutonDeconnexion />
        </div>
      </RailConsole>

      <div className="flex min-w-0 flex-1 md:p-2">
        <main
          id="contenu"
          className="na-carte flex min-w-0 flex-1 flex-col shadow-sm md:rounded-2xl"
        >
          <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-line-soft px-8 md:flex">
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[19px] font-semibold text-navy">{salutation}</p>
              <p className="text-[13px] text-gray-mid">{semaineCourante(new Date(), locale)}</p>
            </div>
            <ShinyButton href="/devis" className="!px-[20px] !py-[10px] !text-[14px]">
              {t("nouvelleDemande")}
            </ShinyButton>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
              {/* En-tête mobile : la barre du haut est masquée sous md. */}
              <div className="flex flex-col gap-1 md:hidden">
                <p className="text-[26px] text-navy">{salutation}</p>
                <p className="text-[15px] text-gray-mid">{semaineCourante(new Date(), locale)}</p>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Action principale toujours à portée, y compris sur mobile où la barre
          du haut est masquée. */}
      <Link
        href="/devis"
        className="na-fab na-presse fixed right-4 bottom-6 z-40 flex h-14 items-center gap-2 rounded-full bg-navy px-5 text-[15px] font-medium text-white shadow-xl shadow-navy/25 hover:bg-gold hover:text-navy sm:right-8"
      >
        <Plus className="na-fab-icone h-6 w-6" aria-hidden />
        {t("nouvelleDemande")}
      </Link>
    </div>
  );
}
