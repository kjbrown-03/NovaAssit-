import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { Wordmark } from "@/components/wordmark";
import { ShinyButton } from "@/components/ui/shiny-button";
import { whatsappLink } from "@/lib/content";
import { referenceDemande } from "@/lib/supabase/devis";
import { lireProposition } from "@/lib/devis/proposition";

/* Une proposition est un document nominatif : elle n'a rien à faire dans un
   index, même si son adresse est imprévisible. */
export const metadata: Metadata = {
  title: "Votre devis",
  robots: { index: false, follow: false },
};

const montantFr = (fcfa: number) => new Intl.NumberFormat("fr-FR").format(fcfa);

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * La proposition, telle que le prospect la découvre depuis WhatsApp.
 *
 * Pas d'en-tête de site, pas de menu : cette page a un seul rôle, montrer le
 * devis et laisser le télécharger. Elle s'ouvre sur un téléphone, souvent sans
 * compte — c'est le jeton de l'adresse qui donne l'accès.
 */
export default async function Proposition({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const devis = await lireProposition(jeton);

  if (!devis) notFound();

  const reference = referenceDemande(String(devis.id), new Date(devis.recue_le));
  const etabliLe = devis.devis_etabli_le ?? devis.recue_le;
  const expire = new Date(etabliLe);
  expire.setDate(expire.getDate() + (devis.validite_jours ?? 30));

  const lignes: [string, string][] = [
    ["Secteur", devis.secteur ?? "Non précisé"],
    ["Effectif", devis.effectif ?? "Non précisé"],
    ["Domaines à déléguer", devis.domaines?.join(", ") || "Non précisé"],
    ["Canaux", devis.canaux?.join(", ") || "Non précisé"],
    ["Volume par jour", devis.messages_par_jour ?? "Non précisé"],
    ["Amplitude horaire", devis.plage ?? "Non précisé"],
  ];

  return (
    <main id="contenu" className="min-h-svh bg-stone-50 pb-16">
      <header className="bg-navy px-5 py-5 lg:px-14">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4">
          <Wordmark size={19} />
          <span className="font-mono text-[11px] tracking-[0.14em] text-gold uppercase">
            Devis
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[820px] flex-col gap-6 px-5 pt-8 lg:px-0 lg:pt-12">
        <div className="flex flex-col gap-2">
          <span className="na-eyebrow">{reference}</span>
          <h1 className="text-[30px] leading-[1.15] text-navy lg:text-[38px]">
            Votre proposition, {devis.contact_nom}
          </h1>
          <p className="text-[15px] text-slate-mid">
            Établie le {dateFr(etabliLe)} pour {devis.entreprise} — valable jusqu&apos;au{" "}
            {dateFr(expire.toISOString())}.
          </p>
        </div>

        {/* Le montant d'abord : c'est ce que le destinataire cherche. */}
        <div className="flex flex-col gap-1 border-l-[3px] border-gold bg-gold-soft px-6 py-6">
          <span className="text-[14px] text-slate-mid">Montant proposé</span>
          <span className="font-serif text-[38px] leading-none text-navy lg:text-[46px]">
            {montantFr(devis.montant_fcfa ?? 0)}{" "}
            <span className="font-sans text-[18px] text-gray-mid">FCFA</span>
          </span>
          <span className="text-[14px] text-gray-mid">par mois, hors taxes</span>
        </div>

        {devis.prestation && (
          <section className="flex flex-col gap-2 border border-line bg-paper p-6">
            <h2 className="na-eyebrow">Ce que couvre ce montant</h2>
            <p className="text-[16px] leading-[1.65] text-slate-deep">{devis.prestation}</p>
          </section>
        )}

        <section className="flex flex-col gap-4 border border-line bg-paper p-6">
          <h2 className="na-eyebrow">Le besoin que vous nous avez décrit</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {lignes.map(([intitule, valeur]) => (
              <div key={intitule} className="flex flex-col gap-1">
                <dt className="text-[13px] text-muted">{intitule}</dt>
                <dd className="text-[15px] text-ink">{valeur}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={`/proposition/${jeton}/pdf`}
            className="na-presse flex items-center justify-center gap-2 bg-navy px-6 py-[15px] text-[16px] font-semibold text-white transition-colors hover:bg-gold hover:text-navy"
          >
            <Download aria-hidden size={18} />
            Télécharger le devis en PDF
          </a>
          <ShinyButton
            href={whatsappLink(
              `Bonjour, je vous écris au sujet du devis ${reference}.`,
            )}
            external
            variant="outline"
            className="!px-6 !py-[15px] !text-[16px]"
          >
            Répondre sur WhatsApp
          </ShinyButton>
        </div>

        <p className="max-w-[68ch] text-[14px] leading-[1.6] text-gray-mid">
          Ce devis est établi sur la base des informations que vous nous avez transmises.
          Toute modification du volume ou des canaux fera l&apos;objet d&apos;un ajustement
          convenu à l&apos;avance. Un accord de non-divulgation est signé avant le début de
          toute mission.
        </p>
      </div>
    </main>
  );
}
