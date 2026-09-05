"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthSwitch, type AuthMode } from "@/components/ui/auth-switch";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { marquerSession } from "@/lib/session-navigateur";

/**
 * Traduit les refus renvoyés par Supabase, qui arrivent en anglais et dans une
 * formulation technique. La liste couvre les cas courants ; le reste retombe
 * sur un message générique plutôt que d'exposer l'original.
 */
function messageLisible(brut: string, t: (cle: string) => string): string {
  const m = brut.toLowerCase();

  if (m.includes("invalid login credentials")) return t("erreurIdentifiants");
  if (m.includes("email not confirmed")) return t("erreurNonConfirme");
  if (m.includes("already registered") || m.includes("already been registered")) {
    return t("erreurDejaInscrit");
  }
  if (m.includes("password") && m.includes("6 characters")) return t("erreurMotDePasseCourt");
  if (m.includes("rate limit") || m.includes("too many")) return t("erreurTropDeTentatives");
  return t("erreurGenerique");
}

/**
 * Branche la bascule connexion / inscription sur Supabase Auth.
 *
 * Le composant visuel `AuthSwitch` ne connaît rien à Supabase : il reçoit une
 * fonction, l'appelle, et affiche la chaîne qu'elle renvoie. Toute la logique
 * d'authentification tient donc ici, et l'habillage reste réutilisable.
 */
export function FormulaireAuth({
  modeInitial,
  suite,
  messageInitial = null,
}: {
  modeInitial: AuthMode;
  /** Page demandée avant la redirection vers la connexion. */
  suite: string;
  /** Motif d'échec rapporté par la route de rappel, le cas échéant. */
  messageInitial?: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("auth");

  async function traiter(mode: AuthMode, donnees: FormData): Promise<string | void> {
    const supabase = creerClientNavigateur();
    const email = String(donnees.get("email") ?? "").trim();
    const motDePasse = String(donnees.get("motdepasse") ?? "");

    /* ---------------------------------------------------------- connexion */
    if (mode === "connexion") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      if (error) return messageLisible(error.message, t);

      /* Une case décochée n'apparaît pas dans le FormData : sa seule présence
         vaut « oui ». Voir `lib/session-navigateur.ts` pour la raison d'être
         des témoins — la bibliothèque ne laisse pas régler la durée du cookie
         de session elle-même. */
      marquerSession(donnees.has("memoriser"));

      /* `refresh()` en plus de la navigation : les composants serveur doivent
         être rejoués avec la session fraîche, sinon le tableau de bord se
         rendrait encore comme un visiteur anonyme. */
      router.replace(suite);
      router.refresh();
      return;
    }

    /* -------------------------------------------------------- inscription */
    /* Passe par notre route serveur et non par `supabase.auth.signUp` : le
       service d'envoi intégré de Supabase est plafonné à deux emails par
       heure, si bien qu'après deux inscriptions plus personne ne pouvait
       créer de compte. La route génère le lien côté Supabase puis l'expédie
       par notre SMTP. */
    const reponse = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        motDePasse,
        entreprise: String(donnees.get("entreprise") ?? "").trim(),
        nom: String(donnees.get("nom") ?? "").trim(),
        telephone: String(donnees.get("telephone") ?? "").trim(),
      }),
    });

    if (!reponse.ok) {
      const erreur = await reponse.json().catch(() => ({}));
      return typeof erreur.erreur === "string" ? erreur.erreur : t("inscriptionEchouee");
    }

    /* La réponse est volontairement la même qu'une adresse soit déjà inscrite
       ou non : le dire permettrait d'énumérer les clients de Nova Assist.

       Mais le message ne doit pas pour autant laisser quelqu'un sans issue :
       une personne déjà inscrite attendrait un email qui ne viendra pas. Il
       nomme donc les deux chemins sans révéler lequel s'applique. */
    return t("succesInscription");
  }

  return (
    <AuthSwitch
      modeInitial={modeInitial}
      messageInitial={messageInitial}
      onSubmit={traiter}
    />
  );
}
