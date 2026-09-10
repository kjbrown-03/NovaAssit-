import { CheckCircle, Clock, RefreshCw } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  chargerTableauDeBord,
  dateCourte,
  STYLE_STATUT,
} from "@/lib/supabase/espace-client";

/* Chaque statut porte son icône : la teinte seule ne doit pas porter le sens. */
const ICONE_STATUT = {
  en_cours: RefreshCw,
  attente_retour: Clock,
  terminee: CheckCircle,
} as const;

const CLE_STATUT = {
  en_cours: "statutEnCours",
  attente_retour: "statutAttenteRetour",
  terminee: "statutTerminee",
} as const;

export default async function MesDemandes() {
  const { demandes } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");
  const locale = await getLocale();

  return (
    <section className="na-monte flex flex-col gap-4">
      <h2 className="text-[20px] text-navy lg:text-[23px]">{t("mesDemandes")}</h2>

      {demandes.length === 0 ? (
        <div className="na-carte rounded-3xl px-6 py-10 text-center shadow-sm">
          <p className="text-[16px] text-slate-mid">{t("aucuneDemande")}</p>
          <p className="mt-2 text-[15px] text-gray-mid">{t("aucuneDemandeAide")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {demandes.map((demande, i) => {
            const IconeStatut = ICONE_STATUT[demande.statut];
            return (
              <li
                key={demande.id}
                style={{ "--na-delai": `${i * 60}ms` } as React.CSSProperties}
                className="na-carte na-carte-actif na-monte flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-mono text-[12px] text-muted-light">
                    {demande.reference}
                  </span>
                  <span className="text-[16px] text-ink">{demande.objet}</span>
                  <span className="text-[13px] text-gray-mid">
                    {t("recueLe", { date: dateCourte(demande.recue_le, locale) })}
                  </span>
                </div>
                <span className={`${STYLE_STATUT[demande.statut]} shrink-0`}>
                  <IconeStatut className="h-[14px] w-[14px]" aria-hidden />
                  {t(CLE_STATUT[demande.statut])}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
