/**
 * Numéros de téléphone : normalisation, affichage et liens WhatsApp.
 *
 * `wa.me` n'accepte qu'une forme : l'indicatif pays suivi du numéro, chiffres
 * seuls, sans `+` ni espace. Tout le reste — `+237 6 78 …`, `237678…`,
 * `678123456` — doit y être ramené avant de construire un lien.
 *
 * La règle de conduite ici est de refuser plutôt que de deviner. Un numéro
 * reconstruit de travers n'échoue pas : il aboutit chez quelqu'un d'autre, à
 * qui l'on envoie alors un lien d'activation de compte. Mieux vaut redemander.
 */

const INDICATIF_CAMEROUN = "237";

/**
 * Ramène un numéro saisi à la forme internationale attendue par `wa.me`.
 * Retourne `null` si la saisie ne correspond à aucun format reconnu.
 *
 * Les numéros camerounais comptent neuf chiffres depuis la renumérotation de
 * 2014 : `6XX XX XX XX` pour le mobile, `2XX XX XX XX` pour le fixe. Les
 * anciens numéros à huit chiffres sont refusés volontairement — leur préfixe
 * ne se rétablit pas de façon sûre, et se tromper enverrait le message à un
 * tiers.
 */
export function normaliserTelephone(brut: string): string | null {
  /* `00` est l'indicatif de sortie international, l'équivalent composé du `+`.
     Le laisser en place donnerait `wa.me/00237...` — un numéro qui n'aboutit
     nulle part. On le retire avant tout le reste. */
  const chiffres = brut.replace(/\D/g, "").replace(/^00/, "");
  if (!chiffres) return null;

  /* Déjà international camerounais. */
  if (chiffres.startsWith(INDICATIF_CAMEROUN) && chiffres.length === 12) {
    return chiffres;
  }

  /* National : neuf chiffres, mobile (6) ou fixe (2). */
  if (chiffres.length === 9 && /^[26]/.test(chiffres)) {
    return INDICATIF_CAMEROUN + chiffres;
  }

  /* Un client de la diaspora aura saisi son propre indicatif. On l'accepte
     tel quel au-delà de dix chiffres : en deçà, la saisie est trop courte
     pour porter à la fois un indicatif et un numéro. */
  if (chiffres.length >= 11 && chiffres.length <= 15) {
    return chiffres;
  }

  return null;
}

/** Forme lisible, pour l'affichage : `+237 6 78 12 34 56`. */
export function formaterTelephone(international: string): string {
  if (international.startsWith(INDICATIF_CAMEROUN) && international.length === 12) {
    const n = international.slice(3);
    return `+237 ${n[0]} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
  }
  return `+${international}`;
}

/**
 * Lien d'ouverture d'une conversation WhatsApp, message déjà rédigé.
 *
 * À ouvrir depuis un appareil où WhatsApp est installé — ou WhatsApp Web : le
 * message s'affiche dans la zone de saisie, prêt à partir, mais c'est bien la
 * personne qui appuie sur envoyer. Aucun envoi automatique n'est possible sans
 * l'API WhatsApp Business.
 */
export function lienWhatsApp(international: string, message: string): string {
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

/** Le message que Nova Assist relaie à un nouveau compte. */
export function messageActivation(contactNom: string, lien: string): string {
  const prenom = contactNom.trim().split(/\s+/)[0] || "";
  const salutation = prenom ? `Bonjour ${prenom}, ` : "Bonjour, ";

  return (
    `${salutation}ici Nova Assist.\n\n` +
    `Voici votre lien d'activation :\n${lien}\n\n` +
    `Ouvrez-le pour accéder à votre espace client. ` +
    `S'il a expiré, répondez à ce message et je vous en renvoie un.`
  );
}
