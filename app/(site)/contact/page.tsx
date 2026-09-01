import type { Metadata } from "next";
import { ButtonOutline, ButtonPrimary, Eyebrow } from "@/components/ui";
import { CONTACT, whatsappLink } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Écrivez-nous sur WhatsApp, par email ou par téléphone. Réponse sous 24 h ouvrées.",
};

export default function Contact() {
  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 pt-10 pb-16 lg:px-14 lg:pt-[66px] lg:pb-24">
      <Eyebrow>Accueil · Contact</Eyebrow>
      <h1 className="max-w-[20ch] text-[34px] leading-[1.08] text-navy lg:text-[54px]">
        Parlons de ce qui vous prend du temps
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-[1.65] text-slate-deep lg:text-[18px]">
        Le plus rapide reste WhatsApp — c&apos;est aussi par là que passent la plupart de vos
        clients. Pour une demande chiffrée, le formulaire de devis vous prend moins de trois minutes.
      </p>

      <div className="mt-4 flex flex-col gap-[14px] sm:flex-row">
        <ButtonPrimary href="/devis">Demander un devis</ButtonPrimary>
        <ButtonOutline href={whatsappLink()} external>
          Écrire sur WhatsApp
        </ButtonOutline>
      </div>

      <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="flex flex-col gap-2 bg-paper px-6 py-7">
          <dt className="na-eyebrow font-mono text-[11px]">Téléphone</dt>
          <dd className="text-[17px] text-navy">
            <a href={`tel:${CONTACT.telephone.replace(/\s/g, "")}`}>{CONTACT.telephone}</a>
          </dd>
        </div>
        <div className="flex flex-col gap-2 bg-paper px-6 py-7">
          <dt className="na-eyebrow font-mono text-[11px]">Email</dt>
          <dd className="text-[17px] text-navy">
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </dd>
        </div>
        <div className="flex flex-col gap-2 bg-paper px-6 py-7">
          <dt className="na-eyebrow font-mono text-[11px]">Adresse</dt>
          <dd className="text-[17px] text-navy">{CONTACT.ville}</dd>
        </div>
      </dl>
    </section>
  );
}
