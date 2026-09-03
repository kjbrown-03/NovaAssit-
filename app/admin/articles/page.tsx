import type { Metadata } from "next";
import Link from "next/link";
import { Archive, FileText, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";

import { EditeurArticle } from "@/components/admin/editeur-article";
import {
  archiverArticle,
  depublierArticle,
  publierArticle,
  supprimerArticle,
} from "@/lib/articles/actions";
import { etatDepot, lireParId, listerTous } from "@/lib/articles/depot";
import { LIBELLES_STATUT, minutesDeLecture, type Article } from "@/lib/articles/types";

export const metadata: Metadata = {
  title: "Articles du blog",
  robots: { index: false, follow: false },
};

/* Le back-office lit des données écrites à l'instant : jamais de cache. */
export const dynamic = "force-dynamic";

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const TONS: Record<Article["statut"], string> = {
  brouillon: "border-line-mid text-slate-mid",
  publie: "border-gold bg-gold-soft text-gold-ink",
  archive: "border-line text-muted",
};

export default async function AdminArticles({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const panne = await etatDepot();

  if (panne) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Articles du blog</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Lecture impossible : <code className="font-mono text-[14px] text-gold-ink">{panne}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Jouez <code className="font-mono">supabase/008-articles.sql</code> dans Supabase → SQL
          Editor.
        </p>
      </section>
    );
  }

  const { id } = await searchParams;
  const [articles, enEdition] = await Promise.all([
    listerTous(),
    id ? lireParId(id) : Promise.resolve(null),
  ]);

  const publies = articles.filter((a) => a.statut === "publie").length;
  const brouillons = articles.filter((a) => a.statut === "brouillon").length;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[26px] leading-[1.15] text-navy lg:text-[30px]">Articles du blog</h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          {publies === 0
            ? "Aucun article publié : la page /blog affiche pour l'instant un message d'attente."
            : `${publies} article${publies > 1 ? "s" : ""} en ligne, ${brouillons} brouillon${brouillons > 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* ------------------------------------------------------------ éditeur */}
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] text-navy">
            {enEdition ? `Modifier « ${enEdition.titre} »` : "Nouvel article"}
          </h2>
          {enEdition && (
            <Link
              href="/admin/articles"
              className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
            >
              <Plus aria-hidden size={15} /> Écrire un autre article
            </Link>
          )}
        </div>
        {/* `key` force un formulaire neuf quand on passe d'un article à l'autre :
            sans elle, React garderait l'état de la saisie précédente. */}
        <EditeurArticle key={enEdition?.id ?? "nouveau"} article={enEdition ?? undefined} />
      </section>

      {/* -------------------------------------------------------------- liste */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] text-navy">Tous les articles</h2>

        {articles.length === 0 ? (
          <div className="na-carte rounded-2xl border border-line-soft p-6 text-[15px] text-slate-mid">
            Rien d&apos;écrit pour l&apos;instant. Le premier article se rédige juste au-dessus.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {articles.map((article) => (
              <li
                key={article.id}
                className="na-carte flex flex-col gap-4 rounded-2xl border border-line-soft p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`border px-[9px] py-1 font-mono text-[10px] tracking-[0.12em] uppercase ${TONS[article.statut]}`}
                    >
                      {LIBELLES_STATUT[article.statut]}
                    </span>
                    {article.secteur && (
                      <span className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                        {article.secteur}
                      </span>
                    )}
                    <span className="text-[13px] text-muted">
                      {article.publieLe
                        ? `Publié le ${dateCourte(article.publieLe)}`
                        : `Créé le ${dateCourte(article.creeLe)}`}
                      {" · "}
                      {minutesDeLecture(article.corps)} min
                    </span>
                  </div>

                  <h3 className="text-[19px] leading-[1.2] text-navy">{article.titre}</h3>
                  <p className="max-w-[70ch] text-[14px] leading-[1.55] text-slate-mid">
                    {article.chapo}
                  </p>
                  <span className="font-mono text-[12px] break-all text-muted">
                    /blog/{article.slug}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                  <Link
                    href={`/admin/articles?id=${article.id}`}
                    className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                  >
                    <Pencil aria-hidden size={15} /> Modifier
                  </Link>

                  <Link
                    href={`/blog/${article.slug}`}
                    className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                  >
                    <FileText aria-hidden size={15} />
                    {article.statut === "publie" ? "Voir en ligne" : "Relire"}
                  </Link>

                  {article.statut !== "publie" ? (
                    <form action={publierArticle}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="na-presse flex items-center gap-2 bg-navy px-3 py-2 text-[14px] text-white transition-opacity hover:opacity-90"
                      >
                        <Send aria-hidden size={15} /> Publier
                      </button>
                    </form>
                  ) : (
                    <form action={depublierArticle}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="na-presse flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                      >
                        <Undo2 aria-hidden size={15} /> Retirer du site
                      </button>
                    </form>
                  )}

                  {article.statut !== "archive" && (
                    <form action={archiverArticle}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="na-presse flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                      >
                        <Archive aria-hidden size={15} /> Archiver
                      </button>
                    </form>
                  )}

                  {/* La suppression est définitive — d'où l'archivage juste à
                      côté, qui répond au même besoin sans rien perdre. */}
                  <form action={supprimerArticle} className="sm:ml-auto">
                    <input type="hidden" name="id" value={article.id} />
                    <button
                      type="submit"
                      className="na-presse flex items-center gap-2 border border-[#b0203a]/30 px-3 py-2 text-[14px] text-[#b0203a] transition-colors hover:bg-[#b0203a]/5"
                    >
                      <Trash2 aria-hidden size={15} /> Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
