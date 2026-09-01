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
  /* Permet de bâtir dans un dossier séparé pour vérifier un build sans
     perturber le serveur de développement, qui garde `.next`. */
  distDir: process.env.NOVA_DIST_DIR || ".next",
};

export default withNextIntl(nextConfig);
