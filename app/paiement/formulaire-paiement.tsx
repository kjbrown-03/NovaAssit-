"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

import { creerCommande, type IdFormule, type Periode } from "@/lib/supabase/commandes";

/**
 * Étape de paiement.
 *
 * Rien n'est saisi ici : le choix de l'opérateur, le numéro et le code PIN se
 * font sur la page hébergée par Fapshi, vers laquelle on redirige. Ce
 * formulaire n'envoie que la formule et la période — le montant est relu côté
 * serveur depuis les tarifs.
 */
export function FormulairePaiement({
  formule,
  periode,
  montantAffiche,
}: {
  formule: IdFormule;
  periode: Periode;
  montantAffiche: string;
}) {
  const [etat, setEtat] = useState<"pret" | "envoi" | "redirection">("pret");
  const [erreur, setErreur] = useState<string | null>(null);

  async function payer() {
    setEtat("envoi");
    setErreur(null);
    const retour = await creerCommande(formule, periode);
    if (retour.ok) {
      /* On reste en « redirection » le temps que le navigateur quitte la
         page : sans ça, le bouton redeviendrait cliquable une fraction de
         seconde et pourrait créer une deuxième commande. */
      setEtat("redirection");
      window.location.assign(retour.lien);
    } else {
      setErreur(retour.erreur);
      setEtat("pret");
    }
  }

  const occupe = etat !== "pret";

  return (
    <div className="mx-auto max-w-[60ch] border border-line bg-stone-50 p-8 lg:p-12" aria-busy={occupe}>
      <p className="na-eyebrow">Mobile Money</p>
      <h2 className="mt-4 text-[24px] leading-[1.2] text-navy lg:text-[30px]">
        Réglez {montantAffiche} depuis votre téléphone.
      </h2>

      <ol className="mt-6 flex flex-col gap-3 text-[15px] leading-[1.6] text-slate-mid">
        <li className="flex gap-3">
          <span className="font-mono text-[12px] text-gold-ink">01</span>
          Vous êtes redirigé vers notre page de paiement sécurisée, opérée par Fapshi.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-[12px] text-gold-ink">02</span>
          Vous choisissez MTN Mobile Money ou Orange Money et saisissez votre numéro.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-[12px] text-gold-ink">03</span>
          Vous validez avec votre code PIN sur votre téléphone. Votre souscription est active aussitôt.
        </li>
      </ol>

      {erreur && (
        <p
          role="alert"
          className="mt-6 border border-gold-line bg-gold-soft px-5 py-4 text-[15px] text-navy"
        >
          {erreur}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (!occupe) void payer();
        }}
        disabled={occupe}
        className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-3 bg-navy px-7 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        <Smartphone aria-hidden size={18} />
        {etat === "pret" && `Payer ${montantAffiche}`}
        {etat === "envoi" && "Préparation du paiement…"}
        {etat === "redirection" && "Redirection vers Fapshi…"}
      </button>

      <p className="mt-4 text-[13px] leading-[1.6] text-gray-mid">
        Le lien de paiement reste valable 24 heures. Aucun montant n&apos;est prélevé tant que
        vous n&apos;avez pas validé sur votre téléphone.
      </p>
    </div>
  );
}
