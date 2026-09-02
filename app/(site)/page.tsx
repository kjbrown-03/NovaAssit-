import { useTranslations } from "next-intl";
import { Compteur } from "@/components/compteur";
import { ServicesEventail } from "@/components/services-eventail";
import { TemoignagesAccueil } from "@/components/temoignages-accueil";
import { ButtonOutline, ButtonPrimary, Eyebrow, GoldUnderlineLink, PhotoSlot } from "@/components/ui";
import { CHIFFRES, FORMULES, SERVICES, whatsappLink } from "@/lib/content";
import { revealDelay } from "@/lib/utils";
import { EXEMPLES } from "@/lib/exemples-photos";

/* Clés de traduction des chiffres clés, dans l'ordre de `CHIFFRES`. */
const CLES_CHIFFRES = ["reponse", "disponibilite", "confidentialite", "formules"] as const;

/* Les trois arguments de la section « confiance », dans l'ordre d'affichage. */
const CLES_CONFIANCE = ["confidentialite", "reactivite", "ancrage"] as const;

export default function Accueil() {
  const t = useTranslations("accueil");
  const tc = useTranslations("commun");
  const ts = useTranslations("services");
  const tf = useTranslations("formules");
  const tch = useTranslations("chiffres");

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 pt-[34px] pb-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-14 lg:pt-20 lg:pb-[70px]">
        <div className="flex flex-col gap-[18px] lg:gap-6">
          <p className="flex items-center gap-3">
            <span aria-hidden className="hidden h-px w-[34px] bg-gold lg:block" />
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </p>
          <h1 className="text-[40px] leading-[1.06] tracking-[-0.015em] text-navy lg:text-[64px]">
            {t("titreLigne1")}
            <br />
            <span className="text-gold-ink italic">{t("titreLigne2")}</span>
          </h1>
          <p className="max-w-[44ch] text-[16px] leading-[1.6] text-slate-deep lg:text-[19px] lg:leading-[1.62]">
            {t("intro")}
          </p>
          <div className="flex flex-col gap-[10px] pt-1 sm:flex-row sm:items-center lg:gap-[14px] lg:pt-[6px]">
            <ButtonPrimary href="/devis">{tc("demanderDevis")}</ButtonPrimary>
            <ButtonOutline href={whatsappLink(tc("messageWhatsAppDefaut"))} external>
              {tc("ecrireWhatsApp")}
            </ButtonOutline>
          </div>
        </div>
        <PhotoSlot
          ratio={t("photoRatio")}
          legende={t("photoLegende")}
          exemple={EXEMPLES.heroPortrait.src}
          exempleAlt={EXEMPLES.heroPortrait.alt}
          className="h-[220px] lg:h-[440px]"
        />
      </section>

      {/* ------------------------------------------------------------ chiffres */}
      <section data-reveal className="bg-navy">
        <h2 className="sr-only">{t("chiffresTitre")}</h2>
        <dl className="mx-auto grid max-w-[1180px] grid-cols-2 lg:grid-cols-4">
          {CHIFFRES.map((chiffre, i) => (
            <div
              key={CLES_CHIFFRES[i]}
              className={`flex flex-col gap-1 px-5 py-6 lg:gap-[6px] lg:px-10 lg:py-10 ${
                i % 2 === 0 ? "border-r border-gold/20" : ""
              } lg:border-r lg:last:border-r-0 ${i === 0 ? "lg:pl-14" : ""}`}
            >
              <dd className="font-serif text-[28px] text-gold lg:text-[36px]">
                <Compteur
                  vers={chiffre.nombre}
                  prefixe={chiffre.prefixe}
                  suffixe={chiffre.suffixe}
                />
              </dd>
              <dt className="text-[13px] text-white/62 lg:text-[14px] lg:text-white/66">
                <span className="lg:hidden">{tch(`${CLES_CHIFFRES[i]}Court`)}</span>
                <span className="hidden lg:inline">{tch(CLES_CHIFFRES[i])}</span>
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ services */}
      <section className="mx-auto max-w-[1180px] px-5 py-9 lg:px-14 lg:pt-[84px] lg:pb-[76px]">
        <div
          data-reveal
          className="mb-5 flex flex-col gap-3 lg:mb-10 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex flex-col gap-3">
            <Eyebrow>{ts("eyebrow")}</Eyebrow>
            <h2 className="text-[30px] text-navy lg:text-[42px]">{ts("titre")}</h2>
          </div>
          <div className="hidden lg:block">
            <GoldUnderlineLink href="/services">{ts("voirTous")}</GoldUnderlineLink>
          </div>
        </div>

        <div className="hidden lg:block">
          <ServicesEventail services={SERVICES} />
        </div>

        <ul className="grid gap-px lg:hidden">
          {SERVICES.map((service, i) => (
            <li
              key={service.numero}
              data-reveal
              style={revealDelay(i * 40)}
              className="group relative flex flex-col gap-[11px] border-t border-line-soft bg-paper py-[18px] transition-colors duration-300 lg:border-t-0 lg:px-[30px] lg:py-8 lg:hover:bg-stone-50"
            >
              <span className="font-mono text-[11px] text-gold lg:text-[12px]">{service.numero}</span>
              <h3 className="text-[20px] text-navy transition-colors duration-300 group-hover:text-gold-ink lg:text-[23px]">
                {ts(`${service.numero}.titre`)}
              </h3>
              <p className="text-[14px] leading-[1.55] text-slate-mid lg:text-[15px] lg:leading-[1.6]">
                {ts(`${service.numero}.resume`)}
              </p>
              {/* Filet doré qui se déploie sous la carte au survol. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 hidden h-px origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100 lg:block"
              />
            </li>
          ))}
        </ul>

        <div className="mt-5 lg:hidden">
          <GoldUnderlineLink href="/services">{ts("voirSix")}</GoldUnderlineLink>
        </div>
      </section>

      {/* -------------------------------------------------------------- offres */}
      <section className="mx-auto max-w-[1180px] px-5 pb-9 lg:px-14 lg:pb-[84px]">
        <div data-reveal className="mb-5 flex flex-col gap-3 lg:mb-10">
          <Eyebrow>{t("offres.eyebrow")}</Eyebrow>
          <h2 className="text-[30px] text-navy lg:text-[42px]">{t("offres.titre")}</h2>
          <p className="max-w-[56ch] text-[16px] leading-[1.6] text-slate-mid lg:text-[17px]">
            {t("offres.intro")}
          </p>
        </div>

        <ul className="grid items-stretch gap-[14px] lg:grid-cols-3 lg:gap-[22px]">
          {FORMULES.map((formule, i) => (
            <li
              key={formule.id}
              data-reveal
              style={revealDelay(i * 50)}
              className={`flex flex-col gap-[14px] p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(11,31,58,0.12)] lg:gap-[22px] lg:px-8 lg:py-9 ${
                formule.miseEnAvant
                  ? "border-2 border-gold lg:px-[31px] lg:py-[35px]"
                  : "border border-line hover:border-gold"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-gold-ink uppercase lg:text-[11px]">
                    {tf(`${formule.id}.nom`)}
                  </span>
                  {formule.miseEnAvant && (
                    <span className="bg-gold px-[9px] py-1 font-mono text-[9px] tracking-[0.12em] text-navy uppercase lg:text-[10px]">
                      {t("offres.lePlusChoisi")}
                    </span>
                  )}
                </div>
                <p className="font-serif text-[30px] text-navy lg:text-[36px]">
                  {formule.prix}{" "}
                  <span className="text-[15px] text-gray-mid lg:text-[17px]">{tf("unite")}</span>
                </p>
                <p className="text-[15px] text-gray-mid">{tf(`${formule.id}.pourCourt`)}</p>
              </div>
              <div aria-hidden className="h-px bg-line-soft" />
              <ul className="flex flex-col gap-[11px] text-[14px] text-ink-700 lg:text-[15px]">
                {(tf.raw(`${formule.id}.inclus`) as string[]).map((ligne) => (
                  <li key={ligne}>{ligne}</li>
                ))}
              </ul>
              {formule.miseEnAvant ? (
                <ButtonPrimary
                  href={`/devis?formule=${formule.id}`}
                  className="mt-auto p-[14px] text-[15px]"
                >
                  {tf(`${formule.id}.cta`)}
                </ButtonPrimary>
              ) : (
                <ButtonOutline
                  href={`/devis?formule=${formule.id}`}
                  className="mt-auto !p-[13px] text-[15px] font-semibold"
                >
                  {tf(`${formule.id}.cta`)}
                </ButtonOutline>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[14px] text-muted italic">{t("offres.tarifsIndicatifs")}</p>
      </section>

      {/* ------------------------------------------------------------ confiance */}
      <section data-reveal className="border-t border-line-soft">
        <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[0.9fr_1.1fr]">
          <PhotoSlot
            ratio={t("confiance.photoRatio")}
            legende={t("confiance.photoLegende")}
            exemple={EXEMPLES.methode.src}
            exempleAlt={EXEMPLES.methode.alt}
            className="min-h-[220px] border-x-0 lg:min-h-[400px] lg:border-r lg:border-l-0"
          />
          <div className="flex flex-col gap-5 px-5 py-10 lg:gap-[26px] lg:px-14 lg:py-[74px]">
            <Eyebrow>{t("confiance.eyebrow")}</Eyebrow>
            <h2 className="text-[28px] leading-[1.2] text-navy lg:text-[38px]">
              {t("confiance.titre")}
            </h2>
            <dl className="flex flex-col">
              {CLES_CONFIANCE.map((cle, i) => (
                <div
                  key={cle}
                  className={`flex flex-col gap-[5px] border-t border-line-soft py-5 ${
                    i === CLES_CONFIANCE.length - 1 ? "border-b" : ""
                  }`}
                >
                  <dt className="text-[17px] font-semibold text-navy lg:text-[18px]">
                    {t(`confiance.${cle}Titre`)}
                  </dt>
                  <dd className="text-[15px] leading-[1.6] text-slate-mid lg:text-[16px]">
                    {t(`confiance.${cle}Texte`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <TemoignagesAccueil />

      {/* ----------------------------------------------------------------- CTA */}
      <section data-reveal className="border-b border-line-soft px-5 py-8 lg:px-14 lg:py-[74px]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-[13px] lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex flex-col gap-[10px]">
            <h2 className="text-[28px] leading-[1.15] text-navy lg:text-[38px]">{t("cta.titre")}</h2>
            <p className="text-[15px] text-slate-mid lg:text-[17px]">{t("cta.texte")}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-[14px] sm:flex-row">
            <ButtonPrimary href="/devis">{tc("demanderDevis")}</ButtonPrimary>
            {/* La brochure PDF est un livrable du cahier des charges (§1.4) mais
                le fichier n'existe pas encore. Le lien pointait vers un 404 ;
                en attendant, ce bouton mène aux formules — qui portent la même
                information. Pour rétablir la brochure : déposer le PDF dans
                `public/brochure-nova-assist.pdf` et remplacer ce bouton par
                <ButtonOutline href="/brochure-nova-assist.pdf" external>
                  {t("cta.telechargerBrochure")}
                </ButtonOutline> */}
            <ButtonOutline href="/offres">{t("cta.voirFormules")}</ButtonOutline>
          </div>
        </div>
      </section>
    </>
  );
}
