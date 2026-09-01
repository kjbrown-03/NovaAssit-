import type { Metadata } from "next";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireNouveauMotDePasse } from "@/components/auth/formulaire-nouveau-mot-de-passe";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false },
};

/* Le middleware exige une session ici : on n'y arrive que par le lien reçu par
   email, qui ouvre une session de récupération en passant par /auth/confirm. */
export default function NouveauMotDePasse() {
  return (
    <CadreAuth
      titre="Nouveau mot de passe"
      intro="Choisissez un mot de passe d'au moins 8 caractères. Vous serez connecté aussitôt."
    >
      <FormulaireNouveauMotDePasse />
    </CadreAuth>
  );
}
