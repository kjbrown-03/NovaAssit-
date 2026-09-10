/**
 * Fabrication du PDF de devis, sans bibliothèque.
 *
 * Pourquoi à la main : le disque du poste de développement est plein à 100 %
 * — 167 Mo libres — et `npm install` d'un moteur PDF finirait de le saturer.
 * Or un PDF est un format texte : pour un document d'une page en Helvetica,
 * l'écrire soi-même tient en quelques centaines de lignes et ne dépend de
 * rien.
 *
 * Le fichier produit est un PDF 1.4 : un catalogue, une page, un flux de
 * contenu, deux polices de base — celles que tout lecteur embarque, donc
 * aucune police à joindre — et une table de références croisées.
 */

/* Les polices de base sont encodées en WinAnsi, c'est-à-dire Latin-1 : les
   accents français y sont tous. Ce qui n'y est pas est remplacé plutôt que
   d'écrire un octet invalide. */
const REMPLACEMENTS: Record<string, string> = {
  "’": "'", // apostrophe typographique
  "‘": "'",
  "“": '"',
  "”": '"',
  "–": "-", // demi-cadratin
  "—": "-",
  "…": "...",
  " ": " ", // espace insécable
  " ": " ", // espace fine insécable
};

function versLatin1(valeur: string): string {
  let s = valeur;
  for (const [de, vers] of Object.entries(REMPLACEMENTS)) s = s.split(de).join(vers);
  /* Tout ce qui dépasse Latin-1 devient un point d'interrogation : mieux vaut
     un caractère visiblement faux qu'un fichier illisible. */
  return s.replace(/[^\x20-\xFF\n]/g, "?");
}

/** Dans une chaîne PDF, la parenthèse et la barre oblique inverse se ferment. */
function echapper(valeur: string): string {
  return versLatin1(valeur).replace(/([\\()])/g, "\\$1");
}

/* Largeurs Helvetica et Helvetica-Bold, en millièmes de cadratin, pour les
   codes 32 à 126. Elles servent à centrer et à aligner à droite : sans elles,
   il faudrait tout aligner à gauche. Les accentuées reprennent la largeur de
   leur lettre de base, ce qui est exact pour ces deux polices. */
const LARGEURS_NORMALE = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const LARGEURS_GRASSE = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

/** Largeur d'un texte, en points, à la taille donnée. */
function largeur(texte: string, taille: number, gras = false): number {
  const table = gras ? LARGEURS_GRASSE : LARGEURS_NORMALE;
  let total = 0;
  for (const c of versLatin1(texte)) {
    const code = c.charCodeAt(0);
    /* Les accentuées (au-delà de 126) reprennent la largeur d'une minuscule
       ordinaire : l'écart est négligeable dans ces deux polices. */
    total += code >= 32 && code <= 126 ? table[code - 32] : 556;
  }
  return (total / 1000) * taille;
}

/* --------------------------------------------------------------- couleurs */
const NAVY = "0.043 0.122 0.227";
const OR = "0.788 0.635 0.153";
const ENCRE = "0.122 0.161 0.216";
const GRIS = "0.42 0.45 0.49";
const FILET = "0.85 0.84 0.82";
const BLANC = "1 1 1";

/* ------------------------------------------------------------ page A4 */
const LARGEUR_PAGE = 595.28;
const HAUTEUR_PAGE = 841.89;
const MARGE = 56;

type Options = {
  taille?: number;
  gras?: boolean;
  couleur?: string;
  /** Position horizontale : depuis la gauche, le centre, ou la droite. */
  ancrage?: "gauche" | "centre" | "droite";
};

/** Le constructeur de flux de contenu : tout ce qu'on dessine passe par lui. */
class Toile {
  private ops: string[] = [];

  texte(x: number, y: number, valeur: string, o: Options = {}) {
    const { taille = 10.5, gras = false, couleur = ENCRE, ancrage = "gauche" } = o;
    let posX = x;
    if (ancrage !== "gauche") {
      const l = largeur(valeur, taille, gras);
      posX = ancrage === "centre" ? x - l / 2 : x - l;
    }
    this.ops.push(
      `BT /${gras ? "F2" : "F1"} ${taille} Tf ${couleur} rg ` +
        `${posX.toFixed(2)} ${y.toFixed(2)} Td (${echapper(valeur)}) Tj ET`,
    );
  }

  /** Texte serif, pour le logotype uniquement. */
  logotype(x: number, y: number, valeur: string, taille: number, couleur: string, ecart = 0) {
    this.ops.push(
      `BT /F3 ${taille} Tf ${couleur} rg ${ecart} Tc ` +
        `${x.toFixed(2)} ${y.toFixed(2)} Td (${echapper(valeur)}) Tj 0 Tc ET`,
    );
  }

  rectangle(x: number, y: number, l: number, h: number, couleur: string) {
    this.ops.push(`${couleur} rg ${x.toFixed(2)} ${y.toFixed(2)} ${l.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  filet(x1: number, y1: number, x2: number, y2: number, couleur = FILET, epaisseur = 0.7) {
    this.ops.push(
      `${couleur} RG ${epaisseur} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ` +
        `${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
  }

  /** Découpe un paragraphe à la largeur voulue et renvoie le `y` atteint. */
  paragraphe(x: number, y: number, valeur: string, largeurMax: number, o: Options = {}): number {
    const { taille = 10.5, gras = false } = o;
    const mots = versLatin1(valeur).split(/\s+/).filter(Boolean);
    let ligne = "";
    let curseur = y;

    for (const mot of mots) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (largeur(essai, taille, gras) > largeurMax && ligne) {
        this.texte(x, curseur, ligne, o);
        curseur -= taille * 1.45;
        ligne = mot;
      } else {
        ligne = essai;
      }
    }
    if (ligne) {
      this.texte(x, curseur, ligne, o);
      curseur -= taille * 1.45;
    }
    return curseur;
  }

  rendu(): string {
    return this.ops.join("\n");
  }
}

export type DevisAImprimer = {
  reference: string;
  entreprise: string;
  contactNom: string;
  email: string;
  telephone: string | null;
  secteur: string | null;
  effectif: string | null;
  domaines: string[];
  canaux: string[];
  messagesParJour: string | null;
  plage: string | null;
  prestation: string | null;
  montantFcfa: number;
  etabliLe: Date;
  validiteJours: number;
};

const montantFr = (fcfa: number) =>
  new Intl.NumberFormat("fr-FR").format(fcfa).replace(/ | /g, " ");

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Compose la page et renvoie le PDF complet. */
export function fabriquerDevisPdf(devis: DevisAImprimer): Uint8Array {
  const t = new Toile();
  const droite = LARGEUR_PAGE - MARGE;
  const largeurUtile = droite - MARGE;

  /* ------------------------------------------------------------- bandeau */
  t.rectangle(0, HAUTEUR_PAGE - 118, LARGEUR_PAGE, 118, NAVY);
  t.logotype(MARGE, HAUTEUR_PAGE - 62, "NOVA", 20, BLANC);
  t.logotype(MARGE + largeur("NOVA", 20) + 10, HAUTEUR_PAGE - 62, "ASSIST", 20, OR, 2.6);
  t.texte(MARGE, HAUTEUR_PAGE - 84, "Assistance virtuelle - Douala, Cameroun", {
    taille: 8.5,
    couleur: "0.75 0.78 0.82",
  });
  t.texte(droite, HAUTEUR_PAGE - 58, "DEVIS", {
    taille: 22,
    gras: true,
    couleur: OR,
    ancrage: "droite",
  });
  t.texte(droite, HAUTEUR_PAGE - 78, devis.reference, {
    taille: 9.5,
    couleur: "0.75 0.78 0.82",
    ancrage: "droite",
  });

  let y = HAUTEUR_PAGE - 158;

  /* ----------------------------------------------------------- en-têtes */
  t.texte(MARGE, y, "ÉTABLI POUR", { taille: 8, gras: true, couleur: GRIS });
  t.texte(droite, y, "ÉTABLI LE", { taille: 8, gras: true, couleur: GRIS, ancrage: "droite" });
  y -= 16;

  t.texte(MARGE, y, devis.entreprise, { taille: 13, gras: true, couleur: NAVY });
  t.texte(droite, y, dateFr(devis.etabliLe), { taille: 11, ancrage: "droite" });
  y -= 15;

  t.texte(MARGE, y, devis.contactNom, { taille: 10.5, couleur: GRIS });
  const expire = new Date(devis.etabliLe);
  expire.setDate(expire.getDate() + devis.validiteJours);
  t.texte(droite, y, `Valable jusqu'au ${dateFr(expire)}`, {
    taille: 9.5,
    couleur: GRIS,
    ancrage: "droite",
  });
  y -= 14;

  t.texte(MARGE, y, devis.email, { taille: 10, couleur: GRIS });
  y -= 14;
  if (devis.telephone) {
    t.texte(MARGE, y, devis.telephone, { taille: 10, couleur: GRIS });
    y -= 14;
  }

  y -= 12;
  t.filet(MARGE, y, droite, y);
  y -= 26;

  /* --------------------------------------------------- besoin recueilli */
  t.texte(MARGE, y, "VOTRE BESOIN", { taille: 8, gras: true, couleur: GRIS });
  y -= 20;

  const lignes: [string, string][] = [
    ["Secteur", devis.secteur ?? "Non précisé"],
    ["Effectif", devis.effectif ?? "Non précisé"],
    ["Domaines à déléguer", devis.domaines.join(", ") || "Non précisé"],
    ["Canaux", devis.canaux.join(", ") || "Non précisé"],
    ["Volume par jour", devis.messagesParJour ?? "Non précisé"],
    ["Amplitude horaire", devis.plage ?? "Non précisé"],
  ];

  for (const [intitule, valeur] of lignes) {
    t.texte(MARGE, y, intitule, { taille: 9.5, couleur: GRIS });
    const finBloc = t.paragraphe(MARGE + 150, y, valeur, largeurUtile - 150, { taille: 10.5 });
    y = Math.min(y - 19, finBloc - 5);
  }

  y -= 10;
  t.filet(MARGE, y, droite, y);
  y -= 30;

  /* ------------------------------------------------------- la prestation */
  t.texte(MARGE, y, "NOTRE PROPOSITION", { taille: 8, gras: true, couleur: GRIS });
  y -= 20;

  if (devis.prestation) {
    y = t.paragraphe(MARGE, y, devis.prestation, largeurUtile, { taille: 11 }) - 8;
  }

  /* Le prix, dans un bloc qui se voit — c'est la seule ligne que le
     destinataire cherche en ouvrant le document. */
  const hauteurBloc = 62;
  t.rectangle(MARGE, y - hauteurBloc, largeurUtile, hauteurBloc, "0.988 0.984 0.957");
  t.rectangle(MARGE, y - hauteurBloc, 3, hauteurBloc, OR);
  t.texte(MARGE + 22, y - 26, "Montant proposé", { taille: 10, couleur: GRIS });
  t.texte(droite - 22, y - 34, `${montantFr(devis.montantFcfa)} FCFA`, {
    taille: 21,
    gras: true,
    couleur: NAVY,
    ancrage: "droite",
  });
  t.texte(MARGE + 22, y - 44, "par mois, hors taxes", { taille: 9, couleur: GRIS });
  y -= hauteurBloc + 30;

  /* ------------------------------------------------------------ mentions */
  const mentions =
    "Ce devis est établi sur la base des informations que vous nous avez transmises. " +
    "Toute modification du volume ou des canaux fera l'objet d'un ajustement convenu " +
    "à l'avance. Un accord de non-divulgation est signé avant le début de toute mission.";
  y = t.paragraphe(MARGE, y, mentions, largeurUtile, { taille: 9.5, couleur: GRIS });

  /* --------------------------------------------------------------- pied */
  t.filet(MARGE, 92, droite, 92);
  t.texte(MARGE, 76, "Nova Assist - Assistance virtuelle", { taille: 9, gras: true, couleur: NAVY });
  t.texte(MARGE, 63, "Douala, Cameroun", { taille: 8.5, couleur: GRIS });
  t.texte(droite, 76, "Pour accepter ce devis, répondez à ce message.", {
    taille: 8.5,
    couleur: GRIS,
    ancrage: "droite",
  });

  return assembler(t.rendu());
}

/**
 * Emballe le flux de contenu dans la structure du fichier.
 *
 * La table de références croisées donne la position en OCTETS de chaque objet
 * depuis le début du fichier : elle se construit donc au fur et à mesure de
 * l'écriture, et jamais avant. C'est le seul point délicat du format — une
 * position fausse et le lecteur refuse le document.
 */
function assembler(flux: string): Uint8Array {
  const objets = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGEUR_PAGE} ${HAUTEUR_PAGE}] ` +
      "/Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(flux, "latin1")} >>\nstream\n${flux}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>",
  ];

  let fichier = "%PDF-1.4\n";
  const positions: number[] = [];

  objets.forEach((corps, i) => {
    positions.push(Buffer.byteLength(fichier, "latin1"));
    fichier += `${i + 1} 0 obj\n${corps}\nendobj\n`;
  });

  const debutTable = Buffer.byteLength(fichier, "latin1");
  fichier += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  for (const p of positions) {
    fichier += `${String(p).padStart(10, "0")} 00000 n \n`;
  }
  fichier +=
    `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${debutTable}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(fichier, "latin1"));
}
