import type { Metadata } from "next";
import { FormulaireAuth } from "@/components/auth/formulaire-auth";
import type { AuthMode } from "@/components/ui/auth-switch";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace client Nova Assist ou créez votre compte pour suivre vos demandes, documents et factures.",
  robots: { index: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; suite?: string; erreur?: string }>;
}) {
  const { mode, suite, erreur } = await searchParams;

  /* `/connexion?mode=inscription` ouvre directement le formulaire de création
     de compte — c'est le lien posé depuis les appels à l'action du site. */
  const modeInitial: AuthMode = mode === "inscription" ? "inscription" : "connexion";

  /* `suite` est posé par le middleware quand il intercepte une page protégée.
     On n'accepte qu'un chemin interne : une URL absolue permettrait de
     rediriger vers un site tiers après connexion. */
  const destination = suite && suite.startsWith("/") && !suite.startsWith("//")
    ? suite
    : "/espace-client";

  /* La page entière est la bascule : ni en-tête ni pied de page, rien qui
     détourne du seul geste attendu ici. */
  return (
    <main id="contenu" className="relative">
      <FormulaireAuth
        modeInitial={modeInitial}
        suite={destination}
        messageInitial={
          erreur
            ? "Ce lien de confirmation n'est plus valable. Il a peut-être expiré ou déjà été utilisé — reconnectez-vous, ou refaites une demande."
            : null
        }
      />
    </main>
  );
}
