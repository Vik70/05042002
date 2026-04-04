"use client";

import type { TrialResult } from "@/game/types/game";
import { useIsTouchDevice } from "@/lib/hooks";

export function GiftRevealCard({
  result,
  accentColor,
  onContinue,
}: {
  result: TrialResult;
  accentColor: string;
  onContinue: () => void;
}) {
  const isTouchDevice = useIsTouchDevice();

  return (
    <button
      type="button"
      onClick={onContinue}
      className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4 text-left md:p-6"
    >
      <div
        className="moonlit-frame max-h-[calc(100%-2rem)] w-full max-w-3xl overflow-y-auto rounded-[32px] border px-4 py-5 shadow-[0_34px_110px_rgba(0,0,0,0.48)] md:px-8 md:py-8"
        style={{ borderColor: `${accentColor}44` }}
      >
        <p className="text-xs uppercase tracking-[0.32em] text-paper-cream/62">Gift Awakened</p>
        <h2 className="mt-4 text-3xl font-semibold text-paper-cream md:text-5xl">{result.giftName}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-paper-cream/82 md:text-xl">
          {result.giftMeaning}
        </p>

        <div
          className="mt-7 rounded-[26px] border px-4 py-4 md:px-6 md:py-6"
          style={{
            borderColor: `${accentColor}33`,
            backgroundColor: `${accentColor}12`,
          }}
        >
          <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">
            What The Shrine Saw
          </p>
          <p className="mt-3 text-lg leading-8 text-paper-cream/88">{result.awakeningSummary}</p>
        </div>

        <p className="mt-6 text-sm text-paper-cream/56">
          {isTouchDevice ? "Tap to let Simba tell you why it matters." : "Click to let Simba tell you why it matters."}
        </p>
      </div>
    </button>
  );
}
