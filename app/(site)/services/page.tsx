import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ButtonPrimary, Eyebrow, PhotoSlot } from "@/components/ui";
import { SERVICES } from "@/lib/content";
import { EXEMPLES } from "@/lib/exemples-photos";
import { revealDelay } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageServices");
  return { title: t("metaTitre"), description: t("metaDescription") };
}

type Etape = { titre: string; texte: string };

export default function Services() {
  const t = useTranslations("pageServices");
  const ts = useTranslations("services");

  const etapes = t.raw("etapes") as Etape[];

  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 pt-10 pb-8 lg:grid-cols-[1fr_0.8fr] lg:gap-14 lg:px-14 lg:pt-[66px] lg:pb-[46px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>{t("filAriane")}</Eyebrow>
          <h1 className="text-[34px] leading-[1.08] text-navy lg:text-[54px]">{t("titre")}</h1>
          <p className="max-w-[50ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
            {t("intro")}
          </p>
        </div>
        <PhotoSlot
          ratio={t("photoRatio")}
          legende={t("photoLegende")}
          exemple={EXEMPLES.equipeAuTravail.src}
          exempleAlt={EXEMPLES.equipeAuTravail.alt}
          className="h-[220px] lg:h-[300px]"
        />
      </section>

      {/* ------------------------------------------------------------ six lignes */}
      <section className="mx-auto max-w-[1180px] px-5 pb-12 lg:px-14 lg:pb-[60px]">
        <h2 className="sr-only">{t("detailTitre")}</h2>
        <ul className="flex flex-col">
          {SERVICES.map((service, i) => (
            <li
              key={service.numero}
              data-reveal
              style={revealDelay(i * 40)}
              className={`group grid items-baseline gap-3 border-t border-line py-6 transition-colors duration-300 lg:grid-cols-[56px_1.1fr_1.5fr_150px] lg:gap-[26px] lg:px-4 lg:py-7 lg:hover:bg-stone-50 ${
                i === SERVICES.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="font-mono text-[12px] text-gold">{service.numero}</span>
              <h3 className="text-[22px] text-navy transition-colors duration-300 group-hover:text-gold-ink lg:text-[26px]">
                {ts(`${service.numero}.titre`)}
              </h3>
              <p className="text-[15px] leading-[1.6] text-slate-mid lg:text-[16px]">
                {ts(`${service.numero}.detail`)}
              </p>
              <span className="font-mono text-[11px] tracking-[0.12em] text-gold-ink uppercase">
                {ts(`${service.numero}.formules`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------- déroulé */}
      <section data-reveal className="bg-stone-50 px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8 text-[28px] text-navy lg:mb-9 lg:text-[34px]">
            {t("derouleTitre")}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[26px]">
            {etapes.map((etape, i) => (
              <li key={etape.titre} className="flex flex-col gap-[10px]">
                <span aria-hidden className="font-serif text-[40px] text-gold">
                  {i + 1}
                </span>
                <h3 className="text-[17px] font-semibold text-navy lg:text-[18px]">
                  {/* Le numéro est décoratif : un lecteur d'écran a besoin de
                      l'entendre nommé pour comprendre l'ordre. */}
                  <span className="sr-only">
                    {t("etape")} {i + 1} —{" "}
                  </span>
                  {etape.titre}
                </h3>
                <p className="text-[15px] leading-[1.6] text-slate-mid">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section data-reveal className="px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <h2 className="text-[28px] text-navy lg:text-[36px]">{t("ctaTitre")}</h2>
          <ButtonPrimary href="/devis" className="shrink-0">
            {t("ctaBouton")}
          </ButtonPrimary>
        </div>
      </section>
    </>
  );
}
