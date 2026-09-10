import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
  Star,
  Video,
} from "lucide-react";

import {
  depublierTemoignage,
  refuserTemoignage,
  validerTemoignage,
} from "@/lib/temoignages/actions";
import {
  compterValides,
  etatDepot,
  listerNotifications,
  listerParStatut,
  listerPourAccueil,
} from "@/lib/temoignages/depot";
import { MAX_ACCUEIL, type Temoignage } from "@/lib/temoignages/types";

export const metadata: Metadata = {
  title: "Modération des témoignages",
  robots: { index: false, follow: false },
};

/* Le rendu dépend de fichiers écrits à l'exécution : jamais de mise en cache. */
export const dynamic = "force-dynamic";

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function ModerationTemoignages() {
  const panne = await etatDepot();

  if (panne) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Modération des témoignages</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Lecture impossible : <code className="font-mono text-[14px] text-gold-ink">{panne}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Jouez <code className="font-mono">supabase/007-temoignages.sql</code> dans Supabase →
          SQL Editor.
        </p>
      </section>
    );
  }

  const [enAttente, refuses, aLAccueil, valides, notifications] = await Promise.all([
    listerParStatut("attente"),
    listerParStatut("refuse"),
    listerPourAccueil(),
    compterValides(),
    listerNotifications(),
  ]);

  const nonLues = notifications.filter((n) => !n.lueLe);
  const enTrop = Math.max(0, valides - MAX_ACCUEIL);

  const compteurs = [
    { libelle: "En attente", valeur: enAttente.length, Icone: Clock, ton: "attente" },
    { libelle: `À l'accueil · max ${MAX_ACCUEIL}`, valeur: aLAccueil.length, Icone: Star, ton: "succes" },
    { libelle: "En file d'attente", valeur: enTrop, Icone: Inbox, ton: "cours" },
    { libelle: "Notifications", valeur: nonLues.length, Icone: AlertTriangle, ton: "neutre" },
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[28px] text-navy lg:text-[34px]">Modération des témoignages</h1>
      </div>

        {/* ---------------------------------------------------------- compteurs */}
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {compteurs.map(({ libelle, valeur, Icone, ton }, i) => (
            <div
              key={libelle}
              style={{ "--na-delai": `${i * 70}ms` } as React.CSSProperties}
              className="na-carte na-carte-actif na-monte flex flex-col gap-3 rounded-3xl p-5 shadow-sm"
            >
              <span className={`na-statut na-statut-${ton} self-start`}>
                <Icone className="h-[14px] w-[14px]" aria-hidden />
                {libelle}
              </span>
              <dd className="font-serif text-[34px] leading-none text-navy">{valeur}</dd>
              <dt className="sr-only">{libelle}</dt>
            </div>
          ))}
        </dl>

        {enTrop > 0 && (
          <p className="text-[14px] text-slate-mid italic">
            {enTrop} témoignage{enTrop > 1 ? "s" : ""} validé{enTrop > 1 ? "s" : ""} au-delà des{" "}
            {MAX_ACCUEIL} places. Dépubliez-en un pour lui laisser la place.
          </p>
        )}

        {/* ------------------------------------------------------------- à valider */}
        <Bloc titre="À valider" vide="Rien en attente." elements={enAttente}>
          {(temoignage) => (
            <>
              <form action={validerTemoignage}>
                <input type="hidden" name="id" value={temoignage.id} />
                <button
                  type="submit"
                  className="na-presse rounded-full bg-navy px-5 py-[10px] text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Publier à l&apos;accueil
                </button>
              </form>
              <form action={refuserTemoignage} className="flex flex-1 flex-wrap gap-2">
                <input type="hidden" name="id" value={temoignage.id} />
                <input
                  name="motif"
                  placeholder="Motif du refus (facultatif)"
                  className="min-w-[180px] flex-1 rounded-full border border-line bg-paper px-4 py-[9px] text-[14px] outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="na-presse rounded-full border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-[#8f1b30] hover:text-[#8f1b30]"
                >
                  Refuser
                </button>
              </form>
            </>
          )}
        </Bloc>

        {/* -------------------------------------------------------- à l'accueil */}
        <Bloc
          titre="Publiés à l'accueil"
          vide="Aucun témoignage publié — l'accueil affiche les emplacements de réserve."
          elements={aLAccueil}
          rangs
        >
          {(temoignage) => (
            <form action={depublierTemoignage}>
              <input type="hidden" name="id" value={temoignage.id} />
              <button
                type="submit"
                className="na-presse rounded-full border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
              >
                Dépublier
              </button>
            </form>
          )}
        </Bloc>

        {/* ------------------------------------------------------------- refusés */}
        {refuses.length > 0 && (
          <Bloc titre="Refusés" vide="" elements={refuses}>
            {(temoignage) => (
              <form action={validerTemoignage}>
                <input type="hidden" name="id" value={temoignage.id} />
                <button
                  type="submit"
                  className="na-presse rounded-full border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                >
                  Revenir dessus
                </button>
              </form>
            )}
          </Bloc>
        )}

        {/* -------------------------------------------------------- notifications */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[20px] text-navy">Notifications</h2>
          <div className="na-carte rounded-3xl p-5 shadow-sm">
            {notifications.length === 0 ? (
              <p className="text-[15px] text-gray-mid">Aucune notification.</p>
            ) : (
              <ul className="flex flex-col">
                {notifications.slice(0, 10).map((notification, i) => (
                  <li
                    key={notification.id}
                    className={`flex flex-wrap items-baseline justify-between gap-3 py-[10px] text-[14px] ${
                      i > 0 ? "border-t border-line-soft" : ""
                    }`}
                  >
                    <span className={notification.lueLe ? "text-gray-mid" : "text-navy"}>
                      {notification.message}
                    </span>
                    <span className="font-mono text-[12px] text-muted">
                      {dateCourte(notification.creeLe)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-[13px] text-muted italic">
            L&apos;envoi d&apos;un email à chaque dépôt reste à brancher — voir le commentaire dans{" "}
            <code className="font-mono">lib/temoignages/actions.ts</code>.
          </p>
        </section>
    </>
  );
}

/** Une section de la file, avec son titre, son vide et ses cartes. */
function Bloc({
  titre,
  vide,
  elements,
  rangs = false,
  children,
}: {
  titre: string;
  vide: string;
  elements: Temoignage[];
  rangs?: boolean;
  children: (temoignage: Temoignage) => React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[20px] text-navy">{titre}</h2>
      {elements.length === 0 ? (
        <p className="na-carte rounded-3xl px-5 py-6 text-[15px] text-gray-mid shadow-sm">{vide}</p>
      ) : (
        elements.map((temoignage, i) => (
          <Carte key={temoignage.id} temoignage={temoignage} rang={rangs ? i + 1 : undefined}>
            {children(temoignage)}
          </Carte>
        ))
      )}
    </section>
  );
}

function Carte({
  temoignage,
  rang,
  children,
}: {
  temoignage: Temoignage;
  rang?: number;
  children: React.ReactNode;
}) {
  const estVideo = temoignage.format === "video";

  return (
    <article className="na-carte na-carte-actif na-monte flex flex-col gap-4 rounded-3xl p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`na-statut ${estVideo ? "na-statut-cours" : "na-statut-neutre"}`}>
            {estVideo ? (
              <Video className="h-[14px] w-[14px]" aria-hidden />
            ) : (
              <CheckCircle className="h-[14px] w-[14px]" aria-hidden />
            )}
            {estVideo ? "Vidéo" : "Écrit"}
          </span>
          {rang && (
            <span className="na-statut na-statut-succes">
              <Star className="h-[14px] w-[14px]" aria-hidden />
              Place {rang}
            </span>
          )}
          <span className="font-mono text-[12px] text-muted">
            {dateCourte(temoignage.soumisLe)}
          </span>
        </div>
        {temoignage.motifRefus && (
          <span className="na-statut na-statut-alerte">
            <AlertTriangle className="h-[14px] w-[14px]" aria-hidden />
            {temoignage.motifRefus}
          </span>
        )}
      </div>

      <blockquote className="font-serif text-[18px] leading-[1.5] text-navy italic">
        {temoignage.citation}
      </blockquote>

      {temoignage.videoUrl && (
        <a
          href={temoignage.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[14px] break-all text-gold-ink hover:underline"
        >
          {temoignage.videoUrl}
        </a>
      )}

      <p className="text-[14px] text-slate-mid">
        <b className="font-semibold text-navy">{temoignage.auteur}</b> — {temoignage.fonction},{" "}
        {temoignage.entreprise} · {temoignage.ville}
        <br />
        <span className="font-mono text-[12px] text-muted">
          compte {temoignage.auteurCompte.slice(0, 8)}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
        {children}
      </div>
    </article>
  );
}
