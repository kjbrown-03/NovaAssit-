import type { Metadata } from "next";

import { FormulaireTarifs } from "@/components/admin/formulaire-tarifs";
import { chargerFormules } from "@/lib/tarifs";

export const metadata: Metadata = {
  title: "Tarifs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTarifs() {
  const formules = await chargerFormules();

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[26px] leading-[1.15] text-navy lg:text-[30px]">Tarifs</h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          Le montant mensuel de chaque formule. Les intitulés et les prestations incluses
          restent dans le code : ce sont des textes de marque, pas des variables commerciales.
        </p>
      </div>

      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm">
        <FormulaireTarifs formules={formules} />
      </section>

      <section className="na-carte rounded-2xl border border-line-soft p-5 text-[14px] leading-[1.6] text-slate-mid">
        <p>
          Un changement de tarif ne touche pas les souscriptions déjà enregistrées : elles
          gardent le montant en vigueur au moment de la commande. Seul ce qui est proposé aux
          nouveaux clients évolue.
        </p>
      </section>
    </>
  );
}
