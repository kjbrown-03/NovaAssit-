import { creerClientServeur } from "./server";

export type ClientAdmin = {
  id: string;
  entreprise: string;
  contact_nom: string;
  telephone: string | null;
  formule: string | null;
  role: string;
  cree_le: string;
  heures_incluses: number | null;
  heures_consommees: number | null;
  nb_demandes: number;
  nb_commandes: number;
  nb_factures_impayees: number;
};

type Agrege = { count: number }[] | null;

/** PostgREST renvoie les agrégats sous forme de tableau à un élément. */
const compte = (valeur: Agrege) => valeur?.[0]?.count ?? 0;

/**
 * Liste les comptes clients avec le volume rattaché à chacun.
 *
 * Les comptages sont demandés en ressources imbriquées plutôt qu'en requêtes
 * séparées : une seule aller-retour au lieu d'un par client. Sur une connexion
 * mesurée à 350–580 ms l'aller-retour, la différence est le confort ou non de
 * la page.
 *
 * Les factures sont comptées impayées uniquement — c'est la seule information
 * qui appelle une action.
 */
export async function listerClients(): Promise<{
  clients: ClientAdmin[];
  erreur: string | null;
}> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("profils")
    .select(
      `id, entreprise, contact_nom, telephone, formule, role, cree_le,
       heures_incluses, heures_consommees,
       demandes(count),
       commandes(count),
       factures(count)`,
    )
    /* Filtre porté sur la ressource imbriquée : il restreint les factures
       comptées sans écarter les clients qui n'en ont aucune — ce que ferait
       un `!inner`. */
    .is("factures.payee_le", null)
    .order("cree_le", { ascending: false })
    .limit(200);

  if (error) return { clients: [], erreur: error.message };

  const clients = (data ?? []).map((ligne) => {
    const l = ligne as Record<string, unknown>;
    return {
      id: l.id as string,
      entreprise: l.entreprise as string,
      contact_nom: l.contact_nom as string,
      telephone: (l.telephone as string | null) ?? null,
      formule: (l.formule as string | null) ?? null,
      role: (l.role as string) ?? "client",
      cree_le: l.cree_le as string,
      heures_incluses: (l.heures_incluses as number | null) ?? null,
      heures_consommees: (l.heures_consommees as number | null) ?? null,
      nb_demandes: compte(l.demandes as Agrege),
      nb_commandes: compte(l.commandes as Agrege),
      nb_factures_impayees: compte(l.factures as Agrege),
    };
  });

  return { clients, erreur: null };
}
