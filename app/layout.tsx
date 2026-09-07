import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { MesureConversions } from "@/components/mesure-conversions";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

/* La barre système prend le bleu nuit : installée, l'application n'a plus de
   barre d'adresse, et la teinte doit prolonger l'écran plutôt que le couper. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f3a",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");

  return {
    metadataBase: new URL("https://novaassist.cm"),
    title: {
      default: t("titre"),
      template: `%s · Nova Assist`,
    },
    description: t("description"),
    /* Sur iOS, c'est ce bloc qui autorise le mode plein écran une fois
       l'application ajoutée à l'écran d'accueil. */
    appleWebApp: {
      capable: true,
      title: "Nova Assist",
      statusBarStyle: "black-translucent",
    },
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
        {/* Décide de l'écran de lancement AVANT le premier rendu.

            Trois raisons de le faire ici et non dans un composant React :
            l'affichage doit précéder la peinture, sinon la page apparaît une
            fraction de seconde avant d'être recouverte ; la décision dépend du
            mode d'affichage, que le serveur ne connaît pas ; et la largeur du
            N doit être mesurée dans la police réellement disponible, Georgia
            n'existant pas sur Android.

            Qui l'obtient : l'application installée, sur n'importe quelle
            page ; un visiteur ordinaire, sur l'accueil seulement. Une page
            trouvée par Google ne doit pas être retardée par un voile — c'est
            la mesure du LCP, donc le classement, qui en pâtirait.

            Une fois par session dans les deux cas, et `?lancement=1` force
            l'affichage pour pouvoir le revoir à volonté. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var d=document.documentElement;
var f=location.search.indexOf('lancement=1')>-1;
if(!f){
var i=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
if(!i&&location.pathname!=='/')return;
if(sessionStorage.getItem('na-lancement')==='vu')return;
sessionStorage.setItem('na-lancement','vu');}
var c=document.createElement('canvas').getContext('2d');
c.font='100px Georgia, "Times New Roman", serif';
var r=c.measureText('N').width/100;
if(r>0.3&&r<1.6)d.style.setProperty('--na-retrait',r+'em');
d.classList.add('na-lance');
addEventListener('pointerdown',function(){d.classList.add('na-lance-fin');},{once:true});
}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {/* Masqué par défaut : seul `html.na-lance`, posé par le script
            ci-dessus, le fait apparaître. Décoratif, donc retiré du parcours
            des lecteurs d'écran — le contenu qu'il recouvre reste la page. */}
        <div className="na-lancement" aria-hidden="true">
          <div className="na-lancement-bloc">
            <span className="na-lancement-mot na-lancement-nova">NOVA</span>
            <span className="na-lancement-mot na-lancement-assist">ASSIST</span>
          </div>
        </div>

        <NextIntlClientProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
          >
            {t("allerAuContenu")}
          </a>
          {children}
          <MesureConversions />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
