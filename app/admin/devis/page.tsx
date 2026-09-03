import type { Metadata } from "next";
import { CheckCircle, Clock, Inbox, Mail, RefreshCw, XCircle } from "lucide-react";

import { creerClientServeur } from "@/lib/supabase/server";
import { changerStatutDevis } from "@/lib/supabase/devis-actions";
import {
  LIBELLE_STATUT_DEVIS,
  STYLE_STATUT_DEVIS,
  type DemandeDevis,
  type StatutDevis,
} from "@/lib/supabase/devis";

export const metadata: Metadata = {
  title: "Demandes de devis",
};

const ICONE_STATUT: Record<StatutDevis, typeof Clock> = {
  nouveau: Clock,
  en_cours: RefreshCw,
  traitee: CheckCircle,
  perdue: XCircle,
};

/* Ce que l'on peut faire depuis chaque état — on ne propose jamais l'état
   courant, ni un retour en arrière qui n'aurait pas de sens. */
const SUITES: Record<StatutDevis, StatutDevis[]> = {
  nouveau: ["en_cours", "traitee", "perdue"],
  en_cours: ["traitee", "perdue"],
  traitee: ["en_cours"],
  perdue: ["en_cours"],
};

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function SuiviDevis() {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("demandes_devis")
    .select("*")
    .order("recue_le", { ascending: false })
    .limit(100);

  /* La table n'existe pas tant que la migration 004 n'a pas été jouée : on le
     dit clairement plutôt que d'afficher une liste vide trompeuse. */
  if (error) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Demandes de devis</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Le suivi n&apos;est pas encore disponible :{" "}
          <code className="font-mono text-[14px] text-gold-ink">{error.message}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Jouez <code className="font-mono">supabase/004-devis.sql</code> dans Supabase → SQL
          Editor.
        </p>
      </section>
    );
  }

  const demandes = (data ?? []) as DemandeDevis[];
  const parStatut = (s: StatutDevis) => demandes.filter((d) => d.statut === s).length;

  const compteurs = [
    { libelle: "Nouvelles", valeur: parStatut("nouveau"), ton: "attente", Icone: Clock },
    { libelle: "En cours", valeur: parStatut("en_cours"), ton: "cours", Icone: RefreshCw },
    { libelle: "Traitées", valeur: parStatut("traitee"), ton: "succes", Icone: CheckCircle },
    { libelle: "Total reçues", valeur: demandes.length, ton: "neutre", Icone: Inbox },
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[28px] text-navy lg:text-[34px]">Demandes de devis</h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {compteurs.map(({ libelle, valeur, ton, Icone }, i) => (
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

      {demandes.length === 0 ? (
        <p className="na-carte rounded-3xl px-6 py-10 text-center text-[15px] text-gray-mid shadow-sm">
          Aucune demande pour l&apos;instant. Celles reçues par le formulaire apparaîtront ici.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {demandes.map((demande, i) => {
            const Icone = ICONE_STATUT[demande.statut];
            return (
              <li
                key={demande.id}
                style={{ "--na-delai": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}
                className="na-carte na-carte-actif na-monte flex flex-col gap-4 rounded-3xl p-5 shadow-sm lg:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={STYLE_STATUT_DEVIS[demande.statut]}>
                      <Icone className="h-[14px] w-[14px]" aria-hidden />
                      {LIBELLE_STATUT_DEVIS[demande.statut]}
                    </span>
                    {demande.formule_suggeree && (
                      <span className="na-statut na-statut-neutre">
                        {demande.formule_suggeree}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[12px] text-muted">
                    {dateLongue(demande.recue_le)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[18px] text-navy">{demande.entreprise}</p>
                  <p className="text-[15px] text-slate-mid">
                    {demande.contact_nom}
                    {demande.secteur ? ` · ${demande.secteur}` : ""}
                    {demande.effectif ? ` · ${demande.effectif}` : ""}
                  </p>
                  <a
                    href={`mailto:${demande.email}`}
                    className="group flex w-fit items-center gap-1.5 text-[14px] text-gold-ink hover:underline"
                  >
                    <Mail className="h-[14px] w-[14px]" aria-hidden />
                    {demande.email}
                  </a>
                </div>

                <dl className="grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="na-eyebrow">Domaines délégués</dt>
                    <dd className="text-[14px] text-ink">
                      {demande.domaines.length > 0 ? demande.domaines.join(", ") : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="na-eyebrow">Canaux</dt>
                    <dd className="text-[14px] text-ink">
                      {demande.canaux.length > 0 ? demande.canaux.join(", ") : "—"}
                    </dd>
                  </div>
                  {demande.messages_par_jour && (
                    <div>
                      <dt className="na-eyebrow">Volume par jour</dt>
                      <dd className="text-[14px] text-ink">{demande.messages_par_jour}</dd>
                    </div>
                  )}
                  {demande.plage && (
                    <div>
                      <dt className="na-eyebrow">Plage horaire</dt>
                      <dd className="text-[14px] text-ink">{demande.plage}</dd>
                    </div>
                  )}
                </dl>

                {demande.precision_libre && (
                  <p className="border-l-[3px] border-gold/40 pl-4 text-[15px] leading-[1.55] text-slate-deep italic">
                    {demande.precision_libre}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                  {SUITES[demande.statut].map((suite) => (
                    <form key={suite} action={changerStatutDevis}>
                      <input type="hidden" name="id" value={demande.id} />
                      <input type="hidden" name="statut" value={suite} />
                      <button
                        type="submit"
                        className="na-presse rounded-full border border-line px-4 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink"
                      >
                        Marquer « {LIBELLE_STATUT_DEVIS[suite]} »
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
