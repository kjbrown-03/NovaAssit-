"use client";

import { useRouter } from "next/navigation";
import { AuthSwitch, type AuthMode } from "@/components/ui/auth-switch";
import { creerClientNavigateur } from "@/lib/supabase/client";

/**
 * Traduit les refus renvoyés par Supabase, qui arrivent en anglais et dans une
 * formulation technique. La liste couvre les cas courants ; le reste retombe
 * sur un message générique plutôt que d'exposer l'original.
 */
function messageLisible(brut: string): string {
  const m = brut.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Votre adresse n'est pas encore confirmée. Ouvrez le lien reçu par email.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse. Connectez-vous plutôt.";
  }
  if (m.includes("password") && m.includes("6 characters")) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }
  return "La demande n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.";
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
      if (error) return messageLisible(error.message);

      /* `refresh()` en plus de la navigation : les composants serveur doivent
         être rejoués avec la session fraîche, sinon le tableau de bord se
         rendrait encore comme un visiteur anonyme. */
      router.replace(suite);
      router.refresh();
      return;
    }

    /* -------------------------------------------------------- inscription */
    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        /* Ces clés sont lues telles quelles par le déclencheur SQL
           `gerer_nouveau_compte` pour remplir la table `profils`. */
        data: {
          entreprise: String(donnees.get("entreprise") ?? "").trim(),
          contact_nom: String(donnees.get("nom") ?? "").trim(),
        },
        /* Le lien de confirmation doit revenir sur la route de rappel, seule
           capable d'échanger le code contre une session et de poser les
           cookies. Une page ordinaire ignorerait le code. */
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/espace-client`,
      },
    });
    if (error) return messageLisible(error.message);

    /* Sans session, c'est que la confirmation par email est exigée — réglage
       par défaut de Supabase, et le bon pour un service qui promet de la
       confidentialité. */
    if (!data.session) {
      return "Compte créé. Ouvrez le lien de confirmation envoyé à votre adresse pour activer votre accès.";
    }

    router.replace("/espace-client");
    router.refresh();
  }

  return (
    <AuthSwitch
      modeInitial={modeInitial}
      messageInitial={messageInitial}
      onSubmit={traiter}
    />
  );
}
