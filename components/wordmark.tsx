import Link from "next/link";

type Props = {
  /** Taille du logotype, en px — 24 en navigation desktop, 18 en mobile. */
  size?: number;
  /** Sur fond bleu nuit, « NOVA » est blanc ; sur fond clair, il passe en bleu nuit. */
  tone?: "on-navy" | "on-paper";
  className?: string;
};

/** Logotype « NOVA ASSIST » — serif, « ASSIST » en or avec chasse élargie. */
export function Wordmark({ size = 24, tone = "on-navy", className = "" }: Props) {
  const nova = tone === "on-navy" ? "text-white" : "text-navy";
  const assist = tone === "on-navy" ? "text-gold" : "text-gold-ink";

  return (
    <Link
      href="/"
      className={`flex items-baseline gap-[0.4em] font-serif ${className}`}
      style={{ fontSize: size }}
    >
      <span className={nova}>NOVA</span>
      <span className={assist} style={{ letterSpacing: "0.16em" }}>
        ASSIST
      </span>
      <span className="sr-only">— accueil</span>
    </Link>
  );
}
