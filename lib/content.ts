/**
 * Contenu éditorial repris de la maquette « Nova Assist - Site.dc.html ».
 * Centralisé ici pour que l'accueil, la page Offres et le formulaire de devis
 * ne divergent jamais sur les prix ou les intitulés.
 */

export const CONTACT = {
  /* ⚠️ NUMÉRO DE TEST — 693 90 41 97, à remplacer par la ligne définitive
     avant la mise en ligne. Les deux champs ci-dessous doivent rester
     cohérents : c'est le même numéro, écrit pour l'affichage puis pour wa.me. */
  telephone: "+237 693 90 41 97",
  email: "contact@novaassist.cm",
  ville: "Douala, Cameroun",
  /* Format international sans « + » ni espaces, exigé par wa.me. */
  whatsapp: "237693904197",
} as const;

export const whatsappLink = (message = "Bonjour Nova Assist, je souhaite un devis.") =>
  `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;

export type Service = {
  numero: string;
  titre: string;
  resume: string;
  detail: string;
  formules: string;
};

export const SERVICES: Service[] = [
  {
    numero: "01",
    titre: "Relation client",
    resume: "Appels entrants, WhatsApp Business et emails traités en votre nom, avec vos réponses types.",
    detail:
      "Appels entrants, WhatsApp Business et emails traités en votre nom, avec vos réponses types et votre ton.",
    formules: "Toutes formules",
  },
  {
    numero: "02",
    titre: "Prise de rendez-vous",
    resume: "Agenda tenu à jour, rappels aux clients, réduction des rendez-vous manqués.",
    detail:
      "Agenda tenu à jour, rappels envoyés la veille, réduction nette des rendez-vous manqués.",
    formules: "Toutes formules",
  },
  {
    numero: "03",
    titre: "Recouvrement",
    resume: "Relances de factures impayées, suivi des échéances, reporting hebdomadaire.",
    detail:
      "Relances de factures impayées selon un calendrier convenu, suivi des échéances et reporting.",
    formules: "Pro · Premium",
  },
  {
    numero: "04",
    titre: "Tâches administratives",
    resume: "Saisie, devis, factures, classement de documents et gestion de boîte mail.",
    detail:
      "Saisie, devis, factures, classement de documents et gestion quotidienne de la boîte mail.",
    formules: "Toutes formules",
  },
  {
    numero: "05",
    titre: "Community management",
    resume: "Publications, réponses aux messages et commentaires, veille sur vos pages.",
    detail:
      "Publications programmées, réponses aux messages et commentaires, veille sur vos pages.",
    formules: "Premium · option",
  },
  {
    numero: "06",
    titre: "Support commercial",
    resume: "Qualification des prospects, suivi des devis envoyés, plus aucune piste oubliée.",
    detail:
      "Qualification des prospects, suivi des devis envoyés : plus aucune piste oubliée faute de relance.",
    formules: "Pro · Premium",
  },
];

export type Formule = {
  id: "essentiel" | "professionnel" | "premium";
  nom: string;
  /* `prix` et `prixCourt` sont des chaînes déjà mises en forme, bonnes à
     afficher mais pas à calculer. `montantMensuel` porte le nombre : c'est lui
     qui sert dès qu'on dérive un tarif — l'annuel, par exemple. */
  montantMensuel: number;
  prix: string;
  prixCourt: string;
  unite: string;
  pour: string;
  pourCourt: string;
  inclus: string[];
  cta: string;
  miseEnAvant: boolean;
};

export const FORMULES: Formule[] = [
  {
    id: "essentiel",
    nom: "Essentiel",
    montantMensuel: 75000,
    prix: "75 000",
    prixCourt: "75 000",
    unite: "FCFA / mois",
    pour: "Indépendant, commerce, jeune structure.",
    pourCourt: "Pour un indépendant ou un commerce.",
    inclus: [
      "20 h d'assistance par mois",
      "WhatsApp et emails",
      "Prise de rendez-vous",
      "Rapport mensuel",
    ],
    cta: "Choisir Essentiel",
    miseEnAvant: false,
  },
  {
    id: "professionnel",
    nom: "Professionnel",
    montantMensuel: 165000,
    prix: "165 000",
    prixCourt: "165 000",
    unite: "FCFA / mois",
    pour: "PME, école, clinique, cabinet.",
    pourCourt: "Pour une PME, une école, une clinique.",
    inclus: [
      "60 h d'assistance par mois",
      "Appels entrants inclus",
      "Relance et recouvrement",
      "Suivi commercial des devis",
      "Rapport hebdomadaire",
    ],
    cta: "Choisir Professionnel",
    miseEnAvant: true,
  },
  {
    id: "premium",
    nom: "Premium",
    montantMensuel: 320000,
    prix: "320 000",
    prixCourt: "320 000",
    unite: "FCFA / mois",
    pour: "Groupe multi-sites, forte volumétrie.",
    pourCourt: "Pour un cabinet ou un groupe multi-sites.",
    inclus: [
      "Assistance dédiée en continu",
      "Tous les canaux, 6j / 7",
      "Community management",
      "Interlocutrice attitrée",
      "Reporting sur mesure",
    ],
    cta: "Choisir Premium",
    miseEnAvant: false,
  },
];

/**
 * Un an réglé en dix mensualités : c'est ce que recouvre « 2 mois offerts ».
 * Le chiffre vit ici et nulle part ailleurs, pour que la remise affichée et la
 * remise facturée ne puissent pas diverger.
 */
export const MOIS_FACTURES_A_L_ANNEE = 10;

/** 750000 → « 750 000 », avec l'espace simple des prix saisis à la main. */
export function formaterFcfa(montant: number): string {
  return montant.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}

/** Tableau comparatif de la page Offres. Ordre des colonnes : Essentiel, Pro, Premium. */
export const COMPARATIF: { prestation: string; valeurs: [string, string, string] }[] = [
  { prestation: "Heures incluses", valeurs: ["20 h", "60 h", "Illimité raisonné"] },
  { prestation: "WhatsApp et emails", valeurs: ["Inclus", "Inclus", "Inclus"] },
  { prestation: "Appels entrants", valeurs: ["—", "Inclus", "Inclus"] },
  { prestation: "Recouvrement de factures", valeurs: ["—", "Inclus", "Inclus"] },
  { prestation: "Community management", valeurs: ["—", "En option", "Inclus"] },
  { prestation: "Interlocutrice attitrée", valeurs: ["—", "—", "Inclus"] },
  { prestation: "Fréquence des rapports", valeurs: ["Mensuelle", "Hebdomadaire", "Sur mesure"] },
];

export const FAQ = [
  {
    question: "Puis-je changer de formule en cours de route ?",
    reponse: "Oui, à tout moment, avec effet le mois suivant. Aucun frais de changement.",
  },
  {
    question: "Que deviennent mes heures non utilisées ?",
    reponse: "Elles sont reportées sur le mois suivant, dans la limite de 25 % du forfait.",
  },
  {
    question: "Comment se passe le paiement ?",
    reponse: "En ligne depuis votre espace client via Tara, ou par virement sur facture.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    reponse:
      "Un accord de non-divulgation est signé avant toute mission, et les accès sont nominatifs.",
  },
];

/**
 * Chiffres clés de l'accueil. La valeur numérique est isolée de son habillage
 * pour pouvoir être décomptée à l'apparition — d'où `prefixe` et `suffixe`.
 */
export const CHIFFRES = [
  {
    prefixe: "< ",
    nombre: 2,
    suffixe: " min",
    libelle: "Temps de réponse moyen",
    libelleCourt: "Réponse moyenne",
  },
  {
    prefixe: "",
    nombre: 6,
    suffixe: "j / 7",
    libelle: "Disponibilité de l'équipe",
    libelleCourt: "Disponibilité",
  },
  {
    prefixe: "",
    nombre: 100,
    suffixe: " %",
    libelle: "Confidentialité contractuelle",
    libelleCourt: "Confidentialité",
  },
  {
    prefixe: "",
    nombre: 3,
    suffixe: "",
    libelle: "Formules, sans engagement long",
    libelleCourt: "Formules",
  },
];

/** Canaux proposés à l'étape 2 du formulaire de devis. */
export const CANAUX = [
  "WhatsApp",
  "Appels",
  "Email",
  "Facebook",
  "Instagram",
  "Sur place",
] as const;

export const SECTEURS = [
  "Santé",
  "Éducation",
  "Commerce",
  "Restauration / hôtellerie",
  "Immobilier",
  "Services juridiques",
  "Autre",
] as const;

export const EFFECTIFS = [
  "1 à 10 personnes",
  "11 à 50 personnes",
  "51 à 200 personnes",
  "Plus de 200 personnes",
] as const;
