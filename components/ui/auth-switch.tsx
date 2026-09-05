"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, Loader2, Mail, Phone, User } from "lucide-react";
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
  /** Précision sous le champ : à quoi sert la donnée demandée. */
  aide?: ReactNode;
};

/**
 * Champ sur fond sombre : libellé au-dessus, icône posée dans le champ, filet
 * qui passe à l'or au focus. Disposition reprise de la maquette
 * d'authentification fournie, avec les angles vifs de la charte Nova Assist.
 */
function Champ({ label, icone: Icone, action, aide, className, id, ...props }: ChampProps) {
  const genere = useId();
  const champId = id ?? genere;
  const aideId = `${champId}-aide`;

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
          aria-describedby={aide ? aideId : undefined}
          className={cn(
            "w-full border border-white/15 bg-white/[0.04] py-[13px] pr-4 pl-[44px] text-[15px] text-white outline-none transition-colors placeholder:text-white/35 hover:border-white/25 focus:border-gold focus:bg-white/[0.07]",
            className,
          )}
          {...props}
        />
      </div>
      {aide && (
        <p id={aideId} className="text-[13px] leading-[1.45] text-white/50">
          {aide}
        </p>
      )}
    </div>
  );
}

/** Champ mot de passe : même gabarit, plus la bascule œil à droite. */
function ChampMotDePasse({
  label,
  ...props
}: Omit<ChampProps, "icone" | "type" | "label"> & { label?: string }) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const Oeil = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Champ
        {...props}
        label={label ?? t("motDePasse")}
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
          {visible ? t("masquerMotDePasse") : t("afficherMotDePasse")}
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
  const t = useTranslations("auth");
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
        setMessage(connexion ? t("maquetteConnexion") : t("maquetteInscription"));
      }
    } catch {
      /* Une panne réseau ne doit pas laisser le formulaire muet. */
      setMessage(t("erreurReseau"));
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
              <ArrowLeft size={16} /> {t("retour")}
            </Link>
            <Wordmark size={19} className="ml-2 sm:ml-6" />
          </div>
          <h1 className="text-[30px] leading-tight text-white lg:text-[36px]">
            {t("connexionTitre")}
          </h1>

          <Champ
            label={t("email")}
            icone={Mail}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("emailPlaceholder")}
          />
          <ChampMotDePasse
            name="motdepasse"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder={t("motDePassePlaceholder")}
            action={
              <Link
                href="/mot-de-passe-oublie"
                className="text-[14px] text-gold transition-opacity hover:opacity-80"
              >
                {t("motDePasseOublie")}
              </Link>
            }
          />
          <label className="flex items-start gap-3 text-[14px] leading-[1.5] text-white/70">
            <input
              type="checkbox"
              name="memoriser"
              className="mt-[2px] h-[17px] w-[17px] shrink-0 accent-[#C9A227]"
            />
            <span>{t("memoriser")}</span>
          </label>

          <BoutonEnvoi enCours={enCours}>{t("seConnecter")}</BoutonEnvoi>
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
              <ArrowLeft size={16} /> {t("retour")}
            </Link>
            <Wordmark size={19} className="ml-2 sm:ml-6" />
          </div>
          <h1 className="text-[30px] leading-tight text-white lg:text-[36px]">
            {t("inscriptionTitre")}
          </h1>

          <Champ
            label={t("nom")}
            icone={User}
            name="nom"
            type="text"
            autoComplete="name"
            required
            placeholder={t("nomPlaceholder")}
          />
          <Champ
            label={t("entreprise")}
            icone={Building2}
            name="entreprise"
            type="text"
            autoComplete="organization"
            required
            placeholder={t("entreprisePlaceholder")}
          />
          <Champ
            label={t("email")}
            icone={Mail}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t("emailPlaceholder")}
          />
          <Champ
            label={t("whatsapp")}
            icone={Phone}
            name="telephone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={t("whatsappPlaceholder")}
            aide={t("whatsappAide")}
          />
          <ChampMotDePasse
            name="motdepasse"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t("motDePasseNouveauPlaceholder")}
          />
          <label className="flex items-start gap-3 text-[14px] leading-[1.5] text-white/70">
            <input
              type="checkbox"
              name="conditions"
              required
              className="mt-[2px] h-[17px] w-[17px] shrink-0 accent-[#C9A227]"
            />
            <span>{t("conditions")}</span>
          </label>

          <BoutonEnvoi enCours={enCours}>{t("creerCompte")}</BoutonEnvoi>
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
            {t("panneauNouveauTitre")}
          </h2>
          <p className="max-w-[34ch] text-[15px] leading-[1.55] text-navy/75 max-lg:hidden">
            {t("panneauNouveauTexte")}
          </p>
          <BoutonBascule onClick={() => basculer("inscription")}>
            {t("panneauNouveauCta")}
          </BoutonBascule>
        </section>

        <section
          data-actif={!connexion}
          inert={connexion}
          aria-hidden={connexion}
          className="na-auth-panneau na-auth-panneau--droite"
        >
          <h2 className="text-[24px] leading-tight text-navy lg:text-[30px]">
            {t("panneauDejaTitre")}
          </h2>
          <p className="max-w-[34ch] text-[15px] leading-[1.55] text-navy/75 max-lg:hidden">
            {t("panneauDejaTexte")}
          </p>
          <BoutonBascule onClick={() => basculer("connexion")}>
            {t("panneauDejaCta")}
          </BoutonBascule>
        </section>
      </div>
    </div>
  );
}

export default AuthSwitch;
