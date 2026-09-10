import { getTranslations } from "next-intl/server";

import { chargerTableauDeBord } from "@/lib/supabase/espace-client";

export default async function Documents() {
  const { documents } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");

  return (
    <section className="na-carte na-carte-actif na-monte flex flex-col gap-4 rounded-3xl p-6 shadow-sm">
      <h2 className="text-[19px] text-navy">{t("documentsTitre")}</h2>
      {documents.length === 0 ? (
        <p className="text-[15px] leading-[1.6] text-gray-mid">{t("documentsVides")}</p>
      ) : (
        <ul className="flex flex-col gap-3 text-[15px]">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="na-ligne -mx-2 flex justify-between gap-4 rounded-lg px-2 py-1 text-ink-700"
            >
              <span>{doc.titre}</span>
              {/* Lien signé à générer à la demande : un PDF de facture ne doit
                  pas rester accessible indéfiniment. Prudence de notre part,
                  pas une exigence du cahier des charges. */}
              <span className="shrink-0 text-muted-light">PDF</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
