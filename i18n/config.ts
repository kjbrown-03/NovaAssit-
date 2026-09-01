/**
 * Réglages partagés par le serveur et le client. Ce fichier ne doit importer
 * ni `next/headers` ni quoi que ce soit de réservé au serveur : il est lu
 * aussi bien par le sélecteur de langue que par la configuration de requête.
 */
export const LANGUES = ["fr", "en"] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_DEFAUT: Langue = "fr";

/** Nom du cookie qui retient le choix du visiteur. */
export const COOKIE_LANGUE = "nova-langue";

/** Libellés du sélecteur, dans leur propre langue. */
export const LIBELLES_LANGUE: Record<Langue, string> = {
  fr: "Français",
  en: "English",
};

export function estLangue(valeur: unknown): valeur is Langue {
  return typeof valeur === "string" && (LANGUES as readonly string[]).includes(valeur);
}
