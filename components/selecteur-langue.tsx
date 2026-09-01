"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { LANGUES, type Langue } from "@/i18n/config";
import { changerLangue } from "@/lib/actions-langue";

/**
 * Bascule Français / English.
 *
 * Le choix est écrit dans un cookie par une action serveur, puis `refresh()`
 * refait rendre l'arbre côté serveur : toutes les pages et tous les composants
 * repassent dans la nouvelle langue, sans rechargement complet.
 */
export function SelecteurLangue({ tone = "on-paper" }: { tone?: "on-navy" | "on-paper" }) {
  const locale = useLocale() as Langue;
  const t = useTranslations("langue");
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  const surPapier = tone === "on-paper";

  const basculer = (langue: Langue) => {
    if (langue === locale) return;
    demarrer(async () => {
      await changerLangue(langue);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t("choisir")}
      className={`flex items-center rounded-full border p-[2px] ${
        surPapier ? "border-line bg-stone-50" : "border-gold/25 bg-white/5"
      } ${enCours ? "opacity-60" : ""}`}
    >
      {LANGUES.map((langue) => {
        const actif = langue === locale;
        return (
          <button
            key={langue}
            type="button"
            lang={langue}
            onClick={() => basculer(langue)}
            aria-pressed={actif}
            disabled={enCours}
            className={`rounded-full px-[10px] py-[3px] font-mono text-[11px] tracking-[0.1em] transition-colors ${
              actif
                ? surPapier
                  ? "bg-navy text-white"
                  : "bg-gold text-navy"
                : surPapier
                  ? "text-slate-mid hover:text-navy"
                  : "text-white/70 hover:text-gold"
            }`}
          >
            {t(`${langue}Court`)}
            {/* Le sigle seul ne dit rien à un lecteur d'écran. */}
            <span className="sr-only"> — {t(langue)}</span>
          </button>
        );
      })}
    </div>
  );
}
