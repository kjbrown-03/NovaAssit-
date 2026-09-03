"use client";

import { useActionState, useId, useState } from "react";

import { enregistrerArticle, type EtatEditeur } from "@/lib/articles/actions";
import {
  CHAPO_MAX,
  TITRE_MAX,
  fabriquerSlug,
  minutesDeLecture,
  type Article,
} from "@/lib/articles/types";

const ETAT_INITIAL: EtatEditeur = { ok: false };

const CHAMP =
  "w-full border border-line bg-paper px-3 py-[10px] text-[15px] text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

const LABEL = "font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase";

/**
 * Rédaction d'un article.
 *
 * Sert aussi bien à créer qu'à modifier : passer `article` bascule le
 * formulaire en modification, un champ caché portant l'identifiant. C'est le
 * même écran dans les deux cas, parce que c'est le même geste.
 *
 * L'adresse publique se calcule sous les yeux pendant qu'on tape le titre. Elle
 * reste modifiable : une fois un article partagé, changer son titre ne doit pas
 * casser les liens qui pointent vers lui.
 */
export function EditeurArticle({ article }: { article?: Article }) {
  const [etat, action, enCours] = useActionState(enregistrerArticle, ETAT_INITIAL);
  const idBase = useId();

  const [titre, setTitre] = useState(article?.titre ?? "");
  const [chapo, setChapo] = useState(article?.chapo ?? "");
  const [corps, setCorps] = useState(article?.corps ?? "");
  /* Vide tant que personne n'y touche : l'adresse suit alors le titre. */
  const [slugSaisi, setSlugSaisi] = useState(article?.slug ?? "");

  const champId = (nom: string) => `${idBase}-${nom}`;
  const erreurId = (nom: string) => `${idBase}-${nom}-erreur`;

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

  const eTitre = erreur("titre");
  const eChapo = erreur("chapo");
  const eCorps = erreur("corps");
  const eSlug = erreur("slug");

  const adresse = fabriquerSlug(slugSaisi || titre);

  return (
    <form action={action} className="flex flex-col gap-5">
      {article && <input type="hidden" name="id" value={article.id} />}

      {etat.message && (
        <p
          role="status"
          className={`border px-4 py-3 text-[14px] leading-[1.55] ${
            etat.ok
              ? "border-gold bg-gold-soft text-slate-deep"
              : "border-[#b0203a]/40 bg-[#b0203a]/5 text-[#b0203a]"
          }`}
        >
          {etat.message}
        </p>
      )}

      {/* ------------------------------------------------------------ titre */}
      <label className="flex flex-col gap-2" htmlFor={champId("titre")}>
        <span className={LABEL}>Titre</span>
        <input
          id={champId("titre")}
          name="titre"
          type="text"
          required
          maxLength={TITRE_MAX}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Cabinet médical — ne plus perdre de rendez-vous"
          className={CHAMP}
          {...eTitre.liaison}
        />
        {eTitre.bloc}
      </label>

      {/* ---------------------------------------------------------- adresse */}
      <label className="flex flex-col gap-2" htmlFor={champId("slug")}>
        <span className={LABEL}>Adresse publique</span>
        <input
          id={champId("slug")}
          name="slug"
          type="text"
          value={slugSaisi}
          onChange={(e) => setSlugSaisi(e.target.value)}
          placeholder="déduite du titre"
          className={CHAMP}
          {...eSlug.liaison}
        />
        <span className="font-mono text-[12px] text-muted">
          /blog/{adresse || <span className="text-[#b0203a]">—</span>}
        </span>
        {article && slugSaisi !== article.slug && (
          <span className="text-[13px] text-gold-ink">
            L&apos;adresse change : les liens déjà partagés vers l&apos;ancienne ne
            fonctionneront plus.
          </span>
        )}
        {eSlug.bloc}
      </label>

      {/* ---------------------------------------------------------- secteur */}
      <label className="flex flex-col gap-2" htmlFor={champId("secteur")}>
        <span className={LABEL}>Secteur — facultatif</span>
        <input
          id={champId("secteur")}
          name="secteur"
          type="text"
          defaultValue={article?.secteur ?? ""}
          placeholder="Santé, commerce, PME…"
          className={CHAMP}
        />
      </label>

      {/* ------------------------------------------------------------ chapô */}
      <label className="flex flex-col gap-2" htmlFor={champId("chapo")}>
        <span className={LABEL}>Chapô</span>
        <textarea
          id={champId("chapo")}
          name="chapo"
          required
          rows={3}
          maxLength={CHAPO_MAX}
          value={chapo}
          onChange={(e) => setChapo(e.target.value)}
          placeholder="Une ou deux phrases : ce que le lecteur va y trouver."
          className={`${CHAMP} resize-y`}
          {...eChapo.liaison}
        />
        <span className="text-[12px] text-muted">
          {chapo.length} / {CHAPO_MAX} — sert de résumé dans la liste et sur Google.
        </span>
        {eChapo.bloc}
      </label>

      {/* ------------------------------------------------------------ corps */}
      <label className="flex flex-col gap-2" htmlFor={champId("corps")}>
        <span className={LABEL}>Article</span>
        <textarea
          id={champId("corps")}
          name="corps"
          required
          rows={18}
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          placeholder={"Écrivez ici.\n\nUne ligne vide sépare deux paragraphes."}
          className={`${CHAMP} resize-y leading-[1.7]`}
          {...eCorps.liaison}
        />
        <span className="text-[12px] text-muted">
          Texte simple : une ligne vide sépare deux paragraphes. Environ{" "}
          {minutesDeLecture(corps)} min de lecture.
        </span>
        {eCorps.bloc}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="na-presse bg-navy px-5 py-[11px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : article ? "Enregistrer" : "Créer le brouillon"}
        </button>
        <span className="text-[13px] text-muted">
          Enregistrer ne publie pas : la parution se décide dans la liste.
        </span>
      </div>
    </form>
  );
}
