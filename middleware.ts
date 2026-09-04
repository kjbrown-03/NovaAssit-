import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_EPHEMERE, COOKIE_NAVIGATEUR_OUVERT } from "@/lib/session-navigateur";

/** Préfixes exigeant une session valide. */
const ROUTES_PROTEGEES = [
  "/espace-client",
  /* Le back-office exige une session ; le rôle `admin`, lui, est vérifié dans
     la page — il demande une lecture en base que le middleware n'a pas à
     payer sur chaque requête. */
  "/admin",
  /* Le devis passe par un compte : c'est le choix de Nova Assist, pour que
     chaque demande arrive rattachée à un client identifié et retrouvable dans
     l'espace client. L'arborescence du cahier des charges plaçait « Devis »
     parmi les pages publiques — c'est un écart assumé. */
  "/devis",

  /* Le paiement aussi suppose un compte : le cahier prévoit « Paiement en
     ligne des packages, via API Tara, dès formule choisie et compte client
     créé ». */
  "/paiement",
  /* Accessible seulement par le lien de réinitialisation, qui ouvre une
     session en passant par /auth/confirm. */
  "/mot-de-passe-nouveau",
];

/**
 * Rafraîchit la session à chaque requête et ferme l'espace client.
 *
 * Avant ce fichier, `/espace-client` était accessible à quiconque tapait
 * l'URL. Pour un service qui vend de la confidentialité, c'était le défaut le
 * plus grave du site.
 *
 * Le middleware est une barrière de commodité — il redirige proprement. La
 * vraie protection des données reste les politiques RLS : même en contournant
 * cette redirection, aucune ligne d'un autre client ne serait lisible.
 */
export async function middleware(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      /* Même raison que dans `lib/supabase/server.ts` : la bibliothèque ne pose
         pas `secure` d'elle-même, et le middleware réécrit le cookie à chaque
         rafraîchissement de session. */
      cookieOptions: { secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire) {
          cookiesAEcrire.forEach(({ name, value }) =>
            requete.cookies.set(name, value),
          );
          reponse = NextResponse.next({ request: requete });
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /* `getSession()` lit le cookie sans appel réseau ; `getUser()` part valider
     le jeton auprès de Supabase — 350 à 580 ms mesurés sur cette liaison, sur
     *chaque* requête d'une route protégée.

     Ce middleware n'accorde aucun accès : il redirige. Un cookie forgé
     passerait ici, puis se heurterait à la vraie barrière — Supabase rejette
     un jeton mal signé sur chaque lecture de données, et RLS ne rendrait
     aucune ligne. Le back-office, lui, revérifie le rôle en base dans sa
     coque. La validation réseau était donc payée trois fois par page pour un
     seul contrôle utile. */
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  /* --- « Se souvenir de moi » décoché : la session meurt avec le navigateur.
     Le témoin persistant dit que la session était éphémère ; le témoin de
     session, lui, disparaît de lui-même quand le navigateur se ferme. L'un
     sans l'autre, c'est donc qu'on a rouvert le navigateur : on efface les
     jetons plutôt que de rendre l'espace client à quelqu'un d'autre.
     Voir `lib/session-navigateur.ts` pour le pourquoi de ce montage. */
  const ephemere = requete.cookies.has(COOKIE_EPHEMERE);
  const navigateurOuvert = requete.cookies.has(COOKIE_NAVIGATEUR_OUVERT);

  if (user && ephemere && !navigateurOuvert) {
    const url = requete.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set("motif", "session-fermee");

    const fin = NextResponse.redirect(url);
    /* Les jetons Supabase sont répartis sur un ou plusieurs cookies `sb-…`
       selon leur taille : on les efface tous plutôt que d'en deviner le
       découpage. */
    for (const { name } of requete.cookies.getAll()) {
      if (name.startsWith("sb-")) fin.cookies.delete(name);
    }
    fin.cookies.delete(COOKIE_EPHEMERE);
    return fin;
  }

  const chemin = requete.nextUrl.pathname;
  const protegee = ROUTES_PROTEGEES.some(
    (prefixe) => chemin === prefixe || chemin.startsWith(`${prefixe}/`),
  );

  if (protegee && !user) {
    const url = requete.nextUrl.clone();
    url.pathname = "/connexion";
    /* On repart d'une chaîne vide : sans ça, les paramètres de la page demandée
       resteraient collés à l'URL de connexion, en double avec `suite`. */
    url.search = "";
    /* La destination emporte sa chaîne de requête : sans elle,
       `/paiement?formule=premium` reviendrait sur un paiement sans formule. */
    url.searchParams.set("suite", chemin + requete.nextUrl.search);
    return NextResponse.redirect(url);
  }

  /* Arriver sur /connexion, c'est vouloir s'identifier — éventuellement sous
     un autre compte que celui encore ouvert. Renvoyer au tableau de bord
     rendait le formulaire inatteignable : un poste partagé gardait le compte
     précédent, et rien ne permettait d'en changer sans chercher le bouton de
     déconnexion à l'intérieur de l'espace client.
     On ferme donc la session et on sert le formulaire. Pas de redirection ici :
     la page est rendue dans la foulée, et la réponse emporte l'effacement. */
  if (chemin === "/connexion" && user) {
    const jetons = requete.cookies
      .getAll()
      .map(({ name }) => name)
      .filter((name) => name.startsWith("sb-"));

    /* Retirés de la requête *avant* de la passer plus loin : la page se rend
       ainsi déjà comme anonyme, au lieu d'attendre la requête suivante. */
    jetons.forEach((name) => requete.cookies.delete(name));

    const fin = NextResponse.next({ request: requete });
    jetons.forEach((name) => fin.cookies.delete(name));
    fin.cookies.delete(COOKIE_EPHEMERE);
    fin.cookies.delete(COOKIE_NAVIGATEUR_OUVERT);
    return fin;
  }

  return reponse;
}

export const config = {
  /**
   * Uniquement les routes qui ont besoin d'une session.
   *
   * Le matcher couvrait auparavant tout le site sauf les fichiers statiques.
   * Or `getUser()` interroge Supabase par le reseau : mesure a 350-580 ms par
   * appel depuis ce poste. Chaque page vitrine — accueil, services, blog,
   * contact — payait donc un demi-tour de reseau avant meme de commencer a
   * rendre, pour une session dont elle n'a aucun usage.
   *
   * Rafraichir le jeton sur les pages publiques n'apporte rien : il est
   * revalide ici des que le visiteur entre dans l'espace client.
   */
  /* ⚠️ Toute entrée de ROUTES_PROTEGEES doit figurer ici : une route absente de
     ce matcher n'est jamais vue par le middleware, et reste donc ouverte quoi
     qu'en dise la liste. */
  matcher: [
    "/espace-client/:path*",
    "/admin/:path*",
    "/devis/:path*",
    "/paiement/:path*",
    "/mot-de-passe-nouveau/:path*",
    "/connexion",
  ],
};
