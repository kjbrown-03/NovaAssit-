import { Clock, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { whatsappLink } from "@/lib/content";
import { ShinyButton } from "@/components/ui/shiny-button";
import { chargerTableauDeBord } from "@/lib/supabase/espace-client";

/**
 * Tableau de bord — la vue d'ouverture.
 *
 * Elle ne porte que ce qu'on veut voir sans chercher : l'état des demandes en
 * cours, et à qui écrire. Le détail vit dans les autres onglets, qui sont
 * maintenant de vraies pages.
 */
export default async function TableauDeBord() {
  const { profil, enCours, prioritaires } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");
  const tc = await getTranslations("commun");

  return (
    <>
      {!profil && (
        <div role="alert" className="na-alerte na-carte na-monte border-gold-line bg-gold-soft/70">
          <span className="na-alerte-icone bg-gold/25">
            <Clock className="h-5 w-5 text-gold-ink" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-bold text-navy">{t("ficheTitre")}</h2>
            <p className="text-[14px] leading-[1.55] text-slate-deep">{t("ficheTexte")}</p>
          </div>
        </div>
      )}

      <section aria-labelledby="titre-indicateurs">
        <h2 id="titre-indicateurs" className="sr-only">
          {t("activiteTitre")}
        </h2>
        <dl className="na-monte">
          <div className="na-carte na-carte-actif flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:max-w-[340px]">
            <dt className="na-statut na-statut-cours self-start">
              <RefreshCw className="h-[14px] w-[14px]" aria-hidden />
              {t("demandesEnCours")}
            </dt>
            <dd className="font-serif text-[32px] leading-none text-navy">{enCours}</dd>
            <p className="text-[13px] text-gray-mid">
              {prioritaires > 0
                ? t(prioritaires > 1 ? "dontPrioritairesPluriel" : "dontPrioritaires", {
                    n: prioritaires,
                  })
                : t("aucunePrioritaire")}
            </p>
          </div>
        </dl>
      </section>

      <section className="na-carte na-carte-actif na-monte flex flex-col gap-[14px] rounded-3xl p-6 shadow-sm sm:max-w-[420px]">
        <h2 className="text-[19px] text-navy">{t("interlocutriceTitre")}</h2>
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 font-mono text-[9px] text-gold-ink"
          >
            1:1
          </span>
          <span className="flex flex-col gap-[3px]">
            <span className="text-[17px] text-navy">{t("interlocutriceNom")}</span>
            <span className="text-[14px] text-gray-mid">{t("interlocutriceRole")}</span>
          </span>
        </div>
        <ShinyButton
          href={whatsappLink(t("messageWhatsApp"))}
          external
          className="mt-auto w-full !p-[13px] !text-[15px]"
        >
          {tc("ecrireWhatsApp")}
        </ShinyButton>
      </section>
    </>
  );
}
