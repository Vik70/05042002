"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { DialogueLine, TrialResult } from "@/game/types/game";
import { useIsTouchDevice } from "@/lib/hooks";

const FALLBACK_REFLECTION = (result: TrialResult): DialogueLine[] => [
  {
    speaker: "Simba",
    text: result.simbaLine,
    portrait: "simba",
  },
];

export function SimbaDialoguePanel({
  result,
  accentColor,
  onContinue,
}: {
  result: TrialResult;
  accentColor: string;
  onContinue: () => void;
}) {
  const isTouchDevice = useIsTouchDevice();
  const lines = useMemo(
    () => (result.simbaReflection.length > 0 ? result.simbaReflection : FALLBACK_REFLECTION(result)),
    [result],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  const line = lines[lineIndex] ?? lines[0];
  const isComplete = visibleChars >= line.text.length;
  const isFinalLine = lineIndex >= lines.length - 1;

  useEffect(() => {
    setLineIndex(0);
    setVisibleChars(0);
  }, [lines]);

  useEffect(() => {
    setVisibleChars(0);
    const interval = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= line.text.length) {
          window.clearInterval(interval);
          return current;
        }

        return current + 1;
      });
    }, 18);

    return () => {
      window.clearInterval(interval);
    };
  }, [line]);

  const handleAdvance = useCallback(() => {
    if (!isComplete) {
      setVisibleChars(line.text.length);
      return;
    }

    if (!isFinalLine) {
      setLineIndex((current) => current + 1);
    }
  }, [isComplete, isFinalLine, line.text.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (isFinalLine && isComplete) {
          onContinue();
          return;
        }

        handleAdvance();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleAdvance, isComplete, isFinalLine, onContinue]);

  return (
    <div className="absolute inset-0 flex items-end justify-center p-3 pb-safe md:p-6">
      <div
        className="moonlit-frame w-full max-w-full rounded-[30px] border px-4 py-4 shadow-[0_34px_110px_rgba(0,0,0,0.48)] md:max-w-5xl md:px-7 md:py-6"
        style={{ borderColor: `${accentColor}44` }}
      >
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="flex w-full shrink-0 items-center gap-4 md:w-[240px] md:flex-col md:items-start">
            <div
              className="rounded-full border p-2 shadow-[0_0_40px_rgba(245,197,66,0.18)]"
              style={{ borderColor: `${accentColor}55`, backgroundColor: `${accentColor}12` }}
            >
              <SimbaAvatar className="h-14 w-14 md:h-20 md:w-20" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-paper-cream/58">
                Simba&apos;s Reflection
              </p>
              <h2 className="mt-2 text-xl font-semibold text-paper-cream md:text-2xl">Simba</h2>
              <p className="mt-2 text-sm text-paper-cream/58">
                {lineIndex + 1} / {lines.length}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handleAdvance}
              className="w-full rounded-[26px] border border-white/8 bg-white/5 px-4 py-4 text-left text-base leading-7 text-paper-cream/92 md:px-5 md:py-5 md:text-lg md:leading-8"
            >
              {line.text.slice(0, visibleChars)}
              {!isComplete ? (
                <span className="ml-1 inline-block h-5 w-px animate-pulse bg-paper-cream/80 align-middle" />
              ) : null}
            </button>

            {isFinalLine && isComplete ? (
              <>
                <div className="mt-5 rounded-[24px] border border-white/8 bg-white/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.26em] text-paper-cream/55">Next</p>
                  <p className="mt-2 text-base leading-7 text-paper-cream/82 md:text-lg md:leading-8">
                    {result.subtitle}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                  <p className="text-sm text-paper-cream/56">
                    {isTouchDevice ? "Tap the button below to continue." : "Press Space or Enter, or use the button below."}
                  </p>
                  <button
                    type="button"
                    onClick={onContinue}
                    className="w-full rounded-full border border-lantern-gold/60 bg-lantern-gold px-6 py-3 font-semibold text-text-ink transition hover:scale-[1.02] sm:w-auto"
                  >
                    {result.ctaLabel}
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-paper-cream/56">
                {isTouchDevice ? "Tap to continue with Simba." : "Click, Space, or Enter to continue with Simba."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
