"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Headset, MessageCircle, Newspaper, Tag, Users } from "lucide-react";
import { NavBar, type NavItem } from "@/components/ui/tubelight-navbar";
import { SelecteurLangue } from "@/components/selecteur-langue";
import { Wordmark } from "./wordmark";
import { ButtonOutline } from "@/components/ui";

/* Les libellés viennent des traductions ; seules l'URL et l'icône sont fixes. */
const ENTREES = [
  { cle: "services", url: "/services", icon: Headset },
  { cle: "offres", url: "/offres", icon: Tag },
  { cle: "aPropos", url: "/a-propos", icon: Users },
  { cle: "blog", url: "/blog", icon: Newspaper },
  { cle: "contact", url: "/contact", icon: MessageCircle },
] as const;

/**
 * Barre de navigation claire, présente sur toutes les pages vitrine : elle se
 * fond dans le papier de la page, sans filet ni fond propre.
 * Desktop : navigation « tubelight » entre le logotype, le sélecteur de langue
 * et « Se connecter ».
 * Mobile : logotype + menu déroulant, qui laisse la place aux libellés complets.
 */
export function SiteHeader({ connecte = false }: { connecte?: boolean }) {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const t = useTranslations("nav");
  const tc = useTranslations("commun");

  const liens: NavItem[] = ENTREES.map((entree) => ({
    name: t(entree.cle),
    url: entree.url,
    icon: entree.icon,
  }));

  return (
    <header className="sticky top-0 z-50 bg-paper transition-colors duration-200">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-[18px] lg:px-14 lg:py-4">
        <Wordmark size={18} tone="on-paper" className="lg:hidden" />
        <Wordmark size={24} tone="on-paper" className="hidden lg:flex" />

        <div className="hidden lg:block">
          <NavBar items={liens} floating={false} tone="on-paper" />
        </div>

        <div className="hidden items-center gap-[14px] lg:flex">
          <SelecteurLangue />
          {/* Connecté, « Se connecter » n'a plus de sens — et cliquer dessus
              ferme la session en cours, puisque /connexion sert toujours le
              formulaire. On mène donc à l'espace client. */}
          <ButtonOutline
            href={connecte ? "/espace-client" : "/connexion"}
            className="!px-[18px] !py-[9px] !text-[15px]"
          >
            {connecte ? tc("espaceClient") : tc("seConnecter")}
          </ButtonOutline>
        </div>

        {/* --- bascule mobile --- */}
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          className="flex w-6 flex-col gap-[5px] py-2 lg:hidden"
        >
          <span className="sr-only">{ouvert ? t("fermerMenu") : t("ouvrirMenu")}</span>
          <span aria-hidden className="h-px bg-navy/85" />
          <span aria-hidden className="h-px bg-navy/85" />
          <span aria-hidden className="h-px bg-navy/85" />
        </button>
      </div>

      {ouvert && (
        <nav
          id="menu-mobile"
          aria-label={t("navigationPrincipale")}
          className="border-t border-line bg-paper px-5 pb-6 lg:hidden"
        >
          <ul className="flex flex-col">
            {liens.map((lien) => {
              const Icone = lien.icon;
              const estActif = pathname === lien.url;
              return (
                <li key={lien.url}>
                  <Link
                    href={lien.url}
                    onClick={() => setOuvert(false)}
                    aria-current={estActif ? "page" : undefined}
                    className={`flex items-center gap-3 border-b border-line py-3 text-[16px] ${
                      estActif ? "font-semibold text-navy" : "text-slate-deep"
                    }`}
                  >
                    <Icone size={18} strokeWidth={2} aria-hidden />
                    {lien.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-col items-center gap-4">
            <SelecteurLangue />
            <ButtonOutline href={connecte ? "/espace-client" : "/connexion"} className="w-full">
              {connecte ? tc("espaceClient") : tc("seConnecter")}
            </ButtonOutline>
          </div>
        </nav>
      )}
    </header>
  );
}
