import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireDevis } from "./formulaire-devis";

export const metadata: Metadata = {
  title: "Demande de devis",
  description:
    "Quatre étapes, moins de trois minutes. Décrivez ce que vous souhaitez déléguer et recevez une réponse chiffrée sous 24 h ouvrées.",
};

export default function Devis() {
  return (
    /* useSearchParams impose une frontière Suspense au prérendu. */
    <Suspense fallback={<div className="px-5 py-20 text-center text-slate-mid">Chargement…</div>}>
      <FormulaireDevis />
    </Suspense>
  );
}
