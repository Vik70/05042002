"use client";

import { HoldFlame } from "@/components/together/HoldFlame";
import { NextButton, StepIntro, type StepContext } from "@/components/together/parts";
import type { Step } from "@/lib/together/types";

export function HoldStep({ ctx, step, index }: { ctx: StepContext; step: Extract<Step, { kind: "hold" }>; index: number }) {
  const lit = ctx.me.answers[step.id] === true || ctx.partner.answers[step.id] === true;
  return (
    <div className="flex flex-col gap-8">
      <StepIntro index={index} title={step.title} prompt={step.prompt} />
      <HoldFlame ctx={ctx} id={step.id} label="Press and hold the flame" />
      {lit ? (
        <div className="animate-fade-up space-y-6 text-center">
          <p className="font-hand text-3xl text-[#ffcf8a]">{step.done}</p>
          <NextButton ctx={ctx} />
        </div>
      ) : null}
    </div>
  );
}
