import type { Metadata } from "next";
import { AlertTriangle, Building2, Folder, Receipt, ShieldCheck, Users } from "lucide-react";

import { BoutonRelaisWhatsApp } from "@/components/admin/bouton-relais-whatsapp";
import { listerClients } from "@/lib/supabase/clients-admin";
import { formaterTelephone } from "@/lib/telephone";
import { libelleFormule } from "@/lib/supabase/espace-client";
import type { Formule } from "@/lib/supabase/espace-client";

export const metadata: Metadata = {
  title: "Comptes clients",
};

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function ComptesClients() {
  const { clients, erreur } = await listerClients();

  if (erreur) {
    return (
      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <h1 className="mb-3 text-[24px] text-navy">Comptes clients</h1>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Lecture impossible :{" "}
          <code className="font-mono text-[14px] text-gold-ink">{erreur}</code>
        </p>
        <p className="mt-3 text-[14px] text-muted">
          Jouez <code className="font-mono">supabase/005-admin-lecture.sql</code> dans Supabase →
          SQL Editor : sans ces politiques, RLS ne montre à l&apos;administration que sa propre
          ligne.
        </p>
      </section>
    );
  }

  const vraisClients = clients.filter((c) => c.role !== "admin");
  const impayes = vraisClients.filter((c) => c.nb_factures_impayees > 0).length;
  const sansFormule = vraisClients.filter((c) => !c.formule).length;

  const compteurs = [
    { libelle: "Comptes clients", valeur: vraisClients.length, ton: "cours", Icone: Users },
    { libelle: "Avec impayé", valeur: impayes, ton: "attente", Icone: Receipt },
    { libelle: "Formule à définir", valeur: sansFormule, ton: "neutre", Icone: Building2 },
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[28px] text-navy lg:text-[34px]">Comptes clients</h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {compteurs.map(({ libelle, valeur, ton, Icone }, i) => (
          <div
            key={libelle}
            style={{ "--na-delai": `${i * 70}ms` } as React.CSSProperties}
            className="na-carte na-carte-actif na-monte flex flex-col gap-3 rounded-3xl p-5 shadow-sm"
          >
            <span className={`na-statut na-statut-${ton} self-start`}>
              <Icone className="h-[14px] w-[14px]" aria-hidden />
              {libelle}
            </span>
            <dd className="font-serif text-[34px] leading-none text-navy">{valeur}</dd>
            <dt className="sr-only">{libelle}</dt>
          </div>
        ))}
      </dl>

      {clients.length === 0 ? (
        <p className="na-carte rounded-3xl px-6 py-10 text-center text-[15px] text-gray-mid shadow-sm">
          Aucun compte pour l&apos;instant. Les inscriptions depuis le site apparaîtront ici.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {clients.map((client, i) => (
            <li
              key={client.id}
              style={{ "--na-delai": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}
              className="na-carte na-carte-actif na-monte flex flex-col gap-4 rounded-3xl p-5 shadow-sm lg:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[18px] text-navy">{client.entreprise}</p>
                  <p className="text-[15px] text-slate-mid">{client.contact_nom}</p>
                  <p className="text-[13px] text-muted">Inscrit le {dateCourte(client.cree_le)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {client.role === "admin" && (
                    <span className="na-statut na-statut-succes">
                      <ShieldCheck className="h-[14px] w-[14px]" aria-hidden />
                      Administration
                    </span>
                  )}
                  <span
                    className={`na-statut ${client.formule ? "na-statut-cours" : "na-statut-neutre"}`}
                  >
                    {libelleFormule((client.formule as Formule | null) ?? null)}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <dt className="na-eyebrow">Demandes</dt>
                  <dd className="flex items-center gap-1.5 text-[15px] text-ink">
                    <Folder className="h-[15px] w-[15px] text-gold-ink" aria-hidden />
                    {client.nb_demandes}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="na-eyebrow">Commandes</dt>
                  <dd className="text-[15px] text-ink">{client.nb_commandes}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="na-eyebrow">Factures impayées</dt>
                  <dd
                    className={`flex items-center gap-1.5 text-[15px] ${
                      client.nb_factures_impayees > 0 ? "text-[#8f1b30]" : "text-ink"
                    }`}
                  >
                    {client.nb_factures_impayees > 0 && (
                      <AlertTriangle className="h-[15px] w-[15px]" aria-hidden />
                    )}
                    {client.nb_factures_impayees}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="na-eyebrow">Heures du mois</dt>
                  <dd className="text-[15px] text-ink">
                    {client.heures_incluses !== null
                      ? `${client.heures_consommees ?? 0} / ${client.heures_incluses} h`
                      : "—"}
                  </dd>
                </div>
              </dl>

              {/* Relais du lien d'activation. Proposé pour tout compte client
                  portant un numéro : le serveur refuse de lui-même si le compte
                  est déjà confirmé, plutôt que de laisser la liste deviner un
                  état qui vit dans `auth.users` et non dans `profils`. */}
              {client.role !== "admin" && client.telephone && (
                <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
                  <BoutonRelaisWhatsApp
                    profilId={client.id}
                    contactNom={client.contact_nom}
                  />
                  <span className="font-mono text-[12px] text-muted">
                    {formaterTelephone(client.telephone)}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[13px] text-muted italic">
        Lecture seule : le back-office consulte et suit, il ne réécrit pas l&apos;historique
        d&apos;un client. Les corrections passent par Supabase.
      </p>
    </>
  );
}
