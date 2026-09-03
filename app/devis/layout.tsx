import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { CONTACT } from "@/lib/content";

/**
 * Le tunnel de devis a son propre bandeau : pas de navigation, pour ne pas
 * détourner du parcours en cours. Seuls la sortie vers l'accueil et le numéro
 * d'assistance restent visibles.
 */
export default function DevisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-navy">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-[18px] lg:px-14 lg:py-6">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Marge négative : la cible de 44 px tient dans la hauteur du
                bandeau sans le faire grandir. */}
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              className="-my-2 flex min-h-[44px] items-center gap-2 text-[14px] text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft aria-hidden size={18} />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <Wordmark size={18} className="lg:hidden" />
            <Wordmark size={24} className="hidden lg:flex" />
          </div>
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
