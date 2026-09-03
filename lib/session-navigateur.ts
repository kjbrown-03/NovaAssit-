/**
 * « Se souvenir de moi sur cet appareil » — la mécanique.
 *
 * Pourquoi ce fichier existe : `@supabase/ssr` écrit son cookie
 * d'authentification avec `maxAge: 400 jours`, et le réimpose *après* les
 * options qu'on lui passe (`dist/main/cookies.js`, objet `setCookieOptions`).
 * Le `cookieOptions` public est donc sans effet sur ce point : impossible de
 * raccourcir la vie du cookie de session par la bibliothèque.
 *
 * On superpose donc deux témoins, que le navigateur sait distinguer tout seul :
 *
 *   `na-session-ephemere`   persistant — sa présence dit « cette session ne
 *                           doit pas survivre à la fermeture du navigateur ».
 *   `na-navigateur-ouvert`  cookie de session, sans `max-age` — le navigateur
 *                           le détruit lui-même quand on le ferme.
 *
 * Le premier sans le second signifie donc : le navigateur a été fermé depuis
 * la connexion. Le middleware y met alors fin et efface les jetons.
 *
 * Les deux témoins ne contiennent aucune donnée personnelle, seulement « 1 » :
 * ils ne disent pas *qui* est connecté, seulement *comment* la session doit
 * s'éteindre.
 */

export const COOKIE_EPHEMERE = "na-session-ephemere";
export const COOKIE_NAVIGATEUR_OUVERT = "na-navigateur-ouvert";

/* Plafond des navigateurs pour la durée d'un cookie ; au-delà, ils rabotent.
   Même valeur que le cookie Supabase auquel ce témoin est adossé. */
const MAX_AGE = 400 * 24 * 60 * 60;

function ecrire(nom: string, valeur: string, maxAge?: number) {
  const morceaux = [`${nom}=${valeur}`, "path=/", "samesite=lax"];
  /* `max-age` omis = cookie de session : c'est tout le mécanisme. */
  if (maxAge !== undefined) morceaux.push(`max-age=${maxAge}`);
  /* En production le site est en HTTPS ; en développement, `secure` empêcherait
     le navigateur d'enregistrer le cookie sur http://localhost. */
  if (window.location.protocol === "https:") morceaux.push("secure");
  document.cookie = morceaux.join("; ");
}

/**
 * À appeler juste après une connexion réussie, côté navigateur.
 *
 * `memoriser` vrai : aucun témoin, la session vit sa vie normale jusqu'à la
 * déconnexion explicite. Faux : les deux témoins sont posés.
 */
export function marquerSession(memoriser: boolean) {
  if (memoriser) {
    oublierTemoins();
    return;
  }
  ecrire(COOKIE_EPHEMERE, "1", MAX_AGE);
  ecrire(COOKIE_NAVIGATEUR_OUVERT, "1");
}

/** Retire les deux témoins — connexion mémorisée, ou déconnexion. */
export function oublierTemoins() {
  ecrire(COOKIE_EPHEMERE, "", 0);
  ecrire(COOKIE_NAVIGATEUR_OUVERT, "", 0);
}
