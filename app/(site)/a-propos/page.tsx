import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ButtonPrimary, Eyebrow, PhotoSlot } from "@/components/ui";
import { EXEMPLES } from "@/lib/exemples-photos";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageAPropos");
  return { title: t("metaTitre"), description: t("metaDescription") };
}

/* Les valeurs et l'équipe vivent dans les fichiers de messages, pas ici : ce
   sont des textes à traduire, pas de la structure. Seule leur mise en forme
   reste dans ce fichier. */
type Valeur = { titre: string; texte: string };
type Membre = { nom: string; role: string };

export default function APropos() {
  const t = useTranslations("pageAPropos");
  const tc = useTranslations("commun");

  const valeurs = t.raw("valeurs") as Valeur[];
  const equipe = t.raw("equipe") as Membre[];

  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 pt-10 pb-8 lg:grid-cols-[1fr_0.85fr] lg:gap-14 lg:px-14 lg:pt-[66px] lg:pb-[46px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>{t("filAriane")}</Eyebrow>
          <h1 className="text-[34px] leading-[1.08] text-navy lg:text-[54px]">{t("titre")}</h1>
          <p className="max-w-[50ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
            {t("intro")}
          </p>
        </div>
        <PhotoSlot
          ratio={t("photoRatio")}
          legende={t("photoLegende")}
          exemple={EXEMPLES.portraitFondatrice.src}
          exempleAlt={EXEMPLES.portraitFondatrice.alt}
          className="h-[240px] lg:h-[360px]"
        />
      </section>

      {/* ------------------------------------------------------ mission + valeurs */}
      <section data-reveal className="mx-auto grid max-w-[1180px] items-start gap-8 px-5 pb-12 lg:grid-cols-2 lg:gap-14 lg:px-14 lg:pb-[60px]">
        <div className="flex flex-col gap-[18px]">
          <Eyebrow>{t("missionEyebrow")}</Eyebrow>
          <p className="font-serif text-[22px] leading-[1.45] text-navy lg:text-[28px]">
            {t("missionTexte")}
          </p>
        </div>
        <div className="flex flex-col">
          <h2 className="na-eyebrow mb-4 font-mono text-[11px] font-normal">{t("valeursTitre")}</h2>
          <dl className="flex flex-col">
            {valeurs.map((valeur, i) => (
              <div
                key={valeur.titre}
                className={`flex flex-col gap-[5px] border-t border-line-soft py-5 ${
                  i === valeurs.length - 1 ? "border-b" : ""
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
          <h2 className="text-[28px] text-navy lg:text-[34px]">{t("equipeTitre")}</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {equipe.map((membre, i) => (
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
                    {t("portraitRatio")}
                  </span>
                  <span className="absolute top-3 right-3 bg-gold px-[8px] py-[3px] font-mono text-[9px] tracking-[0.16em] text-navy uppercase">
                    {t("badgeExemple")}
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
          <h2 className="text-[28px] text-navy lg:text-[36px]">{t("ctaTitre")}</h2>
          <ButtonPrimary href="/devis" className="shrink-0">
            {tc("demanderDevis")}
          </ButtonPrimary>
        </div>
      </section>
    </>
  );
}
