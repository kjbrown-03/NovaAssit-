"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  /**
   * `true` (défaut) : pastille flottante — en haut sur desktop, en bas sur
   * mobile, comme le composant d'origine.
   * `false` : la barre se pose dans le flux, pour être imbriquée dans un
   * en-tête existant. C'est le mode utilisé par Nova Assist, qui conserve son
   * logotype et son bouton « Demander un devis » de part et d'autre.
   */
  floating?: boolean;
  /**
   * Comme `Wordmark` : sur fond clair les libellés passent en bleu nuit, la
   * pastille en sable. Sur bleu nuit ils restent blancs et or.
   */
  tone?: "on-navy" | "on-paper";
}

/**
 * Navigation « tubelight » : l'onglet actif est souligné d'un halo lumineux qui
 * glisse d'un lien à l'autre. Le déplacement est porté par `layoutId`, donc
 * animé même quand la page change.
 *
 * Palette adaptée à la charte Nova Assist (or sur bleu nuit) plutôt qu'aux
 * variables shadcn `--primary` / `--muted`, absentes de ce projet.
 */
export function NavBar({
  items,
  className,
  floating = true,
  tone = "on-navy",
}: NavBarProps) {
  const pathname = usePathname();
  const reduireMouvement = useReducedMotion();
  const surPapier = tone === "on-paper";

  /* L'onglet actif se déduit de l'URL : au rechargement d'une page interne,
     le halo se trouve déjà au bon endroit. */
  const actif =
    items.find((item) => item.url !== "/" && pathname.startsWith(item.url))?.name ??
    items.find((item) => item.url === pathname)?.name;

  return (
    <div
      className={cn(
        floating &&
          "fixed bottom-0 left-1/2 z-50 mb-6 -translate-x-1/2 sm:top-0 sm:bottom-auto sm:mb-0 sm:pt-6",
        className,
      )}
    >
      <nav
        aria-label="Navigation principale"
        className={cn(
          "flex items-center gap-1 rounded-full border px-1 py-1",
          surPapier
            ? "border-line bg-stone-50"
            : "border-gold/25 bg-white/15",
          floating && "shadow-lg",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const estActif = actif === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              aria-current={estActif ? "page" : undefined}
              className={cn(
                "relative cursor-pointer rounded-full px-4 py-2 text-[15px] transition-colors lg:px-6",
                surPapier
                  ? estActif
                    ? "text-navy"
                    : "text-slate-mid hover:text-navy"
                  : estActif
                    ? "text-gold"
                    : "text-white/80 hover:text-gold",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} aria-hidden />
                <span className="sr-only">{item.name}</span>
              </span>

              {estActif && (
                <motion.span
                  layoutId="nova-lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-gold/10"
                  initial={false}
                  transition={
                    reduireMouvement
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 30 }
                  }
                >
                  {/* Le tube lumineux et ses trois halos décroissants. */}
                  <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-gold">
                    <span className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-gold/25 blur-md" />
                    <span className="absolute -top-1 h-6 w-8 rounded-full bg-gold/25 blur-md" />
                    <span className="absolute top-0 left-2 h-4 w-4 rounded-full bg-gold/25 blur-sm" />
                  </span>
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
