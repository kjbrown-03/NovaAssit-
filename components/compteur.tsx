"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Valeur finale à atteindre. */
  vers: number;
  /** Texte collé avant le nombre — « < » par exemple. */
  prefixe?: string;
  /** Texte collé après — « min », « j / 7 », « % ». */
  suffixe?: string;
  /** Durée du décompte, en ms. */
  duree?: number;
};

/**
 * Décompte un nombre de 0 à sa valeur, une seule fois, quand il entre dans
 * l'écran.
 *
 * Le nombre final est rendu tel quel côté serveur : sans JavaScript, ou avec le
 * réglage « réduire les animations », le lecteur voit directement la bonne
 * valeur. L'animation ne fait que remplacer un affichage déjà correct.
 */
export function Compteur({ vers, prefixe = "", suffixe = "", duree = 1400 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [valeur, setValeur] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let image = 0;
    let debut: number | null = null;

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        observateur.disconnect();

        const avancer = (horodatage: number) => {
          debut ??= horodatage;
          const progres = Math.min((horodatage - debut) / duree, 1);
          /* Décélération : le nombre ralentit en approchant de sa valeur. */
          const adouci = 1 - Math.pow(1 - progres, 3);
          setValeur(Math.round(adouci * vers));
          if (progres < 1) image = requestAnimationFrame(avancer);
        };

        /* On part de zéro à l'instant du déclenchement, pas avant. */
        setValeur(0);
        image = requestAnimationFrame(avancer);
      },
      { rootMargin: "0px 0px -22% 0px", threshold: 0 },
    );

    observateur.observe(el);
    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [vers, duree]);

  return (
    <span ref={ref}>
      {prefixe}
      {/* `valeur` reste nulle jusqu'au déclenchement : le rendu serveur affiche
          donc la valeur finale, et rien ne clignote au chargement. */}
      {valeur ?? vers}
      {suffixe}
    </span>
  );
}
