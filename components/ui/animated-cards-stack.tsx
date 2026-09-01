"use client";

import * as React from "react";
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Pile de cartes pilotée par le défilement : chaque carte remonte et se
 * redresse à mesure que la section défile, la précédente s'échappant par le
 * haut. Le conteneur doit être plus haut que l'écran (`h-[300vh]` par exemple)
 * et l'enfant collant (`sticky top-0 h-svh`).
 *
 * Deux écarts assumés avec le composant d'origine :
 * - l'import vient de `framer-motion`, déjà présent, plutôt que du paquet
 *   `motion` qui est la même bibliothèque sous un autre nom ;
 * - les variantes sont un simple dictionnaire, `class-variance-authority`
 *   n'étant pas justifiée pour deux valeurs.
 */
const VARIANTES = {
  /** Carte sombre, pour une section bleu nuit. */
  dark: "border-gold/30 bg-navy-700/80 text-white",
  /** Carte claire, pour une section sable ou papier. */
  light: "border-line bg-paper/85 text-ink",
} as const;

const CARTE_BASE =
  "absolute flex size-full flex-col items-center justify-center gap-6 rounded-2xl border p-6";

export type VarianteCarte = keyof typeof VARIANTES;

interface ReviewProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  maxRating?: number;
}

interface CardStickyProps extends HTMLMotionProps<"div"> {
  arrayLength: number;
  index: number;
  incrementY?: number;
  incrementZ?: number;
  incrementRotation?: number;
  variant?: VarianteCarte;
}

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

const ContainerScrollContext = React.createContext<ContainerScrollContextValue | undefined>(
  undefined,
);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (context === undefined) {
    throw new Error("useContainerScrollContext doit être appelé dans un <ContainerScroll>");
  }
  return context;
}

export const ContainerScroll: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className,
  ...props
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start center", "end end"],
  });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-svh w-full", className)}
        style={{ perspective: "1000px", ...style }}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = "ContainerScroll";

export const CardsContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  style,
  ...props
}) => (
  <div
    className={cn("relative", className)}
    style={{ perspective: "1000px", ...style }}
    {...props}
  >
    {children}
  </div>
);
CardsContainer.displayName = "CardsContainer";

export const CardTransformed = React.forwardRef<HTMLDivElement, CardStickyProps>(
  (
    {
      arrayLength,
      index,
      incrementY = 10,
      incrementZ = 10,
      incrementRotation = -index + 90,
      className,
      variant = "light",
      style,
      ...props
    },
    ref,
  ) => {
    const { scrollYProgress } = useContainerScrollContext();

    const start = index / (arrayLength + 1);
    const end = (index + 1) / (arrayLength + 1);
    const range = React.useMemo(() => [start, end], [start, end]);
    const rotateRange = React.useMemo(() => [range[0] - 1.5, range[1] / 1.5], [range]);

    const y = useTransform(scrollYProgress, range, ["0%", "-180%"]);
    const rotate = useTransform(scrollYProgress, rotateRange, [incrementRotation, 0]);
    const transform = useMotionTemplate`translateZ(${
      index * incrementZ
    }px) translateY(${y}) rotate(${rotate}deg)`;

    /* Ces quatre valeurs et le `drop-shadow` sont calculés dans tous les cas :
       un hook ne peut pas être appelé derrière une condition. Seule son
       application dépend de la variante — l'ombre portée n'a pas de sens sur
       une carte sombre posée sur un fond sombre. */
    const dx = useTransform(scrollYProgress, rotateRange, [4, 0]);
    const dy = useTransform(scrollYProgress, rotateRange, [4, 12]);
    const blur = useTransform(scrollYProgress, rotateRange, [2, 24]);
    const alpha = useTransform(scrollYProgress, rotateRange, [0.15, 0.2]);
    const ombre = useMotionTemplate`drop-shadow(${dx}px ${dy}px ${blur}px rgba(0,0,0,${alpha}))`;

    return (
      <motion.div
        layout="position"
        ref={ref}
        style={{
          top: index * incrementY,
          transform,
          backfaceVisibility: "hidden",
          zIndex: (arrayLength - index) * incrementZ,
          filter: variant === "light" ? ombre : "none",
          ...style,
        }}
        className={cn(CARTE_BASE, VARIANTES[variant], className)}
        {...props}
      />
    );
  },
);
CardTransformed.displayName = "CardTransformed";

/** Note sur cinq, en étoiles pleines, à moitié pleines puis vides. */
export const ReviewStars = React.forwardRef<HTMLDivElement, ReviewProps>(
  ({ rating, maxRating = 5, className, ...props }, ref) => {
    const pleines = Math.floor(rating);
    const fraction = rating - pleines;
    const vides = maxRating - pleines - (fraction > 0 ? 1 : 0);
    const chemin =
      "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z";
    const gradientId = React.useId();

    return (
      <div className={cn("flex items-center gap-2", className)} ref={ref} {...props}>
        <div aria-hidden className="flex items-center">
          {Array.from({ length: pleines }, (_, i) => (
            <svg key={`p-${i}`} className="size-4 text-inherit" fill="currentColor" viewBox="0 0 20 20">
              <path d={chemin} />
            </svg>
          ))}
          {fraction > 0 && (
            <svg className="size-4 text-inherit" fill="currentColor" viewBox="0 0 20 20">
              <defs>
                <linearGradient id={gradientId}>
                  <stop offset={`${fraction * 100}%`} stopColor="currentColor" />
                  <stop offset={`${fraction * 100}%`} stopColor="rgb(209 213 219)" />
                </linearGradient>
              </defs>
              <path d={chemin} fill={`url(#${gradientId})`} />
            </svg>
          )}
          {Array.from({ length: vides }, (_, i) => (
            <svg key={`v-${i}`} className="size-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
              <path d={chemin} />
            </svg>
          ))}
        </div>
        <p className="sr-only">
          {rating} sur {maxRating}
        </p>
      </div>
    );
  },
);
ReviewStars.displayName = "ReviewStars";
