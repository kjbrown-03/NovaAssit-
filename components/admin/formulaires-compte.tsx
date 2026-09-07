"use client";

import { useActionState } from "react";

import { changerEmail, changerMotDePasse, type EtatAction } from "@/lib/admin-actions";

const ETAT_INITIAL: EtatAction = { ok: false };

const CHAMP =
  "w-full border border-line bg-paper px-3 py-[10px] text-[15px] text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

const LABEL = "font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase";

const BOUTON =
  "na-presse self-start bg-navy px-5 py-[11px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60";

function Message({ etat }: { etat: EtatAction }) {
  if (!etat.message) return null;
  return (
    <p
      role="status"
      className={`border px-4 py-3 text-[14px] leading-[1.55] ${
        etat.ok
          ? "border-gold bg-gold-soft text-slate-deep"
          : "border-[#b0203a]/40 bg-[#b0203a]/5 text-[#b0203a]"
      }`}
    >
      {etat.message}
    </p>
  );
}

/**
 * Changement de mot de passe.
 *
 * L'ancien est redemandé et vérifié par une reconnexion côté serveur. Supabase
 * ne l'exige pas de lui-même : sans ce contrôle, une session laissée ouverte
 * sur un poste partagé suffirait à s'approprier le compte.
 */
export function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Message etat={etat} />

      <label className="flex flex-col gap-2" htmlFor="mdp-actuel">
        <span className={LABEL}>Mot de passe actuel</span>
        <input
          id="mdp-actuel"
          name="actuel"
          type="password"
          required
          autoComplete="current-password"
          className={CHAMP}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2" htmlFor="mdp-nouveau">
          <span className={LABEL}>Nouveau mot de passe</span>
          <input
            id="mdp-nouveau"
            name="nouveau"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={CHAMP}
          />
        </label>

        <label className="flex flex-col gap-2" htmlFor="mdp-confirmation">
          <span className={LABEL}>Confirmation</span>
          <input
            id="mdp-confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={CHAMP}
          />
        </label>
      </div>

      <button type="submit" disabled={enCours} className={BOUTON}>
        {enCours ? "Modification…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}

/**
 * Changement d'adresse.
 *
 * Supabase envoie un lien de confirmation à la nouvelle adresse ; l'ancienne
 * reste en vigueur tant qu'il n'est pas ouvert. C'est ce qui empêche de
 * détourner un compte en changeant simplement son adresse.
 */
export function FormulaireEmail({ actuel }: { actuel: string }) {
  const [etat, action, enCours] = useActionState(changerEmail, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Message etat={etat} />

      <p className="text-[15px] text-slate-mid">
        Adresse actuelle : <span className="font-mono text-[14px] text-navy">{actuel}</span>
      </p>

      <label className="flex flex-col gap-2" htmlFor="compte-email">
        <span className={LABEL}>Nouvelle adresse</span>
        <input
          id="compte-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@novaassist.cm"
          className={CHAMP}
        />
      </label>

      <button type="submit" disabled={enCours} className={BOUTON}>
        {enCours ? "Envoi…" : "Changer d'adresse"}
      </button>

      <p className="max-w-[62ch] text-[13px] leading-[1.5] text-muted">
        Un lien de confirmation part vers la nouvelle adresse. Tant qu&apos;il n&apos;est pas
        ouvert, vous continuez à vous connecter avec l&apos;ancienne.
      </p>
    </form>
  );
}
