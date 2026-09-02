import { LogOut } from "lucide-react";

/**
 * Déconnexion — un vrai formulaire POST, sans JavaScript.
 *
 * Fonctionne donc même si le script ne s'est pas chargé, ce qui compte sur les
 * connexions visées par le cahier des charges (§6.3) : rester bloqué connecté
 * sur un poste partagé serait le pire cas.
 *
 * Présenté comme une entrée à part entière, avec son icône, plutôt qu'en petit
 * lien discret — c'est la convention des tableaux de bord, et on ne cherche pas
 * la sortie d'un espace privé.
 *
 * `tone` suit le fond : `on-navy` dans le rail de l'espace client, `on-paper`
 * dans l'en-tête clair du back-office.
 */
export function BoutonDeconnexion({ tone = "on-navy" }: { tone?: "on-navy" | "on-paper" }) {
  const surPapier = tone === "on-paper";

  return (
    <form action="/auth/deconnexion" method="post">
      <button
        type="submit"
        className={`na-presse flex w-full items-center gap-3 rounded-xl px-3 py-[10px] text-left text-[15px] transition-colors ${
          surPapier
            ? "border border-line text-slate-deep hover:border-gold hover:text-gold-ink"
            : "text-white/70 hover:bg-white/5 hover:text-gold"
        }`}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span
          className={
            surPapier
              ? "whitespace-nowrap"
              : "whitespace-nowrap transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100"
          }
        >
          Se déconnecter
        </span>
      </button>
    </form>
  );
}
