/** Deux lettres tirées du nom, ou de l'adresse à défaut. */
function initiales(source: string): string {
  const mots = source.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

/**
 * Pied du rail : sous quel compte on administre.
 *
 * Même gabarit que `BlocProfil` côté client, mais sans lien ni formule — un
 * administrateur n'a pas d'abonnement. La mention « Administration » distingue
 * les deux consoles au premier coup d'œil : sur un poste où l'on bascule entre
 * un compte client et un compte admin, la confusion coûte cher.
 */
export function BlocAdmin({ nom, email }: { nom: string; email: string }) {
  const affiche = nom.trim() || email;

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 font-mono text-[12px] tracking-[0.04em] text-gold"
      >
        {initiales(affiche)}
      </span>
      <span className="flex min-w-0 flex-col transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
        <span className="truncate text-[14px] text-white">{nom || "Administration"}</span>
        <span className="truncate text-[12px] text-gold/80">Administration</span>
      </span>
    </div>
  );
}
