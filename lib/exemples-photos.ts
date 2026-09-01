/**
 * Photos de référence affichées dans les emplacements vides du site.
 *
 * Elles ne sont pas du contenu : elles montrent au client le cadrage, la
 * lumière et la distance attendus pour la photo qu'il doit fournir. D'où leur
 * traitement — noir et blanc, estampillées « exemple » — qui interdit de les
 * confondre avec un visuel définitif.
 *
 * Servies depuis `public/exemples/` et non depuis un CDN : le site doit
 * s'afficher correctement sur une connexion lente, et un emplacement de
 * réserve n'a pas à dépendre d'un service tiers. 356 Ko au total.
 *
 * Le détail de ce qui est attendu, emplacement par emplacement, est dans
 * `design/Nova_Assist_Elements_a_fournir.pdf`, le document remis au client.
 *
 * À la livraison des vraies photos : retirer la prop `exemple` de chaque
 * `<PhotoSlot>` et y mettre l'image fournie. Ce fichier et le dossier
 * `public/exemples/` peuvent alors disparaître.
 */

export const EXEMPLES = {
  /** Accueil, hero — portrait au casque, bureau clair, regard objectif. */
  heroPortrait: {
    src: "/exemples/hero-portrait.jpg",
    alt: "Exemple de cadrage : portrait professionnel en buste, bureau clair",
  },

  /** Accueil, section confiance — mains sur clavier, plan rapproché. */
  methode: {
    src: "/exemples/methode.jpg",
    alt: "Exemple de cadrage : plan rapproché sur des mains et un clavier",
  },

  /** Services — deux assistantes en poste, plan de trois quarts. */
  equipeAuTravail: {
    src: "/exemples/equipe-au-travail.jpg",
    alt: "Exemple de cadrage : deux personnes en poste de travail, de trois quarts",
  },

  /** À propos — portrait de la fondatrice, fond sobre. */
  portraitFondatrice: {
    src: "/exemples/portrait-fondatrice.jpg",
    alt: "Exemple de cadrage : portrait en buste sur fond uni",
  },

  /** À propos, équipe — trois portraits pris dans la même séance. */
  portraitsEquipe: [
    "/exemples/equipe-1.jpg",
    "/exemples/equipe-2.jpg",
    "/exemples/equipe-3.jpg",
  ],
} as const;
