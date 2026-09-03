import type { Metadata } from "next";
import { FileText, MessageCircle, Phone, UserPlus } from "lucide-react";

import { creerClientServeur } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Statistiques",
};

/** Fenêtre glissante : « ce mois-ci » au sens des 30 derniers jours. */
const DEPUIS_30J = () => new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

type Mesure = {
  cle: string;
  libelle: string;
  aide: string;
  Icone: typeof Phone;
  ton: string;
  total: number | null;
  recent: number | null;
};

export default async function Statistiques() {
  const supabase = await creerClientServeur();
  const depuis = DEPUIS_30J();

  /* `head: true` avec `count: exact` ne rapatrie aucune ligne : seul le nombre
     traverse le réseau. Sur une liaison à ~500 ms l'aller-retour, transporter
     les lignes pour les compter côté serveur serait du gaspillage. */
  const compter = async (table: string, colonneDate: string, filtre?: [string, string]) => {
    let requete = supabase.from(table).select("*", { count: "exact", head: true });
    if (filtre) requete = requete.eq(filtre[0], filtre[1]);

    const [tout, recent] = await Promise.all([
      requete,
      (() => {
        let r = supabase.from(table).select("*", { count: "exact", head: true }).gte(colonneDate, depuis);
        if (filtre) r = r.eq(filtre[0], filtre[1]);
        return r;
      })(),
    ]);

    if (tout.error) return { total: null, recent: null, erreur: tout.error.message };
    return { total: tout.count ?? 0, recent: recent.count ?? 0, erreur: null };
  };

  const [devis, inscriptions, whatsapp, appels, brochure] = await Promise.all([
    compter("demandes_devis", "recue_le"),
    compter("profils", "cree_le", ["role", "client"]),
    compter("evenements", "cree_le", ["type", "whatsapp"]),
    compter("evenements", "cree_le", ["type", "appel"]),
    compter("evenements", "cree_le", ["type", "brochure"]),
  ]);

  const erreurs = [devis, inscriptions, whatsapp, appels, brochure]
    .map((m) => m.erreur)
    .filter((e): e is string => Boolean(e));

  const mesures: Mesure[] = [
    {
      cle: "devis",
      libelle: "Demandes de devis",
      aide: "Formulaire du site",
      Icone: FileText,
      ton: "attente",
      total: devis.total,
      recent: devis.recent,
    },
    {
      cle: "inscriptions",
      libelle: "Inscriptions",
      aide: "Comptes clients créés",
      Icone: UserPlus,
      ton: "cours",
      total: inscriptions.total,
      recent: inscriptions.recent,
    },
    {
      cle: "whatsapp",
      libelle: "Clics WhatsApp",
      aide: "Bouton flottant et liens",
      Icone: MessageCircle,
      ton: "succes",
      total: whatsapp.total,
      recent: whatsapp.recent,
    },
    {
      cle: "appels",
      libelle: "Appels lancés",
      aide: "Clics sur le numéro",
      Icone: Phone,
      ton: "neutre",
      total: appels.total,
      recent: appels.recent,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="na-eyebrow">Back-office</span>
        <h1 className="text-[28px] text-navy lg:text-[34px]">Statistiques</h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
          Les quatre conversions suivies par le cahier des charges. Le grand nombre est le
          cumul ; le second, les 30 derniers jours.
        </p>
      </div>

      {erreurs.length > 0 && (
        <div className="na-carte na-monte rounded-3xl p-5 shadow-sm">
          <p className="text-[15px] leading-[1.6] text-slate-mid">
            Certaines mesures ne sont pas encore disponibles :
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {Array.from(new Set(erreurs)).map((e) => (
              <li key={e} className="font-mono text-[13px] text-gold-ink">
                {e}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] text-muted">
            Jouez les migrations <code className="font-mono">004</code>,{" "}
            <code className="font-mono">005</code> et <code className="font-mono">006</code> dans
            Supabase → SQL Editor.
          </p>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mesures.map(({ cle, libelle, aide, Icone, ton, total, recent }, i) => (
          <div
            key={cle}
            style={{ "--na-delai": `${i * 70}ms` } as React.CSSProperties}
            className="na-carte na-carte-actif na-monte flex flex-col gap-3 rounded-3xl p-5 shadow-sm"
          >
            <span className={`na-statut na-statut-${ton} self-start`}>
              <Icone className="h-[14px] w-[14px]" aria-hidden />
              {libelle}
            </span>
            <dd className="flex items-baseline gap-2">
              <span className="font-serif text-[34px] leading-none text-navy">
                {total ?? "—"}
              </span>
              {recent !== null && recent > 0 && (
                <span className="text-[14px] text-gold-ink">+{recent} / 30 j</span>
              )}
            </dd>
            <dt className="text-[13px] text-gray-mid">{aide}</dt>
          </div>
        ))}
      </dl>

      <div className="na-carte na-monte flex flex-col gap-3 rounded-3xl p-6 shadow-sm">
        <h2 className="text-[19px] text-navy">Ce que ces chiffres ne disent pas</h2>
        <p className="text-[15px] leading-[1.6] text-slate-mid">
          Ce sont des <b>conversions</b>, pas de l&apos;audience : le nombre de visiteurs, les
          pages vues et les sources de trafic ne sont pas mesurés ici. Il faudrait pour cela un
          outil dédié — Plausible ou Umami, qui n&apos;installent pas de cookie et
          n&apos;imposent donc pas de bandeau de consentement.
        </p>
        <p className="text-[14px] text-muted">
          Téléchargements de la brochure : {brochure.total ?? "—"}. Aucune donnée personnelle
          n&apos;est conservée — ni adresse IP, ni identifiant de visiteur.
        </p>
      </div>
    </>
  );
}
