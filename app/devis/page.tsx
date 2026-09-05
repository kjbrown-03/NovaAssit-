import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { FormulaireDevis } from "./formulaire-devis";
import { chargerProfilConnu } from "@/lib/supabase/profil";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageDevis");
  return { title: t("metaTitre"), description: t("metaDescription") };
}

export default async function Devis() {
  /* `/devis` est derrière le middleware : le visiteur est authentifié, sa
     fiche existe. On la lit ici plutôt que dans le composant client, qui n'a
     ni session ni accès à la base. */
  const profil = await chargerProfilConnu();
  const t = await getTranslations("pageDevis");

  return (
    /* useSearchParams impose une frontière Suspense au prérendu. */
    <Suspense fallback={<div className="px-5 py-20 text-center text-slate-mid">{t("chargement")}</div>}>
      <FormulaireDevis profil={profil} />
    </Suspense>
  );
}
