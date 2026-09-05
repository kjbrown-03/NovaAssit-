import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireDevis } from "./formulaire-devis";
import { chargerProfilConnu } from "@/lib/supabase/profil";

export const metadata: Metadata = {
  title: "Demande de devis",
  description:
    "Quatre étapes, moins de trois minutes. Décrivez ce que vous souhaitez déléguer et recevez une réponse chiffrée sous 24 h ouvrées.",
};

export default async function Devis() {
  /* `/devis` est derrière le middleware : le visiteur est authentifié, sa
     fiche existe. On la lit ici plutôt que dans le composant client, qui n'a
     ni session ni accès à la base. */
  const profil = await chargerProfilConnu();

  return (
    /* useSearchParams impose une frontière Suspense au prérendu. */
    <Suspense fallback={<div className="px-5 py-20 text-center text-slate-mid">Chargement…</div>}>
      <FormulaireDevis profil={profil} />
    </Suspense>
  );
}
