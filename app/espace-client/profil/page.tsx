import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { chargerTableauDeBord } from "@/lib/supabase/espace-client";

export default async function MonProfil() {
  const { profil } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");
  const tf = await getTranslations("formules");

  const entreprise = profil?.entreprise ?? t("profilIncomplet");
  const prenomOuNom = profil?.contact_nom?.trim();
  const heuresIncluses = profil?.heures_incluses ?? null;

  const nomFormule = profil?.formule
    ? t("formuleLibelle", { nom: tf(`${profil.formule}.nom`) })
    : t("formuleADefinir");

  return (
    <section className="na-carte na-carte-actif na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 font-mono text-[15px] text-gold-ink"
          >
            {(prenomOuNom || entreprise)
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((m) => m[0])
              .join("")
              .toUpperCase()}
          </span>
          <div className="flex flex-col">
            <h2 className="text-[19px] text-navy">{prenomOuNom || entreprise}</h2>
            <p className="text-[14px] text-gray-mid">
              {prenomOuNom ? entreprise : t("contactACompleter")}
            </p>
          </div>
        </div>
        <span className="na-statut na-statut-neutre">
          <Wallet className="h-[14px] w-[14px]" aria-hidden />
          {nomFormule}
        </span>
      </div>

      <dl className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="na-eyebrow">{t("profilEntreprise")}</dt>
          <dd className="text-[15px] text-ink">{entreprise}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="na-eyebrow">{t("profilForfait")}</dt>
          <dd className="text-[15px] text-ink">
            {heuresIncluses !== null
              ? t("forfaitHeures", { h: heuresIncluses })
              : t("forfaitADefinir")}
          </dd>
        </div>
      </dl>

      <p className="text-[13px] text-muted italic">{t("profilNote")}</p>
    </section>
  );
}
