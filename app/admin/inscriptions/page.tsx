import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, PhoneOff, UserPlus } from "lucide-react";

import { listerInscriptionsEnAttente } from "@/lib/supabase/inscriptions-attente";

export const metadata: Metadata = {
  title: "Inscriptions à confirmer",
};

/** Motifs renvoyés par la route de relais, traduits pour l'affichage. */
const MOTIFS: Record<string, string> = {
  identifiant: "Compte non reconnu.",
  introuvable: "Ce compte n'existe plus.",
  "deja-actif": "Ce compte vient d'être activé — il n'y a plus rien à relayer.",
  "sans-numero": "Aucun numéro WhatsApp enregistré pour ce compte.",
  lien: "Le lien d'activation n'a pas pu être produit. Réessayez dans un instant.",
};

const dateCourte = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

/** Depuis combien de jours ce compte attend. */
function joursDepuis(iso: string): number {
  if (!iso) return 0;
  const ecart = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ecart / 86_400_000));
}

export default async function InscriptionsAConfirmer({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur: motif } = await searchParams;
  const { comptes, erreur } = await listerInscriptionsEnAttente();

  if (erreur) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Inscriptions à confirmer</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Lecture impossible :{" "}
          <code className="font-mono text-[14px] text-gold-ink">{erreur}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Cette page lit les comptes avec la clé d&apos;administration. Vérifiez que{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> est bien renseignée dans
          les variables d&apos;environnement.
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[28px] text-navy lg:text-[34px]">Inscriptions à confirmer</h1>
      </div>

      {motif && (
        <p
          role="alert"
          className="na-carte rounded-3xl border-l-4 border-l-gold px-5 py-4 text-[15px] leading-[1.6] text-slate-mid shadow-sm"
        >
          {MOTIFS[motif] ?? "L'opération n'a pas abouti."}
        </p>
      )}

      <section className="na-carte na-monte rounded-3xl p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-2">
          <span className="na-statut na-statut-neutre self-start">
            <UserPlus className="h-[14px] w-[14px]" aria-hidden />
            Comment ça marche
          </span>
          <p className="text-[15px] leading-[1.6] text-slate-mid">
            Ces personnes ont créé un compte sans jamais ouvrir leur lien de confirmation — le
            plus souvent parce que l&apos;email est tombé dans leurs indésirables, où les liens
            sont désactivés. Le bouton vert ouvre WhatsApp sur leur conversation,{" "}
            <strong className="font-semibold text-navy">le message déjà rédigé</strong> : il
            reste à appuyer sur envoyer.
          </p>
          <p className="text-[14px] leading-[1.6] text-muted">
            Chaque clic produit un lien neuf, et le précédent cesse alors de fonctionner. Si
            quelqu&apos;un vous dit que son lien a expiré, renvoyez-le simplement d&apos;ici.
          </p>
        </div>
      </section>

      {comptes.length === 0 ? (
        <p className="na-carte rounded-3xl px-6 py-10 text-center text-[15px] text-gray-mid shadow-sm">
          Aucun compte en attente. Toutes les inscriptions ont été activées.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comptes.map((compte, i) => {
            const jours = joursDepuis(compte.creeLe);

            return (
              <li
                key={compte.id}
                style={{ "--na-delai": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}
                className="na-carte na-carte-actif na-monte flex flex-col gap-4 rounded-3xl p-5 shadow-sm lg:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-[18px] text-navy">{compte.entreprise}</p>
                    <p className="text-[15px] text-slate-mid">{compte.contactNom}</p>
                    <p className="flex items-center gap-1.5 text-[14px] break-all text-ink">
                      <Mail className="h-[14px] w-[14px] shrink-0 text-gold-ink" aria-hidden />
                      {compte.email}
                    </p>
                    <p className="text-[13px] text-muted">Inscrit le {dateCourte(compte.creeLe)}</p>
                  </div>

                  <span className="na-statut na-statut-attente shrink-0">
                    <Clock className="h-[14px] w-[14px]" aria-hidden />
                    {jours === 0 ? "aujourd’hui" : jours === 1 ? "1 jour" : `${jours} jours`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                  {compte.telephoneLisible ? (
                    <>
                      <p className="font-mono text-[15px] text-ink">{compte.telephoneLisible}</p>
                      <a
                        href={`/admin/inscriptions/relais?id=${compte.id}`}
                        className="na-presse flex items-center gap-2 bg-[#25d366] px-5 py-[11px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      >
                        <MessageCircle className="h-[17px] w-[17px]" aria-hidden />
                        Envoyer sur WhatsApp
                      </a>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-[14px] text-muted">
                      <PhoneOff className="h-[15px] w-[15px] shrink-0" aria-hidden />
                      Aucun numéro : ce compte s&apos;est inscrit avant que le champ existe.
                      Relancez-le par email.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[13px] text-muted italic">
        Un compte disparaît de cette liste dès qu&apos;il est activé. Ce relais reste manuel tant
        que Nova Assist n&apos;a pas d&apos;API WhatsApp Business — le site ne peut pas écrire
        seul à un client.
      </p>
    </>
  );
}
