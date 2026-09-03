import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ButtonOutline, ButtonPrimary, Eyebrow } from "@/components/ui";
import { CONTACT, whatsappLink } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return { title: t("metaTitre"), description: t("metaDescription") };
}

export default function Contact() {
  const t = useTranslations("contact");
  const tc = useTranslations("commun");

  const coordonnees = [
    {
      cle: "telephone",
      valeur: CONTACT.telephone,
      /* Le lien `tel:` ne tolère ni espace ni ponctuation. */
      href: `tel:${CONTACT.telephone.replace(/\s/g, "")}`,
    },
    { cle: "email", valeur: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { cle: "adresse", valeur: CONTACT.ville, href: null },
  ] as const;

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>{t("filAriane")}</Eyebrow>
      <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
        {t("titre")}
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
        {t("intro")}
      </p>

      <div className="mt-4 flex flex-col gap-[14px] sm:flex-row">
        <ButtonPrimary href="/devis">{tc("demanderDevis")}</ButtonPrimary>
        <ButtonOutline href={whatsappLink(tc("messageWhatsAppDefaut"))} external>
          {tc("ecrireWhatsApp")}
        </ButtonOutline>
      </div>

      <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
        {coordonnees.map(({ cle, valeur, href }) => (
          <div key={cle} className="flex flex-col gap-2 bg-paper px-6 py-7">
            <dt className="na-eyebrow font-mono text-[11px]">{t(cle)}</dt>
            <dd className="text-[17px] text-navy">
              {href ? <a href={href}>{valeur}</a> : valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
