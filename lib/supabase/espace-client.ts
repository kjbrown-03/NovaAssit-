import { creerClientServeur } from "./server";

export type Formule = "essentiel" | "professionnel" | "premium";
export type StatutDemande = "en_cours" | "attente_retour" | "terminee";

export type Profil = {
  id: string;
  entreprise: string;
  contact_nom: string;
  /* Sert à renvoyer l'administration vers son back-office plutôt que vers le
     tableau de bord client. Lu avec le profil pour éviter une requête dédiée.
     Absent tant que la migration 003 n'a pas été jouée. */
  role?: string;
  formule: Formule | null;
  heures_incluses: number | null;
  heures_consommees: number | null;
};

export type Demande = {
  id: number;
  reference: string;
  objet: string;
  statut: StatutDemande;
  prioritaire: boolean;
  recue_le: string;
};

export type Facture = {
  id: number;
  numero: string;
  montant_fcfa: number;
  echeance: string;
  payee_le: string | null;
};

export type Document = {
  id: number;
  titre: string;
  type: string;
  ajoute_le: string;
};

export type DonneesTableauDeBord = {
  profil: Profil | null;
  demandes: Demande[];
  documents: Document[];
  prochaineFacture: Facture | null;
  enCours: number;
  prioritaires: number;
};

/**
 * Charge tout ce qu'affiche le tableau de bord, en une passe.
 *
 * Aucune clause `where profil_id = …` n'est écrite ici : les politiques RLS
 * s'en chargent côté base. Le client connecté ne peut ramener que ses lignes,
 * même si cette fonction était appelée avec un mauvais identifiant.
 */
/* Colonnes du profil, avec et sans `role`.

   `role` n'existe qu'après la migration 003. PostgREST rejette la requête
   entière si une colonne demandée est absente : sans repli, un projet dont la
   migration n'a pas encore été jouée verrait le tableau de bord de tous ses
   clients se vider d'un coup. */
const COLONNES_PROFIL = "id, entreprise, contact_nom, role, formule, heures_incluses, heures_consommees";
const COLONNES_PROFIL_SANS_ROLE = "id, entreprise, contact_nom, formule, heures_incluses, heures_consommees";

export async function chargerTableauDeBord(): Promise<DonneesTableauDeBord> {
  const supabase = await creerClientServeur();

  /* Filtrer explicitement sur le compte connecté, au lieu de laisser RLS le
     faire.

     Ces requêtes s'appuyaient sur RLS pour ne ramener que les lignes du
     visiteur — ce qui a cessé d'être vrai à la migration 003 : la politique
     « admin lit tous les profils » fait remonter TOUS les profils à un compte
     d'administration, et `maybeSingle()` échoue dès qu'il y a plus d'une
     ligne. Le profil revenait donc vide pour l'administration, sans rôle, donc
     sans redirection vers le back-office.

     `getSession()` lit le cookie sans appel réseau. L'identifiant ne sert ici
     qu'à filtrer : la sécurité reste portée par RLS, qui refuserait de toute
     façon les lignes d'autrui. */
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const monId = session?.user?.id ?? "";

  const [profilRes, demandesRes, documentsRes, facturesRes] = await Promise.all([
    supabase.from("profils").select(COLONNES_PROFIL).eq("id", monId).maybeSingle(),
    supabase
      .from("demandes")
      .select("id, reference, objet, statut, prioritaire, recue_le")
      .eq("profil_id", monId)
      .order("recue_le", { ascending: false })
      .limit(5),
    supabase
      .from("documents")
      .select("id, titre, type, ajoute_le")
      .eq("profil_id", monId)
      .order("ajoute_le", { ascending: false })
      .limit(3),
    supabase
      .from("factures")
      .select("id, numero, montant_fcfa, echeance, payee_le")
      .eq("profil_id", monId)
      .is("payee_le", null)
      .order("echeance", { ascending: true })
      .limit(1),
  ]);

  /* Repli si la colonne `role` manque encore. Une seconde requête, mais
     uniquement dans ce cas — jamais sur un projet à jour. */
  /* `unknown` : les deux requêtes ne renvoient pas la même forme — l'une porte
     `role`, l'autre non. Le type réel est rétabli à la sortie. */
  let profilData: unknown = profilRes.data;
  if (profilRes.error) {
    const repli = await supabase
      .from("profils")
      .select(COLONNES_PROFIL_SANS_ROLE)
      .eq("id", monId)
      .maybeSingle();
    profilData = repli.data;
  }

  const demandes = (demandesRes.data ?? []) as Demande[];

  return {
    profil: (profilData as Profil | null) ?? null,
    demandes,
    documents: (documentsRes.data ?? []) as Document[],
    prochaineFacture: ((facturesRes.data ?? [])[0] as Facture | undefined) ?? null,
    enCours: demandes.filter((d) => d.statut !== "terminee").length,
    prioritaires: demandes.filter((d) => d.prioritaire && d.statut !== "terminee").length,
  };
}

/* ---------------------------------------------------------------- affichage */

const LIBELLE_STATUT: Record<StatutDemande, string> = {
  en_cours: "En cours",
  attente_retour: "Attente retour",
  terminee: "Terminée",
};

export const libelleStatut = (s: StatutDemande) => LIBELLE_STATUT[s];

/* Pastilles de statut : fond très pâle, texte foncé de la même famille et
   anneau fin — les classes vivent dans `app/globals.css`. La couleur ne porte
   jamais seule le sens : chaque statut est aussi accompagné d'une icône. */
export const STYLE_STATUT: Record<StatutDemande, string> = {
  en_cours: "na-statut na-statut-cours",
  attente_retour: "na-statut na-statut-attente",
  terminee: "na-statut na-statut-succes",
};

const LIBELLE_FORMULE: Record<Formule, string> = {
  essentiel: "Essentiel",
  professionnel: "Professionnel",
  premium: "Premium",
};

export const libelleFormule = (f: Formule | null) =>
  f ? `Formule ${LIBELLE_FORMULE[f]}` : "Formule à définir";

/** « 28 août » — format court, comme dans la maquette. */
export function dateCourte(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(iso),
  );
}

/** « 1er septembre » — l'échéance d'une facture se lit en entier. */
export function dateEcheance(iso: string): string {
  const d = new Date(iso);
  const jour = d.getDate();
  const mois = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(d);
  return `${jour === 1 ? "1er" : jour} ${mois}`;
}

/** « 165 000 » — espaces insécables fines, à la française. */
export const montant = (fcfa: number) => new Intl.NumberFormat("fr-FR").format(fcfa);

/** « Semaine du 24 au 30 août 2026 » — lundi au dimanche de la semaine en cours. */
export function semaineCourante(maintenant = new Date()): string {
  const lundi = new Date(maintenant);
  /* getDay() : 0 = dimanche. On recule jusqu'au lundi précédent. */
  const decalage = (lundi.getDay() + 6) % 7;
  lundi.setDate(lundi.getDate() - decalage);

  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  const memeMois = lundi.getMonth() === dimanche.getMonth();
  const moisLundi = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(lundi);
  const moisDimanche = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(dimanche);

  return memeMois
    ? `Semaine du ${lundi.getDate()} au ${dimanche.getDate()} ${moisDimanche} ${dimanche.getFullYear()}`
    : `Semaine du ${lundi.getDate()} ${moisLundi} au ${dimanche.getDate()} ${moisDimanche} ${dimanche.getFullYear()}`;
}
