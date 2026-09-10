import { Download, MessageCircle, Send } from "lucide-react";

import { etablirDevis } from "@/lib/supabase/devis-actions";
import { referenceDemande, type DemandeDevis } from "@/lib/supabase/devis";
import { formaterTelephone, lienWhatsApp, normaliserTelephone } from "@/lib/telephone";

const montantFr = (fcfa: number) => new Intl.NumberFormat("fr-FR").format(fcfa);

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Poser un prix sur une demande, puis l'envoyer.
 *
 * Une demande de devis arrive quand aucune formule ne convient : le montant se
 * décide, il ne se calcule pas. L'administration n'a donc qu'un champ à
 * remplir — le reste du document se déduit de ce que le prospect a déjà saisi.
 *
 * Le message part sur WhatsApp avec un LIEN vers la proposition, pas avec le
 * fichier : `wa.me` ne transporte que du texte, et joindre un fichier par
 * programme exige l'API WhatsApp Business. Le prospect ouvre le lien et
 * télécharge le PDF depuis la page.
 */
export function ChiffrerDevis({
  devis,
  origine,
}: {
  devis: DemandeDevis;
  origine: string;
}) {
  /* `select("*")` ne renvoie pas une colonne qui n'existe pas encore : sans
     ce garde-fou, tant que la migration 012 n'est pas jouée, le formulaire
     s'afficherait normalement et produirait des liens « /proposition/undefined ».
     Mieux vaut dire quoi faire. */
  if (!devis.jeton) {
    return (
      <p className="border-t border-line-soft pt-4 text-[14px] text-slate-mid">
        Chiffrage indisponible : jouez{" "}
        <code className="font-mono text-[13px] text-gold-ink">
          supabase/012-devis-chiffre.sql
        </code>{" "}
        dans Supabase → SQL Editor.
      </p>
    );
  }

  const chiffre = devis.montant_fcfa != null;
  const reference = referenceDemande(String(devis.id), new Date(devis.recue_le));
  const lienProposition = `${origine}/proposition/${devis.jeton}`;

  const numero = devis.telephone ? normaliserTelephone(devis.telephone) : null;

  const etabliLe = devis.devis_etabli_le ?? devis.recue_le;
  const expire = new Date(etabliLe);
  expire.setDate(expire.getDate() + (devis.validite_jours ?? 30));

  const message =
    `Bonjour ${devis.contact_nom.split(/\s+/)[0] || ""}, ici Nova Assist.\n\n` +
    `Voici votre devis ${reference} :\n${lienProposition}\n\n` +
    `Vous pouvez le consulter et le télécharger en PDF. ` +
    `Il est valable jusqu'au ${dateFr(expire.toISOString())}.`;

  return (
    <div className="flex flex-col gap-4 border-t border-line-soft pt-4">
      <form action={etablirDevis} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={devis.id} />

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[170px] flex-col gap-1">
            <span className="na-eyebrow">Montant proposé</span>
            <span className="flex items-center gap-2">
              <input
                name="montant"
                type="text"
                inputMode="numeric"
                required
                defaultValue={devis.montant_fcfa ?? ""}
                placeholder="245000"
                className="w-[130px] border border-line px-3 py-2 text-[15px] text-navy outline-none focus:border-gold"
              />
              <span className="text-[14px] text-gray-mid">FCFA / mois</span>
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="na-eyebrow">Validité</span>
            <span className="flex items-center gap-2">
              <input
                name="validite"
                type="number"
                min={1}
                max={365}
                defaultValue={devis.validite_jours ?? 30}
                className="w-[74px] border border-line px-3 py-2 text-[15px] text-navy outline-none focus:border-gold"
              />
              <span className="text-[14px] text-gray-mid">jours</span>
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="na-eyebrow">Ce que couvre ce montant</span>
          <textarea
            name="prestation"
            rows={3}
            defaultValue={devis.prestation ?? ""}
            placeholder="Prise en charge de la relation client sur WhatsApp et par téléphone, six jours sur sept, avec relance des impayés."
            className="min-h-[76px] border border-line px-3 py-2 text-[15px] text-navy outline-none placeholder:text-muted focus:border-gold"
          />
        </label>

        <button
          type="submit"
          className="na-presse self-start bg-navy px-5 py-[10px] text-[14px] font-semibold text-white transition-colors hover:bg-gold hover:text-navy"
        >
          {chiffre ? "Mettre à jour le devis" : "Établir le devis"}
        </button>
      </form>

      {chiffre && (
        <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
          <p className="text-[15px] text-navy">
            Devis de{" "}
            <strong className="font-semibold">{montantFr(devis.montant_fcfa!)} FCFA</strong>{" "}
            <span className="text-gray-mid">
              — établi le {dateFr(etabliLe)}, valable jusqu&apos;au {dateFr(expire.toISOString())}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {numero ? (
              <a
                href={lienWhatsApp(numero, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="na-presse flex items-center gap-2 bg-[#25D366] px-5 py-[10px] text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Send aria-hidden size={16} />
                Envoyer sur WhatsApp
              </a>
            ) : (
              <span className="flex items-center gap-2 text-[14px] text-[#8f1b30]">
                <MessageCircle aria-hidden size={16} />
                Aucun numéro : cette demande date d&apos;avant le champ téléphone.
              </span>
            )}

            <a
              href={`/proposition/${devis.jeton}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="na-presse flex items-center gap-2 border border-navy px-5 py-[10px] text-[14px] text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <Download aria-hidden size={16} />
              Télécharger le PDF
            </a>

            <a
              href={`/proposition/${devis.jeton}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-gold-ink underline-offset-4 hover:underline"
            >
              Voir la page du prospect
            </a>
          </div>

          {numero && (
            <p className="text-[13px] text-muted">
              Destinataire : {formaterTelephone(numero)}. Le message s&apos;ouvre rédigé dans
              WhatsApp ; c&apos;est vous qui appuyez sur envoyer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
