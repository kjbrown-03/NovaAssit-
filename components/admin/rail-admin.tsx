"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Wordmark } from "@/components/wordmark";

/**
 * La latérale du back-office.
 *
 * Au bureau : le rail d'origine, replié sur ses icônes, déployé au survol.
 *
 * Sur téléphone : rien n'occupe l'écran en dehors d'une barre fine portant le
 * bouton de menu. Les onglets sortent en panneau par la gauche quand on y
 * appuie, et se referment dès qu'une section est choisie. Le contenu garde
 * donc toute la largeur, ce qui compte sur 390 px.
 */
export function RailAdmin({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  /* Changer de section referme le panneau : il recouvre le contenu, le laisser
     ouvert masquerait la page qu'on vient d'ouvrir. */
  useEffect(() => setOuvert(false), [pathname]);

  /* Échap referme, comme tout panneau superposé. */
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  return (
    <>
      {/* ------------------------------------------------- barre du téléphone */}
      <header className="sticky top-0 z-30 flex h-[54px] shrink-0 items-center gap-3 bg-navy px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-expanded={ouvert}
          aria-controls="menu-admin"
          className="na-presse -ml-2 rounded-lg p-2 text-gold transition-colors hover:bg-white/10"
        >
          <Menu size={22} aria-hidden />
          <span className="sr-only">Ouvrir le menu</span>
        </button>
        <Wordmark size={18} />
      </header>

      {/* Appuyer à côté referme — le geste attendu d'un panneau superposé. */}
      {ouvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-40 bg-navy/60 md:hidden"
        />
      )}

      {/* ------------------------------------------------------------ panneau */}
      <aside
        id="menu-admin"
        data-ouvert={ouvert ? "true" : undefined}
        aria-hidden={!ouvert || undefined}
        className={
          /* Téléphone : rangé hors de l'écran, il entre par la gauche.
             À partir de `md` il reprend sa place de rail, toujours visible. */
          "group/rail fixed inset-y-0 left-0 z-50 flex w-[264px] max-w-[82vw] flex-col gap-6 " +
          "overflow-x-hidden overflow-y-auto bg-navy py-[26px] " +
          "-translate-x-full transition-[width,transform] duration-200 ease-out " +
          "data-[ouvert=true]:translate-x-0 " +
          "md:sticky md:top-0 md:z-30 md:h-svh md:w-[76px] md:max-w-none md:shrink-0 " +
          "md:translate-x-0 md:hover:w-[252px] md:focus-within:w-[252px] lg:gap-8"
        }
      >
        <div className="flex h-[30px] shrink-0 items-center justify-between gap-2 px-5">
          {/* Replié au bureau, seule l'initiale tient dans la largeur du rail. */}
          <span
            aria-hidden
            className="hidden shrink-0 font-serif text-[21px] text-gold md:block md:group-hover/rail:hidden md:group-focus-within/rail:hidden"
          >
            N
          </span>
          <span className="shrink-0 md:hidden md:group-hover/rail:block md:group-focus-within/rail:block">
            <Wordmark size={19} />
          </span>

          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="na-presse -mr-2 rounded-lg p-2 text-gold transition-colors hover:bg-white/10 md:hidden"
          >
            <X size={20} aria-hidden />
            <span className="sr-only">Fermer le menu</span>
          </button>
        </div>

        {children}
      </aside>
    </>
  );
}
