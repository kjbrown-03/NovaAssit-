import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ButtonPrimary, Eyebrow } from "@/components/ui";
import { lireParSlug } from "@/lib/articles/depot";
import { enParagraphes, minutesDeLecture } from "@/lib/articles/types";

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await lireParSlug(slug);

  if (!article) return { title: "Article introuvable", robots: { index: false } };

  return {
    title: article.titre,
    description: article.chapo,
    /* Un brouillon reste lisible par son adresse — c'est ainsi que
       l'administration se relit — mais il n'a rien à faire dans un index. */
    robots: article.statut === "publie" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: article.titre,
      description: article.chapo,
      publishedTime: article.publieLe,
      modifiedTime: article.modifieLe,
    },
  };
}

/**
 * Lecture d'un article.
 *
 * `lireParSlug` ne filtre pas sur le statut : c'est RLS qui décide. Un visiteur
 * ordinaire n'obtient rien d'un brouillon et tombe donc sur la page 404, tandis
 * que l'administration peut se relire avant de publier en ouvrant simplement
 * l'adresse.
 */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await lireParSlug(slug);

  if (!article) notFound();

  const paragraphes = enParagraphes(article.corps);

  return (
    <article className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>Accueil · Blog</Eyebrow>

      <h1 className="max-w-[24ch] text-[32px] leading-[1.1] text-navy lg:text-[48px]">
        {article.titre}
      </h1>

      <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
        {article.secteur ? `${article.secteur} · ` : ""}
        {article.publieLe ? dateLongue(article.publieLe) : "Brouillon"}
        {" · "}
        {minutesDeLecture(article.corps)} min de lecture
      </p>

      {article.statut !== "publie" && (
        <p className="max-w-[62ch] border border-gold bg-gold-soft px-4 py-3 text-[14px] leading-[1.55] text-slate-deep">
          Cet article n&apos;est pas publié. Vous le voyez parce que votre compte est
          administrateur — un visiteur obtiendrait une page introuvable.
        </p>
      )}

      <p className="max-w-[62ch] text-[18px] leading-[1.6] text-slate-deep lg:text-[20px]">
        {article.chapo}
      </p>

      <span aria-hidden className="mt-2 h-px w-16 bg-gold" />

      {/* Mesure resserrée : au-delà d'environ 70 caractères, l'œil perd sa
          ligne en revenant à la marge. */}
      <div className="mt-2 flex max-w-[68ch] flex-col gap-5">
        {paragraphes.map((paragraphe, i) => (
          <p key={i} className="text-[16px] leading-[1.75] text-ink-700 lg:text-[17px]">
            {paragraphe}
          </p>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <ButtonPrimary href="/devis">Demander un devis</ButtonPrimary>
        <Link
          href="/blog"
          className="flex items-center gap-2 text-[15px] text-slate-deep transition-colors hover:text-gold-ink"
        >
          <ArrowLeft aria-hidden size={16} /> Tous les articles
        </Link>
      </div>
    </article>
  );
}
