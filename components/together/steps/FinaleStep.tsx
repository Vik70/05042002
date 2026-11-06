"use client";

import { useMemo } from "react";
import { Confetti } from "@/components/together/Confetti";
import { HoldFlame } from "@/components/together/HoldFlame";
import { Keepsake } from "@/components/together/Keepsake";
import { NextButton, StepIntro, type StepContext } from "@/components/together/parts";
import { summarise } from "@/lib/together/logic";
import type { Step } from "@/lib/together/types";

export function FinaleStep({ ctx, step }: { ctx: StepContext; step: Extract<Step, { kind: "finale" }> }) {
  const wished = ctx.me.answers[step.id] === true || ctx.partner.answers[step.id] === true;
  const summary = useMemo(
    () => summarise({ [ctx.seat]: ctx.me, [ctx.partnerSeat]: ctx.partner } as Parameters<typeof summarise>[0]),
    [ctx.seat, ctx.partnerSeat, ctx.me, ctx.partner],
  );

  if (!wished) {
    return (
      <div className="flex flex-col gap-8">
        <StepIntro title={step.title} prompt={step.prompt} />
        <HoldFlame ctx={ctx} id={step.id} label="Hold the flame together and wish" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <Confetti />
      <header className="animate-fade-up text-center">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.45em] text-[#ffcf8a]/80">all seven, lit</p>
        <h2 className="mt-3 bg-[linear-gradient(180deg,#fff6e0,#ffcf8a_55%,#ff9fb5)] bg-clip-text font-display text-6xl font-semibold italic leading-[0.95] text-transparent">
          Happy seven months
        </h2>
        <p className="mx-auto mt-4 max-w-sm font-hand text-[1.75rem] leading-tight text-[#fff1e6]/85">
          Bumpy start, smoother every month, and still smiling. Look at us.
        </p>
      </header>

      <Keepsake summary={summary} />

      <div className="pb-4">
        <p className="mb-4 text-center font-hand text-2xl text-[#fff1e6]/75">Get the paints out. One last thing…</p>
        <NextButton ctx={ctx} label="Blind portraits" />
      </div>
    </div>
  );
}
