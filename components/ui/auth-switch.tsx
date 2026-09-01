"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, Loader2, Mail, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/wordmark";

export type AuthMode = "connexion" | "inscription";

/* ------------------------------------------------------------------ champ */

type ChampProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icone: LucideIcon;
  /** Contenu aligné à droite du libellé — « Mot de passe oublié ? ». */
  action?: ReactNode;
};

/**
 * Champ sur fond sombre : libellé au-dessus, icône posée dans le champ, filet
 * qui passe à l'or au focus. Disposition reprise de la maquette
 * d'authentification fournie, avec les angles vifs de la charte Nova Assist.
 */
function Champ({ label, icone: Icone, action, className, id, ...props }: ChampProps) {
  const genere = useId();
  const champId = id ?? genere;

  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={champId} className="text-[14px] font-semibold text-white">
          {label}
        </label>
        {action}
      </div>
      <div className="relative flex items-center">
        <Icone
          aria-hidden
          size={17}
          className="pointer-events-none absolute left-[15px] text-white/45"
        />
        <input
          id={champId}
          className={cn(
            "w-full border border-white/15 bg-white/[0.04] py-[13px] pr-4 pl-[44px] text-[15px] text-white outline-none transition-colors placeholder:text-white/35 hover:border-white/25 focus:border-gold focus:bg-white/[0.07]",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

/** Champ mot de passe : même gabarit, plus la bascule œil à droite. */
function ChampMotDePasse({
  label = "Mot de passe",
  ...props
}: Omit<ChampProps, "icone" | "type" | "label"> & { label?: string }) {
  const [visible, setVisible] = useState(false);
  const Oeil = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Champ
        {...props}
        label={label}
        icone={KeyRound}
        type={visible ? "text" : "password"}
        className="pr-[46px]"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        tabIndex={-1}
        /* Ancré au bas du bloc : le libellé au-dessus rend `inset-y` inexact. */
        className="absolute right-[6px] bottom-[6px] p-[10px] text-white/45 transition-colors hover:text-gold"
      >
        <Oeil aria-hidden size={17} />
        <span className="sr-only">
          {visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ boutons */

import { ShinyButton } from "@/components/ui/shiny-button";

/** Bouton d'envoi du formulaire : blanc plein, comme sur la maquette. */
function BoutonEnvoi({ enCours, children }: { enCours: boolean; children: ReactNode }) {
  return (
    <ShinyButton
      type="submit"
      disabled={enCours}
      variant="outline"
      className="mt-1 flex items-center justify-center gap-2 !px-6 !py-[15px] !text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {enCours && <Loader2 aria-hidden size={17} className="animate-spin" />}
      {children}
    </ShinyButton>
  );
}

/** Bouton contour posé sur le disque doré — il déclenche la bascule. */
function BoutonBascule({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <ShinyButton
      type="button"
      onClick={onClick}
      variant="outline"
      className="!px-[26px] !py-[11px] !text-[15px]"
    >
      {children}
    </ShinyButton>
  );
}

/* ---------------------------------------------------------------- composant */

export interface AuthSwitchProps {
  /** Formulaire ouvert au premier rendu. */
  modeInitial?: AuthMode;
  /**
   * Message affiché d'emblée — sert à rapporter l'échec d'un lien de
   * confirmation, qui se produit avant que l'utilisateur ait rien soumis.
   */
  messageInitial?: string | null;
  /**
   * Branchement de l'authentification. Tant qu'aucune fonction n'est fournie,
   * le formulaire se limite à un état d'attente puis à un message : il ne crée
   * aucun compte et n'ouvre aucune session.
   *
   * La chaîne renvoyée, s'il y en a une, s'affiche sous le formulaire : c'est
   * par là que remontent les refus (identifiants erronés, email déjà pris) et
   * les confirmations qui n'entraînent pas de redirection.
   */
  onSubmit?: (
    mode: AuthMode,
    donnees: FormData,
  ) => Promise<string | void> | string | void;
  className?: string;
}

/**
 * Connexion et inscription sur un seul écran. Un disque doré balaie la page
 * d'un bord à l'autre — il recouvre tout à mi-parcours, puis se range du côté
 * opposé et découvre l'autre formulaire, qui entre une fois l'or passé.
 * Toute la mécanique tient dans les classes `na-auth*` de `globals.css`,
 * pilotées ici par `data-mode` : la préférence « mouvement réduit » du système
 * les neutralise sans code supplémentaire.
 */
export function AuthSwitch({
  modeInitial = "connexion",
  messageInitial = null,
  onSubmit,
  className,
}: AuthSwitchProps) {
  const [mode, setMode] = useState<AuthMode>(modeInitial);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(messageInitial);

  const connexion = mode === "connexion";

  function basculer(suivant: AuthMode) {
    setMode(suivant);
    setMessage(null);
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const donnees = new FormData(event.currentTarget);
    setMessage(null);
    setEnCours(true);
    try {
      if (onSubmit) {
        const retour = await onSubmit(mode, donnees);
        if (retour) setMessage(retour);
      } else {
        /* Attente simulée : un envoi doit toujours répondre au clic. */
        await new Promise((r) => setTimeout(r, 700));
        setMessage(
          connexion
            ? "L'espace client n'est pas encore raccordé. Écrivez-nous et nous ouvrons votre accès."
            : "Demande enregistrée côté interface. La création de compte sera activée à la mise en ligne de l'espace client.",
        );
      }
    } catch {
      /* Une panne réseau ne doit pas laisser le formulaire muet. */
      setMessage("La connexion au serveur a échoué. Vérifiez votre réseau et réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  /* Le message d'envoi appartient au formulaire affiché : il disparaît avec lui. */
  const retour = message && (
    <p
      role="alert"
      className="border border-gold/35 bg-gold/10 px-4 py-3 text-[14px] leading-[1.55] text-white/85"
    >
      {message}
    </p>
  );

  return (
    <div className={cn("na-auth", className)} data-mode={mode}>
      <span aria-hidden className="na-auth-disque" />

      {/* ------------------------------------------------------ formulaires */}
      <div className="na-auth-pile">
        <form
          onSubmit={soumettre}
          data-actif={connexion}
          inert={!connexion}
          aria-hidden={!connexion}
          className="na-auth-form flex flex-col gap-[18px]"
        >
          <div className="flex flex-col gap-5 self-start -ml-2 sm:-ml-6 mb-2">
            <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[14px]">
              <ArrowLeft size={16} /> Retour
            </Link>
            <Wordmark size={19} className="ml-2 sm:ml-6" />
          </div>
          <h1 className="text-[30px] leading-tight text-white lg:text-[36px]">Connexion</h1>

          <Champ
            label="Email"
            icone={Mail}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@entreprise.cm"
          />
          <ChampMotDePasse
            name="motdepasse"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            action={
              <Link
                href="/mot-de-passe-oublie"
                className="text-[14px] text-gold transition-opacity hover:opacity-80"
              >
                Mot de passe oublié ?
              </Link>
            }
          />
          <label className="flex items-start gap-3 text-[14px] leading-[1.5] text-white/70">
            <input
              type="checkbox"
              name="memoriser"
              className="mt-[2px] h-[17px] w-[17px] shrink-0 accent-[#C9A227]"
            />
            <span>Se souvenir de moi sur cet appareil</span>
          </label>

          <BoutonEnvoi enCours={enCours}>Se connecter</BoutonEnvoi>
          {connexion && retour}
        </form>

        <form
          onSubmit={soumettre}
          data-actif={!connexion}
          inert={connexion}
          aria-hidden={connexion}
          className="na-auth-form flex flex-col gap-[18px]"
        >
          <div className="flex flex-col gap-5 self-start -ml-2 sm:-ml-6 mb-2">
            <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[14px]">
              <ArrowLeft size={16} /> Retour
            </Link>
            <Wordmark size={19} className="ml-2 sm:ml-6" />
          </div>
          <h1 className="text-[30px] leading-tight text-white lg:text-[36px]">Inscription</h1>

          <Champ
            label="Nom et prénom"
            icone={User}
            name="nom"
            type="text"
            autoComplete="name"
            required
            placeholder="Madame Ngo Bassong"
          />
          <Champ
            label="Entreprise"
            icone={Building2}
            name="entreprise"
            type="text"
            autoComplete="organization"
            required
            placeholder="Clinique de la Dibamba"
          />
          <Champ
            label="Email"
            icone={Mail}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@entreprise.cm"
          />
          <ChampMotDePasse
            name="motdepasse"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
          />
          <label className="flex items-start gap-3 text-[14px] leading-[1.5] text-white/70">
            <input
              type="checkbox"
              name="conditions"
              required
              className="mt-[2px] h-[17px] w-[17px] shrink-0 accent-[#C9A227]"
            />
            <span>J&apos;accepte les conditions d&apos;utilisation et la confidentialité.</span>
          </label>

          <BoutonEnvoi enCours={enCours}>Créer mon compte</BoutonEnvoi>
          {!connexion && retour}
        </form>
      </div>

      {/* --------------------------------------------------------- panneaux */}
      <div className="na-auth-panneaux">
        <section
          data-actif={connexion}
          inert={!connexion}
          aria-hidden={!connexion}
          className="na-auth-panneau na-auth-panneau--gauche"
        >
          <h2 className="text-[24px] leading-tight text-navy lg:text-[30px]">
            Nouveau chez Nova&nbsp;Assist ?
          </h2>
          <p className="max-w-[34ch] text-[15px] leading-[1.55] text-navy/75 max-lg:hidden">
            Créez votre compte : vos demandes, vos rapports et vos factures se rangent au même
            endroit dès le premier jour.
          </p>
          <BoutonBascule onClick={() => basculer("inscription")}>Créer un compte</BoutonBascule>
        </section>

        <section
          data-actif={!connexion}
          inert={connexion}
          aria-hidden={connexion}
          className="na-auth-panneau na-auth-panneau--droite"
        >
          <h2 className="text-[24px] leading-tight text-navy lg:text-[30px]">Déjà un compte ?</h2>
          <p className="max-w-[34ch] text-[15px] leading-[1.55] text-navy/75 max-lg:hidden">
            Reprenez le fil : vos demandes en cours vous attendent dans votre espace client.
          </p>
          <BoutonBascule onClick={() => basculer("connexion")}>Se connecter</BoutonBascule>
        </section>
      </div>
    </div>
  );
}

export default AuthSwitch;
