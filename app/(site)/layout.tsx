import { cookies } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { RevealObserver } from "@/components/reveal-observer";

/**
 * Habillage des pages vitrine : navigation bleu nuit, pied de page complet et
 * bouton WhatsApp flottant. Le tunnel de devis et l'espace client ont leur
 * propre habillage, plus dépouillé.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  /* Présence d'un cookie de session, sans appel réseau.
     `getUser()` validerait le jeton auprès de Supabase — 350 à 580 ms par page
     depuis ce poste — pour ne décider que d'un libellé de menu. La présence du
     cookie suffit ici : un cookie périmé afficherait « Espace client », et le
     middleware renverrait alors vers la connexion. Aucun accès n'en dépend. */
  const magasin = await cookies();
  const connecte = magasin.getAll().some((c) => c.name.startsWith("sb-") && c.value);

  return (
    <>
      <SiteHeader connecte={connecte} />
      <main id="contenu">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
      <RevealObserver />
    </>
  );
}
