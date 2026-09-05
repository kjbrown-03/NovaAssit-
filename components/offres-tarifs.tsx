"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { FormulesOrbite, type Periode } from "@/components/formules-orbite";
import type { Formule } from "@/lib/content";

/* Les libellés vivent dans les fichiers de messages : seule la liste des
   valeurs, qui ne change pas avec la langue, reste ici. */
const PERIODES: Periode[] = ["mensuel", "annuel"];

/**
 * La bascule de périodicité et les formules.
 *
 * Les deux sont réunis dans un seul composant parce qu'ils partagent un état :
 * la bascule ouvre la page, les formules suivent juste en dessous, et rien
 * entre les deux n'a besoin d'être interactif. Un contexte pour deux voisins
 * immédiats coûterait plus qu'il ne rapporte.
 */
export function OffresTarifs({ formules }: { formules: Formule[] }) {
  const t = useTranslations("pageOffres");
  const [periode, setPeriode] = useState<Periode>("mensuel");

  return (
    <>
      {/* Reprend l'inset et le rythme de la section d'intro juste au-dessus :
          le `pt` remplace le `gap` dont la bascule bénéficiait quand elle était
          encore dans cette section. */}
      <div className="mx-auto max-w-[1180px] px-5 pt-[26px] pb-8 lg:px-14 lg:pb-10">
        <div
          role="group"
          aria-label={t("periodicite")}
          className="flex flex-wrap items-center gap-[14px]"
        >
          {PERIODES.map((valeur) => {
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
                {t(valeur)}
              </button>
            );
          })}
        </div>
      </div>

      <section data-reveal aria-labelledby="orbite-titre" className="mb-10 lg:mb-14">
        <h2 id="orbite-titre" className="sr-only">
          {t("choisirFormule")}
        </h2>

        {/* L'anneau tourne aussi sur téléphone : c'est là qu'il est né, et le
            glissement au pouce est le geste pour lequel il est fait. Les faces
            se recouvrent partiellement sur un écran étroit — c'est l'aspect
            voulu, la profondeur 3D plaçant la face centrale au premier plan.
            Les dimensions sont resserrées sous 480 px dans `globals.css`. */}
        <FormulesOrbite formules={formules} periode={periode} />
      </section>
    </>
  );
}
