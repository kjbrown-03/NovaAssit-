import Link from "next/link";
import { useTranslations } from "next-intl";
import { CONTACT, whatsappLink } from "@/lib/content";
import { Wordmark } from "./wordmark";

/* Seules les URL sont fixes : les libellés passent par les traductions. */
const COLONNES = [
  {
    cleTitre: "colonneOffre",
    liens: [
      { cle: "nav.services", href: "/services" },
      { cle: "formules.essentiel.nom", href: "/offres#essentiel" },
      { cle: "formules.professionnel.nom", href: "/offres#professionnel" },
      { cle: "formules.premium.nom", href: "/offres#premium" },
    ],
  },
  {
    cleTitre: "colonneEntreprise",
    liens: [
      { cle: "nav.aPropos", href: "/a-propos" },
      { cle: "nav.blog", href: "/blog" },
      { cle: "pied.faq", href: "/offres#faq" },
      { cle: "pied.espaceClient", href: "/espace-client" },
    ],
  },
] as const;

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-[1180px] px-5 lg:px-14">
        <div className="grid gap-10 pt-10 pb-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:pt-[54px] lg:pb-9">
          <div className="flex flex-col gap-[14px]">
            <Wordmark size={21} tone="on-paper" />
            <p className="max-w-[30ch] text-[15px] leading-[1.6] text-gray-mid">
              {t("pied.baseline")}
            </p>
          </div>

          {COLONNES.map((colonne) => (
            <div
              key={colonne.cleTitre}
              className="flex flex-col gap-[11px] text-[15px] text-slate-deep"
            >
              <h2 className="na-eyebrow font-mono text-[11px] tracking-[0.16em]">
                {t(`pied.${colonne.cleTitre}`)}
              </h2>
              {colonne.liens.map((lien) => (
                <Link key={lien.href} href={lien.href} className="hover:text-gold-ink">
                  {t(lien.cle)}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-[11px] text-[15px] text-slate-deep">
            <h2 className="na-eyebrow font-mono text-[11px] tracking-[0.16em]">
              {t("pied.colonneContact")}
            </h2>
            <a
              href={whatsappLink(t("commun.messageWhatsAppDefaut"))}
              /* Comme les autres liens WhatsApp du site : la discussion s'ouvre
                 à côté, sans faire quitter la page au visiteur. */
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-ink"
            >
              {t("pied.whatsappBusiness")}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="hover:text-gold-ink">
              {CONTACT.email}
            </a>
            <span>{CONTACT.ville}</span>
          </div>
        </div>

        <div className="border-t border-line-soft py-5 pb-8 text-[13px] text-muted lg:pb-[30px]">
          {t("pied.mentions")}
        </div>
      </div>
    </footer>
  );
}
