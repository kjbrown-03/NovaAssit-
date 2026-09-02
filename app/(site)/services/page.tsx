import type { Metadata } from "next";
import { ButtonPrimary, Eyebrow, PhotoSlot } from "@/components/ui";
import { SERVICES } from "@/lib/content";
import { EXEMPLES } from "@/lib/exemples-photos";
import { revealDelay } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nos services",
  description:
    "Relation client, prise de rendez-vous, recouvrement, tâches administratives, community management et support commercial — six domaines, une seule interlocutrice.",
};

const ETAPES = [
  {
    numero: "1",
    titre: "Entretien de cadrage",
    texte: "45 minutes pour comprendre votre activité, vos canaux et vos irritants.",
  },
  {
    numero: "2",
    titre: "Devis et accord",
    texte: "Périmètre écrit, formule proposée, accord de confidentialité signé.",
  },
  {
    numero: "3",
    titre: "Mise en route",
    texte: "Accès aux outils, rédaction des réponses types, première semaine test.",
  },
  {
    numero: "4",
    titre: "Suivi régulier",
    texte: "Rapport d'activité et point mensuel pour ajuster le périmètre.",
  },
];

export default function Services() {
  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 pt-10 pb-8 lg:grid-cols-[1fr_0.8fr] lg:gap-14 lg:px-14 lg:pt-[66px] lg:pb-[46px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>Accueil · Nos services</Eyebrow>
          <h1 className="text-[34px] leading-[1.08] text-navy lg:text-[54px]">
            Six domaines, une seule interlocutrice
          </h1>
          <p className="max-w-[50ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
            Vous ne coordonnez pas plusieurs prestataires. Une assistante référente centralise vos
            demandes et mobilise l&apos;équipe selon le besoin.
          </p>
        </div>
        <PhotoSlot
          ratio="Photo · 4:3"
          legende="Deux assistantes en poste, plan de trois quarts"
          exemple={EXEMPLES.equipeAuTravail.src}
          exempleAlt={EXEMPLES.equipeAuTravail.alt}
          className="h-[220px] lg:h-[300px]"
        />
      </section>

      {/* ------------------------------------------------------------ six lignes */}
      <section className="mx-auto max-w-[1180px] px-5 pb-12 lg:px-14 lg:pb-[60px]">
        <h2 className="sr-only">Le détail des six domaines</h2>
        <ul className="flex flex-col">
          {SERVICES.map((service, i) => (
            <li
              key={service.numero}
              data-reveal
              style={revealDelay(i * 40)}
              className={`group grid items-baseline gap-3 border-t border-line py-6 transition-colors duration-300 lg:grid-cols-[56px_1.1fr_1.5fr_150px] lg:gap-[26px] lg:px-4 lg:py-7 lg:hover:bg-stone-50 ${
                i === SERVICES.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="font-mono text-[12px] text-gold">{service.numero}</span>
              <h3 className="text-[22px] text-navy transition-colors duration-300 group-hover:text-gold-ink lg:text-[26px]">
                {service.titre}
              </h3>
              <p className="text-[15px] leading-[1.6] text-slate-mid lg:text-[16px]">
                {service.detail}
              </p>
              <span className="font-mono text-[11px] tracking-[0.12em] text-gold-ink uppercase">
                {service.formules}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------- déroulé */}
      <section data-reveal className="bg-stone-50 px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="mb-8 text-[28px] text-navy lg:mb-9 lg:text-[34px]">
            Comment se déroule une mission
          </h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[26px]">
            {ETAPES.map((etape) => (
              <li key={etape.numero} className="flex flex-col gap-[10px]">
                <span aria-hidden className="font-serif text-[40px] text-gold">
                  {etape.numero}
                </span>
                <h3 className="text-[17px] font-semibold text-navy lg:text-[18px]">
                  <span className="sr-only">Étape {etape.numero} — </span>
                  {etape.titre}
                </h3>
                <p className="text-[15px] leading-[1.6] text-slate-mid">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section data-reveal className="px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <h2 className="text-[28px] text-navy lg:text-[36px]">
            Un besoin qui ne figure pas dans la liste ?
          </h2>
          <ButtonPrimary href="/devis" className="shrink-0">
            Nous en parler
          </ButtonPrimary>
        </div>
      </section>
    </>
  );
}
