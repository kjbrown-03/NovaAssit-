import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonPrimary, Eyebrow } from "@/components/ui";

import { listerPubliesEnCache } from "@/lib/articles/depot";
import { minutesDeLecture } from "@/lib/articles/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  return { title: t("metaTitre"), description: t("metaDescription") };
}

/* La date suit la langue affichée. `en-GB` plutôt que `en` : « 5 September »
   se lit comme la forme française, là où le format américain inverse le jour
   et le mois — source d'erreur pour un lecteur camerounais. */
const dateCourte = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * Liste des articles publiés.
 *
 * Les articles vivent en base et se rédigent dans le back-office
 * (`/admin/articles`) : cette page ne connaît plus aucun titre à l'avance.
 * Tant qu'aucun article n'est publié, elle le dit franchement plutôt que
 * d'afficher des titres qui n'existent pas.
 */
export default async function Blog() {
  const t = await getTranslations("blog");
  const tc = await getTranslations("commun");
  const locale = await getLocale();

  /* Lecture en cache : mille visiteurs simultanés ne font qu'une requête. */
  const articles = await listerPubliesEnCache();

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>{t("filAriane")}</Eyebrow>
      <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
        {t("titre")}
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
        {t("intro")}
      </p>

      {articles.length === 0 ? (
        <div className="mt-6 border-t border-line py-10">
          <p className="max-w-[52ch] text-[16px] leading-[1.65] text-slate-mid">
            {t("vide")}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col">
          {articles.map((article, i, tab) => (
            <li
              key={article.id}
              className={`border-t border-line ${i === tab.length - 1 ? "border-b" : ""}`}
            >
              <Link
                href={`/blog/${article.slug}`}
                className="group flex flex-col gap-2 py-6 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="flex flex-col gap-[6px]">
                  <span className="text-[20px] text-navy transition-colors group-hover:text-gold-ink">
                    {article.titre}
                  </span>
                  <span className="max-w-[62ch] text-[15px] leading-[1.55] text-slate-mid">
                    {article.chapo}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
                  {article.secteur ? `${article.secteur} · ` : ""}
                  {article.publieLe ? dateCourte(article.publieLe, locale) : ""}
                  {" · "}
                  {minutesDeLecture(article.corps)} {t("min")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <ButtonPrimary href="/devis">{tc("demanderDevis")}</ButtonPrimary>
      </div>
    </section>
  );
}
