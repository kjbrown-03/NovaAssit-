"use client";

import { useActionState } from "react";

import { enregistrerTarifs, type EtatAction } from "@/lib/admin-actions";
import type { Formule } from "@/lib/content";

const ETAT_INITIAL: EtatAction = { ok: false };

const CHAMP =
  "w-full border border-line bg-paper px-3 py-[10px] font-mono text-[16px] text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

const LABEL = "font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase";

/**
 * Modification des tarifs.
 *
 * Les trois montants sont édités ensemble : changer une grille de prix, c'est
 * presque toujours arbitrer entre les formules, pas retoucher un chiffre isolé.
 */
export function FormulaireTarifs({ formules }: { formules: Formule[] }) {
  const [etat, action, enCours] = useActionState(enregistrerTarifs, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5">
      {etat.message && (
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
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {formules.map((formule) => (
          <label key={formule.id} className="flex flex-col gap-2" htmlFor={`tarif-${formule.id}`}>
            <span className={LABEL}>{formule.nom}</span>
            <input
              id={`tarif-${formule.id}`}
              name={formule.id}
              type="text"
              inputMode="numeric"
              /* La saisie tolère les espaces : « 165 000 » est ce qu'on lit sur
                 le site, l'exiger sans espaces serait une chausse-trape. */
              defaultValue={formule.prixCourt}
              className={CHAMP}
            />
            <span className="text-[12px] text-muted">{formule.unite}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="na-presse bg-navy px-5 py-[11px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer les tarifs"}
        </button>
        <span className="max-w-[52ch] text-[13px] leading-[1.5] text-muted">
          Le changement s&apos;applique immédiatement à l&apos;accueil, aux offres, au devis et
          au paiement.
        </span>
      </div>
    </form>
  );
}
