import type { MetadataRoute } from "next";

/**
 * Manifeste d'application — c'est lui qui rend Nova Assist installable sur
 * l'écran d'accueil.
 *
 * Sans ce fichier, aucun écran de lancement n'existe : un site web ordinaire
 * n'en a pas. Une fois installé, le système en affiche un lui-même, construit
 * à partir de `background_color` et de l'icône — d'où le bleu nuit, qui doit
 * être exactement celui du voile animé pour que le passage de l'un à l'autre
 * ne se voie pas.
 *
 * `display: standalone` retire la barre d'adresse ; c'est aussi ce que détecte
 * le script de `layout.tsx` pour décider d'animer ou non le logotype.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nova Assist",
    short_name: "Nova Assist",
    description:
      "Assistance virtuelle à Douala : appels, WhatsApp, emails et suivi commercial pris en charge par une équipe dédiée.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1f3a",
    theme_color: "#0b1f3a",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      /* `maskable` : Android rogne l'icône selon la forme du lanceur. Cette
         version garde la lettre dans la zone sûre, sinon le N serait coupé. */
      {
        src: "/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
