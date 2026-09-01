"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { MOIS_FACTURES_A_L_ANNEE, formaterFcfa, type Formule } from "@/lib/content";

/* Réglages du mouvement. Repris de l'effet d'origine, à une exception près :
   l'écart entre faces passe de 38° à 42°, parce qu'il n'y a que trois formules
   et qu'elles gagnent à respirer. */
const PAS = 42; // degrés entre deux faces voisines
const AMPLITUDE = 20; // degrés de balancement de part et d'autre du centre
const VITESSE = 0.00026; // radians par milliseconde
const LERP = 0.035; // lissage vers la rotation cible, par image
const SENSIBILITE = 0.4; // degrés par pixel glissé
const REPRISE = 2500; // ms après un glissé avant que le balancement reprenne
const SEUIL_CLIC = 6; // px au-delà desquels un glissé n'est plus un clic

export type Periode = "mensuel" | "annuel";

/**
 * Les trois formules posées sur un anneau, au-dessus d'un émetteur lumineux.
 *
 * Le mouvement est un balancement, jamais une rotation complète : à ±20° les
 * trois faces restent lisibles en permanence. Une rotation ferait passer une
 * formule derrière les autres, ce qui reviendrait à cacher un prix.
 *
 * La rotation est écrite directement dans le style de l'anneau plutôt que
 * gardée dans un état React : à 60 images par seconde, un `setState` par image
 * ferait re-rendre les trois cartes pour ne changer qu'une transformation.
 */
export function FormulesOrbite({
  formules,
  periode,
}: {
  formules: Formule[];
  periode: Periode;
}) {
  const annuel = periode === "annuel";
  const scene = useRef<HTMLDivElement>(null);
  const anneau = useRef<HTMLDivElement>(null);

  const rotation = useRef(0);
  const auto = useRef(true);
  const glisse = useRef({ actif: false, departX: 0, departRotation: 0, parcouru: 0 });

  useEffect(() => {
    const element = anneau.current;
    if (!element) return;

    /* Réglage système « réduire les animations » : l'anneau reste droit et se
       manipule uniquement au doigt. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let image = 0;
    const depart = performance.now();

    const boucle = (maintenant: number) => {
      if (!glisse.current.actif && auto.current) {
        const cible = Math.sin((maintenant - depart) * VITESSE) * AMPLITUDE;
        rotation.current += (cible - rotation.current) * LERP;
        element.style.transform = `rotateY(${rotation.current.toFixed(3)}deg)`;
      }
      image = requestAnimationFrame(boucle);
    };

    image = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(image);
  }, []);

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  function commencer(evenement: React.PointerEvent<HTMLDivElement>) {
    glisse.current = {
      actif: true,
      departX: evenement.clientX,
      departRotation: rotation.current,
      parcouru: 0,
    };
    auto.current = false;
    if (minuteur.current) clearTimeout(minuteur.current);
    scene.current?.setPointerCapture(evenement.pointerId);
  }

  function deplacer(evenement: React.PointerEvent<HTMLDivElement>) {
    if (!glisse.current.actif || !anneau.current) return;
    const dx = evenement.clientX - glisse.current.departX;
    glisse.current.parcouru = Math.max(glisse.current.parcouru, Math.abs(dx));
    rotation.current = glisse.current.departRotation + dx * SENSIBILITE;
    anneau.current.style.transform = `rotateY(${rotation.current.toFixed(3)}deg)`;
  }

  function terminer() {
    if (!glisse.current.actif) return;
    glisse.current.actif = false;
    minuteur.current = setTimeout(() => {
      auto.current = true;
    }, REPRISE);
  }

  /* Faire tourner l'anneau ne doit jamais ouvrir une formule au passage. */
  function filtrerClic(evenement: React.MouseEvent<HTMLAnchorElement>) {
    if (glisse.current.parcouru > SEUIL_CLIC) evenement.preventDefault();
  }

  const centre = (formules.length - 1) / 2;

  return (
    <div className="na-orbite">
      <div
        ref={scene}
        className="na-orbite-scene"
        onPointerDown={commencer}
        onPointerMove={deplacer}
        onPointerUp={terminer}
        onPointerCancel={terminer}
        onPointerLeave={terminer}
      >
        <div ref={anneau} className="na-orbite-anneau">
          {formules.map((formule, index) => (
            <Link
              key={formule.id}
              /* Ancre reprise des anciennes cartes de prix : le pied de page
                 pointe vers /offres#essentiel, #professionnel et #premium. */
              id={formule.id}
              href={`/devis?formule=${formule.id}`}
              onClick={filtrerClic}
              data-avant={formule.miseEnAvant}
              className="na-orbite-face"
              style={{ "--na-orbite-angle": `${(index - centre) * PAS}deg` } as React.CSSProperties}
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-gold uppercase">
                {formule.nom}
              </span>
              {/* Le tarif annuel compte un chiffre de plus : il descend d'un
                  cran en taille pour tenir dans la face sans la déborder. */}
              <span
                className={`font-serif leading-none text-gold-soft ${
                  annuel ? "text-[21px]" : "text-[27px]"
                }`}
              >
                {annuel
                  ? formaterFcfa(formule.montantMensuel * MOIS_FACTURES_A_L_ANNEE)
                  : formule.prixCourt}
              </span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-gold-line">
                {annuel ? "FCFA / an" : formule.unite}
              </span>
              <span aria-hidden className="h-px w-6 bg-gold" />
              <span className="text-[12px] leading-[1.4] text-white/70">{formule.pourCourt}</span>
              <span className="mt-auto font-mono text-[10px] tracking-[0.12em] text-gold uppercase">
                Choisir →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* L'émetteur est décoratif : il n'apporte aucune information et ne se
          manipule pas. Les lecteurs d'écran n'ont rien à y lire. */}
      <div aria-hidden className="na-orbite-emetteur">
        <span className="na-orbite-faisceau" />
        <span className="na-orbite-halo" />
        <span className="na-orbite-socle" />
        <span className="na-orbite-collier" />
        <span className="na-orbite-anneau-lumineux" />
        <span className="na-orbite-vasque">
          <i />
        </span>
      </div>

      <p className="na-orbite-indice">Glissez ou touchez une formule pour la choisir</p>
    </div>
  );
}
