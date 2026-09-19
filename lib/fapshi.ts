/**
 * Client Fapshi — encaissement par MTN Mobile Money et Orange Money.
 *
 * Fapshi n'a que deux appels utiles ici : créer un lien de paiement, et relire
 * l'état d'une transaction. Tout le reste — le choix de l'opérateur, la saisie
 * du numéro, le code PIN — se passe sur la page hébergée par Fapshi.
 *
 * Les identifiants viennent du service « Nova Assist » créé sur le dashboard
 * Fapshi (Developers → Live API Keys). Ils sont propres à l'environnement :
 * `FAPSHI_BASE_URL` pointe sur `https://live.fapshi.com` en production.
 *
 * Doc : https://docs.fapshi.com/en/api-reference/getting-started
 */

/** États d'une transaction tels que Fapshi les renvoie. */
export type StatutFapshi = "CREATED" | "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";

/** Corps renvoyé par `payment-status`, et reçu tel quel par le webhook. */
export type TransactionFapshi = {
  transId: string;
  status: StatutFapshi;
  medium?: string;
  amount?: number;
  externalId?: string;
  userId?: string;
  email?: string;
  payerName?: string;
  dateInitiated?: string;
  dateConfirmed?: string;
};

function configuration() {
  const base = process.env.FAPSHI_BASE_URL;
  const apiuser = process.env.FAPSHI_API_USER;
  const apikey = process.env.FAPSHI_API_KEY;
  if (!base || !apiuser || !apikey) return null;
  return { base: base.replace(/\/$/, ""), entetes: { apiuser, apikey } };
}

/** Vrai quand les trois variables sont posées — sinon la page de paiement le dit. */
export function fapshiConfigure(): boolean {
  return configuration() !== null;
}

/**
 * Crée un lien de paiement.
 *
 * `externalId` est notre numéro de commande : c'est lui qu'on retrouve dans
 * le dashboard Fapshi et dans le webhook, indépendamment du `transId`.
 * Le lien expire après 24 h.
 */
export async function initierPaiement(params: {
  montantFcfa: number;
  email?: string;
  commandeId: number;
  profilId: string;
  message: string;
  redirectUrl: string;
}): Promise<{ ok: true; lien: string; transId: string } | { ok: false; erreur: string }> {
  const config = configuration();
  if (!config) return { ok: false, erreur: "Paiement en ligne non configuré." };

  /* Fapshi n'accepte que [a-zA-Z0-9_-] sur 1 à 100 caractères pour ces deux
     champs ; l'UUID du profil et l'entier de commande y rentrent tels quels. */
  const corps = {
    amount: Math.round(params.montantFcfa),
    email: params.email,
    externalId: `commande-${params.commandeId}`,
    userId: params.profilId,
    message: params.message,
    redirectUrl: params.redirectUrl,
  };

  let reponse: Response;
  try {
    reponse = await fetch(`${config.base}/initiate-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...config.entetes },
      body: JSON.stringify(corps),
      cache: "no-store",
    });
  } catch (e) {
    console.error("[fapshi] initiate-pay injoignable :", e);
    return { ok: false, erreur: "Le service de paiement ne répond pas. Réessayez dans un instant." };
  }

  const donnees = (await reponse.json().catch(() => null)) as
    | { link?: string; transId?: string; message?: string }
    | null;

  if (!reponse.ok || !donnees?.link || !donnees.transId) {
    console.error("[fapshi] initiate-pay refusé :", reponse.status, donnees?.message);
    return { ok: false, erreur: "Le lien de paiement n'a pas pu être créé." };
  }

  return { ok: true, lien: donnees.link, transId: donnees.transId };
}

/**
 * Relit l'état d'une transaction auprès de Fapshi.
 *
 * C'est la seule source de vérité : le webhook n'est envoyé qu'une fois, sans
 * relance, et son contenu ne suffit pas à marquer une commande payée — on
 * confirme toujours ici avant d'écrire en base.
 */
export async function statutPaiement(
  transId: string,
): Promise<TransactionFapshi | null> {
  const config = configuration();
  if (!config) return null;

  /* Un `transId` vient toujours de Fapshi, mais il transite par une URL : on
     refuse tout ce qui pourrait sortir du chemin. */
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(transId)) return null;

  try {
    const reponse = await fetch(`${config.base}/payment-status/${transId}`, {
      headers: config.entetes,
      cache: "no-store",
    });
    if (!reponse.ok) {
      console.error("[fapshi] payment-status :", reponse.status);
      return null;
    }
    return (await reponse.json()) as TransactionFapshi;
  } catch (e) {
    console.error("[fapshi] payment-status injoignable :", e);
    return null;
  }
}
