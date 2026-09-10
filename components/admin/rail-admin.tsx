"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Wordmark } from "@/components/wordmark";

/**
 * Le rail du back-office, sur tous les formats.
 *
 * Sur écran large il se replie sur ses icônes et s'ouvre au survol — c'est le
 * comportement d'origine, inchangé. Sur téléphone, il empilait auparavant le
 * logotype, une barre d'onglets à faire défiler du doigt, la fiche du compte
 * et la déconnexion : près de quatre cents pixels de hauteur avant la moindre
 * ligne de contenu, et des onglets coupés au bord de l'écran.
 *
 * Il garde donc la même géométrie qu'au bureau : une colonne étroite d'icônes.
 * Faute de survol, l'ouverture passe par un bouton, et le panneau déployé
 * RECOUVRE le contenu au lieu de le pousser — sur 390 px de large, le pousser
 * ne laisserait pas de place lisible.
 */
export function RailAdmin({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  /* Changer de section referme le rail : déployé il masque la page, et rester
     ouvert sur celle qu'on vient d'ouvrir n'aurait aucun sens. */
  useEffect(() => setOuvert(false), [pathname]);

  return (
    <>
      {/* Appuyer à côté referme — le geste attendu de tout panneau mobile. */}
      {ouvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-30 bg-navy/60 md:hidden"
        />
      )}

      <aside
        data-ouvert={ouvert ? "true" : undefined}
        className={
          /* Fixé sur téléphone : hors du flux, il peut s'élargir par-dessus le
             contenu. Redevient collant et dans le flux à partir de `md`. */
          "group/rail fixed inset-y-0 left-0 z-40 flex w-[62px] flex-col gap-6 " +
          "overflow-x-hidden overflow-y-auto bg-navy py-[26px] " +
          "transition-[width] duration-200 ease-linear data-[ouvert=true]:w-[252px] " +
          "md:sticky md:top-0 md:h-svh md:w-[76px] md:shrink-0 " +
          "md:hover:w-[252px] md:focus-within:w-[252px] lg:gap-8"
        }
      >
        <div className="flex h-[30px] shrink-0 items-center gap-2 px-[14px] md:px-5">
          {/* Téléphone seulement : sans survol, il faut un geste explicite. */}
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="na-presse -ml-1 shrink-0 rounded-lg p-[6px] text-gold transition-colors hover:bg-white/10 md:hidden"
          >
            {ouvert ? <X size={19} aria-hidden /> : <Menu size={19} aria-hidden />}
          </button>

          {/* Replié, seule l'initiale tient dans la largeur du rail. */}
          <span
            aria-hidden
            className="hidden shrink-0 font-serif text-[21px] text-gold md:block md:group-hover/rail:hidden md:group-focus-within/rail:hidden"
          >
            N
          </span>
          <span className="hidden shrink-0 group-data-[ouvert=true]/rail:block md:group-hover/rail:block md:group-focus-within/rail:block">
            <Wordmark size={19} />
          </span>
        </div>

        {children}
      </aside>
    </>
  );
}
