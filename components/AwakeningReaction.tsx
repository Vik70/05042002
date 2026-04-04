"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const PARTICLE_LAYOUT = [
  { dx: "-170px", dy: "-120px", delay: "0.02s", size: "10px" },
  { dx: "-120px", dy: "-175px", delay: "0.08s", size: "8px" },
  { dx: "-48px", dy: "-210px", delay: "0.14s", size: "12px" },
  { dx: "52px", dy: "-206px", delay: "0.18s", size: "9px" },
  { dx: "122px", dy: "-158px", delay: "0.22s", size: "11px" },
  { dx: "176px", dy: "-92px", delay: "0.26s", size: "8px" },
  { dx: "-188px", dy: "24px", delay: "0.12s", size: "9px" },
  { dx: "194px", dy: "32px", delay: "0.16s", size: "10px" },
  { dx: "-130px", dy: "142px", delay: "0.28s", size: "12px" },
  { dx: "-42px", dy: "192px", delay: "0.32s", size: "8px" },
  { dx: "44px", dy: "198px", delay: "0.36s", size: "10px" },
  { dx: "138px", dy: "148px", delay: "0.4s", size: "11px" },
];

const LANTERN_LAYOUT = [
  { left: "28%", delay: "0.25s" },
  { left: "41%", delay: "0.38s" },
  { left: "59%", delay: "0.5s" },
  { left: "72%", delay: "0.63s" },
];

const scalePx = (value: string, factor: number): string => `${Math.round(parseFloat(value) * factor)}px`;

export function AwakeningReaction({
  giftName,
  awakeningText,
  accentColor,
  onComplete,
}: {
  giftName: string;
  awakeningText: string;
  accentColor: string;
  onComplete: () => void;
}) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(onComplete, 2200);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [onComplete]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateCompact = () => {
      setIsCompact(mediaQuery.matches);
    };

    updateCompact();
    mediaQuery.addEventListener("change", updateCompact);
    return () => {
      mediaQuery.removeEventListener("change", updateCompact);
    };
  }, []);

  const particleLayout = useMemo(
    () =>
      isCompact
        ? PARTICLE_LAYOUT.map((particle) => ({
            ...particle,
            dx: scalePx(particle.dx, 0.6),
            dy: scalePx(particle.dy, 0.6),
          }))
        : PARTICLE_LAYOUT,
    [isCompact],
  );

  return (
    <button
      type="button"
      onClick={onComplete}
      className="absolute inset-0 overflow-hidden bg-black/72 text-left"
    >
      <div
        className="awakening-bloom absolute inset-0"
        style={{ color: accentColor } as CSSProperties}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,239,224,0.08),transparent_26%),linear-gradient(180deg,rgba(4,4,10,0.05),rgba(4,4,10,0.4))]" />

      {particleLayout.map((particle) => (
        <span
          key={`${particle.dx}-${particle.dy}`}
          className="awakening-particle"
          style={
            {
              color: accentColor,
              backgroundColor: accentColor,
              "--dx": particle.dx,
              "--dy": particle.dy,
              "--delay": particle.delay,
              "--size": particle.size,
            } as CSSProperties
          }
        />
      ))}

      <div className="absolute inset-x-0 bottom-16 md:bottom-24">
        {LANTERN_LAYOUT.map((lantern) => (
          <span
            key={lantern.left}
            className="awakening-lantern"
            style={
              {
                left: lantern.left,
                color: accentColor,
                "--delay": lantern.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center md:px-6">
        <div className="relative flex items-center justify-center">
          <span
            className="awakening-sigil"
            style={{ borderColor: `${accentColor}cc`, color: accentColor }}
          />
          <span
            className="awakening-sigil awakening-sigil-delay"
            style={{ borderColor: `${accentColor}7a`, color: accentColor }}
          />
          <span className="awakening-core" style={{ backgroundColor: accentColor }} />
        </div>

        <p className="mt-10 text-xs uppercase tracking-[0.32em] text-paper-cream/72">
          The Shrine Answers
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-paper-cream md:text-4xl lg:text-5xl">
          {giftName} Awakens
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-paper-cream/86 md:text-lg md:leading-8 lg:text-xl">
          {awakeningText}
        </p>
      </div>
    </button>
  );
}
