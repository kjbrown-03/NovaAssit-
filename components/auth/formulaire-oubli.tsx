"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";

/**
 * Demande de réinitialisation.
 *
 * Le retour est **volontairement identique** que l'adresse existe ou non : dire
 * « cette adresse est inconnue » permettrait à n'importe qui de vérifier si une
 * entreprise est cliente de Nova Assist. Ce serait une fuite, sur un service
 * qui vend de la confidentialité.
 */
export function FormulaireOubli() {
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnCours(true);
    try {
      const supabase = creerClientNavigateur();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/mot-de-passe-nouveau`,
      });
    } catch {
      /* Même en cas d'échec réseau, on n'en dit pas plus : le message ci-dessous
         reste le même. L'utilisateur peut relancer. */
    } finally {
      setEnCours(false);
      setEnvoye(true);
    }
  }

  if (envoye) {
    return (
      <p className="border border-gold/35 bg-gold/10 px-5 py-4 text-[15px] leading-[1.6] text-white/85">
        Si un compte existe pour cette adresse, un lien de réinitialisation vient d&apos;y être
        envoyé. Il est valable une heure.
      </p>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="email-oubli" className="text-[14px] font-semibold text-white">
          Email
        </label>
        <div className="relative flex items-center">
          <Mail aria-hidden size={17} className="pointer-events-none absolute left-[15px] text-white/45" />
          <input
            id="email-oubli"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.cm"
            className="w-full border border-white/15 bg-white/[0.04] py-[13px] pr-4 pl-[44px] text-[15px] text-white outline-none transition-colors placeholder:text-white/35 hover:border-white/25 focus:border-gold focus:bg-white/[0.07]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={enCours}
        className="mt-1 flex items-center justify-center gap-2 border border-white/70 px-6 py-[15px] text-[16px] font-semibold text-white transition-colors hover:bg-white hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours && <Loader2 aria-hidden size={17} className="animate-spin" />}
        Envoyer le lien
      </button>
    </form>
  );
}
