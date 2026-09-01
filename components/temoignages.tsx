"use client";

import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import {
  CardTransformed,
  CardsContainer,
  ContainerScroll,
} from "@/components/ui/animated-cards-stack";

/** Ce qu'une carte a besoin de savoir, d'où que vienne le témoignage. */
export type CarteTemoignage = {
  cle: string;
  format: "texte" | "video";
  citation: string;
  auteur: string;
  fonction: string;
  legendeVideo?: string;
  videoUrl?: string;
};

/* Emplacements de réserve, affichés tant qu'aucun témoignage n'est publié.
   Le cahier des charges (§5.1) demande que la section tienne debout sans
   contenu réel au lancement. */
const RESERVE = [
  { cle: "cliniqueDouala", format: "video" },
  { cle: "commerceYaounde", format: "texte" },
  { cle: "ecoleDouala", format: "video" },
  { cle: "quatrieme", format: "texte" },
] as const;

/* Décalage de l'habillage par rapport aux valeurs par défaut de la pile : le
   contenu est aligné à gauche et réparti sur la hauteur, pas centré. */
const HABILLAGE = "items-stretch justify-between gap-5 text-left";

/**
 * Témoignages clients en pile animée : les cartes se redressent une à une au
 * défilement, la précédente s'échappant par le haut.
 *
 * Les témoignages publiés sont fournis par `<TemoignagesAccueil>`, qui les lit
 * côté serveur après validation par l'administration. Sans aucun témoignage
 * publié, la section retombe sur ses emplacements de réserve.
 *
 * Quand le système demande à réduire les animations, la pile laisse la place à
 * une grille statique — l'effet repose entièrement sur le défilement, il n'a
 * pas d'équivalent au ralenti.
 */
export function Temoignages({ temoignages }: { temoignages?: CarteTemoignage[] }) {
  const reduireMouvement = useReducedMotion();
  const t = useTranslations("temoignages");

  const cartes: CarteTemoignage[] =
    temoignages && temoignages.length > 0
      ? temoignages
      : RESERVE.map((reserve) => ({
          cle: reserve.cle,
          format: reserve.format,
          citation: t(`${reserve.cle}.citation`),
          auteur: t(`${reserve.cle}.auteur`),
          fonction: t(`${reserve.cle}.fonction`),
          legendeVideo:
            reserve.format === "video" ? t(`${reserve.cle}.legendeVideo`) : undefined,
        }));

  return (
    <section className="bg-navy py-14 lg:pt-[74px] lg:pb-[66px]">
      <div data-reveal className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 lg:gap-3 lg:px-14">
        <span className="na-eyebrow text-gold">{t("eyebrow")}</span>
        <h2 className="text-[28px] text-white lg:text-[40px]">{t("titre")}</h2>
      </div>

      {reduireMouvement ? (
        <div className="mx-auto mt-8 grid max-w-[1180px] gap-5 px-5 lg:grid-cols-2 lg:px-14">
          {cartes.map((carte) => (
            <article
              key={carte.cle}
              aria-labelledby={`temoignage-${carte.cle}-auteur`}
              className="flex flex-col justify-between gap-5 rounded-2xl border border-gold/30 bg-navy-700/80 p-6 text-left"
            >
              <Contenu carte={carte} />
            </article>
          ))}
        </div>
      ) : (
        <ContainerScroll className="h-[260vh] lg:h-[300vh]">
          <div className="sticky top-0 flex h-svh w-full items-center py-12">
            <CardsContainer className="mx-auto h-[400px] w-[min(340px,calc(100vw-40px))] lg:h-[380px] lg:w-[480px]">
              {cartes.map((carte, index) => (
                <CardTransformed
                  key={carte.cle}
                  variant="dark"
                  arrayLength={cartes.length}
                  index={index + 2}
                  className={HABILLAGE}
                  role="article"
                  aria-labelledby={`temoignage-${carte.cle}-auteur`}
                >
                  <Contenu carte={carte} />
                </CardTransformed>
              ))}
            </CardsContainer>
          </div>
        </ContainerScroll>
      )}
    </section>
  );
}

/** Corps d'une carte, partagé par la pile animée et la grille statique. */
function Contenu({ carte }: { carte: CarteTemoignage }) {
  const t = useTranslations("temoignages");

  return (
    <>
      <div className="flex flex-col gap-4">
        {carte.format === "video" ? (
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold pl-[3px] text-[14px] text-navy"
            >
              ▶
            </span>
            {carte.videoUrl ? (
              <a
                href={carte.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-[0.14em] text-gold uppercase underline-offset-4 hover:underline"
              >
                {t("voirVideo")}
              </a>
            ) : (
              <span className="font-mono text-[10px] tracking-[0.14em] text-gold/85 uppercase">
                {t("videoBadge")}
              </span>
            )}
          </span>
        ) : (
          <span aria-hidden className="font-serif text-[44px] leading-[0.6] text-gold">
            &ldquo;
          </span>
        )}

        <blockquote className="font-serif text-[18px] leading-[1.5] text-white italic lg:text-[21px]">
          {carte.citation}
        </blockquote>

        {carte.legendeVideo && (
          <span className="text-[13px] text-white/50">{carte.legendeVideo}</span>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 pt-4">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-navy font-mono text-[8px] text-gold/80"
        >
          1:1
        </span>
        <span className="flex flex-col">
          <span id={`temoignage-${carte.cle}-auteur`} className="text-[15px] text-white">
            {carte.auteur}
          </span>
          <span className="text-[13px] text-white/55 lg:text-[14px]">{carte.fonction}</span>
        </span>
      </div>
    </>
  );
}
