"use client";

import { SimbaAvatar } from "@/components/SimbaAvatar";
import type { GuidanceState } from "@/game/types/game";

export function ObjectiveBanner({
  guidance,
  portraitLayout = false,
  topOffsetPx = 0,
  stackBelowTopBar = false,
  visible = true,
}: {
  guidance: GuidanceState;
  portraitLayout?: boolean;
  topOffsetPx?: number;
  stackBelowTopBar?: boolean;
  visible?: boolean;
}) {
  if (!guidance.visible || !guidance.objectiveTitle) {
    return null;
  }

  if (portraitLayout) {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 z-40 px-3 transition-all duration-300 ${
          visible ? "opacity-100" : "-translate-y-1 opacity-0"
        }`}
        style={{
          top: `${topOffsetPx}px`,
          maxHeight: `max(0px, calc(var(--canvas-top, 0px) - ${topOffsetPx + 12}px))`,
        }}
      >
        <div
          className={`moonlit-frame w-full overflow-y-auto rounded-[22px] border border-white/10 px-4 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.26)] ${
            visible ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-sakura/80">Objective</p>
          <h2 className="mt-1 text-sm font-semibold text-paper-cream">{guidance.objectiveTitle}</h2>
          <p className="mt-1 text-sm leading-5 text-paper-cream/80">{guidance.objectiveText}</p>

          {guidance.simbaPrompt ? (
            <p className="mt-2 text-sm italic text-lantern-gold/88">{guidance.simbaPrompt}</p>
          ) : null}

          {guidance.controlsHint ? (
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-paper-cream/56">
              {guidance.controlsHint}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (stackBelowTopBar) {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 z-40 flex justify-center px-3 transition-all duration-300 md:px-4 ${
          visible ? "opacity-100" : "-translate-y-1 opacity-0"
        }`}
        style={{ top: `${topOffsetPx}px` }}
      >
        <div
          className={`moonlit-frame w-full max-w-3xl rounded-[18px] border border-white/10 px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.28)] ${
            visible ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-sakura/78">Current Objective</p>
          <h2 className="mt-1 truncate text-sm font-semibold text-paper-cream md:text-base">
            {guidance.objectiveTitle}
          </h2>
          {guidance.objectiveText ? (
            <p className="mt-1 truncate text-xs text-paper-cream/72 md:text-sm">{guidance.objectiveText}</p>
          ) : null}
          {guidance.controlsHint ? (
            <p className="mt-2 truncate text-[10px] uppercase tracking-[0.18em] text-paper-cream/50">
              {guidance.controlsHint}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 pt-safe transition-all duration-300 md:p-4 ${
        visible ? "opacity-100" : "-translate-y-1 opacity-0"
      }`}
    >
      <div
        className={`moonlit-frame w-full max-w-full rounded-[24px] border border-white/10 px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)] md:max-w-3xl md:px-5 ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-sakura/80">
          Current Objective
        </p>
        <h2 className="mt-2 text-base font-semibold text-paper-cream md:text-xl">
          {guidance.objectiveTitle}
        </h2>
        <p className="mt-2 text-sm leading-7 text-paper-cream/78 md:text-base">
          {guidance.objectiveText}
        </p>

        {guidance.simbaPrompt ? (
          <div className="mt-3 flex items-center gap-3">
            <SimbaAvatar className="h-10 w-10 shrink-0" />
            <p className="text-sm italic text-lantern-gold/88">{guidance.simbaPrompt}</p>
          </div>
        ) : null}

        {guidance.controlsHint ? (
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-paper-cream/54">
            {guidance.controlsHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
