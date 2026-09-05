import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  CheckCircle,
  Clock,
  FileText,
  Folder,
  LayoutDashboard,
  MessageSquareQuote,
  Plus,
  UserRound,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { Wordmark } from "@/components/wordmark";
import { FORMULES, whatsappLink } from "@/lib/content";
import { ShinyButton } from "@/components/ui/shiny-button";
import { FormulaireTemoignage } from "@/components/espace-client/formulaire-temoignage";
import { BoutonDeconnexion } from "@/components/espace-client/bouton-deconnexion";
import { BlocProfil } from "@/components/espace-client/bloc-profil";
import { MAX_ACCUEIL } from "@/lib/temoignages/types";
import {
  chargerTableauDeBord,
  dateCourte,
  semaineCourante,
  STYLE_STATUT,
} from "@/lib/supabase/espace-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageEspace");
  return { title: t("metaTitre"), description: t("metaDescription"), robots: { index: false } };
}

/* Les intitulés viennent des messages, alignés par position sur `pageEspace.nav`. */
const NAV = [
  { href: "#contenu", Icone: LayoutDashboard },
  { href: "#demandes", Icone: Folder },
  { href: "#documents", Icone: FileText },
  { href: "#documents", Icone: Receipt },
  { href: "#temoignage", Icone: MessageSquareQuote },
  { href: "#profil", Icone: UserRound },
  { href: "#abonnement", Icone: Wallet },
];

/* Clé de message pour chaque statut de demande. */
const CLE_STATUT = {
  en_cours: "statutEnCours",
  attente_retour: "statutAttenteRetour",
  terminee: "statutTerminee",
} as const;

/* Chaque statut porte son icône : la teinte seule ne doit pas porter le sens. */
const ICONE_STATUT = {
  en_cours: RefreshCw,
  attente_retour: Clock,
  terminee: CheckCircle,
} as const;

export default async function EspaceClient() {
  const { profil, demandes, documents, enCours, prioritaires } = await chargerTableauDeBord();
  const t = await getTranslations("pageEspace");
  const tf = await getTranslations("formules");
  const tc = await getTranslations("commun");
  const locale = await getLocale();

  const libNav = t.raw("nav") as string[];

  /* Le nom de la formule est traduit ici plutôt que par `libelleFormule` :
     ce dernier sert aussi au back-office, qui reste en français. */
  const nomFormule = profil?.formule
    ? t("formuleLibelle", { nom: tf(`${profil.formule}.nom`) })
    : t("formuleADefinir");

  /* L'administration n'a rien à faire ici : ce tableau de bord affiche les
     demandes, factures et heures d'un client, données qu'un compte
     d'administration n'a pas. On la renvoie vers son back-office. */
  if (profil?.role === "admin") redirect("/admin/devis");

  /* Le middleware garantit une session ; le profil, lui, peut manquer si le
     déclencheur SQL n'a pas tourné. On le dit plutôt que d'afficher un vide. */
  const entreprise = profil?.entreprise ?? t("profilIncomplet");
  const prenomOuNom = profil?.contact_nom?.trim();

  /* Seul le forfait souscrit est encore affiché, dans la fiche entreprise.
     La consommation ne l'est plus : personne ne pouvait la renseigner. */
  const heuresIncluses = profil?.heures_incluses ?? null;

  return (
    <div className="na-console min-h-svh md:flex">
      {/* ------------------------------------------------------------ latérale */}
      <aside
        className={
          /* Rail rétractable, repris d'IMSOP : replié sur ses icônes, il se
             déploie au survol — et au focus clavier, sans quoi on ne pourrait
             pas le parcourir à la tabulation. Le contenu s'élargit d'autant. */
          "group/rail flex flex-col gap-6 bg-navy py-[26px] transition-[width] duration-200 ease-linear " +
          /* Collée en haut et haute d'un écran : sans ça, la latérale s'étire
             sur toute la hauteur du contenu et `mt-auto` renvoie la
             déconnexion tout en bas d'une page très longue — invisible sans
             faire défiler jusqu'au pied. */
          "md:sticky md:top-0 md:h-svh md:w-[76px] md:shrink-0 md:overflow-x-hidden md:overflow-y-auto " +
          "md:hover:w-[252px] md:focus-within:w-[252px] lg:gap-8"
        }
      >
        <div className="relative h-[26px] px-5">
          {/* Replié, seule l'initiale tient dans la largeur du rail. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-5 hidden items-center font-serif text-[21px] text-gold transition-opacity duration-200 md:flex md:group-hover/rail:opacity-0 md:group-focus-within/rail:opacity-0"
          >
            N
          </span>
          <span className="absolute inset-y-0 left-5 flex items-center transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
            <Wordmark size={19} />
          </span>
        </div>

        <nav aria-label={t("navAria")} className="md:px-3">
          {/* Sur mobile la latérale devient une barre d'onglets défilante. */}
          <ul className="na-scroll flex gap-1 overflow-x-auto px-3 md:flex-col md:overflow-visible md:px-0">
            {NAV.map(({ href, Icone }, i) => (
              <li key={i} className="shrink-0">
                <Link
                  href={href}
                  aria-current={i === 0 ? "page" : undefined}
                  className={`na-presse flex items-center gap-3 rounded-xl px-3 py-[10px] text-[15px] whitespace-nowrap transition-colors ${
                    i === 0
                      ? "bg-gold text-navy"
                      : "text-white/70 hover:bg-white/5 hover:text-gold"
                  }`}
                >
                  <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="transition-opacity duration-200 md:opacity-0 md:group-hover/rail:opacity-100 md:group-focus-within/rail:opacity-100">
                    {libNav[i]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-gold/20 px-5 pt-4 md:px-3">
          <BlocProfil
            nom={prenomOuNom ?? null}
            entreprise={entreprise}
            formule={nomFormule}
          />
          <BoutonDeconnexion />
        </div>
      </aside>

      {/* Le contenu flotte dans une carte blanche arrondie, posée sur le fond
          sablé — la signature de coque d'IMSOP. */}
      <div className="flex min-w-0 flex-1 md:p-2">
        <main
          id="contenu"
          className="na-carte flex min-w-0 flex-1 flex-col shadow-sm md:rounded-2xl"
        >
          <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-line-soft px-8 md:flex">
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate text-[19px] font-semibold text-navy">
                {prenomOuNom ? t("bonjourNom", { nom: prenomOuNom }) : t("bonjour")}
              </h1>
              <p className="text-[13px] text-gray-mid">{semaineCourante(new Date(), locale)}</p>
            </div>
            <ShinyButton href="/devis" className="!px-[20px] !py-[10px] !text-[14px]">
              {t("nouvelleDemande")}
            </ShinyButton>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
              {/* En-tête mobile : la barre du haut est masquée sous md. */}
              <div className="flex flex-col gap-1 md:hidden">
                <h1 className="text-[26px] text-navy">
                  {prenomOuNom ? t("bonjourNom", { nom: prenomOuNom }) : t("bonjour")}
                </h1>
                <p className="text-[15px] text-gray-mid">{semaineCourante(new Date(), locale)}</p>
              </div>

              {!profil && (
                <div role="alert" className="na-alerte na-carte na-monte border-gold-line bg-gold-soft/70">
                  <span className="na-alerte-icone bg-gold/25">
                    <Clock className="h-5 w-5 text-gold-ink" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-navy">{t("ficheTitre")}</h2>
                    <p className="text-[14px] leading-[1.55] text-slate-deep">{t("ficheTexte")}</p>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------ indicateurs */}
              <section aria-labelledby="titre-indicateurs">
                <h2 id="titre-indicateurs" className="sr-only">
                  {t("activiteTitre")}
                </h2>
                {/* Un seul indicateur depuis le retrait des heures consommées
                    et de la prochaine facture : aucune des deux n'était
                    alimentée — rien, dans le back-office, ne permettait de les
                    saisir. Un tableau de bord qui affiche « — » à vie promet
                    ce qu'il ne tient pas.

                    La carte est bornée en largeur : seule sur une grille à
                    trois colonnes, elle se serait étirée d'un bord à l'autre
                    ou aurait laissé deux vides à sa droite. */}
                <dl className="na-monte">
                  <div className="na-carte na-carte-actif flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:max-w-[340px]">
                    <dt className="na-statut na-statut-cours self-start">
                      <RefreshCw className="h-[14px] w-[14px]" aria-hidden />
                      {t("demandesEnCours")}
                    </dt>
                    <dd className="font-serif text-[32px] leading-none text-navy">{enCours}</dd>
                    <p className="text-[13px] text-gray-mid">
                      {prioritaires > 0
                        ? t(
                            prioritaires > 1 ? "dontPrioritairesPluriel" : "dontPrioritaires",
                            { n: prioritaires },
                          )
                        : t("aucunePrioritaire")}
                    </p>
                  </div>
                </dl>
              </section>

              {/* --------------------------------------------------------- demandes */}
              <section id="demandes" className="na-monte flex flex-col gap-4">
                <h2 className="text-[20px] text-navy lg:text-[23px]">{t("mesDemandes")}</h2>

                {demandes.length === 0 ? (
                  <div className="na-carte rounded-3xl px-6 py-10 text-center shadow-sm">
                    <p className="text-[16px] text-slate-mid">{t("aucuneDemande")}</p>
                    <p className="mt-2 text-[15px] text-gray-mid">{t("aucuneDemandeAide")}</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {demandes.map((demande, i) => {
                      const IconeStatut = ICONE_STATUT[demande.statut];
                      return (
                        <li
                          key={demande.id}
                          style={{ "--na-delai": `${i * 60}ms` } as React.CSSProperties}
                          className="na-carte na-carte-actif na-monte flex flex-col gap-3 rounded-3xl p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="font-mono text-[12px] text-muted-light">
                              {demande.reference}
                            </span>
                            <span className="text-[16px] text-ink">{demande.objet}</span>
                            <span className="text-[13px] text-gray-mid">
                              {t("recueLe", { date: dateCourte(demande.recue_le, locale) })}
                            </span>
                          </div>
                          <span className={`${STYLE_STATUT[demande.statut]} shrink-0`}>
                            <IconeStatut className="h-[14px] w-[14px]" aria-hidden />
                            {t(CLE_STATUT[demande.statut])}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ------------------------------------------- documents + contact */}
              <div id="documents" className="na-monte grid gap-3 lg:grid-cols-2">
                <section className="na-carte na-carte-actif flex flex-col gap-4 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-[19px] text-navy">{t("documentsTitre")}</h2>
                  {documents.length === 0 ? (
                    <p className="text-[15px] leading-[1.6] text-gray-mid">
                      {t("documentsVides")}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3 text-[15px]">
                      {documents.map((doc) => (
                        <li key={doc.id} className="na-ligne -mx-2 flex justify-between gap-4 rounded-lg px-2 py-1 text-ink-700">
                          <span>{doc.titre}</span>
                          {/* Lien signé à générer à la demande : un PDF de facture ne
                              doit pas rester accessible indéfiniment. Prudence de
                              notre part, pas une exigence du cahier des charges. */}
                          <span className="shrink-0 text-muted-light">PDF</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="na-carte na-carte-actif flex flex-col gap-[14px] rounded-3xl p-6 shadow-sm">
                  <h2 className="text-[19px] text-navy">{t("interlocutriceTitre")}</h2>
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-line bg-stone-100 font-mono text-[9px] text-gold-ink"
                    >
                      1:1
                    </span>
                    <span className="flex flex-col gap-[3px]">
                      <span className="text-[17px] text-navy">{t("interlocutriceNom")}</span>
                      <span className="text-[14px] text-gray-mid">{t("interlocutriceRole")}</span>
                    </span>
                  </div>
                  <ShinyButton
                    href={whatsappLink(t("messageWhatsApp"))}
                    external
                    className="mt-auto w-full !p-[13px] !text-[15px]"
                  >
                    {tc("ecrireWhatsApp")}
                  </ShinyButton>
                </section>
              </div>

              {/* ---------------------------------------------------------- profil */}
              <section
                id="profil"
                className="na-carte na-carte-actif na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 font-mono text-[15px] text-gold-ink"
                    >
                      {(prenomOuNom || entreprise)
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((m) => m[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <h2 className="text-[19px] text-navy">{prenomOuNom || entreprise}</h2>
                      <p className="text-[14px] text-gray-mid">
                        {prenomOuNom ? entreprise : t("contactACompleter")}
                      </p>
                    </div>
                  </div>
                  <span className="na-statut na-statut-neutre">
                    <Wallet className="h-[14px] w-[14px]" aria-hidden />
                    {nomFormule}
                  </span>
                </div>

                <dl className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="na-eyebrow">{t("profilEntreprise")}</dt>
                    <dd className="text-[15px] text-ink">{entreprise}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="na-eyebrow">{t("profilForfait")}</dt>
                    <dd className="text-[15px] text-ink">
                      {heuresIncluses !== null
                        ? t("forfaitHeures", { h: heuresIncluses })
                        : t("forfaitADefinir")}
                    </dd>
                  </div>
                </dl>

                <p className="text-[13px] text-muted italic">
                  {t("profilNote")}
                </p>
              </section>

              {/* ------------------------------------------------------- abonnement */}
              {/* L'onglet « Mon abonnement » pointait sur une ancre morte : le
                  client voyait le nom de sa formule dans l'en-tête sans jamais
                  pouvoir la comparer ni en changer. */}
              <section
                id="abonnement"
                className="na-carte na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm lg:p-8"
              >
                <div className="flex flex-col gap-2">
                  <span className="na-eyebrow">{t("abonnementEyebrow")}</span>
                  <h2 className="text-[20px] text-navy lg:text-[24px]">{t("abonnementTitre")}</h2>
                  <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
                    {profil?.formule ? t("abonnementAvecFormule") : t("abonnementSansFormule")}
                  </p>
                </div>

                <ul className="grid gap-3 lg:grid-cols-3">
                  {FORMULES.map((formule) => {
                    const active = profil?.formule === formule.id;
                    return (
                      <li
                        key={formule.id}
                        className={`flex flex-col gap-3 rounded-2xl p-5 ${
                          active
                            ? "border-2 border-gold bg-gold-soft"
                            : "border border-line-soft"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-[10px] tracking-[0.18em] text-gold-ink uppercase">
                            {tf(`${formule.id}.nom`)}
                          </span>
                          {active && (
                            <span className="shrink-0 bg-gold px-[9px] py-1 font-mono text-[9px] tracking-[0.12em] text-navy uppercase">
                              {t("votreFormule")}
                            </span>
                          )}
                        </div>

                        <p className="font-serif text-[26px] leading-none text-navy">
                          {formule.prixCourt}{" "}
                          <span className="font-sans text-[13px] text-gray-mid">
                            {tf("unite")}
                          </span>
                        </p>

                        <p className="text-[14px] leading-[1.5] text-slate-mid">
                          {tf(`${formule.id}.pourCourt`)}
                        </p>

                        <ul className="flex flex-col gap-[6px] text-[13px] leading-[1.45] text-ink-700">
                          {(tf.raw(`${formule.id}.inclus`) as string[])
                            .slice(0, 3)
                            .map((ligne) => (
                              <li key={ligne}>{ligne}</li>
                            ))}
                        </ul>

                        {active ? (
                          <p className="mt-auto pt-1 font-mono text-[11px] tracking-[0.12em] text-gold-ink uppercase">
                            {t("formuleEnCours")}
                          </p>
                        ) : (
                          <ShinyButton
                            href={`/paiement?formule=${formule.id}`}
                            variant={formule.miseEnAvant ? "primary" : "outline"}
                            className="mt-auto !p-[11px] !text-[14px]"
                          >
                            {profil?.formule ? t("passerACetteFormule") : t("passerAuPaiement")}
                          </ShinyButton>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* ------------------------------------------------------- témoignage */}
              <section
                id="temoignage"
                className="na-carte na-monte flex flex-col gap-5 rounded-3xl p-6 shadow-sm lg:p-8"
              >
                <div className="flex flex-col gap-2">
                  <span className="na-eyebrow">{t("temoignageEyebrow")}</span>
                  <h2 className="text-[20px] text-navy lg:text-[24px]">{t("temoignageTitre")}</h2>
                  <p className="max-w-[62ch] text-[15px] leading-[1.6] text-slate-mid">
                    {t("temoignageTexte", { max: MAX_ACCUEIL })}
                  </p>
                </div>
                <FormulaireTemoignage
                  connu={{
                    auteur: prenomOuNom ?? undefined,
                    entreprise: profil?.entreprise ?? undefined,
                  }}
                />
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Action principale toujours à portée, y compris sur mobile où la barre
          du haut est masquée. */}
      <Link
        href="/devis"
        className="na-fab na-presse fixed right-4 bottom-6 z-40 flex h-14 items-center gap-2 rounded-full bg-navy px-5 text-[15px] font-medium text-white shadow-xl shadow-navy/25 hover:bg-gold hover:text-navy sm:right-8"
      >
        <Plus className="na-fab-icone h-6 w-6" aria-hidden />
        {t("nouvelleDemande")}
      </Link>
    </div>
  );
}
