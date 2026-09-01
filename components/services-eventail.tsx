"use client";

import { useTranslations } from "next-intl";

import CardFanCarousel from "@/components/ui/card-fan-carousel";
import type { Service } from "@/lib/content";

/**
 * Les six services déployés en éventail : la carte survolée se soulève et
 * écarte ses voisines.
 *
 * Seul le numéro vient de `lib/content.ts` — il sert de clé de traduction.
 *
 * Réservé au desktop par la page qui l'appelle : sous 1024 px les cartes se
 * resserrent au point de masquer leur texte, la liste verticale reste plus
 * lisible.
 */
export function ServicesEventail({ services }: { services: Service[] }) {
  const t = useTranslations("services");

  return (
    <CardFanCarousel
      cards={services.map((service) => ({
        content: (
          <div className="flex h-full flex-col gap-3 p-6">
            <span className="font-mono text-[12px] text-gold">{service.numero}</span>
            <h3 className="font-serif text-[21px] leading-[1.15] text-navy">
              {t(`${service.numero}.titre`)}
            </h3>
            <span aria-hidden className="h-px w-8 bg-gold" />
            <p className="text-[13px] leading-[1.55] text-slate-mid">
              {t(`${service.numero}.resume`)}
            </p>
            <span className="mt-auto font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              {t(`${service.numero}.formules`)}
            </span>
          </div>
        ),
      }))}
    />
  );
}
