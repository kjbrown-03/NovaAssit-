import { Wordmark } from "@/components/wordmark";
import { CONTACT } from "@/lib/content";

/**
 * Le tunnel de devis a son propre bandeau : pas de navigation, pour ne pas
 * détourner du parcours en cours. Seul le numéro d'assistance reste visible.
 */
export default function DevisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-navy">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-[18px] lg:px-14 lg:py-6">
          <Wordmark size={18} className="lg:hidden" />
          <Wordmark size={24} className="hidden lg:flex" />
          <p className="text-[14px] text-white/70 lg:text-[15px]">
            <span className="hidden sm:inline">Besoin d&apos;aide ? </span>
            <a href={`tel:${CONTACT.telephone.replace(/\s/g, "")}`} className="text-gold">
              {CONTACT.telephone}
            </a>
          </p>
        </div>
      </header>
      <main id="contenu">{children}</main>
    </>
  );
}
