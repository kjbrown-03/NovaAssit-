import type { Metadata } from "next";
import { ButtonPrimary, Eyebrow } from "@/components/ui";
import { OffresTarifs } from "@/components/offres-tarifs";
import { COMPARATIF, FAQ, FORMULES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Nos offres",
  description:
    "Trois formules d'assistance virtuelle — Essentiel, Professionnel, Premium. Heures reportées, changement de formule à tout moment, préavis de 30 jours.",
};

export default function Offres() {
  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 lg:px-14 lg:pt-[66px]">
        <Eyebrow>Accueil · Nos offres</Eyebrow>
        <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
          Trois formules, un seul niveau d&apos;exigence
        </h1>
        <p className="max-w-[62ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
          Les heures non consommées sont reportées d&apos;un mois. Vous pouvez changer de formule ou
          arrêter avec un préavis de 30 jours.
        </p>
      </section>

      {/* --------------------------------------------------------------- tarifs */}
      {/* La bascule mensuel/annuel et l'orbite partagent un état, d'où le
          composant commun. L'orbite porte à elle seule la présentation des
          trois formules : prix, cible et lien vers le devis. Le détail des
          prestations est dans le tableau comparatif juste en dessous. */}
      <OffresTarifs formules={FORMULES} />

      {/* ----------------------------------------------------------- comparatif */}
      <section data-reveal className="mx-auto max-w-[1180px] px-5 pb-12 lg:px-14 lg:pb-[70px]">
        <h2 className="mb-6 text-[28px] text-navy lg:text-[34px]">Comparer en détail</h2>
        {/* Le tableau déborde horizontalement sur mobile plutôt que d'écraser les colonnes. */}
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-stone-50 font-mono text-[11px] tracking-[0.14em] text-gold-ink uppercase">
                <th scope="col" className="px-[26px] py-4 font-normal">
                  Prestation
                </th>
                {FORMULES.map((f) => (
                  <th key={f.id} scope="col" className="px-[26px] py-4 font-normal">
                    {f.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARATIF.map((ligne, i) => (
                <tr
                  key={ligne.prestation}
                  className={i < COMPARATIF.length - 1 ? "border-b border-line-soft" : ""}
                >
                  <th
                    scope="row"
                    className="px-[26px] py-[17px] text-[15px] font-normal text-ink"
                  >
                    {ligne.prestation}
                  </th>
                  {ligne.valeurs.map((valeur, j) => (
                    <td
                      key={j}
                      className={`px-[26px] py-[17px] text-[15px] ${
                        valeur === "Inclus"
                          ? "text-gold-ink"
                          : valeur === "—"
                            ? "text-disabled"
                            : "text-slate-mid"
                      }`}
                    >
                      {valeur === "—" ? (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">Non inclus</span>
                        </>
                      ) : (
                        valeur
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------------------------------------------------ FAQ */}
      <section id="faq" data-reveal className="scroll-mt-20 bg-stone-50 px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <h2 className="text-[28px] text-navy lg:text-[34px]">Questions fréquentes</h2>
          <dl className="flex flex-col">
            {FAQ.map((item, i) => (
              <div
                key={item.question}
                className={`flex flex-col gap-[7px] border-t border-line py-5 ${
                  i === FAQ.length - 1 ? "border-b" : ""
                }`}
              >
                <dt className="text-[17px] font-semibold text-navy lg:text-[18px]">{item.question}</dt>
                <dd className="text-[15px] leading-[1.6] text-slate-mid lg:text-[16px]">
                  {item.reponse}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section data-reveal className="px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex flex-col gap-[10px]">
            <h2 className="text-[28px] text-navy lg:text-[36px]">Une situation particulière ?</h2>
            <p className="text-[15px] text-slate-mid lg:text-[17px]">
              Nous construisons une formule sur mesure à partir de votre volume réel.
            </p>
          </div>
          <ButtonPrimary href="/devis" className="shrink-0">
            Demander un devis
          </ButtonPrimary>
        </div>
      </section>
    </>
  );
}
