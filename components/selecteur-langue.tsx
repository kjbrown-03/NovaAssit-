"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { COOKIE_LANGUE, LANGUES, type Langue } from "@/i18n/config";

/** Un an : le choix de langue n'a pas de raison d'expirer plus tôt. */
const DUREE = 60 * 60 * 24 * 365;

/**
 * Bascule Français / English.
 *
 * Le cookie est écrit **par le navigateur**, pas par une action serveur.
 * L'action faisait un aller-retour rien que pour poser le cookie, puis
 * `refresh()` en faisait un second pour re-rendre la page : deux allers-retours
 * là où un seul est nécessaire. Sur une liaison où chaque aller-retour coûte
 * 350 à 580 ms, la bascule paraissait bloquée.
 *
 * Le cookie n'est pas `httpOnly` — il ne porte aucun secret, seulement « fr »
 * ou « en » —, le script peut donc l'écrire lui-même. `refresh()` refait alors
 * rendre l'arbre serveur, qui lit la nouvelle valeur.
 */
export function SelecteurLangue({ tone = "on-paper" }: { tone?: "on-navy" | "on-paper" }) {
  const locale = useLocale() as Langue;
  const t = useTranslations("langue");
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  const surPapier = tone === "on-paper";

  const basculer = (langue: Langue) => {
    if (langue === locale) return;

    document.cookie = `${COOKIE_LANGUE}=${langue}; Max-Age=${DUREE}; Path=/; SameSite=Lax`;
    demarrer(() => router.refresh());
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
