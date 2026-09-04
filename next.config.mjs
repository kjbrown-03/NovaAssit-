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

  /**
   * En-têtes de sécurité, appliqués à toutes les réponses.
   *
   * Aucun n'était posé : le site reposait entièrement sur la configuration de
   * l'hébergeur. Ceux-ci relèvent du code et suivent donc le dépôt.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          /* HSTS : impose HTTPS pour deux ans, sous-domaines compris. Le
             navigateur refusera de repasser en clair, même si un lien
             http:// traîne quelque part. Sans effet en développement, où
             l'en-tête est ignoré sur http://localhost. */
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          /* Interdit au navigateur de deviner un type MIME : un fichier
             déposé comme .txt ne sera jamais exécuté comme du script. */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* L'adresse complète ne fuit pas vers un site tiers ; l'origine
             seule suffit aux statistiques de provenance. */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Le site ne s'embarque nulle part : personne ne peut le poser dans
             une iframe pour piéger les clics d'un client connecté. */
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          /* CSP volontairement partielle. `script-src` exigerait un nonce par
             requête — donc de faire passer chaque page par le middleware, que
             l'on a justement restreint pour tenir la charge. Les quatre
             directives retenues ne cassent aucun script en ligne et couvrent
             le détournement de clic, l'injection de balise <base>, les
             greffons et le détournement de formulaire. */
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
