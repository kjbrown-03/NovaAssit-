"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

const ETAPES = ["Votre entreprise", "Vos besoins", "Volume estimé", "Coordonnées"] as const;

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
  const params = useSearchParams();
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
      setErreur(
        "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous directement sur WhatsApp.",
      );
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <section className="mx-auto max-w-[1180px] px-5 py-16 lg:px-14 lg:py-24">
        <div className="max-w-[60ch] border border-line bg-stone-50 p-8 lg:p-12">
          <p className="na-eyebrow">Demande enregistrée</p>
          <h1 className="mt-4 text-[32px] leading-[1.15] text-navy lg:text-[42px]">
            Merci, votre demande nous est parvenue.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-slate-mid lg:text-[17px]">
            Nous revenons vers vous sous 24 h ouvrées avec une proposition chiffrée. Vos réponses
            restent confidentielles et ne servent qu&apos;à établir le devis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 pt-8 pb-6 lg:px-14 lg:pt-14 lg:pb-10">
        <p className="na-eyebrow">Demande de devis</p>
        <h1 className="text-[30px] leading-[1.15] text-navy lg:text-[46px]">
          {etape === 1 ? "Ce que nous pouvons prendre en charge" : ETAPES[etape]}
        </h1>
        <p className="text-[15px] text-slate-mid lg:text-[17px]">
          Quatre étapes, moins de trois minutes. Réponse chiffrée sous 24 h ouvrées.
        </p>
      </section>

      {/* -------------------------------------------------- jauge de progression */}
      <ol className="mx-auto grid max-w-[1180px] grid-cols-4 gap-[6px] px-5 pb-6 lg:gap-[14px] lg:px-14 lg:pb-11">
        {ETAPES.map((titre, i) => (
          <li key={titre} className="flex flex-col gap-[9px]">
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
              {i === etape && <span className="sr-only"> (étape en cours)</span>}
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
              <Champ label="Nom de votre entreprise">
                <input
                  required
                  value={donnees.entreprise}
                  onChange={(e) => maj("entreprise", e.target.value)}
                  placeholder="Clinique de la Dibamba"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none placeholder:text-muted focus:border-gold"
                />
              </Champ>
              <Groupe titre="Votre secteur d'activité">
                <div className="flex flex-wrap gap-[10px]">
                  {SECTEURS.map((secteur) => (
                    <Puce
                      key={secteur}
                      actif={donnees.secteur === secteur}
                      onClick={() => maj("secteur", secteur)}
                    >
                      {secteur}
                    </Puce>
                  ))}
                </div>
              </Groupe>
              <Groupe titre="Votre effectif">
                <div className="flex flex-wrap gap-[10px]">
                  {EFFECTIFS.map((effectif) => (
                    <Puce
                      key={effectif}
                      actif={donnees.effectif === effectif}
                      onClick={() => maj("effectif", effectif)}
                    >
                      {effectif}
                    </Puce>
                  ))}
                </div>
              </Groupe>
            </>
          )}

          {etape === 1 && (
            <>
              <Groupe titre="Quels domaines souhaitez-vous déléguer ?">
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
                          {service.titre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Groupe>

              <Groupe titre="Sur quels canaux vos clients vous écrivent-ils ?">
                <div className="flex flex-wrap gap-[10px]">
                  {CANAUX.map((canal) => (
                    <Puce
                      key={canal}
                      actif={donnees.canaux.includes(canal)}
                      onClick={() => bascule("canaux", canal)}
                    >
                      {canal}
                    </Puce>
                  ))}
                </div>
              </Groupe>

              <Champ label="Précisez votre besoin (facultatif)">
                <textarea
                  value={donnees.precision}
                  onChange={(e) => maj("precision", e.target.value)}
                  rows={4}
                  placeholder="Exemple : nous recevons une trentaine de messages WhatsApp par jour et nous perdons des rendez-vous faute de réponse rapide."
                  className="min-h-[110px] border border-line px-[18px] py-4 text-[16px] text-navy outline-none placeholder:text-muted focus:border-gold"
                />
              </Champ>
            </>
          )}

          {etape === 2 && (
            <>
              <Groupe titre="Combien de messages et d'appels recevez-vous par jour ?">
                <div className="flex flex-wrap gap-[10px]">
                  {VOLUMES.map((volume) => (
                    <Puce
                      key={volume}
                      actif={donnees.messagesParJour === volume}
                      onClick={() => maj("messagesParJour", volume)}
                    >
                      {volume}
                    </Puce>
                  ))}
                </div>
              </Groupe>
              <Groupe titre="Sur quelle amplitude horaire ?">
                <div className="flex flex-wrap gap-[10px]">
                  {PLAGES.map((plage) => (
                    <Puce
                      key={plage}
                      actif={donnees.plage === plage}
                      onClick={() => maj("plage", plage)}
                    >
                      {plage}
                    </Puce>
                  ))}
                </div>
              </Groupe>
            </>
          )}

          {etape === 3 && (
            <>
              <Champ label="Votre nom">
                <input
                  required
                  value={donnees.contactNom}
                  onChange={(e) => maj("contactNom", e.target.value)}
                  autoComplete="name"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none focus:border-gold"
                />
              </Champ>
              <Champ label="Adresse email">
                <input
                  required
                  type="email"
                  value={donnees.email}
                  onChange={(e) => maj("email", e.target.value)}
                  autoComplete="email"
                  className="border border-line px-[18px] py-4 text-[16px] text-navy outline-none focus:border-gold"
                />
              </Champ>
              <Champ label="Téléphone ou WhatsApp (facultatif)">
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
                <span>
                  J&apos;accepte que Nova Assist utilise ces informations pour établir mon devis.
                </span>
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
                Retour
              </ShinyButton>
            )}
            <ShinyButton
              type="submit"
              disabled={!etapeValide || enCours}
              className="flex-1 !px-[34px] !py-4 !text-[16px] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {etape < 3 ? "Continuer" : enCours ? "Envoi…" : "Envoyer ma demande"}
            </ShinyButton>
            <span className="text-[15px] text-muted">Étape {etape + 1} sur 4</span>
          </div>
        </form>

        {/* -------------------------------------------------------- récapitulatif */}
        <aside className="flex flex-col gap-5 border border-line bg-stone-50 p-6 lg:sticky lg:top-8 lg:gap-5 lg:px-[26px] lg:py-7">
          <h2 className="na-eyebrow font-mono text-[11px] font-normal tracking-[0.16em]">
            Récapitulatif
          </h2>
          <dl className="flex flex-col gap-[14px] text-[15px]">
            <Ligne intitule="Entreprise" valeur={donnees.entreprise} />
            <Ligne intitule="Secteur" valeur={donnees.secteur} />
            <Ligne intitule="Effectif" valeur={donnees.effectif} />
            <Ligne intitule="Domaines retenus" valeur={donnees.domaines.join(", ")} />
            <Ligne intitule="Canaux" valeur={donnees.canaux.join(", ")} />
          </dl>
          <div aria-hidden className="h-px bg-line" />
          <div className="flex flex-col gap-[6px]">
            <span className="text-[15px] text-muted">Formule pressentie</span>
            <span className="font-serif text-[26px] text-navy">{formule.nom}</span>
            <span className="text-[15px] text-slate-mid">
              {formule.prix} {formule.unite} — à confirmer selon le volume.
            </span>
          </div>
          <p className="flex items-start gap-3 border-t border-line pt-4">
            <span aria-hidden className="mt-[10px] h-px w-5 shrink-0 bg-gold" />
            <span className="text-[14px] leading-[1.55] text-gray-mid">
              Vos réponses restent confidentielles et ne servent qu&apos;à établir le devis.
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

function Ligne({ intitule, valeur }: { intitule: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <dt className="text-muted">{intitule}</dt>
      <dd className={valeur ? "text-navy" : "text-muted-light"}>{valeur || "À renseigner"}</dd>
    </div>
  );
}
