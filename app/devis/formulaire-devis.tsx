"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { ProfilConnu } from "@/lib/supabase/profil";
import {
  CANAUX,
  EFFECTIFS,
  FORMULES,
  SECTEURS,
  SERVICES,
  type Formule,
} from "@/lib/content";
import { ShinyButton } from "@/components/ui/shiny-button";

/* Les quatre étapes n'existent plus que par leur nombre : les intitulés
   viennent des fichiers de messages. */
const NB_ETAPES = 4;

type Donnees = {
  entreprise: string;
  secteur: string;
  effectif: string;
  domaines: string[];
  canaux: string[];
  precision: string;
  messagesParJour: string;
  plage: string;
  contactNom: string;
  email: string;
  telephone: string;
  consentement: boolean;
};

const VIDE: Donnees = {
  entreprise: "",
  secteur: "",
  effectif: "",
  domaines: [],
  canaux: [],
  precision: "",
  messagesParJour: "",
  plage: "",
  contactNom: "",
  email: "",
  telephone: "",
  consentement: false,
};

/* Ces valeurs partent en base et sont relues par l'administration, qui
   travaille en français : elles ne sont donc JAMAIS traduites. Seuls leurs
   libellés le sont, alignés par position sur `pageDevis.volumes` et
   `pageDevis.plages`. Réordonner une de ces listes impose de réordonner
   l'autre. La logique de `formulePressentie` compare ces mêmes valeurs. */
const VOLUMES = ["Moins de 10", "10 à 30", "30 à 80", "Plus de 80"] as const;
const PLAGES = ["Heures de bureau", "6 jours sur 7", "Soirées et week-end inclus"] as const;

/**
 * Suggère une formule à partir des réponses. Purement indicatif : le devis
 * définitif est établi à la main, ce que le récapitulatif précise.
 */
function formulePressentie(d: Donnees): Formule {
  const lourd =
    d.domaines.includes("Community management") ||
    d.effectif === "51 à 200 personnes" ||
    d.effectif === "Plus de 200 personnes" ||
    d.messagesParJour === "Plus de 80" ||
    d.plage === "Soirées et week-end inclus";

  const intermediaire =
    d.domaines.includes("Recouvrement") ||
    d.domaines.includes("Support commercial") ||
    d.canaux.includes("Appels") ||
    d.messagesParJour === "30 à 80";

  const id = lourd ? "premium" : intermediaire ? "professionnel" : "essentiel";
  return FORMULES.find((f) => f.id === id)!;
}

export function FormulaireDevis({ profil }: { profil?: ProfilConnu | null }) {
  const t = useTranslations("pageDevis");
  const ts = useTranslations("services");
  const tf = useTranslations("formules");
  const params = useSearchParams();

  /* Libellés traduits, alignés par position sur les listes de `lib/content.ts`. */
  const libSecteurs = t.raw("secteurs") as string[];
  const libEffectifs = t.raw("effectifs") as string[];
  const libCanaux = t.raw("canaux") as string[];
  const libVolumes = t.raw("volumes") as string[];
  const libPlages = t.raw("plages") as string[];
  const libEtapes = t.raw("etapes") as string[];
  const vide = t("aRenseigner");
  const formuleDemandee = params.get("formule");

  const [etape, setEtape] = useState(0);
  /* Ce que le client a déjà donné à l'inscription n'est pas redemandé. Les
     champs restent modifiables : une demande peut concerner un autre
     interlocuteur, ou l'entreprise a pu changer de nom depuis. */
  const [donnees, setDonnees] = useState<Donnees>({
    ...VIDE,
    entreprise: profil?.entreprise || "",
    secteur: profil?.secteur || "",
    effectif: profil?.effectif || "",
    contactNom: profil?.contactNom || "",
    email: profil?.email || "",
    telephone: profil?.telephone || "",
  });
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const maj = <K extends keyof Donnees>(cle: K, valeur: Donnees[K]) =>
    setDonnees((d) => ({ ...d, [cle]: valeur }));

  const bascule = (cle: "domaines" | "canaux", valeur: string) =>
    setDonnees((d) => ({
      ...d,
      [cle]: d[cle].includes(valeur) ? d[cle].filter((v) => v !== valeur) : [...d[cle], valeur],
    }));

  /* La formule choisie depuis la page Offres prime sur la suggestion calculée. */
  const formule = useMemo(() => {
    const forcee = FORMULES.find((f) => f.id === formuleDemandee);
    return forcee ?? formulePressentie(donnees);
  }, [formuleDemandee, donnees]);

  const etapeValide = (() => {
    if (etape === 0) return donnees.entreprise.trim() !== "" && donnees.secteur !== "";
    if (etape === 1) return donnees.domaines.length > 0;
    if (etape === 2) return donnees.messagesParJour !== "";
    return (
      donnees.contactNom.trim() !== "" &&
      /^\S+@\S+\.\S+$/.test(donnees.email) &&
      donnees.consentement
    );
  })();

  async function envoyer() {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...donnees, formuleSuggeree: formule.nom }),
      });
      if (!reponse.ok) throw new Error("Envoi refusé");
      setEnvoye(true);
    } catch {
      setErreur(t("erreurEnvoi"));
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <section className="mx-auto max-w-[1180px] px-5 py-16 lg:px-14 lg:py-24">
        <div className="max-w-[60ch] border border-line bg-stone-50 p-8 lg:p-12">
          <p className="na-eyebrow">{t("succesEyebrow")}</p>
          <h1 className="mt-4 text-[32px] leading-[1.15] text-navy lg:text-[42px]">
            {t("succesTitre")}
          </h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-slate-mid lg:text-[17px]">
            {t("succesTexte")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 pt-8 pb-6 lg:px-14 lg:pt-14 lg:pb-10">
        <p className="na-eyebrow">{t("eyebrow")}</p>
        <h1 className="text-[30px] leading-[1.15] text-navy lg:text-[46px]">
          {etape === 1 ? t("titreBesoins") : libEtapes[etape]}
        </h1>
        <p className="text-[15px] text-slate-mid lg:text-[17px]">{t("intro")}</p>
      </section>

      {/* -------------------------------------------------- jauge de progression */}
      <ol className="mx-auto grid max-w-[1180px] grid-cols-4 gap-[6px] px-5 pb-6 lg:gap-[14px] lg:px-14 lg:pb-11">
        {libEtapes.map((titre, i) => (
          <li key={i} className="flex flex-col gap-[9px]">
            <span
              aria-hidden
              className={`h-[3px] ${i <= etape ? "bg-gold" : "bg-line"}`}
            />
            <span
              className={`hidden text-[14px] lg:block ${
                i === etape
                  ? "font-semibold text-navy"
                  : i < etape
                    ? "text-slate-mid"
                    : "text-muted-light"
              }`}
            >
              {i + 1} · {titre}
              {i === etape && <span className="sr-only">{t("etapeEnCours")}</span>}
            </span>
          </li>
        ))}
      </ol>

      <div className="mx-auto grid max-w-[1180px] items-start gap-8 px-5 pb-16 lg:grid-cols-[1.5fr_0.85fr] lg:gap-11 lg:px-14 lg:pb-[60px]">
        {/* ------------------------------------------------------------ colonne */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (etape < 3) setEtape((n) => n + 1);
            else void envoyer();
          }}
          className="flex flex-col gap-[26px]"
        >
          {etape === 0 && (
            <>
              <Champ label={t("labelEntreprise")}>
                <input
                  required
                  value={donnees.entreprise}
                  onChange={(e) => maj("entreprise", e.target.value)}
                  placeholder={t("placeholderEntreprise")}
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none placeholder:text-muted focus:border-gold"
                />
              </Champ>
              <Groupe titre={t("groupeSecteur")}>
                <div className="flex flex-wrap gap-[10px]">
                  {SECTEURS.map((secteur, i) => (
                    <Puce
                      key={secteur}
                      actif={donnees.secteur === secteur}
                      onClick={() => maj("secteur", secteur)}
                    >
                      {libSecteurs[i] ?? secteur}
                    </Puce>
                  ))}
                </div>
              </Groupe>
              <Groupe titre={t("groupeEffectif")}>
                <div className="flex flex-wrap gap-[10px]">
                  {EFFECTIFS.map((effectif, i) => (
                    <Puce
                      key={effectif}
                      actif={donnees.effectif === effectif}
                      onClick={() => maj("effectif", effectif)}
                    >
                      {libEffectifs[i] ?? effectif}
                    </Puce>
                  ))}
                </div>
              </Groupe>
            </>
          )}

          {etape === 1 && (
            <>
              <Groupe titre={t("groupeDomaines")}>
                <div className="grid gap-[10px] sm:grid-cols-2 lg:gap-3">
                  {SERVICES.map((service) => {
                    const actif = donnees.domaines.includes(service.titre);
                    return (
                      <button
                        key={service.titre}
                        type="button"
                        aria-pressed={actif}
                        onClick={() => bascule("domaines", service.titre)}
                        className={`flex items-center gap-[14px] text-left ${
                          actif
                            ? "border-2 border-gold bg-gold-soft px-[18px] py-4 lg:px-5 lg:py-[18px]"
                            : "border border-line px-[19px] py-[17px] lg:px-[21px] lg:py-[19px]"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[12px] ${
                            actif ? "bg-gold text-navy" : "border border-line-check"
                          }`}
                        >
                          {actif ? "✓" : ""}
                        </span>
                        <span className={`text-[16px] ${actif ? "text-navy" : "text-ink-700"}`}>
                          {ts(`${service.numero}.titre`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Groupe>

              <Groupe titre={t("groupeCanaux")}>
                <div className="flex flex-wrap gap-[10px]">
                  {CANAUX.map((canal, i) => (
                    <Puce
                      key={canal}
                      actif={donnees.canaux.includes(canal)}
                      onClick={() => bascule("canaux", canal)}
                    >
                      {libCanaux[i] ?? canal}
                    </Puce>
                  ))}
                </div>
              </Groupe>

              <Champ label={t("labelPrecision")}>
                <textarea
                  value={donnees.precision}
                  onChange={(e) => maj("precision", e.target.value)}
                  rows={4}
                  placeholder={t("placeholderPrecision")}
                  className="min-h-[110px] border border-line px-[18px] py-4 text-[16px] text-navy outline-none placeholder:text-muted focus:border-gold"
                />
              </Champ>
            </>
          )}

          {etape === 2 && (
            <>
              <Groupe titre={t("groupeVolume")}>
                <div className="flex flex-wrap gap-[10px]">
                  {VOLUMES.map((volume, i) => (
                    <Puce
                      key={volume}
                      actif={donnees.messagesParJour === volume}
                      onClick={() => maj("messagesParJour", volume)}
                    >
                      {libVolumes[i] ?? volume}
                    </Puce>
                  ))}
                </div>
              </Groupe>
              <Groupe titre={t("groupePlage")}>
                <div className="flex flex-wrap gap-[10px]">
                  {PLAGES.map((plage, i) => (
                    <Puce
                      key={plage}
                      actif={donnees.plage === plage}
                      onClick={() => maj("plage", plage)}
                    >
                      {libPlages[i] ?? plage}
                    </Puce>
                  ))}
                </div>
              </Groupe>
            </>
          )}

          {etape === 3 && (
            <>
              <Champ label={t("labelNom")}>
                <input
                  required
                  value={donnees.contactNom}
                  onChange={(e) => maj("contactNom", e.target.value)}
                  autoComplete="name"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none focus:border-gold"
                />
              </Champ>
              <Champ label={t("labelEmail")}>
                <input
                  required
                  type="email"
                  value={donnees.email}
                  onChange={(e) => maj("email", e.target.value)}
                  autoComplete="email"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none focus:border-gold"
                />
              </Champ>
              <Champ label={t("labelTelephone")}>
                <input
                  value={donnees.telephone}
                  onChange={(e) => maj("telephone", e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none focus:border-gold"
                />
              </Champ>
              <label className="flex items-start gap-3 text-[15px] leading-[1.55] text-slate-mid">
                <input
                  type="checkbox"
                  checked={donnees.consentement}
                  onChange={(e) => maj("consentement", e.target.checked)}
                  className="mt-1 h-[18px] w-[18px] shrink-0 accent-[#C9A227]"
                />
                <span>{t("consentement")}</span>
              </label>
            </>
          )}

          {erreur && (
            <p role="alert" className="border border-gold-line bg-gold-soft px-4 py-3 text-[15px] text-navy">
              {erreur}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-[14px] pt-[6px]">
            {etape > 0 && (
              <ShinyButton
                type="button"
                variant="outline"
                onClick={() => setEtape((n) => n - 1)}
                className="!px-7 !py-[15px] !text-[16px]"
              >
                {t("retour")}
              </ShinyButton>
            )}
            <ShinyButton
              type="submit"
              disabled={!etapeValide || enCours}
              className="flex-1 !px-[34px] !py-4 !text-[16px] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {etape < 3 ? t("continuer") : enCours ? t("envoiEnCours") : t("envoyer")}
            </ShinyButton>
            <span className="text-[15px] text-muted">{t("etapeSur", { n: etape + 1 })}</span>
          </div>
        </form>

        {/* -------------------------------------------------------- récapitulatif */}
        <aside className="flex flex-col gap-5 border border-line bg-stone-50 p-6 lg:sticky lg:top-8 lg:gap-5 lg:px-[26px] lg:py-7">
          <h2 className="na-eyebrow font-mono text-[11px] font-normal tracking-[0.16em]">
            {t("recapitulatif")}
          </h2>
          <dl className="flex flex-col gap-[14px] text-[15px]">
            <Ligne intitule={t("ligneEntreprise")} valeur={donnees.entreprise} vide={vide} />
            <Ligne intitule={t("ligneSecteur")} valeur={libelle(SECTEURS, libSecteurs, donnees.secteur)} vide={vide} />
            <Ligne intitule={t("ligneEffectif")} valeur={libelle(EFFECTIFS, libEffectifs, donnees.effectif)} vide={vide} />
            <Ligne
              intitule={t("ligneDomaines")}
              valeur={donnees.domaines
                .map((d) => {
                  const s = SERVICES.find((x) => x.titre === d);
                  return s ? ts(`${s.numero}.titre`) : d;
                })
                .join(", ")}
              vide={vide}
            />
            <Ligne
              intitule={t("ligneCanaux")}
              valeur={donnees.canaux.map((c) => libelle(CANAUX, libCanaux, c)).join(", ")}
              vide={vide}
            />
          </dl>
          <div aria-hidden className="h-px bg-line" />
          <div className="flex flex-col gap-[6px]">
            <span className="text-[15px] text-muted">{t("formulePressentie")}</span>
            <span className="font-serif text-[26px] text-navy">{tf(`${formule.id}.nom`)}</span>
            <span className="text-[15px] text-slate-mid">
              {formule.prix} {tf("unite")} {t("aConfirmer")}
            </span>
          </div>
          <p className="flex items-start gap-3 border-t border-line pt-4">
            <span aria-hidden className="mt-[10px] h-px w-5 shrink-0 bg-gold" />
            <span className="text-[14px] leading-[1.55] text-gray-mid">
              {t("confidentialite")}
            </span>
          </p>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ atomes */

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[16px] font-semibold text-navy lg:text-[17px]">{label}</span>
      {children}
    </label>
  );
}

function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 lg:gap-[14px]">
      <legend className="mb-3 text-[16px] font-semibold text-navy lg:text-[17px]">{titre}</legend>
      {children}
    </fieldset>
  );
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={`text-[15px] transition-colors ${
        actif
          ? "bg-gold px-[18px] py-[10px] text-navy"
          : "border border-line px-[18px] py-[9px] text-ink-700 hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}

/* `vide` est passé en propriété plutôt que lu par un hook : ce composant est
   appelé dans une boucle, et un `useTranslations` par ligne coûterait autant
   d'abonnements pour une seule et même chaîne. */
function Ligne({
  intitule,
  valeur,
  vide,
}: {
  intitule: string;
  valeur: string;
  vide: string;
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <dt className="text-muted">{intitule}</dt>
      <dd className={valeur ? "text-navy" : "text-muted-light"}>{valeur || vide}</dd>
    </div>
  );
}

/* Retrouve le libellé traduit d'une valeur, par sa position dans la liste de
   référence. La valeur stockée reste française ; seul l'affichage change. */
function libelle(
  valeurs: readonly string[],
  libelles: string[],
  valeur: string,
): string {
  if (!valeur) return "";
  const i = valeurs.indexOf(valeur);
  return (i >= 0 ? libelles[i] : undefined) ?? valeur;
}
