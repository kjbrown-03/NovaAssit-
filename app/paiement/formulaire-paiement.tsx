"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCardForm } from "@/components/ui/credit-card-form";
import { creerCommande, type IdFormule } from "@/lib/supabase/commandes";

/**
 * Étape de paiement.
 *
 * Le formulaire de carte est ici une **interface**, pas un encaissement : rien
 * de ce qui est saisi n'est transmis au serveur. À la validation, seule la
 * formule part — le montant est relu côté serveur depuis le catalogue.
 *
 * L'encaissement réel passera par Tara — le cahier des charges prévoit
 * « Paiement en ligne des packages, via API Tara, dès formule choisie et compte
 * client créé » —, dont
 * l'intégration reste suspendue à la validation avec la cliente.
 */
export function FormulairePaiement({
  formule,
  nomFormule,
}: {
  formule: IdFormule;
  nomFormule: string;
}) {
  const [etat, setEtat] = useState<"saisie" | "envoi" | "enregistree">("saisie");
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    setEtat("envoi");
    setErreur(null);
    const retour = await creerCommande(formule);
    if (retour.ok) {
      setEtat("enregistree");
    } else {
      setErreur(retour.erreur);
      setEtat("saisie");
    }
  }

  if (etat === "enregistree") {
    return (
      <div className="mx-auto max-w-[60ch] border border-line bg-stone-50 p-8 lg:p-12">
        <p className="na-eyebrow">Souscription enregistrée</p>
        <h2 className="mt-4 text-[28px] leading-[1.15] text-navy lg:text-[36px]">
          Votre demande pour la formule {nomFormule} est prise en compte.
        </h2>
        <p className="mt-4 text-[16px] leading-[1.65] text-slate-mid">
          <strong>Aucun montant n&apos;a été débité.</strong> L&apos;encaissement en ligne
          n&apos;est pas encore actif : notre équipe vous contacte sous 24 h ouvrées pour
          finaliser le règlement.
        </p>
        <Link
          href="/espace-client"
          className="mt-6 inline-block bg-navy px-7 py-4 text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Retour à mon espace
        </Link>
      </div>
    );
  }

  return (
    <>
      {erreur && (
        <p
          role="alert"
          className="mx-auto mb-6 max-w-[1000px] border border-gold-line bg-gold-soft px-5 py-4 text-[15px] text-navy"
        >
          {erreur}
        </p>
      )}

      <CreditCardForm
        showSubmit
        submitLabel={etat === "envoi" ? "Enregistrement…" : "Valider la souscription"}
        onSubmit={() => {
          if (etat !== "envoi") void valider();
        }}
      />
    </>
  );
}
