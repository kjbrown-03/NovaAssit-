"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { creerClientNavigateur } from "@/lib/supabase/client";

/** Définition du nouveau mot de passe, depuis la session ouverte par le lien. */
export function FormulaireNouveauMotDePasse() {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    try {
      const supabase = creerClientNavigateur();
      const { error } = await supabase.auth.updateUser({ password: motDePasse });
      if (error) {
        setErreur("La modification a échoué. Le lien a peut-être expiré — refaites une demande.");
        return;
      }
      router.replace("/espace-client");
      router.refresh();
    } catch {
      setErreur("La connexion au serveur a échoué. Vérifiez votre réseau et réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-[18px]">
      <Champ
        id="mdp-nouveau"
        label="Nouveau mot de passe"
        value={motDePasse}
        onChange={setMotDePasse}
        autoComplete="new-password"
        placeholder="8 caractères minimum"
      />
      <Champ
        id="mdp-confirmation"
        label="Confirmer le mot de passe"
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
        placeholder="Saisissez-le à nouveau"
      />

      {erreur && (
        <p
          role="alert"
          className="border border-gold/35 bg-gold/10 px-4 py-3 text-[14px] leading-[1.55] text-white/85"
        >
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="mt-1 flex items-center justify-center gap-2 border border-white/70 px-6 py-[15px] text-[16px] font-semibold text-white transition-colors hover:bg-white hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours && <Loader2 aria-hidden size={17} className="animate-spin" />}
        Enregistrer
      </button>
    </form>
  );
}

function Champ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[14px] font-semibold text-white">
        {label}
      </label>
      <div className="relative flex items-center">
        <KeyRound aria-hidden size={17} className="pointer-events-none absolute left-[15px] text-white/45" />
        <input
          id={id}
          type="password"
          required
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-white/15 bg-white/[0.04] py-[13px] pr-4 pl-[44px] text-[15px] text-white outline-none transition-colors placeholder:text-white/35 hover:border-white/25 focus:border-gold focus:bg-white/[0.07]"
        />
      </div>
    </div>
  );
}
