"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { DialogueLine } from "@/game/types/game";
import { useIsTouchDevice } from "@/lib/hooks";

interface DialogueBoxProps {
  line: DialogueLine;
  index: number;
  total: number;
  onRetreat: () => void;
  onAdvance: () => void;
}

export function DialogueBox({
  line,
  index,
  total,
  onRetreat,
  onAdvance,
}: DialogueBoxProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const isTouchDevice = useIsTouchDevice();

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

  const displayedText = useMemo(
    () => line.text.slice(0, visibleChars),
    [line.text, visibleChars],
  );
  const isComplete = visibleChars >= line.text.length;
  const isSimba = line.portrait === "simba" || line.speaker === "Simba";
  const hasPrevious = index > 0;

  const handleAdvance = useCallback(() => {
    if (!isComplete) {
      setVisibleChars(line.text.length);
      return;
    }

    onAdvance();
  }, [isComplete, line.text.length, onAdvance]);

  const handleRetreat = useCallback(() => {
    if (!hasPrevious) {
      return;
    }

    onRetreat();
  }, [hasPrevious, onRetreat]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft") {
        event.preventDefault();
        handleRetreat();
        return;
      }

      if (event.code === "ArrowRight" || event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleAdvance, handleRetreat]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-safe md:p-6">
      <div className="moonlit-frame pointer-events-auto flex max-h-[calc(100%-1.5rem)] w-full max-w-full flex-col gap-4 overflow-y-auto rounded-[28px] border border-white/10 px-4 py-4 md:max-w-5xl md:flex-row md:gap-5 md:px-6 md:py-5">
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-lantern-gold/30 bg-lantern-gold/10 text-lg font-semibold text-lantern-gold shadow-[0_0_30px_rgba(245,197,66,0.18)] md:h-24 md:w-24 md:text-xl">
              {isSimba ? (
                <SimbaAvatar className="h-14 w-14 md:h-20 md:w-20" />
              ) : (
                line.speaker.slice(0, 1)
              )}
            </div>

            <div className="md:hidden">
              <p className="text-xs uppercase tracking-[0.28em] text-sakura/80">
                {isSimba ? "Warm Guide" : "Speaker"}
              </p>
              <h2 className="text-lg font-semibold text-paper-cream">{line.speaker}</h2>
            </div>
          </div>

          <p className="text-sm text-paper-cream/60 md:hidden">
            {index + 1} / {total}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 hidden items-center justify-between gap-4 md:flex">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sakura/80">
                {isSimba ? "Warm Guide" : "Speaker"}
              </p>
              <h2 className="text-2xl font-semibold text-paper-cream">{line.speaker}</h2>
            </div>
            <p className="text-sm text-paper-cream/60">
              {index + 1} / {total}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdvance}
            className="w-full rounded-[22px] border border-white/8 bg-white/4 px-4 py-4 text-left text-base leading-7 text-paper-cream/92 md:px-5 md:py-5 md:text-lg md:leading-8"
          >
            {displayedText}
            {!isComplete ? <span className="ml-1 inline-block h-5 w-px animate-pulse bg-paper-cream/80 align-middle" /> : null}
          </button>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <p className="text-sm text-paper-cream/60">
              {isTouchDevice
                ? "Tap the text or use the arrows."
                : "Click the text or use the arrow keys."}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Previous dialogue line"
                onClick={handleRetreat}
                disabled={!hasPrevious}
                className="h-9 w-9 rounded-full border border-paper-cream/15 text-sm text-paper-cream/80 transition hover:border-paper-cream/35 hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-35"
              >
                &lt;
              </button>
              <button
                type="button"
                aria-label="Next dialogue line"
                onClick={handleAdvance}
                className="h-9 w-9 rounded-full border border-paper-cream/15 text-sm text-paper-cream/80 transition hover:border-paper-cream/35 hover:bg-white/6"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
