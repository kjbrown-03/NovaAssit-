"use client";

import React, { useEffect, useMemo, useState } from "react";

type CardState = {
  number: string; // chiffres bruts, sans espaces
  holder: string; // en capitales
  month: string; // "01".."12" ou ""
  year: string; // "2025".."2034" ou ""
  cvv: string; // 4 au maximum
};

type CardValidity = {
  number: boolean;
  holder: boolean;
  month: boolean;
  year: boolean;
  cvv: boolean;
  allValid: boolean;
};

type Props = {
  defaultNumber?: string;
  defaultHolder?: string;
  defaultMonth?: string;
  defaultYear?: string;
  defaultCVV?: string;

  /** Masque les chiffres 5 à 12 par des * sur la face avant. */
  maskMiddle?: boolean;

  /** Couleurs des halos du fond de carte. */
  ring1?: string;
  ring2?: string;

  showSubmit?: boolean;
  /** Libellé du bouton quand tous les champs sont valides. */
  submitLabel?: string;
  onChange?: (state: CardState, validity: CardValidity) => void;
  onSubmit?: (state: CardState, validity: CardValidity) => void;

  className?: string;
};

function formatNumberSpaces(num: string): string {
  return num.replace(/\s+/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function clampDigits(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

/**
 * Saisie de carte bancaire avec aperçu animé.
 *
 * ⚠️ Aucune donnée de carte ne doit quitter le navigateur par vos propres
 * serveurs : collecter un PAN et un CVV soumet au PCI-DSS. Le `onSubmit` est
 * fourni pour piloter l'interface — pas pour transmettre ces champs à une API
 * maison. Un paiement réel passe par les champs hébergés du prestataire.
 */
const CreditCardForm = ({
  defaultNumber = "",
  defaultHolder = "",
  defaultMonth = "",
  defaultYear = "",
  defaultCVV = "",
  maskMiddle = true,
  ring1 = "#c9a227",
  ring2 = "#12294a",
  showSubmit = true,
  submitLabel = "Valider",
  onChange,
  onSubmit,
  className = "",
}: Props) => {
  const [number, setNumber] = useState(clampDigits(defaultNumber, 19));
  const [holder, setHolder] = useState(defaultHolder.toUpperCase());
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [cvv, setCVV] = useState(clampDigits(defaultCVV, 4));
  const [focusField, setFocusField] = useState<
    null | "number" | "holder" | "expire" | "cvv"
  >(null);

  const flip = focusField === "cvv";
  const years = useMemo(() => {
    const start = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => String(start + i));
  }, []);

  const validity: CardValidity = useMemo(() => {
    const numberValid = number.length >= 13;
    const holderValid = holder.trim().length >= 2;
    const monthValid = !!month && +month >= 1 && +month <= 12;
    const yearValid = !!year && +year >= new Date().getFullYear();
    const cvvValid = /^\d{3,4}$/.test(cvv);
    return {
      number: numberValid,
      holder: holderValid,
      month: monthValid,
      year: yearValid,
      cvv: cvvValid,
      allValid: numberValid && holderValid && monthValid && yearValid && cvvValid,
    };
  }, [number, holder, month, year, cvv]);

  useEffect(() => {
    onChange?.({ number, holder, month, year, cvv }, validity);
  }, [number, holder, month, year, cvv, validity, onChange]);

  const displayDigits = useMemo(() => number.slice(0, 16).split(""), [number]);

  const displayedSlots = useMemo(() => {
    const arr: { textTop: string; filed: boolean }[] = [];
    for (let i = 0; i < 16; i++) {
      let content = "#";
      if (i < displayDigits.length) {
        const d = displayDigits[i];
        const shouldMask = maskMiddle && i >= 4 && i <= 11;
        content = shouldMask ? "*" : d;
      }
      arr.push({ textTop: content, filed: i < displayDigits.length });
    }
    return arr;
  }, [displayDigits, maskMiddle]);

  const highlightClass = (() => {
    switch (focusField) {
      case "number":
        return "highlight__number";
      case "holder":
        return "highlight__holder";
      case "expire":
        return "highlight__expire";
      case "cvv":
        return "highlight__cvv";
      default:
        return "hidden";
    }
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ number, holder, month, year, cvv }, validity);
  };

  return (
    <section className={`ccp ${className}`}>
      <div className="wrap">
        <section id="card" className={`card ${flip ? "flip" : ""}`}>
          <div id="highlight" className={highlightClass} />

          {/* ------------------------------------------------------- recto */}
          <section
            className="card__front"
            style={{ ["--ring1" as string]: ring1, ["--ring2" as string]: ring2 }}
          >
            <div className="card__header">
              <div>Nova Assist</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40"
                width="60"
                viewBox="-96 -98.908 832 593.448"
                aria-hidden
              >
                <path fill="#ff5f00" d="M224.833 42.298h190.416v311.005H224.833z" />
                <path
                  d="M244.446 197.828a197.448 197.448 0 0175.54-155.475 197.777 197.777 0 100 311.004 197.448 197.448 0 01-75.54-155.53z"
                  fill="#eb001b"
                />
                <path
                  d="M621.101 320.394v-6.372h2.747v-1.319h-6.537v1.319h2.582v6.373zm12.691 0v-7.69h-1.978l-2.307 5.493-2.308-5.494h-1.977v7.691h1.428v-5.823l2.143 5h1.483l2.143-5v5.823z"
                  fill="#f79e1b"
                />
                <path
                  d="M640 197.828a197.777 197.777 0 01-320.015 155.474 197.777 197.777 0 000-311.004A197.777 197.777 0 01640 197.773z"
                  fill="#f79e1b"
                />
              </svg>
            </div>

            <div id="card_number" className="card__number" aria-hidden>
              {displayedSlots.map((slot, idx) => (
                <span key={idx} className="slot">
                  <span className={`digit ${slot.filed ? "filed" : ""}`}>
                    <span className="row placeholder">#</span>
                    <span className="row value">{slot.textTop}</span>
                  </span>
                </span>
              ))}
            </div>

            <div className="card__footer">
              <div className="card__holder">
                <div className="card__section__title">Titulaire</div>
                <div id="card_holder">{holder || "NOM SUR LA CARTE"}</div>
              </div>
              <div className="card__expires">
                <div className="card__section__title">Expire</div>
                <span id="card_expires_month">{month || "MM"}</span>/
                <span id="card_expires_year">{year ? year.slice(-2) : "AA"}</span>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- verso */}
          <section
            className="card__back"
            style={{ ["--ring1" as string]: ring1, ["--ring2" as string]: ring2 }}
          >
            <div className="card__hide_line" />
            <div className="card_cvv">
              <span>CVV</span>
              <div id="card_cvv_field" className="card_cvv_field">
                {"*".repeat(cvv.length)}
              </div>
            </div>
          </section>
        </section>

        {/* ------------------------------------------------------ formulaire */}
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="number">Numéro de carte</label>
            <input
              id="number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={formatNumberSpaces(number)}
              onChange={(e) => setNumber(clampDigits(e.target.value, 19))}
              onFocus={() => setFocusField("number")}
              onBlur={() => setFocusField(null)}
              aria-invalid={!validity.number}
            />
          </div>

          <div>
            <label htmlFor="holder">Titulaire</label>
            <input
              id="holder"
              type="text"
              autoComplete="cc-name"
              placeholder="NGO BASSONG"
              value={holder}
              onChange={(e) => setHolder(e.target.value.toUpperCase())}
              onFocus={() => setFocusField("holder")}
              onBlur={() => setFocusField(null)}
              aria-invalid={!validity.holder}
            />
          </div>

          <div className="filed__group">
            <div>
              <label htmlFor="expiration_month">Date d&apos;expiration</label>
              <div className="filed__date">
                <select
                  id="expiration_month"
                  aria-label="Mois d'expiration"
                  value={month || ""}
                  onChange={(e) => setMonth(e.target.value)}
                  onFocus={() => setFocusField("expire")}
                  onBlur={() => setFocusField(null)}
                  aria-invalid={!validity.month}
                >
                  <option value="" disabled>
                    Mois
                  </option>
                  {Array.from({ length: 12 }, (_, i) =>
                    String(i + 1).padStart(2, "0"),
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  id="expiration_year"
                  aria-label="Année d'expiration"
                  value={year || ""}
                  onChange={(e) => setYear(e.target.value)}
                  onFocus={() => setFocusField("expire")}
                  onBlur={() => setFocusField(null)}
                  aria-invalid={!validity.year}
                >
                  <option value="" disabled>
                    Année
                  </option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="***"
                value={cvv}
                onChange={(e) => setCVV(clampDigits(e.target.value, 4))}
                onFocus={() => setFocusField("cvv")}
                onBlur={() => setFocusField(null)}
                aria-invalid={!validity.cvv}
              />
            </div>
          </div>

          {showSubmit && (
            <button
              className="submit"
              type="submit"
              disabled={!validity.allValid}
              aria-disabled={!validity.allValid}
            >
              {validity.allValid ? submitLabel : "Complétez tous les champs"}
            </button>
          )}
        </form>
      </div>

      <style jsx>{`
        /* 100vw inclut la barre de défilement : sur une page qui défile, la
           largeur dépasse celle du conteneur et fait apparaître un défilement
           horizontal parasite. 100% s'aligne sur le parent. */
        .ccp {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .wrap {
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 920px) {
          .wrap {
            grid-template-columns: 1fr;
          }
        }

        #highlight {
          position: absolute;
          border: 1px solid #fff;
          border-radius: 12px;
          z-index: 1;
          width: 0;
          height: 0;
          top: 0;
          left: 0;
          box-shadow: 0 0 5px #fff;
          transition: 0.3s;
        }
        #highlight.highlight__number {
          width: 346px;
          height: 40px;
          top: 92px;
          left: 18px;
        }
        #highlight.highlight__holder {
          width: 264px;
          height: 56px;
          top: 156px;
          left: 18px;
        }
        #highlight.highlight__expire {
          width: 86px;
          height: 56px;
          top: 156px;
          left: 323px;
        }
        #highlight.highlight__cvv {
          width: 381px;
          height: 91px;
          top: 83px;
          left: 18px;
        }
        #highlight.hidden {
          display: none;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          transform-style: preserve-3d;
          transition: 0.8s;
          perspective: 1000px;
        }
        .card.flip {
          transform: rotateY(180deg);
        }

        .card__front,
        .card__back {
          width: 100%;
          max-width: 420px;
          height: 233px;
          border-radius: 20px;
          padding: 24px 30px 30px;
          background: linear-gradient(to right bottom, #12294a, #0b1f3a);
          box-shadow: 0 33px 50px -15px rgba(11, 31, 58, 0.5);
          color: #fff;
          overflow: hidden;
          margin: 0 auto;
          backface-visibility: hidden;
          position: relative;
        }

        @media (max-width: 450px) {
          .card__front,
          .card__back {
            padding: 12px 14px 16px;
            height: 206px;
          }
          #highlight.highlight__number {
            width: 300px;
            left: 14px;
          }
          #highlight.highlight__holder {
            width: 220px;
            left: 14px;
          }
          #highlight.highlight__expire {
            left: 280px;
          }
          #highlight.highlight__cvv {
            width: 330px;
            left: 14px;
          }
        }

        .card__back {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotateY(180deg);
          padding: 24px 0 0;
        }

        .card__front::before,
        .card__back::before {
          content: "";
          position: absolute;
          border: 16px solid var(--ring1);
          border-radius: 100%;
          left: -17%;
          top: -45px;
          height: 300px;
          width: 300px;
          filter: blur(13px);
        }

        .card__front::after,
        .card__back::after {
          content: "";
          position: absolute;
          border: 16px solid var(--ring2);
          border-radius: 100%;
          width: 300px;
          top: 55%;
          left: -200px;
          height: 300px;
          filter: blur(13px);
        }

        .card__hide_line {
          height: 40px;
          width: 100%;
          background-color: #0b1f3a;
          position: relative;
          z-index: 1;
        }

        .card_cvv {
          position: relative;
          z-index: 1;
          margin-top: 24px;
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          align-items: end;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .card_cvv_field {
          margin-top: 6px;
          background-color: #fff;
          border-radius: 12px;
          height: 44px;
          width: 100%;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: end;
          padding: 0 12px;
          font-size: 25px;
          line-height: 21px;
        }

        .card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: Georgia, serif;
          font-size: 18px;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }

        .card__number {
          font-size: 22px;
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
          display: flex;
          height: 33px;
          overflow: hidden;
          color: #fff;
        }

        .card__number .slot {
          display: inline-flex;
        }
        .card__number .slot:nth-child(4n) {
          margin-right: 10px;
        }
        .card__number .digit {
          display: flex;
          flex-direction: column;
          height: 33px;
          line-height: 33px;
          transition: transform 0.2s;
        }
        .card__number .digit.filed {
          transform: translateY(-33px);
        }
        .card__number .row {
          height: 33px;
          display: block;
        }

        .card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .card__holder {
          text-transform: uppercase;
        }
        .card__section__title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #c9a227;
        }

        .form {
          background: #fff;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          border: 1px solid #e2ddd1;
          display: grid;
          gap: 12px;
          color: #1f2937;
        }

        label {
          display: block;
          margin: 6px 0 4px;
          color: #0b1f3a;
          font-weight: 600;
          font-size: 15px;
        }

        input,
        select {
          height: 52px;
          display: block;
          width: 100%;
          border: 1px solid #e2ddd1;
          padding: 18px 20px;
          transition:
            border-color 200ms ease,
            box-shadow 200ms ease;
          outline: none;
          background-color: #fff;
          color: #0b1f3a;
          font-size: 16px;
        }

        input:focus,
        select:focus {
          border-color: #c9a227;
          outline: 3px solid rgba(201, 162, 39, 0.25);
        }

        select {
          padding: 0 20px;
        }

        .filed__group {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 560px) {
          .filed__group {
            grid-template-columns: 1fr;
          }
        }

        .filed__date {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .submit {
          margin-top: 8px;
          height: 48px;
          border: none;
          background: #0b1f3a;
          color: #fff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: opacity 200ms ease;
        }
        .submit:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
      `}</style>
    </section>
  );
};

export { CreditCardForm };
export type { CardState, CardValidity };
