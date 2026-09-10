import { getTranslations } from "next-intl/server";

import { chargerFormules } from "@/lib/tarifs";
import { ShinyButton } from "@/components/ui/shiny-button";
import { chargerTableauDeBord } from "@/lib/supabase/espace-client";

export default async function MonAbonnement() {
  const { profil } = await chargerTableauDeBord();
  const formules = await chargerFormules();
  const t = await getTranslations("pageEspace");
  const tf = await getTranslations("formules");

  return (
    <section className="na-carte na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">{t("abonnementEyebrow")}</span>
        <h2 className="text-[20px] text-navy lg:text-[24px]">{t("abonnementTitre")}</h2>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          {profil?.formule ? t("abonnementAvecFormule") : t("abonnementSansFormule")}
        </p>
      </div>

      <ul className="grid gap-3 lg:grid-cols-3">
        {formules.map((formule) => {
          const active = profil?.formule === formule.id;
          return (
            <li
              key={formule.id}
              className={`flex flex-col gap-3 rounded-2xl p-5 ${
                active ? "border-2 border-gold bg-gold-soft" : "border border-line-soft"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.18em] text-gold-ink uppercase">
                  {tf(`${formule.id}.nom`)}
                </span>
                {active && (
                  <span className="shrink-0 bg-gold px-[9px] py-1 font-mono text-[9px] tracking-[0.12em] text-navy uppercase">
                    {t("votreFormule")}
                  </span>
                )}
              </div>

              <p className="font-serif text-[26px] leading-none text-navy">
                {formule.prixCourt}{" "}
                <span className="font-sans text-[13px] text-gray-mid">{tf("unite")}</span>
              </p>

              <p className="text-[14px] leading-[1.5] text-slate-mid">
                {tf(`${formule.id}.pourCourt`)}
              </p>

              <ul className="flex flex-col gap-[6px] text-[13px] leading-[1.45] text-ink-700">
                {(tf.raw(`${formule.id}.inclus`) as string[]).slice(0, 3).map((ligne) => (
                  <li key={ligne}>{ligne}</li>
                ))}
              </ul>

              {active ? (
                <p className="mt-auto pt-1 font-mono text-[11px] tracking-[0.12em] text-gold-ink uppercase">
                  {t("formuleEnCours")}
                </p>
              ) : (
                <ShinyButton
                  href={`/paiement?formule=${formule.id}`}
                  variant={formule.miseEnAvant ? "primary" : "outline"}
                  className="mt-auto !p-[11px] !text-[14px]"
                >
                  {profil?.formule ? t("passerACetteFormule") : t("passerAuPaiement")}
                </ShinyButton>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
