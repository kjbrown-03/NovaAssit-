/**
 * Déconnexion — un vrai formulaire POST, sans JavaScript.
 *
 * Fonctionne donc même si le script ne s'est pas chargé, ce qui compte sur les
 * connexions visées par le cahier des charges (§6.3) : rester bloqué connecté
 * sur un poste partagé serait le pire cas.
 */
export function BoutonDeconnexion() {
  return (
    <form action="/auth/deconnexion" method="post">
      <button
        type="submit"
        className="mt-2 text-left text-[14px] text-gold hover:underline"
      >
        Se déconnecter
      </button>
    </form>
  );
}
