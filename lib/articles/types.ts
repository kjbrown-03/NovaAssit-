export type StatutArticle = "brouillon" | "publie" | "archive";

export type Article = {
  id: string;
  /** Adresse publique : /blog/<slug>. */
  slug: string;
  titre: string;
  /** Résumé affiché dans la liste, et repris en meta description. */
  chapo: string;
  corps: string;
  secteur?: string;
  statut: StatutArticle;
  creeLe: string;
  modifieLe: string;
  publieLe?: string;
};

/** Ce que l'éditeur du back-office transmet. */
export type NouvelArticle = {
  titre: string;
  chapo: string;
  corps: string;
  secteur?: string;
  /** Laissé vide, il est dérivé du titre. */
  slug?: string;
};

export const LIBELLES_STATUT: Record<StatutArticle, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  archive: "Archivé",
};

/** Longueurs retenues pour que la liste et les métadonnées restent lisibles. */
export const CHAPO_MAX = 200;
export const TITRE_MAX = 120;

/**
 * Fabrique l'adresse d'un article à partir de son titre.
 *
 * « Cabinet médical — ne plus perdre de rendez-vous »
 *   → « cabinet-medical-ne-plus-perdre-de-rendez-vous »
 *
 * Les accents sont décomposés puis retirés : sans ça, « médical » donnerait
 * une adresse encodée en `%C3%A9`, illisible dans la barre du navigateur et
 * dans les partages.
 */
export function fabriquerSlug(titre: string): string {
  return titre
    .normalize("NFD")
    /* Plage des diacritiques combinants, en echappements : ecrits en clair,
       ils sont invisibles a la relecture et survivent mal aux copier-coller. */
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    /* La troncature peut tomber sur un tiret : on le retire pour ne pas
       laisser d'adresse finissant par un separateur. */
    .replace(/-+$/g, "");
}

/**
 * Découpe le corps en paragraphes.
 *
 * Le corps est du texte simple, pas du Markdown : ajouter un moteur de rendu
 * signifierait une dépendance de plus, et l'assainir correctement demande plus
 * de soin que ce que ce blog exige aujourd'hui. Une ligne vide sépare deux
 * paragraphes — c'est la convention que connaît quiconque a déjà écrit un
 * email.
 */
export function enParagraphes(corps: string): string[] {
  return corps
    .split(/\n\s*\n/)
    .map((bloc) => bloc.trim())
    .filter(Boolean);
}

/** Estimation de durée de lecture, à 200 mots par minute. */
export function minutesDeLecture(corps: string): number {
  const mots = corps.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / 200));
}
