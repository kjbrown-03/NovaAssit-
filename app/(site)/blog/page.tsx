import type { Metadata } from "next";
import Link from "next/link";
import { ButtonPrimary, Eyebrow } from "@/components/ui";

import { listerPublies } from "@/lib/articles/depot";
import { minutesDeLecture } from "@/lib/articles/types";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Cas d'usage par secteur : assistance PME, cabinet médical, commerce. Les ressources Nova Assist, secteur par secteur.",
};

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Liste des articles publiés.
 *
 * Les articles vivent en base et se rédigent dans le back-office
 * (`/admin/articles`) : cette page ne connaît plus aucun titre à l'avance.
 * Tant qu'aucun article n'est publié, elle le dit franchement plutôt que
 * d'afficher des titres qui n'existent pas.
 */
export default async function Blog() {
  const articles = await listerPublies();

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>Accueil · Blog</Eyebrow>
      <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
        Ressources par secteur
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
        Des cas d&apos;usage secteur par secteur, à partir de situations réelles : ce qu&apos;une
        assistante prend en charge, et ce que ça change au quotidien.
      </p>

      {articles.length === 0 ? (
        <div className="mt-6 border-t border-line py-10">
          <p className="max-w-[52ch] text-[16px] leading-[1.65] text-slate-mid">
            Les premiers articles sont en cours de rédaction. En attendant, la page des offres
            détaille ce que couvre chaque formule — et une demande de devis reçoit une réponse
            sous 24 h ouvrées.
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
                  {article.publieLe ? dateCourte(article.publieLe) : ""}
                  {" · "}
                  {minutesDeLecture(article.corps)} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <ButtonPrimary href="/devis">Demander un devis</ButtonPrimary>
      </div>
    </section>
  );
}
