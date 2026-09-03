/** Nombre maximum de témoignages affichés sur la page d'accueil. */
export const MAX_ACCUEIL = 5;

export type StatutTemoignage = "attente" | "valide" | "refuse";

/**
 * Un témoignage est écrit ou filmé. Dans les deux cas il porte une citation :
 * pour une vidéo, elle sert de résumé affiché sous le lecteur et de texte de
 * repli si la vidéo ne charge pas.
 */
export type FormatTemoignage = "texte" | "video";

export type Temoignage = {
  id: string;
  format: FormatTemoignage;
  citation: string;
  /** Lien de la vidéo (YouTube ou Vimeo non répertorié, ou fichier hébergé). */
  videoUrl?: string;
  auteur: string;
  fonction: string;
  entreprise: string;
  ville: string;
  /** Compte client à l'origine du dépôt, pour retrouver qui a écrit quoi. */
  /* Identifiant du compte qui a déposé (`profils.id`), et non une adresse
     email : c'est la session qui fait foi. */
  auteurCompte: string;
  statut: StatutTemoignage;
  soumisLe: string;
  traiteLe?: string;
  motifRefus?: string;
};

/** Ce que le formulaire de l'espace client transmet. */
/* `auteurCompte` n'en fait pas partie : le compte est déduit de la session par
   le dépôt, jamais du formulaire — sinon un client pourrait témoigner au nom
   d'un autre. */
export type NouveauTemoignage = Omit<
  Temoignage,
  "id" | "statut" | "soumisLe" | "traiteLe" | "motifRefus" | "auteurCompte"
>;

export type Notification = {
  id: string;
  temoignageId: string;
  message: string;
  creeLe: string;
  lueLe?: string;
};

export const LIBELLES_STATUT: Record<StatutTemoignage, string> = {
  attente: "En attente de validation",
  valide: "Publié à l'accueil",
  refuse: "Refusé",
};
