"use client"

import type React from "react"
import Link from "next/link"

interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  href?: string
  external?: boolean
  variant?: "primary" | "outline"
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}

/**
 * Bouton principal du site.
 *
 * Les styles `.shiny-cta` vivent dans `app/globals.css` et non dans un bloc
 * `<style jsx global>` : styled-jsx ne compilait pas ce bloc en App Router, la
 * classe arrivait sur l'élément sans qu'aucune règle ne soit émise, et tous les
 * boutons du site s'affichaient en texte nu.
 */
export function ShinyButton({ children, onClick, className = "", href, external = false, variant = "primary", type, disabled }: ShinyButtonProps) {
  return (
    <>

      {href ? (
        external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`shiny-cta group ${variant === "outline" ? "shiny-cta-outline" : ""} text-center inline-flex justify-center ${className}`} onClick={onClick}>
            {variant === "outline" && (
              <span className="absolute inset-0 !z-0 -translate-x-full bg-navy transition-transform duration-300 ease-in-out group-hover:translate-x-0" style={{ borderRadius: 'inherit' }} />
            )}
            <span className={`shiny-text ${variant === "outline" ? "relative !z-10 transition-colors duration-300 group-hover:text-white" : ""}`}>{children}</span>
          </a>
        ) : (
          <Link href={href} className={`shiny-cta group ${variant === "outline" ? "shiny-cta-outline" : ""} text-center inline-flex justify-center ${className}`} onClick={onClick}>
            {variant === "outline" && (
              <span className="absolute inset-0 !z-0 -translate-x-full bg-navy transition-transform duration-300 ease-in-out group-hover:translate-x-0" style={{ borderRadius: 'inherit' }} />
            )}
            <span className={`shiny-text ${variant === "outline" ? "relative !z-10 transition-colors duration-300 group-hover:text-white" : ""}`}>{children}</span>
          </Link>
        )
      ) : (
        <button type={type} disabled={disabled} className={`shiny-cta group ${variant === "outline" ? "shiny-cta-outline" : ""} ${className}`} onClick={onClick}>
          {variant === "outline" && (
            <span className="absolute inset-0 !z-0 -translate-x-full bg-navy transition-transform duration-300 ease-in-out group-hover:translate-x-0" style={{ borderRadius: 'inherit' }} />
          )}
          <span className={`shiny-text ${variant === "outline" ? "relative !z-10 transition-colors duration-300 group-hover:text-white" : ""}`}>{children}</span>
        </button>
      )}
    </>
  )
}
