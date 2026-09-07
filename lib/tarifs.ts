import { unstable_cache } from "next/cache";

import { creerClientPublic } from "@/lib/supabase/server";
import { FORMULES, formaterFcfa, type Formule } from "@/lib/content";

/**
 * Tarifs modifiables depuis le back-office.
 *
 * Seul le **montant** vit en base. Les intitulés, les prestations incluses et
 * les cibles restent dans `lib/content.ts` : ce sont des textes de marque, qui
 * se relisent et se traduisent, pas des variables commerciales.
 *
 * Le prix, lui, bouge sans prévenir — et le changer ne doit pas demander une
 * modification de code suivie d'un déploiement.
 */

export const ETIQUETTE_TARIFS = "tarifs";

/** Filet si une invalidation se perd. Un tarif n'a pas à être frais à la seconde. */
const DUREE = 3600;

type LigneTarif = { formule: string; montant_fcfa: number };

/**
 * Applique les montants de la base sur les formules du code.
 *
 * Une formule absente de la base garde le prix écrit dans `content.ts` : la
 * page reste juste même si la migration n'a pas encore été jouée, plutôt que
 * d'afficher un tarif vide.
 */
function fusionner(formules: Formule[], lignes: LigneTarif[]): Formule[] {
  const parFormule = new Map(lignes.map((l) => [l.formule, l.montant_fcfa]));

  return formules.map((formule) => {
    const montant = parFormule.get(formule.id);
    if (montant === undefined || montant === formule.montantMensuel) return formule;

    /* `prix` et `prixCourt` sont des chaînes d'affichage : elles se
       recalculent à partir du montant, sinon la page montrerait l'ancien prix
       mis en forme à côté du nouveau. */
    const affiche = formaterFcfa(montant);
    return { ...formule, montantMensuel: montant, prix: affiche, prixCourt: affiche };
  });
}

/**
 * Les formules telles qu'elles doivent s'afficher, tarifs à jour.
 *
 * Passe par le client sans cookies : le prix est le même pour tout le monde,
 * la lecture est donc mise en cache et mille visiteurs ne font qu'une requête.
 */
export const chargerFormules = unstable_cache(
  async (): Promise<Formule[]> => {
    const supabase = creerClientPublic();
    const { data, error } = await supabase.from("tarifs").select("formule, montant_fcfa");

    /* Table absente — migration non jouée — ou base indisponible : le site
       continue avec les prix du code. Mieux vaut un tarif d'hier qu'une page
       en erreur. */
    if (error) {
      console.error("[tarifs] lecture impossible, prix du code utilisés :", error.message);
      return FORMULES;
    }

    return fusionner(FORMULES, (data ?? []) as LigneTarif[]);
  },
  ["formules-tarifees"],
  { tags: [ETIQUETTE_TARIFS], revalidate: DUREE },
);

/** Une formule précise, tarif à jour. */
export async function chargerFormule(id: string): Promise<Formule | undefined> {
  return (await chargerFormules()).find((f) => f.id === id);
}
