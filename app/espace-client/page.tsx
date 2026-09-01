import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { whatsappLink } from "@/lib/content";
import { ShinyButton } from "@/components/ui/shiny-button";
import { FormulaireTemoignage } from "@/components/espace-client/formulaire-temoignage";
import { BoutonDeconnexion } from "@/components/espace-client/bouton-deconnexion";
import { MAX_ACCUEIL } from "@/lib/temoignages/types";
import {
  chargerTableauDeBord,
  dateCourte,
  dateEcheance,
  libelleFormule,
  libelleStatut,
  montant,
  semaineCourante,
  STYLE_STATUT,
} from "@/lib/supabase/espace-client";

export const metadata: Metadata = {
  title: "Espace client",
  description: "Suivi de vos demandes, documents, factures et rapports Nova Assist.",
  robots: { index: false },
};

const NAV = [
  "Tableau de bord",
  "Mes demandes",
  "Documents",
  "Factures",
  "Rapports",
  "Mon témoignage",
  "Mon abonnement",
];

export default async function EspaceClient() {
  const { profil, demandes, documents, prochaineFacture, enCours, prioritaires } =
    await chargerTableauDeBord();

  /* Le middleware garantit une session ; le profil, lui, peut manquer si le
     déclencheur SQL n'a pas tourné. On le dit plutôt que d'afficher un vide. */
  const entreprise = profil?.entreprise ?? "Profil incomplet";
  const prenomOuNom = profil?.contact_nom?.trim();

  const heuresIncluses = profil?.heures_incluses ?? null;
  const heuresConsommees = profil?.heures_consommees ?? null;
  const ratioHeures =
    heuresIncluses && heuresConsommees !== null && heuresIncluses > 0
      ? Math.min(Math.round((heuresConsommees / heuresIncluses) * 100), 100)
      : null;

  return (
    <main
      id="contenu"
      className="mx-auto grid max-w-[1180px] lg:min-h-[780px] lg:grid-cols-[250px_1fr]"
    >
      {/* ------------------------------------------------------------ latérale */}
      <div className="flex flex-col gap-6 bg-navy py-[26px] lg:gap-[30px]">
        <div className="px-6">
          <Wordmark size={19} />
        </div>

        <nav aria-label="Espace client">
          {/* Sur mobile la latérale devient une barre d'onglets défilante. */}
          <ul className="na-scroll flex overflow-x-auto px-3 lg:flex-col lg:overflow-visible lg:px-0">
            {NAV.map((item, i) => (
              <li key={item} className="shrink-0">
                <Link
                  href={item === "Mon témoignage" ? "#temoignage" : "#"}
                  aria-current={i === 0 ? "page" : undefined}
                  className={`block px-6 py-[13px] text-[15px] whitespace-nowrap ${
                    i === 0 ? "bg-gold text-navy" : "text-white/72 hover:text-gold"
                  }`}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-gold/20 px-6 pt-5">
          <span className="text-[15px] text-white">{entreprise}</span>
          <span className="text-[14px] text-white/50">{libelleFormule(profil?.formule ?? null)}</span>
          <BoutonDeconnexion />
        </div>
      </div>

      {/* -------------------------------------------------------------- contenu */}
      <div className="flex flex-col gap-7 px-5 py-8 lg:gap-[30px] lg:px-10 lg:pt-[34px] lg:pb-11">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start lg:gap-6">
          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[28px] text-navy lg:text-[34px]">
              {prenomOuNom ? `Bonjour, ${prenomOuNom}` : "Bonjour"}
            </h1>
            <p className="text-[15px] text-gray-mid lg:text-[16px]">{semaineCourante()}</p>
          </div>
          <ShinyButton href="/devis" className="!px-[22px] !py-3 !text-[15px]">
            Nouvelle demande
          </ShinyButton>
        </div>

        {!profil && (
          <p
            role="alert"
            className="border border-gold-line bg-gold-soft px-5 py-4 text-[15px] leading-[1.6] text-navy"
          >
            Votre fiche entreprise n&apos;a pas encore été créée. Écrivez-nous sur WhatsApp et
            nous la complétons — vos demandes resteront visibles ici ensuite.
          </p>
        )}

        {/* ---------------------------------------------------------- indicateurs */}
        <section className="bg-navy">
          <h2 className="sr-only">Vos indicateurs du mois</h2>
          <dl className="grid sm:grid-cols-3">
            <div className="flex flex-col gap-[9px] border-b border-gold/20 px-6 py-[26px] sm:border-r sm:border-b-0">
              <dt className="text-[14px] text-white/62">Heures consommées</dt>
              {ratioHeures === null ? (
                <>
                  <dd className="font-serif text-[34px] text-gold">—</dd>
                  <p className="text-[14px] text-white/50">Suivi pas encore ouvert</p>
                </>
              ) : (
                <>
                  <dd className="font-serif text-[34px] text-gold">
                    {heuresConsommees}{" "}
                    <span className="text-[17px] text-white/50">/ {heuresIncluses} h</span>
                  </dd>
                  <div
                    role="progressbar"
                    aria-valuenow={heuresConsommees ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={heuresIncluses ?? 0}
                    aria-label="Heures consommées sur le forfait"
                    className="h-1 bg-white/15"
                  >
                    <div className="h-1 bg-gold" style={{ width: `${ratioHeures}%` }} />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-[9px] border-b border-gold/20 px-6 py-[26px] sm:border-r sm:border-b-0">
              <dt className="text-[14px] text-white/62">Demandes en cours</dt>
              <dd className="font-serif text-[34px] text-gold">{enCours}</dd>
              <p className="text-[14px] text-white/50">
                {prioritaires > 0
                  ? `Dont ${prioritaires} prioritaire${prioritaires > 1 ? "s" : ""}`
                  : "Aucune prioritaire"}
              </p>
            </div>

            <div className="flex flex-col gap-[9px] px-6 py-[26px]">
              <dt className="text-[14px] text-white/62">Prochaine facture</dt>
              {prochaineFacture ? (
                <>
                  <dd className="font-serif text-[34px] text-gold">
                    {montant(prochaineFacture.montant_fcfa)} F
                  </dd>
                  <p className="text-[14px] text-white/50">
                    Échéance le {dateEcheance(prochaineFacture.echeance)}
                  </p>
                </>
              ) : (
                <>
                  <dd className="font-serif text-[34px] text-gold">—</dd>
                  <p className="text-[14px] text-white/50">Aucune facture en attente</p>
                </>
              )}
            </div>
          </dl>
        </section>

        {/* -------------------------------------------------------------- demandes */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] text-navy lg:text-[26px]">Mes demandes</h2>
            {demandes.length > 0 && (
              <Link href="#" className="border-b border-gold pb-[2px] text-[15px] text-navy">
                Tout voir
              </Link>
            )}
          </div>

          {demandes.length === 0 ? (
            <div className="border border-line bg-stone-50 px-6 py-10 text-center">
              <p className="text-[16px] text-slate-mid">
                Aucune demande pour l&apos;instant.
              </p>
              <p className="mt-2 text-[15px] text-gray-mid">
                Celles que vous nous adressez apparaîtront ici, avec leur statut.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-stone-50 font-mono text-[11px] tracking-[0.12em] text-gold-ink uppercase">
                    <th scope="col" className="px-[22px] py-[14px] font-normal">Réf.</th>
                    <th scope="col" className="px-[22px] py-[14px] font-normal">Objet</th>
                    <th scope="col" className="px-[22px] py-[14px] font-normal">Reçue le</th>
                    <th scope="col" className="px-[22px] py-[14px] font-normal">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((demande, i) => (
                    <tr
                      key={demande.id}
                      className={i < demandes.length - 1 ? "border-b border-line-soft" : ""}
                    >
                      <th
                        scope="row"
                        className="px-[22px] py-[18px] font-mono text-[13px] font-normal text-muted-light"
                      >
                        {demande.reference}
                      </th>
                      <td className="px-[22px] py-[18px] text-[15px] text-ink">{demande.objet}</td>
                      <td className="px-[22px] py-[18px] text-[15px] text-gray-mid">
                        {dateCourte(demande.recue_le)}
                      </td>
                      <td className="px-[22px] py-[18px]">
                        <span
                          className={`inline-block px-[10px] py-[5px] text-[13px] ${
                            STYLE_STATUT[demande.statut]
                          }`}
                        >
                          {libelleStatut(demande.statut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ------------------------------------------------- documents + contact */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <section className="flex flex-col gap-4 border border-line p-6">
            <h2 className="text-[22px] text-navy">Derniers documents</h2>
            {documents.length === 0 ? (
              <p className="text-[15px] leading-[1.6] text-gray-mid">
                Vos rapports, factures et contrats signés se rangeront ici.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 text-[15px]">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex justify-between gap-4 text-ink-700">
                    <span>{doc.titre}</span>
                    {/* Lien signé à générer à la demande — voir §6.4 : un PDF de
                        facture ne doit pas rester accessible indéfiniment. */}
                    <span className="shrink-0 text-muted-light">PDF</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-[14px] border border-line p-6">
            <h2 className="text-[22px] text-navy">Votre interlocutrice</h2>
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 font-mono text-[9px] text-gold-ink"
              >
                1:1
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="text-[17px] text-navy">Nom à compléter</span>
                <span className="text-[14px] text-gray-mid">Assistante senior · 6j / 7</span>
              </span>
            </div>
            <ShinyButton
              href={whatsappLink("Bonjour, je vous écris depuis mon espace client Nova Assist.")}
              external
              className="mt-auto w-full !p-[13px] !text-[15px]"
            >
              Écrire sur WhatsApp
            </ShinyButton>
          </section>
        </div>

        {/* ---------------------------------------------------------- témoignage */}
        <section id="temoignage" className="flex flex-col gap-5 border border-line p-6 lg:p-8">
          <div className="flex flex-col gap-2">
            <span className="na-eyebrow">Votre retour</span>
            <h2 className="text-[22px] text-navy lg:text-[26px]">Partager un témoignage</h2>
            <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
              Écrit ou filmé, votre retour aide les entreprises qui hésitent encore. Il est relu
              par notre équipe avant publication, et la page d&apos;accueil en présente{" "}
              {MAX_ACCUEIL} au maximum.
            </p>
          </div>
          <FormulaireTemoignage />
        </section>
      </div>
    </main>
  );
}
