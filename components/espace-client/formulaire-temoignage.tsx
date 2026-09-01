"use client";

import { useActionState, useId, useState } from "react";

import { soumettreTemoignage, type EtatSoumission } from "@/lib/temoignages/actions";
import type { FormatTemoignage } from "@/lib/temoignages/types";

const ETAT_INITIAL: EtatSoumission = { ok: false };

const CHAMP =
  "border border-line bg-paper px-3 py-[10px] text-[15px] text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

const LABEL = "font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase";

/**
 * Dépôt d'un témoignage depuis l'espace client.
 *
 * Rien n'est publié directement : le témoignage part en attente et n'apparaît
 * à l'accueil qu'après validation par l'administration.
 */
export function FormulaireTemoignage() {
  const [etat, action, enCours] = useActionState(soumettreTemoignage, ETAT_INITIAL);
  const [format, setFormat] = useState<FormatTemoignage>("texte");
  const idBase = useId();

  const champId = (nom: string) => `${idBase}-${nom}`;
  const erreurId = (nom: string) => `${idBase}-${nom}-erreur`;

  if (etat.ok) {
    return (
      <div role="status" className="flex flex-col gap-3 border border-gold bg-gold-soft p-6">
        <span className={LABEL}>Témoignage transmis</span>
        <p className="text-[15px] leading-[1.6] text-slate-deep">{etat.message}</p>
      </div>
    );
  }

  /** Message d'erreur d'un champ, avec les attributs qui le relient au champ. */
  const erreur = (nom: string) => {
    const message = etat.erreurs?.[nom];
    if (!message) return { liaison: {}, bloc: null };
    return {
      liaison: { "aria-invalid": true, "aria-describedby": erreurId(nom) },
      bloc: (
        <span id={erreurId(nom)} className="text-[13px] text-[#b0203a]">
          {message}
        </span>
      ),
    };
  };

  const eCitation = erreur("citation");
  const eVideo = erreur("videoUrl");
  const eConsentement = erreur("consentement");

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* --- format --- */}
      <fieldset className="flex flex-col gap-[10px]">
        <legend className={LABEL}>Format du témoignage</legend>
        <div className="flex flex-wrap gap-3">
          {(
            [
              { valeur: "texte", libelle: "Écrit", aide: "Deux à trois phrases" },
              { valeur: "video", libelle: "Vidéo", aide: "Lien vers votre vidéo, 1 min max" },
            ] as const
          ).map((option) => (
            <label
              key={option.valeur}
              className={`flex cursor-pointer flex-col gap-[2px] border px-4 py-3 transition-colors ${
                format === option.valeur
                  ? "border-gold bg-gold-soft"
                  : "border-line hover:border-gold-line"
              }`}
            >
              <span className="flex items-center gap-2 text-[15px] text-navy">
                <input
                  type="radio"
                  name="format"
                  value={option.valeur}
                  checked={format === option.valeur}
                  onChange={() => setFormat(option.valeur)}
                  className="accent-gold"
                />
                {option.libelle}
              </span>
              <span className="pl-6 text-[13px] text-gray-mid">{option.aide}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* --- citation --- */}
      <div className="flex flex-col gap-[6px]">
        <label htmlFor={champId("citation")} className={LABEL}>
          {format === "video" ? "Résumé de la vidéo" : "Votre témoignage"}
        </label>
        <textarea
          id={champId("citation")}
          name="citation"
          rows={format === "video" ? 3 : 5}
          maxLength={600}
          required
          placeholder={
            format === "video"
              ? "En une phrase, ce que dit la vidéo."
              : "Le problème avant, ce qui a changé, le résultat concret obtenu."
          }
          className={`${CHAMP} resize-y`}
          {...eCitation.liaison}
        />
        {eCitation.bloc}
        {format === "texte" && !eCitation.bloc && (
          <span className="text-[13px] text-gray-mid">
            Le plus convaincant : le problème avant, ce qui a changé, puis un chiffre.
          </span>
        )}
      </div>

      {/* --- lien vidéo --- */}
      {format === "video" && (
        <div className="flex flex-col gap-[6px]">
          <label htmlFor={champId("videoUrl")} className={LABEL}>
            Lien de la vidéo
          </label>
          <input
            id={champId("videoUrl")}
            name="videoUrl"
            type="url"
            inputMode="url"
            placeholder="https://youtu.be/..."
            className={CHAMP}
            {...eVideo.liaison}
          />
          {eVideo.bloc ?? (
            <span className="text-[13px] text-gray-mid">
              Déposez la vidéo sur YouTube ou Vimeo en « non répertorié », puis collez le lien ici.
            </span>
          )}
        </div>
      )}

      {/* --- identité --- */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            { nom: "auteur", libelle: "Nom et prénom", type: "text", auto: "name" },
            { nom: "fonction", libelle: "Fonction", type: "text", auto: "organization-title" },
            { nom: "entreprise", libelle: "Entreprise", type: "text", auto: "organization" },
            { nom: "ville", libelle: "Ville", type: "text", auto: "address-level2" },
            { nom: "email", libelle: "Email", type: "email", auto: "email" },
          ] as const
        ).map((champ) => {
          const e = erreur(champ.nom);
          return (
            <div key={champ.nom} className="flex flex-col gap-[6px]">
              <label htmlFor={champId(champ.nom)} className={LABEL}>
                {champ.libelle}
              </label>
              <input
                id={champId(champ.nom)}
                name={champ.nom}
                type={champ.type}
                autoComplete={champ.auto}
                required
                className={CHAMP}
                {...e.liaison}
              />
              {e.bloc}
            </div>
          );
        })}
      </div>

      {/* --- consentement --- */}
      <div className="flex flex-col gap-[6px]">
        <label className="flex items-start gap-3 text-[14px] leading-[1.5] text-slate-deep">
          <input
            type="checkbox"
            name="consentement"
            value="oui"
            className="mt-[3px] accent-gold"
            {...eConsentement.liaison}
          />
          J&apos;autorise Nova Assist à publier ce témoignage, mon nom, ma fonction et mon
          entreprise sur son site.
        </label>
        {eConsentement.bloc}
      </div>

      {etat.message && !etat.ok && (
        <p role="alert" className="text-[14px] text-[#b0203a]">
          {etat.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={enCours}
          className="bg-navy px-[26px] py-[13px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enCours ? "Envoi…" : "Envoyer mon témoignage"}
        </button>
        <span className="text-[13px] text-gray-mid">
          Publié à l&apos;accueil après validation par notre équipe.
        </span>
      </div>
    </form>
  );
}
