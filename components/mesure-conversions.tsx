"use client";

import { useEffect } from "react";

/**
 * Compte les conversions sortantes — WhatsApp, appel, brochure.
 *
 * Un seul écouteur posé sur le document, plutôt qu'un gestionnaire sur chacun
 * des liens : ils sont répartis dans sept fichiers, dont plusieurs composants
 * serveur qu'il faudrait convertir en composants client rien que pour ça.
 * Ici, un lien ajouté demain est compté sans que personne y pense.
 *
 * `sendBeacon` et non `fetch` : le navigateur quitte la page dans la
 * milliseconde qui suit le clic, et une requête ordinaire serait annulée en
 * vol. Le beacon, lui, est remis au système qui l'envoie après le départ.
 *
 * Aucune donnée personnelle n'est transmise : le type du geste et le chemin de
 * la page, rien d'autre.
 */
export function MesureConversions() {
  useEffect(() => {
    /* Sans `sendBeacon`, on renonce à mesurer plutôt que de risquer de retarder
       la navigation du visiteur. */
    if (typeof navigator === "undefined" || !navigator.sendBeacon) return;

    const auClic = (evenement: MouseEvent) => {
      const cible = evenement.target;
      if (!(cible instanceof Element)) return;

      const lien = cible.closest("a");
      if (!lien) return;

      const href = lien.getAttribute("href") ?? "";

      let type: string | null = null;
      if (href.startsWith("https://wa.me/")) type = "whatsapp";
      else if (href.startsWith("tel:")) type = "appel";
      else if (href.endsWith(".pdf")) type = "brochure";

      if (!type) return;

      try {
        navigator.sendBeacon(
          "/api/evenement",
          new Blob([JSON.stringify({ type, chemin: window.location.pathname })], {
            type: "application/json",
          }),
        );
      } catch {
        /* Une mesure ratée ne doit jamais empêcher le clic d'aboutir. */
      }
    };

    document.addEventListener("click", auClic, { capture: true });
    return () => document.removeEventListener("click", auClic, { capture: true });
  }, []);

  return null;
}
