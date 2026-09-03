import createNextIntlPlugin from "next-intl/plugin";

/**
 * La langue est résolue par cookie dans `i18n/request.ts`, pas par l'URL.
 * Le jour où les routes passeront sous `app/[locale]/`, seul ce fichier de
 * requête changera — le plugin reste déclaré de la même façon.
 */
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Pastille de développement de Next désactivée. Elle n'a jamais existé en
     production ; en développement elle se posait sur le bouton de déconnexion
     du rail de l'espace client, et la déplacer ne faisait que la mettre sur
     autre chose. Repasser à `{ position: "top-right" }` pour la revoir. */
  devIndicators: false,
  /* Permet de bâtir dans un dossier séparé pour vérifier un build sans
     perturber le serveur de développement, qui garde `.next`. */
  distDir: process.env.NOVA_DIST_DIR || ".next",
};

export default withNextIntl(nextConfig);
