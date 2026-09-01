import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en laissant la dernière l'emporter sur les
 * conflits (convention shadcn/ui). Indispensable aux composants qui exposent
 * une prop `className` destinée à surcharger leurs styles par défaut.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Décalage d'apparition, à poser sur un élément portant `data-reveal`.
 * Sert à échelonner les cartes d'une même grille plutôt que de les faire
 * surgir toutes ensemble.
 */
export function revealDelay(ms: number): React.CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as React.CSSProperties;
}
