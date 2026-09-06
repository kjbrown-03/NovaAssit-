/**
 * Rédaction initiale du blog.
 *
 * Insère les trois premiers articles, ceux que la page annonçait depuis le
 * début sans qu'ils existent. Idempotent : rejoué, il met à jour l'article
 * portant la même adresse plutôt que d'en créer un doublon.
 *
 * Usage : node scripts/articles-initiaux.mjs [--brouillon]
 *
 * Par défaut les articles sont publiés. `--brouillon` les laisse en attente
 * de relecture dans le back-office.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const racine = process.cwd();
const exiger = createRequire(path.join(racine, "package.json"));
const { createClient } = exiger("@supabase/supabase-js");

const env = { ...process.env };
const fichier = path.join(racine, ".env.local");
if (fs.existsSync(fichier)) {
  for (const l of fs.readFileSync(fichier, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const brouillon = process.argv.includes("--brouillon");

const ARTICLES = [
  {
    slug: "assistance-pour-une-pme-par-ou-commencer",
    titre: "Assistance pour une PME : par où commencer",
    secteur: "PME",
    chapo:
      "Déléguer ne commence pas par recruter. Cela commence par regarder honnêtement où partent vos heures, et par en confier une seule catégorie.",
    corps: `La plupart des dirigeants que nous rencontrons à Douala ne manquent pas de travail. Ils manquent de journées. Entre les appels qui arrivent pendant un rendez-vous, les messages WhatsApp auxquels il faut répondre le soir et les factures qu'on relance quand on y pense, la gestion mange le temps du métier.

La tentation, à ce stade, est de recruter. C'est souvent l'erreur. Un poste à temps plein coûte un salaire, une formation, un bureau, et surtout du temps de management — celui-là même qui vous manque. Beaucoup de structures découvrent après six mois qu'elles ont ajouté une charge sans retirer la leur.

Commencez par mesurer, pas par embaucher

Pendant une semaine, notez ce que vous faites par tranches d'une demi-heure. Sans juger, sans corriger. La plupart des gens qui font cet exercice découvrent deux choses : le temps réellement passé à leur métier est plus faible qu'ils ne le croyaient, et les interruptions sont concentrées sur trois ou quatre types de sollicitations toujours identiques.

C'est cette liste qui décide de ce qu'il faut déléguer. Pas une intuition.

Déléguez une catégorie, pas des tâches éparses

L'erreur suivante consiste à confier un peu de tout. Une tâche isolée demande d'être expliquée à chaque fois : le gain disparaît dans les allers-retours.

Une catégorie entière, à l'inverse, se transmet une fois. « Toutes les demandes de rendez-vous », c'est délégable. « Le rendez-vous de mardi avec M. Fotso », non.

Chez nos clients, la première catégorie confiée est presque toujours l'une des trois suivantes : les demandes entrantes sur WhatsApp et par email, la prise et le rappel des rendez-vous, ou la relance des factures impayées. Ce sont des activités répétitives, à règles claires, et dont le retard coûte cher.

Écrivez vos réponses types avant de déléguer

Une assistante qui répond en votre nom a besoin de savoir ce que vous répondriez. Prenez une heure pour écrire vos cinq réponses les plus fréquentes : vos tarifs, vos délais, votre adresse, ce que vous ne faites pas, et comment vous formulez un refus.

Cette heure-là est la plus rentable de tout le processus. Elle transforme une délégation approximative en un service qui ressemble à votre maison.

Comptez trois semaines avant de juger

La première semaine, vous corrigerez beaucoup. La deuxième, un peu. La troisième, vous cesserez d'y penser — et c'est à ce moment que le temps revient.

Juger au bout de trois jours, c'est juger la période d'apprentissage. Personne ne recrute quelqu'un pour le tester le troisième jour.

Et ensuite

Quand une catégorie tourne sans vous, ajoutez-en une deuxième. Jamais deux en même temps : vous ne sauriez pas laquelle pose problème.

C'est la logique de nos formules. La formule Essentiel, à 20 heures par mois, couvre confortablement une première catégorie pour un indépendant ou un commerce. On passe à la suivante quand la première est acquise, pas avant.`,
  },
  {
    slug: "cabinet-medical-ne-plus-perdre-de-rendez-vous",
    titre: "Cabinet médical — ne plus perdre de rendez-vous",
    secteur: "Santé",
    chapo:
      "Un patient qui ne vient pas coûte une consultation. Un patient qui n'arrive pas à vous joindre coûte davantage : il appelle ailleurs, et ne revient pas.",
    corps: `Dans un cabinet, le rendez-vous manqué est un coût visible : un créneau vide, une salle d'attente déséquilibrée, une journée qui se termine plus tard que prévu. Ce qu'on voit moins, c'est le rendez-vous qui n'a jamais été pris parce que personne n'a décroché.

Les deux problèmes n'ont pas la même cause, ni la même solution.

L'appel auquel personne ne répond

Pendant une consultation, le téléphone sonne dans le vide. C'est normal : vous êtes avec un patient, et l'interrompre serait pire. Mais du côté de celui qui appelle, l'interprétation est différente. Il essaie une fois, parfois deux, puis il compose un autre numéro.

Vous ne verrez jamais ce patient-là dans vos statistiques. Il n'apparaît nulle part, précisément parce qu'il n'est jamais entré.

C'est le premier intérêt d'une assistante externe : les appels entrants sont pris pendant que vous soignez, avec vos règles à vous — quels motifs justifient un créneau rapide, lesquels attendent, à qui transmettre une urgence.

Le rendez-vous oublié

Le second problème se règle autrement. Un patient qui ne vient pas a rarement changé d'avis : il a oublié, ou il n'a pas su prévenir.

Un rappel la veille change presque tout. Pas un message automatique impersonnel — un message qui nomme le praticien, l'heure, et qui propose explicitement d'annuler si besoin. « Répondez ANNULER et nous libérerons le créneau » transforme une absence en créneau réattribuable.

Le créneau libéré la veille se remplit. Le créneau découvert vide le matin même, non.

La confidentialité n'est pas négociable

Un cabinet ne délègue pas la gestion de ses rendez-vous comme un commerce délègue ses commandes. Ce que voit la personne qui tient votre agenda, ce sont des noms de patients associés à des dates et parfois à des motifs.

Trois exigences, à poser avant toute chose :

Un accord de confidentialité signé, nominatif, pas une clause générale dans un contrat de prestation.

Une interlocutrice attitrée plutôt qu'une équipe tournante. Moins de personnes voient vos données, et celle qui les voit finit par connaître vos habitudes.

Le minimum d'information nécessaire. Tenir un agenda ne demande pas d'accéder aux dossiers médicaux. Si on vous propose davantage d'accès que le service n'en exige, c'est un mauvais signe.

Ce que ça change en pratique

Les cabinets avec lesquels nous travaillons signalent d'abord un changement dans le déroulement des journées : moins d'interruptions, des fins de journée plus prévisibles, et une salle d'attente qui se désengorge parce que les créneaux annulés ont été redistribués.

Le gain financier vient ensuite, et il se mesure : comptez vos créneaux vides sur un mois, multipliez par le prix d'une consultation. C'est ce chiffre-là qu'il faut comparer au coût d'une assistance.`,
  },
  {
    slug: "commerce-et-restauration-repondre-sur-whatsapp-sans-y-passer-la-journee",
    titre: "Commerce et restauration : répondre sur WhatsApp sans y passer la journée",
    secteur: "Commerce",
    chapo:
      "WhatsApp est devenu le comptoir de beaucoup de commerces camerounais. Un comptoir ouvert en permanence, où l'attente se voit — et se juge.",
    corps: `Vos clients ne vous écrivent plus par email. Ils vous écrivent sur WhatsApp, souvent le soir, et souvent en attendant une réponse immédiate parce que l'application affiche que vous étiez en ligne il y a deux minutes.

C'est un canal formidable pour vendre. C'est aussi celui qui fatigue le plus, parce qu'il n'a pas d'horaires.

La règle des dix minutes

Sur WhatsApp, l'attente acceptable n'est pas celle d'un email. Passé dix à quinze minutes sans réponse pendant les heures d'ouverture, le client suppose que vous ne suivez pas — et souvent, il écrit à un concurrent en parallèle.

Ce n'est pas une question de politesse. C'est le rythme du canal.

Vos questions se comptent sur les doigts d'une main

Regardez vos cent derniers messages. Vous y trouverez presque toujours les mêmes cinq questions : les prix, les horaires, la disponibilité d'un article, la livraison, et l'adresse.

Ces cinq réponses, écrites une bonne fois, couvrent l'essentiel de votre volume. Elles ne demandent aucune décision de votre part. Ce sont exactement celles qu'une assistante peut traiter en votre nom, avec vos mots.

Ce qui reste — la négociation, la réclamation, la commande inhabituelle — vous revient. Mais ce reste-là est bien plus petit qu'il n'y paraît.

Séparez la vitrine de la caisse

Beaucoup de commerçants utilisent le même numéro pour tout : les clients, les fournisseurs, la famille. Le résultat est qu'on ne peut jamais poser le téléphone.

Un numéro dédié à l'activité, sur WhatsApp Business, change deux choses. Il porte le nom de votre commerce plutôt qu'un numéro inconnu, ce qui rassure un nouveau client. Et il peut être confié à quelqu'un sans que vous partagiez vos conversations personnelles.

Le message d'absence, celui qu'on néglige

WhatsApp Business permet un message automatique hors horaires. La plupart des commerces le laissent vide, ou y écrivent « Nous sommes fermés ».

Une formulation vaut mieux : dites quand vous répondrez. « Nous répondons à partir de 8h. Pour une commande urgente, appelez le… » Le client sait à quoi s'attendre, et il ne relance pas trois fois dans la nuit.

Le soir et le week-end

C'est le vrai sujet. Le commerce vit quand les autres ont fini leur journée, et les messages arrivent précisément là.

Vous avez trois options honnêtes : ne pas répondre et l'assumer clairement, répondre vous-même et y perdre vos soirées, ou faire couvrir cette plage par quelqu'un d'autre.

Nos formules Professionnel et Premium couvrent respectivement six jours sur sept et les soirées. Ce n'est pas un supplément de confort : pour un restaurant, c'est l'écart entre une table réservée et une table vide.`,
  },
];

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const maintenant = new Date().toISOString();

for (const article of ARTICLES) {
  const { data: existant } = await db
    .from("articles")
    .select("id, publie_le")
    .eq("slug", article.slug)
    .maybeSingle();

  const champs = {
    ...article,
    statut: brouillon ? "brouillon" : "publie",
    /* La contrainte SQL exige une date sur un article publié. Une republication
       conserve la date d'origine : l'ordre de la liste ne doit pas changer. */
    publie_le: brouillon ? (existant?.publie_le ?? null) : (existant?.publie_le ?? maintenant),
  };

  const { error } = existant
    ? await db.from("articles").update(champs).eq("id", existant.id)
    : await db.from("articles").insert(champs);

  console.log(
    error
      ? `  ECHEC   ${article.slug} — ${error.message}`
      : `  ${existant ? "mis a jour" : "cree"}  ${article.slug}`,
  );
}

console.log(`\n${ARTICLES.length} articles ${brouillon ? "en brouillon" : "publies"}.`);
process.exit(0);
