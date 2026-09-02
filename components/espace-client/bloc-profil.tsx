import Link from "next/link";

/** Deux lettres tirées du nom : « Kaldjob Jean » → « KJ », « Nova » → « NO ». */
function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

/**
 * Pied du rail : qui est connecté, et sous quelle formule.
 *
 * Repris d'IMSOP, qui pose l'avatar et le nom juste au-dessus de la
 * déconnexion — on sait toujours sous quel compte on agit avant d'en sortir.
 *
 * Faute de photo de profil dans la base, l'avatar affiche les initiales.
 * Le jour où un `avatar_url` existera, il remplacera le disque doré.
 */
export function BlocProfil({
  nom,
  entreprise,
  formule,
}: {
  nom: string | null;
  entreprise: string;
  formule: string;
}) {
  const affiche = nom?.trim() || entreprise;

  return (
    <Link
      href="#profil"
      className="na-presse flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 font-mono text-[12px] tracking-[0.04em] text-gold"
      >
        {initiales(affiche)}
      </span>
      <span className="flex min-w-0 flex-col whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
        <span className="truncate text-[15px] text-white">{affiche}</span>
        <span className="truncate text-[13px] text-white/50">
          {nom?.trim() ? entreprise : formule}
        </span>
      </span>
    </Link>
  );
}
