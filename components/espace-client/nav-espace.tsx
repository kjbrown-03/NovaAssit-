"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FileText,
  Folder,
  LayoutDashboard,
  MessageSquareQuote,
  UserRound,
  Wallet,
} from "lucide-react";

/* Chaque entrée mène à une VRAIE page, non plus à une ancre. Auparavant le
   tableau de bord empilait tout sur un seul écran : cliquer « Mon profil »
   faisait défiler, et il fallait traverser demandes, documents et abonnement
   pour l'atteindre. Les intitulés viennent des messages, alignés par position
   sur `pageEspace.nav`. */
const SECTIONS = [
  { href: "/espace-client", Icone: LayoutDashboard },
  { href: "/espace-client/demandes", Icone: Folder },
  { href: "/espace-client/documents", Icone: FileText },
  { href: "/espace-client/abonnement", Icone: Wallet },
  { href: "/espace-client/temoignage", Icone: MessageSquareQuote },
  { href: "/espace-client/profil", Icone: UserRound },
];

export function NavEspace() {
  const t = useTranslations("pageEspace");
  const pathname = usePathname();
  const libelles = t.raw("nav") as string[];

  return (
    <nav aria-label={t("navAria")} className="md:px-3">
      <ul className="flex flex-col gap-1 px-2 md:px-0">
        {SECTIONS.map(({ href, Icone }, i) => {
          /* Le tableau de bord est le préfixe de toutes les autres routes :
             sans égalité stricte, il resterait actif partout. */
          const actif =
            href === "/espace-client"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`na-presse flex items-center gap-3 rounded-xl px-3 py-[10px] text-[15px] whitespace-nowrap transition-colors ${
                  actif ? "bg-gold text-navy" : "text-white/70 hover:bg-white/5 hover:text-gold"
                }`}
              >
                <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {/* Masqué tant que le panneau est fermé — au survol sur écran
                    large, au bouton sur téléphone. */}
                <span className="hidden group-data-[ouvert=true]/rail:inline md:group-hover/rail:inline md:group-focus-within/rail:inline">
                  {libelles[i]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Intitulé de la section courante, pour la barre de titre. */
export function TitreEspace() {
  const t = useTranslations("pageEspace");
  const pathname = usePathname();
  const libelles = t.raw("nav") as string[];

  const i = SECTIONS.findIndex(({ href }) =>
    href === "/espace-client"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`),
  );

  return <>{libelles[i] ?? libelles[0]}</>;
}
