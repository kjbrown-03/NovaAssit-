import type { Metadata } from "next";

import { FormulaireEmail, FormulaireMotDePasse } from "@/components/admin/formulaires-compte";
import { identiteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminParametres() {
  /* Le layout a déjà refusé l'accès à un non-administrateur ; cette lecture ne
     sert qu'à afficher l'adresse en cours. */
  const admin = await identiteAdmin();

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[26px] leading-[1.15] text-navy lg:text-[30px]">Paramètres</h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          Les identifiants du compte d&apos;administration. Ces changements ne concernent que
          vous — ils n&apos;affectent aucun compte client.
        </p>
      </div>

      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm lg:p-8">
        <h2 className="mb-5 text-[20px] text-navy">Mot de passe</h2>
        <FormulaireMotDePasse />
      </section>

      <section className="na-carte na-monte rounded-3xl p-6 shadow-sm lg:p-8">
        <h2 className="mb-5 text-[20px] text-navy">Adresse email</h2>
        <FormulaireEmail actuel={admin?.email ?? ""} />
      </section>

      <section className="na-carte rounded-2xl border border-line-soft p-5 text-[14px] leading-[1.6] text-slate-mid">
        <p>
          Le rôle administrateur se donne en base, pas depuis cette page : un compte qui
          pourrait s&apos;attribuer ses propres droits ne protégerait plus rien. Pour promouvoir
          un compte, passez par Supabase → Table Editor → <code className="font-mono">profils</code>{" "}
          → colonne <code className="font-mono">role</code>.
        </p>
      </section>
    </>
  );
}
