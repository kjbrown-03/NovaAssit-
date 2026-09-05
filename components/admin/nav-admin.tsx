"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Inbox, MessageSquareQuote, Newspaper, UserPlus, Users } from "lucide-react";

const SECTIONS = [
  { libelle: "Demandes de devis", href: "/admin/devis", Icone: Inbox },
  { libelle: "Comptes clients", href: "/admin/clients", Icone: Users },
  { libelle: "Inscriptions à confirmer", href: "/admin/inscriptions", Icone: UserPlus },
  { libelle: "Témoignages", href: "/admin/temoignages", Icone: MessageSquareQuote },
  /* Même icône que l'entrée « Blog » de l'en-tête du site : c'est le même
     contenu, vu de l'autre côté. */
  { libelle: "Articles du blog", href: "/admin/articles", Icone: Newspaper },
  { libelle: "Statistiques", href: "/admin/statistiques", Icone: BarChart3 },
];

/**
 * Onglets du back-office.
 *
 * Composant client uniquement pour `usePathname` : l'onglet actif se déduit de
 * l'URL. Dans l'espace client, le tableau de bord tient sur une seule page et
 * l'état actif était figé sur la première entrée ; ici chaque section est une
 * vraie route, il faut donc le calculer.
 */
export function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav aria-label="Back-office" className="md:px-3">
      {/* Sur mobile la latérale devient une barre d'onglets défilante. */}
      <ul className="na-scroll flex gap-1 overflow-x-auto px-3 md:flex-col md:overflow-visible md:px-0">
        {SECTIONS.map(({ libelle, href, Icone }) => {
          const actif = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`na-presse flex items-center gap-3 rounded-xl px-3 py-[10px] text-[15px] whitespace-nowrap transition-colors ${
                  actif
                    ? "bg-gold text-navy"
                    : "text-white/70 hover:bg-white/5 hover:text-gold"
                }`}
              >
                <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span className="transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
                  {libelle}
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
export function TitreSection() {
  const pathname = usePathname();
  const section = SECTIONS.find(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
  );
  return <>{section?.libelle ?? "Back-office"}</>;
}
