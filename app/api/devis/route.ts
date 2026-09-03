import { NextResponse } from "next/server";

import {
  corpsHtml,
  corpsTexte,
  echapperHtml,
  emailConfigure,
  envoyerNotification,
} from "@/lib/email";
import { enregistrerDemandeDevis } from "@/lib/supabase/devis";

/**
 * Réception d'une demande de devis.
 *
 * La demande est validée puis transmise par email à l'adresse professionnelle
 * Nova Assist. Le cahier des charges demande « Gestion des demandes devis
 * reçues » avec « Notification email + tableau suivi ». Le transport SMTP se
 * configure par les
 * variables `SMTP_*` — voir `.env.example`.
 *
 * ⚠️ Restent à faire avant mise en ligne :
 *   1. une protection anti-spam — captcha ou Turnstile ; en l'état, le
 *      formulaire est ouvert à l'envoi automatisé. Le cahier des charges ne
 *      l'exige pas explicitement, mais un formulaire ouvert le deviendra vite,
 *   2. le « tableau suivi » exigé par le cahier : sans persistance, un email
 *      perdu est une demande perdue.
 */

type Demande = Record<string, unknown>;

/** Chaîne non vide, ou `null` — la base préfère l'absence à la chaîne vide. */
function texteOuNull(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}

/** Valeur échappée, ou une mention lisible quand le champ est vide. */
const champ = (valeur: unknown, defaut = "Non renseigné") => echapperHtml(valeur) || defaut;

/**
 * Nettoie une valeur destinée à l'en-tête `Subject`.
 * Un retour à la ligne dans un en-tête permettrait d'en injecter d'autres —
 * un `Bcc:` par exemple, qui ferait de ce formulaire un relais de spam.
 */
const ligneSure = (valeur: string) => valeur.replace(/[\r\n]+/g, " ").slice(0, 120);

export async function POST(requete: Request) {
  let corps: Demande;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json({ erreur: "Corps de requête illisible." }, { status: 400 });
  }

  const entreprise = typeof corps.entreprise === "string" ? corps.entreprise.trim() : "";
  const contactNom = typeof corps.contactNom === "string" ? corps.contactNom.trim() : "";
  const email = typeof corps.email === "string" ? corps.email.trim() : "";
  const domaines = Array.isArray(corps.domaines) ? corps.domaines : [];

  const manquants: string[] = [];
  if (!entreprise) manquants.push("entreprise");
  if (!contactNom) manquants.push("contactNom");
  /* Le motif interdit les espaces, donc aussi les retours à la ligne : cette
     adresse peut servir de `Reply-To` sans risque d'injection d'en-tête. */
  if (!/^\S+@\S+\.\S+$/.test(email)) manquants.push("email");
  if (domaines.length === 0) manquants.push("domaines");
  if (corps.consentement !== true) manquants.push("consentement");

  if (manquants.length > 0) {
    return NextResponse.json(
      { erreur: "Demande incomplète.", champs: manquants },
      { status: 422 },
    );
  }

  /* Enregistrement AVANT l'envoi : c'est lui qui garantit qu'une demande ne se
     perd pas. Le cahier des charges demande « Notification email + tableau
     suivi » — l'email alerte, la table conserve. Tant que rien n'était
     persisté, une panne SMTP effaçait la demande. */
  const enregistree = await enregistrerDemandeDevis({
    entreprise,
    contact_nom: contactNom,
    email,
    secteur: texteOuNull(corps.secteur),
    effectif: texteOuNull(corps.effectif),
    domaines: domaines.filter((d): d is string => typeof d === "string"),
    canaux: Array.isArray(corps.canaux)
      ? corps.canaux.filter((c): c is string => typeof c === "string")
      : [],
    messages_par_jour: texteOuNull(corps.messagesParJour),
    plage: texteOuNull(corps.plage),
    precision_libre: texteOuNull(corps.precision),
    formule_suggeree: texteOuNull(corps.formuleSuggeree),
  });

  if (!emailConfigure()) {
    console.error(
      "[devis] SMTP_USER ou SMTP_PASS manquante — aucun email envoyé :",
      { entreprise, email, enregistree: Boolean(enregistree) },
    );

    /* Enregistrée mais non notifiée : la demande est consultable dans le
       back-office, la confirmation au visiteur n'est donc pas mensongère. */
    if (enregistree) {
      return NextResponse.json({ ok: true, notifiee: false }, { status: 200 });
    }

    /* Ni enregistrée ni envoyée : là, elle serait réellement perdue. */
    return NextResponse.json(
      { erreur: "Service indisponible." },
      { status: 503 },
    );
  }

  const lignes: [string, string][] = [
    ["Entreprise", champ(entreprise)],
    ["Contact", champ(contactNom)],
    ["Email", champ(email)],
    ["Secteur d'activité", champ(corps.secteur)],
    ["Effectif", champ(corps.effectif)],
    ["Domaines délégués", champ(domaines)],
    ["Canaux concernés", champ(corps.canaux, "Aucun")],
    ["Volume de messages/j", champ(corps.messagesParJour)],
    ["Plage horaire", champ(corps.plage)],
    ["Précisions", champ(corps.precision, "—")],
    ["Formule pressentie", champ(corps.formuleSuggeree, "Inconnue")],
  ];

  const titre = "Nouvelle demande de devis — site Nova Assist";
  const envoye = await envoyerNotification({
    sujet: `[Devis] Nouvelle demande de ${ligneSure(entreprise)}`,
    texte: corpsTexte(titre, lignes),
    html: corpsHtml(titre, lignes),
    repondreA: email,
  });

  if (!envoye) {
    /* Journalisé avec les coordonnées. La demande n'est pas perdue pour autant
       — elle est en base et visible dans le back-office —, mais personne n'a
       été prévenu, et ça doit se voir dans les journaux. */
    console.error("[devis] demande enregistrée mais NON notifiée :", { entreprise, email });
    return NextResponse.json({ ok: true, notifiee: false }, { status: 201 });
  }

  console.info("[devis] demande transmise pour", entreprise);
  return NextResponse.json({ ok: true }, { status: 201 });
}
