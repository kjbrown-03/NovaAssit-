"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";

export interface CardItem {
  /** Contenu libre de la carte. Prioritaire sur `imgUrl`. */
  content?: ReactNode;
  imgUrl?: string;
  alt?: string;
  linkUrl?: string;
}

interface CardFanProps {
  cards: CardItem[];
  className?: string;
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
];

/* Les cartes se resserrent sur les petits écrans : à pleine largeur d'écart,
   l'éventail déborderait. */
function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.28;
  if (width < 640) return 0.38;
  if (width < 768) return 0.5;
  if (width < 1024) return 0.75;
  return 1.0;
}

/**
 * Facteur (0..1] appliqué aux décalages verticaux quand la fenêtre est trop
 * basse pour la hauteur idéale de l'éventail.
 */
function getHeightMultiplier(width: number) {
  let idealPx: number;
  if (width < 480) idealPx = 24 * 16;
  else if (width < 640) idealPx = 29 * 16;
  else if (width < 768) idealPx = 32 * 16;
  else if (width < 1024) idealPx = 38 * 16;
  else idealPx = 43 * 16;

  const available = window.innerHeight * 0.7;
  return available >= idealPx ? 1 : available / idealPx;
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  return {
    rot: distance * 21,
    scale: 1.0 - 0.2244 * absDistance * absDistance,
    x: distance * 30,
    y: absDistance * absDistance * 7.3,
    zIndex: 10 - Math.abs(slot - center),
  };
}

/* Flèches accordées à la charte : or sur sable, sans variantes `dark:` — le
   site n'a pas de thème sombre. */
const ARROW_CLASSES =
  "relative z-30 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gold/30 bg-stone-50 text-gold-ink outline-none transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-navy focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 active:opacity-70";

/* Les cartes sont empilées par la grille du conteneur — toutes dans la même
   cellule, centrée — plutôt que par `position: absolute`. GSAP réécrit
   entièrement `transform` : un centrage fait par `translate` serait effacé. */
const CARD_CLASSES =
  "fan-card col-start-1 row-start-1 h-[18rem] w-[12.5rem] overflow-hidden rounded-2xl border border-line bg-paper opacity-0 shadow-[0_10px_30px_rgba(11,31,58,0.10)] sm:h-[22rem] sm:w-[15rem] lg:h-[24.5rem] lg:w-[17rem]";

export default function CardFanCarousel({ cards, className = "" }: CardFanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  /* L'éventail se déploie quand la section entre dans le champ, pas au montage :
     plus bas dans la page, l'animation se serait jouée sans personne. */
  const [enVue, setEnVue] = useState(false);

  const totalCards = cards.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);

  const getVisibleMap = useCallback(
    (center: number) => {
      const map = new Map<number, number>();
      if (!needsPagination) {
        cards.forEach((_, i) => map.set(i, i));
        return map;
      }
      for (let slot = 0; slot < MAX_VISIBLE; slot++) {
        map.set((((center + slot - HALF) % totalCards) + totalCards) % totalCards, slot);
      }
      return map;
    },
    [totalCards, needsPagination, cards],
  );

  const cycle = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || !needsPagination) return;
      isAnimating.current = true;
      directionRef.current = direction;
      setCenterIndex((prev) =>
        direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards,
      );
    },
    [totalCards, needsPagination],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || enVue) return;

    /* Sans IntersectionObserver — navigateur ancien —, on déploie tout de suite
       plutôt que de laisser les cartes invisibles. */
    if (typeof IntersectionObserver === "undefined") {
      setEnVue(true);
      return;
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setEnVue(true);
          observateur.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observateur.observe(container);
    return () => observateur.disconnect();
  }, [enVue]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards || !enVue) return;

    const cardElements = Array.from(container.querySelectorAll<HTMLElement>(".fan-card"));
    if (!cardElements.length) return;

    /* Le déploiement n'a pas de version ralentie : sur demande de mouvement
       réduit, les cartes sont posées directement à leur place. */
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = (valeur: number) => (reduit ? 0 : valeur);

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot: number) => getSlotConfig(slotCount, slot);

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, { x: 0, y: `${12 * hMult}rem`, rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, {
            ...target,
            duration: d(1.2),
            ease: "elastic.out(1.05,.78)",
            delay: d(0.2 + slot * 0.06),
            onComplete: onCardDone,
          });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          gsap.set(card, {
            x: `${enterX}rem`,
            y: `${y * hMult}rem`,
            rotation: direction === "right" ? 30 : -30,
            scale: 0.5,
            opacity: 0,
          });
          gsap.to(card, { ...target, duration: d(0.6), ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: d(0.5), ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -40 : 40;
        gsap.to(card, {
          x: `${exitX}rem`,
          opacity: 0,
          scale: 0.5,
          rotation: direction === "right" ? -30 : 30,
          duration: d(0.4),
          ease: "power2.in",
          zIndex: 0,
        });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    /* --- survol : la carte pointée se soulève, ses voisines s'écartent --- */
    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 2.5 * hM;
            targetScale *= 1.08;
          } else {
            const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength =
              8 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));

            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 3 / (distance + 1);
            }

            if (slot === visibleEntries.length - 1 && hoveredSlot < centerSlot) targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot) targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`,
          y: `${targetY}rem`,
          rotation: targetRot,
          scale: targetScale,
          duration: d(0.5),
          delay: d(delay),
          ease: "elastic.out(1,.75)",
          overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating.current) return;
        if (leaveTimer) {
          clearTimeout(leaveTimer);
          leaveTimer = null;
        }
        if (activeSlot !== slot) {
          activeSlot = slot;
          updateHoverLayout(slot);
        }
      };
      el.addEventListener("mouseenter", handler);
      /* Le clavier doit produire le même écartement que la souris, sans quoi la
         carte focalisée resterait sous ses voisines. */
      el.addEventListener("focusin", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating.current) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        updateHoverLayout(null);
      }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isAnimating.current) updateHoverLayout(activeSlot);
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) => {
        el.removeEventListener("mouseenter", handler);
        el.removeEventListener("focusin", handler);
      });
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [centerIndex, totalCards, getVisibleMap, needsPagination, enVue]);

  if (!totalCards) return null;

  const chevron = (direction: "left" | "right") => (
    <svg
      aria-hidden
      className="h-4 w-4 md:h-5 md:w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      <div
        ref={containerRef}
        className="fan-layout grid h-[24rem] w-full max-w-[80rem] place-items-center min-[480px]:h-[29rem] sm:h-[32rem] md:h-[38rem] lg:h-[43rem]"
      >
        {cards.map((card, index) => {
          const corps = card.content ?? (
            <img
              src={card.imgUrl}
              loading="lazy"
              alt={card.alt ?? ""}
              className="h-full w-full object-cover"
            />
          );
          return card.linkUrl ? (
            <a
              key={index}
              href={card.linkUrl}
              target={card.linkUrl.startsWith("http") ? "_blank" : undefined}
              rel={card.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`${CARD_CLASSES} block cursor-pointer`}
            >
              {corps}
            </a>
          ) : (
            <div key={index} className={CARD_CLASSES}>
              {corps}
            </div>
          );
        })}
      </div>

      {needsPagination && (
        <div className="z-30 mt-4 flex items-center justify-center gap-4 md:mt-6">
          <button
            type="button"
            className={`${ARROW_CLASSES} h-10 w-10 md:h-12 md:w-12`}
            onClick={() => cycle("left")}
            aria-label="Carte précédente"
          >
            {chevron("left")}
          </button>
          <div className="flex items-center gap-2">
            {cards.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i === centerIndex ? "scale-[1.3] bg-gold" : "bg-line-mid"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            className={`${ARROW_CLASSES} h-10 w-10 md:h-12 md:w-12`}
            onClick={() => cycle("right")}
            aria-label="Carte suivante"
          >
            {chevron("right")}
          </button>
        </div>
      )}
    </div>
  );
}
