import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import {
  depublierTemoignage,
  refuserTemoignage,
  validerTemoignage,
} from "@/lib/temoignages/actions";
import {
  compterValides,
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

export default async function ModerationTemoignages({
  searchParams,
}: {
  searchParams: Promise<{ cle?: string }>;
}) {
  /**
   * Garde-fou minimal en attendant une vraie authentification : si la variable
   * `NOVA_ADMIN_CLE` est définie, il faut la présenter dans l'URL. Sinon la page
   * est ouverte, et le bandeau ci-dessous le dit sans détour.
   *
   * ⚠️ Ce n'est pas de la sécurité : une clé en clair dans l'URL fuit par
   * l'historique et les journaux. À remplacer par la session admin dès que la
   * connexion sera branchée.
   */
  const cleAttendue = process.env.NOVA_ADMIN_CLE;
  const { cle } = await searchParams;

  if (cleAttendue && cle !== cleAttendue) {
    return (
      <main id="contenu" className="mx-auto max-w-[640px] px-5 py-20">
        <h1 className="mb-3 text-[28px] text-navy">Accès réservé</h1>
        <p className="text-[15px] text-slate-mid">
          Cette page demande la clé d&apos;administration. Ajoutez-la à l&apos;adresse :
          <code className="ml-1 font-mono text-[14px] text-gold-ink">?cle=…</code>
        </p>
      </main>
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

  return (
    <main id="contenu" className="mx-auto flex max-w-[900px] flex-col gap-8 px-5 py-10 lg:py-14">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Wordmark size={20} tone="on-paper" />
          <Link href="/" className="text-[14px] text-gold-ink hover:underline">
            Retour au site
          </Link>
        </div>
        <h1 className="text-[30px] text-navy lg:text-[38px]">Modération des témoignages</h1>
      </header>

      {!cleAttendue && (
        <p
          role="alert"
          className="border-l-[3px] border-[#b0203a] bg-stone-50 px-4 py-3 text-[14px] leading-[1.55] text-slate-deep"
        >
          <b>Cette page n&apos;est pas protégée.</b> N&apos;importe qui connaissant son adresse peut
          publier un témoignage sur la page d&apos;accueil. Définissez{" "}
          <code className="font-mono text-[13px] text-gold-ink">NOVA_ADMIN_CLE</code> dans{" "}
          <code className="font-mono text-[13px] text-gold-ink">.env.local</code> en attendant la
          vraie authentification.
        </p>
      )}

      {/* ------------------------------------------------------------ compteurs */}
      <dl className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {[
          { libelle: "En attente", valeur: enAttente.length },
          { libelle: `À l'accueil (max ${MAX_ACCUEIL})`, valeur: aLAccueil.length },
          { libelle: "En file d'attente", valeur: enTrop },
          { libelle: "Notifications", valeur: nonLues.length },
        ].map((carte) => (
          <div key={carte.libelle} className="flex flex-col gap-1 bg-paper px-5 py-4">
            <dd className="font-serif text-[30px] text-navy">{carte.valeur}</dd>
            <dt className="font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase">
              {carte.libelle}
            </dt>
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
      <section className="flex flex-col gap-4">
        <h2 className="text-[22px] text-navy">À valider</h2>
        {enAttente.length === 0 ? (
          <p className="border border-line px-5 py-6 text-[15px] text-gray-mid">
            Rien en attente.
          </p>
        ) : (
          enAttente.map((temoignage) => (
            <Carte key={temoignage.id} temoignage={temoignage}>
              <form action={validerTemoignage} className="contents">
                <input type="hidden" name="id" value={temoignage.id} />
                <button
                  type="submit"
                  className="bg-navy px-5 py-[10px] text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Publier à l&apos;accueil
                </button>
              </form>
              <form action={refuserTemoignage} className="flex flex-1 flex-wrap gap-2">
                <input type="hidden" name="id" value={temoignage.id} />
                <input
                  name="motif"
                  placeholder="Motif du refus (facultatif)"
                  className="min-w-[180px] flex-1 border border-line px-3 py-[9px] text-[14px] outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  className="border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-[#b0203a] hover:text-[#b0203a]"
                >
                  Refuser
                </button>
              </form>
            </Carte>
          ))
        )}
      </section>

      {/* -------------------------------------------------------- à l'accueil */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[22px] text-navy">Publiés à l&apos;accueil</h2>
        {aLAccueil.length === 0 ? (
          <p className="border border-line px-5 py-6 text-[15px] text-gray-mid">
            Aucun témoignage publié — l&apos;accueil affiche les emplacements de réserve.
          </p>
        ) : (
          aLAccueil.map((temoignage, rang) => (
            <Carte key={temoignage.id} temoignage={temoignage} rang={rang + 1}>
              <form action={depublierTemoignage}>
                <input type="hidden" name="id" value={temoignage.id} />
                <button
                  type="submit"
                  className="border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                >
                  Dépublier
                </button>
              </form>
            </Carte>
          ))
        )}
      </section>

      {/* ------------------------------------------------------------- refusés */}
      {refuses.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-[22px] text-navy">Refusés</h2>
          {refuses.map((temoignage) => (
            <Carte key={temoignage.id} temoignage={temoignage}>
              <form action={validerTemoignage}>
                <input type="hidden" name="id" value={temoignage.id} />
                <button
                  type="submit"
                  className="border border-line px-5 py-[9px] text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                >
                  Revenir dessus
                </button>
              </form>
            </Carte>
          ))}
        </section>
      )}

      {/* -------------------------------------------------------- notifications */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] text-navy">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-[15px] text-gray-mid">Aucune notification.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.slice(0, 10).map((notification) => (
              <li
                key={notification.id}
                className="flex flex-wrap justify-between gap-3 border-b border-line-soft py-2 text-[14px]"
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
        <p className="text-[13px] text-muted italic">
          L&apos;envoi d&apos;un email à chaque dépôt reste à brancher — voir le commentaire dans{" "}
          <code className="font-mono">lib/temoignages/actions.ts</code>.
        </p>
      </section>
    </main>
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
  return (
    <article className="flex flex-col gap-4 border border-line p-5 lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase">
          {rang ? `Place ${rang} · ` : ""}
          {temoignage.format === "video" ? "Vidéo" : "Écrit"} · {dateCourte(temoignage.soumisLe)}
        </span>
        {temoignage.motifRefus && (
          <span className="text-[13px] text-[#b0203a]">Refusé : {temoignage.motifRefus}</span>
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
        <span className="text-[13px] text-muted">{temoignage.auteurCompte}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">{children}</div>
    </article>
  );
}
