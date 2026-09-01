import type { Metadata } from "next";
import { ButtonPrimary, Eyebrow, PhotoSlot } from "@/components/ui";
import { EXEMPLES } from "@/lib/exemples-photos";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "L'assistance virtuelle est un secteur structuré à l'international, presque invisible au Cameroun. Nova Assist a été créée pour occuper cette place.",
};

const VALEURS = [
  { titre: "Discrétion", texte: "Ce qui se dit chez nos clients reste chez nos clients." },
  {
    titre: "Exactitude",
    texte: "Des délais mesurés et communiqués, pas des promesses commerciales.",
  },
  {
    titre: "Proximité",
    texte: "Une interlocutrice identifiée, joignable sur WhatsApp comme vos clients.",
  },
];

const EQUIPE = [
  { nom: "Nom à compléter", role: "Fondatrice" },
  { nom: "Nom à compléter", role: "Assistante senior" },
  { nom: "Nom à compléter", role: "Chargée de recouvrement" },
];

export default function APropos() {
  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 pt-10 pb-8 lg:grid-cols-[1fr_0.85fr] lg:gap-14 lg:px-14 lg:pt-[66px] lg:pb-[46px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>Accueil · À propos</Eyebrow>
          <h1 className="text-[34px] leading-[1.08] text-navy lg:text-[54px]">
            Le métier existait ailleurs. Il manquait ici.
          </h1>
          <p className="max-w-[50ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
            L&apos;assistance virtuelle est un secteur structuré à l&apos;international, presque
            invisible au Cameroun. Nova Assist a été créée pour occuper cette place avec le sérieux
            d&apos;un cabinet et la souplesse d&apos;une petite équipe.
          </p>
        </div>
        <PhotoSlot
          ratio="Photo · 3:4"
          legende="Portrait de la fondatrice, fond sobre"
          exemple={EXEMPLES.portraitFondatrice.src}
          exempleAlt={EXEMPLES.portraitFondatrice.alt}
          className="h-[240px] lg:h-[360px]"
        />
      </section>

      {/* ------------------------------------------------------ mission + valeurs */}
      <section data-reveal className="mx-auto grid max-w-[1180px] items-start gap-8 px-5 pb-12 lg:grid-cols-2 lg:gap-14 lg:px-14 lg:pb-[60px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>Notre mission</Eyebrow>
          <p className="font-serif text-[22px] leading-[1.45] text-navy lg:text-[28px]">
            Permettre aux dirigeants de se concentrer sur leur métier, en prenant en charge tout ce
            qui ne le fait pas avancer.
          </p>
        </div>
        <div className="flex flex-col">
          <h2 className="na-eyebrow mb-4 font-mono text-[11px] font-normal">Nos valeurs</h2>
          <dl className="flex flex-col">
            {VALEURS.map((valeur, i) => (
              <div
                key={valeur.titre}
                className={`flex flex-col gap-[5px] border-t border-line-soft py-5 ${
                  i === VALEURS.length - 1 ? "border-b" : ""
                }`}
              >
                <dt className="text-[17px] font-semibold text-navy lg:text-[18px]">{valeur.titre}</dt>
                <dd className="text-[15px] leading-[1.6] text-slate-mid lg:text-[16px]">
                  {valeur.texte}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------- équipe */}
      <section data-reveal className="bg-stone-50 px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-7 lg:gap-[30px]">
          <h2 className="text-[28px] text-navy lg:text-[34px]">L&apos;équipe</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {EQUIPE.map((membre, i) => (
              <li key={i} className="flex flex-col gap-[14px]">
                <div className="relative flex h-[250px] items-center justify-center overflow-hidden border border-line bg-stone-200">
                  <img
                    src={EXEMPLES.portraitsEquipe[i]}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover grayscale"
                  />
                  <span aria-hidden className="absolute inset-0 bg-navy/25" />
                  <span className="absolute top-3 left-3 bg-paper/90 px-2 py-[3px] font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase">
                    Portrait · 4:5
                  </span>
                  <span className="absolute top-3 right-3 bg-gold px-[8px] py-[3px] font-mono text-[9px] tracking-[0.16em] text-navy uppercase">
                    Exemple
                  </span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  <p className="font-serif text-[21px] text-navy">{membre.nom}</p>
                  <p className="text-[15px] text-gray-mid">{membre.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section data-reveal className="px-5 py-12 lg:px-14 lg:py-[66px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <h2 className="text-[28px] text-navy lg:text-[36px]">Travaillons ensemble.</h2>
          <ButtonPrimary href="/devis" className="shrink-0">
            Demander un devis
          </ButtonPrimary>
        </div>
      </section>
    </>
  );
}
