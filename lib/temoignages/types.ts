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
  auteurCompte: string;
  statut: StatutTemoignage;
  soumisLe: string;
  traiteLe?: string;
  motifRefus?: string;
};

/** Ce que le formulaire de l'espace client transmet. */
export type NouveauTemoignage = Omit<
  Temoignage,
  "id" | "statut" | "soumisLe" | "traiteLe" | "motifRefus"
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
