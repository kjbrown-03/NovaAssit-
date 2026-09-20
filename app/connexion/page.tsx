import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { FormulaireAuth } from "@/components/auth/formulaire-auth";
import type { AuthMode } from "@/components/ui/auth-switch";
import { cheminInterne } from "@/lib/chemin-interne";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("metaTitre"),
    description: t("metaDescription"),
    robots: { index: false },
  };
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    suite?: string;
    erreur?: string;
    motif?: string;
    email?: string;
    motdepasse?: string;
  }>;
}) {
  const { mode, suite, erreur, motif, email, motdepasse } = await searchParams;

  /* Des identifiants dans l'URL ne doivent jamais s'afficher, ni rester dans
     l'historique. Le formulaire soumet en POST, mais un lien forgé ou un
     ancien favori peut encore les apporter : on renvoie sur l'adresse propre
     avant de rendre quoi que ce soit. */
  if (email !== undefined || motdepasse !== undefined) {
    const propre = new URLSearchParams();
    if (mode) propre.set("mode", mode);
    if (suite) propre.set("suite", suite);
    const requete = propre.toString();
    redirect(requete ? `/connexion?${requete}` : "/connexion");
  }

  const t = await getTranslations("auth");

  /* `/connexion?mode=inscription` ouvre directement le formulaire de création
     de compte — c'est le lien posé depuis les appels à l'action du site. */
  const modeInitial: AuthMode = mode === "inscription" ? "inscription" : "connexion";

  /* `suite` est posé par le middleware quand il intercepte une page protégée.
     On n'accepte qu'un chemin interne : une URL absolue permettrait de
     rediriger vers un site tiers après connexion. */
  const destination = cheminInterne(suite);

  /* La page entière est la bascule : ni en-tête ni pied de page, rien qui
     détourne du seul geste attendu ici. */
  return (
    <main id="contenu" className="relative">
      <FormulaireAuth
        modeInitial={modeInitial}
        suite={destination}
        messageInitial={
          erreur
            ? t("lienInvalide")
            : /* Posé par le middleware quand une session non mémorisée a
                 survécu à la fermeture du navigateur — voir
                 `lib/session-navigateur.ts`. */
              motif === "session-fermee"
              ? t("sessionFermee")
              : null
        }
      />
    </main>
  );
}
