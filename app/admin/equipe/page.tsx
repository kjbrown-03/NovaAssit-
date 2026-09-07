import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";

import { FormulaireMembre } from "@/components/admin/formulaire-membre";
import { supprimerMembre } from "@/lib/admin-actions";
import { listerTousLesMembres, urlPortrait } from "@/lib/equipe";

export const metadata: Metadata = {
  title: "Équipe",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminEquipe({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const { membres, erreur } = await listerTousLesMembres();

  if (erreur) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Équipe</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Lecture impossible : <code className="font-mono text-[14px] text-gold-ink">{erreur}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Jouez <code className="font-mono">supabase/011-tarifs-equipe.sql</code> dans Supabase →
          SQL Editor.
        </p>
      </section>
    );
  }

  const enEdition = id ? membres.find((m) => m.id === id) : undefined;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[26px] leading-[1.15] text-navy lg:text-[30px]">Équipe</h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          {membres.length === 0
            ? "Aucun membre enregistré. La page « À propos » affiche pour l'instant les portraits d'exemple."
            : `${membres.length} membre${membres.length > 1 ? "s" : ""}, dont ${membres.filter((m) => m.visible).length} visible${membres.filter((m) => m.visible).length > 1 ? "s" : ""} sur le site.`}
        </p>
      </div>

      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] text-navy">
            {enEdition ? `Modifier « ${enEdition.nom} »` : "Nouveau membre"}
          </h2>
          {enEdition && (
            <Link
              href="/admin/equipe"
              className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
            >
              <Plus aria-hidden size={15} /> Ajouter quelqu&apos;un
            </Link>
          )}
        </div>
        {/* `key` force un formulaire neuf d'un membre à l'autre : sans elle,
            React garderait la saisie précédente. */}
        <FormulaireMembre key={enEdition?.id ?? "nouveau"} membre={enEdition} />
      </section>

      {membres.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[20px] text-navy">L&apos;équipe</h2>
          <ul className="flex flex-col gap-3">
            {membres.map((membre) => {
              const portrait = urlPortrait(membre.photo);
              return (
                <li
                  key={membre.id}
                  className="na-carte flex flex-wrap items-center gap-4 rounded-2xl border border-line-soft p-4 shadow-sm"
                >
                  <span
                    aria-hidden
                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-stone-100"
                  >
                    {portrait ? (
                      <Image
                        src={portrait}
                        alt=""
                        width={54}
                        height={54}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="font-mono text-[9px] text-muted">—</span>
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] text-navy">{membre.nom}</span>
                      {!membre.visible && (
                        <span className="flex items-center gap-1 border border-line px-2 py-[2px] font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                          <EyeOff aria-hidden size={11} /> Masqué
                        </span>
                      )}
                    </span>
                    <span className="text-[14px] text-slate-mid">{membre.role}</span>
                  </div>

                  <span className="font-mono text-[12px] text-muted">#{membre.position}</span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/equipe?id=${membre.id}`}
                      className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                    >
                      <Pencil aria-hidden size={15} /> Modifier
                    </Link>
                    {/* La photo part avec la fiche : la laisser encombrerait le
                        stockage de fichiers que plus rien ne référence. */}
                    <form action={supprimerMembre}>
                      <input type="hidden" name="id" value={membre.id} />
                      <button
                        type="submit"
                        className="na-presse flex items-center gap-2 border border-[#b0203a]/30 px-3 py-2 text-[14px] text-[#b0203a] transition-colors hover:bg-[#b0203a]/5"
                      >
                        <Trash2 aria-hidden size={15} /> Supprimer
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
