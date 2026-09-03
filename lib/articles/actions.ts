"use server";

import { revalidatePath } from "next/cache";

import { identiteAdmin } from "@/lib/supabase/admin";
import { changerStatut, creer, lireParId, modifier, supprimer } from "./depot";
import {
  CHAPO_MAX,
  TITRE_MAX,
  fabriquerSlug,
  type NouvelArticle,
  type StatutArticle,
} from "./types";

export type EtatEditeur = {
  ok: boolean;
  message?: string;
  erreurs?: Partial<Record<string, string>>;
  /** Identifiant de l'article créé, pour que l'éditeur passe en modification. */
  id?: string;
};

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);
  return typeof valeur === "string" ? valeur.trim() : "";
}

/**
 * Toutes les écritures repassent par ce contrôle.
 *
 * RLS refuserait déjà l'écriture à un non-administrateur, mais une action
 * serveur est une porte ouverte sur Internet : mieux vaut la refermer ici,
 * avec un message clair, que de laisser la base répondre par une erreur
 * technique.
 */
async function refuserSiPasAdmin(): Promise<EtatEditeur | null> {
  const admin = await identiteAdmin();
  if (admin) return null;
  return { ok: false, message: "Action réservée à l'administration." };
}

/** Rafraîchit tout ce qui montre des articles. */
function rafraichir(slug?: string) {
  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

/* ------------------------------------------------------------- rédaction */

export async function enregistrerArticle(
  _precedent: EtatEditeur,
  donnees: FormData,
): Promise<EtatEditeur> {
  const refus = await refuserSiPasAdmin();
  if (refus) return refus;

  const id = texte(donnees, "id");
  const titre = texte(donnees, "titre");
  const chapo = texte(donnees, "chapo");
  const corps = texte(donnees, "corps");
  const secteur = texte(donnees, "secteur");
  const slugSaisi = texte(donnees, "slug");

  const erreurs: Record<string, string> = {};

  if (!titre) erreurs.titre = "Donnez un titre à l'article.";
  else if (titre.length > TITRE_MAX)
    erreurs.titre = `Trop long : ${titre.length} caractères pour ${TITRE_MAX} maximum.`;

  if (!chapo) erreurs.chapo = "Le chapô sert de résumé dans la liste et sur Google.";
  else if (chapo.length > CHAPO_MAX)
    erreurs.chapo = `Trop long : ${chapo.length} caractères pour ${CHAPO_MAX} maximum.`;

  if (!corps) erreurs.corps = "Écrivez l'article.";

  /* L'adresse peut être saisie à la main — pour corriger une formulation, ou
     garder l'adresse d'un article dont on change le titre. Sinon elle vient du
     titre. Dans les deux cas elle repasse par le même nettoyage. */
  const slug = fabriquerSlug(slugSaisi || titre);
  if (!slug) {
    erreurs.slug =
      "L'adresse ne peut pas être déduite de ce titre. Saisissez-la à la main.";
  }

  if (Object.keys(erreurs).length > 0) {
    return { ok: false, erreurs, message: "Le formulaire comporte des erreurs.", id: id || undefined };
  }

  const entree: NouvelArticle & { slug: string } = {
    slug,
    titre,
    chapo,
    corps,
    secteur: secteur || undefined,
  };

  const resultat = id ? await modifier(id, entree) : await creer(entree);

  if ("erreur" in resultat) {
    return { ok: false, message: resultat.erreur, id: id || undefined };
  }

  rafraichir(resultat.slug);

  return {
    ok: true,
    id: resultat.id,
    message: id
      ? "Modifications enregistrées."
      : "Brouillon créé. Publiez-le quand il sera prêt.",
  };
}

/* -------------------------------------------------------------- parution */

async function basculer(donnees: FormData, statut: StatutArticle): Promise<void> {
  if (await refuserSiPasAdmin()) return;

  const id = texte(donnees, "id");
  if (!id) return;

  /* L'adresse est lue avant la bascule : après un archivage, la page publique
     doit être rafraîchie elle aussi pour cesser de servir l'article. */
  const avant = await lireParId(id);
  await changerStatut(id, statut);
  rafraichir(avant?.slug);
}

export async function publierArticle(donnees: FormData): Promise<void> {
  await basculer(donnees, "publie");
}

/** Retire l'article du site sans le perdre : il repasse en brouillon. */
export async function depublierArticle(donnees: FormData): Promise<void> {
  await basculer(donnees, "brouillon");
}

export async function archiverArticle(donnees: FormData): Promise<void> {
  await basculer(donnees, "archive");
}

export async function supprimerArticle(donnees: FormData): Promise<void> {
  if (await refuserSiPasAdmin()) return;

  const id = texte(donnees, "id");
  if (!id) return;

  const avant = await lireParId(id);
  await supprimer(id);
  rafraichir(avant?.slug);
}
