"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

import { enregistrerMembre, type EtatAction } from "@/lib/admin-actions";
import { BUCKET, urlPortrait, type Membre } from "@/lib/equipe-partage";
import { creerClientNavigateur } from "@/lib/supabase/client";

const ETAT_INITIAL: EtatAction = { ok: false };

const CHAMP =
  "w-full border border-line bg-paper px-3 py-[10px] text-[15px] text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

const LABEL = "font-mono text-[10px] tracking-[0.14em] text-gold-ink uppercase";

/** Au-delà, c'est une photo d'appareil non redimensionnée : elle ralentirait la page. */
const TAILLE_MAX = 3 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Fiche d'un membre de l'équipe, création comme modification.
 *
 * Le portrait part vers le stockage **avant** l'enregistrement : le formulaire
 * ne transmet ensuite que son chemin. Faire transiter le fichier par l'action
 * serveur imposerait de le charger entièrement en mémoire côté serveur, pour
 * un octet identique à ce que le navigateur peut déposer lui-même.
 */
export function FormulaireMembre({ membre }: { membre?: Membre }) {
  const [etat, action, enCours] = useActionState(enregistrerMembre, ETAT_INITIAL);

  const [chemin, setChemin] = useState(membre?.photo ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  async function deposer(fichier: File) {
    setErreurPhoto(null);

    if (!TYPES.includes(fichier.type)) {
      setErreurPhoto("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      setErreurPhoto(
        `Fichier trop lourd : ${(fichier.size / 1024 / 1024).toFixed(1)} Mo pour 3 Mo maximum. Redimensionnez-le avant de l'envoyer.`,
      );
      return;
    }

    setEnvoi(true);
    try {
      const supabase = creerClientNavigateur();
      /* Nom aléatoire : deux portraits nommés « photo.jpg » se remplaceraient
         l'un l'autre, et un nom de fichier peut porter des accents ou des
         espaces que le stockage refuse. */
      const extension = fichier.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const nom = `${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage.from(BUCKET).upload(nom, fichier, {
        cacheControl: "31536000",
        upsert: false,
      });

      if (error) {
        setErreurPhoto(`Envoi refusé : ${error.message}`);
        return;
      }
      setChemin(nom);
    } finally {
      setEnvoi(false);
    }
  }

  const apercu = urlPortrait(chemin || undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {membre && <input type="hidden" name="id" value={membre.id} />}
      <input type="hidden" name="photo" value={chemin} />

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

      {/* ---------------------------------------------------------- portrait */}
      <div className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-stone-100"
        >
          {apercu ? (
            <Image src={apercu} alt="" width={92} height={92} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="font-mono text-[10px] text-muted">aucune</span>
          )}
        </span>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>Portrait</span>
          <input
            ref={champFichier}
            type="file"
            accept={TYPES.join(",")}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void deposer(f);
            }}
          />
          <button
            type="button"
            onClick={() => champFichier.current?.click()}
            disabled={envoi}
            className="flex items-center gap-2 border border-line px-3 py-2 text-[14px] text-slate-deep transition-colors hover:border-gold hover:text-gold-ink disabled:opacity-60"
          >
            <Upload aria-hidden size={15} />
            {envoi ? "Envoi…" : apercu ? "Remplacer la photo" : "Choisir une photo"}
          </button>
          <span className="text-[12px] text-muted">JPEG, PNG ou WebP · 3 Mo maximum</span>
          {erreurPhoto && <span className="text-[13px] text-[#b0203a]">{erreurPhoto}</span>}
        </div>
      </div>

      {/* ------------------------------------------------------------ identité */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2" htmlFor="membre-nom">
          <span className={LABEL}>Nom et prénom</span>
          <input
            id="membre-nom"
            name="nom"
            type="text"
            required
            defaultValue={membre?.nom ?? ""}
            placeholder="Madame Ngo Bassong"
            className={CHAMP}
          />
        </label>

        <label className="flex flex-col gap-2" htmlFor="membre-role">
          <span className={LABEL}>Fonction</span>
          <input
            id="membre-role"
            name="role"
            type="text"
            required
            defaultValue={membre?.role ?? ""}
            placeholder="Assistante référente"
            className={CHAMP}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2" htmlFor="membre-bio">
        <span className={LABEL}>Présentation — facultative</span>
        <textarea
          id="membre-bio"
          name="bio"
          rows={3}
          defaultValue={membre?.bio ?? ""}
          placeholder="Une ou deux phrases : parcours, spécialité."
          className={`${CHAMP} resize-y`}
        />
      </label>

      <div className="flex flex-wrap items-end gap-5">
        <label className="flex flex-col gap-2" htmlFor="membre-position">
          <span className={LABEL}>Ordre d&apos;affichage</span>
          <input
            id="membre-position"
            name="position"
            type="number"
            defaultValue={membre?.position ?? 0}
            className={`${CHAMP} w-[120px]`}
          />
        </label>

        <label className="flex items-center gap-3 pb-[10px] text-[15px] text-slate-deep">
          <input
            type="checkbox"
            name="visible"
            defaultChecked={membre?.visible ?? true}
            className="h-[17px] w-[17px] accent-[#C9A227]"
          />
          Visible sur le site
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={enCours || envoi}
          className="na-presse bg-navy px-5 py-[11px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : membre ? "Enregistrer" : "Ajouter le membre"}
        </button>
      </div>
    </form>
  );
}
