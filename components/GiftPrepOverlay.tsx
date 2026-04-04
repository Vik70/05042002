"use client";

import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { GiftPrepState } from "@/game/types/game";

export function GiftPrepOverlay({
  prep,
  onContinue,
}: {
  prep: GiftPrepState;
  onContinue: () => void;
}) {
  if (!prep.visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 md:p-6">
      <div className="moonlit-frame max-h-[calc(100%-1rem)] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/10 px-4 py-5 pb-safe md:px-8 md:py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sakura/80 md:text-sm">{prep.eyebrow}</p>
        <h2 className="mt-3 text-xl font-semibold text-paper-cream md:text-4xl">{prep.title}</h2>
        <p className="mt-3 text-base italic text-paper-cream/80 md:text-xl">{prep.subtitle}</p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-paper-cream/78 md:text-base md:leading-8">
          {prep.description}
        </p>

        <div className="mt-6 rounded-[24px] border border-lantern-gold/18 bg-lantern-gold/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <SimbaAvatar className="h-12 w-12 shrink-0" />
            <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/58">Simba</p>
          </div>
          <p className="mt-3 text-base leading-7 text-paper-cream md:text-lg md:leading-8">{prep.simbaLine}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/8 bg-white/5 p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">
              How It Works
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-paper-cream/82">
              {prep.instructions.map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-lantern-gold" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-sky-300/15 bg-sky-300/8 p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">
                Before You Continue
              </p>
              <p className="mt-3 text-base leading-7 text-paper-cream md:text-lg md:leading-8">{prep.focusText}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-lantern-gold/90">
                {prep.focusLabel}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/5 p-4 md:p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">
                Controls
              </p>
              <p className="mt-3 text-sm leading-7 text-paper-cream/82">{prep.controlsHint}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold px-6 py-3 font-semibold text-text-ink transition hover:scale-[1.02] sm:w-auto"
          >
            {prep.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
