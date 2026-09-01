import type { Metadata } from "next";
import { ButtonPrimary, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Cas d'usage par secteur : assistance PME, cabinet médical, commerce. Les premiers articles arrivent au lancement.",
};

/* Les articles par secteur sont prévus au cahier des charges (§3.2, §5.1) mais
   ne figurent pas dans la maquette. Cette page tient la place dans la
   navigation en attendant la rédaction des contenus. */
const SUJETS = [
  "Assistance pour une PME : par où commencer",
  "Cabinet médical — ne plus perdre de rendez-vous",
  "Commerce et restauration : répondre sur WhatsApp sans y passer la journée",
];

export default function Blog() {
  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>Accueil · Blog</Eyebrow>
      <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
        Ressources par secteur
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
        Les premiers articles paraîtront au lancement du site. Ils traiteront les cas d&apos;usage
        secteur par secteur, à partir de situations réelles.
      </p>

      <ul className="mt-6 flex flex-col">
        {SUJETS.map((sujet, i, tab) => (
          <li
            key={sujet}
            className={`flex flex-col gap-2 border-t border-line py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 ${
              i === tab.length - 1 ? "border-b" : ""
            }`}
          >
            <span className="text-[20px] text-navy">{sujet}</span>
            <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
              À paraître
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <ButtonPrimary href="/devis">Demander un devis</ButtonPrimary>
      </div>
    </section>
  );
}
