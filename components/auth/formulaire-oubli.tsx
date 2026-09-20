"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, KeyRound, Loader2, Mail } from "lucide-react";

import { creerClientNavigateur } from "@/lib/supabase/client";
import { oublierTemoins } from "@/lib/session-navigateur";
import { ShinyButton } from "@/components/ui/shiny-button";

/**
 * Mot de passe oublié, en deux temps sur la même page.
 *
 *   1. L'adresse. Le serveur envoie un code à six chiffres — si un compte
 *      existe. Le retour est **volontairement identique** dans les deux cas :
 *      dire « adresse inconnue » permettrait à n'importe qui de vérifier si une
 *      entreprise est cliente de Nova Assist, sur un service qui vend de la
 *      confidentialité.
 *   2. Le code, et le nouveau mot de passe. Le code est la preuve que la
 *      personne lit bien la boîte email du compte ; sans lui, l'adresse seule
 *      suffirait à prendre n'importe quel compte.
 *
 * `verifyOtp` ouvre une session de récupération dans le navigateur, puis
 * `updateUser` pose le mot de passe. La personne est connectée dans la foulée.
 */
export function FormulaireOubli() {
  const router = useRouter();
  const [etape, setEtape] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function demanderCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await fetch("/api/mot-de-passe-oublie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      /* Même en cas d'échec réseau, on n'en dit pas plus : l'étape suivante
         reste la même, et « Renvoyer un code » permet de relancer. */
    } finally {
      setEnCours(false);
      setEtape("code");
    }
  }

  async function changerMotDePasse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    try {
      const supabase = creerClientNavigateur();

      const { error: erreurCode } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "recovery",
      });
      if (erreurCode) {
        setErreur("Code incorrect ou expiré. Vérifiez votre email, ou demandez un nouveau code.");
        return;
      }

      /* La session ouverte par le code doit survivre : un ancien témoin
         « session éphémère » ferait sinon tout effacer par le middleware à
         la première page. */
      oublierTemoins();

      const { error: erreurMdp } = await supabase.auth.updateUser({ password: motDePasse });
      if (erreurMdp) {
        setErreur("Le mot de passe n'a pas pu être enregistré. Réessayez.");
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

  const classeChamp =
    "w-full border border-white/15 bg-white/[0.04] py-[13px] pr-4 pl-[44px] text-[15px] text-white outline-none transition-colors placeholder:text-white/35 hover:border-white/25 focus:border-gold focus:bg-white/[0.07]";

  if (etape === "email") {
    return (
      /* POST explicite : avant l'hydratation, une soumission native serait un GET
         et mettrait l'adresse email dans l'URL. */
      <form method="post" onSubmit={demanderCode} className="flex flex-col gap-[18px]">
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
              className={classeChamp}
            />
          </div>
        </div>

        <ShinyButton
          type="submit"
          disabled={enCours}
          className="mt-1 flex items-center justify-center gap-2 !px-6 !py-[15px] !text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours && <Loader2 aria-hidden size={17} className="animate-spin" />}
          Recevoir un code
        </ShinyButton>
      </form>
    );
  }

  return (
    <form
      method="post"
      onSubmit={changerMotDePasse}
      className="flex flex-col gap-[18px]"
      aria-busy={enCours}
    >
      <p className="border border-gold/35 bg-gold/10 px-4 py-3 text-[14px] leading-[1.55] text-white/85">
        Si un compte existe pour <strong className="text-white">{email.trim()}</strong>, un code à
        six chiffres vient d&apos;y être envoyé. Pensez aux indésirables. Il est valable une heure.
      </p>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor="code-oubli" className="text-[14px] font-semibold text-white">
          Code reçu par email
        </label>
        <div className="relative flex items-center">
          <Hash aria-hidden size={17} className="pointer-events-none absolute left-[15px] text-white/45" />
          <input
            id="code-oubli"
            type="text"
            name="code"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6 chiffres"
            className={`${classeChamp} tracking-[0.3em]`}
          />
        </div>
      </div>

      <ChampMotDePasse
        id="mdp-nouveau"
        label="Nouveau mot de passe"
        value={motDePasse}
        onChange={setMotDePasse}
        placeholder="8 caractères minimum"
        classe={classeChamp}
      />
      <ChampMotDePasse
        id="mdp-confirmation"
        label="Confirmer le mot de passe"
        value={confirmation}
        onChange={setConfirmation}
        placeholder="Saisissez-le à nouveau"
        classe={classeChamp}
      />

      {erreur && (
        <p
          role="alert"
          className="border border-gold/35 bg-gold/10 px-4 py-3 text-[14px] leading-[1.55] text-white/85"
        >
          {erreur}
        </p>
      )}

      <ShinyButton
        type="submit"
        disabled={enCours}
        className="mt-1 flex items-center justify-center gap-2 !px-6 !py-[15px] !text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enCours && <Loader2 aria-hidden size={17} className="animate-spin" />}
        Enregistrer le mot de passe
      </ShinyButton>

      <button
        type="button"
        disabled={enCours}
        onClick={() => {
          setCode("");
          setErreur(null);
          setEtape("email");
        }}
        className="self-start text-[14px] text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
      >
        Renvoyer un code ou changer d&apos;adresse
      </button>
    </form>
  );
}

function ChampMotDePasse({
  id,
  label,
  value,
  onChange,
  placeholder,
  classe,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  classe: string;
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
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classe}
        />
      </div>
    </div>
  );
}
