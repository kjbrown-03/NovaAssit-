"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";

import { preparerRelaisWhatsApp } from "@/lib/supabase/relais-activation";

/**
 * « Envoyer sur WhatsApp » — relais du lien d'activation depuis le back-office.
 *
 * Le clic demande au serveur de fabriquer un lien frais, puis ouvre WhatsApp
 * sur la conversation du client, message déjà rédigé. Il reste à appuyer sur
 * envoyer : c'est la ligne WhatsApp Business de Nova Assist qui expédie, donc
 * le client voit « Nova Assist » comme nom de discussion.
 *
 * Pourquoi le lien n'est pas préparé au chargement de la page : Supabase ne
 * garde qu'un jeton d'activation à la fois par compte. Fabriquer les liens de
 * toute la liste invaliderait ceux déjà relayés.
 */
export function BoutonRelaisWhatsApp({
  profilId,
  contactNom,
}: {
  profilId: string;
  contactNom: string;
}) {
  const [enCours, demarrer] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function relayer() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await preparerRelaisWhatsApp(profilId);

      if (!resultat.ok) {
        setMessage(resultat.message);
        return;
      }

      /* `noopener` : la page WhatsApp ne doit pas garder de prise sur le
         back-office qui l'a ouverte. */
      window.open(resultat.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={relayer}
        disabled={enCours}
        className="na-presse flex items-center gap-2 rounded-lg bg-whatsapp px-3 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <MessageCircle aria-hidden className="h-[15px] w-[15px]" />
        {enCours ? "Préparation…" : "Envoyer sur WhatsApp"}
      </button>

      {message && (
        <p role="status" className="max-w-[46ch] text-[13px] leading-[1.5] text-[#8f1b30]">
          {message}
        </p>
      )}

      <span className="sr-only">
        Prépare le message d&apos;activation pour {contactNom} et ouvre WhatsApp.
      </span>
    </div>
  );
}
