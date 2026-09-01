import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

/**
 * Habillage sobre des pages de mot de passe : fond bleu nuit plein écran,
 * bloc centré. Volontairement sans le disque doré de `AuthSwitch` — ces pages
 * n'ont qu'un formulaire, il n'y a rien entre quoi basculer.
 */
export function CadreAuth({
  titre,
  intro,
  children,
}: {
  titre: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="contenu" className="flex min-h-svh items-center justify-center bg-navy px-6 py-16">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col gap-5">
          <Link
            href="/connexion"
            className="flex items-center gap-2 text-[14px] text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft aria-hidden size={16} /> Retour à la connexion
          </Link>
          <Wordmark size={19} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[30px] leading-tight text-white lg:text-[36px]">{titre}</h1>
          <p className="text-[15px] leading-[1.6] text-white/65">{intro}</p>
        </div>

        {children}
      </div>
    </main>
  );
}
