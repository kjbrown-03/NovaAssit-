import Link from "next/link";
import type { ReactNode } from "react";
import { ShinyButton } from "./ui/shiny-button";

/** Libellé monospace en capitales espacées, précédant les titres de section. */
export function Eyebrow({ children, tone = "gold-ink" }: { children: ReactNode; tone?: "gold-ink" | "gold" }) {
  return (
    <span className={`na-eyebrow ${tone === "gold" ? "text-gold" : "text-gold-ink"}`}>
      {children}
    </span>
  );
}

/**
 * Emplacement photo de la maquette : cadre sable, cercle doré, légende de
 * cadrage. Reste en place tant que les visuels définitifs ne sont pas fournis.
 */
export function PhotoSlot({
  ratio,
  legende,
  exemple,
  exempleAlt,
  className = "",
}: {
  ratio: string;
  legende?: string;
  /**
   * Photo de référence montrant le type de cliché attendu. Elle est volontairement
   * atténuée et estampillée « exemple » : c'est une consigne de prise de vue, pas
   * un visuel du site. Si l'image ne charge pas, le cadre légendé reste lisible.
   */
  exemple?: string;
  exempleAlt?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden border border-line bg-stone-100 p-10 ${className}`}
    >
      {exemple && (
        <>
          <img
            src={exemple}
            alt={exempleAlt ?? ""}
            loading="lazy"
            aria-hidden={exempleAlt ? undefined : true}
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          {/* Voile léger : il assied les libellés sans effacer la photo. Le
              noir et blanc suffit à signaler qu'on n'est pas devant un
              visuel définitif. */}
          <span aria-hidden className="absolute inset-0 bg-navy/25" />
        </>
      )}

      <span
        className={`absolute top-[14px] left-[14px] font-mono text-[10px] tracking-[0.14em] uppercase ${
          exemple ? "bg-paper/90 px-2 py-[3px] text-gold-ink" : "text-gold-ink"
        }`}
      >
        {ratio}
      </span>

      {exemple && (
        <span className="absolute top-[14px] right-[14px] bg-gold px-[8px] py-[3px] font-mono text-[9px] tracking-[0.16em] text-navy uppercase">
          Exemple
        </span>
      )}

      {/* Pastille du cadre vide : inutile — et gênante — dès qu'une photo
          d'exemple occupe l'emplacement. */}
      {!exemple && <span aria-hidden className="h-[42px] w-[42px] rounded-full border border-gold" />}
      {legende && (
        <span
          className={`relative max-w-[26ch] text-center text-[15px] leading-[1.55] ${
            exemple ? "bg-paper/90 px-3 py-2 text-slate-deep" : "text-slate-mid"
          }`}
        >
          {legende}
        </span>
      )}
    </div>
  );
}

/** Bouton plein bleu nuit — action principale. */
export function ButtonPrimary({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShinyButton href={href} className={className}>
      {children}
    </ShinyButton>
  );
}

/** Bouton contour bleu nuit — action secondaire. */
export function ButtonOutline({
  href,
  children,
  external = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <ShinyButton href={href} variant="outline" external={external} className={`!border-navy ${className}`}>
      {children}
    </ShinyButton>
  );
}

/** Lien souligné d'un filet doré — « Voir tous les services », « Tout voir »… */
export function GoldUnderlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="self-start border-b border-gold pb-[3px] text-[15px] text-navy hover:text-gold-ink"
    >
      {children}
    </Link>
  );
}

/** Bandeau d'appel à l'action en pied de page intérieure. */
export function CtaBanner({
  titre,
  sousTitre,
  actions,
  bordure = false,
}: {
  titre: string;
  sousTitre?: string;
  actions: ReactNode;
  bordure?: boolean;
}) {
  return (
    <section
      className={`px-5 py-14 lg:px-14 lg:py-[66px] ${bordure ? "border-b border-line-soft" : ""}`}
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col gap-[10px]">
          <h2 className="text-[28px] text-navy lg:text-[36px]">{titre}</h2>
          {sousTitre && <p className="text-[15px] text-slate-mid lg:text-[17px]">{sousTitre}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-[14px] sm:flex-row">{actions}</div>
      </div>
    </section>
  );
}
