import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { RevealObserver } from "@/components/reveal-observer";

/**
 * Habillage des pages vitrine : navigation bleu nuit, pied de page complet et
 * bouton WhatsApp flottant. Le tunnel de devis et l'espace client ont leur
 * propre habillage, plus dépouillé.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
      <RevealObserver />
    </>
  );
}
