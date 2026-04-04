"use client";

import type { GuidanceState } from "@/game/types/game";

export function TutorialPrompt({
  guidance,
  portraitLayout = false,
}: {
  guidance: GuidanceState;
  portraitLayout?: boolean;
}) {
  if (!guidance.visible || !guidance.tutorialText) {
    return null;
  }

  if (portraitLayout) {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-40 px-3 pb-safe"
        style={{
          top: "calc(var(--canvas-bottom, 100%) + 12px)",
          maxHeight:
            "max(0px, calc(100% - var(--canvas-bottom, 100%) - 24px - env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <div className="overflow-y-auto rounded-[22px] border border-lantern-gold/20 bg-black/45 px-4 py-3 text-paper-cream shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur">
          {guidance.tutorialTitle ? (
            <p className="text-[10px] uppercase tracking-[0.24em] text-lantern-gold/85">
              {guidance.tutorialTitle}
            </p>
          ) : null}
          <p className="mt-1 text-sm leading-5 text-paper-cream/86">{guidance.tutorialText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] pb-safe md:right-5 md:bottom-5 md:max-w-sm">
      <div className="rounded-[22px] border border-lantern-gold/20 bg-black/45 px-4 py-4 text-paper-cream shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur">
        {guidance.tutorialTitle ? (
          <p className="text-[11px] uppercase tracking-[0.28em] text-lantern-gold/85">
            {guidance.tutorialTitle}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-7 text-paper-cream/86">
          {guidance.tutorialText}
        </p>
      </div>
    </div>
  );
}
