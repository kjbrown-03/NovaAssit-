"use client";

import { useState } from "react";
import Link from "next/link";

import { FormulesOrbite, type Periode } from "@/components/formules-orbite";
import { MOIS_FACTURES_A_L_ANNEE, formaterFcfa, type Formule } from "@/lib/content";

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: "mensuel", libelle: "Mensuel" },
  { valeur: "annuel", libelle: "Annuel — 2 mois offerts" },
];

/**
 * La bascule de périodicité et les formules.
 *
 * Les deux sont réunis dans un seul composant parce qu'ils partagent un état :
 * la bascule ouvre la page, les formules suivent juste en dessous, et rien
 * entre les deux n'a besoin d'être interactif. Un contexte pour deux voisins
 * immédiats coûterait plus qu'il ne rapporte.
 */
export function OffresTarifs({ formules }: { formules: Formule[] }) {
  const [periode, setPeriode] = useState<Periode>("mensuel");
  const annuel = periode === "annuel";

  return (
    <>
      {/* Reprend l'inset et le rythme de la section d'intro juste au-dessus :
          le `pt` remplace le `gap` dont la bascule bénéficiait quand elle était
          encore dans cette section. */}
      <div className="mx-auto max-w-[1180px] px-5 pt-[26px] pb-8 lg:px-14 lg:pb-10">
        <div
          role="group"
          aria-label="Périodicité de facturation"
          className="flex flex-wrap items-center gap-[14px]"
        >
          {PERIODES.map(({ valeur, libelle }) => {
            const actif = periode === valeur;
            return (
              <button
                key={valeur}
                type="button"
                onClick={() => setPeriode(valeur)}
                aria-pressed={actif}
                className={`rounded-full text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  actif
                    ? "bg-navy px-5 py-[10px] font-semibold text-white"
                    : "border border-line px-5 py-[9px] text-slate-mid hover:border-gold hover:text-navy"
                }`}
              >
                {libelle}
              </button>
            );
          })}
        </div>
      </div>

      <section data-reveal aria-labelledby="orbite-titre" className="mb-10 lg:mb-14">
        <h2 id="orbite-titre" className="sr-only">
          Choisir une formule
        </h2>

        {/* L'anneau 3D ne tient pas sous 640 px : à 390 px de large, deux
            faces voisines sont distantes de 79 px pour 98 px de largeur
            projetée — elles se recouvrent forcément, et les trois tarifs se
            superposent. Plutôt que de rogner l'effet jusqu'à l'illisible, le
            téléphone reçoit des cartes empilées, lisibles d'un coup d'œil. */}
        <div className="hidden sm:block">
          <FormulesOrbite formules={formules} periode={periode} />
        </div>

        <ul className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 sm:hidden">
          {formules.map((formule) => (
            <li key={formule.id}>
              <Link
                id={formule.id}
                href={`/paiement?formule=${formule.id}`}
                className={`flex flex-col gap-3 rounded-2xl bg-navy p-5 transition-colors ${
                  formule.miseEnAvant
                    ? "border-2 border-gold"
                    : "border border-gold/25 hover:border-gold/60"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-gold uppercase">
                    {formule.nom}
                  </span>
                  {formule.miseEnAvant && (
                    <span className="rounded-full bg-gold px-[9px] py-[2px] font-mono text-[9px] tracking-[0.12em] text-navy uppercase">
                      Le plus choisi
                    </span>
                  )}
                </span>

                <span className="flex items-baseline gap-2">
                  <span className="font-serif text-[30px] leading-none text-gold-soft">
                    {annuel
                      ? formaterFcfa(formule.montantMensuel * MOIS_FACTURES_A_L_ANNEE)
                      : formule.prixCourt}
                  </span>
                  <span className="font-mono text-[11px] text-gold-line">
                    {annuel ? "FCFA / an" : formule.unite}
                  </span>
                </span>

                <span aria-hidden className="h-px w-8 bg-gold" />

                <span className="text-[14px] leading-[1.5] text-white/70">
                  {formule.pourCourt}
                </span>

                <span className="mt-1 font-mono text-[11px] tracking-[0.12em] text-gold uppercase">
                  Choisir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
