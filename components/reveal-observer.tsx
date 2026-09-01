"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Observateur unique pour toutes les apparitions au défilement.
 *
 * Monté une fois dans le layout, il repère chaque `[data-reveal]` et lui ajoute
 * `is-visible` quand il entre dans la fenêtre. Un seul observateur pour toute la
 * page, plutôt qu'un par élément.
 */
export function RevealObserver() {
  const pathname = usePathname();
  /* Distingue l'arrivée sur le site d'un changement d'onglet : l'entrée du
     premier écran est un moment voulu à l'arrivée, une attente subie ensuite. */
  const premiereVisite = useRef(true);

  useEffect(() => {
    const arrivee = premiereVisite.current;
    premiereVisite.current = false;

    /* Réglage système « réduire les animations » : tout est montré d'emblée. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }

    /* Sur une navigation interne, ce qui tient dans le premier écran est posé
       tel quel : rejouer un fondu de 0,45 s sur du contenu déjà chargé se lit
       comme une page qui rame. Les blocs plus bas gardent leur apparition. */
    if (!arrivee) {
      const premierEcran = Array.from(
        document.querySelectorAll("[data-reveal]:not(.is-visible)"),
      ).filter((el) => el.getBoundingClientRect().top < window.innerHeight);

      premierEcran.forEach((el) => el.classList.add("sans-transition", "is-visible"));

      /* La classe ne sert qu'à sauter ce fondu-ci ; on la retire une fois le
         style appliqué, pour ne pas figer les transitions suivantes. */
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          premierEcran.forEach((el) => el.classList.remove("sans-transition")),
        ),
      );
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          entree.target.classList.add("is-visible");
          /* Une apparition ne se rejoue pas : on cesse d'observer. */
          observateur.unobserve(entree.target);
        }
      },
      /* Déclenche quand l'élément est franchement entré dans l'écran. Trop tôt,
         l'animation se termine avant que le regard n'y arrive — on ne la voit
         alors jamais jouer. */
      /* Seuil nul volontairement : sur une section plus haute que l'écran, un
         seuil en pourcentage peut ne jamais être atteint. La marge suffit à
         retarder le déclenchement. */
      { rootMargin: "0px 0px -22% 0px", threshold: 0 },
    );

    const elements = document.querySelectorAll("[data-reveal]:not(.is-visible)");
    elements.forEach((el) => observateur.observe(el));

    return () => observateur.disconnect();
  }, [pathname]);

  return null;
}
