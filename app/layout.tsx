import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    metadataBase: new URL("https://novaassist.cm"),
    title: {
      default: t("titre"),
      template: `%s · Nova Assist`,
    },
    description: t("description"),
    openGraph: {
      type: "website",
      locale: (await getLocale()) === "en" ? "en_US" : "fr_CM",
      siteName: "Nova Assist",
      title: t("ogTitre"),
      description: t("ogDescription"),
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("commun");

  return (
    /* `suppressHydrationWarning` : le script ci-dessous pose `html.js` avant
       que React n'hydrate, donc l'attribut `class` diffère forcément entre le
       rendu serveur et le DOM client. C'est voulu, pas une incohérence. */
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Chargées par lien plutôt que par next/font : la connectivité locale est
            variable et le build ne doit pas dépendre d'un téléchargement. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        {/* Pose `html.js` avant le premier rendu : l'état masqué des apparitions
            n'existe que si JavaScript répond, sinon le contenu reste visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
          >
            {t("allerAuContenu")}
          </a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
