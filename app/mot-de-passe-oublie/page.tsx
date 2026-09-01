import type { Metadata } from "next";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireOubli } from "@/components/auth/formulaire-oubli";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false },
};

export default function MotDePasseOublie() {
  return (
    <CadreAuth
      titre="Mot de passe oublié"
      intro="Indiquez l'adresse de votre compte : nous vous envoyons un lien pour en choisir un nouveau."
    >
      <FormulaireOubli />
    </CadreAuth>
  );
}
