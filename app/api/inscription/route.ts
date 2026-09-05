import { NextResponse } from "next/server";

import { emailConfigure } from "@/lib/email";
import { urlDuSite } from "@/lib/site-url";
import { envoyerLienInscription } from "@/lib/supabase/emails-auth";

/**
 * Inscription — le lien de confirmation part par notre SMTP, pas par celui de
 * Supabase.
 *
 * Le service d'envoi intégré de Supabase est plafonné à deux emails par heure :
 * au troisième essai, plus personne ne pouvait s'inscrire. La création du
 * compte et la génération du lien restent chez Supabase ; seul l'acheminement
 * change.
 *
 * Cette route crée des comptes : elle valide donc ses entrées avant tout, et
 * ne renvoie jamais si une adresse est déjà connue — le dire permettrait
 * d'énumérer les clients de Nova Assist.
 */

const MOT_DE_PASSE_MIN = 8;

export async function POST(requete: Request) {
  let corps: { email?: unknown; motDePasse?: unknown; entreprise?: unknown; nom?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps illisible." }, { status: 400 });
  }

  const email = typeof corps.email === "string" ? corps.email.trim() : "";
  const motDePasse = typeof corps.motDePasse === "string" ? corps.motDePasse : "";
  const entreprise = typeof corps.entreprise === "string" ? corps.entreprise.trim() : "";
  const nom = typeof corps.nom === "string" ? corps.nom.trim() : "";

  const manquants: string[] = [];
  if (!/^\S+@\S+\.\S+$/.test(email)) manquants.push("email");
  if (motDePasse.length < MOT_DE_PASSE_MIN) manquants.push("motDePasse");
  if (!entreprise) manquants.push("entreprise");
  if (!nom) manquants.push("nom");

  if (manquants.length > 0) {
    return NextResponse.json(
      { erreur: "Formulaire incomplet.", champs: manquants },
      { status: 422 },
    );
  }

  if (!emailConfigure()) {
    console.error("[inscription] SMTP non configuré — aucun lien envoyable.");
    return NextResponse.json({ erreur: "Service indisponible." }, { status: 503 });
  }

  const origine = urlDuSite(requete);
  const resultat = await envoyerLienInscription({
    email,
    motDePasse,
    entreprise,
    contactNom: nom,
    origine,
  });

  if (!resultat.ok) {
    /* Une adresse déjà inscrite fait échouer `generateLink`. On répond comme
       pour un succès : révéler qu'un compte existe permettrait de tester des
       adresses une à une pour dresser la liste des clients. Le journal, lui,
       garde la trace pour le diagnostic. */
    console.error("[inscription] échec :", resultat.erreur, "pour", email);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
