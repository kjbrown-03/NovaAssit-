import { getTranslations } from "next-intl/server";

import { FormulaireTemoignage } from "@/components/espace-client/formulaire-temoignage";
import { MAX_ACCUEIL } from "@/lib/temoignages/types";
import { chargerTableauDeBord } from "@/lib/supabase/espace-client";

export default async function MonTemoignage() {
  const { profil } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");

  return (
    <section className="na-carte na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">{t("temoignageEyebrow")}</span>
        <h2 className="text-[20px] text-navy lg:text-[24px]">{t("temoignageTitre")}</h2>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          {t("temoignageTexte", { max: MAX_ACCUEIL })}
        </p>
      </div>
      <FormulaireTemoignage
        connu={{
          auteur: profil?.contact_nom?.trim() ?? undefined,
          entreprise: profil?.entreprise ?? undefined,
          fonction: profil?.fonction ?? undefined,
          ville: profil?.ville ?? undefined,
        }}
      />
    </section>
  );
}
